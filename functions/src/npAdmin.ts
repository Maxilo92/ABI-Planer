import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp, Query } from "firebase-admin/firestore";
import { logNPTransaction, checkFraudPatterns, type NPTransaction } from "./npSecurity";

const db = getFirestore("abi-data");

/**
 * Admin-only function to review suspicious NP transactions
 * and investigate fraud patterns
 */
export const adminReviewNPTransactions = onCall({
  region: "europe-west3",
  cors: true,
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");

  // Verify admin role
  const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
  const callerData = callerSnap.data();
  if (!callerData || !["admin", "admin_main", "admin_co"].includes(callerData.role)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }

  const { userId, transactionType, limit = 50 } = request.data;

  if (!userId) throw new HttpsError("invalid-argument", "userId required");

  let query: Query = db
    .collection("np_transactions")
    .where("user_id", "==", userId)
    .orderBy("created_at", "desc")
    .limit(Math.min(limit, 500));

  // Optional filters
  if (transactionType) {
    query = query.where("type", "==", transactionType);
  }

  const snapshot = await query.get();
  const transactions = snapshot.docs.map((doc) => ({
    ...doc.data() as NPTransaction,
    created_at_formatted: (doc.data().created_at as Timestamp).toDate().toISOString(),
  }));

  // Get fraud analysis for this user
  const fraudAnalysis = await checkFraudPatterns(userId);

  // Calculate stats
  const stats = {
    totalTransactions: transactions.length,
    totalNPEarned: transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    totalNPSpent: Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    currentBalance: transactions.length > 0 ? transactions[0].new_balance : 0,
    flaggedForReview: transactions.filter((t) => t.flagged_for_review).length,
  };

  return {
    success: true,
    userId,
    transactions,
    stats,
    fraudAnalysis,
    timestamp: new Date().toISOString(),
  };
});

/**
 * Admin function to manually adjust NP balance with audit trail
 * Used for corrections, compensation, or fraud reversals
 */
export const adminAdjustNP = onCall({
  region: "europe-west3",
  cors: true,
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");

  // Verify admin role
  const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
  const callerData = callerSnap.data();
  if (!callerData || !["admin", "admin_main"].includes(callerData.role)) {
    throw new HttpsError("permission-denied", "Only Main Admins can adjust NP.");
  }

  const { userId, amount, reason } = request.data;

  if (!userId || typeof amount !== "number" || !reason || reason.trim().length === 0) {
    throw new HttpsError("invalid-argument", "userId, amount, and reason required");
  }

  if (Math.abs(amount) > 100000) {
    throw new HttpsError("invalid-argument", "Adjustment exceeds max limit (100k NP)");
  }

  logger.warn(
    `[ADMIN_NP_ADJUSTMENT] Admin: ${request.auth.uid}, Target User: ${userId}, Amount: ${amount}, Reason: ${reason}`
  );

  // Execute atomic adjustment
  const result = await db.runTransaction(async (transaction) => {
    const profileRef = db.collection("profiles").doc(userId);
    const profileSnap = await transaction.get(profileRef);

    if (!profileSnap.exists) {
      throw new HttpsError("not-found", `Profile ${userId} not found`);
    }

    const currentBalance = profileSnap.data()?.currencies?.notepunkte || 0;
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new HttpsError("failed-precondition", "Adjustment would result in negative balance");
    }

    transaction.update(profileRef, {
      "currencies.notepunkte": newBalance,
      updated_at: new Date(),
    });

    return { currentBalance, newBalance };
  });

  // Log adjustment with full context
  const logRef = db.collection("np_audit_log").doc();
  await logRef.set({
    id: logRef.id,
    admin_id: request.auth.uid,
    admin_email: callerData.email,
    target_user_id: userId,
    adjustment_amount: amount,
    previous_balance: result.currentBalance,
    new_balance: result.newBalance,
    reason,
    timestamp: Timestamp.now(),
    ip_address: request.rawRequest?.ip,
  });

  // Also create a transaction log entry
  try {
    await logNPTransaction(
      userId,
      "admin_adjustment",
      amount,
      result.currentBalance,
      {
        adminNote: `${reason} (by ${callerData.email})`,
      }
    );
  } catch (e) {
    logger.error("Failed to log NP transaction:", e);
  }

  return {
    success: true,
    message: `NP adjustment completed for user ${userId}`,
    previousBalance: result.currentBalance,
    newBalance: result.newBalance,
    amount,
  };
});

/**
 * Admin dashboard: Get system-wide NP metrics and fraud alerts
 */
export const adminGetNPMetrics = onCall({
  region: "europe-west3",
  cors: true,
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");

  const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
  const callerData = callerSnap.data();
  if (!callerData || !["admin", "admin_main", "admin_co"].includes(callerData.role)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }

  const { hours = 24 } = request.data;
  const now = Timestamp.now();
  const windowStart = new Timestamp(now.seconds - hours * 3600, now.nanoseconds);

  // 1. Get flagged transactions
  const flaggedSnapshot = await db
    .collection("np_transactions")
    .where("flagged_for_review", "==", true)
    .where("created_at", ">=", windowStart)
    .limit(100)
    .get();

  const flaggedTransactions = flaggedSnapshot.docs.map(
    (doc) => doc.data() as NPTransaction
  );

  // 2. Get transaction volume metrics
  const allTransactionsSnapshot = await db
    .collection("np_transactions")
    .where("created_at", ">=", windowStart)
    .get();

  const allTransactions = allTransactionsSnapshot.docs.map(
    (doc) => doc.data() as NPTransaction
  );

  const metrics = {
    timeWindowHours: hours,
    totalTransactions: allTransactions.length,
    totalNPGenerated: allTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    totalNPSpent: Math.abs(
      allTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    transactionsByType: {} as Record<string, number>,
    flaggedCount: flaggedTransactions.length,
    topSpenders: {} as Record<string, number>,
    invalidBalances: [] as string[],
  };

  // Aggregate by type
  allTransactions.forEach((tx) => {
    metrics.transactionsByType[tx.type] = (metrics.transactionsByType[tx.type] || 0) + 1;
  });

  // Top spenders
  const spenderMap: Record<string, number> = {};
  allTransactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      spenderMap[t.user_id] = (spenderMap[t.user_id] || 0) + Math.abs(t.amount);
    });

  const topSpenders = Object.entries(spenderMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [uid, total] of topSpenders) {
    metrics.topSpenders[uid] = total;
  }

  // Check for invalid balances (should never happen)
  const invalidTxs = allTransactions.filter((t) => t.new_balance < 0);
  metrics.invalidBalances = invalidTxs.map((t) => `User: ${t.user_id}, TxID: ${t.id}, Balance: ${t.new_balance}`);

  if (metrics.invalidBalances.length > 0) {
    logger.error(`[CRITICAL] Found ${metrics.invalidBalances.length} transactions with negative balances!`);
  }

  return {
    success: true,
    metrics,
    flaggedTransactions: flaggedTransactions.slice(0, 50),
    generatedAt: new Date().toISOString(),
  };
});

/**
 * Admin function: Export NP transaction log for compliance/audit
 */
export const adminExportNPTransactions = onCall({
  region: "europe-west3",
  cors: true,
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");

  const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
  const callerData = callerSnap.data();
  if (!callerData || !["admin", "admin_main"].includes(callerData.role)) {
    throw new HttpsError("permission-denied", "Only Main Admins can export.");
  }

  const { dateFrom, dateTo, transactionType } = request.data;

  let query: Query = db.collection("np_transactions").orderBy("created_at", "desc").limit(10000);

  if (dateFrom) {
    query = query.where("created_at", ">=", Timestamp.fromDate(new Date(dateFrom)));
  }
  if (dateTo) {
    query = query.where("created_at", "<=", Timestamp.fromDate(new Date(dateTo)));
  }
  if (transactionType) {
    query = query.where("type", "==", transactionType);
  }

  const snapshot = await query.get();
  const transactions = snapshot.docs.map((doc) => {
    const data = doc.data() as NPTransaction;
    return {
      ...data,
      created_at: (data.created_at as Timestamp).toDate().toISOString(),
      timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
    };
  });

  logger.info(`[AUDIT_EXPORT] Admin: ${request.auth.uid} exported ${transactions.length} NP transactions`);

  return {
    success: true,
    transactionCount: transactions.length,
    transactions,
    exportedAt: new Date().toISOString(),
  };
});
