import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const isAdminRole = (role: unknown): boolean => {
  return role === "admin" || role === "admin_main" || role === "admin_co";
};

interface UserCards {
  [teacherId: string]: {
    count: number;
    variants?: Record<string, number>;
  };
}

interface RemovedCard {
  teacherId: string;
  teacherName: string;
  rarity: string;
  variants: Record<string, number>;
  totalRemoved: number;
  duplicates: number;
  compensationPacks: number;
}

interface RemovalDetail {
  userId: string;
  teacherId: string;
  cardsRemoved: number;
  duplicates: number;
  compensationPacks: number;
  rarity?: string;
  variants?: Record<string, number>;
}

/**
 * Removes all cards of a specific teacher from a user's album and calculates compensation.
 * Compensation = Math.ceil(total_removed_cards_for_user / 3)
 * 
 * Also checks if the teacher's rarity matches the current config and removes if not.
 * 
 * If dryRun=true, returns preview without making changes.
 */
export const removeTeacherCards = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const db = getFirestore("abi-data");
  const callerProfileRef = db.collection("profiles").doc(request.auth.uid);
  const callerProfileDoc = await callerProfileRef.get();

  if (!isAdminRole(callerProfileDoc.data()?.role)) {
    throw new HttpsError(
      "permission-denied",
      "Must be an administrative user to call this function."
    );
  }

  const { teacherId, dryRun, compensate = true } = request.data;

  if (!teacherId || typeof teacherId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "teacherId is required and must be a string."
    );
  }

  try {
    const settingsRef = db.collection("settings").doc("sammelkarten");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      throw new HttpsError("not-found", "Sammelkarten settings not found.");
    }

    const settings = settingsSnap.data() as any;
    const lootTeachers = settings.loot_teachers || [];
    const teacher = lootTeachers.find((t: any) => t.id === teacherId);

    if (!teacher) {
      throw new HttpsError(
        "not-found",
        `Teacher with id ${teacherId} not found in pool.`
      );
    }

    // Get all user inventories
    const inventoriesSnap = await db.collection("user_teachers").get();


    const removalDetails: RemovalDetail[] = [];
    let totalUsersAffected = 0;
    let totalCardsRemoved = 0;
    let totalCompensation = 0;

    const batch = db.batch();

    for (const docSnap of inventoriesSnap.docs) {
      const userId = docSnap.id;
      const userCards = docSnap.data() as UserCards;

      if (userCards[teacherId]) {
        const cardsRemoved = userCards[teacherId].count;
        const compensationPacks = compensate ? Math.ceil(cardsRemoved / 3) : 0;
        const variants = userCards[teacherId].variants || {};

        totalUsersAffected++;
        totalCardsRemoved += cardsRemoved;
        totalCompensation += compensationPacks;

        removalDetails.push({
          userId,
          teacherId,
          cardsRemoved,
          duplicates: cardsRemoved,
          compensationPacks,
          rarity: teacher.rarity,
          variants,
        });

        if (!dryRun) {
          // Remove cards from inventory
          const updatedCards = { ...userCards };
          delete updatedCards[teacherId];
          batch.set(db.collection("user_teachers").doc(userId), updatedCards);

          // Add compensation - only if enabled and there are packs to compensate
          if (compensationPacks > 0) {
            const profileRef = db.collection("profiles").doc(userId);
            // set(..., { merge: true }) avoids batch aborts when stale user_teachers docs
            // exist without a corresponding profile document.
            batch.set(profileRef, {
              booster_stats: {
                extra_available: admin.firestore.FieldValue.increment(compensationPacks),
              },
            }, { merge: true });
          }

          // Create notification for user
          const notificationId = db.collection("notifications").doc().id;
          const notificationRef = db.collection("notifications").doc(userId).collection("messages").doc(notificationId);
          
          const variantSummary = Object.entries(variants)
            .map(([variant, count]) => `${count}x ${variant}`)
            .join(", ");

          batch.set(notificationRef, {
            id: notificationId,
            userId,
            type: "card_removal",
            title: `Sammlung bereinigt: ${teacher.name} entfernt`,
            message: `Alle Karten von "${teacher.name}" (${teacher.rarity}) wurden aus deiner Sammlung entfernt. Du hattest: ${variantSummary}.${compensationPacks > 0 ? ` Du erhältst ${compensationPacks} Booster als Entschädigung.` : ''}`,
            timestamp: new Date(),
            removedCards: [{
              teacherId,
              teacherName: teacher.name,
              rarity: teacher.rarity,
              variants,
              totalRemoved: cardsRemoved,
              duplicateCount: cardsRemoved,
            }],
            boosterCompensation: {
              amount: compensationPacks,
              reason: compensationPacks > 0
                ? `Entschädigung auf Basis von ${cardsRemoved} entfernten Karten (1 Booster pro 3 Karten, aufgerundet)`
                : "Keine Entschädigung aktiviert",
            },
            read: false,
          });
        }
      }
    }

    if (!dryRun) {
      await batch.commit();
    }

    // Log the action
    const adminName = callerProfileDoc.data()?.full_name || "Unknown Admin";
    const logMessage = `Removed all cards of teacher "${teacher.name}" (${teacherId}) from ${totalUsersAffected} users. ${totalCardsRemoved} cards removed.${compensate ? ` ${totalCompensation} packs distributed as compensation.` : " Compensation disabled."}`;

    if (!dryRun) {
      await db.collection("logs").add({
        type: "ADMIN_ACTION",
        action: "REMOVE_TEACHER_CARDS",
        user_id: request.auth.uid,
        user_name: adminName,
        timestamp: new Date(),
        teacher_id: teacherId,
        teacher_name: teacher.name,
        details: logMessage,
        removal_log: removalDetails,
        stats: {
          users_affected: totalUsersAffected,
          cards_removed: totalCardsRemoved,
          compensation_packs: totalCompensation,
          compensation_enabled: Boolean(compensate),
        },
      });

      logger.info("removeTeacherCards completed", {
        teacherId,
        usersAffected: totalUsersAffected,
        cardsRemoved: totalCardsRemoved,
        compensationPacks: totalCompensation,
      });
    }

    return {
      success: true,
      message: logMessage,
      dryRun: Boolean(dryRun),
      stats: {
        usersAffected: totalUsersAffected,
        cardsRemoved: totalCardsRemoved,
        compensationPacks: totalCompensation,
        details: removalDetails,
      },
    };
  } catch (error: any) {
    logger.error("removeTeacherCards failed", { error });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "internal",
      `removeTeacherCards failed: ${error?.message || "unknown error"}`
    );
  }
});

/**
 * Validates and fixes rarity mismatches for all teachers across all user albums.
 * If a teacher exists in the config with a different rarity than what the user has,
 * removes the cards and provides compensation.
 * 
 * If dryRun=true, returns preview without making changes.
 * 
 * This is like "runGlobalRaritySync" but for individual user albums.
 */
export const validateAndFixRarities = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const db = getFirestore("abi-data");
  const callerProfileRef = db.collection("profiles").doc(request.auth.uid);
  const callerProfileDoc = await callerProfileRef.get();

  if (!isAdminRole(callerProfileDoc.data()?.role)) {
    throw new HttpsError(
      "permission-denied",
      "Must be an administrative user to call this function."
    );
  }

  const { dryRun, targetUserIds } = request.data;
  const hasUserFilter = Array.isArray(targetUserIds);
  const selectedUserIds = hasUserFilter
    ? new Set(
      (targetUserIds as unknown[])
        .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    )
    : null;

  if (hasUserFilter && selectedUserIds && selectedUserIds.size === 0) {
    return {
      success: true,
      message: "No users selected. Nothing to process.",
      dryRun: Boolean(dryRun),
      stats: {
        usersAffected: 0,
        cardsRemoved: 0,
        compensationPacks: 0,
        details: [] as RemovalDetail[],
      },
    };
  }

  try {
    const settingsRef = db.collection("settings").doc("sammelkarten");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      throw new HttpsError("not-found", "Sammelkarten settings not found.");
    }

    const settings = settingsSnap.data() as any;
    const lootTeachers: any[] = settings.loot_teachers || [];

    // Create a map of teacher ID to current rarity
    const teacherRarityMap = new Map(
      lootTeachers.map((t) => [t.id, t.rarity])
    );

    // Get all user inventories
    const inventoriesSnap = await db.collection("user_teachers").get();

    const fixDetails: RemovalDetail[] = [];
    let totalUsersAffected = 0;
    let totalCardsRemoved = 0;
    let totalCompensation = 0;

    const batch = db.batch();

    for (const docSnap of inventoriesSnap.docs) {
      const userId = docSnap.id;
      if (selectedUserIds && !selectedUserIds.has(userId)) {
        continue;
      }

      const userCards = docSnap.data() as UserCards;
      let userAffected = false;
      let userCompensation = 0;
      let userTotalCardsRemoved = 0;
      const removedCardsForUser: RemovedCard[] = [];

      const updatedCards = { ...userCards };

      for (const [teacherId, cardData] of Object.entries(userCards)) {
        const teacher = lootTeachers.find((t: any) => t.id === teacherId);
        
        // Check if teacher no longer exists OR has rarity mismatch
        if (!teacherRarityMap.has(teacherId)) {
          // Teacher removed from pool - remove cards
          const cardsRemoved = cardData.count;

          fixDetails.push({
            userId,
            teacherId,
            cardsRemoved,
            duplicates: cardsRemoved,
            compensationPacks: 0,
            rarity: teacher?.rarity || "unknown",
            variants: cardData.variants,
          });

          removedCardsForUser.push({
            teacherId,
            teacherName: teacher?.name || teacherId,
            rarity: teacher?.rarity || "unknown",
            variants: cardData.variants || {},
            totalRemoved: cardsRemoved,
            duplicates: cardsRemoved,
            compensationPacks: 0,
          });

          userTotalCardsRemoved += cardsRemoved;
          totalCardsRemoved += cardsRemoved;
          userAffected = true;
          delete updatedCards[teacherId];
        } else {
          // Check if rarity matches (if variants exist)
          const systemRarity = teacherRarityMap.get(teacherId);
          const userRarities = cardData.variants || {};
          const userRarityArray = Object.keys(userRarities);
          
          // If user has multiple rarities (meaning rarity changed), remove and compensate
          if (userRarityArray.length > 1 || 
              (userRarityArray.length === 1 && userRarityArray[0] !== systemRarity)) {
            const cardsRemoved = cardData.count;

            fixDetails.push({
              userId,
              teacherId,
              cardsRemoved,
              duplicates: cardsRemoved,
              compensationPacks: 0,
              rarity: systemRarity,
              variants: cardData.variants,
            });

            removedCardsForUser.push({
              teacherId,
              teacherName: teacher?.name || teacherId,
              rarity: systemRarity || "unknown",
              variants: cardData.variants || {},
              totalRemoved: cardsRemoved,
              duplicates: cardsRemoved,
              compensationPacks: 0,
            });

            userTotalCardsRemoved += cardsRemoved;
            totalCardsRemoved += cardsRemoved;
            userAffected = true;
            delete updatedCards[teacherId];
          }
        }
      }

      if (userAffected) {
        userCompensation = Math.ceil(userTotalCardsRemoved / 3);
        removedCardsForUser.forEach((card) => {
          card.compensationPacks = userCompensation;
        });
        totalUsersAffected++;
        totalCompensation += userCompensation;

        if (!dryRun) {
          batch.set(db.collection("user_teachers").doc(userId), updatedCards);

          if (userCompensation > 0) {
            const profileRef = db.collection("profiles").doc(userId);
            batch.set(profileRef, {
              booster_stats: {
                extra_available: admin.firestore.FieldValue.increment(userCompensation),
              },
            }, { merge: true });
          }

          // Create notification for user with all removed cards
          const notificationId = db.collection("notifications").doc().id;
          const notificationRef = db.collection("notifications").doc(userId).collection("messages").doc(notificationId);
          
          const cardList = removedCardsForUser
            .map((card) => {
              const variants = Object.entries(card.variants)
                .map(([variant, count]) => `${count}x ${variant}`)
                .join(", ");
              return `• ${card.teacherName} (${card.rarity}): ${variants}`;
            })
            .join("\n");

          batch.set(notificationRef, {
            id: notificationId,
            userId,
            type: "card_removal",
            title: `Sammlung bereinigt: ${removedCardsForUser.length} Lehrer entfernt`,
            message: `${removedCardsForUser.length} Lehrer wurden aus deiner Sammlung entfernt aufgrund von Rarity-Mismatches.\n\nEntfernte Karten gesamt: ${userTotalCardsRemoved}\nKompensation: ${userCompensation} Booster (1 pro 3 entfernte Karten, aufgerundet)\n\nDetails:\n${cardList}`,
            timestamp: new Date(),
            removedCards: removedCardsForUser,
            boosterCompensation: {
              amount: userCompensation,
              reason: `Entschädigung auf Basis von ${userTotalCardsRemoved} entfernten Karten (1 Booster pro 3 Karten, aufgerundet)`,
            },
            read: false,
          });
        }
      }
    }

    if (!dryRun) {
      await batch.commit();
    }

    const logMessage = `Validated and fixed rarity mismatches across all user albums. ${totalUsersAffected} users affected. ${totalCardsRemoved} cards removed. ${totalCompensation} packs distributed.`;

    if (!dryRun) {
      // Log the action
      const adminName = callerProfileDoc.data()?.full_name || "Unknown Admin";

      await db.collection("logs").add({
        type: "ADMIN_ACTION",
        action: "VALIDATE_AND_FIX_RARITIES",
        user_id: request.auth.uid,
        user_name: adminName,
        timestamp: new Date(),
        details: logMessage,
        fix_log: fixDetails,
        stats: {
          users_affected: totalUsersAffected,
          cards_removed: totalCardsRemoved,
          compensation_packs: totalCompensation,
        },
      });

      logger.info("validateAndFixRarities completed", {
        usersAffected: totalUsersAffected,
        cardsRemoved: totalCardsRemoved,
        compensationPacks: totalCompensation,
      });
    }

    return {
      success: true,
      message: logMessage,
      dryRun: Boolean(dryRun),
      stats: {
        usersAffected: totalUsersAffected,
        cardsRemoved: totalCardsRemoved,
        compensationPacks: totalCompensation,
        details: fixDetails,
      },
    };
  } catch (error: any) {
    logger.error("validateAndFixRarities failed", { error });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "internal",
      `validateAndFixRarities failed: ${error?.message || "unknown error"}`
    );
  }
});
