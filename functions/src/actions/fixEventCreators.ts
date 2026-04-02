import { getFirestore } from "firebase-admin/firestore";

/**
 * Retroactively fix 'Unknown' creator names for existing events.
 * Iterates through all events and updates 'created_by_name' if it's missing or 'Unbekannt'.
 */
export async function fixEventCreators() {
  const db = getFirestore("abi-data");
  const eventsRef = db.collection("events");
  const profilesRef = db.collection("profiles");
  
  const snapshot = await eventsRef.get();
  
  if (snapshot.empty) {
    console.log("No events found to fix.");
    return;
  }

  const batchSize = 500;
  let batch = db.batch();
  let count = 0;
  let fixedCount = 0;

  // Cache for profile names to avoid redundant fetches
  const profileNameCache: Record<string, string> = {};

  for (const eventDoc of snapshot.docs) {
    const eventData = eventDoc.data();
    const createdBy = eventData.created_by;
    const currentName = eventData.created_by_name;

    if (!createdBy) continue;

    // Only fix if name is missing or generic
    if (!currentName || currentName === "Unbekannt" || currentName === "Unknown") {
      let nameToSet = "Unbekannt";

      if (profileNameCache[createdBy]) {
        nameToSet = profileNameCache[createdBy];
      } else {
        const profileSnap = await profilesRef.doc(createdBy).get();
        if (profileSnap.exists) {
          const profileData = profileSnap.data();
          nameToSet = profileData?.full_name || profileData?.email || "Unbekannt";
          profileNameCache[createdBy] = nameToSet;
        }
      }

      if (nameToSet !== currentName) {
        batch.update(eventDoc.ref, { created_by_name: nameToSet });
        fixedCount++;
        count++;

        if (count % batchSize === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }
    }
  }

  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`Successfully updated ${fixedCount} events with creator names.`);
  return { fixedCount };
}
