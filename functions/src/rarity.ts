import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

export type TeacherRarity = "common" | "rare" | "epic" | "mythic" | "legendary" | "iconic";

/**
 * Derives a rarity level from a normalised average rating (0–1).
 */
export const calculateRarityFromAverage = (avg: number): TeacherRarity => {
    if (avg >= 0.9) return "legendary";
    if (avg >= 0.75) return "mythic";
    if (avg > 0.4) return "epic";
    if (avg >= 0.25) return "rare";
    return "common";
};

/**
 * Enforces global rarity limits on an array of teachers.
 * Rarity is derived from each teacher's avg_rating (if present) or their pre-assigned rarity,
 * and then demoted when a limit for that level is reached.
 */
export const applyRarityLimits = (
    teachers: { id: string, avg_rating?: number, rarity?: TeacherRarity }[],
    rarityLimits: Record<string, number>
): Map<string, TeacherRarity> => {
    const counts: Record<TeacherRarity, number> = { iconic: 0, legendary: 0, mythic: 0, epic: 0, rare: 0, common: 0 };
    const raritiesMap = new Map<string, TeacherRarity>();

    // Hierarchy for demotion
    const hierarchy: TeacherRarity[] = ["iconic", "legendary", "mythic", "epic", "rare", "common"];

    for (const t of teachers) {
        let assignedRarity: TeacherRarity =
            t.avg_rating !== undefined
                ? calculateRarityFromAverage(t.avg_rating)
                : (t.rarity ?? "common");

        // Find the correct level in the hierarchy if limit is reached
        let hierarchyIdx = hierarchy.indexOf(assignedRarity);
        while (hierarchyIdx < hierarchy.length - 1) {
            const currentLevel = hierarchy[hierarchyIdx];
            const limit = rarityLimits[currentLevel as string];
            
            if (limit !== undefined && counts[currentLevel] >= limit) {
                // Demote
                hierarchyIdx++;
                assignedRarity = hierarchy[hierarchyIdx];
            } else {
                break;
            }
        }

        raritiesMap.set(t.id, assignedRarity);
        counts[assignedRarity]++;
    }

    return raritiesMap;
};
