import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

/**
 * Background analysis for feedback items.
 * Triggered by admin, runs asynchronously.
 */
export const bulkAnalyzeFeedback = onCall({ 
  memory: "256MiB",
  timeoutSeconds: 540, 
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  try {
    logger.info("Bulk analysis function triggered", { count: request.data?.itemIds?.length });

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const db = getFirestore("abi-data");
    const uid = request.auth.uid;
    const userDoc = await db.collection("profiles").doc(uid).get();
    
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User profile not found.");
    }
    
    const profile = userDoc.data();
    if (!profile || !["admin", "admin_main", "admin_co"].includes(profile.role)) {
      throw new HttpsError("permission-denied", "User must be an admin.");
    }

    const { itemIds } = request.data as { itemIds: string[] };
    if (!itemIds || !Array.isArray(itemIds)) {
      throw new HttpsError("invalid-argument", "itemIds must be an array.");
    }

    const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, "");
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "KI-Schnittstelle nicht konfiguriert.");
    }

    // Create a task document to track progress
    const taskRef = db.collection("admin_tasks").doc("feedback_bulk_analyze");
    await taskRef.set({
      type: "feedback_bulk_analyze",
      status: "running",
      total: itemIds.length,
      processed: 0,
      started_at: FieldValue.serverTimestamp(),
      started_by: uid,
      started_by_name: profile.full_name || "Admin"
    });

    // Start background processing
    processFeedbackBatch(itemIds, apiKey, taskRef.id).catch(err => {
      logger.error("Background batch processing failed:", err);
      taskRef.update({ status: "failed", error: String(err) }).catch(() => {});
    });

    return { ok: true, taskId: taskRef.id };
  } catch (error) {
    logger.error("Top-level error in bulkAnalyzeFeedback:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error instanceof Error ? error.message : "Unknown error occurred");
  }
});

async function processFeedbackBatch(itemIds: string[], apiKey: string, taskId: string) {
  const db = getFirestore("abi-data");
  const taskRef = db.collection("admin_tasks").doc(taskId);
  let processed = 0;

  for (const id of itemIds) {
    try {
      const docRef = db.collection("feedback").doc(id);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        processed++;
        await taskRef.update({ processed });
        continue;
      }
      const item = docSnap.data()!;

      const prompt = `
        Analysiere das folgende Feedback für eine Web-App (ABI Planer).
        Deine Aufgabe ist es, das Feedback präzise zu kategorisieren und eine differenzierte Wichtigkeit (Importance) zu vergeben.

        TITEL: ${item.title}
        BESCHREIBUNG: ${item.description}

        ### RICHTLINIEN FÜR DIE WICHTIGKEIT (1-10):
        Verteile die Scores gleichmäßig und sei kritisch. Vermeide es, alles in die Mitte (5-7) zu packen.
        
        - 1-2: Sehr niedrig. Kosmetische Details, winzige UI-Korrekturen, extrem spezifische Nischen-Wünsche.
        - 3-4: Niedrig. Nützliche, aber nicht notwendige Komfort-Features, leichte UX-Reibung.
        - 5-6: Mittel. Wichtige Features für die breite Masse, signifikante UX-Verbesserungen, Fehler die den Workflow stören aber nicht stoppen.
        - 7-8: Hoch. Kritische Features die oft angefragt werden, schwere Bugs (Datenverlust in kleinem Rahmen, Abstürze bestimmter Seiten).
        - 9-10: Kritisch. Systemweite Blocker, Sicherheitslücken, totaler Datenverlust, Ausfall Kern-Funktionen (z.B. Trading, Kasse, Login).

        ### KATEGORIEN:
        Wähle eine passende Kategorie wie: "Bug", "Feature", "Design", "Finanzen", "Sammelkarten", "Sicherheit", "Allgemein".

        Antworte NUR im JSON-Format:
        {
          "category": "Kategorie-Name",
          "importance": 7,
          "ai_reasoning": "Kurze, präzise Begründung warum genau dieser Score (max 15 Wörter)"
        }
      `;

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: DEFAULT_GROQ_MODEL,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Du bist ein hilfreicher Analyse-Assistent." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices[0]?.message?.content;
        if (rawContent) {
          const result = JSON.parse(rawContent);
          await docRef.update({
            category: typeof result.category === "string" ? result.category : "Allgemein",
            importance: typeof result.importance === "number" ? Math.max(1, Math.min(10, result.importance)) : 5,
            ai_reasoning: typeof result.ai_reasoning === "string" ? result.ai_reasoning : "Analysiert via Background-Job",
            is_private: item.is_private ?? false,
            is_anonymous: item.is_anonymous ?? false
          });
        }
      } else if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      processed++;
      await taskRef.update({ processed });
      
      // Delay to be passive
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      logger.error(`Failed to process item ${id}:`, err);
      processed++;
      await taskRef.update({ processed });
    }
  }

  await taskRef.update({ status: "completed", completed_at: FieldValue.serverTimestamp() });
}
