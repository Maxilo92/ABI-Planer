import { getFirestore } from "firebase-admin/firestore";

/**
 * Wipe the entire teacher database (the card pool).
 * Deletes all documents in the 'teachers' collection (voting/rarity data).
 * Also resets the global settings teacher list.
 * This effectively makes the app "empty" until new teachers are added.
 */
export async function wipeTeacherDatabase() {
  const collections = ["teachers", "user_teachers"]; // Cannot have cards for non-existent teachers
  
  for (const collectionName of collections) {
    const collectionRef = getFirestore("abi-data").collection(collectionName);
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) continue;

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
    console.log(`Deleted ${count} documents from ${collectionName}.`);
  }

  // Also clear the pool in settings/config
  const settingsRef = getFirestore("abi-data").collection("settings").doc("config");
  await settingsRef.update({
    teachers: []
  });

  console.log("Teacher database wiped and settings cleared.");
}
