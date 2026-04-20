import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import * as admin from "firebase-admin";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

const db = getFirestore("abi-data");

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

export const adminReviewTask = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  try {
    const { taskId, action, rejectedReason } = request.data as {
      taskId?: unknown;
      action?: unknown;
      rejectedReason?: unknown;
    };

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Nutzer nicht angemeldet.");
    }

    if (typeof taskId !== "string" || taskId.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Ungültige taskId.");
    }

    if (action !== "approve" && action !== "reject") {
      throw new HttpsError("invalid-argument", "Ungültige Aktion.");
    }

    // Verify Admin role
    const adminProfile = await db.collection("profiles").doc(request.auth.uid).get();
    const adminRole = adminProfile.data()?.role;
    if (!["admin", "admin_main", "admin_co"].includes(adminRole)) {
      throw new HttpsError("permission-denied", "Nur Admins können Aufgaben prüfen.");
    }

    const taskDoc = await db.collection("tasks").doc(taskId).get();
    if (!taskDoc.exists) {
      throw new HttpsError("not-found", "Aufgabe nicht gefunden.");
    }

    const taskData = taskDoc.data() as Task;
    if (taskData.status !== "in_review") {
      throw new HttpsError("failed-precondition", "Aufgabe ist nicht im Status 'in_review'.");
    }

    const assigneeId = taskData.assignee_id;
    if (!assigneeId) {
      throw new HttpsError("failed-precondition", "Aufgabe hat keinen Bearbeiter.");
    }

    const rewardBoosters = Number(taskData.reward_boosters);
    const safeRewardBoosters = Number.isFinite(rewardBoosters) && rewardBoosters >= 0 ? rewardBoosters : 0;

    if (action === "approve") {
      // 1. Update Profile: Award boosters and increment task count
      const profileRef = db.collection("profiles").doc(assigneeId);

      await db.runTransaction(async (transaction) => {
        const profileDoc = await transaction.get(profileRef);
        if (!profileDoc.exists) {
          throw new HttpsError("not-found", "Profil des Bearbeiters nicht gefunden.");
        }

        transaction.update(profileRef, {
          "booster_stats.extra_available": FieldValue.increment(safeRewardBoosters),
          "task_stats.completed_count": FieldValue.increment(1),
          "task_stats.earned_boosters": FieldValue.increment(safeRewardBoosters),
        });

        // 2. Update Task Status
        transaction.update(db.collection("tasks").doc(taskId), {
          status: "completed",
          completed_at: FieldValue.serverTimestamp(),
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
    }

    if (typeof rejectedReason !== "string" || rejectedReason.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Bei Ablehnung ist eine Begründung erforderlich.");
    }

    await db.collection("tasks").doc(taskId).update({
      status: "rejected",
      rejected_reason: rejectedReason.trim(),
      rejected_at: FieldValue.serverTimestamp(),
      reviewed_by: request.auth.uid,
    });

    return { success: true, message: "Aufgabe abgelehnt." };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("adminReviewTask failed unexpectedly", {
      uid: request.auth?.uid ?? null,
      data: request.data ?? null,
      error,
    });
    throw new HttpsError("internal", "Interner Fehler bei der Aufgabenprüfung.");
  }
});
