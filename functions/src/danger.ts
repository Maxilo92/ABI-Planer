import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { authenticator } from "otplib";

/**
 * Authorize a danger action with 2FA and create a delayed action.
 */
export const authorizeDangerAction = onCall({ cors: true }, async (request) => {
  // 1. Verify Authentication
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Only authenticated main admins can perform danger actions."
    );
  }

  const uid = request.auth.uid;

  // 2. Verify Role (admin_main only)
  const profileSnap = await admin.firestore().collection("profiles").doc(uid).get();
  const profile = profileSnap.data();
  if (!profile || profile.role !== "admin_main") {
    throw new HttpsError(
      "permission-denied",
      "Only the main admin can perform danger actions."
    );
  }

  const { actionType, confirmationString, code, payload } = request.data;

  if (!actionType || !confirmationString || !code) {
    throw new HttpsError(
      "invalid-argument",
      "actionType, confirmationString, and code are required."
    );
  }

  // 3. Verify TOTP Code
  const secretSnap = await admin.firestore().collection("user_secrets").doc(uid).get();
  const secretData = secretSnap.data();
  if (!secretData || !secretData.secret) {
    throw new HttpsError(
      "failed-precondition",
      "2FA is not set up for this user."
    );
  }

  const isValid = authenticator.verify({ token: code, secret: secretData.secret });
  if (!isValid) {
    throw new HttpsError(
      "invalid-argument",
      "Der eingegebene 2FA Code ist falsch oder abgelaufen."
    );
  }

  // 4. Validate Confirmation String
  const actionConfigs: Record<string, { expectedConfirmation: string, description: string }> = {
    "SYSTEM_TEST_DRY_RUN": {
      expectedConfirmation: "RUN SYSTEM TEST",
      description: "Testet den Sicherheits-Workflow ohne Änderungen."
    },
    "EMPTY_ALL_ALBUMS": {
      expectedConfirmation: "EMPTY ALL ALBUMS",
      description: "Alle Alben der Nutzer werden geleert. Die registrierten Lehrer bleiben im Pool bestehen."
    },
    "WIPE_TEACHER_DB": {
      expectedConfirmation: "WIPE TEACHER DATABASE",
      description: "Die gesamte Lehrer-Datenbank wird gelöscht. Keine Karten mehr verfügbar, bis neu importiert wird."
    },
    "WIPE_USER_CARDS": {
      expectedConfirmation: "DELETE USER CARDS",
      description: "Alle Sammelkarten eines bestimmten Benutzers werden gelöscht."
    },
    "RESET_ALL_VOTES": {
      expectedConfirmation: "RESET ALL VOTES",
      description: "Alle Lehrer-Bewertungen werden zurückgesetzt."
    },
    "DELETE_ALL_FEEDBACK": {
      expectedConfirmation: "DELETE ALL FEEDBACK",
      description: "Sämtliches Feedback wird gelöscht."
    }
  };

  const config = actionConfigs[actionType];
  if (!config) {
    throw new HttpsError(
      "invalid-argument",
      "Unknown action type."
    );
  }

  if (confirmationString.toLowerCase() !== config.expectedConfirmation.toLowerCase()) {
    throw new HttpsError(
      "invalid-argument",
      "Die Bestätigungskette ist nicht korrekt."
    );
  }

  // 5. Validate Payload
  if (actionType === "WIPE_USER_CARDS") {
    if (!payload || !payload.uid || typeof payload.uid !== "string" || payload.uid.trim() === "") {
      throw new HttpsError(
        "invalid-argument",
        "Für diese Aktion ist eine gültige Benutzer-ID (uid) im Payload erforderlich."
      );
    }
  }

  // 6. Create Delayed Action
  const delayedActionRef = admin.firestore().collection("delayed_actions").doc();
  const now = admin.firestore.Timestamp.now();
  const executableAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);

  await delayedActionRef.set({
    id: delayedActionRef.id,
    actionType,
    description: config.description,
    payload: payload || {},
    createdAt: now,
    executableAt,
    status: "pending",
    triggeredBy: uid,
    triggeredByName: profile.full_name || "Admin"
  });

  // Log action
  await admin.firestore().collection("logs").add({
    action: "DANGER_ACTION_QUEUED",
    user_id: uid,
    user_name: profile.full_name || "Admin",
    details: {
      actionId: delayedActionRef.id,
      actionType,
      description: config.description,
      executableAt: executableAt.toDate().toISOString()
    },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { 
    success: true, 
    actionId: delayedActionRef.id,
    executableAt: executableAt.toDate().toISOString()
  };
});
