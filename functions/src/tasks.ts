import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

const db = admin.firestore();

/**
 * Local interface for Task to avoid shared type issues in Cloud Functions.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  reward_boosters: number;
  complexity: number;
  status: 'open' | 'claimed' | 'in_review' | 'completed' | 'rejected';
  task_image_urls: string[];
  assignee_id?: string | null;
  assignee_name?: string | null;
  claimed_at?: any;
  proof_media_url?: string | null;
  proof_media_type?: 'image' | 'video' | null;
  proof_storage_path?: string | null;
  submitted_at?: any;
  rejected_reason?: string | null;
  rejected_at?: any;
  completed_at?: any;
  reviewed_by?: string | null;
  created_by: string;
  created_at: any;
}

export const adminReviewTask = onCall(async (request) => {
  const { taskId, action, rejectedReason } = request.data as { 
    taskId: string; 
    action: 'approve' | 'reject'; 
    rejectedReason?: string;
  };

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Nutzer nicht angemeldet.");
  }

  // Verify Admin role
  const adminProfile = await db.collection("profiles").doc(request.auth.uid).get();
  const adminRole = adminProfile.data()?.role;
  if (!['admin', 'admin_main', 'admin_co'].includes(adminRole)) {
    throw new HttpsError("permission-denied", "Nur Admins können Aufgaben prüfen.");
  }

  const taskDoc = await db.collection("tasks").doc(taskId).get();
  if (!taskDoc.exists) {
    throw new HttpsError("not-found", "Aufgabe nicht gefunden.");
  }

  const taskData = taskDoc.data() as Task;
  if (taskData.status !== 'in_review') {
    throw new HttpsError("failed-precondition", "Aufgabe ist nicht im Status 'in_review'.");
  }

  const assigneeId = taskData.assignee_id;
  if (!assigneeId) {
    throw new HttpsError("failed-precondition", "Aufgabe hat keinen Bearbeiter.");
  }

  if (action === 'approve') {
    // 1. Update Profile: Award boosters and increment task count
    const profileRef = db.collection("profiles").doc(assigneeId);
    
    await db.runTransaction(async (transaction) => {
      const profileDoc = await transaction.get(profileRef);
      if (!profileDoc.exists) return;

      transaction.update(profileRef, {
        "booster_stats.extra_available": admin.firestore.FieldValue.increment(taskData.reward_boosters),
        "task_stats.completed_count": admin.firestore.FieldValue.increment(1),
        "task_stats.earned_boosters": admin.firestore.FieldValue.increment(taskData.reward_boosters),
      });

      // 2. Update Task Status
      transaction.update(db.collection("tasks").doc(taskId), {
        status: 'completed',
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        reviewed_by: request.auth?.uid,
      });
    });

    // 3. Delete Proof from Storage
    if (taskData.proof_storage_path) {
      try {
        const bucket = admin.storage().bucket();
        await bucket.file(taskData.proof_storage_path).delete();
        logger.info(`Deleted proof for task ${taskId} at ${taskData.proof_storage_path}`);
      } catch (error) {
        logger.error(`Failed to delete proof for task ${taskId}:`, error);
        // We don't throw here to ensure the DB update remains consistent
      }
    }

    return { success: true, message: "Aufgabe erfolgreich genehmigt." };
  } else {
    if (!rejectedReason) {
      throw new HttpsError("invalid-argument", "Bei Ablehnung ist eine Begründung erforderlich.");
    }

    await db.collection("tasks").doc(taskId).update({
      status: 'rejected',
      rejected_reason: rejectedReason,
      rejected_at: admin.firestore.FieldValue.serverTimestamp(),
      reviewed_by: request.auth.uid,
    });

    return { success: true, message: "Aufgabe abgelehnt." };
  }
});
