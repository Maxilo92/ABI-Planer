import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";

/**
 * Setup 2FA for an admin.
 * Generates a TOTP secret and returns a QR code.
 */
export const setup2FA = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Only authenticated admins can enable 2FA."
    );
  }

  const uid = request.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  const email = userRecord.email || "user@example.com";

  // Check if user is admin
  const profileSnap = await admin.firestore().collection("profiles").doc(uid).get();
  const profile = profileSnap.data();
  if (!profile || !["admin", "admin_main", "admin_co"].includes(profile.role)) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can enable 2FA."
    );
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, "ABI Planer", secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  return {
    secret,
    qrCodeUrl,
  };
});

/**
 * Verify the initial 2FA code and save the secret.
 */
export const verifyInitial2FA = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Only authenticated admins can enable 2FA."
    );
  }

  const { secret, code } = request.data;
  if (!secret || !code) {
    throw new HttpsError(
      "invalid-argument",
      "Secret and code are required."
    );
  }

  const uid = request.auth.uid;

  // Verify the code
  const isValid = authenticator.verify({ token: code, secret });
  if (!isValid) {
    throw new HttpsError(
      "invalid-argument",
      "Der eingegebene Code ist falsch oder abgelaufen."
    );
  }

  // Save the secret securely
  await admin.firestore().collection("user_secrets").doc(uid).set({
    secret,
    backup_codes: [],
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update profile
  await admin.firestore().collection("profiles").doc(uid).update({
    is_2fa_enabled: true,
    two_factor_secret_id: uid,
  });

  return { success: true };
});

/**
 * Disable 2FA for the current user.
 */
export const disable2FA = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Not authenticated."
    );
  }

  const { code } = request.data;
  if (!code) {
    throw new HttpsError(
      "invalid-argument",
      "Ein Bestätigungscode ist erforderlich, um 2FA zu deaktivieren."
    );
  }

  const uid = request.auth.uid;

  // Get the secret to verify the code
  const secretSnap = await admin.firestore().collection("user_secrets").doc(uid).get();
  const secretData = secretSnap.data();
  if (!secretData || !secretData.secret) {
    throw new HttpsError(
      "failed-precondition",
      "2FA ist für diesen Benutzer nicht eingerichtet."
    );
  }

  const isValid = authenticator.verify({ token: code, secret: secretData.secret });
  if (!isValid) {
    throw new HttpsError(
      "invalid-argument",
      "Der eingegebene Code ist falsch oder abgelaufen."
    );
  }

  // Remove secret and update profile
  await admin.firestore().collection("user_secrets").doc(uid).delete();
  await admin.firestore().collection("profiles").doc(uid).update({
    is_2fa_enabled: false,
    two_factor_secret_id: null,
  });

  return { success: true };
});
