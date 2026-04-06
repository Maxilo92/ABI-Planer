import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Triggered when a new message is created in group_messages.
 * If it's a thread reply (has parent_id), notifies the parent message author.
 */
export const onMessageCreated = onDocumentCreated({
  document: "group_messages/{messageId}",
  database: "abi-data",
  region: "europe-west3",
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.info("No data snapshot found for onMessageCreated");
    return;
  }

  const message = snapshot.data();
  const db = getFirestore("abi-data");
  const messageId = event.params.messageId;

  logger.info(`Processing new message ${messageId} in group ${message.group_name}`);

  // 1. If parent_id is present, it's a thread reply.
  if (message.parent_id) {
    try {
      // Find the parent message author to notify them
      const parentMessageRef = db.collection("group_messages").doc(message.parent_id);
      const parentMessageSnap = await parentMessageRef.get();

      if (parentMessageSnap.exists) {
        const parentMessage = parentMessageSnap.data();
        const parentAuthorId = parentMessage?.created_by;

        // Don't notify if the user is replying to their own message
        if (parentAuthorId && parentAuthorId !== message.created_by) {
          const notificationId = db.collection("notifications").doc(parentAuthorId).collection("messages").doc().id;
          
          await db.collection("notifications").doc(parentAuthorId).collection("messages").doc(notificationId).set({
            id: notificationId,
            userId: parentAuthorId,
            type: "thread_reply",
            title: "Neue Antwort im Thread",
            message: `${message.author_name || 'Jemand'} hat auf deine Nachricht geantwortet.`,
            timestamp: FieldValue.serverTimestamp(),
            groupId: message.group_name,
            parentMessageId: message.parent_id,
            messageId: messageId,
            read: false
          });
          
          logger.info(`Sent thread reply notification to ${parentAuthorId}`);
        }
      }
    } catch (error) {
      logger.error(`Error processing thread reply notification for ${messageId}:`, error);
    }
  }
});
