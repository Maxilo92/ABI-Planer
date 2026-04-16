import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Admin-only function to toggle a user's email verification status.
 */
export const toggleUserEmailVerification = onCall({
  region: "europe-west3",
  cors: CALLABLE_CORS_ORIGINS,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }

  const db = getFirestore("abi-data");
  const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
  const callerData = callerSnap.data();

  if (!callerData || !["admin", "admin_main", "admin_co"].includes(callerData.role)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }

  const { targetUid, emailVerified } = request.data;
  if (!targetUid || typeof emailVerified !== "boolean") {
    throw new HttpsError("invalid-argument", "Missing targetUid or emailVerified.");
  }

  console.log(`[Admin] Toggling email verification for ${targetUid} to ${emailVerified}`);

  try {
    await admin.auth().updateUser(targetUid, {
      emailVerified: emailVerified
    });

    // Sync to Firestore is_approved field
    await db.collection("profiles").doc(targetUid).update({
      is_approved: emailVerified
    });

    return { success: true };
  } catch (error: any) {
    console.error(`[Admin] Failed to update email verification for ${targetUid}:`, error);
    throw new HttpsError("internal", error.message || "Failed to update user.");
  }
});

/**
 * Recreates a missing profile document for the signed-in user.
 */
export const bootstrapMissingProfile = onCall({
  region: "europe-west3",
  cors: CALLABLE_CORS_ORIGINS,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }

  const db = getFirestore("abi-data");
  const profileRef = db.collection("profiles").doc(request.auth.uid);
  const existingSnap = await profileRef.get();

  if (existingSnap.exists) {
    return {
      success: true,
      created: false,
      profile: { id: existingSnap.id, ...existingSnap.data() },
    };
  }

  const userRecord = await admin.auth().getUser(request.auth.uid);
  const fallbackName = userRecord.displayName?.trim() || userRecord.email?.split("@")[0] || "Neuer Nutzer";
  const email = userRecord.email || "";

  const profile = {
    id: request.auth.uid,
    full_name: fallbackName,
    email,
    role: "viewer",
    access_target: "tcg",
    planning_groups: [],
    led_groups: [],
    class_name: null,
    is_group_leader: false,
    is_approved: Boolean(userRecord.emailVerified),
    created_at: new Date().toISOString(),
    isOnline: false,
    lastOnline: new Date(),
    referral_code: request.auth.uid.substring(0, 8).toUpperCase(),
    referred_by: null,
    is_referral_claimed: false,
    total_referrals: 0,
    total_referral_boosters: 0,
    currencies: {
      notepunkte: 0,
    },
    subscription: {
      active: false,
    },
  };

  await profileRef.set({
    ...profile,
    lastOnline: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    created: true,
    profile,
  };
});

/**
 * Triggered when a user profile is deleted from Firestore.
 * This function cleans up the Firebase Auth account and other user-specific collections.
 */
export const onProfileDeleted = onDocumentDeleted({
  document: "profiles/{userId}",
  // We use the same database name as found in danger.ts
  database: "abi-data",
  region: "europe-west3",
}, async (event) => {
  const userId = event.params.userId;
  const db = getFirestore("abi-data");

  console.log(`Starting cleanup for deleted user profile: ${userId}`);

  // 1. Delete the Firebase Authentication account
  try {
    await admin.auth().deleteUser(userId);
    console.log(`Successfully deleted Firebase Auth account for user: ${userId}`);
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      console.log(`Auth account for user ${userId} already gone or never existed.`);
    } else {
      console.error(`Error deleting auth account for user ${userId}:`, error);
    }
  }

  // 2. Delete user-specific top-level documents
  const userRelatedCollections = ["user_teachers", "user_secrets", "poll_votes"];
  for (const collectionName of userRelatedCollections) {
    try {
      await db.collection(collectionName).doc(userId).delete();
      console.log(`Deleted ${userId} from top-level collection: ${collectionName}`);
    } catch (error) {
      console.error(`Error deleting ${userId} from ${collectionName}:`, error);
    }
  }

  // 3. Cleanup in subcollections (e.g. polls/{id}/votes/{userId})
  // We need to find all polls first. This might be expensive if there are many polls,
  // but it's the only way to clean up the votes subcollection without a flat structure.
  try {
    const pollsSnapshot = await db.collection("polls").get();
    const voteCleanupPromises = pollsSnapshot.docs.map(pollDoc => 
      db.collection("polls").doc(pollDoc.id).collection("votes").doc(userId).delete()
    );
    await Promise.all(voteCleanupPromises);
    console.log(`Cleaned up votes for user ${userId} across ${pollsSnapshot.size} polls.`);
  } catch (error) {
    console.error(`Error cleaning up votes for user ${userId}:`, error);
  }

  // 4. Delete profile subcollections (e.g. unseen_gifts)
  // Subcollections are not deleted automatically when a document is deleted.
  try {
    const giftsSnapshot = await db.collection("profiles").doc(userId).collection("unseen_gifts").get();
    const giftCleanupPromises = giftsSnapshot.docs.map(giftDoc => giftDoc.ref.delete());
    await Promise.all(giftCleanupPromises);
    console.log(`Deleted ${giftsSnapshot.size} documents from unseen_gifts subcollection for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting unseen_gifts for user ${userId}:`, error);
  }

  // 5. Delete referral record
  try {
    await db.collection("referrals").doc(`std_${userId}`).delete();
    console.log(`Deleted referral record for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting referral record for user ${userId}:`, error);
  }

  // 6. Pseudonymize Stripe transactions
  try {
    const stripeTransactionsSnapshot = await db.collection("stripe_transactions").where("user_id", "==", userId).get();
    const pseudonymizePromises = stripeTransactionsSnapshot.docs.map(doc => 
      doc.ref.update({
        user_id: `masked_${userId.substring(0, 8)}`,
        status: "pseudonymized",
        pseudonymized_at: admin.firestore.FieldValue.serverTimestamp()
      })
    );
    await Promise.all(pseudonymizePromises);
    console.log(`Pseudonymized ${stripeTransactionsSnapshot.size} Stripe transactions for user ${userId}`);
  } catch (error) {
    console.error(`Error pseudonymizing Stripe transactions for user ${userId}:`, error);
  }

  // 7. Anonymize Audit Logs
  try {
    const logsSnapshot = await db.collection("logs").where("user_id", "==", userId).get();
    const anonymizeLogsPromises = logsSnapshot.docs.map(doc => 
      doc.ref.update({
        user_id: `masked_${userId.substring(0, 8)}`,
        user_name: "[Gelöschter Nutzer]",
        anonymized_at: admin.firestore.FieldValue.serverTimestamp()
      })
    );
    await Promise.all(anonymizeLogsPromises);
    console.log(`Anonymized ${logsSnapshot.size} audit logs for user ${userId}`);
  } catch (error) {
    console.error(`Error anonymizing audit logs for user ${userId}:`, error);
  }

  console.log(`Cleanup finished for user: ${userId}`);
});

/**
 * Admin-only function to cleanup user inventories by removing teachers that no longer exist in the settings.
 */
export const cleanupNonExistentTeachers = onCall({
  region: "europe-west3",
  cors: CALLABLE_CORS_ORIGINS,
  maxInstances: 1,
  memory: "512MiB",
  timeoutSeconds: 300,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }

  const db = getFirestore("abi-data");
  const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
  const callerData = callerSnap.data();

  if (!callerData || !["admin", "admin_main", "admin_co"].includes(callerData.role)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }

  console.log(`[Admin] Starting global inventory cleanup triggered by ${request.auth.uid}`);

  try {
    // 1. Get valid teacher IDs
    const settingsSnap = await db.collection("settings").doc("sammelkarten").get();
    if (!settingsSnap.exists) {
      throw new HttpsError("not-found", "Sammelkarten settings not found.");
    }

    const settingsData = settingsSnap.data() || {};
    const validTeachers = (settingsData.loot_teachers || []) as { id: string }[];
    const validTeacherIds = new Set(validTeachers.map(t => t.id));

    console.log(`[Admin] Found ${validTeacherIds.size} valid teachers in settings.`);

    // 2. Iterate through all user inventories
    const userTeachersSnap = await db.collection("user_teachers").get();
    let usersProcessed = 0;
    let usersUpdated = 0;
    let cardsRemoved = 0;

    const batchSize = 400;
    let currentBatch = db.batch();
    let currentBatchOpCount = 0;

    for (const userDoc of userTeachersSnap.docs) {
      usersProcessed++;
      const inventory = userDoc.data();
      const updates: Record<string, any> = {};
      let hasInvalid = false;

      for (const teacherId of Object.keys(inventory)) {
        if (!validTeacherIds.has(teacherId)) {
          updates[teacherId] = FieldValue.delete();
          hasInvalid = true;
          cardsRemoved++;
        }
      }

      if (hasInvalid) {
        currentBatch.update(userDoc.ref, updates);
        currentBatchOpCount++;
        usersUpdated++;

        if (currentBatchOpCount >= batchSize) {
          await currentBatch.commit();
          currentBatch = db.batch();
          currentBatchOpCount = 0;
          console.log(`[Admin] Committed batch of ${batchSize} inventory updates.`);
        }
      }
    }

    // Commit final batch if needed
    if (currentBatchOpCount > 0) {
      await currentBatch.commit();
    }

    console.log(`[Admin] Inventory cleanup finished. Processed ${usersProcessed} users, updated ${usersUpdated}, removed ${cardsRemoved} cards.`);

    return {
      success: true,
      usersProcessed,
      usersUpdated,
      cardsRemoved
    };
  } catch (error: any) {
    console.error(`[Admin] Global inventory cleanup failed:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to cleanup inventories.");
  }
});

/**
 * Admin-only function called when a teacher's rarity is changed.
 * Removes the teacher from all user inventories and adds 1 booster pack per removed card as compensation.
 */
export const handleTeacherRarityChange = onCall({
  region: "europe-west3",
  cors: CALLABLE_CORS_ORIGINS,
  maxInstances: 1,
  memory: "512MiB",
  timeoutSeconds: 300,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }

  const { teacherId, teacherName } = request.data;
  if (!teacherId) {
    throw new HttpsError("invalid-argument", "Missing teacherId.");
  }

  const db = getFirestore("abi-data");
  const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
  const callerData = callerSnap.data();

  if (!callerData || !["admin", "admin_main", "admin_co"].includes(callerData.role)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }

  console.log(`[Admin] Starting teacher rarity change cleanup for ${teacherName} (${teacherId})`);

  try {
    const userTeachersSnap = await db.collection("user_teachers").get();
    let usersUpdated = 0;
    let totalCompensatedBoosters = 0;
    let notificationsCreated = 0;

    const batchSize = 250; // Smaller batch because we do two updates (user_teachers and profiles)
    let currentBatch = db.batch();
    let currentBatchOpCount = 0;

    for (const userDoc of userTeachersSnap.docs) {
      const inventory = userDoc.data();
      
      if (inventory[teacherId]) {
        const userId = userDoc.id;
        const cardCount = Number(inventory[teacherId].count) || 0;
        const variants = inventory[teacherId].variants || {};
        const duplicateCount = Math.max(0, cardCount - 1);

        if (cardCount > 0) {
          // 1. Remove teacher from inventory
          currentBatch.update(userDoc.ref, {
            [teacherId]: FieldValue.delete()
          });
          currentBatchOpCount++;

          // 2. Add compensation boosters to profile
          const profileRef = db.collection("profiles").doc(userId);
          currentBatch.update(profileRef, {
            "booster_stats.extra_available": FieldValue.increment(cardCount),
            updated_at: FieldValue.serverTimestamp()
          });
          currentBatchOpCount++;

          // 3. Create in-app notification for affected user
          const notificationRef = db
            .collection("notifications")
            .doc(userId)
            .collection("messages")
            .doc();

          const variantSummary = Object.entries(variants)
            .map(([variant, count]) => `${count}x ${variant}`)
            .join(", ");

          currentBatch.set(notificationRef, {
            id: notificationRef.id,
            userId,
            type: "card_removal",
            title: `Karte entfernt: ${teacherName || teacherId}`,
            message: `Die Karte \"${teacherName || teacherId}\" wurde wegen einer Seltenheitsanpassung aus deinem Album entfernt. ${variantSummary ? `Entfernte Varianten: ${variantSummary}. ` : ""}Du hast ${cardCount} Booster als Entschadigung erhalten.`,
            removedCards: [
              {
                teacherId,
                teacherName: teacherName || teacherId,
                variants,
                totalRemoved: cardCount,
                duplicateCount,
              },
            ],
            boosterCompensation: {
              amount: cardCount,
              reason: "Entschadigung bei Seltenheitsanderung",
            },
            read: false,
            timestamp: FieldValue.serverTimestamp(),
          });
          currentBatchOpCount++;
          notificationsCreated++;

          usersUpdated++;
          totalCompensatedBoosters += cardCount;

          if (currentBatchOpCount >= batchSize) {
            await currentBatch.commit();
            currentBatch = db.batch();
            currentBatchOpCount = 0;
            console.log(`[Admin] Committed batch of ${usersUpdated} compensation updates.`);
          }
        }
      }
    }

    if (currentBatchOpCount > 0) {
      await currentBatch.commit();
    }

    console.log(`[Admin] Rarity change cleanup finished. Updated ${usersUpdated} users, added ${totalCompensatedBoosters} compensation boosters.`);

    return {
      success: true,
      usersUpdated,
      totalCompensatedBoosters,
      notificationsCreated,
    };
  } catch (error: any) {
    console.error(`[Admin] Teacher rarity change cleanup failed:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to cleanup inventories on rarity change.");
  }
});

/**
 * Utility: Add NP (Notenpunkte) to user balance with atomic transaction
 * @returns { success: boolean, newBalance: number }
 */
export async function addNotepunkte(userId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
  if (amount < 0) throw new Error("Amount must be >= 0");
  const db = getFirestore("abi-data");
  const result = await db.runTransaction(async (transaction) => {
    const profileRef = db.collection("profiles").doc(userId);
    const profileSnap = await transaction.get(profileRef);
    if (!profileSnap.exists) throw new Error(`User profile ${userId} not found`);
    
    const currentBalance = profileSnap.data()?.currencies?.notepunkte || 0;
    const newBalance = currentBalance + amount;
    transaction.update(profileRef, { "currencies.notepunkte": newBalance });
    return newBalance;
  });
  return { success: true, newBalance: result };
}

/**
 * Utility: Subtract NP with balance validation
 * @returns { success: boolean, newBalance: number, error?: string }
 */
export async function subtractNotepunkte(userId: string, amount: number): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (amount < 0) throw new Error("Amount must be >= 0");
  const db = getFirestore("abi-data");
  try {
    const result = await db.runTransaction(async (transaction) => {
      const profileRef = db.collection("profiles").doc(userId);
      const profileSnap = await transaction.get(profileRef);
      if (!profileSnap.exists) throw new Error(`User profile ${userId} not found`);
      
      const currentBalance = profileSnap.data()?.currencies?.notepunkte || 0;
      if (currentBalance < amount) {
        return { success: false, error: `Insufficient NP balance. Required: ${amount}, Available: ${currentBalance}` };
      }
      
      const newBalance = currentBalance - amount;
      transaction.update(profileRef, { "currencies.notepunkte": newBalance });
      return { success: true, newBalance };
    });
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
