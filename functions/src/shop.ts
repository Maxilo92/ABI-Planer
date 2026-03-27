import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const LIMITS: Record<string, number> = {
  "single-booster": 10,
  "five-boosters": 5,
  "twelve-boosters": 2
};

/**
 * Cloud Function zum (Demo-)Kauf von Boostern mit monatlichem Limit.
 */
export const purchaseBoosters = onCall({ 
  maxInstances: 10,
  memory: "256MiB",
  region: "europe-west3",
}, async (request) => {
  logger.info("purchaseBoosters called", { data: request.data, uid: request.auth?.uid });

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Der Nutzer muss angemeldet sein.");
  }

  const { amount, itemId } = request.data;
  
  if (!itemId || !LIMITS[itemId]) {
    throw new HttpsError("invalid-argument", "Ungültiges Produkt.");
  }

  if (typeof amount !== "number" || amount <= 0) {
    throw new HttpsError("invalid-argument", "Ungültige Anzahl an Boostern.");
  }

  const userId = request.auth.uid;

  try {
    const db = getFirestore("abi-data");
    const profileRef = db.collection("profiles").doc(userId);

    await db.runTransaction(async (transaction) => {
      logger.info("Starting transaction for user", { userId });
      const profileDoc = await transaction.get(profileRef);
      if (!profileDoc.exists) {
        throw new HttpsError("not-found", "Profil nicht gefunden.");
      }

      const data = profileDoc.data() || {};
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Shop Statistiken abrufen oder initialisieren
      let shopStats = data.shop_stats || { month: currentMonth, counts: {} };
      
      // Reset bei neuem Monat
      if (shopStats.month !== currentMonth) {
        shopStats = { month: currentMonth, counts: {} };
      }

      if (!shopStats.counts) {
        shopStats.counts = {};
      }

      const currentCount = (shopStats.counts[itemId] || 0);
      const limit = LIMITS[itemId];

      if (currentCount >= limit) {
        throw new HttpsError("failed-precondition", `Monatliches Limit für ${itemId} erreicht (${limit}).`);
      }

      const boosterStats = data.booster_stats || {};

      // Transaktion durchführen
      transaction.set(profileRef, {
        booster_stats: {
          ...boosterStats,
          extra_available: (Number(boosterStats.extra_available) || 0) + amount,
          last_reset: boosterStats.last_reset || now.toISOString().split("T")[0]
        },
        shop_stats: {
          month: currentMonth,
          counts: {
            ...shopStats.counts,
            [itemId]: currentCount + 1
          }
        },
        updated_at: FieldValue.serverTimestamp()
      }, { merge: true });

      // Loggen des Kaufs
      const logRef = db.collection("logs").doc();
      transaction.set(logRef, {
        user_id: userId,
        action: "purchase_booster",
        item_id: itemId,
        amount: amount,
        timestamp: FieldValue.serverTimestamp()
      });
      
      logger.info("Transaction successful for user", { userId, itemId });
    });

    return { success: true };
  } catch (error: any) {
    logger.error("Purchase Error:", { 
      message: error.message, 
      stack: error.stack,
      data: request.data,
      uid: request.auth.uid 
    });
    
    if (error instanceof HttpsError) throw error;
    
    // Provide more detail in the internal error for debugging
    throw new HttpsError("internal", `Kauf fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
  }
});
