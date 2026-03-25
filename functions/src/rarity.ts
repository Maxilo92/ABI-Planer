import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

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
 * Adjusting mythic/legendary thresholds to balance pack chances.
 * Legendary: 0.85 -> 0.9
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
    const db = admin.firestore();
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
    const db = admin.firestore();
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
