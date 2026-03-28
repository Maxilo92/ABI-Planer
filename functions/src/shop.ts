import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import Stripe from "stripe";

// Die Preise müssen in deinem Stripe-Dashboard angelegt werden (price_123...)
const STRIPE_PRICES: Record<string, { priceId: string, amount: number }> = {
  "single-booster": { priceId: "price_1TG2ZZAnqErqKKxAVvM2cXFz", amount: 1 },
  "five-boosters": { priceId: "price_1TG2ZnAnqErqKKxAG9e5Dxpy", amount: 5 },
  "twelve-boosters": { priceId: "price_1TG2ZxAnqErqKKxAQgKXZCrK", amount: 12 }
};

const LIMITS: Record<string, number> = {
  "single-booster": 10,
  "five-boosters": 5,
  "twelve-boosters": 2
};

/**
 * Cloud Function zum Erstellen einer Stripe Checkout Session.
 * Sicher: Nutzt client_reference_id (UserID).
 * Legal: Enthält Hinweis auf Widerrufsverzicht bei digitalen Gütern.
 */
export const createStripeCheckoutSession = onCall({
  maxInstances: 10,
  memory: "256MiB",
  region: "europe-west3",
  secrets: ["STRIPE_SECRET_KEY"], // Nutzt Firebase Secrets für Live-Sicherheit
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }

  const { itemId } = request.data;
  const product = STRIPE_PRICES[itemId];

  if (!product) {
    throw new HttpsError("invalid-argument", "Ungültiges Produkt.");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new HttpsError("internal", "Stripe ist noch nicht konfiguriert.");
  }

  const stripe = new Stripe(stripeKey);
  const userId = request.auth.uid;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: product.priceId,
        quantity: 1,
      }],
      mode: "payment",
      client_reference_id: userId, // ESSENTIELL: Verknüpfung zum User
      metadata: {
        itemId: itemId,
        amount: product.amount.toString(),
        legal_notice: "Widerrufsverzicht akzeptiert bei Ausführung"
      },
      // Stripe Tax für legale MwSt.-Abwicklung (muss in Stripe aktiviert sein)
      automatic_tax: { enabled: true },
      // Custom Text für rechtliche Absicherung im Checkout
      custom_text: {
        submit: {
          message: "Mit dem Kauf stimmst du der sofortigen Ausführung zu und verlierst dein Widerrufsrecht bei digitalen Inhalten."
        }
      },
      success_url: `https://abi-planer-27.de/sammelkarten?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://abi-planer-27.de/sammelkarten/shop?canceled=true`,
    });

    return { url: session.url };
  } catch (error: any) {
    logger.error("Stripe Session Error:", error);
    throw new HttpsError("internal", "Konnte Bezahlvorgang nicht starten.");
  }
});

/**
 * Webhook-Handler für Stripe Events.
 * Sicher: Signatur-Prüfung und Idempotenz-Check (gegen Doppelbuchungen).
 * Legal: Bietet Audit-Log in Firestore.
 */
export const stripeWebhook = onRequest({
  region: "europe-west3",
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
}, async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    logger.error("Webhook Signature Verification Failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Nur erfolgreiche Zahlungen verarbeiten
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const amount = Number(session.metadata?.amount || 0);
    const itemId = session.metadata?.itemId;

    if (!userId || !amount || !itemId) {
      logger.error("Missing Metadata in Session:", session.id);
      res.status(200).send("No userId found - ignored.");
      return;
    }

    const db = getFirestore("abi-data");
    const profileRef = db.collection("profiles").doc(userId);
    const transactionRef = db.collection("stripe_transactions").doc(session.id);

    try {
      await db.runTransaction(async (transaction) => {
        const transDoc = await transaction.get(transactionRef);
        
        // Idempotenz: Bereits verarbeitet?
        if (transDoc.exists) {
          logger.info("Transaction already processed:", session.id);
          return;
        }

        // Booster gutschreiben
        transaction.update(profileRef, {
          "booster_stats.extra_available": FieldValue.increment(amount),
          updated_at: FieldValue.serverTimestamp()
        });

        // Transaktion als verarbeitet markieren
        transaction.set(transactionRef, {
          user_id: userId,
          amount: amount,
          item_id: itemId,
          stripe_session_id: session.id,
          processed_at: FieldValue.serverTimestamp(),
          status: "completed"
        });

        // Audit-Log
        const logRef = db.collection("logs").doc();
        transaction.set(logRef, {
          user_id: userId,
          action: "STRIPE_PAYMENT_SUCCESS",
          details: {
            session_id: session.id,
            item: itemId,
            booster_count: amount
          },
          timestamp: FieldValue.serverTimestamp()
        });
      });

      logger.info("Boosters awarded successfully for user", { userId, amount });
    } catch (error) {
      logger.error("Fulfillment Transaction Failed:", error);
      res.status(500).send("Internal Server Error during fulfillment.");
      return;
    }
  }

  res.status(200).send({ received: true });
});

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
