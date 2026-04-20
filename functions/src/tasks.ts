import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
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
  proof_text?: string | null;
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

    logger.info("adminReviewTask called", {
      taskId,
      action,
      adminUid: request.auth?.uid ?? "anonymous",
    });

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
      logger.info("task_review_approve_started", {
        taskId,
        assigneeUid: assigneeId,
        assigneeName: taskData.assignee_name,
        rewardBoosters: safeRewardBoosters,
        adminUid: request.auth.uid,
        adminRole,
      });

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

      logger.info("task_reward_granted", {
        taskId,
        assigneeUid: assigneeId,
        rewardBoosters: safeRewardBoosters,
        completedAt: new Date().toISOString(),
      });

      // 3. Delete Proof from Storage
      if (taskData.proof_storage_path) {
        try {
          const bucket = admin.storage().bucket();
          await bucket.file(taskData.proof_storage_path).delete();
          logger.info("task_proof_deleted", {
            taskId,
            proofStoragePath: taskData.proof_storage_path,
          });
        } catch (error) {
          logger.warn("task_proof_deletion_failed", {
            taskId,
            proofStoragePath: taskData.proof_storage_path,
            error: String(error),
          });
          // We don't throw here to ensure the DB update remains consistent
        }
      }

      logger.info("task_review_approve_completed", {
        taskId,
        assigneeUid: assigneeId,
      });

      return { success: true, message: "Aufgabe erfolgreich genehmigt." };
    }

    if (typeof rejectedReason !== "string" || rejectedReason.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Bei Ablehnung ist eine Begründung erforderlich.");
    }

    logger.info("task_review_reject_started", {
      taskId,
      assigneeUid: assigneeId,
      assigneeName: taskData.assignee_name,
      rejectedReason: rejectedReason.trim().substring(0, 200),
      adminUid: request.auth.uid,
      adminRole,
    });

    await db.collection("tasks").doc(taskId).update({
      status: "rejected",
      rejected_reason: rejectedReason.trim(),
      rejected_at: FieldValue.serverTimestamp(),
      reviewed_by: request.auth.uid,
    });

    logger.info("task_review_reject_completed", {
      taskId,
      assigneeUid: assigneeId,
      rejectionReason: rejectedReason.trim().substring(0, 200),
    });

    return { success: true, message: "Aufgabe abgelehnt." };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("task_review_failed", {
      uid: request.auth?.uid ?? null,
      data: request.data ?? null,
      error,
    });
    throw new HttpsError("internal", "Interner Fehler bei der Aufgabenprüfung.");
  }
});

/**
 * Track task lifecycle events (claim, submit proof, rejection).
 * Fires on any update to a task document to log status changes.
 */
export const trackTaskLifecycle = onDocumentWritten({
  document: "tasks/{taskId}",
  database: "abi-data",
}, async (event: any) => {
  const taskId = event.params.taskId;
  const beforeData = event.data?.before?.data() as Partial<Task> | undefined;
  const afterData = event.data?.after?.data() as Partial<Task> | undefined;

  // Ignore deletions
  if (!afterData) {
    logger.info("task_deleted", {
      taskId,
      previousStatus: beforeData?.status,
    });
    return;
  }

  // Create: new task posted
  if (!beforeData) {
    logger.info("task_created", {
      taskId,
      title: afterData.title,
      createdBy: afterData.created_by,
      rewardBoosters: afterData.reward_boosters,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const statusBefore = beforeData.status;
  const statusAfter = afterData.status;

  // Status transitions
  if (statusBefore !== statusAfter) {
    if (statusBefore === "open" && statusAfter === "claimed") {
      logger.info("task_claimed", {
        taskId,
        assigneeUid: afterData.assignee_id,
        assigneeName: afterData.assignee_name,
        claimedAt: new Date().toISOString(),
      });
      return;
    }

    if (statusBefore === "claimed" && statusAfter === "in_review") {
      logger.info("task_proof_submitted", {
        taskId,
        assigneeUid: afterData.assignee_id,
        proofMediaType: afterData.proof_media_type,
        hasProofText: !!afterData.proof_text,
        hasProofMedia: !!afterData.proof_media_url,
        submittedAt: new Date().toISOString(),
      });
      return;
    }

    if (statusBefore === "in_review" && statusAfter === "rejected") {
      logger.info("task_rejected", {
        taskId,
        assigneeUid: afterData.assignee_id,
        rejectionReason: afterData.rejected_reason?.substring(0, 200),
        rejectedBy: afterData.reviewed_by,
        rejectedAt: new Date().toISOString(),
      });
      return;
    }

    if (statusBefore === "in_review" && statusAfter === "completed") {
      logger.info("task_approved", {
        taskId,
        assigneeUid: afterData.assignee_id,
        rewardBoosters: afterData.reward_boosters,
        approvedBy: afterData.reviewed_by,
        completedAt: new Date().toISOString(),
      });
      return;
    }

    // Generic status change log for any other transitions
    logger.info("task_status_changed", {
      taskId,
      statusBefore,
      statusAfter,
      assigneeUid: afterData.assignee_id,
    });
  }
});
