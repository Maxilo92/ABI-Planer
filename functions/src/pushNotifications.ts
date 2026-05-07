import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Helper to send push notifications to a list of user UIDs.
 * Handles token retrieval, opt-in check, and multicast dispatch.
 */
async function sendPushToUsers(userIds: string[], payload: { title: string; body: string; data?: any }) {
  // Remove duplicates
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return;

  const db = getFirestore("abi-data");
  const tokens: string[] = [];

  // Fetch profiles for these users to get tokens
  // Note: For large batches, consider a more efficient query if possible.
  const profileSnaps = await Promise.all(
    uniqueUserIds.map(id => db.collection("profiles").doc(id).get())
  );

  profileSnaps.forEach(snap => {
    if (snap.exists) {
      const data = snap.data();
      if (data?.isPushEnabled !== false && Array.isArray(data?.fcmTokens)) {
        tokens.push(...data.fcmTokens);
      }
    }
  });

  if (tokens.length === 0) {
    logger.info("No FCM tokens found for target users.");
    return;
  }

  // Multicast limit is 500 tokens per call
  const BATCH_SIZE = 500;
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const tokenBatch = tokens.slice(i, i + BATCH_SIZE);
    
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: tokenBatch,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      logger.info(`Multicast: ${response.successCount} success, ${response.failureCount} failure.`);
      
      // Cleanup failed tokens (optional but recommended)
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success && (resp.error?.code === 'messaging/registration-token-not-registered' || resp.error?.code === 'messaging/invalid-registration-token')) {
            const badToken = tokenBatch[idx];
            logger.info(`Cleaning up invalid token: ${badToken}`);
            // Note: We don't have user mapping here easily, so we might need a separate cleanup logic.
          }
        });
      }
    } catch (error) {
      logger.error("Error sending multicast message:", error);
    }
  }
}

/**
 * Triggered on new news creation.
 * Notifies all users with push notifications enabled.
 */
export const onNewsCreatedPush = onDocumentCreated({
  document: "news/{newsId}",
  database: "abi-data",
  region: "europe-west3",
}, async (event) => {
  const news = event.data?.data();
  if (!news || news.is_small_update) return;

  const db = getFirestore("abi-data");
  const usersSnap = await db.collection("profiles").where("isPushEnabled", "==", true).get();
  const userIds = usersSnap.docs.map(doc => doc.id);

  await sendPushToUsers(userIds, {
    title: "📰 Neue News verfügbar!",
    body: news.title,
    data: { url: "/news" }
  });
});

/**
 * Triggered on new todo creation.
 * Notifies the assigned user, class members, or group members.
 */
export const onTodoCreatedPush = onDocumentCreated({
  document: "todos/{todoId}",
  database: "abi-data",
  region: "europe-west3",
}, async (event) => {
  const todo = event.data?.data();
  if (!todo) return;

  const db = getFirestore("abi-data");
  const recipientIds: string[] = [];

  if (todo.assigned_to_user) {
    recipientIds.push(todo.assigned_to_user);
  } else if (todo.assigned_to_class) {
    const usersSnap = await db.collection("profiles").where("class_name", "==", todo.assigned_to_class).get();
    recipientIds.push(...usersSnap.docs.map(doc => doc.id));
  } else if (todo.assigned_to_group) {
    const usersSnap = await db.collection("profiles").where("planning_groups", "array-contains", todo.assigned_to_group).get();
    recipientIds.push(...usersSnap.docs.map(doc => doc.id));
  }

  if (recipientIds.length > 0) {
    await sendPushToUsers(recipientIds, {
      title: "📝 Neue Aufgabe für dich",
      body: todo.title,
      data: { url: "/todos" }
    });
  }
});

/**
 * Triggered on new calendar event creation.
 * Notifies all users with push notifications enabled.
 */
export const onEventCreatedPush = onDocumentCreated({
  document: "events/{eventId}",
  database: "abi-data",
  region: "europe-west3",
}, async (event) => {
  const eventData = event.data?.data();
  if (!eventData) return;

  const db = getFirestore("abi-data");
  const usersSnap = await db.collection("profiles").where("isPushEnabled", "==", true).get();
  const userIds = usersSnap.docs.map(doc => doc.id);

  await sendPushToUsers(userIds, {
    title: "📅 Neuer Termin im Kalender",
    body: eventData.title,
    data: { url: "/kalender" }
  });
});

/**
 * Triggered on new group message creation.
 * Notifies group members (internal groups) excluding the sender.
 */
export const onGroupMessageCreatedPush = onDocumentCreated({
  document: "group_messages/{messageId}",
  database: "abi-data",
  region: "europe-west3",
}, async (event) => {
  const message = event.data?.data();
  if (!message) return;

  const db = getFirestore("abi-data");
  const recipientIds: string[] = [];

  if (message.type === 'internal') {
    const usersSnap = await db.collection("profiles").where("planning_groups", "array-contains", message.group_name).get();
    recipientIds.push(...usersSnap.docs.map(doc => doc.id).filter(id => id !== message.created_by));
  } else if (message.type === 'hub') {
    // Only notify if explicitly mentioned or if it's a small group (hub is usually large)
    // For now, we avoid spamming everyone for every hub message.
  }

  if (recipientIds.length > 0) {
    await sendPushToUsers(recipientIds, {
      title: `💬 Neue Nachricht in ${message.group_name}`,
      body: `${message.author_name}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
      data: { url: "/gruppen" }
    });
  }
});
