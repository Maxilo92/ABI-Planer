import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import { getFirestore } from "firebase-admin/firestore"

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = getFirestore("abi-data")

interface UserTeacher {
  [teacherId: string]: {
    count: number;
    variants?: Record<string, number>;
  };
}

export const runGlobalRaritySync = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.')
  }

  const callerProfileRef = db.collection('profiles').doc(request.auth.uid)
  const callerProfileDoc = await callerProfileRef.get()
  
  const role = callerProfileDoc.data()?.role
  if (!['admin', 'admin_main', 'admin_co'].includes(role)) {
    throw new HttpsError('permission-denied', 'Must be an administrative user to call this function.')
  }

  try {
    const settingsRef = db.collection('settings').doc('sammelkarten')
    const settingsSnap = await settingsRef.get()
    if (!settingsSnap.exists) {
      throw new HttpsError('not-found', 'Sammelkarten settings not found.')
    }
    const settings = settingsSnap.data() as any

    const teachers = settings.loot_teachers || []
    const teacherRarityMap = new Map(
      teachers.map((t: any) => [t.id, t.rarity])
    )
    
    // Get all user inventories
    const userInventoriesSnap = await db.collection('user_teachers').get()

    const batch = db.batch()
    let changedCount = 0

    for (const userDoc of userInventoriesSnap.docs) {
      const userId = userDoc.id
      const userInventory = userDoc.data() as UserTeacher
      
      const newInventory: UserTeacher = {}
      let inventoryChanged = false

      for (const teacherId in userInventory) {
        const currentData = userInventory[teacherId]
        const newRarity = teacherRarityMap.get(teacherId)

        if (!newRarity) { // Teacher no longer exists in pool
          inventoryChanged = true
          continue 
        }

        // Keep the card with updated rarity info if needed
        newInventory[teacherId] = currentData;
      }

      if (inventoryChanged) {
        batch.set(db.collection('user_teachers').doc(userId), newInventory)
        changedCount++
      }
    }

    await batch.commit()

    const message = `Global rarity synchronization completed. ${changedCount} user inventories updated.`
    
    // Log entry for admin
    await db.collection('logs').add({
      type: 'ADMIN_ACTION',
      action: 'GLOBAL_RARITY_SYNC',
      user_id: request.auth.uid,
      user_name: callerProfileDoc.data()?.full_name || 'Unknown Admin',
      timestamp: new Date(),
      details: message
    })

    return { success: true, message }
  } catch (error) {
    throw error
  }
})

