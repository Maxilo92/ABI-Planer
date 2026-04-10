import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

const db = getFirestore("abi-data");
const MAX_NP_PER_TRANSACTION = 100000; // Prevent absurd single transactions
const MAX_NP_PER_DAY = 50000; // Max NP earned/spent per day per user
const MAX_TRANSACTIONS_PER_HOUR = 50; // Prevent rapid fire abuse
const FRAUD_CHECK_WINDOW_HOURS = 24;

export type NPTransactionType = 
  | "purchase_stripe" 
  | "refund_stripe" 
  | "event_reward" 
  | "referral_bonus"
  | "battlepass_purchase" 
  | "battlepass_refund"
  | "admin_adjustment" 
  | "subscription_monthly_stipend"
  | "cosmetic_purchase"
  | "chargeback_reversal";

export interface NPTransaction {
  id: string;
  user_id: string;
  type: NPTransactionType;
  amount: number; // Signed: positive = gain, negative = loss
  prev_balance: number;
  new_balance: number;
  timestamp: Timestamp;
  source_doc_id?: string; // Reference to source (Stripe session, event, etc.)
  stripe_payment_intent?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Timestamp;
  verified: boolean; // Has webhook signature been verified?
  admin_note?: string; // For manual adjustments
  flagged_for_review?: boolean;
  review_reason?: string;
}

/**
 * Core NP Transaction Logging with comprehensive audit trail
 * This is the SOURCE OF TRUTH for all NP movements
 */
export async function logNPTransaction(
  userId: string,
  type: NPTransactionType,
  amount: number,
  currentBalance: number,
  options?: {
    sourceDocId?: string;
    stripePaymentIntent?: string;
    ipAddress?: string;
    userAgent?: string;
    adminNote?: string;
    flagForReview?: boolean;
    reviewReason?: string;
  }
): Promise<string> {
  const newBalance = currentBalance + amount;

  // Security checks
  if (Math.abs(amount) > MAX_NP_PER_TRANSACTION) {
    throw new HttpsError(
      "invalid-argument",
      `NP transaction exceeds max single transaction limit (${MAX_NP_PER_TRANSACTION}). Amount: ${amount}`
    );
  }

  if (newBalance < 0) {
    throw new HttpsError(
      "failed-precondition",
      `Transaction would result in negative balance. Current: ${currentBalance}, Change: ${amount}, Result: ${newBalance}`
    );
  }

  if (newBalance > 10000000) { // 10M NP limit per account (prevent exploits)
    throw new HttpsError(
      "failed-precondition",
      `Balance would exceed account limit (10M NP). Current: ${newBalance}`
    );
  }

  const transactionRef = db
    .collection("np_transactions")
    .doc();

  const transaction: NPTransaction = {
    id: transactionRef.id,
    user_id: userId,
    type,
    amount,
    prev_balance: currentBalance,
    new_balance: newBalance,
    timestamp: Timestamp.now(),
    source_doc_id: options?.sourceDocId,
    stripe_payment_intent: options?.stripePaymentIntent,
    ip_address: options?.ipAddress,
    user_agent: options?.userAgent,
    created_at: Timestamp.now(),
    verified: true, // Assume verified if we got through middleware
    admin_note: options?.adminNote,
    flagged_for_review: options?.flagForReview || false,
    review_reason: options?.reviewReason,
  };

  await transactionRef.set(transaction);

  logger.info(`[NP_TRANSACTION] User: ${userId}, Type: ${type}, Amount: ${amount}, New Balance: ${newBalance}`);

  return transactionRef.id;
}

/**
 * Check for fraud patterns in user's recent activity
 * Returns fraud score (0-100) and flags
 */
export async function checkFraudPatterns(
  userId: string
): Promise<{
  fraudScore: number;
  flags: string[];
  shouldBlock: boolean;
}> {
  const now = Timestamp.now();
  const windowStart = new Timestamp(now.seconds - FRAUD_CHECK_WINDOW_HOURS * 3600, now.nanoseconds);

  const transactions = await db
    .collection("np_transactions")
    .where("user_id", "==", userId)
    .where("created_at", ">=", windowStart)
    .orderBy("created_at", "desc")
    .limit(100)
    .get();

  const flags: string[] = [];
  let fraudScore = 0;

  // 1. Check daily spending limit
  const totalAdjustment24h = transactions.docs.reduce((sum, doc) => {
    return sum + Math.abs((doc.data() as NPTransaction).amount);
  }, 0);

  if (totalAdjustment24h > MAX_NP_PER_DAY) {
    flags.push(`Exceeded daily NP movement limit (${totalAdjustment24h} > ${MAX_NP_PER_DAY})`);
    fraudScore += 30;
  }

  // 2. Check transaction frequency
  const lastHourTxs = transactions.docs.filter((doc) => {
    const tx = doc.data() as NPTransaction;
    return tx.created_at.seconds > now.seconds - 3600;
  }).length;

  if (lastHourTxs > MAX_TRANSACTIONS_PER_HOUR) {
    flags.push(`Excessive transaction frequency in last hour (${lastHourTxs} > ${MAX_TRANSACTIONS_PER_HOUR})`);
    fraudScore += 25;
  }

  // 3. Check for pattern: purchase then immediate refund
  const recentChargebacks = transactions.docs.filter((doc) => {
    const tx = doc.data() as NPTransaction;
    return tx.type === "refund_stripe" && tx.created_at.seconds > now.seconds - 300; // Last 5 min
  }).length;

  if (recentChargebacks > 2) {
    flags.push(`Multiple chargebacks detected in last 5 minutes (${recentChargebacks})`);
    fraudScore += 40;
  }

  // 4. Check for suspiciously large single transactions
  const largeTransactions = transactions.docs.filter((doc) => {
    const tx = doc.data() as NPTransaction;
    return Math.abs(tx.amount) > 10000; // 10k+ NP
  }).length;

  if (largeTransactions > 5) {
    flags.push(`Multiple large transactions detected (>${10000} NP)`);
    fraudScore += 20;
  }

  // 5. Check for negative balance attempts (should never happen, but log if it does)
  const negativeBalances = transactions.docs.filter((doc) => {
    const tx = doc.data() as NPTransaction;
    return tx.new_balance < 0;
  }).length;

  if (negativeBalances > 0) {
    flags.push(`Critical: Negative balance detected! Count: ${negativeBalances}`);
    fraudScore += 50;
  }

  const shouldBlock = fraudScore >= 70;

  return { fraudScore, flags, shouldBlock };
}

/**
 * Validate webhook authenticity and check for replay attacks
 */
export async function validateWebhookIdempotency(
  stripePaymentIntentId: string,
  eventId: string
): Promise<{ isNew: boolean; isDuplicate: boolean }> {
  const webhookRef = db.collection("stripe_webhook_log").doc(eventId);
  const existingRecord = await webhookRef.get();

  if (existingRecord.exists) {
    const data = existingRecord.data();
    const isProcessed = data?.status === "processed";
    return { isNew: false, isDuplicate: isProcessed };
  }

  // Record incoming webhook to prevent duplicate processing
  await webhookRef.set({
    event_id: eventId,
    payment_intent: stripePaymentIntentId,
    received_at: Timestamp.now(),
    status: "pending",
  });

  return { isNew: true, isDuplicate: false };
}

/**
 * Mark webhook as successfully processed
 */
export async function markWebhookProcessed(eventId: string, txId?: string) {
  await db.collection("stripe_webhook_log").doc(eventId).update({
    status: "processed",
    processed_at: Timestamp.now(),
    transaction_id: txId || null,
  });
}

/**
 * Atomic NP Update with comprehensive validation and logging
 * This MUST be used for all NP balance changes
 */
export async function atomicNPUpdate(
  userId: string,
  amount: number,
  type: NPTransactionType,
  options?: {
    sourceDocId?: string;
    stripePaymentIntent?: string;
    ipAddress?: string;
    userAgent?: string;
    adminNote?: string;
  }
): Promise<{ success: boolean; newBalance: number; transactionId: string; fraudAlert?: string }> {
  // 1. Pre-check fraud patterns
  const fraudCheck = await checkFraudPatterns(userId);
  if (fraudCheck.shouldBlock) {
    const flagReason = fraudCheck.flags.join(" | ");
    logger.warn(`[NP_FRAUD_BLOCK] User: ${userId}, Fraud Score: ${fraudCheck.fraudScore}, Flags: ${flagReason}`);
    throw new HttpsError(
      "permission-denied",
      "Transaction blocked due to fraud detection. Please contact support."
    );
  }

  // 2. Execute transaction with atomic operations
  const result = await db.runTransaction(async (transaction) => {
    const profileRef = db.collection("profiles").doc(userId);
    const profileSnap = await transaction.get(profileRef);

    if (!profileSnap.exists) {
      throw new HttpsError("not-found", `Profile ${userId} not found`);
    }

    const currentBalance = profileSnap.data()?.currencies?.notepunkte || 0;
    const newBalance = currentBalance + amount;

    // Validate new balance
    if (newBalance < 0) {
      throw new HttpsError(
        "failed-precondition",
        `Insufficient NP balance. Current: ${currentBalance}, Required: ${Math.abs(amount)}`
      );
    }

    if (newBalance > 10000000) {
      throw new HttpsError(
        "failed-precondition",
        `Balance would exceed max limit (10M NP). Result would be: ${newBalance}`
      );
    }

    // 3. Update profile with new balance
    transaction.update(profileRef, {
      "currencies.notepunkte": newBalance,
      updated_at: FieldValue.serverTimestamp(),
    });

    return { currentBalance, newBalance };
  });

  // 4. Log transaction (outside transaction to avoid extra contention)
  const txId = await logNPTransaction(userId, type, amount, result.currentBalance, {
    ...options,
    flagForReview: fraudCheck.fraudScore > 40 ? true : false,
    reviewReason: fraudCheck.flags.length > 0 ? fraudCheck.flags.join("; ") : undefined,
  });

  // 5. Warn if fraud score is elevated but not blocking
  let fraudAlert = undefined;
  if (fraudCheck.fraudScore > 40) {
    fraudAlert = `⚠️ Fraud warning: Score ${fraudCheck.fraudScore}/100. Flags: ${fraudCheck.flags.join(", ")}`;
    logger.warn(`[NP_FRAUD_ALERT] User: ${userId}, Score: ${fraudCheck.fraudScore}, Flags: ${fraudCheck.flags.join("; ")}`);
  }

  return {
    success: true,
    newBalance: result.newBalance,
    transactionId: txId,
    fraudAlert,
  };
}

/**
 * Rate limiting check per user per time window
 */
export async function checkRateLimit(
  userId: string,
  operationType: "purchase" | "refund" | "admin_action",
  timeWindowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limitCounts: Record<string, number> = {
    purchase: 20, // Max 20 purchases per hour
    refund: 5, // Max 5 refunds per hour
    admin_action: 100, // Max 100 admin actions per hour
  };

  const limit = limitCounts[operationType] || 10;
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindowSeconds * 1000);

  const rateLimitDoc = db.collection("rate_limits").doc(`${userId}_${operationType}`);
  const rateLimitSnap = await rateLimitDoc.get();

  let count = 0;
  let windowStartTime = now;

  if (rateLimitSnap.exists) {
    const data = rateLimitSnap.data();
    if (data) {
      const recordedWindowStart = (data.window_start as Timestamp).toDate();

      if (recordedWindowStart > windowStart) {
        // Still in same window
        count = data.count || 0;
        windowStartTime = recordedWindowStart;
      } else {
        // Window expired, reset
        count = 0;
        windowStartTime = now;
      }
    }
  }

  const allowed = count < limit;
  const newCount = allowed ? count + 1 : count;

  // Update rate limit counter
  await rateLimitDoc.set({
    user_id: userId,
    operation_type: operationType,
    count: newCount,
    window_start: Timestamp.fromDate(windowStartTime),
    updated_at: Timestamp.now(),
  });

  const resetAt = new Date(windowStartTime.getTime() + timeWindowSeconds * 1000);

  return {
    allowed,
    remaining: Math.max(0, limit - newCount),
    resetAt,
  };
}
