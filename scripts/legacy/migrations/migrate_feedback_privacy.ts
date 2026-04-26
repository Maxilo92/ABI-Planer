import { db } from './src/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function migrateFeedback() {
  console.log('Starting feedback migration...');
  const feedbackRef = collection(db, 'feedback');
  const snapshot = await getDocs(feedbackRef);
  
  let migratedCount = 0;
  for (const feedbackDoc of snapshot.docs) {
    const data = feedbackDoc.data();
    const updates: any = {};
    
    if (data.is_private === undefined) {
      updates.is_private = false;
    }
    if (data.is_anonymous === undefined) {
      updates.is_anonymous = false;
    }
    
    // Fix image field if it exists but image_url doesn't
    if (data.image?.url && !data.image_url) {
      updates.image_url = data.image.url;
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'feedback', feedbackDoc.id), updates);
      migratedCount++;
    }
  }
  
  console.log(`Migration finished. ${migratedCount} documents updated.`);
}

// Note: This script is intended to be run manually or as a one-time operation.
// migrateFeedback().catch(console.error);
