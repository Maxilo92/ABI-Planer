import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { DocumentData } from 'firebase-admin/firestore';

/**
 * Migration Script: Restore German umlauts in visible teacher text fields.
 *
 * Scope:
 * - settings/sammelkarten.loot_teachers[*].name|description|attacks[*].name|description
 * - settings/sammelkarten.sets[*].cards[*].name|description|attacks[*].name|description
 *
 * Out of scope:
 * - Technical IDs (card IDs, set IDs)
 * - URL/file slugs
 *
 * Usage:
 * - Dry run (default): npx ts-node scripts/migrate_visible_teacher_umlauts.ts
 * - Apply changes:      npx ts-node scripts/migrate_visible_teacher_umlauts.ts --apply
 */

try {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT
    || process.env.GCLOUD_PROJECT
    || process.env.FIREBASE_PROJECT_ID
    || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    || 'abi-planer-75319';

  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
} catch (error) {
  console.log('Firebase Admin already initialized or failed to initialize.');
}

const db = getFirestore('abi-data');
const APPLY = process.argv.includes('--apply');

type MigrationChange = {
  path: string;
  before: string;
  after: string;
};

function restoreGermanUmlauts(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/AE/g, 'Ä')
    .replace(/OE/g, 'Ö')
    .replace(/UE/g, 'Ü')
    .replace(/Ae/g, 'Ä')
    .replace(/Oe/g, 'Ö')
    .replace(/Ue/g, 'Ü')
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü');
}

function normalizeString(value: unknown, path: string, changes: MigrationChange[]): string | unknown {
  if (typeof value !== 'string') return value;
  const converted = restoreGermanUmlauts(value);
  if (converted !== value) {
    changes.push({ path, before: value, after: converted });
  }
  return converted;
}

function normalizeAttacks(attacks: unknown, path: string, changes: MigrationChange[]): unknown {
  if (!Array.isArray(attacks)) return attacks;

  return attacks.map((attack, index) => {
    if (!attack || typeof attack !== 'object') return attack;

    const nextAttack = { ...(attack as Record<string, unknown>) };
    nextAttack.name = normalizeString(nextAttack.name, `${path}[${index}].name`, changes);
    nextAttack.description = normalizeString(nextAttack.description, `${path}[${index}].description`, changes);
    return nextAttack;
  });
}

function normalizeTeacher(teacher: unknown, path: string, changes: MigrationChange[]): unknown {
  if (!teacher || typeof teacher !== 'object') return teacher;

  const nextTeacher = { ...(teacher as Record<string, unknown>) };
  nextTeacher.name = normalizeString(nextTeacher.name, `${path}.name`, changes);
  nextTeacher.description = normalizeString(nextTeacher.description, `${path}.description`, changes);
  nextTeacher.attacks = normalizeAttacks(nextTeacher.attacks, `${path}.attacks`, changes);
  return nextTeacher;
}

function normalizeTeacherArray(arr: unknown, path: string, changes: MigrationChange[]): unknown {
  if (!Array.isArray(arr)) return arr;
  return arr.map((teacher, index) => normalizeTeacher(teacher, `${path}[${index}]`, changes));
}

function normalizeSammelkartenDoc(data: DocumentData): { nextData: DocumentData; changes: MigrationChange[] } {
  const changes: MigrationChange[] = [];
  const nextData: DocumentData = { ...data };

  if (Array.isArray(nextData.loot_teachers)) {
    nextData.loot_teachers = normalizeTeacherArray(nextData.loot_teachers, 'loot_teachers', changes);
  }

  if (nextData.sets && typeof nextData.sets === 'object') {
    const nextSets: Record<string, unknown> = { ...(nextData.sets as Record<string, unknown>) };

    for (const [setId, setValue] of Object.entries(nextSets)) {
      if (!setValue || typeof setValue !== 'object') continue;
      const nextSet = { ...(setValue as Record<string, unknown>) };
      nextSet.cards = normalizeTeacherArray(nextSet.cards, `sets.${setId}.cards`, changes);
      nextSets[setId] = nextSet;
    }

    nextData.sets = nextSets;
  }

  return { nextData, changes };
}

async function runMigration() {
  console.log(`[UmlautMigration] Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  const docRef = db.collection('settings').doc('sammelkarten');
  const snap = await docRef.get();

  if (!snap.exists) {
    console.error('[UmlautMigration] settings/sammelkarten not found.');
    process.exit(1);
  }

  const data = snap.data() || {};
  const { nextData, changes } = normalizeSammelkartenDoc(data);

  if (changes.length === 0) {
    console.log('[UmlautMigration] No visible text changes required.');
    return;
  }

  console.log(`[UmlautMigration] Detected ${changes.length} text changes.`);
  for (const change of changes.slice(0, 40)) {
    console.log(`- ${change.path}`);
    console.log(`  before: ${JSON.stringify(change.before)}`);
    console.log(`  after : ${JSON.stringify(change.after)}`);
  }

  if (changes.length > 40) {
    console.log(`[UmlautMigration] ... ${changes.length - 40} additional changes not shown.`);
  }

  if (!APPLY) {
    console.log('[UmlautMigration] Dry-run complete. Re-run with --apply to write changes.');
    return;
  }

  await docRef.set(
    {
      ...nextData,
      umlaut_text_migration_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log('[UmlautMigration] Changes written successfully.');
}

runMigration().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('[UmlautMigration] Failed:', error);
  process.exit(1);
});
