import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export type LogActionType = 
  | 'FEEDBACK_CREATED'
  | 'VOTE_CAST'
  | 'FINANCE_ADDED'
  | 'FINANCE_EDITED'
  | 'FINANCE_DELETED'
  | 'TODO_CREATED'
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
  | 'PROFILE_UPDATED'
  | 'GROUP_MEMBER_ADDED'
  | 'GROUP_MEMBER_REMOVED'
  | 'GROUP_LEADER_ASSIGNED'

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
export const logAction = async (
  action: LogActionType,
  userId: string,
  userName?: string | null,
  details?: any
) => {
  try {
    await addDoc(collection(db, 'logs'), {
      action,
      user_id: userId,
      user_name: userName || null,
      details: details || null,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    // We don't want logging to break the app, but we should know if it fails
    console.error(`[Logging] Failed to log action ${action}:`, error)
  }
}
