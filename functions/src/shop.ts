import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import Stripe from "stripe";

// Die Preise müssen in deinem Stripe-Dashboard angelegt werden (price_123...)
type StripeShopProduct = {
  amount: number;
  priceId?: string;
  unitAmountCents?: number;
  productName?: string;
  productDescription?: string;
};

const STRIPE_PRICES: Record<string, StripeShopProduct> = {
  "booster-bundle-1": {
    amount: 1,
    priceId: "price_1TGgZIAnqErqKKxANg6Vc9zT",
  },
  "booster-bundle-3": {
    amount: 3,
    priceId: "price_1TGgZXAnqErqKKxA617iNBcY",
  },
  "booster-bundle-5": {
    amount: 5,
    priceId: "price_1TGga5AnqErqKKxA9RwnDU7l",
  },
  "booster-bundle-10": {
    amount: 10,
    priceId: "price_1TGgaNAnqErqKKxAHijgndIu",
  },
  "booster-bundle-20": {
    amount: 20,
    priceId: "price_1TGgagAnqErqKKxAxUit6wg6",
  },
  "booster-bundle-50": {
    amount: 50,
    priceId: "price_1TGgauAnqErqKKxA6mYjvTwQ",
  },
  "booster-bundle-100": {
    amount: 100,
    priceId: "price_1TGgb8AnqErqKKxAXnpfj07T",
  },
  "soli-donation-small": {
    amount: 1,
    priceId: "price_1TGGzZAnqErqKKxAn2UYcCxq",
  },
  "soli-donation-medium": {
    amount: 1,
    priceId: "price_1TGGzsAnqErqKKxASTxTWqYj",
  },
  "soli-donation-large": {
    amount: 1,
    priceId: "price_1TGH03AnqErqKKxABplUroCg",
  },
};

const SHOP_ITEM_LABELS: Record<string, string> = {
  "booster-bundle-1": "Booster-Bundle 1",
  "booster-bundle-3": "Booster-Bundle 3",
  "booster-bundle-5": "Booster-Bundle 5",
  "booster-bundle-10": "Booster-Bundle 10",
  "booster-bundle-20": "Booster-Bundle 20",
  "booster-bundle-50": "Booster-Bundle 50",
  "booster-bundle-100": "Booster-Bundle 100",
  "soli-donation-small": "Kleiner Beitrag",
  "soli-donation-medium": "Mittlerer Beitrag",
  "soli-donation-large": "Großer Beitrag",
};

const SETTLEMENT_CURRENCY = "eur";

type StripeFeeBreakdown = {
  totalFeeCents: number;
  percentageFeeCents: number;
  fixedFeeCents: number;
  fxFeeCents: number;
  percentageRate: number;
  cardCountry: string | null;
  chargeCurrency: string;
  tier: "observed_default";
};

// Gebührenmodell (nach realen Shop-Daten):
// 1,5% + 0,25 EUR pro erfolgreicher Transaktion.
const calculateStripeFee = (
  grossAmountCents: number,
  cardCountryRaw: string | null,
  chargeCurrencyRaw: string | null,
): StripeFeeBreakdown => {
  const safeGross = Math.max(0, Math.floor(Number(grossAmountCents) || 0));
  const cardCountry = cardCountryRaw ? cardCountryRaw.toUpperCase() : null;
  const chargeCurrency = (chargeCurrencyRaw || SETTLEMENT_CURRENCY).toLowerCase();

  if (safeGross <= 0) {
    return {
      totalFeeCents: 0,
      percentageFeeCents: 0,
      fixedFeeCents: 0,
      fxFeeCents: 0,
      percentageRate: 0,
      cardCountry,
      chargeCurrency,
      tier: "observed_default",
    };
  }

  const percentageRate = 0.015;
  const tier: StripeFeeBreakdown["tier"] = "observed_default";

  const fixedFeeCents = 25;
  const percentageFeeCents = Math.round(safeGross * percentageRate);
  const fxFeeCents = 0;
  const totalFeeCents = percentageFeeCents + fixedFeeCents + fxFeeCents;

  return {
    totalFeeCents,
    percentageFeeCents,
    fixedFeeCents,
    fxFeeCents,
    percentageRate,
    cardCountry,
    chargeCurrency,
    tier,
  };
};

const LIMITS: Record<string, number> = {
  "booster-bundle-1": 20,
  "booster-bundle-3": 10,
  "booster-bundle-5": 5,
  "booster-bundle-10": 3,
  "booster-bundle-20": 2,
  "booster-bundle-50": 1,
  "booster-bundle-100": 1,
};

const BERLIN_TIMEZONE = "Europe/Berlin";
const DEFAULT_DAILY_PACK_ALLOWANCE = 2;
const DEFAULT_RESET_HOUR = 9;

const formatDatePart = (value: number) => value.toString().padStart(2, "0");

const addDaysToDayString = (value: string, delta: number): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const baseYear = Number(match[1]);
  const baseMonth = Number(match[2]);
  const baseDay = Number(match[3]);
  const base = Date.UTC(baseYear, baseMonth - 1, baseDay);

  const next = new Date(base + delta * 24 * 60 * 60 * 1000);
  const year = next.getUTCFullYear();
  const month = formatDatePart(next.getUTCMonth() + 1);
  const day = formatDatePart(next.getUTCDate());

  return `${year}-${month}-${day}`;
};

const toBerlinParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BERLIN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.get("year")),
    month: Number(map.get("month")),
    day: Number(map.get("day")),
    hour: Number(map.get("hour")),
  };
};

const getCurrentBoosterDay = (config: any): string => {
  const resetHour = Number(config?.global_limits?.reset_hour) || DEFAULT_RESET_HOUR;
  const now = new Date();
  const berlin = toBerlinParts(now);
  const baseDay = `${berlin.year}-${formatDatePart(berlin.month)}-${formatDatePart(berlin.day)}`;

  if (berlin.hour < resetHour) {
    return addDaysToDayString(baseDay, -1);
  }

  return baseDay;
};

const toSafeInt = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

type CustomQueueEntry = {
  ref: any;
  remainingPacks: number;
  allowRandomFill: boolean;
  slots: Array<{
    slotIndex: number;
    teacherId: string;
    variant?: "normal" | "holo" | "shiny" | "black_shiny_holo";
  }>;
  presetId: string | null;
  name: string | null;
};

/**
 * Cloud Function zum Erstellen einer Stripe Checkout Session.
 * Sicher: Nutzt client_reference_id (UserID).
 * Legal: Enthält Hinweis auf Widerrufsverzicht bei digitalen Gütern.
 */
export const createStripeCheckoutSession = onCall({
  cors: true,
  maxInstances: 10,
  memory: "256MiB",
  region: "europe-west3",
  secrets: ["STRIPE_SECRET_KEY"], // Nutzt Firebase Secrets für Live-Sicherheit
}, async (request) => {
  const { itemId, selectedCourse, donorName } = request.data;
  const product = STRIPE_PRICES[itemId];

  if (!product) {
    throw new HttpsError("invalid-argument", "Ungültiges Produkt.");
  }

  // Sicherheits-Check: Sammelkarten-Produkte erfordern zwingend ein Konto
  const isAppProduct = itemId.includes("booster");
  const isDonationProduct = itemId.startsWith("soli-donation");

  const sanitizedSelectedCourse = typeof selectedCourse === "string" ? selectedCourse.trim() : "";
  const sanitizedDonorName = typeof donorName === "string" ? donorName.trim() : "";

  if (sanitizedDonorName.length > 80) {
    throw new HttpsError("invalid-argument", "Der angegebene Name ist zu lang.");
  }

  if (isDonationProduct && sanitizedSelectedCourse) {
    const db = getFirestore("abi-data");
    const configSnap = await db.collection("settings").doc("config").get();
    const courses = (configSnap.exists ? configSnap.data()?.courses : []) as string[] | undefined;
    const validCourses = Array.isArray(courses)
      ? courses.filter((course) => typeof course === "string" && course.trim().length > 0).map((course) => course.trim())
      : [];

    if (!validCourses.includes(sanitizedSelectedCourse)) {
      throw new HttpsError("invalid-argument", "Der ausgewaehlte Kurs ist ungueltig.");
    }
  }

  if (isAppProduct && !request.auth) {
    throw new HttpsError("unauthenticated", "Für diesen Artikel ist ein Konto erforderlich.");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new HttpsError("internal", "Stripe ist noch nicht konfiguriert.");
  }

  const stripe = new Stripe(stripeKey);
  const userId = request.auth?.uid || null;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = product.priceId
    ? [{
      price: product.priceId,
      quantity: 1,
    }]
    : [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: product.unitAmountCents,
        product_data: {
          name: product.productName || itemId,
          description: product.productDescription,
        },
      },
    }];

  logger.info("Creating Stripe session", { userId, itemId, isGuest: !userId });

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      allow_promotion_codes: true,
      client_reference_id: userId || undefined, // Muss string oder undefined sein
      billing_address_collection: "required",
      metadata: {
        itemId: itemId,
        amount: product.amount.toString(),
        isAppProduct: isAppProduct.toString(),
        selectedCourse: sanitizedSelectedCourse || "",
        donorName: isDonationProduct ? sanitizedDonorName : "",
        legal_notice: "Widerrufsverzicht akzeptiert bei Ausführung"
      },
      automatic_tax: { enabled: true },
      custom_text: isAppProduct
        ? {
          submit: {
            message: "Mit dem Kauf stimmst du der sofortigen Ausführung zu und verlierst dein Widerrufsrecht bei digitalen Inhalten."
          }
        }
        : undefined,
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
  cors: true,
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
    const isDonationProduct = (itemId || "").startsWith("soli-donation");
    const selectedCourseRaw = typeof session.metadata?.selectedCourse === "string" ? session.metadata.selectedCourse.trim() : "";
    const selectedCourse = selectedCourseRaw.length > 0 ? selectedCourseRaw : null;
    const donorNameRaw = typeof session.metadata?.donorName === "string" ? session.metadata.donorName.trim() : "";
    const donorName = donorNameRaw.length > 0 ? donorNameRaw : null;
    const amountTotalCents = Number(session.amount_total || 0);
    const amountTotalEur = amountTotalCents > 0 ? amountTotalCents / 100 : 0;
    const fee = calculateStripeFee(amountTotalCents, null, session.currency || null);
    const stripeFeeCents = fee.totalFeeCents;
    const payoutNetCents = Math.max(0, amountTotalCents - stripeFeeCents);

    const stripeFeeEur = stripeFeeCents > 0 ? stripeFeeCents / 100 : 0;
    const payoutNetEur = payoutNetCents > 0 ? payoutNetCents / 100 : 0;

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

        let responsibleClass: string | null = selectedCourse;
        let payerName: string | null = null;
        let profileRef: FirebaseFirestore.DocumentReference | null = null;

        if (userId) {
          profileRef = db.collection("profiles").doc(userId);
          const profileDoc = await transaction.get(profileRef);
          const profileData = profileDoc.exists ? profileDoc.data() : null;

          if (!isDonationProduct && !responsibleClass && typeof profileData?.class_name === "string" && profileData.class_name.trim().length > 0) {
            responsibleClass = profileData.class_name.trim();
          }

          if (typeof profileData?.full_name === "string" && profileData.full_name.trim().length > 0) {
            payerName = profileData.full_name.trim();
          }
        }

        if (donorName) {
          payerName = donorName;
        }

        if (!payerName && typeof session.customer_details?.name === "string" && session.customer_details.name.trim().length > 0) {
          payerName = session.customer_details.name.trim();
        }

        if (!payerName && typeof session.customer_details?.email === "string" && session.customer_details.email.trim().length > 0) {
          payerName = session.customer_details.email.trim();
        }

        if (!payerName) {
          payerName = userId ? "Shop-Kauf" : "Gastkauf";
        }

        // 1. Fulfillment für App-Produkte (Booster) nur wenn UserID vorhanden
        if (isAppProduct && userId && profileRef) {
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
          charged_amount_eur: amountTotalEur,
          charged_amount_cents: amountTotalCents,
          stripe_fee_eur: stripeFeeEur,
          stripe_fee_cents: stripeFeeCents,
          stripe_fee_percentage_rate: fee.percentageRate,
          stripe_fee_percentage_cents: fee.percentageFeeCents,
          stripe_fee_fixed_cents: fee.fixedFeeCents,
          stripe_fee_fx_cents: fee.fxFeeCents,
          stripe_fee_tier: fee.tier,
          stripe_card_country: fee.cardCountry,
          stripe_charge_currency: fee.chargeCurrency,
          payout_net_eur: payoutNetEur,
          payout_net_cents: payoutNetCents,
          item_id: itemId,
          selected_course: responsibleClass,
          donor_name: donorName,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || null,
          processed_at: FieldValue.serverTimestamp(),
          status: "completed"
        });

        // 2b. Dedizierte Shop-Einnahmen-Tabelle für Admin-Auswertungen
        if (amountTotalEur > 0) {
          const processedDate = new Date();
          const monthKey = `${processedDate.getFullYear()}-${String(processedDate.getMonth() + 1).padStart(2, "0")}`;
          const itemLabel = itemId ? (SHOP_ITEM_LABELS[itemId] || itemId) : "Shop-Kauf";
          const shopEarningsRef = db.collection("shop_earnings").doc(session.id);
          transaction.set(shopEarningsRef, {
            stripe_session_id: session.id,
            user_id: userId || "guest",
            is_guest: !userId,
            item_id: itemId,
            item_label: itemLabel,
            amount_total_eur: amountTotalEur,
            amount_total_cents: amountTotalCents,
            stripe_fee_eur: stripeFeeEur,
            stripe_fee_cents: stripeFeeCents,
            stripe_fee_percentage_rate: fee.percentageRate,
            stripe_fee_percentage_cents: fee.percentageFeeCents,
            stripe_fee_fixed_cents: fee.fixedFeeCents,
            stripe_fee_fx_cents: fee.fxFeeCents,
            stripe_fee_tier: fee.tier,
            stripe_card_country: fee.cardCountry,
            stripe_charge_currency: fee.chargeCurrency,
            payout_net_eur: payoutNetEur,
            payout_net_cents: payoutNetCents,
            abi_share_eur: Number((payoutNetEur * 0.9).toFixed(2)),
            platform_share_eur: Number((payoutNetEur * 0.1).toFixed(2)),
            selected_course: responsibleClass,
            payer_name: payerName,
            customer_email: session.customer_details?.email || null,
            month_key: monthKey,
            processed_at: FieldValue.serverTimestamp(),
            created_by: "system:stripe",
          });
        }

        // 3. Kauf in Finanzen eintragen (alle Shop-Käufe)
        if (amountTotalEur > 0) {
          const financeRef = db.collection("finances").doc();
          const itemLabel = itemId ? (SHOP_ITEM_LABELS[itemId] || itemId) : "Shop-Kauf";

          transaction.set(financeRef, {
            amount: amountTotalEur,
            description: `Shop-Kauf: ${itemLabel}`,
            responsible_class: responsibleClass,
            responsible_user_name: payerName,
            created_by: "system:stripe",
            entry_date: FieldValue.serverTimestamp(),
          });
        }

        // 4. Audit-Log
        const logRef = db.collection("logs").doc();
        transaction.set(logRef, {
          user_id: userId || "guest",
          action: "STRIPE_PAYMENT_SUCCESS",
          details: {
            session_id: session.id,
            item: itemId,
            booster_count: isAppProduct ? amount : 0,
            charged_amount_eur: amountTotalEur,
            stripe_fee_eur: stripeFeeEur,
            payout_net_eur: payoutNetEur,
            responsible_class: responsibleClass,
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
 * Migriert historische stripe_transactions in die dedizierte shop_earnings Tabelle.
 * Nur fuer Admin-Rollen aufrufbar.
 */
export const backfillShopEarnings = onCall({
  cors: true,
  maxInstances: 1,
  memory: "256MiB",
  region: "europe-west3",
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }

  const db = getFirestore("abi-data");
  const callerProfile = await db.collection("profiles").doc(request.auth.uid).get();
  const role = callerProfile.exists ? callerProfile.data()?.role : null;
  const isAdmin = role === "admin" || role === "admin_main" || role === "admin_co";

  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Nur Admins duerfen den Backfill ausfuehren.");
  }

  const stripeSnapshot = await db.collection("stripe_transactions").get();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let invalid = 0;

  let batch = db.batch();
  let operationCount = 0;

  for (const txDoc of stripeSnapshot.docs) {
    const tx = txDoc.data() || {};
    const shopRef = db.collection("shop_earnings").doc(txDoc.id);
    const shopDoc = await shopRef.get();

    const amountTotalEur = Number(tx.charged_amount_eur || 0);
    const amountTotalCents = Number(tx.charged_amount_cents || 0);
    if (!Number.isFinite(amountTotalEur) || amountTotalEur <= 0) {
      invalid++;
      continue;
    }

    const processedAt = tx.processed_at;
    const processedDate = processedAt && typeof processedAt.toDate === "function"
      ? processedAt.toDate()
      : new Date();
    const monthKey = `${processedDate.getFullYear()}-${String(processedDate.getMonth() + 1).padStart(2, "0")}`;

    const itemId = typeof tx.item_id === "string" ? tx.item_id : "shop-unknown";
    const itemLabel = SHOP_ITEM_LABELS[itemId] || itemId;
    const payerName = typeof tx.donor_name === "string" && tx.donor_name.trim().length > 0 ? tx.donor_name.trim() : null;
    const selectedCourse = typeof tx.selected_course === "string" && tx.selected_course.trim().length > 0 ? tx.selected_course.trim() : null;
    const customerEmail = typeof tx.customer_email === "string" && tx.customer_email.trim().length > 0 ? tx.customer_email.trim() : null;
    const stripeSessionId = typeof tx.stripe_session_id === "string" ? tx.stripe_session_id : txDoc.id;

    const cardCountry: string | null = typeof tx.stripe_card_country === "string" ? tx.stripe_card_country : null;
    const chargeCurrency: string | null = typeof tx.stripe_charge_currency === "string" ? tx.stripe_charge_currency : SETTLEMENT_CURRENCY;

    const fee = calculateStripeFee(amountTotalCents, cardCountry, chargeCurrency);
    const stripeFeeCents = fee.totalFeeCents;
    const payoutNetCents = Math.max(0, amountTotalCents - stripeFeeCents);

    const stripeFeeEur = stripeFeeCents > 0 ? stripeFeeCents / 100 : 0;
    const payoutNetEur = payoutNetCents > 0 ? payoutNetCents / 100 : 0;

    batch.set(shopRef, {
      stripe_session_id: stripeSessionId,
      user_id: typeof tx.user_id === "string" ? tx.user_id : "guest",
      is_guest: Boolean(tx.is_guest),
      item_id: itemId,
      item_label: itemLabel,
      amount_total_eur: amountTotalEur,
      amount_total_cents: Number.isFinite(amountTotalCents) ? amountTotalCents : Math.round(amountTotalEur * 100),
      stripe_fee_eur: stripeFeeEur,
      stripe_fee_cents: Number.isFinite(stripeFeeCents) ? stripeFeeCents : 0,
      stripe_fee_percentage_rate: fee.percentageRate,
      stripe_fee_percentage_cents: fee.percentageFeeCents,
      stripe_fee_fixed_cents: fee.fixedFeeCents,
      stripe_fee_fx_cents: fee.fxFeeCents,
      stripe_fee_tier: fee.tier,
      stripe_card_country: fee.cardCountry,
      stripe_charge_currency: fee.chargeCurrency,
      payout_net_eur: payoutNetEur,
      payout_net_cents: Number.isFinite(payoutNetCents) ? payoutNetCents : Math.max(0, amountTotalCents - stripeFeeCents),
      abi_share_eur: Number((payoutNetEur * 0.9).toFixed(2)),
      platform_share_eur: Number((payoutNetEur * 0.1).toFixed(2)),
      selected_course: selectedCourse,
      payer_name: payerName,
      customer_email: customerEmail,
      month_key: monthKey,
      processed_at: processedAt || FieldValue.serverTimestamp(),
      created_by: "system:backfill_shop_earnings",
    }, { merge: true });

    if (shopDoc.exists) {
      updated++;
    } else {
      created++;
    }

    operationCount++;

    if (operationCount >= 400) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  logger.info("backfillShopEarnings completed", {
    actor: request.auth.uid,
    created,
    updated,
    skipped,
    invalid,
    total: stripeSnapshot.size,
  });

  return {
    success: true,
    created,
    updated,
    skipped,
    invalid,
    total: stripeSnapshot.size,
  };
});

/**
 * Cloud Function zum (Demo-)Kauf von Boostern mit monatlichem Limit.
 */
export const purchaseBoosters = onCall({ 
  cors: true,
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
 * Wenn eine Custom-Pack-Queue vorhanden ist, werden diese Packs zuerst deterministisch verarbeitet.
 */
export const openBooster = onCall({
  cors: true,
  maxInstances: 10,
  memory: "256MiB",
  region: "europe-west3",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }

  const userId = request.auth.uid;
  const db = getFirestore("abi-data");
  const countToOpen = Math.min(Math.max(Number(request.data.count) || 1, 1), 10);
  const requestedPackSource = request.data.packSource === "custom" || request.data.packSource === "random"
    ? request.data.packSource
    : null;
  const requestedCustomPackQueueId = typeof request.data.customPackQueueId === "string"
    ? request.data.customPackQueueId.trim()
    : "";

  try {
    return await db.runTransaction(async (transaction) => {
      const profileRef = db.collection("profiles").doc(userId);
      const userTeachersRef = db.collection("user_teachers").doc(userId);
      const settingsRef = db.collection("settings").doc("sammelkarten");

      const [profileSnap, userTeachersSnap, settingsSnap] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(userTeachersRef),
        transaction.get(settingsRef),
      ]);

      const customQueueQuery = profileRef.collection("custom_pack_queue")
        .orderBy("createdAt", "asc")
        .limit(40);
      const customQueueSnap: any = await transaction.get(customQueueQuery);

      if (!profileSnap.exists) {
        throw new HttpsError("not-found", "Profil nicht gefunden.");
      }

      const profileData = profileSnap.data() || {};
      const boosterStats = profileData.booster_stats || {};

      if (!settingsSnap.exists) {
        throw new HttpsError("internal", "Sammelkarten-Konfiguration fehlt.");
      }

      const config = settingsSnap.data() as any;
      const dailyAllowance = Math.max(0, Math.floor(Number(config?.global_limits?.daily_allowance) || DEFAULT_DAILY_PACK_ALLOWANCE));
      const today = getCurrentBoosterDay(config);

      const rawExtraAvailable = toSafeInt(boosterStats.extra_available);
      const rawCount = toSafeInt(boosterStats.count);
      const lastReset = typeof boosterStats.last_reset === "string" && /^\d{4}-\d{2}-\d{2}$/.test(boosterStats.last_reset)
        ? boosterStats.last_reset
        : today;

      const isCurrentBoosterDay = lastReset === today;
      const openedToday = isCurrentBoosterDay ? rawCount : 0;
      const dailyRemaining = Math.max(0, dailyAllowance - openedToday);
      const effectiveExtraAvailable = rawExtraAvailable;

      const lootTeachers = (config.loot_teachers || []) as any[];
      const lootTeachersById = new Map<string, any>(
        lootTeachers
          .map((teacher) => [String(teacher?.id || "").trim(), teacher] as const)
          .filter(([teacherId]) => teacherId.length > 0),
      );
      const rarityWeightsRaw = config.rarity_weights || [];
      const rarityWeights = Array.isArray(rarityWeightsRaw) ? rarityWeightsRaw : [rarityWeightsRaw];
      const variantProbs = config.variant_probabilities || {};

      if (lootTeachers.length === 0 || rarityWeights.length === 0) {
        throw new HttpsError("internal", "Keine Karten zum Ziehen verfügbar.");
      }

      const rollVariant = (): "normal" | "holo" | "shiny" | "black_shiny_holo" => {
        const randVariantValue = Math.random();
        if (randVariantValue < (Number(variantProbs.black_shiny_holo) || 0.005)) {
          return "black_shiny_holo";
        }
        if (randVariantValue < (Number(variantProbs.shiny) || 0.05)) {
          return "shiny";
        }
        if (randVariantValue < (Number(variantProbs.holo) || 0.15)) {
          return "holo";
        }
        return "normal";
      };

      const userTeachersData = (userTeachersSnap.data() || {}) as any;

      const registerCard = (teacher: any, variant: "normal" | "holo" | "shiny" | "black_shiny_holo") => {
        const teacherId = String(teacher.id || "").trim();
        if (!teacherId) {
          throw new HttpsError("internal", "Ungültige Kartenkonfiguration: teacherId fehlt.");
        }

        if (!userTeachersData[teacherId]) {
          userTeachersData[teacherId] = {
            count: 1,
            level: 1,
            variants: { [variant]: 1 },
          };
        } else {
          const current = userTeachersData[teacherId];
          current.count = (Number(current.count) || 0) + 1;
          current.level = Math.floor(Math.sqrt(current.count - 1)) + 1;
          if (!current.variants) current.variants = {};
          current.variants[variant] = (Number(current.variants[variant]) || 0) + 1;
        }

        return {
          id: teacherId,
          name: teacher.name,
          rarity: teacher.rarity,
          variant,
          level: userTeachersData[teacherId].level,
          count: userTeachersData[teacherId].count,
        };
      };

      const drawRandomCard = (slotIndex: number) => {
        const weights = rarityWeights[slotIndex] || rarityWeights[0] || {};
        const rarities = ["common", "rare", "epic", "mythic", "legendary", "iconic"];
        const totalWeight = rarities.reduce((sum, rarity) => sum + (Number(weights[rarity]) || 0), 0);

        let selectedRarity = "common";
        if (totalWeight > 0) {
          let randomRarityValue = Math.random() * totalWeight;
          for (const rarity of rarities) {
            const rarityWeight = Number(weights[rarity]) || 0;
            if (randomRarityValue < rarityWeight) {
              selectedRarity = rarity;
              break;
            }
            randomRarityValue -= rarityWeight;
          }
        }

        const candidates = lootTeachers.filter((teacher) => teacher.rarity === selectedRarity);
        const selectedTeacher = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : (lootTeachers.find((teacher) => teacher.rarity === "common") || lootTeachers[0]);

        if (!selectedTeacher) {
          throw new HttpsError("internal", "Es konnte keine Karte gezogen werden.");
        }

        return registerCard(selectedTeacher, rollVariant());
      };

      const queueEntries: CustomQueueEntry[] = customQueueSnap?.docs.map((queueDoc: any) => {
        const queueData = queueDoc.data() || {};
        const slots = Array.isArray(queueData.slots)
          ? queueData.slots
            .map((slot: any) => ({
              slotIndex: Math.max(0, Math.floor(Number(slot?.slotIndex))),
              teacherId: String(slot?.teacherId || "").trim(),
              variant: slot?.variant,
            }))
            .filter((slot: any) => slot.teacherId.length > 0)
          : [];

        return {
          ref: queueDoc.ref,
          remainingPacks: toSafeInt(queueData.remainingPacks),
          allowRandomFill: queueData.allowRandomFill !== false,
          slots,
          presetId: queueData.presetId || null,
          name: queueData.name || null,
        };
      }) || [];

      const reservedCustomPacks = queueEntries.reduce<number>((sum: number, entry: CustomQueueEntry) => sum + Math.max(0, toSafeInt(entry.remainingPacks)), 0);
      const totalAvailable = requestedPackSource === "random"
        ? dailyRemaining + Math.max(0, effectiveExtraAvailable - reservedCustomPacks)
        : dailyRemaining + effectiveExtraAvailable;

      if (totalAvailable < countToOpen) {
        throw new HttpsError(
          "failed-precondition",
          `Nicht genügend Booster verfügbar (${totalAvailable} vorhanden, ${countToOpen} benötigt).`
        );
      }

      const firstAvailableCustomQueueEntry = queueEntries.find((entry: CustomQueueEntry) => entry.remainingPacks > 0 && entry.slots.length > 0) || null;
      const requestedCustomQueueEntry = requestedCustomPackQueueId
        ? queueEntries.find((entry: CustomQueueEntry) => entry.ref.id === requestedCustomPackQueueId && entry.remainingPacks > 0 && entry.slots.length > 0) || null
        : null;

      if (requestedPackSource === "custom" && !requestedCustomQueueEntry && !firstAvailableCustomQueueEntry) {
        throw new HttpsError("failed-precondition", "Es ist kein Custom Pack zur Auswahl verfügbar.");
      }

      if (requestedPackSource === "custom" && requestedCustomPackQueueId && !requestedCustomQueueEntry) {
        throw new HttpsError("failed-precondition", "Das ausgewählte Custom Pack ist nicht mehr verfügbar.");
      }

      let explicitCustomQueueEntry = requestedPackSource === "custom"
        ? (requestedCustomQueueEntry || firstAvailableCustomQueueEntry)
        : null;

      if (requestedPackSource === "custom" && explicitCustomQueueEntry && explicitCustomQueueEntry.remainingPacks < countToOpen) {
        throw new HttpsError(
          "failed-precondition",
          `Das gewählte Custom Pack ist nur noch ${explicitCustomQueueEntry.remainingPacks}x verfuegbar.`
        );
      }

      const allPacks: any[] = [];
      let customPacksOpened = 0;

      for (let packIndex = 0; packIndex < countToOpen; packIndex += 1) {
        const queueEntry = requestedPackSource === "random"
          ? null
          : (requestedPackSource === "custom"
            ? (explicitCustomQueueEntry && explicitCustomQueueEntry.remainingPacks > 0 ? explicitCustomQueueEntry : null)
            : queueEntries.find((entry: CustomQueueEntry) => entry.remainingPacks > 0 && entry.slots.length > 0) || null);
        const cardsOpenedInPack: any[] = [];

        if (queueEntry) {
          customPacksOpened += 1;
          for (let slotIndex = 0; slotIndex < rarityWeights.length; slotIndex += 1) {
            const forcedSlot = queueEntry.slots.find((slot: any) => slot.slotIndex === slotIndex);
            if (forcedSlot) {
              const forcedTeacher = lootTeachersById.get(forcedSlot.teacherId);
              if (!forcedTeacher) {
                throw new HttpsError("failed-precondition", `Custom-Pack enthält unbekannte teacherId '${forcedSlot.teacherId}'.`);
              }
              const forcedVariant = forcedSlot.variant === "normal" || forcedSlot.variant === "holo" || forcedSlot.variant === "shiny" || forcedSlot.variant === "black_shiny_holo"
                ? forcedSlot.variant
                : rollVariant();
              cardsOpenedInPack.push(registerCard(forcedTeacher, forcedVariant));
              continue;
            }

            if (queueEntry.allowRandomFill) {
              cardsOpenedInPack.push(drawRandomCard(slotIndex));
            }
          }

          queueEntry.remainingPacks = Math.max(0, queueEntry.remainingPacks - 1);
          if (requestedPackSource === "custom") {
            explicitCustomQueueEntry = queueEntry;
          }
          allPacks.push({
            cards: cardsOpenedInPack,
            source: "custom",
            customPackPresetId: queueEntry.presetId,
            customPackName: queueEntry.name,
          });
        } else {
          for (let slotIndex = 0; slotIndex < rarityWeights.length; slotIndex += 1) {
            cardsOpenedInPack.push(drawRandomCard(slotIndex));
          }
          allPacks.push({ cards: cardsOpenedInPack, source: "random" });
        }
      }

      const usedFromDaily = Math.min(dailyRemaining, countToOpen);
      const usedFromExtra = countToOpen - usedFromDaily;
      const newOpenedToday = openedToday + usedFromDaily;
      const newExtraAvailable = Math.max(0, effectiveExtraAvailable - usedFromExtra);
      const totalCardsOpenedInBatch = allPacks.reduce((sum, pack) => sum + pack.cards.length, 0);

      transaction.update(profileRef, {
        "booster_stats.last_reset": today,
        "booster_stats.count": newOpenedToday,
        "booster_stats.extra_available": newExtraAvailable,
        "booster_stats.total_opened": FieldValue.increment(countToOpen),
        "booster_stats.total_cards": FieldValue.increment(totalCardsOpenedInBatch),
        updated_at: FieldValue.serverTimestamp(),
      });

      transaction.set(userTeachersRef, userTeachersData);

      for (const queueEntry of queueEntries) {
        const nextRemaining = Math.max(0, toSafeInt(queueEntry.remainingPacks));
        transaction.update(queueEntry.ref, {
          remainingPacks: nextRemaining,
          updatedAt: FieldValue.serverTimestamp(),
          consumedAt: nextRemaining === 0 ? FieldValue.serverTimestamp() : null,
        });
      }

      const logRef = db.collection("logs").doc();
      transaction.set(logRef, {
        user_id: userId,
        action: "OPEN_BOOSTER",
        details: {
          packCount: countToOpen,
          customPacksOpened,
          packs: allPacks.flatMap((pack) => pack.cards.map((card: any) => ({ id: card.id, variant: card.variant, rarity: card.rarity }))),
        },
        timestamp: FieldValue.serverTimestamp(),
      });

      logger.info("Boosters successfully opened", {
        userId,
        packCount: countToOpen,
        customPacksOpened,
      });

      return { packs: allPacks, customPacksOpened };
    });
  } catch (error: any) {
    logger.error("Error in openBooster:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Interner Fehler beim Öffnen des Boosters.");
  }
});
