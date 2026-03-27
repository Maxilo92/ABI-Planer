import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

type TeacherRarity = "common" | "rare" | "epic" | "mythic" | "legendary";

type LootTeacher = {
    id: string;
    name: string;
    rarity: TeacherRarity;
};

/**
 * Cloud Function to securely vote for a teacher's rarity.
 * Awards booster packs at certain milestones (1st, 5th, 15th, 25th...).
 */
export const voteForTeacher = onCall({
    region: "europe-west3",
    maxInstances: 10,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { teacherId, rating, teacherName } = request.data;

    if (!teacherId || typeof rating !== "number") {
        throw new HttpsError("invalid-argument", "Missing teacherId or rating.");
    }

    const db = getFirestore("abi-data");
    const uid = request.auth.uid;
    const voteId = `${uid}_${teacherId}`;

    const profileRef = db.collection("profiles").doc(uid);
    const ratingRef = db.collection("teacher_ratings").doc(voteId);
    const settingsRef = db.collection("settings").doc("global");

    try {
        const result = await db.runTransaction(async (transaction) => {
            const [profileSnap, ratingSnap, settingsSnap] = await Promise.all([
                transaction.get(profileRef),
                transaction.get(ratingRef),
                transaction.get(settingsRef)
            ]);

            if (!profileSnap.exists) {
                throw new HttpsError("not-found", "User profile not found.");
            }

            if (ratingSnap.exists) {
                throw new HttpsError("already-exists", "User has already voted for this teacher.");
            }

            const settingsData = settingsSnap.data() || {};
            const lootTeachers = (settingsData.loot_teachers || []) as LootTeacher[];
            const isCandidate = lootTeachers.some((t) => t.id === teacherId);

            if (!isCandidate) {
                throw new HttpsError("invalid-argument", "Teacher is not a valid voting candidate.");
            }

            const profileData = profileSnap.data() || {};
            const ratedTeachers = (profileData.rated_teachers || []) as string[];
            const newRatedCount = ratedTeachers.length + 1;

            // Reward Logic: 1st, 5th, then every 10th (15, 25, 35...)
            let awardPack = false;
            if (newRatedCount === 1) awardPack = true;
            else if (newRatedCount === 5) awardPack = true;
            else if (newRatedCount > 5 && (newRatedCount - 5) % 10 === 0) awardPack = true;

            const profileUpdate: any = {
                rated_teachers: FieldValue.arrayUnion(teacherId)
            };

            if (awardPack) {
                profileUpdate["booster_stats.extra_available"] = FieldValue.increment(1);
            }

            // Update profile
            transaction.update(profileRef, profileUpdate);

            // Save individual rating
            transaction.set(ratingRef, {
                userId: uid,
                teacherId: teacherId,
                teacherName: teacherName || null,
                rating: rating,
                created_at: new Date().toISOString()
            });

            // Log entry
            const logRef = db.collection("logs").doc();
            transaction.set(logRef, {
                user_id: uid,
                user_name: profileData.full_name || "Unknown",
                action: "TEACHER_VOTE",
                details: {
                    teacher_id: teacherId,
                    teacher_name: teacherName || teacherId,
                    rating: rating,
                    awarded_pack: awardPack
                },
                timestamp: FieldValue.serverTimestamp()
            });

            return { success: true, awardedPack: awardPack };
        });

        return result;
    } catch (error: any) {
        logger.error("Error in voteForTeacher:", {
            uid,
            teacherId,
            error: error.message
        });
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Internal server error during voting.");
    }
});

/**
 * Adjusting mythic/legendary thresholds to balance pack chances.
...
 * Mythic: 0.65 -> 0.75
 * Epic: 0.4 -> 0.5
 * Rare: 0.15 -> 0.25
 */
export const calculateRarityFromAverage = (avgRating: number): TeacherRarity => {
    if (avgRating >= 0.9) return "legendary";
    if (avgRating >= 0.75) return "mythic";
    if (avgRating >= 0.5) return "epic";
    if (avgRating >= 0.25) return "rare";
    return "common";
};

/**
 * Applies global rarity limits to a sorted list of teachers.
 * Teachers should be sorted by avg_rating descending.
 */
export const applyRarityLimits = (
    teachers: { id: string, avg_rating?: number }[],
    rarityLimits: Record<string, number>
): Map<string, TeacherRarity> => {
    const counts: Record<TeacherRarity, number> = { legendary: 0, mythic: 0, epic: 0, rare: 0, common: 0 };
    const raritiesMap = new Map<string, TeacherRarity>();

    for (const t of teachers) {
        let assignedRarity = calculateRarityFromAverage(t.avg_rating || 0);

        // Enforce limits: if limit reached, demote to next lower rarity
        if (assignedRarity === "legendary" && rarityLimits.legendary !== undefined && counts.legendary >= rarityLimits.legendary) {
            assignedRarity = "mythic";
        }
        if (assignedRarity === "mythic" && rarityLimits.mythic !== undefined && counts.mythic >= rarityLimits.mythic) {
            assignedRarity = "epic";
        }
        if (assignedRarity === "epic" && rarityLimits.epic !== undefined && counts.epic >= rarityLimits.epic) {
            assignedRarity = "rare";
        }
        if (assignedRarity === "rare" && rarityLimits.rare !== undefined && counts.rare >= rarityLimits.rare) {
            assignedRarity = "common";
        }

        raritiesMap.set(t.id, assignedRarity);
        counts[assignedRarity]++;
    }

    return raritiesMap;
};

export const calculateTeacherRarity = onDocumentWritten({
    document: "teacher_ratings/{ratingId}",
    database: "abi-data",
    region: "europe-west3",
}, async (event) => {
    const db = getFirestore("abi-data");
    const ratingData = event.data?.after.data();
    const teacherId = ratingData?.teacherId;

    if (!teacherId) {
        console.error("Teacher ID not found on rating document.");
        return;
    }

    // 1. Calculate new average for the triggered teacher
    const teacherRatings = await db.collection("teacher_ratings").where("teacherId", "==", teacherId).get();
    if (teacherRatings.empty) return;

    let totalRating = 0;
    teacherRatings.forEach((doc) => {
        const rating = doc.data().rating;
        if (typeof rating === "number") {
            totalRating += rating;
        }
    });
    const newAvgRating = totalRating / teacherRatings.size;

    // 2. Fetch all teachers and rarity limits to apply global balancing
    const [allTeachersSnap, settingsSnap] = await Promise.all([
        db.collection("teachers").get(),
        db.collection("settings").doc("global").get()
    ]);

    const rarityLimits = (settingsSnap.data()?.rarity_limits || {}) as Record<TeacherRarity, number>;
    
    type TeacherEntry = { id: string, name?: string, avg_rating?: number, vote_count?: number };

    // Map current teachers and update the triggered one with its fresh average
    const teachersList: TeacherEntry[] = allTeachersSnap.docs.map(doc => {
        const data = doc.data();
        if (doc.id === teacherId) {
            return { id: doc.id, ...data, avg_rating: newAvgRating, vote_count: teacherRatings.size };
        }
        return { id: doc.id, ...data };
    });

    // If the triggered teacher wasn't in the collection yet, add it
    if (!teachersList.find(t => t.id === teacherId)) {
        teachersList.push({ 
            id: teacherId, 
            name: (ratingData?.teacherName as string | undefined) || teacherId, 
            avg_rating: newAvgRating, 
            vote_count: teacherRatings.size 
        });
    }

    // 3. Sort by rating descending to apply limits
    teachersList.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

    // 4. Assign rarities based on thresholds AND count-based limits
    const raritiesMap = applyRarityLimits(teachersList, rarityLimits);

    // 5. Update the triggered teacher and any others that might have shifted
    // To be efficient, we only update the one that triggered, but we use the globally balanced rarity
    const finalRarity = raritiesMap.get(teacherId) || "common";
    const teacherRef = db.collection("teachers").doc(teacherId);
    const teacherDoc = await teacherRef.get();
    const teacherName = teacherDoc.data()?.name || ratingData?.teacherName || teacherId;

    try {
        await teacherRef.set({
            name: teacherName,
            avg_rating: newAvgRating,
            vote_count: teacherRatings.size,
            rarity: finalRarity,
        }, { merge: true });

        console.log(`Updated teacher ${teacherId} with balanced rarity ${finalRarity} (avg: ${newAvgRating})`);
        
        // Note: In a high-traffic environment, you might want a separate cron job 
        // to re-sync all rarities if one teacher's rating change pushes others out of their rarity slots.
        // For now, updating the current one is enough to eventually converge.
    } catch (error) {
        console.error(`Failed to update teacher ${teacherId}:`, error);
    }
});

export const syncLootTeacherRarity = onDocumentWritten({
    document: "teachers/{teacherId}",
    database: "abi-data",
    region: "europe-west3",
}, async (event) => {
    const db = getFirestore("abi-data");
    const teacherId = event.params.teacherId;
    const teacherData = event.data?.after.data();

    if (!teacherData) {
        return;
    }

    // We use the rarity already calculated and stored in the teacher document
    const rarity = teacherData.rarity as TeacherRarity || "common";
    const settingsRef = db.collection("settings").doc("global");

    await db.runTransaction(async (transaction) => {
        const settingsDoc = await transaction.get(settingsRef);
        if (!settingsDoc.exists) {
            return;
        }

        const settingsData = settingsDoc.data() as { loot_teachers?: LootTeacher[] };
        const lootTeachers = Array.isArray(settingsData.loot_teachers) ? settingsData.loot_teachers : [];
        const index = lootTeachers.findIndex((entry) => entry.id === teacherId);

        if (index === -1) {
            return;
        }

        const current = lootTeachers[index];
        const teacherName = typeof teacherData.name === "string" && teacherData.name.trim().length > 0
            ? teacherData.name
            : current.name;

        if (current.rarity === rarity && current.name === teacherName) {
            return;
        }

        const updated = [...lootTeachers];
        updated[index] = {
            ...current,
            name: teacherName,
            rarity,
        };

        transaction.update(settingsRef, { loot_teachers: updated });
    });
});
