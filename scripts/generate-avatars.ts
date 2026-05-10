import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { generatePixelAvatar } from '../src/lib/avatar'

// Initialize Firebase Admin
try {
  initializeApp({
    credential: applicationDefault(),
  });
} catch (error) {
  console.log('Firebase Admin already initialized or failed to initialize.');
}

const db = getFirestore("abi-data");

async function run() {
  console.log('Starting avatar generation migration...')
  
  const profilesRef = db.collection('profiles')
  const snapshot = await profilesRef.get()
  
  if (snapshot.empty) {
    console.log('No profiles found.')
    return
  }
  
  console.log(`Found ${snapshot.size} profiles to update.`)
  
  let updatedCount = 0
  const batchSize = 100
  let batch = db.batch()
  let operationCount = 0

  for (const doc of snapshot.docs) {
    const avatarDataUrl = generatePixelAvatar()
    batch.update(doc.ref, { photo_url: avatarDataUrl })
    operationCount++
    updatedCount++

    if (operationCount >= batchSize) {
      await batch.commit()
      console.log(`Committed batch of ${operationCount} updates...`)
      batch = db.batch()
      operationCount = 0
    }
  }

  if (operationCount > 0) {
    await batch.commit()
    console.log(`Committed final batch of ${operationCount} updates...`)
  }
  
  console.log(`Migration complete. Updated ${updatedCount} profiles with new pixel matrix avatars.`)
}

run().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error during migration:', err);
  process.exit(1);
});
