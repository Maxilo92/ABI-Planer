import { NextRequest, NextResponse } from 'next/server'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const MAX_PAYLOAD_CHARS = 18000
const MAX_ACTIONS = 20
const MAX_TOP_ACTIONS = 12
const MAX_SECTION_USAGE = 12
const MAX_TIMELINE_POINTS = 14
const MAX_CARDS_BY_USER = 12

type LocalRouteError = Error & { status?: number }

type SummaryInput = {
  stats?: Record<string, unknown>
  analytics?: Record<string, unknown>
  cardsByUser?: Array<Record<string, unknown>>
}

function toRouteError(message: string, status: number): LocalRouteError {
  const error = new Error(message) as LocalRouteError
  error.status = status
  return error
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

type DbCandidate = {
  label: string
  db: FirebaseFirestore.Firestore
}

function getDatabaseCandidates(app: ReturnType<typeof getAdminApp>): DbCandidate[] {
  const candidates: DbCandidate[] = []

  try {
    candidates.push({ label: 'abi-data', db: getFirestore(app, 'abi-data') })
  } catch {
    // Continue with default DB fallback.
  }

  candidates.push({ label: 'default', db: getFirestore(app) })
  return candidates
}

function isAdminRole(role: unknown) {
  return role === 'admin' || role === 'admin_main' || role === 'admin_co'
}

async function verifyAdminFromHeader(authHeader: string) {
  if (!authHeader.startsWith('Bearer ')) {
    throw toRouteError('Missing bearer token', 401)
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    throw toRouteError('Missing bearer token', 401)
  }

  const app = getAdminApp()
  const auth = getAuth(app)

  let decoded: { uid: string }
  try {
    decoded = await auth.verifyIdToken(idToken)
  } catch {
    throw toRouteError('Invalid authentication token', 401)
  }

  const candidateErrors: string[] = []
  let resolvedRole: string | undefined

  for (const candidate of getDatabaseCandidates(app)) {
    try {
      const profileSnap = await candidate.db.collection('profiles').doc(decoded.uid).get()
      if (!profileSnap.exists) {
        candidateErrors.push(`[${candidate.label}] profile not found`)
        continue
      }

      const profile = profileSnap.data() as { role?: string } | undefined
      if (!isAdminRole(profile?.role)) {
        throw toRouteError('Insufficient permissions', 403)
      }

      resolvedRole = profile?.role
      break
    } catch (error) {
      if ((error as LocalRouteError)?.status === 403) {
        throw error
      }

      const message = error instanceof Error ? error.message : 'Unknown database error'
      candidateErrors.push(`[${candidate.label}] ${message}`)
    }
  }

  if (!resolvedRole) {
    const details = candidateErrors.join(' | ')

    // Local fallback: allow authenticated admin page usage even if Firestore role lookup fails.
    // This prevents local-dev hard failures when named/default Firestore DB resolution is flaky.
    if (process.env.NODE_ENV !== 'production') {
      return {
        uid: decoded.uid,
        role: 'dev_token_only',
      }
    }

    throw toRouteError(`Unable to resolve Firestore database for admin summary: ${details}`, 500)
  }

  return {
    uid: decoded.uid,
    role: resolvedRole || 'admin',
  }
}

function toSafeNumber(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return parsed
}

function toSafeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  return trimmed.slice(0, maxLength)
}

function redactEmails(value: string): string {
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
}

function buildPromptData(input: SummaryInput) {
  const statsRaw = isObject(input.stats) ? input.stats : {}
  const analyticsRaw = isObject(input.analytics) ? input.analytics : {}
  const cardsByUserRaw = Array.isArray(input.cardsByUser) ? input.cardsByUser : []

  const topActionsRaw = Array.isArray(analyticsRaw.top_actions) ? analyticsRaw.top_actions : []
  const sectionUsageRaw = Array.isArray(analyticsRaw.section_usage) ? analyticsRaw.section_usage : []
  const timelineRaw = Array.isArray(analyticsRaw.activity_timeline) ? analyticsRaw.activity_timeline : []
  const recentActionsRaw = Array.isArray(analyticsRaw.recent_actions) ? analyticsRaw.recent_actions : []

  const topActions = topActionsRaw.slice(0, MAX_TOP_ACTIONS).map((entry) => {
    const record = isObject(entry) ? entry : {}
    return {
      action: toSafeText(record.action, 80),
      count: toSafeNumber(record.count),
    }
  })

  const sectionUsage = sectionUsageRaw.slice(0, MAX_SECTION_USAGE).map((entry) => {
    const record = isObject(entry) ? entry : {}
    return {
      section: toSafeText(record.section, 80),
      count: toSafeNumber(record.count),
    }
  })

  const timeline = timelineRaw.slice(0, MAX_TIMELINE_POINTS).map((entry) => {
    const record = isObject(entry) ? entry : {}
    return {
      date: toSafeText(record.date, 20),
      label: toSafeText(record.label, 20),
      actions: toSafeNumber(record.actions),
      active_users: toSafeNumber(record.active_users),
    }
  })

  const recentActions = recentActionsRaw.slice(0, MAX_ACTIONS).map((entry) => {
    const record = isObject(entry) ? entry : {}
    const rawDetails = redactEmails(toSafeText(record.details, 300))
    return {
      timestamp: toSafeText(record.timestamp, 40),
      action: toSafeText(record.action, 120),
      user_id: toSafeText(record.user_id, 120),
      section: toSafeText(record.section, 80),
      details: rawDetails,
    }
  })

  const cardsByUser = cardsByUserRaw.slice(0, MAX_CARDS_BY_USER).map((entry) => {
    const record = isObject(entry) ? entry : {}
    // Label is anonymized in case it contains clear names or emails.
    return {
      label: 'user',
      value: toSafeNumber(record.value),
    }
  })

  return {
    stats: {
      online_users_count: toSafeNumber(statsRaw.online_users_count),
      total_users: toSafeNumber(statsRaw.total_users),
      total_cards_count: toSafeNumber(statsRaw.total_cards_count),
      active_trades_count: toSafeNumber(statsRaw.active_trades_count),
      completed_trades_count: toSafeNumber(statsRaw.completed_trades_count),
    },
    analytics: {
      window_days: Math.max(1, Math.min(30, toSafeNumber(analyticsRaw.window_days) || 7)),
      generated_at: toSafeText(analyticsRaw.generated_at, 40),
      total_log_entries: toSafeNumber(analyticsRaw.total_log_entries),
      current_online_users_count: toSafeNumber(analyticsRaw.current_online_users_count),
      average_session_minutes: toSafeNumber(analyticsRaw.average_session_minutes),
      top_actions: topActions,
      section_usage: sectionUsage,
      activity_timeline: timeline,
      recent_actions: recentActions,
    },
    cards_by_user: cardsByUser,
  }
}

function buildPrompt(promptData: ReturnType<typeof buildPromptData>) {
  const serialized = JSON.stringify(promptData, null, 2)

  return [
    'Du bist ein Analyse-Assistent fuer das Admin System Control Center vom ABI Planer.',
    'Erstelle einen kurzen Lagebericht auf Deutsch basierend ausschliesslich auf den gelieferten Daten.',
    'Ausgabeformat:',
    '1) Kurzfazit (max. 3 Saetze)',
    '2) Auffaelligkeiten (3-5 Stichpunkte)',
    '3) Konkrete Empfehlungen (max. 3 nummerierte Punkte)',
    'Regeln:',
    '- Keine Halluzinationen. Nur aus den Daten ableiten.',
    '- Keine Namen oder E-Mails erfinden oder ausgeben.',
    '- Wenn Daten lueckenhaft sind, benenne die Unsicherheit klar.',
    '',
    'Dashboard-Daten:',
    serialized,
  ].join('\n')
}

function cleanSummary(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/\n{3,}/g, '\n\n').slice(0, 3200)
}

async function requestSummaryFromGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
  if (!apiKey) {
    throw toRouteError('GROQ_API_KEY is not configured on the server', 500)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEFAULT_GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 450,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    const rawPayload = await groqResponse.text()
    if (!groqResponse.ok) {
      throw toRouteError(`Groq request failed (${groqResponse.status})`, 502)
    }

    let parsed: unknown = null
    try {
      parsed = JSON.parse(rawPayload)
    } catch {
      throw toRouteError('Invalid Groq response format', 502)
    }

    const parsedObject = parsed as { choices?: Array<{ message?: { content?: string } }> } | null
    const summary = cleanSummary(parsedObject?.choices?.[0]?.message?.content)
    if (!summary) {
      throw toRouteError('Empty summary returned by Groq', 502)
    }

    return summary
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw toRouteError('Groq request timed out', 504)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function handleAdminSystemAISummary(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Missing authorization header' }, { status: 401 })
    }

    const auth = await verifyAdminFromHeader(authHeader)

    const body = await request.json().catch(() => null)
    if (!isObject(body)) {
      return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
    }

    const promptData = buildPromptData(body as SummaryInput)
    const prompt = buildPrompt(promptData)

    if (prompt.length > MAX_PAYLOAD_CHARS) {
      return NextResponse.json(
        { ok: false, error: `Payload too long. Max ${MAX_PAYLOAD_CHARS} characters.` },
        { status: 400 }
      )
    }

    const summary = await requestSummaryFromGroq(prompt)

    return NextResponse.json(
      {
        ok: true,
        summary,
        meta: {
          model: DEFAULT_GROQ_MODEL,
          generatedAt: new Date().toISOString(),
          requestedBy: auth.uid,
          anonymizationMode: 'partial',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const status = (error as LocalRouteError)?.status || 500
    const message = error instanceof Error ? error.message : 'Failed to generate system summary'
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
