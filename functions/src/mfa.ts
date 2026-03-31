import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { logger } from "firebase-functions";

// Initialize admin if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Setup 2FA for any authenticated user.
 */
export const setup2FA = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du musst angemeldet sein.");
  }

  const uid = request.auth.uid;
  logger.info(`[2FA] Starting setup for user ${uid}`);
  
  try {
    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email || "user@example.com";

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(email, "ABI Planer", secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return { secret, qrCodeUrl };
  } catch (error: any) {
    logger.error(`[2FA] Setup failed for user ${uid}:`, error);
    throw new HttpsError("internal", "Setup fehlgeschlagen: " + error.message);
  }
});

/**
 * Verify the initial 2FA code and save the secret.
 */
export const verifyInitial2FA = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du musst angemeldet sein.");
  }

  const { secret, code } = request.data;
  if (!secret || !code) {
    throw new HttpsError("invalid-argument", "Daten fehlen.");
  }

  const uid = request.auth.uid;
  logger.info(`[2FA] Verifying initial code for user ${uid}`);

  try {
    const isValid = authenticator.verify({ token: code, secret });
    if (!isValid) {
      throw new HttpsError("invalid-argument", "Code ungültig.");
    }

    const db = getFirestore("abi-data");
    await db.collection("user_secrets").doc(uid).set({
      secret,
      backup_codes: [],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("profiles").doc(uid).update({
      is_2fa_enabled: true,
      two_factor_secret_id: uid,
    });

    return { success: true };
  } catch (error: any) {
    logger.error(`[2FA] Initial verification failed for user ${uid}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Verify a 2FA code during login.
 */
export const verifyLogin2FA = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth) {
    logger.warn("[2FA] Unauthenticated attempt to verifyLogin2FA");
    throw new HttpsError("unauthenticated", "Nicht angemeldet.");
  }

  const { code } = request.data;
  const uid = request.auth.uid;
  
  logger.info(`[2FA] Verifying login code for user ${uid}`);

  if (!code || code.length !== 6) {
    throw new HttpsError("invalid-argument", "6-stelliger Code erforderlich.");
  }

  try {
    const db = getFirestore("abi-data");
    const secretSnap = await db.collection("user_secrets").doc(uid).get();
    
    if (!secretSnap.exists) {
      logger.warn(`[2FA] No secret found for user ${uid}`);
      throw new HttpsError("failed-precondition", "2FA nicht eingerichtet.");
    }

    const secretData = secretSnap.data();
    if (!secretData?.secret) {
      throw new HttpsError("failed-precondition", "Geheimnis fehlt.");
    }

    const isValid = authenticator.verify({ token: code, secret: secretData.secret });
    
    if (!isValid) {
      logger.info(`[2FA] Invalid code provided for user ${uid}`);
      throw new HttpsError("invalid-argument", "Der Code ist falsch.");
    }

    logger.info(`[2FA] Login successful for user ${uid}`);
    return { success: true };
  } catch (error: any) {
    logger.error(`[2FA] Login verification failed for user ${uid}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Interner Fehler.");
  }
});

/**
 * Disable 2FA for the current user.
 */
export const disable2FA = onCall({
  cors: true,
  region: "europe-west3",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Nicht angemeldet.");
  }

  const { code } = request.data;
  const uid = request.auth.uid;

  try {
    const db = getFirestore("abi-data");
    const secretSnap = await db.collection("user_secrets").doc(uid).get();
    
    if (!secretSnap.exists || !secretSnap.data()?.secret) {
      throw new HttpsError("failed-precondition", "2FA nicht aktiv.");
    }

    const isValid = authenticator.verify({ token: code, secret: secretSnap.data()?.secret });
    if (!isValid) {
      throw new HttpsError("invalid-argument", "Code falsch.");
    }

    await db.collection("user_secrets").doc(uid).delete();
    await db.collection("profiles").doc(uid).update({
      is_2fa_enabled: false,
      two_factor_secret_id: null,
    });

    return { success: true };
  } catch (error: any) {
    logger.error(`[2FA] Disable failed for user ${uid}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});
