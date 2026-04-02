import { getFirestore } from "firebase-admin/firestore";

/**
 * Wipe all teacher cards from all users.
 * Deletes all documents in the 'user_teachers' collection.
 */
export async function emptyAllAlbums() {
  const collectionRef = getFirestore("abi-data").collection("user_teachers");
  
  // Use recursiveDelete if available, or batch delete
  // For simplicity and safety with small-to-medium datasets, we use a batch delete pattern.
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log("No teacher cards to delete.");
    return;
  }

  const batchSize = 500;
  let batch = getFirestore("abi-data").batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;

    if (count % batchSize === 0) {
      await batch.commit();
      batch = getFirestore("abi-data").batch();
    }
  }

  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`Successfully deleted ${count} user_teachers documents.`);
}
