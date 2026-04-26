import { db } from './src/lib/firebase'
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore'

async function migrateReferralCodes() {
  console.log('Starting migration of referral codes...')
  const profilesRef = collection(db, 'profiles')
  const snapshot = await getDocs(profilesRef)
  
  let batch = writeBatch(db)
  let count = 0
  let totalMigrated = 0

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()
    if (!data.referral_code) {
      batch.update(doc(db, 'profiles', docSnap.id), {
        referral_code: docSnap.id.slice(0, 8)
      })
      count++
      totalMigrated++
    }

    if (count >= 400) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
      console.log(`Committed ${totalMigrated} profiles...`)
    }
  }

  if (count > 0) {
    await batch.commit()
  }

  console.log(`Finished! Migrated ${totalMigrated} profiles.`)
}

migrateReferralCodes().catch(console.error)
