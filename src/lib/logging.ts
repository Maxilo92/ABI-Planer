import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export type LogActionType = 
  | 'ACCOUNT_CREATED'
  | 'FEEDBACK_CREATED'
  | 'FEEDBACK_UPDATED'
  | 'FEEDBACK_DELETED'
  | 'VOTE_CAST'
  | 'FINANCE_ADDED'
  | 'FINANCE_EDITED'
  | 'FINANCE_DELETED'
  | 'TODO_DELETED'
  | 'TODO_CREATED'
  | 'SUBTODO_CREATED'
  | 'TODO_EDITED'
  | 'TODO_COMPLETED'
  | 'EVENT_CREATED'
  | 'EVENT_EDITED'
  | 'EVENT_DELETED'
  | 'NEWS_CREATED'
  | 'NEWS_EDITED'
  | 'NEWS_DELETED'
  | 'POLL_CREATED'
  | 'POLL_EDITED'
  | 'POLL_DELETED'
  | 'SETTINGS_UPDATED'
  | 'GLOBAL_SETTINGS_UPDATED'
  | 'PROFILE_UPDATED'
  | 'PROFILE_DELETED'
  | 'GROUP_MEMBER_ADDED'
  | 'GROUP_MEMBER_REMOVED'
  | 'GROUP_LEADER_ASSIGNED'
  | 'GROUP_MESSAGE_CREATED'
  | 'GROUP_MESSAGE_DELETED'
  | 'GROUP_MESSAGE_PINNED'
  | 'FEEDBACK_SUBMIT'
  | 'LOOT_TEACHER'
  | 'LOOT_BOOSTER'
  | 'LOOT_MASS_BOOSTER'
  | 'NEWS_REACTION'
  | 'NEWS_COMMENT'
  | 'TEACHERS_BULK_IMPORT'
  | 'TEACHERS_RARITY_SYNC'
  | 'TEACHER_VOTE'
  | 'BOOSTER_GIFT_SENT'
  | 'CARDS_MIGRATED'
  | 'CARDS_BULK_IMPORT'
  | 'DANGER_ACTION_QUEUED'
  | 'DANGER_ACTION_CANCELLED'
  | 'DANGER_ACTION_EXECUTED'
  | 'DANGER_ACTION_FAILED'
  | 'CLEANUP_INVENTORIES'
  | 'CLEANUP_POOL'

export interface LogEntry {
  action: LogActionType
  user_id: string
  user_name?: string | null
  details?: any
  timestamp: any // serverTimestamp
}

/**
 * Logs a significant action to the Firestore 'logs' collection.
 */
import { doc, getDoc } from 'firebase/firestore'

/**
 * Logs a significant action to the Firestore 'logs' collection.
 * Falls userName nicht übergeben wird, wird er aus Firestore geladen.
 */
export const logAction = async (
  action: LogActionType,
  userId: string,
  userName?: string | null,
  details?: any
) => {
  let resolvedName = userName
  try {
    if (!resolvedName) {
      // Versuche, den Namen aus Firestore zu laden
      const profileSnap = await getDoc(doc(db, 'profiles', userId))
      if (profileSnap.exists()) {
        resolvedName = profileSnap.data().full_name || null
      }
    }
    await addDoc(collection(db, 'logs'), {
      action,
      user_id: userId,
      user_name: resolvedName || null,
      details: details || null,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    // We don't want logging to break the app, but we should know if it fails
    console.error(`[Logging] Failed to log action ${action}:`, error)
  }
}
