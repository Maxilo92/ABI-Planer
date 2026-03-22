import * as admin from "firebase-admin";

/**
 * Wipe all teacher cards for a specific user.
 * Deletes the document with the user's 'uid' in the 'user_teachers' collection.
 */
export async function wipeUserCards(uid: string) {
  if (!uid) {
    throw new Error("UID is required for wipeUserCards action.");
  }

  const userTeachersRef = admin.firestore().collection("user_teachers").doc(uid);
  
  await userTeachersRef.delete();

  console.log(`Successfully deleted user_teachers document for UID: ${uid}.`);
}
