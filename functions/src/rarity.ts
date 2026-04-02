import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

export type TeacherRarity = "common" | "rare" | "epic" | "mythic" | "legendary" | "iconic";

/**
 * Enforces global rarity limits on an array of teachers based on their manually assigned rarity.
 * Since we no longer have a ranking metric like avg_rating, this is a simplified safety check.
 */
export const applyRarityLimits = (
    teachers: { id: string, rarity: TeacherRarity }[],
    rarityLimits: Record<string, number>
): Map<string, TeacherRarity> => {
    const counts: Record<TeacherRarity, number> = { iconic: 0, legendary: 0, mythic: 0, epic: 0, rare: 0, common: 0 };
    const raritiesMap = new Map<string, TeacherRarity>();

    // Hierarchy for demotion
    const hierarchy: TeacherRarity[] = ["iconic", "legendary", "mythic", "epic", "rare", "common"];

    for (const t of teachers) {
        let assignedRarity = t.rarity;

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
