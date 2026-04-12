import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Admin-only function to retroactively fix 'Unbekannt' user names in the 'logs' collection.
 */
export const fixLogNames = onCall({
  region: "europe-west3",
  cors: CALLABLE_CORS_ORIGINS,
  memory: "512MiB",
  timeoutSeconds: 300,
}, async (request) => {
  try {
    // 1. Verify Authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Der Aufruf muss authentifiziert sein.");
    }

    const uid = request.auth.uid;
    const db = getFirestore("abi-data");

    // 2. Verify Role (Admin only)
    const callerSnap = await db.collection("profiles").doc(uid).get();
    const callerData = callerSnap.data();

    if (!callerData || !["admin", "admin_main", "admin_co"].includes(callerData.role)) {
      throw new HttpsError("permission-denied", "Nur Administratoren dürfen diese Aktion ausführen.");
    }

    console.log(`[Admin] fixLogNames gestartet von Nutzer: ${uid}`);

    const logsRef = db.collection("logs");
    const profilesRef = db.collection("profiles");
    
    // 3. Fetch all logs that need fixing
    const snapshot = await logsRef.get();
    if (snapshot.empty) {
      return { success: true, fixedCount: 0 };
    }

    // 4. Identify logs to fix and collect unique user IDs
    const logsToFix: { id: string, userId: string }[] = [];
    const uniqueUserIds = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.user_name;
      const userId = data.user_id;

      if (userId && (!name || name === "Unbekannt" || name === "Unknown")) {
        logsToFix.push({ id: doc.id, userId });
        uniqueUserIds.add(userId);
      }
    });

    if (logsToFix.length === 0) {
      return { success: true, fixedCount: 0 };
    }

    console.log(`[Admin] Gefunden: ${logsToFix.length} Logs zum Fixen, ${uniqueUserIds.size} betroffene Profile.`);

    // 5. Fetch all required profiles in batches (max 30 IDs per 'in' query)
    const profileMap: Record<string, string> = {};
    const userIdArray = Array.from(uniqueUserIds);
    const batchSize = 30;

    for (let i = 0; i < userIdArray.length; i += batchSize) {
      const chunk = userIdArray.slice(i, i + batchSize);
      const profilesSnap = await profilesRef.where(admin.firestore.FieldPath.documentId(), "in", chunk).get();
      
      profilesSnap.forEach(pDoc => {
        const pData = pDoc.data();
        profileMap[pDoc.id] = pData.full_name || pData.email || "Unbekannt";
      });
    }

    // 6. Apply fixes in batches
    const writeBatchSize = 400;
    let currentBatch = db.batch();
    let currentBatchOpCount = 0;
    let fixedCount = 0;

    for (const item of logsToFix) {
      const resolvedName = profileMap[item.userId];
      
      if (resolvedName && resolvedName !== "Unbekannt") {
        currentBatch.update(logsRef.doc(item.id), { user_name: resolvedName });
        currentBatchOpCount++;
        fixedCount++;

        if (currentBatchOpCount >= writeBatchSize) {
          await currentBatch.commit();
          currentBatch = db.batch();
          currentBatchOpCount = 0;
          console.log(`[Admin] Batch von ${writeBatchSize} Logs committed.`);
        }
      }
    }

    if (currentBatchOpCount > 0) {
      await currentBatch.commit();
    }

    console.log(`[Admin] fixLogNames erfolgreich abgeschlossen. ${fixedCount} Einträge aktualisiert.`);
    return { success: true, fixedCount };

  } catch (error: any) {
    console.error(`[Admin] Fehler in fixLogNames:`, error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError("internal", error.message || "Ein interner Serverfehler ist aufgetreten.");
  }
});
