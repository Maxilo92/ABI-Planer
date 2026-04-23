import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { emptyAllAlbums } from "./actions/emptyAllAlbums";
import { wipeUserCards } from "./actions/wipeUserCards";
import { wipeTeacherDatabase } from "./actions/wipeTeacherDatabase";
import { fixEventCreators } from "./actions/fixEventCreators";
import { applyRarityLimits } from "./rarity";

/**
 * Scheduled function to execute pending danger actions every 15 minutes.
 */
export const executeDangerActions = onSchedule("every 15 minutes", async (event) => {
  console.log("Starting execution of pending danger actions...");
  const now = admin.firestore.Timestamp.now();
  
  const actionsRef = getFirestore("abi-data").collection("delayed_actions");
  const query = actionsRef.where("status", "==", "pending");

  const snapshot = await query.get();
  const eligibleDocs = snapshot.docs.filter((actionDoc) => {
    const executableAt = actionDoc.data().executableAt;
    if (!executableAt || typeof executableAt.toMillis !== "function") return false;
    return executableAt.toMillis() <= now.toMillis();
  });

  if (eligibleDocs.length === 0) {
    console.log("No pending danger actions to execute.");
    return;
  }

  console.log(`Found ${eligibleDocs.length} pending danger actions to execute.`);

  for (const doc of eligibleDocs) {
    const actionData = doc.data();
    const actionId = doc.id;
    const actionType = actionData.actionType;
    const payload = actionData.payload || {};

    console.log(`Executing action ${actionId} of type ${actionType}...`);

    try {
      switch (actionType) {
        case "SYSTEM_TEST_DRY_RUN":
          console.log(`System Test Dry Run (Action ID: ${actionId}) executed successfully. No data changed.`);
          // This will fall through to the success section below
          break;
        case "EMPTY_ALL_ALBUMS":
          await emptyAllAlbums();
          break;
        case "WIPE_TEACHER_DB":
          await wipeTeacherDatabase();
          break;
        case "WIPE_USER_CARDS":
          await wipeUserCards(payload.uid);
          break;
        case "FIX_EVENT_CREATORS":
          await fixEventCreators();
          break;
        // In the future, other actions like RESET_ALL_VOTES can be added here.
        default:
          console.warn(`Unknown action type: ${actionType}. Marking as failed.`);
          await doc.ref.update({
            status: "failed",
            error: `Unknown action type: ${actionType}`,
            completedAt: admin.firestore.Timestamp.now()
          });
          
          await getFirestore("abi-data").collection("danger_logs").add({
            action: "DANGER_ACTION_FAILED",
            user_id: actionData.triggeredBy || "SYSTEM",
            user_name: actionData.triggeredByName || "System/Cron",
            details: {
              actionId,
              actionType,
              error: `Unknown action type: ${actionType}`
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
      }

      // Success
      await doc.ref.update({
        status: "completed",
        completedAt: admin.firestore.Timestamp.now()
      });

      // Log success
      await getFirestore("abi-data").collection("danger_logs").add({
        action: "DANGER_ACTION_EXECUTED",
        user_id: actionData.triggeredBy || "SYSTEM",
        user_name: actionData.triggeredByName || "System/Cron",
        details: {
          actionId,
          actionType,
          description: actionData.description
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Action ${actionId} completed successfully.`);

    } catch (error: any) {
      console.error(`Error executing action ${actionId}:`, error);
      await doc.ref.update({
        status: "failed",
        error: error.message || "Unknown error during execution",
        completedAt: admin.firestore.Timestamp.now()
      });

      // Log failure
      await getFirestore("abi-data").collection("danger_logs").add({
        action: "DANGER_ACTION_FAILED",
        user_id: actionData.triggeredBy || "SYSTEM",
        user_name: actionData.triggeredByName || "System/Cron",
        details: {
          actionId,
          actionType,
          error: error.message || "Unknown error"
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  console.log("Finished execution of pending danger actions.");
});

/**
 * Scheduled function to synchronize teacher rarities every 15 minutes.
 * Performs a "Global Balance Sanity Check" to ensure rarity limits are strictly enforced.
 */
export const syncTeacherRarities = onSchedule("every 15 minutes", async (event) => {
  console.log("Starting Global Balance Sanity Check for teacher rarities...");
  const db = getFirestore("abi-data");

  try {
    // 1. Fetch settings (primary source of truth)
    const settingsSnap = await db.collection("settings").doc("sammelkarten").get();
    if (!settingsSnap.exists) {
      console.log("Sammelkarten settings not found. Skipping balance check.");
      return;
    }

    const settingsData = settingsSnap.data() || {};
    const sets = settingsData.sets || {};
    
    // 2. Apply limits (Default: Iconic: 3, Legendary: 5, Mythic: 15)
    const globalLimits = settingsData.global_limits || {};
    const rarityLimits = { 
      iconic: 3,
      legendary: 5, 
      mythic: 15,
      ...(globalLimits.rarity_limits || {})
    };

    let settingsChanged = false;
    const updatedSets = { ...sets };

    for (const setId of Object.keys(sets)) {
      const set = sets[setId];
      const lootTeachers = set.cards || [];
      const raritiesMap = applyRarityLimits(lootTeachers, rarityLimits);

      const updatedCards = lootTeachers.map((lt: any) => {
        const newRarity = raritiesMap.get(lt.id);
        if (newRarity && lt.rarity !== newRarity) {
          settingsChanged = true;
          console.log(`[Set: ${setId}] Demoting ${lt.name} from ${lt.rarity} to ${newRarity} due to global limits.`);
          return { ...lt, rarity: newRarity };
        }
        return lt;
      });

      if (settingsChanged) {
        updatedSets[setId] = { ...set, cards: updatedCards };
      }
    }

    // Handle legacy loot_teachers if still exists
    if (settingsData.loot_teachers && settingsData.loot_teachers.length > 0) {
      const lootTeachers = settingsData.loot_teachers;
      const raritiesMap = applyRarityLimits(lootTeachers, rarityLimits);
      const updatedLootTeachers = lootTeachers.map((lt: any) => {
        const newRarity = raritiesMap.get(lt.id);
        if (newRarity && lt.rarity !== newRarity) {
          settingsChanged = true;
          return { ...lt, rarity: newRarity };
        }
        return lt;
      });
      if (settingsChanged) {
        settingsData.loot_teachers = updatedLootTeachers;
      }
    }

    if (settingsChanged) {
      await db.collection("settings").doc("sammelkarten").update({
        sets: updatedSets,
        loot_teachers: settingsData.loot_teachers || []
      });
      console.log(`Successfully synchronized global balance. Settings updated.`);
    } else {
      console.log("Global balance is already healthy. No updates needed.");
    }

  } catch (error) {
    console.error("Error during Global Balance Sanity Check:", error);
  }
});

async function collectLandingStats(db: FirebaseFirestore.Firestore) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    profilesSnap,
    dailyActiveSnap,
    newsSnap,
    inventoriesSnap,
    settingsSnap,
    financesSnap,
    todosSnap,
    tasksSnap,
    allProfilesSnap
  ] = await Promise.all([
    db.collection("profiles").count().get(),
    db.collection("profiles").where("last_visited.dashboard", ">=", twentyFourHoursAgo).count().get(),
    db.collection("news").count().get(),
    db.collection("user_teachers").get(),
    db.collection("settings").doc("config").get(),
    db.collection("finances").get(),
    db.collection("todos").where("status", "==", "done").count().get(),
    db.collection("tasks").where("status", "==", "completed").count().get(),
    db.collection("profiles").select("created_at").get(),
  ]);

  let totalCards = 0;
  inventoriesSnap.forEach((doc) => {
    const inventory = doc.data();
    Object.values(inventory).forEach((card: any) => {
      totalCards += Number(card?.count) || 0;
    });
  });


  const finances = financesSnap.docs.map((doc) => doc.data())
  const amounts = finances.map((entry: any) => Number(entry.amount) || 0)
  const incomeTotal = amounts.filter((value) => value > 0).reduce((acc, value) => acc + value, 0)
  const expenseTotal = amounts.filter((value) => value < 0).reduce((acc, value) => acc + Math.abs(value), 0)
  const currentFunding = incomeTotal - expenseTotal
  const fundingGoal = Number(settingsSnap.data()?.funding_goal) || 10000
  const supportGoal = Number(settingsSnap.data()?.support_goal) || 100

  const globalCompletedTasks = (todosSnap.data().count || 0) + (tasksSnap.data().count || 0);

  // User Growth Calculation
  const countsByDate: Record<string, number> = {};
  let validProfileDates = 0;
  allProfilesSnap.forEach(doc => {
    const createdAt = doc.data().created_at;
    if (createdAt) {
      try {
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        if (!isNaN(date.getTime())) {
          const dateStr = date.toISOString().split("T")[0];
          countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
          validProfileDates++;
        }
      } catch (e) {
        console.error(`Error parsing created_at for profile ${doc.id}:`, e);
      }
    }
  });

  console.log(`[collectLandingStats] Processed ${validProfileDates} valid profile dates out of ${allProfilesSnap.size} profiles.`);

  const userGrowth = [];
  const today = new Date();
  let runningCumulative = 120;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const sortedDates = Object.keys(countsByDate).sort();
  for (const dateStr of sortedDates) {
    if (dateStr < thirtyDaysAgoStr) {
      runningCumulative += countsByDate[dateStr];
    }
  }

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    runningCumulative += (countsByDate[dateStr] || 0);
    userGrowth.push({ date: dateStr, count: runningCumulative });
  }

  // Budget Growth Calculation
  const budgetByDate: Record<string, number> = {};
  let validBudgetDates = 0;
  finances.forEach((data: any) => {
    const amount = Number(data.amount) || 0;
    const entryDate = data.entry_date || data.created_at;
    if (amount > 0 && entryDate) {
      try {
        const date = entryDate.toDate ? entryDate.toDate() : new Date(entryDate);
        if (!isNaN(date.getTime())) {
          const dateStr = date.toISOString().split("T")[0];
          budgetByDate[dateStr] = (budgetByDate[dateStr] || 0) + amount;
          validBudgetDates++;
        }
      } catch (e) {
        console.error("Error parsing entry_date for finance entry:", e);
      }
    }
  });

  console.log(`[collectLandingStats] Processed ${validBudgetDates} valid finance dates.`);

  const budgetGrowth = [];
  let runningBudget = 54320;

  const sortedBudgetDates = Object.keys(budgetByDate).sort();
  for (const dateStr of sortedBudgetDates) {
    if (dateStr < thirtyDaysAgoStr) {
      runningBudget += budgetByDate[dateStr];
    }
  }

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    runningBudget += (budgetByDate[dateStr] || 0);
    budgetGrowth.push({ date: dateStr, amount: runningBudget });
  }

  return {
    total_users: profilesSnap.data().count,
    daily_active_users: dailyActiveSnap.data().count,
    total_cards_count: totalCards,
    news_count: newsSnap.data().count,
    current_funding: currentFunding,
    funding_goal: fundingGoal,
    support_goal: supportGoal,
    global_managed_budget: incomeTotal,
    global_completed_tasks: globalCompletedTasks,
    user_growth: userGrowth,
    budget_growth: budgetGrowth,
  };
}

async function writePublicLandingStats(db: FirebaseFirestore.Firestore) {
  const stats = await collectLandingStats(db);

  await db.collection("public").doc("landing_stats").set({
    ...stats,
    last_updated: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return stats;
}

/**
 * Public landing page stats cache for all visitors.
 */
export const syncPublicLandingStats = onSchedule("every 15 minutes", async () => {
  const db = getFirestore("abi-data");

  try {
    await writePublicLandingStats(db);

    console.log("Successfully synchronized public landing stats.");
  } catch (error) {
    console.error("Error syncing public landing stats:", error);
  }
});

/**
 * Manual backfill endpoint for the public landing stats cache.
 */
export const rebuildPublicLandingStats = onRequest({ cors: CALLABLE_CORS_ORIGINS }, async (_request, response) => {
  const db = getFirestore("abi-data");

  try {
    const stats = await writePublicLandingStats(db);
    response.status(200).json({
      ok: true,
      ...stats,
    });
  } catch (error) {
    console.error("Error rebuilding public landing stats:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to rebuild public landing stats.",
    });
  }
});

/**
 * Weekly archive for audit logs (GoBD compliance).
 * Moves logs older than 12 months (365 days) to 'audit_archives' and deletes them from 'logs'.
 * Also cleans up 'danger_logs' older than 30 days.
 */
export const archiveAuditLogs = onSchedule("every sunday 03:00", async (event) => {
  const db = getFirestore("abi-data");
  const now = admin.firestore.Timestamp.now();
  const twelveMonthsAgo = new admin.firestore.Timestamp(now.seconds - (365 * 24 * 60 * 60), 0);
  const thirtyDaysAgo = new admin.firestore.Timestamp(now.seconds - (30 * 24 * 60 * 60), 0);

  console.log(`Starting log archival... (Older than: ${twelveMonthsAgo.toDate().toISOString()})`);

  try {
    // 1. Archive Audit Logs (> 12 months)
    const logsRef = db.collection("logs");
    const oldLogsSnapshot = await logsRef.where("timestamp", "<", twelveMonthsAgo).limit(500).get();

    if (!oldLogsSnapshot.empty) {
      const batch = db.batch();
      const archiveRef = db.collection("audit_archives");

      oldLogsSnapshot.forEach(doc => {
        const data = doc.data();
        const archiveDocRef = archiveRef.doc(doc.id);
        batch.set(archiveDocRef, {
          ...data,
          archived_at: admin.firestore.FieldValue.serverTimestamp()
        });
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Archived ${oldLogsSnapshot.size} audit logs.`);
    } else {
      console.log("No old audit logs to archive.");
    }

    // 2. Cleanup Danger Logs (> 30 days)
    const dangerLogsRef = db.collection("danger_logs");
    const oldDangerLogsSnapshot = await dangerLogsRef.where("timestamp", "<", thirtyDaysAgo).limit(500).get();

    if (!oldDangerLogsSnapshot.empty) {
      const batch = db.batch();
      oldDangerLogsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Deleted ${oldDangerLogsSnapshot.size} old danger logs.`);
    } else {
      console.log("No old danger logs to delete.");
    }

  } catch (error) {
  console.error("Error during log archival/cleanup:", error);
  }
  });

  /**
  * Scheduled function to expire card trades every hour.
  */
  export const expireTrades = onSchedule("every hour", async () => {
  const db = getFirestore("abi-data");
  const now = admin.firestore.Timestamp.now();

  console.log("Checking for expired card trades...");

  try {
  const tradesRef = db.collection("card_trades");
  const expiredQuery = tradesRef
    .where("status", "in", ["pending", "countered"])
    .where("expiresAt", "<=", now)
    .limit(500);

  const snapshot = await expiredQuery.get();

  if (snapshot.empty) {
    console.log("No expired trades found.");
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.update(doc.ref, {
      status: "expired",
      updatedAt: now
    });
  });

  await batch.commit();
  console.log(`Successfully expired ${snapshot.size} trades.`);
  } catch (error) {
  console.error("Error during trade expiration:", error);
  }
});

/**
 * Scheduled function to cleanup rejected tasks that haven't been corrected in 7 days.
 * Resets them to 'open' and removes the current assignment.
 */
export const cleanupRejectedTasks = onSchedule("every day 04:00", async (event) => {
  console.log("Starting cleanup of rejected tasks (7-day timeout)...");
  const db = getFirestore();
  const now = admin.firestore.Timestamp.now();
  const sevenDaysAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);

  try {
    const tasksRef = db.collection("tasks");
    const snapshot = await tasksRef
      .where("status", "==", "rejected")
      .where("rejected_at", "<=", sevenDaysAgo)
      .get();

    if (snapshot.empty) {
      console.log("No rejected tasks to cleanup.");
      return;
    }

    console.log(`Found ${snapshot.docs.length} rejected tasks to reset.`);

    const batch = db.batch();
    const bucket = admin.storage().bucket();

    for (const docSnapshot of snapshot.docs) {
      const taskData = docSnapshot.data();
      
      // 1. Delete proof from storage if it exists
      if (taskData.proof_storage_path) {
        try {
          await bucket.file(taskData.proof_storage_path).delete();
          console.log(`Deleted proof for task ${docSnapshot.id} during reset.`);
        } catch (storageError) {
          console.error(`Failed to delete proof for task ${docSnapshot.id} during reset:`, storageError);
        }
      }

      // 2. Reset task status and assignment
      batch.update(docSnapshot.ref, {
        status: "open",
        assignee_id: null,
        assignee_name: null,
        claimed_at: null,
        proof_media_url: null,
        proof_media_type: null,
        proof_storage_path: null,
        submitted_at: null,
        rejected_reason: null,
        rejected_at: null,
      });
    }

    await batch.commit();
    console.log(`Successfully reset ${snapshot.docs.length} tasks back to the marketplace.`);

  } catch (error) {
    console.error("Error during rejected tasks cleanup:", error);
  }
});
