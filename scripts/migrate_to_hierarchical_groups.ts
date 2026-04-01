import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Migration Script: Transition planning groups to hierarchical format
 * and update profiles to use array-based planning_groups and led_groups.
 * 
 * Usage: npx ts-node scripts/migrate_to_hierarchical_groups.ts
 */

// Initialize Firebase Admin
try {
  initializeApp({
    credential: applicationDefault(),
  });
} catch (error) {
  console.log('Firebase Admin already initialized or failed to initialize.');
}

const db = getFirestore();

async function migrateToHierarchicalGroups() {
  console.log('Starting migration to hierarchical groups...');

  const configRef = db.collection('settings').doc('config');
  const profilesRef = db.collection('profiles');

  try {
    // 1. Initialize Settings
    console.log('Step 1: Initializing Settings in settings/config...');
    const configDoc = await configRef.get();
    
    if (!configDoc.exists) {
      console.error('Error: settings/config document not found.');
      process.exit(1);
    }

    const configData = configDoc.data();
    let planningGroups = configData?.planning_groups || [];
    console.log(`Found ${planningGroups.length} existing planning groups.`);

    // Ensure "Ballplanung" and "FinanzTeam" exist
    const defaultParentGroups = ['Ballplanung', 'FinanzTeam'];
    
    for (const groupName of defaultParentGroups) {
      const exists = planningGroups.find((g: any) => g.name === groupName);
      if (!exists) {
        console.log(`Adding missing parent group: ${groupName}`);
        planningGroups.push({
          name: groupName,
          leader_user_id: null,
          leader_name: null,
          is_parent: true,
          parent_name: null
        });
      }
    }

    // Update all groups with is_parent and parent_name if missing
    planningGroups = planningGroups.map((group: any) => {
      const isParent = defaultParentGroups.includes(group.name);
      return {
        ...group,
        is_parent: group.is_parent !== undefined ? group.is_parent : isParent,
        parent_name: group.parent_name !== undefined ? group.parent_name : null
      };
    });

    await configRef.update({ planning_groups: planningGroups });
    console.log('Settings updated successfully.');

    // 2. Migrate Profiles
    console.log('Step 2: Migrating Profiles...');
    const profilesSnapshot = await profilesRef.get();
    console.log(`Found ${profilesSnapshot.size} profiles to process.`);

    let updatedCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of profilesSnapshot.docs) {
      const profileData = doc.data();
      const updates: any = {};
      let needsUpdate = false;

      // Old string field
      const oldPlanningGroup = profileData.planning_group;
      
      // New array field
      let currentPlanningGroups = profileData.planning_groups;
      if (!Array.isArray(currentPlanningGroups)) {
        currentPlanningGroups = [];
        // If old field exists and new doesn't, migrate it
        if (typeof oldPlanningGroup === 'string' && oldPlanningGroup.trim() !== '') {
          currentPlanningGroups = [oldPlanningGroup];
        }
        updates.planning_groups = currentPlanningGroups;
        needsUpdate = true;
      }

      // Led groups
      let currentLedGroups = profileData.led_groups;
      if (!Array.isArray(currentLedGroups)) {
        currentLedGroups = [];
        
        // Check if user is a group leader
        if (profileData.is_group_leader === true) {
          // Find which group the user leads in settings/config
          const ledGroup = planningGroups.find((g: any) => g.leader_user_id === doc.id);
          if (ledGroup) {
            currentLedGroups = [ledGroup.name];
          }
        }
        updates.led_groups = currentLedGroups;
        needsUpdate = true;
      }

      // Remove old field if it exists
      if (oldPlanningGroup !== undefined) {
        updates.planning_group = FieldValue.delete();
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(doc.ref, updates);
        batchCount++;
        updatedCount++;

        if (batchCount === 500) {
          await batch.commit();
          console.log(`Committed batch of 500 profiles. Total updated: ${updatedCount}`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch. Total updated: ${updatedCount}`);
    }

    console.log('Migration completed successfully!');
    console.log('Summary:');
    console.log(`- Planning groups initialized in settings/config: ${planningGroups.length}`);
    console.log(`- Profiles updated: ${updatedCount}`);

    // Verify a few profiles
    const sampleSize = Math.min(3, profilesSnapshot.size);
    if (sampleSize > 0) {
      console.log('\nVerification Samples:');
      const sampleDocs = await profilesRef.limit(sampleSize).get();
      sampleDocs.forEach(d => {
        const data = d.data();
        console.log(`Profile ${d.id}:`, {
          planning_groups: data.planning_groups,
          led_groups: data.led_groups,
          has_old_field: data.planning_group !== undefined
        });
      });
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateToHierarchicalGroups().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error during migration:', err);
  process.exit(1);
});
