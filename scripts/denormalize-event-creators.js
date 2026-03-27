// scripts/denormalize-event-creators.js
// Migration script: Add created_by_name to all events by fetching it from profiles
// Usage: node scripts/denormalize-event-creators.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

// Initialize with application default credentials or a service account
// For local use, you might need: GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
initializeApp();

const db = getFirestore();

async function denormalizeEventCreators() {
  console.log('Starting denormalization of event creators...');
  
  const eventsRef = db.collection('events');
  const eventsSnapshot = await eventsRef.get();
  
  if (eventsSnapshot.empty) {
    console.log('No events found.');
    return;
  }

  console.log(`Found ${eventsSnapshot.size} events to process.`);

  // Cache profiles to avoid redundant reads
  const profileCache = new Map();
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const eventDoc of eventsSnapshot.docs) {
    const eventData = eventDoc.data();
    const eventId = eventDoc.id;
    const creatorId = eventData.created_by;

    if (!creatorId) {
      console.warn(`Event ${eventId} has no created_by field. Skipping.`);
      skippedCount++;
      continue;
    }

    if (eventData.created_by_name) {
      console.log(`Event ${eventId} already has created_by_name. Skipping.`);
      skippedCount++;
      continue;
    }

    try {
      let creatorName = profileCache.get(creatorId);

      if (!creatorName) {
        const profileDoc = await db.collection('profiles').doc(creatorId).get();
        if (profileDoc.exists) {
          creatorName = profileDoc.data().full_name || 'Unbekannt';
          profileCache.set(creatorId, creatorName);
        } else {
          console.warn(`Profile ${creatorId} not found for event ${eventId}. Using "Unbekannt".`);
          creatorName = 'Unbekannt';
          profileCache.set(creatorId, creatorName);
        }
      }

      await eventDoc.ref.update({
        created_by_name: creatorName
      });

      console.log(`Updated event ${eventId} with creator name: ${creatorName}`);
      updatedCount++;
    } catch (error) {
      console.error(`Failed to update event ${eventId}:`, error);
      errorCount++;
    }
  }

  console.log('\nDenormalization complete:');
  console.log(`- Updated: ${updatedCount}`);
  console.log(`- Skipped: ${skippedCount}`);
  console.log(`- Errors:  ${errorCount}`);
}

denormalizeEventCreators().catch(err => {
  console.error('Denormalization script failed:', err);
  process.exit(1);
});
