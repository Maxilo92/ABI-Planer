import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin-server'
import { Timestamp } from 'firebase-admin/firestore'
import { parseAssistantResponseContent } from '@/lib/assistant-actions'

export const runtime = 'nodejs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const RATE_LIMIT_MAX = 20 // Slightly higher for personal assistant
const RATE_LIMIT_WINDOW_SECONDS = 60

type AuthResult =
  | { ok: true; uid: string; profile: Record<string, unknown> }
  | { ok: false; status: number; error: string; details?: string }

async function verifyApprovedUser(authHeader: string | null): Promise<AuthResult> {
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'

  if (isBypass) {
    return {
      ok: true,
      uid: 'dev-user',
      profile: {
        is_approved: true,
        role: 'admin',
        full_name: 'Dev User',
      },
    }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing bearer token' }
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    return { ok: false, status: 401, error: 'Missing bearer token' }
  }

  try {
    const auth = adminAuth()
    const db = adminDb()

    const decoded = await auth.verifyIdToken(idToken)
    const profileSnap = await db.collection('profiles').doc(decoded.uid).get()

    if (!profileSnap.exists) {
      return { ok: false, status: 404, error: 'Profile not found' }
    }

    const profile = (profileSnap.data() || {}) as Record<string, unknown>
    if (!profile.is_approved) {
      return { ok: false, status: 403, error: 'Profile not approved' }
    }

    return { ok: true, uid: decoded.uid, profile }
  } catch (error: unknown) {
    return { ok: false, status: 401, error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function checkAndIncrementRateLimit(uid: string) {
  const db = adminDb()
  const docRef = db.collection('rate_limits').doc(`${uid}_ai_assistant`)

  return db.runTransaction(async (tx) => {
    const now = Timestamp.now()
    const nowMs = now.toMillis()
    const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000
    const snap = await tx.get(docRef)

    let count = 0
    let windowStart = now

    if (snap.exists) {
      const data = snap.data() as { count?: number; window_start?: Timestamp } | undefined
      const recordedStart = data?.window_start
      const recordedCount = Number(data?.count || 0)

      if (recordedStart && nowMs - recordedStart.toMillis() < windowMs) {
        count = Number.isFinite(recordedCount) ? recordedCount : 0
        windowStart = recordedStart
      }
    }

    const allowed = count < RATE_LIMIT_MAX
    const nextCount = allowed ? count + 1 : count
    const resetAt = new Date(windowStart.toMillis() + windowMs)

    tx.set(
      docRef,
      {
        user_id: uid,
        operation_type: 'ai_assistant',
        count: nextCount,
        window_start: windowStart,
        updated_at: now,
      },
      { merge: true }
    )

    return {
      allowed,
      remaining: Math.max(0, RATE_LIMIT_MAX - nextCount),
      resetAt,
    }
  })
}

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((m): m is { role: string; content: string } => 
      m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant' || m.role === 'system')
    )
    .map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content.trim().slice(0, 4000)
    }))
    .slice(-20) // Keep last 20 messages for context
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const authResult = await verifyApprovedUser(request.headers.get('authorization'))
  
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error, details: authResult.details }, { status: authResult.status })
  }

  const body = await request.json().catch(() => null)
  const messages = sanitizeMessages(body?.messages)

  if (messages.length === 0) {
    return NextResponse.json({ ok: false, error: 'messages array is required and cannot be empty' }, { status: 400 })
  }

  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'
  let rateLimit = { allowed: true, remaining: RATE_LIMIT_MAX, resetAt: new Date(Date.now() + 60000) }
  
  try {
    rateLimit = await checkAndIncrementRateLimit(authResult.uid)
  } catch (rlErr) {
    if (!isBypass) {
      console.error('Rate limit check failed:', rlErr)
      // We continue if it's just a DB error to not block the user, but in prod we might want to be stricter
    }
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Rate limit exceeded. Bitte versuche es in einer Minute erneut.',
        rateLimit: {
          max: RATE_LIMIT_MAX,
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt.toISOString(),
        },
      },
      { status: 429 }
    )
  }

  const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Server configuration error: Missing API Key' }, { status: 500 })
  }

  try {
    const userRole = String(authResult.profile.role || 'viewer')
    const canPersistActions = ['planner', 'admin', 'admin_main', 'admin_co'].includes(userRole)
    const systemPrompt = `Du bist ein hilfreicher, proaktiver persönlicher Assistent für die "ABI Planer" Anwendung.
Deine Aufgabe ist es, Nutzer bei der Organisation ihres Abiballs (Abschlussfeier) und verwandter Veranstaltungen zu unterstützen. Der Planer dient zur Planung von Events, Aufgaben, Tickets und Zeitplänen — nicht zum Lernen oder zur Prüfungsvorbereitung. Antworte auf Deutsch.

Du hast vollen Zugriff auf das interne Support-Wissen und die Projektdokumentation; nutze dieses Wissen, um präzise und kontextbezogene Vorschläge zu machen. Teile keine geheimen Zugangsdaten oder sicherheitskritischen Informationen.

Wenn der Nutzer eindeutig darum bittet, etwas anzulegen, gib genau ein JSON-Objekt zurück mit diesen Feldern:
{
  "answer": "kurze Antwort an den Nutzer",
  "actionMode": "none" | "draft_only" | "confirmable",
  "action": {
    "type": "create_todo" | "create_subtodo" | "create_event",
    "title": "...",
    "description": "optional",
    "assigned_to_user_name": "optional",
    "assigned_to_class": "optional",
    "assigned_to_group": "optional",
    "deadline_date": "YYYY-MM-DD optional",
    "parentId": "optional",
    "parentTitle": "optional",
    "start_date": "ISO optional",
    "end_date": "ISO optional",
    "location": "optional",
    "mentioned_user_names": [],
    "mentioned_roles": [],
    "mentioned_groups": []
  }
}

KLASSIFIKATIONSREGELN:
- Verwende "create_event" nur für klar terminierte, kalendarische Einträge mit festem Datum und/oder Uhrzeit, idealerweise auch mit Ort oder Teilnehmern.
- Verwende "create_todo" für Aufgaben, Vorbereitungen, Erinnerungen, Checklisten oder Planungsarbeit ohne festen Kalendereintrag.
- Verwende "create_subtodo" nur, wenn die Anfrage erkennbar zu einer bereits genannten Hauptaufgabe gehört oder als Unterpunkt formuliert ist.
- Wenn ein Satz sowohl nach Termin als auch nach Aufgabe klingt, entscheide nach dem stärksten Signal: feste Zeit = Termin, offene To-do/Planung = Aufgabe.
- Formulierungen wie "morgen um 10 Uhr", "am 12.05. um 14:30", "Treffen", "Termin", "Meeting" oder "Abgabe" sprechen eher für ein Event.
- Formulierungen wie "vorbereiten", "organisieren", "prüfen", "erledigen", "schreiben", "beschaffen" oder "Liste" sprechen eher für eine Todo.
- Wenn der Nutzer nur Planungsschritte beschreibt, aber keinen konkreten Zeitpunkt nennt, frage lieber nach und lege noch nichts an.
- Wenn du unsicher bist, ob es ein Termin oder eine Aufgabe ist, stelle eine kurze Rückfrage statt zu raten.

WICHTIG: Gib niemals das obige Beispiel-JSON wortwörtlich zurück. Das JSON dient ausschließlich als Schema. Wenn du nicht genügend Informationen für eine Anlage hast oder eine Rückfrage erforderlich ist, antworte stattdessen kurz in natürlicher Sprache, setze "action" auf null und "actionMode" auf "none".

Wenn keine Anlage nötig ist, setze "action" auf null und "actionMode" auf "none".
Wenn Informationen fehlen, frage kurz nach und lasse "action" auf null.
Erfinde keine IDs. Verwende nur sichtbare Namen oder Gruppen aus dem Gespräch.
Der aktuelle Nutzer hat die Rolle: ${userRole}.
Wenn die Rolle keine Schreibrechte hat, sollen Aktionen als Entwurf behandelt werden, nicht als bereits erledigt.`
    const answerGuardrails = `WICHTIG FÜR DAS FELD "answer":
    - Schreibe ausschließlich den sichtbaren Chat-Text für den Nutzer.
    - Wenn Informationen fehlen, antworte mit genau einer kurzen Rückfrage in natürlicher Sprache.
    - Gib niemals JSON, Codefences, Schlüssel wie "answer" oder "action" oder technische Erklärungen im sichtbaren Text aus.
    - Der Nutzer darf nur die Frage oder Antwort sehen, nicht die Struktur.`

    const groqPayload = {
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: answerGuardrails },
        ...messages
      ],
    }

    const upstreamResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groqPayload),
    })

    if (!upstreamResponse.ok) {
      const errorData = await upstreamResponse.json().catch(() => ({}))
      console.error('Groq API error:', upstreamResponse.status, errorData)
      return NextResponse.json(
        {
          ok: false,
          error: 'AI Assistant derzeit nicht erreichbar',
          upstreamStatus: upstreamResponse.status,
        },
        { status: 502 }
      )
    }

    const parsed = await upstreamResponse.json()
    const assistantMessage = parsed?.choices?.[0]?.message

    if (!assistantMessage) {
      throw new Error('Groq returned an empty or invalid response.')
    }

    const rawContent = typeof assistantMessage.content === 'string' ? assistantMessage.content : ''
    const structuredResponse = parseAssistantResponseContent(rawContent)
    const answer = structuredResponse?.answer || rawContent || 'Ich konnte keine Antwort erzeugen.'
    const action = structuredResponse?.action || null
    const actionMode = action ? (canPersistActions ? 'confirmable' : 'draft_only') : 'none'

    return NextResponse.json({
      ok: true,
      answer,
      action,
      actionMode,
      message: {
        ...assistantMessage,
        content: answer,
      },
      rateLimit: {
        max: RATE_LIMIT_MAX,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt.toISOString(),
      },
      meta: {
        model: DEFAULT_GROQ_MODEL,
        generatedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
    })
  } catch (error: unknown) {
    console.error('AI Assistant Error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'AI Assistant konnte nicht antworten.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
