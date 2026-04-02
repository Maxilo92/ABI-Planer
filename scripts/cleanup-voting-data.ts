import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Cleanup Script: Wipe avg_rating and vote_count from teachers, 
 * delete teacher_ratings collection, and remove rated_teachers from user profiles.
 * 
 * Usage: npx ts-node scripts/cleanup-voting-data.ts
 */

// Initialize Firebase Admin
try {
  initializeApp({
    credential: applicationDefault(),
  });
} catch (error) {
  console.log('Firebase Admin already initialized or failed to initialize.');
}

const db = getFirestore("abi-data");

async function cleanupVotingData() {
  console.log('Starting cleanup of legacy voting data...');

  try {
    // 1. Wipe avg_rating and vote_count from all teachers
    console.log('Wiping avg_rating/vote_count from teachers...');
    const teachersSnap = await db.collection('teachers').get();
    const teacherBatch = db.batch();
    let teacherCount = 0;

    teachersSnap.docs.forEach(doc => {
      teacherBatch.update(doc.ref, {
        avg_rating: 0,
        vote_count: 0
      });
      teacherCount++;
    });

    if (teacherCount > 0) {
      await teacherBatch.commit();
    }
    console.log(`Successfully reset ${teacherCount} teachers.`);

    // 2. Remove rated_teachers from all user profiles
    console.log('Removing rated_teachers from all user profiles...');
    const profilesSnap = await db.collection('profiles').get();
    const profileBatch = db.batch();
    let profileCount = 0;

    profilesSnap.docs.forEach(doc => {
      // FieldValue.delete() removes the field from the document
      profileBatch.update(doc.ref, {
        rated_teachers: FieldValue.delete()
      });
      profileCount++;
    });

    if (profileCount > 0) {
      await profileBatch.commit();
    }
    console.log(`Successfully updated ${profileCount} user profiles.`);

    // 3. Delete the teacher_ratings collection
    console.log('Deleting teacher_ratings collection...');
    const ratingsSnap = await db.collection('teacher_ratings').get();
    
    // Deleting in batches of 500 (Firestore batch limit)
    let deletedRatingsCount = 0;
    const allRatingDocs = ratingsSnap.docs;
    
    for (let i = 0; i < allRatingDocs.length; i += 500) {
      const batch = db.batch();
      const chunk = allRatingDocs.slice(i, i + 500);
      chunk.forEach(doc => {
        batch.delete(doc.ref);
        deletedRatingsCount++;
      });
      await batch.commit();
      console.log(`Deleted ${deletedRatingsCount} ratings...`);
    }
    
    console.log(`Successfully deleted ${deletedRatingsCount} rating documents.`);

    console.log('Cleanup complete!');
    console.log('Summary:');
    console.log(`- Teachers reset: ${teacherCount}`);
    console.log(`- Profiles updated: ${profileCount}`);
    console.log(`- Ratings deleted: ${deletedRatingsCount}`);

  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupVotingData().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error during cleanup:', err);
  process.exit(1);
});
