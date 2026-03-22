import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { wipeAllCards } from "./actions/wipeAllCards";
import { wipeUserCards } from "./actions/wipeUserCards";

/**
 * Scheduled function to execute pending danger actions every 15 minutes.
 */
export const executeDangerActions = onSchedule("every 15 minutes", async (event) => {
  console.log("Starting execution of pending danger actions...");
  const now = admin.firestore.Timestamp.now();
  
  const actionsRef = admin.firestore().collection("delayed_actions");
  const query = actionsRef
    .where("status", "==", "pending")
    .where("executableAt", "<=", now);

  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log("No pending danger actions to execute.");
    return;
  }

  console.log(`Found ${snapshot.size} pending danger actions to execute.`);

  for (const doc of snapshot.docs) {
    const actionData = doc.data();
    const actionId = doc.id;
    const actionType = actionData.actionType;
    const payload = actionData.payload || {};

    console.log(`Executing action ${actionId} of type ${actionType}...`);

    try {
      switch (actionType) {
        case "SYSTEM_TEST_DRY_RUN":
          console.log("System Test Dry Run executed successfully. No data changed.");
          break;
        case "WIPE_ALL_CARDS":
          await wipeAllCards();
          break;
        case "WIPE_USER_CARDS":
          await wipeUserCards(payload.uid);
          break;
        // In the future, other actions like RESET_ALL_VOTES can be added here.
        default:
          console.warn(`Unknown action type: ${actionType}. Marking as failed.`);
          await doc.ref.update({
            status: "failed",
            error: `Unknown action type: ${actionType}`,
            completedAt: admin.firestore.Timestamp.now()
          });
          
          await admin.firestore().collection("logs").add({
            action: "DANGER_ACTION_FAILED",
            user_id: actionData.triggeredBy || "SYSTEM",
            user_name: actionData.triggeredByName || "System/Cron",
            details: {
              actionId,
              actionType,
              error: `Unknown action type: ${actionType}`
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
      }

      // Success
      await doc.ref.update({
        status: "completed",
        completedAt: admin.firestore.Timestamp.now()
      });

      // Log success
      await admin.firestore().collection("logs").add({
        action: "DANGER_ACTION_EXECUTED",
        user_id: actionData.triggeredBy || "SYSTEM",
        user_name: actionData.triggeredByName || "System/Cron",
        details: {
          actionId,
          actionType,
          description: actionData.description
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Action ${actionId} completed successfully.`);

    } catch (error: any) {
      console.error(`Error executing action ${actionId}:`, error);
      await doc.ref.update({
        status: "failed",
        error: error.message || "Unknown error during execution",
        completedAt: admin.firestore.Timestamp.now()
      });

      // Log failure
      await admin.firestore().collection("logs").add({
        action: "DANGER_ACTION_FAILED",
        user_id: actionData.triggeredBy || "SYSTEM",
        user_name: actionData.triggeredByName || "System/Cron",
        details: {
          actionId,
          actionType,
          error: error.message || "Unknown error"
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  console.log("Finished execution of pending danger actions.");
});
