import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

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
