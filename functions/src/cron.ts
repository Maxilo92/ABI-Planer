import { onSchedule } from "firebase-functions/v2/scheduler";
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
 * Ensures global rarity limits (1 Legendary, 3 Mythic) are strictly enforced.
 */
export const syncTeacherRarities = onSchedule("every 15 minutes", async (event) => {
  console.log("Starting synchronization of teacher rarities...");
  const db = getFirestore("abi-data");

  try {
    // 1. Fetch all necessary data
    const [teachersSnap, ratingsSnap, settingsSnap] = await Promise.all([
      db.collection("teachers").get(),
      db.collection("teacher_ratings").get(),
      db.collection("settings").doc("global").get()
    ]);

    // 2. Calculate average ratings from scratch to ensure stability
    const teacherStats = new Map<string, { total: number, count: number }>();
    ratingsSnap.forEach(doc => {
      const data = doc.data();
      const tid = data.teacherId;
      const r = data.rating;
      if (tid && typeof r === "number") {
        const current = teacherStats.get(tid) || { total: 0, count: 0 };
        teacherStats.set(tid, { total: current.total + r, count: current.count + 1 });
      }
    });

    // 3. Prepare teachers list for balancing
    const teachersList = teachersSnap.docs.map(doc => {
      const stats = teacherStats.get(doc.id) || { total: 0, count: 0 };
      return {
        id: doc.id,
        avg_rating: stats.count > 0 ? stats.total / stats.count : 0,
        vote_count: stats.count
      };
    });

    // Sort by rating descending to apply limits correctly
    teachersList.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

    // 4. Apply limits (1 Legendary, 3 Mythic)
    const settingsData = settingsSnap.data() || {};
    const rarityLimits = { 
      ...(settingsData.rarity_limits || {}),
      legendary: 1, 
      mythic: 3 
    };

    const raritiesMap = applyRarityLimits(teachersList, rarityLimits);

    // 5. Update Firestore in batches
    const batch = db.batch();
    let updatedCount = 0;

    for (const teacher of teachersList) {
      const newRarity = raritiesMap.get(teacher.id) || "common";
      const teacherRef = db.collection("teachers").doc(teacher.id);
      
      batch.update(teacherRef, {
        avg_rating: teacher.avg_rating,
        vote_count: teacher.vote_count,
        rarity: newRarity,
        last_sync: admin.firestore.Timestamp.now()
      });
      
      updatedCount++;
    }

    // 6. Update loot_teachers in settings/global
    const lootTeachers = (settingsData.loot_teachers || []) as any[];
    let settingsChanged = false;

    const updatedLootTeachers = lootTeachers.map(lt => {
      const newRarity = raritiesMap.get(lt.id);
      if (newRarity && lt.rarity !== newRarity) {
        settingsChanged = true;
        return { ...lt, rarity: newRarity };
      }
      return lt;
    });

    if (settingsChanged) {
      batch.update(db.collection("settings").doc("global"), {
        loot_teachers: updatedLootTeachers
      });
    }

    if (updatedCount > 0 || settingsChanged) {
      await batch.commit();
      console.log(`Successfully synchronized ${updatedCount} teachers.`);
    } else {
      console.log("No teachers to update.");
    }

  } catch (error) {
    console.error("Error synchronizing teacher rarities:", error);
  }
});
