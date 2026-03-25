import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Migration Script: Migrate loot_teachers from settings/global to settings/sammelkarten
 * and initialize rarity_weights and variant_probabilities.
 * 
 * Usage: npx ts-node scripts/migrate_card_settings.ts
 */

// Initialize Firebase Admin
// Make sure GOOGLE_APPLICATION_CREDENTIALS points to your service account key file
// or you are logged in via Firebase CLI (applicationDefault works in many environments)
try {
  initializeApp({
    credential: applicationDefault(),
  });
} catch (error) {
  // If already initialized (common during some local execution scenarios)
  console.log('Firebase Admin already initialized or failed to initialize.');
}

const db = getFirestore();

async function migrateCardSettings() {
  console.log('Starting migration of card settings...');

  const globalRef = db.collection('settings').doc('global');
  const sammelkartenRef = db.collection('settings').doc('sammelkarten');

  try {
    const globalDoc = await globalRef.get();
    
    let lootTeachers = [];
    if (globalDoc.exists) {
      const data = globalDoc.data();
      lootTeachers = data?.loot_teachers || [];
      console.log(`Found ${lootTeachers.length} teachers in settings/global.`);
    } else {
      console.log('Warning: settings/global document not found. Using empty array for loot_teachers.');
    }

    const rarityWeights = {
      common: 50,
      rare: 30,
      epic: 15,
      legendary: 5,
      mythic: 0
    };

    const variantProbabilities = {
      shiny: 150,
      holo: 50,
      black_shiny_holo: 1000
    };

    console.log('Writing to settings/sammelkarten...');
    
    await sammelkartenRef.set({
      loot_teachers: lootTeachers,
      rarity_weights: rarityWeights,
      variant_probabilities: variantProbabilities,
      migrated_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('Migration successful!');
    console.log('Summary:');
    console.log(`- Teachers migrated: ${lootTeachers.length}`);
    console.log('- Rarity weights set:', JSON.stringify(rarityWeights));
    console.log('- Variant probabilities set:', JSON.stringify(variantProbabilities));

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateCardSettings().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error during migration:', err);
  process.exit(1);
});
