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

type ProposalUsageStatus = "unknown" | "used" | "not_used";

interface EditedProposalPayload {
  teacher_name?: string;
  hp?: number;
  description?: string;
  attacks?: Array<{
    name?: string;
    damage?: number;
    description?: string;
  }>;
}

const CANONICAL_TEACHER_SET_ID = "teacher_vol1";
const LEGACY_TEACHER_SET_ID = "teachers_v1";

const toSafeInt = (value: any) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

const normalizeTeacherCardKey = (rawKey: string) => {
  if (!rawKey) return rawKey;
  if (rawKey.startsWith(`${CANONICAL_TEACHER_SET_ID}:`)) return rawKey;
  if (rawKey.startsWith(`${LEGACY_TEACHER_SET_ID}:`)) {
    return `${CANONICAL_TEACHER_SET_ID}:${rawKey.slice(`${LEGACY_TEACHER_SET_ID}:`.length)}`;
  }
  if (!rawKey.includes(":")) {
    return `${CANONICAL_TEACHER_SET_ID}:${rawKey}`;
  }
  return rawKey;
};

const mergeCardEntries = (left: any, right: any) => {
  const leftCount = toSafeInt(left?.count);
  const rightCount = toSafeInt(right?.count);
  const mergedCount = leftCount + rightCount;

  const variants: Record<string, number> = {
    ...(left?.variants || {}),
  };

  Object.entries(right?.variants || {}).forEach(([variant, count]) => {
    variants[variant] = toSafeInt(variants[variant]) + toSafeInt(count);
  });

  return {
    ...(left || {}),
    ...(right || {}),
    count: mergedCount,
    level: Math.floor(Math.sqrt(Math.max(0, mergedCount - 1))) + 1,
    variants,
  };
};

const sanitizeProposalText = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const sanitizeEditedProposal = (proposal: EditedProposalPayload | undefined) => {
  if (!proposal || typeof proposal !== "object") {
    return null;
  }

  const teacherName = sanitizeProposalText(proposal.teacher_name, 120);
  const description = sanitizeProposalText(proposal.description, 800);
  const hpParsed = Number(proposal.hp);
  const hp = Number.isFinite(hpParsed) ? Math.max(10, Math.min(300, Math.round(hpParsed))) : 60;

  const rawAttacks = Array.isArray(proposal.attacks) ? proposal.attacks.slice(0, 2) : [];
  const attacks = rawAttacks
    .map((attack) => {
      const name = sanitizeProposalText(attack?.name, 80);
      const descriptionText = sanitizeProposalText(attack?.description, 300);
      const damageParsed = Number(attack?.damage);
      const damage = Number.isFinite(damageParsed) ? Math.max(0, Math.min(500, Math.round(damageParsed))) : 0;
      return {
        name,
        damage,
        description: descriptionText,
      };
    })
    .filter((attack) => attack.name.length > 0);

  if (!teacherName) {
    throw new HttpsError("invalid-argument", "editedProposal.teacher_name must not be empty.");
  }

  if (attacks.length < 1) {
    throw new HttpsError("invalid-argument", "editedProposal.attacks must contain at least one named attack.");
  }

  return {
    teacher_name: teacherName,
    hp,
    description,
    attacks,
  };
};

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
    const sets = settings.sets || {};
    const lootTeachers = settings.loot_teachers || [];
    
    // Search in all sets + legacy pool
    let teacher = lootTeachers.find((t: any) => t.id === teacherId);
    if (!teacher) {
      for (const setId of Object.keys(sets)) {
        teacher = sets[setId].cards.find((t: any) => t.id === teacherId);
        if (teacher) break;
      }
    }

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
    const sets = settings.sets || {};
    const lootTeachers: any[] = settings.loot_teachers || [];

    // Create a map of teacher ID to current rarity from all sources
    const teacherRarityMap = new Map<string, string>();
    lootTeachers.forEach(t => teacherRarityMap.set(t.id, t.rarity));
    Object.values(sets).forEach((set: any) => {
      set.cards.forEach((t: any) => teacherRarityMap.set(t.id, t.rarity));
    });

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

/**
 * Recalculates booster_stats.total_opened for each user based on current inventory:
 * total_opened = Math.ceil(total_cards_in_inventory / 3)
 */
export const syncOpenedPacksToInventory = onCall({
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
    throw new HttpsError("permission-denied", "Must be an administrative user to call this function.");
  }

  const { dryRun } = request.data || {};

  try {
    const [profilesSnap, inventoriesSnap] = await Promise.all([
      db.collection("profiles").get(),
      db.collection("user_teachers").get(),
    ]);

    const inventoryByUserId = new Map<string, UserCards>();
    inventoriesSnap.forEach((docSnap) => {
      inventoryByUserId.set(docSnap.id, docSnap.data() as UserCards);
    });

    let usersChecked = 0;
    let usersUpdated = 0;
    const updates: Array<{ userId: string; oldTotalOpened: number; newTotalOpened: number; totalCards: number }> = [];
    let batch = db.batch();
    let batchOps = 0;

    const commitBatchIfNeeded = async (force = false) => {
      if (batchOps === 0) return;
      if (!force && batchOps < 450) return;
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    };

    for (const profileSnap of profilesSnap.docs) {
      usersChecked++;
      const userId = profileSnap.id;
      const profileData = profileSnap.data() as any;
      const userCards = inventoryByUserId.get(userId) || {};

      const totalCards = Object.values(userCards).reduce((sum, cardData: any) => {
        const count = Number(cardData?.count) || 0;
        return sum + Math.max(0, count);
      }, 0);

      const recalculatedTotalOpened = Math.ceil(totalCards / 3);
      const currentTotalOpened = Number(profileData?.booster_stats?.total_opened) || 0;
      const currentTotalCards = Number(profileData?.booster_stats?.total_cards) || 0;

      if (currentTotalOpened !== recalculatedTotalOpened || currentTotalCards !== totalCards) {
        usersUpdated++;
        updates.push({
          userId,
          oldTotalOpened: currentTotalOpened,
          newTotalOpened: recalculatedTotalOpened,
          totalCards,
        });

        if (!dryRun) {
          batch.set(
            db.collection("profiles").doc(userId),
            {
              booster_stats: {
                total_opened: recalculatedTotalOpened,
                total_cards: totalCards,
              },
            },
            { merge: true }
          );
          batchOps++;
          await commitBatchIfNeeded();
        }
      }
    }

    if (!dryRun) {
      await commitBatchIfNeeded(true);
      await db.collection("logs").add({
        type: "ADMIN_ACTION",
        action: "SYNC_OPENED_PACKS_TO_INVENTORY",
        user_id: request.auth.uid,
        user_name: callerProfileDoc.data()?.full_name || "Unknown Admin",
        timestamp: new Date(),
        details: `Synced booster_stats.total_opened for ${usersUpdated}/${usersChecked} users based on inventory card counts.`,
        stats: {
          users_checked: usersChecked,
          users_updated: usersUpdated,
        },
        updates,
      });
    }

    return {
      success: true,
      dryRun: Boolean(dryRun),
      stats: {
        usersChecked,
        usersUpdated,
      },
      updates,
    };
  } catch (error: any) {
    logger.error("syncOpenedPacksToInventory failed", { error });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `syncOpenedPacksToInventory failed: ${error?.message || "unknown error"}`);
  }
});

/**
 * Migrates legacy teacher inventory keys to canonical `teacher_vol1:<id>`.
 * - `legacyTeacherId` -> `teacher_vol1:legacyTeacherId`
 * - `teachers_v1:teacherId` -> `teacher_vol1:teacherId`
 *
 * Also migrates `profiles.booster_stats.inventory.teachers_v1` to `teacher_vol1`.
 */
export const migrateTeacherVol1Inventory = onCall({
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
    throw new HttpsError("permission-denied", "Must be an administrative user to call this function.");
  }

  const { dryRun = false, targetUserId } = request.data || {};
  const migrateSingleUser = typeof targetUserId === "string" && targetUserId.trim().length > 0;
  const resolvedUserId = migrateSingleUser ? targetUserId.trim() : null;

  const userDocs = migrateSingleUser
    ? [await db.collection("user_teachers").doc(resolvedUserId!).get()]
    : (await db.collection("user_teachers").get()).docs;

  const profileDocs = migrateSingleUser
    ? [await db.collection("profiles").doc(resolvedUserId!).get()]
    : (await db.collection("profiles").get()).docs;

  let inventoryDocsChecked = 0;
  let inventoryDocsUpdated = 0;
  let cardKeysRewritten = 0;
  let profileDocsChecked = 0;
  let profileDocsUpdated = 0;

  let batch = db.batch();
  let ops = 0;

  const flush = async (force = false) => {
    if (ops === 0) return;
    if (!force && ops < 450) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const docSnap of userDocs) {
    if (!docSnap.exists) continue;
    inventoryDocsChecked++;

    const current = docSnap.data() as Record<string, any>;
    const migrated: Record<string, any> = {};
    let changed = false;

    for (const [rawKey, rawValue] of Object.entries(current)) {
      const normalizedKey = normalizeTeacherCardKey(rawKey);
      if (normalizedKey !== rawKey) {
        changed = true;
        cardKeysRewritten++;
      }

      if (migrated[normalizedKey]) {
        changed = true;
        migrated[normalizedKey] = mergeCardEntries(migrated[normalizedKey], rawValue);
      } else {
        migrated[normalizedKey] = {
          ...(rawValue || {}),
          count: toSafeInt((rawValue as any)?.count),
          level: Math.floor(Math.sqrt(Math.max(0, toSafeInt((rawValue as any)?.count) - 1))) + 1,
          variants: { ...((rawValue as any)?.variants || {}) },
        };
      }
    }

    if (!changed) continue;
    inventoryDocsUpdated++;

    if (!dryRun) {
      batch.set(docSnap.ref, migrated);
      ops++;
      await flush();
    }
  }

  for (const profileSnap of profileDocs) {
    if (!profileSnap.exists) continue;
    profileDocsChecked++;

    const profileData = profileSnap.data() as any;
    const inventory = { ...(profileData?.booster_stats?.inventory || {}) };
    const legacy = toSafeInt(inventory[LEGACY_TEACHER_SET_ID]);
    if (legacy <= 0) continue;

    inventory[CANONICAL_TEACHER_SET_ID] = toSafeInt(inventory[CANONICAL_TEACHER_SET_ID]) + legacy;
    delete inventory[LEGACY_TEACHER_SET_ID];
    profileDocsUpdated++;

    if (!dryRun) {
      batch.update(profileSnap.ref, {
        "booster_stats.inventory": inventory,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      ops++;
      await flush();
    }
  }

  if (!dryRun) {
    await flush(true);
    await db.collection("logs").add({
      type: "ADMIN_ACTION",
      action: "MIGRATE_TEACHER_VOL1_INVENTORY",
      user_id: request.auth.uid,
      user_name: callerProfileDoc.data()?.full_name || "Unknown Admin",
      timestamp: new Date(),
      details: `Migrated teacher cards to ${CANONICAL_TEACHER_SET_ID}. user_teachers updated: ${inventoryDocsUpdated}/${inventoryDocsChecked}, profiles updated: ${profileDocsUpdated}/${profileDocsChecked}.`,
      stats: {
        inventory_docs_checked: inventoryDocsChecked,
        inventory_docs_updated: inventoryDocsUpdated,
        card_keys_rewritten: cardKeysRewritten,
        profile_docs_checked: profileDocsChecked,
        profile_docs_updated: profileDocsUpdated,
      },
      dryRun: Boolean(dryRun),
      targetUserId: resolvedUserId,
    });
  }

  return {
    success: true,
    dryRun: Boolean(dryRun),
    targetUserId: resolvedUserId,
    stats: {
      inventoryDocsChecked,
      inventoryDocsUpdated,
      cardKeysRewritten,
      profileDocsChecked,
      profileDocsUpdated,
    },
  };
});

/**
 * Removes legacy voting fields from all profiles.
 * Legacy keys seen in production: `teachers_voted`, `rated_teachers`.
 */
export const cleanupLegacyTeachersVoted = onCall({
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
    throw new HttpsError("permission-denied", "Must be an administrative user to call this function.");
  }

  const { dryRun } = request.data || {};

  try {
    const profilesSnap = await db.collection("profiles").get();
    let batch = db.batch();
    let batchOps = 0;

    const commitBatchIfNeeded = async (force = false) => {
      if (batchOps === 0) return;
      if (!force && batchOps < 450) return;
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    };
    let usersChecked = 0;
    let usersUpdated = 0;
    let removedTeachersVotedCount = 0;
    let removedRatedTeachersCount = 0;
    const legacyFields = ["teachers_voted", "rated_teachers"] as const;

    for (const profileSnap of profilesSnap.docs) {
      usersChecked++;
      const data = profileSnap.data() as any;

      const fieldsToDelete = legacyFields.filter((fieldName) => Object.prototype.hasOwnProperty.call(data, fieldName));

      if (fieldsToDelete.length > 0) {
        usersUpdated++;
        if (fieldsToDelete.includes("teachers_voted")) removedTeachersVotedCount++;
        if (fieldsToDelete.includes("rated_teachers")) removedRatedTeachersCount++;

        if (!dryRun) {
          const updatePayload = fieldsToDelete.reduce<Record<string, any>>((acc, fieldName) => {
            acc[fieldName] = admin.firestore.FieldValue.delete();
            return acc;
          }, {});

          batch.update(profileSnap.ref, updatePayload);
          batchOps++;
          await commitBatchIfNeeded();
        }
      }
    }

    if (!dryRun) {
      await commitBatchIfNeeded(true);
      await db.collection("logs").add({
        type: "ADMIN_ACTION",
        action: "CLEANUP_LEGACY_TEACHERS_VOTED",
        user_id: request.auth.uid,
        user_name: callerProfileDoc.data()?.full_name || "Unknown Admin",
        timestamp: new Date(),
        details: `Removed legacy voting fields from ${usersUpdated}/${usersChecked} profiles (teachers_voted: ${removedTeachersVotedCount}, rated_teachers: ${removedRatedTeachersCount}).`,
        stats: {
          users_checked: usersChecked,
          users_updated: usersUpdated,
          removed_teachers_voted: removedTeachersVotedCount,
          removed_rated_teachers: removedRatedTeachersCount,
        },
      });
    }

    return {
      success: true,
      dryRun: Boolean(dryRun),
      stats: {
        usersChecked,
        usersUpdated,
        removedTeachersVoted: removedTeachersVotedCount,
        removedRatedTeachers: removedRatedTeachersCount,
      },
    };
  } catch (error: any) {
    logger.error("cleanupLegacyTeachersVoted failed", { error });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `cleanupLegacyTeachersVoted failed: ${error?.message || "unknown error"}`);
  }
});

/**
 * Moderates a card proposal (accept/reject) and optionally grants booster rewards.
 * Accepting a proposal grants reward packs once by incrementing booster_stats.extra_available.
 */
export const moderateCardProposal = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  const callerUid = request.auth.uid;

  const db = getFirestore("abi-data");
  const callerProfileRef = db.collection("profiles").doc(callerUid);
  const callerProfileDoc = await callerProfileRef.get();

  if (!isAdminRole(callerProfileDoc.data()?.role)) {
    throw new HttpsError("permission-denied", "Must be an administrative user to call this function.");
  }

  const {
    proposalId,
    action,
    adminNote,
    rewardPacks,
    usageStatus,
    editedProposal,
  } = request.data || {};

  if (!proposalId || typeof proposalId !== "string") {
    throw new HttpsError("invalid-argument", "proposalId is required and must be a string.");
  }

  if (action !== "accept" && action !== "reject") {
    throw new HttpsError("invalid-argument", "action must be either 'accept' or 'reject'.");
  }

  const normalizedUsageStatus: ProposalUsageStatus = (() => {
    if (action === "reject") return "not_used";
    if (usageStatus === "used" || usageStatus === "not_used") return usageStatus;
    throw new HttpsError("invalid-argument", "usageStatus must be either 'used' or 'not_used' for accept action.");
  })();

  const safeEditedProposal = action === "accept"
    ? sanitizeEditedProposal(editedProposal as EditedProposalPayload)
    : null;

  const safeRewardPacks = Number.isFinite(Number(rewardPacks))
    ? Math.max(0, Math.floor(Number(rewardPacks)))
    : 2;

  const now = new Date();
  const adminName = callerProfileDoc.data()?.full_name || "Unknown Admin";

  const proposalRef = db.collection("card_proposals").doc(proposalId);
  let grantedPacks = 0;
  let proposalAuthorId = "";
  let notificationTeacherName = "einen Lehrer";

  await db.runTransaction(async (tx) => {
    const proposalSnap = await tx.get(proposalRef);
    if (!proposalSnap.exists) {
      throw new HttpsError("not-found", "Proposal not found.");
    }

    const proposalData = proposalSnap.data() as any;
    const currentStatus = proposalData?.status;
    const rewardAlreadyClaimed = proposalData?.reward_claimed === true;
    const userId = proposalData?.created_by;

    if (!userId || typeof userId !== "string") {
      throw new HttpsError("failed-precondition", "Proposal is missing created_by.");
    }

    if (currentStatus !== "pending") {
      throw new HttpsError("failed-precondition", "Only pending proposals can be moderated.");
    }

    proposalAuthorId = userId;
    notificationTeacherName = safeEditedProposal?.teacher_name || proposalData?.teacher_name || "einen Lehrer";

    const updatePayload: Record<string, any> = {
      status: action === "accept" ? "accepted" : "rejected",
      admin_note: typeof adminNote === "string" ? adminNote.trim().slice(0, 1200) : "",
      moderated_at: now.toISOString(),
      moderated_by: callerUid,
      moderated_by_name: adminName,
      usage_status: action === "accept" ? normalizedUsageStatus : "not_used",
    };

    if (safeEditedProposal && action === "accept") {
      updatePayload.teacher_name = safeEditedProposal.teacher_name;
      updatePayload.hp = safeEditedProposal.hp;
      updatePayload.description = safeEditedProposal.description;
      updatePayload.attacks = safeEditedProposal.attacks;
      updatePayload.edited_snapshot = safeEditedProposal;
    }

    if (action === "accept" && normalizedUsageStatus === "used" && !rewardAlreadyClaimed && safeRewardPacks > 0) {
      grantedPacks = safeRewardPacks;
      updatePayload.reward_claimed = true;
      updatePayload.reward_packs_awarded = grantedPacks;

      const profileRef = db.collection("profiles").doc(userId);
      tx.set(
        profileRef,
        {
          booster_stats: {
            extra_available: admin.firestore.FieldValue.increment(grantedPacks),
          },
        },
        { merge: true }
      );
    } else {
      updatePayload.reward_claimed = rewardAlreadyClaimed;
      updatePayload.reward_packs_awarded = rewardAlreadyClaimed
        ? Math.max(0, Number(proposalData?.reward_packs_awarded || safeRewardPacks))
        : 0;
    }

    tx.update(proposalRef, updatePayload);

    const notificationRef = db
      .collection("notifications")
      .doc(userId)
      .collection("messages")
      .doc();

    const acceptedUsedMessage = grantedPacks > 0
      ? `Dein Vorschlag fuer ${notificationTeacherName} wurde genutzt. Du hast ${grantedPacks} Booster als Belohnung erhalten.`
      : `Dein Vorschlag fuer ${notificationTeacherName} wurde angenommen, aber in der finalen Karte nicht direkt genutzt.`;

    tx.set(notificationRef, {
      id: notificationRef.id,
      userId,
      type: action === "accept" ? "card_proposal_accepted" : "card_proposal_rejected",
      title: action === "accept" ? "Ideen-Labor: Vorschlag entschieden" : "Ideen-Labor: Vorschlag abgelehnt",
      message: action === "accept"
        ? acceptedUsedMessage
        : `Dein Vorschlag fuer ${notificationTeacherName} wurde diesmal nicht angenommen.`,
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      reward_packs: grantedPacks,
      proposal_id: proposalId,
      usage_status: action === "accept" ? normalizedUsageStatus : "not_used",
    });
  });

  await db.collection("logs").add({
    type: "ADMIN_ACTION",
    action: "CARD_PROPOSAL_MODERATED",
    user_id: callerUid,
    user_name: adminName,
    timestamp: now,
    details: `Proposal ${proposalId} ${action}${action === "accept" ? ` (usage: ${normalizedUsageStatus})` : ""}${grantedPacks > 0 ? `, granted ${grantedPacks} boosters` : ""}.`,
    proposal_id: proposalId,
    proposal_author_id: proposalAuthorId,
    moderation_action: action,
    usage_status: action === "accept" ? normalizedUsageStatus : "not_used",
    reward_packs_granted: grantedPacks,
  });

  return {
    success: true,
    proposalId,
    status: action === "accept" ? "accepted" : "rejected",
    usageStatus: action === "accept" ? normalizedUsageStatus : "not_used",
    rewardGranted: grantedPacks,
  };
});

/**
 * Backfills usage_status for previously moderated proposals.
 * - accepted/rejected without usage_status => usage_status: unknown
 * - reward_packs_awarded derives from reward_claimed when not present
 */
export const backfillCardProposalUsageStatus = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  const callerUid = request.auth.uid;

  const db = getFirestore("abi-data");
  const callerProfileRef = db.collection("profiles").doc(callerUid);
  const callerProfileDoc = await callerProfileRef.get();

  if (!isAdminRole(callerProfileDoc.data()?.role)) {
    throw new HttpsError("permission-denied", "Must be an administrative user to call this function.");
  }

  const proposalsSnap = await db.collection("card_proposals").get();
  const batch = db.batch();
  let updated = 0;

  proposalsSnap.docs.forEach((proposalDoc) => {
    const data = proposalDoc.data() as any;
    const hasUsage = typeof data?.usage_status === "string";
    const isModerated = data?.status === "accepted" || data?.status === "rejected";
    const hasRewardPacks = Number.isFinite(Number(data?.reward_packs_awarded));

    if (!isModerated || (hasUsage && hasRewardPacks)) {
      return;
    }

    const rewardClaimed = data?.reward_claimed === true;
    const patch: Record<string, any> = {};

    if (!hasUsage) {
      patch.usage_status = "unknown";
    }

    if (!hasRewardPacks) {
      patch.reward_packs_awarded = rewardClaimed ? 2 : 0;
    }

    if (Object.keys(patch).length > 0) {
      batch.update(proposalDoc.ref, patch);
      updated += 1;
    }
  });

  if (updated > 0) {
    await batch.commit();
  }

  await db.collection("logs").add({
    type: "ADMIN_ACTION",
    action: "CARD_PROPOSAL_USAGE_BACKFILL",
    user_id: callerUid,
    user_name: callerProfileDoc.data()?.full_name || "Unknown Admin",
    timestamp: new Date(),
    details: `Backfilled usage_status/reward_packs_awarded on ${updated} proposal docs.`,
    proposals_updated: updated,
  });

  return {
    success: true,
    updated,
  };
});
