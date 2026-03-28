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
  const { itemId } = request.data;
  const product = STRIPE_PRICES[itemId];

  if (!product) {
    throw new HttpsError("invalid-argument", "Ungültiges Produkt.");
  }

  // Sicherheits-Check: Sammelkarten-Produkte erfordern zwingend ein Konto
  const isAppProduct = itemId.includes("booster");
  if (isAppProduct && !request.auth) {
    throw new HttpsError("unauthenticated", "Für diesen Artikel ist ein Konto erforderlich.");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new HttpsError("internal", "Stripe ist noch nicht konfiguriert.");
  }

  const stripe = new Stripe(stripeKey);
  const userId = request.auth?.uid || null;

  logger.info("Creating Stripe session", { userId, itemId, isGuest: !userId });

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: product.priceId,
        quantity: 1,
      }],
      mode: "payment",
      allow_promotion_codes: true,
      client_reference_id: userId, // Kann null sein für Gäste
      billing_address_collection: "required",
      metadata: {
        itemId: itemId,
        amount: product.amount.toString(),
        isAppProduct: isAppProduct.toString(),
        legal_notice: "Widerrufsverzicht akzeptiert bei Ausführung"
      },
      automatic_tax: { enabled: true },
      custom_text: {
        submit: {
          message: "Mit dem Kauf stimmst du der sofortigen Ausführung zu und verlierst dein Widerrufsrecht bei digitalen Inhalten."
        }
      },
      success_url: isAppProduct 
        ? `https://abi-planer-27.de/sammelkarten?success=true&session_id={CHECKOUT_SESSION_ID}`
        : `https://abi-planer-27.de/shop?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://abi-planer-27.de/shop?canceled=true`,
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
    const userId = session.client_reference_id; // Kann null sein für Gäste
    const amount = Number(session.metadata?.amount || 0);
    const itemId = session.metadata?.itemId;
    const isAppProduct = session.metadata?.isAppProduct === "true";

    if (!itemId) {
      logger.error("Missing ItemId in Session:", session.id);
      res.status(200).send("No itemId found - ignored.");
      return;
    }

    const db = getFirestore("abi-data");
    const transactionRef = db.collection("stripe_transactions").doc(session.id);

    try {
      await db.runTransaction(async (transaction) => {
        const transDoc = await transaction.get(transactionRef);
        
        // Idempotenz: Bereits verarbeitet?
        if (transDoc.exists) {
          logger.info("Transaction already processed:", session.id);
          return;
        }

        // 1. Fulfillment für App-Produkte (Booster) nur wenn UserID vorhanden
        if (isAppProduct && userId) {
          const profileRef = db.collection("profiles").doc(userId);
          transaction.update(profileRef, {
            "booster_stats.extra_available": FieldValue.increment(amount),
            updated_at: FieldValue.serverTimestamp()
          });
        }

        // 2. Transaktion speichern (für alle, inkl. Gäste)
        transaction.set(transactionRef, {
          user_id: userId || "guest",
          is_guest: !userId,
          amount: amount,
          item_id: itemId,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || null,
          processed_at: FieldValue.serverTimestamp(),
          status: "completed"
        });

        // 3. Audit-Log
        const logRef = db.collection("logs").doc();
        transaction.set(logRef, {
          user_id: userId || "guest",
          action: "STRIPE_PAYMENT_SUCCESS",
          details: {
            session_id: session.id,
            item: itemId,
            booster_count: isAppProduct ? amount : 0,
            is_guest: !userId
          },
          timestamp: FieldValue.serverTimestamp()
        });
      });

      logger.info("Transaction fulfilled successfully", { userId, itemId, isGuest: !userId });
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

/**
 * Cloud Function zum Öffnen eines Boosters.
 * Zieht Karten basierend auf gewichteten Zufallswerten.
 */
export const openBooster = onCall({
  maxInstances: 10,
  memory: "256MiB",
  region: "europe-west3",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }

  const userId = request.auth.uid;
  const db = getFirestore("abi-data");
  const countToOpen = Math.min(Math.max(Number(request.data.count) || 1, 1), 10); // Limit to max 10 packs at once

  try {
    return await db.runTransaction(async (transaction) => {
      const profileRef = db.collection("profiles").doc(userId);
      const userTeachersRef = db.collection("user_teachers").doc(userId);
      const settingsRef = db.collection("settings").doc("sammelkarten");

      const [profileSnap, userTeachersSnap, settingsSnap] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(userTeachersRef),
        transaction.get(settingsRef)
      ]);

      if (!profileSnap.exists) {
        throw new HttpsError("not-found", "Profil nicht gefunden.");
      }

      const profileData = profileSnap.data() || {};
      const boosterStats = profileData.booster_stats || {};
      const extraAvailable = Number(boosterStats.extra_available) || 0;

      if (extraAvailable < countToOpen) {
        throw new HttpsError("failed-precondition", `Nicht genügend Booster verfügbar (${extraAvailable} vorhanden, ${countToOpen} benötigt).`);
      }

      if (!settingsSnap.exists) {
        throw new HttpsError("internal", "Sammelkarten-Konfiguration fehlt.");
      }

      const config = settingsSnap.data() as any;
      const lootTeachers = (config.loot_teachers || []) as any[];
      const rarityWeightsRaw = config.rarity_weights || [];
      const rarityWeights = Array.isArray(rarityWeightsRaw) ? rarityWeightsRaw : [rarityWeightsRaw];
      const variantProbs = config.variant_probabilities || {};

      if (lootTeachers.length === 0 || rarityWeights.length === 0) {
        throw new HttpsError("internal", "Keine Karten zum Ziehen verfügbar.");
      }

      const allPacks: any[] = [];
      const userTeachersData = (userTeachersSnap.data() || {}) as any;

      for (let p = 0; p < countToOpen; p++) {
        const cardsOpenedInPack: any[] = [];
        // Jedes Pack enthält so viele Karten wie rarityWeights definiert sind (normalerweise 3)
        for (const weights of rarityWeights) {
          // 1. Seltenheit rollen
          const rarities = ["common", "rare", "epic", "mythic", "legendary"];
          const totalWeight = rarities.reduce((sum, r) => sum + (Number(weights[r]) || 0), 0);
          let randomRarityValue = Math.random() * totalWeight;
          let selectedRarity = "common";
          
          for (const r of rarities) {
            const w = Number(weights[r]) || 0;
            if (randomRarityValue < w) {
              selectedRarity = r;
              break;
            }
            randomRarityValue -= w;
          }

          // 2. Variante rollen
          const randVariantValue = Math.random();
          let variant: "normal" | "holo" | "shiny" | "black_shiny_holo" = "normal";
          if (randVariantValue < (Number(variantProbs.black_shiny_holo) || 0.005)) {
            variant = "black_shiny_holo";
          } else if (randVariantValue < (Number(variantProbs.shiny) || 0.05)) {
            variant = "shiny";
          } else if (randVariantValue < (Number(variantProbs.holo) || 0.15)) {
            variant = "holo";
          }

          // 3. Lehrer auswählen
          const candidates = lootTeachers.filter((t) => t.rarity === selectedRarity);
          const selectedTeacher = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : (lootTeachers.filter(t => t.rarity === "common")[0] || lootTeachers[0]);

          if (!selectedTeacher) continue;

          const teacherId = selectedTeacher.id;

          // 4. User-Fortschritt aktualisieren
          if (!userTeachersData[teacherId]) {
            userTeachersData[teacherId] = {
              count: 1,
              level: 1,
              variants: { [variant]: 1 }
            };
          } else {
            const current = userTeachersData[teacherId];
            current.count = (Number(current.count) || 0) + 1;
            // Level-Formel: Math.floor(Math.sqrt(count - 1)) + 1
            current.level = Math.floor(Math.sqrt(current.count - 1)) + 1;
            if (!current.variants) current.variants = {};
            current.variants[variant] = (Number(current.variants[variant]) || 0) + 1;
          }

          cardsOpenedInPack.push({
            id: teacherId,
            name: selectedTeacher.name,
            rarity: selectedTeacher.rarity,
            variant,
            level: userTeachersData[teacherId].level,
            count: userTeachersData[teacherId].count
          });
        }
        allPacks.push({ cards: cardsOpenedInPack });
      }

      // Profile aktualisieren: Booster abziehen, total_opened erhöhen
      transaction.update(profileRef, {
        "booster_stats.extra_available": FieldValue.increment(-countToOpen),
        "booster_stats.total_opened": FieldValue.increment(countToOpen),
        updated_at: FieldValue.serverTimestamp()
      });

      // User Teachers speichern
      transaction.set(userTeachersRef, userTeachersData);

      // Audit Log
      const logRef = db.collection("logs").doc();
      transaction.set(logRef, {
        user_id: userId,
        action: "OPEN_BOOSTER",
        details: {
          packCount: countToOpen,
          packs: allPacks.map(p => p.cards.map((c: any) => ({ id: c.id, variant: c.variant, rarity: c.rarity })))
        },
        timestamp: FieldValue.serverTimestamp()
      });

      logger.info("Boosters successfully opened", { userId, packCount: countToOpen });
      return { packs: allPacks };
    });
  } catch (error: any) {
    logger.error("Error in openBooster:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Interner Fehler beim Öffnen des Boosters.");
  }
});
