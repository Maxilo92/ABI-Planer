// scripts/migrate-events.js
// Migration script: Rename event_date to start_date and set end_date = start_date for all events
// Usage: node scripts/migrate-events.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function migrateEvents() {
  const eventsRef = db.collection('events');
  const snapshot = await eventsRef.get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.event_date && !data.start_date) {
      await doc.ref.update({
        start_date: data.event_date,
        end_date: data.event_date,
        event_date: admin.firestore.FieldValue.delete(),
      });
      updated++;
      console.log(`Migrated event ${doc.id}`);
    }
  }
  console.log(`Migration complete. Updated ${updated} events.`);
}

migrateEvents().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
