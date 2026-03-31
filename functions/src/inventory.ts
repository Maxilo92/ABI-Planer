import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { LootTeacher, TeacherRarity, Settings, UserTeacher } from '../../src/types/database'
import { applyRarityLimits } from './rarity'
import { regionales_settings } from './_settings'

const db = admin.firestore()

export const runGlobalRaritySync = functions
  .region(regionales_settings.project_region)
  .https.onCall(async (data, context) => {
    if (!context.auth || !['admin', 'admin_main'].includes(context.auth.token.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Nur Admins können diese Funktion ausführen.')
    }

    const settingsRef = db.collection('settings').doc('sammelkarten')
    const settingsSnap = await settingsRef.get()
    if (!settingsSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Sammelkarten-Einstellungen nicht gefunden.')
    }
    const settings = settingsSnap.data() as Settings

    const teachers = settings.loot_teachers || []
    const globalLimits = settings.rarity_limits
    const userLimits = settings.per_user_card_limits

    if (!globalLimits || !userLimits) {
      throw new functions.https.HttpsError('failed-precondition', 'Seltenheits-Limits (global oder pro Nutzer) sind nicht gesetzt.')
    }

    // 1. Globale Seltenheiten neu berechnen
    const { updatedTeachers, changes } = applyRarityLimits(teachers, globalLimits)
    if (changes.length > 0) {
      await settingsRef.update({ loot_teachers: updatedTeachers })
    }
    
    const teacherRarityMap = new Map<string, TeacherRarity>(updatedTeachers.map(t => [t.id, t.rarity]))
    
    // 2. Alle Nutzer-Inventare durchgehen
    const profilesSnap = await db.collection('profiles').get()
    const userInventoriesSnap = await db.collection('user_teachers').get()
    
    let compensatedUsersCount = 0
    const compensationLog: string[] = []

    const batch = db.batch()

    for (const userDoc of userInventoriesSnap.docs) {
      const userId = userDoc.id
      const userInventory = userDoc.data() as UserTeacher
      let userWasCompensated = false
      
      const newInventory: UserTeacher = {}
      let inventoryChanged = false

      for (const teacherId in userInventory) {
        const currentData = userInventory[teacherId]
        const newRarity = teacherRarityMap.get(teacherId)

        if (!newRarity) { // Lehrer existiert nicht mehr im Pool
          inventoryChanged = true
          continue 
        }

        const limitForRarity = userLimits[newRarity]
        
        if (currentData.count > limitForRarity) {
          inventoryChanged = true
          userWasCompensated = true
          newInventory[teacherId] = { ...currentData, count: limitForRarity };
          compensationLog.push(`Nutzer ${userId} verliert ${currentData.count - limitForRarity}x '${teacherId}' (${newRarity})`)
        } else {
          newInventory[teacherId] = currentData;
        }
      }

      if (inventoryChanged) {
        batch.set(db.collection('user_teachers').doc(userId), newInventory)
      }
      
      if (userWasCompensated) {
        compensatedUsersCount++
        const profileRef = db.collection('profiles').doc(userId)
        batch.update(profileRef, { 'booster_stats.extra_available': admin.firestore.FieldValue.increment(1) })
      }
    }

    await batch.commit()

    const message = `Globale Synchronisierung abgeschlossen. ${changes.length} Lehrer-Seltenheiten aktualisiert. ${compensatedUsersCount} Nutzer für Kartenverluste mit 1 Pack entschädigt.`
    console.log(message, { compensationLog })
    
    // Log-Eintrag für den Admin erstellen
    const adminProfile = profilesSnap.docs.find(doc => doc.id === context.auth?.uid)?.data()
    await db.collection('logs').add({
      type: 'ADMIN_ACTION',
      action: 'GLOBAL_RARITY_SYNC',
      user_id: context.auth?.uid,
      user_name: adminProfile?.full_name || 'Unbekannter Admin',
      timestamp: new Date(),
      details: message,
      full_log: compensationLog
    })

    return { success: true, message }
  })
