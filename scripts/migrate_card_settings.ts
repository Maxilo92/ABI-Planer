import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Migration Script: Migrate loot_teachers from settings/global to settings/sammelkarten
 * and initialize rarity_weights, godpack_weights, and variant_probabilities.
 * 
 * Usage: npx ts-node scripts/migrate_card_settings.ts
 */

// Initialize Firebase Admin
try {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'abi-planer-75319';
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
} catch (error) {
  console.log('Firebase Admin already initialized or failed to initialize.');
}

const db = getFirestore('abi-data');

function logMigrationError(step: string, error: unknown) {
  const err = error as {
    code?: string;
    name?: string;
    message?: string;
    stack?: string;
    details?: unknown;
  };

  console.error(`[Migration][${step}] failed`);
  console.error(`[Migration][${step}] name:`, err?.name || 'unknown');
  console.error(`[Migration][${step}] code:`, err?.code || 'unknown');
  console.error(`[Migration][${step}] message:`, err?.message || String(error));

  if (err?.details !== undefined) {
    console.error(`[Migration][${step}] details:`, err.details);
  }

  if (err?.stack) {
    console.error(`[Migration][${step}] stack:`, err.stack);
  }
}

async function migrateCardSettings() {
  console.log('Starting migration of card settings...');

  const globalRef = db.collection('settings').doc('global');
  const sammelkartenRef = db.collection('settings').doc('sammelkarten');

  try {
    console.log('[Migration][Step 1] Reading settings/global');
    const globalDoc = await globalRef.get();
    
    let lootTeachers = [];
    if (globalDoc.exists) {
      const data = globalDoc.data();
      lootTeachers = data?.loot_teachers || [];
      console.log(`Found ${lootTeachers.length} teachers in settings/global.`);
    } else {
      console.log('Warning: settings/global document not found. Using empty array for loot_teachers.');
    }

    // Default Regular Weights for 3 slots
    const rarityWeights = [
      { common: 0.8, rare: 0.15, epic: 0.04, mythic: 0.008, legendary: 0.002 },
      { common: 0.6, rare: 0.25, epic: 0.11, mythic: 0.03, legendary: 0.01 },
      { common: 0.4, rare: 0.35, epic: 0.17, mythic: 0.06, legendary: 0.02 }
    ];

    // Default Godpack Weights for 3 slots
    const godpackWeights = [
      { common: 0, rare: 0.4, epic: 0.35, mythic: 0.15, legendary: 0.10 },
      { common: 0, rare: 0.2, epic: 0.4, mythic: 0.25, legendary: 0.15 },
      { common: 0, rare: 0, epic: 0.4, mythic: 0.4, legendary: 0.2 }
    ];

    // Variant Probabilities (converted to 0-1 range where needed, but using integers for now to match simulator needs)
    const variantProbabilities = {
      shiny: 0.05,
      holo: 0.15,
      black_shiny_holo: 0.005
    };

    const globalLimits = {
      daily_allowance: 2,
      reset_hour: 9,
      godpack_chance: 0.005 // 1/200
    };

    console.log('[Migration][Step 2] Writing to settings/sammelkarten...');
    
    await sammelkartenRef.set({
      loot_teachers: lootTeachers,
      rarity_weights: rarityWeights,
      godpack_weights: godpackWeights,
      variant_probabilities: variantProbabilities,
      global_limits: globalLimits,
      migrated_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('[Migration] Migration successful!');
    console.log('Summary:');
    console.log(`- Teachers migrated: ${lootTeachers.length}`);
    console.log('- Regular weights set (3 slots)');
    console.log('- Godpack weights set (3 slots)');
    console.log('- Global limits set:', JSON.stringify(globalLimits));

  } catch (error) {
    logMigrationError('general', error);
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
