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

const calculateRarityFromAverage = (avgRating: number): TeacherRarity => {
    if (avgRating >= 0.85) return "legendary";
    if (avgRating >= 0.65) return "mythic";
    if (avgRating >= 0.4) return "epic";
    if (avgRating >= 0.15) return "rare";
    return "common";
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

    const teacherRatings = await db.collection("teacher_ratings").where("teacherId", "==", teacherId).get();

    if (teacherRatings.empty) {
        return;
    }

    let totalRating = 0;
    teacherRatings.forEach((doc) => {
        const rating = doc.data().rating;
        if (typeof rating === "number") {
            totalRating += rating;
        }
    });

    const avgRating = totalRating / teacherRatings.size;
    const rarity = calculateRarityFromAverage(avgRating);

    const teacherRef = db.collection("teachers").doc(teacherId);
    const teacherDoc = await teacherRef.get();
    const teacherName = teacherDoc.data()?.name || ratingData?.teacherName || teacherId;

    try {
        await teacherRef.set({
            name: teacherName,
            avg_rating: avgRating,
            vote_count: teacherRatings.size,
            rarity,
        }, { merge: true });

        console.log(`Updated teacher ${teacherId} with rarity ${rarity} and average rating ${avgRating}`);
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

    const avgRating = typeof teacherData.avg_rating === "number" ? teacherData.avg_rating : 0;
    const rarity = calculateRarityFromAverage(avgRating);

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
