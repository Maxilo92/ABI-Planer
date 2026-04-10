import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";
import { CARD_SETS } from "./constants/cardRegistry";
import {
  atomicNPUpdate,
  validateWebhookIdempotency,
  markWebhookProcessed,
  checkRateLimit,
} from "./npSecurity";

const TEACHER_PACK_ID = "teacher_vol1";
const LEGACY_TEACHER_PACK_ID = "teachers_v1";
const isTeacherPackId = (packId: string) => packId === TEACHER_PACK_ID || packId === LEGACY_TEACHER_PACK_ID;
const normalizeTeacherPackId = (packId: string) => (packId === LEGACY_TEACHER_PACK_ID ? TEACHER_PACK_ID : packId);
const normalizeTeacherSetId = (setId: string) => (setId === LEGACY_TEACHER_PACK_ID ? TEACHER_PACK_ID : setId);

// Die Preise müssen in deinem Stripe-Dashboard angelegt werden (price_123...)
type StripeShopProduct = {
  amount: number;
  priceId?: string;
  unitAmountCents?: number;
  productName?: string;
  productDescription?: string;
};

const STRIPE_PRICES: Record<string, StripeShopProduct> = {
  "booster-bundle-1": { amount: 1, priceId: "price_1TGgZIAnqErqKKxANg6Vc9zT" },
  "booster-bundle-3": { amount: 3, priceId: "price_1TGgZXAnqErqKKxA617iNBcY" },
  "booster-bundle-5": { amount: 5, priceId: "price_1TGga5AnqErqKKxA9RwnDU7l" },
  "booster-bundle-10": { amount: 10, priceId: "price_1TGgaNAnqErqKKxAHijgndIu" },
  "booster-bundle-20": { amount: 20, priceId: "price_1TGgagAnqErqKKxAxUit6wg6" },
  "booster-bundle-50": { amount: 50, priceId: "price_1TGgauAnqErqKKxA6mYjvTwQ" },
  "booster-bundle-100": { amount: 100, priceId: "price_1TGgb8AnqErqKKxAXnpfj07T" },
  "soli-donation-small": { amount: 1, priceId: "price_1TGGzZAnqErqKKxAn2UYcCxq" },
  "soli-donation-medium": { amount: 1, priceId: "price_1TGGzsAnqErqKKxASTxTWqYj" },
  "soli-donation-large": { amount: 1, priceId: "price_1TGH03AnqErqKKxABplUroCg" },
  // NP Packs - update priceIds with actual Stripe Price IDs once created
  "np-pack-100": { amount: 100, priceId: "price_np_100", productName: "100 Notenpunkte", productDescription: "100 NP für Shop und Battle Pass" },
  "np-pack-550": { amount: 550, priceId: "price_np_550", productName: "550 Notenpunkte (10% Bonus)", productDescription: "550 NP für Shop und Battle Pass" },
  "np-pack-1500": { amount: 1500, priceId: "price_np_1500", productName: "1500 Notenpunkte (20% Bonus)", productDescription: "1500 NP für Shop und Battle Pass" },
  "np-pack-5000": { amount: 5000, priceId: "price_np_5000", productName: "5000 Notenpunkte (25% Bonus)", productDescription: "5000 NP für Shop und Battle Pass" },
};

const SUPPORT_BONUS: Record<string, number> = {
  "booster-bundle-20": 1,
  "booster-bundle-50": 4,
  "booster-bundle-100": 8,
};

const SHOP_ITEM_LABELS: Record<string, string> = {
  "booster-bundle-1": "1 Booster",
  "booster-bundle-3": "3 Booster",
  "booster-bundle-5": "5 Booster",
  "booster-bundle-10": "10 Booster",
  "booster-bundle-20": "20 Booster",
  "booster-bundle-50": "50 Booster",
  "booster-bundle-100": "100 Booster",
  "soli-donation-small": "Soli-Spende Klein",
  "soli-donation-medium": "Soli-Spende Mittel",
  "soli-donation-large": "Soli-Spende Gross",
};

const PACK_CONFIGS: Record<string, {
  id: string;
  name: string;
  cardCount: number;
  lootPools: Array<{ setId: string; weight: number }>;
}> = {
  "teacher_vol1": {
    id: "teacher_vol1",
    name: "Lehrer Booster v1",
    cardCount: 3,
    lootPools: [{ setId: "teacher_vol1", weight: 100 }],
  },
  "teachers_v1": {
    id: "teachers_v1",
    name: "Lehrer Booster v1 (Legacy)",
    cardCount: 3,
    lootPools: [{ setId: "teacher_vol1", weight: 100 }],
  },
  "support_vol_1": {
    id: "support_vol_1",
    name: "Support Booster Vol. 1",
    cardCount: 1,
    lootPools: [
      { setId: "support_v1", weight: 100 },
    ],
  },
};

const DEFAULT_DAILY_PACK_ALLOWANCE = 2;
const BERLIN_TIMEZONE = "Europe/Berlin";

const toSafeInt = (val: any) => {
  const parsed = parseInt(String(val));
  return isNaN(parsed) ? 0 : parsed;
};

const toBerlinParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BERLIN_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(map.get("year")),
    month: Number(map.get("month")),
    day: Number(map.get("day")),
    hour: Number(map.get("hour")),
  };
};

const formatDatePart = (val: number) => val.toString().padStart(2, "0");

const addDaysToDayString = (val: string, delta: number): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
  if (!match) return val;
  const base = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const next = new Date(base + delta * 24 * 60 * 60 * 1000);
  return `${next.getUTCFullYear()}-${formatDatePart(next.getUTCMonth() + 1)}-${formatDatePart(next.getUTCDate())}`;
};

const centsToEuro = (cents: number): number => Number((cents / 100).toFixed(2));

const getMonthKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const buildShopEarningPayload = (session: Stripe.Checkout.Session, itemId: string, userId?: string | null) => {
  const grossCents = Number(session.amount_total || 0);
  const stripeFeeCents = grossCents > 0 ? Math.max(0, Math.round(grossCents * 0.015 + 25)) : 0;
  const payoutNetCents = Math.max(0, grossCents - stripeFeeCents);
  const abiShareEur = Number((centsToEuro(payoutNetCents) * 0.9).toFixed(2));
  const platformShareEur = Number((centsToEuro(payoutNetCents) - abiShareEur).toFixed(2));
  const selectedCourse = (session.metadata?.selectedCourse || "").trim();
  const donorName = (session.metadata?.donorName || "").trim();
  const processedAt = session.created
    ? new Date(session.created * 1000)
    : new Date();

  return {
    stripe_session_id: session.id,
    user_id: userId || "guest",
    is_guest: !userId,
    item_id: itemId,
    item_label: SHOP_ITEM_LABELS[itemId] || itemId,
    amount_total_eur: centsToEuro(grossCents),
    amount_total_cents: grossCents,
    stripe_fee_eur: centsToEuro(stripeFeeCents),
    stripe_fee_cents: stripeFeeCents,
    payout_net_eur: centsToEuro(payoutNetCents),
    payout_net_cents: payoutNetCents,
    abi_share_eur: abiShareEur,
    platform_share_eur: platformShareEur,
    selected_course: selectedCourse || null,
    payer_name: donorName || session.customer_details?.name || null,
    customer_email: session.customer_details?.email || null,
    month_key: getMonthKey(processedAt),
    processed_at: Timestamp.fromDate(processedAt),
    created_by: "stripe_webhook",
    updated_at: FieldValue.serverTimestamp(),
  };
};

const getCurrentBoosterDay = (config?: any): string => {
  const resetHour = config?.global_limits?.reset_hour ?? 9;
  const berlin = toBerlinParts(new Date());
  const baseDay = `${berlin.year}-${formatDatePart(berlin.month)}-${formatDatePart(berlin.day)}`;
  return berlin.hour < resetHour ? addDaysToDayString(baseDay, -1) : baseDay;
};

const ALLOWED_ORIGINS = [
  "https://abi-planer-27.de",
  "https://dashboard.abi-planer-27.de",
  "https://abi-planer-75319.web.app",
  "https://abi-planer-75319.firebaseapp.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  /\.localhost:3000$/,
];

export const createStripeCheckoutSession = onCall({
  cors: ALLOWED_ORIGINS,
  maxInstances: 10,
  memory: "256MiB",
  region: "europe-west3",
  secrets: ["STRIPE_SECRET_KEY"],
}, async (request) => {
  const { itemId, selectedCourse, donorName } = request.data;
  const product = STRIPE_PRICES[itemId];
  if (!product) throw new HttpsError("invalid-argument", "Ungültiges Produkt.");

  const isAppProduct = itemId.includes("booster");
  if (isAppProduct && !request.auth) throw new HttpsError("unauthenticated", "Konto erforderlich.");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const session = await stripe.checkout.sessions.create({
    line_items: product.priceId ? [{ price: product.priceId, quantity: 1 }] : [{ quantity: 1, price_data: { currency: "eur", unit_amount: product.unitAmountCents, product_data: { name: product.productName || itemId } } }],
    mode: "payment",
    client_reference_id: request.auth?.uid,
    metadata: { itemId, amount: product.amount.toString(), isAppProduct: isAppProduct.toString(), selectedCourse: selectedCourse || "", donorName: donorName || "" },
    success_url: isAppProduct ? `https://abi-planer-27.de/sammelkarten?success=true` : `https://abi-planer-27.de/shop?success=true`,
    cancel_url: `https://abi-planer-27.de/shop?canceled=true`,
  });
  return { url: session.url };
});

export const stripeWebhook = onRequest({
  cors: true,
  region: "europe-west3",
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
}, async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    
    // 1. Verify Stripe signature (security check #1)
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch (err: any) {
      logger.error(`[STRIPE_WEBHOOK] Signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // 2. Check webhook idempotency (security check #2: prevent double-processing)
    const { isDuplicate } = await validateWebhookIdempotency(
      (event.data.object as any).payment_intent || (event.data.object as any).id,
      event.id
    );

    if (isDuplicate) {
      logger.warn(`[STRIPE_WEBHOOK] Duplicate webhook detected (replay attack?). Event ID: ${event.id}`);
      res.status(200).send({ received: true, status: "duplicate_ignored" });
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const itemId = session.metadata?.itemId;
      const amount = Number(session.metadata?.amount || 0);
      const isNPPack = itemId?.startsWith("np-pack-") || false;
      const isBoosterPurchase = itemId?.includes("booster") || false;
      
      if (!itemId || ((isNPPack || isBoosterPurchase) && !userId)) {
        logger.warn(`[STRIPE_WEBHOOK] Missing itemId or userId. Ignored.`);
        res.status(200).send({ received: true, status: "invalid_metadata" });
        return;
      }

      // 3. Rate limiting check (security check #3)
      if (userId) {
        const rateLimitCheck = await checkRateLimit(userId, "purchase", 3600);
        if (!rateLimitCheck.allowed) {
          logger.warn(`[STRIPE_WEBHOOK] Rate limit exceeded for user ${userId}. Reset at: ${rateLimitCheck.resetAt}`);
          // Don't process, but don't fail the webhook
          res.status(200).send({ received: true, status: "rate_limited" });
          return;
        }
      }

      // 4. Input validation (security check #4)
      if (amount <= 0 || amount > 100000) {
        logger.error(`[STRIPE_WEBHOOK] Invalid amount: ${amount}`);
        res.status(400).send({ error: "Invalid amount" });
        return;
      }

      const db = getFirestore("abi-data");
      
      // 5. NP purchases use secure atomic update
      if (isNPPack) {
        try {
          const result = await atomicNPUpdate(
            userId,
            amount,
            "purchase_stripe",
            {
              sourceDocId: session.id,
              stripePaymentIntent: session.payment_intent as string,
              ipAddress: req.ip,
              userAgent: req.get("user-agent"),
            }
          );
          
          logger.info(`[NP_PURCHASE] Success. User: ${userId}, Amount: +${amount} NP, Balance: ${result.newBalance}, TX ID: ${result.transactionId}`);
          
          if (result.fraudAlert) {
            logger.warn(`[NP_FRAUD_ALERT] ${result.fraudAlert}`);
          }

          await markWebhookProcessed(event.id, result.transactionId);
          res.status(200).send({ received: true, status: "processed", transaction_id: result.transactionId });
        } catch (npError: any) {
          logger.error(`[NP_PURCHASE_ERROR] ${npError.message}`);
          res.status(200).send({ received: true, status: "np_error", error: npError.message });
        }
      } else {
        const shopEarningRef = db.collection("shop_earnings").doc(session.id);
        const shopEarningPayload = buildShopEarningPayload(session, itemId, userId);

        if (isBoosterPurchase) {
          // 6. Booster purchases update inventory and earnings atomically.
          const supportBonus = SUPPORT_BONUS[itemId] || 0;
          const profileRef = db.collection("profiles").doc(userId);

          try {
            await db.runTransaction(async (transaction) => {
              const profileSnap = await transaction.get(profileRef);
              if (!profileSnap.exists) throw new Error(`Profile ${userId} not found`);

              const updates: any = {
                "booster_stats.extra_available": FieldValue.increment(amount),
                "booster_stats.inventory.teacher_vol1": FieldValue.increment(amount),
                updated_at: FieldValue.serverTimestamp(),
              };
              if (supportBonus > 0) {
                updates["booster_stats.support_extra_available"] = FieldValue.increment(supportBonus);
                updates["booster_stats.inventory.support_vol_1"] = FieldValue.increment(supportBonus);
              }
              transaction.update(profileRef, updates);
              transaction.set(shopEarningRef, shopEarningPayload, { merge: true });
            });

            logger.info(`[BOOSTER_PURCHASE] Success. User: ${userId}, Item: ${itemId}, Amount: ${amount}`);
            await markWebhookProcessed(event.id);
            res.status(200).send({ received: true, status: "processed" });
          } catch (boosterError: any) {
            logger.error(`[BOOSTER_PURCHASE_ERROR] ${boosterError.message}`);
            res.status(200).send({ received: true, status: "booster_error", error: boosterError.message });
          }
        } else {
          // 7. Non-booster purchases (e.g. Soli-Spende) are captured for earnings/leaderboard.
          try {
            await shopEarningRef.set(shopEarningPayload, { merge: true });
            logger.info(`[SHOP_EARNING_CAPTURED] Session: ${session.id}, Item: ${itemId}, Course: ${shopEarningPayload.selected_course || "none"}`);
            await markWebhookProcessed(event.id);
            res.status(200).send({ received: true, status: "processed" });
          } catch (earningError: any) {
            logger.error(`[SHOP_EARNING_CAPTURE_ERROR] ${earningError.message}`);
            res.status(200).send({ received: true, status: "earning_error", error: earningError.message });
          }
        }
      }
    } else {
      // Other Stripe event types (log but don't process)
      logger.info(`[STRIPE_WEBHOOK] Ignoring event type: ${event.type}`);
      await markWebhookProcessed(event.id);
      res.status(200).send({ received: true, status: "event_ignored", type: event.type });
    }
  } catch (err: any) {
    logger.error(`[STRIPE_WEBHOOK] Unexpected error: ${err.message}`, err);
    res.status(500).send({ error: "Internal server error" });
  }
});

export const openBooster = onCall({
  cors: ALLOWED_ORIGINS,
  maxInstances: 10,
  memory: "256MiB",
  region: "europe-west3",
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  const db = getFirestore("abi-data");
  const userId = request.auth.uid;
  const countToOpen = Math.min(Math.max(toSafeInt(request.data.count) || 1, 1), 10);
  const requestedPackId = (request.data.packId || TEACHER_PACK_ID) as string;
  const packId = normalizeTeacherPackId(requestedPackId);
  const packConfig = PACK_CONFIGS[packId] || PACK_CONFIGS[TEACHER_PACK_ID];

  return await db.runTransaction(async (transaction) => {
    const profileRef = db.collection("profiles").doc(userId);
    const userTeachersRef = db.collection("user_teachers").doc(userId);
    const settingsRef = db.collection("settings").doc("sammelkarten");
    const [profileSnap, userTeachersSnap, settingsSnap] = await Promise.all([transaction.get(profileRef), transaction.get(userTeachersRef), transaction.get(settingsRef)]);

    if (!profileSnap.exists) throw new HttpsError("not-found", "Profil fehlt.");
    const profileData = profileSnap.data() || {};
    const boosterStats = profileData.booster_stats || {};
    const config = settingsSnap.data() as any;
    const today = getCurrentBoosterDay(config);
    const dailyAllowance = toSafeInt(config?.global_limits?.daily_allowance) || DEFAULT_DAILY_PACK_ALLOWANCE;

    const inventory = boosterStats.inventory || {};
    const rawExtra = toSafeInt(boosterStats.extra_available);
    const rawSupp = toSafeInt(boosterStats.support_extra_available);
    
    let migrated = { ...inventory };
    if (rawExtra > 0) migrated[TEACHER_PACK_ID] = (migrated[TEACHER_PACK_ID] || 0) + rawExtra;
    if (rawSupp > 0) migrated["support_vol_1"] = (migrated["support_vol_1"] || 0) + rawSupp;

    // Consolidate old teacher inventory key into canonical key.
    const legacyTeacherInventory = toSafeInt(migrated[LEGACY_TEACHER_PACK_ID]);
    if (legacyTeacherInventory > 0) {
      migrated[TEACHER_PACK_ID] = (toSafeInt(migrated[TEACHER_PACK_ID]) || 0) + legacyTeacherInventory;
    }

    const openedToday = boosterStats.last_reset === today ? toSafeInt(boosterStats.count) : 0;
    const dailyRem = Math.max(0, dailyAllowance - openedToday);
    
    const isSupport = packId === "support_vol_1";
    let totalAvail = toSafeInt(migrated[packId]);
    if (isTeacherPackId(packId)) totalAvail += dailyRem;

    if (totalAvail < countToOpen) throw new HttpsError("failed-precondition", "Nicht genug Booster.");

    const variantProbs = config.variant_probabilities || {};
    const rollVariant = () => {
      const r = Math.random();
      if (r < (Number(variantProbs.black_shiny_holo) || 0.005)) return "black_shiny_holo";
      if (r < (Number(variantProbs.shiny) || 0.05)) return "shiny";
      if (r < (Number(variantProbs.holo) || 0.15)) return "holo";
      return "normal";
    };

    const userTeachersData = (userTeachersSnap.data() || {}) as any;
    const registerCard = (card: any, variant: string) => {
      const normalizedSetId = normalizeTeacherSetId(card.setId || TEACHER_PACK_ID);
      const fullId = `${normalizedSetId}:${card.id}`;
      if (!userTeachersData[fullId]) userTeachersData[fullId] = { count: 1, level: 1, variants: { [variant]: 1 } };
      else {
        const c = userTeachersData[fullId];
        c.count++;
        c.level = Math.floor(Math.sqrt(c.count - 1)) + 1;
        c.variants = c.variants || {};
        c.variants[variant] = (c.variants[variant] || 0) + 1;
      }
      return { id: fullId, name: card.name, rarity: card.rarity, variant, level: userTeachersData[fullId].level, count: userTeachersData[fullId].count };
    };

    const drawCard = (slot: number) => {
      const totalPoolWeight = packConfig.lootPools.reduce((s: number, p: any) => s + p.weight, 0);
      let sid = packConfig.lootPools[0].setId;
      let r = Math.random() * totalPoolWeight;
      for (const p of packConfig.lootPools) { if (r < p.weight) { sid = p.setId; break; } r -= p.weight; }
      sid = normalizeTeacherSetId(sid);
      
      // Teacher packs must draw from the same pool as the album (settings.sammelkarten.loot_teachers).
      const set = (isTeacherPackId(packId) && sid === TEACHER_PACK_ID)
        ? {
            id: TEACHER_PACK_ID,
            name: "Lehrer Set v1",
            prefix: CARD_SETS[TEACHER_PACK_ID]?.prefix || "T1",
            color: CARD_SETS[TEACHER_PACK_ID]?.color || "#3b82f6",
            cards: (Array.isArray(config?.loot_teachers) && config.loot_teachers.length > 0)
              ? config.loot_teachers
              : ((config.sets?.[sid]?.cards?.length ? config.sets[sid].cards : CARD_SETS[sid]?.cards) || []),
          }
        : (config.sets?.[sid] || CARD_SETS[sid]);
      
      if (!set) {
        logger.error(`Set ${sid} not found in config or static registry`);
        throw new HttpsError("not-found", `Set ${sid} nicht gefunden.`);
      }

      const weights = (Array.isArray(config.rarity_weights) ? config.rarity_weights[slot] : config.rarity_weights) || {};
      const rarities = ["common", "rare", "epic", "mythic", "legendary", "iconic"];
      const tw = rarities.reduce((s, rar) => s + (Number((weights as any)[rar]) || 0), 0);
      let selectedRar = "common";
      let rr = Math.random() * tw;
      for (const rar of rarities) { const rw = Number((weights as any)[rar]) || 0; if (rr < rw) { selectedRar = rar; break; } rr -= rw; }
      const pool = set.cards.filter((c: any) => c.rarity === selectedRar);
      const card = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : set.cards[0];
      return registerCard({ ...card, setId: sid }, rollVariant());
    };

    const allPacks = [];
    for (let i = 0; i < countToOpen; i++) {
      const cards = [];
      for (let s = 0; s < packConfig.cardCount; s++) cards.push(drawCard(s));
      allPacks.push({ cards, source: isSupport ? "support" : "random" });
    }

    const usedDaily = isSupport ? 0 : Math.min(dailyRem, countToOpen);
    const newInvVal = Math.max(0, toSafeInt(migrated[packId]) - (countToOpen - usedDaily));
    const { [LEGACY_TEACHER_PACK_ID]: _legacyTeacherKey, ...cleanInventory } = migrated;

    transaction.update(profileRef, {
      "booster_stats.last_reset": today,
      "booster_stats.count": openedToday + usedDaily,
      "booster_stats.extra_available": 0,
      "booster_stats.support_extra_available": 0,
      "booster_stats.inventory": { ...cleanInventory, [packId]: newInvVal },
      updated_at: FieldValue.serverTimestamp(),
    });
    transaction.set(userTeachersRef, userTeachersData);
    return { packs: allPacks };
  });
});

export const migrateBoosterStats = onCall({ cors: ALLOWED_ORIGINS, region: "europe-west3" }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  const db = getFirestore("abi-data");
  const profileRef = db.collection("profiles").doc(request.auth.uid);
  return await db.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(profileRef);
    if (!docSnap.exists) throw new HttpsError("not-found", "Profil fehlt.");
    const stats = docSnap.data()?.booster_stats || {};
    const inv = stats.inventory || {};
    const rawExtra = toSafeInt(stats.extra_available);
    const rawSupp = toSafeInt(stats.support_extra_available);
    if (rawExtra === 0 && rawSupp === 0) return { success: true, message: "Schon migriert." };
    const mig = { ...inv };
    mig[TEACHER_PACK_ID] = (toSafeInt(mig[TEACHER_PACK_ID]) || 0) + rawExtra + toSafeInt(mig[LEGACY_TEACHER_PACK_ID]);
    mig["support_vol_1"] = (mig["support_vol_1"] || 0) + rawSupp;
    delete mig[LEGACY_TEACHER_PACK_ID];
    transaction.update(profileRef, { "booster_stats.extra_available": 0, "booster_stats.support_extra_available": 0, "booster_stats.inventory": mig, updated_at: FieldValue.serverTimestamp() });
    return { success: true };
  });
});

export const purchaseBoosters = onCall({ cors: ALLOWED_ORIGINS, region: "europe-west3" }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  const { amount, itemId } = request.data;
  const db = getFirestore("abi-data");
  const profileRef = db.collection("profiles").doc(request.auth.uid);
  await db.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(profileRef);
    if (!docSnap.exists) throw new HttpsError("not-found", "Profil fehlt.");
    const stats = docSnap.data()?.booster_stats || {};
    const inv = stats.inventory || {};
    const bonus = SUPPORT_BONUS[itemId] || 0;
    const teacherInventory = (inv.teacher_vol1 || 0) + (inv.teachers_v1 || 0);
    transaction.update(profileRef, { 
      "booster_stats.inventory.teacher_vol1": teacherInventory + amount,
      "booster_stats.inventory.support_vol_1": (inv.support_vol_1 || 0) + bonus,
      updated_at: FieldValue.serverTimestamp() 
    });
  });
  return { success: true };
});
