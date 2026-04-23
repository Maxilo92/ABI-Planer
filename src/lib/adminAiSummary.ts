import { NextRequest, NextResponse } from 'next/server'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'

const MAX_PAYLOAD_CHARS = 24000
const MAX_ACTIONS = 40
const MAX_TOP_ACTIONS = 15
const MAX_SECTION_USAGE = 15
const MAX_TIMELINE_POINTS = 20
const MAX_CARDS_BY_USER = 15

type LocalRouteError = Error & { status?: number }

type SummaryInput = {
  stats?: Record<string, unknown>
  analytics?: Record<string, unknown>
  cardsByUser?: Array<Record<string, unknown>>
  registration_timeline?: Array<Record<string, unknown>>
  mode?: 'briefing' | 'full'
  forceRefresh?: boolean
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
  if (getApps().length > 0) return getApps()[0]
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  }
  return initializeApp({ credential: applicationDefault(), projectId })
}

type DbCandidate = { label: string; db: FirebaseFirestore.Firestore }

function getDatabaseCandidates(app: ReturnType<typeof getAdminApp>): DbCandidate[] {
  const candidates: DbCandidate[] = []
  try { candidates.push({ label: 'abi-data', db: getFirestore(app, 'abi-data') }) } catch {}
  candidates.push({ label: 'default', db: getFirestore(app) })
  return candidates
}

function isAdminRole(role: unknown) {
  return role === 'admin' || role === 'admin_main' || role === 'admin_co'
}

async function verifyAdminFromHeader(authHeader: string) {
  if (!authHeader.startsWith('Bearer ')) throw toRouteError('Missing bearer token', 401)
  const idToken = authHeader.slice(7).trim()
  if (!idToken) throw toRouteError('Missing bearer token', 401)
  const app = getAdminApp()
  const auth = getAuth(app)
  let decoded: { uid: string }
  try { decoded = await auth.verifyIdToken(idToken) } catch { throw toRouteError('Invalid authentication token', 401) }

  const candidateErrors: string[] = []
  let resolvedRole: string | undefined
  let resolvedDb: FirebaseFirestore.Firestore | undefined

  for (const candidate of getDatabaseCandidates(app)) {
    try {
      const profileSnap = await candidate.db.collection('profiles').doc(decoded.uid).get()
      if (!profileSnap.exists) { candidateErrors.push(`[${candidate.label}] profile not found`); continue }
      const profile = profileSnap.data() as { role?: string } | undefined
      if (!isAdminRole(profile?.role)) throw toRouteError('Insufficient permissions', 403)
      resolvedRole = profile?.role
      resolvedDb = candidate.db
      break
    } catch (error) {
      if ((error as LocalRouteError)?.status === 403) throw error
      candidateErrors.push(`[${candidate.label}] ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (!resolvedRole || !resolvedDb) {
    if (process.env.NODE_ENV !== 'production') return { uid: decoded.uid, role: 'dev_token_only', db: getFirestore(app, 'abi-data') }
    throw toRouteError(`Database resolution failed: ${candidateErrors.join(' | ')}`, 500)
  }
  return { uid: decoded.uid, role: resolvedRole, db: resolvedDb }
}

function toSafeNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toSafeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed.slice(0, maxLength)
}

function redactEmails(value: string): string {
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
}

function buildPromptData(input: SummaryInput) {
  const statsRaw = isObject(input.stats) ? input.stats : {}
  const analyticsRaw = isObject(input.analytics) ? input.analytics : {}
  const cardsByUserRaw = Array.isArray(input.cardsByUser) ? input.cardsByUser : []
  const registrationTimelineRaw = Array.isArray(input.registration_timeline) ? input.registration_timeline : []

  const recentActions = (Array.isArray(analyticsRaw.recent_actions) ? analyticsRaw.recent_actions : [])
    .slice(0, MAX_ACTIONS)
    .map((entry) => ({
      timestamp: toSafeText(entry.timestamp, 40),
      action: toSafeText(entry.action, 120),
      user_id: toSafeText(entry.user_id, 120),
      user_name: toSafeText(entry.user_name, 80),
      user_role: toSafeText(entry.user_role, 20),
      section: toSafeText(entry.section, 80),
      details: redactEmails(toSafeText(entry.details, 300)),
    }))

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
      average_session_minutes: toSafeNumber(analyticsRaw.average_session_minutes),
      top_actions: (Array.isArray(analyticsRaw.top_actions) ? analyticsRaw.top_actions : []).slice(0, MAX_TOP_ACTIONS).map(e => ({ action: toSafeText(e.action, 80), count: toSafeNumber(e.count) })),
      section_usage: (Array.isArray(analyticsRaw.section_usage) ? analyticsRaw.section_usage : []).slice(0, MAX_SECTION_USAGE).map(e => ({ section: toSafeText(e.section, 80), count: toSafeNumber(e.count) })),
      activity_timeline: (Array.isArray(analyticsRaw.activity_timeline) ? analyticsRaw.activity_timeline : []).slice(0, MAX_TIMELINE_POINTS).map(e => ({ date: toSafeText(e.date, 20), actions: toSafeNumber(e.actions), active_users: toSafeNumber(e.active_users) })),
      registration_timeline: registrationTimelineRaw.slice(0, MAX_TIMELINE_POINTS).map(e => ({ date: toSafeText(e.date, 20), count: toSafeNumber(e.count), cumulative: toSafeNumber(e.cumulative) })),
      recent_actions: recentActions,
    },
    cards_by_user: cardsByUserRaw.slice(0, MAX_CARDS_BY_USER).map(e => ({ label: toSafeText(e.label, 80), value: toSafeNumber(e.value) })),
  }
}

function buildPrompt(promptData: ReturnType<typeof buildPromptData>, mode: 'briefing' | 'full' = 'full') {
  const serialized = JSON.stringify(promptData, null, 2)

  if (mode === 'briefing') {
    return [
      'Du bist ein hochintelligenter System-Analyst fuer das ABI Planer Netzwerk.',
      'Analysiere die Daten auf Anomalien und strategische Highlights.',
      'STRIKTES VERBOT: Lies niemals Statistiken vor, die man direkt im Dashboard sieht.',
      '',
      'DEINE AUFGABE:',
      '- Fokus auf reguläre Nutzer: Suche nach echten Anomalien bei normalen Usern (Spam, Exploits, plötzliches Wachstum).',
      '- ADMIN-FILTER (WICHTIG): Nutzer mit der Rolle "admin", "admin_main" oder "admin_co" (z.B. Maximilian Priesnitz) sind ENTWICKLER. Ignoriere deren Aktivitäts-Volumen komplett. Erwähne Admins NUR, wenn sie technische Fehler (500er, Crashes) auslösen, niemals wegen "hoher Aktivität".',
      '- Interpretiere die Lage: Wie ist die Gesamtzustand? Gibt es Trends (z.B. "Umfragen werden heute extrem gut angenommen")?',
      '- Sei extrem prägnant: Maximal 2-3 flüssige Sätze.',
      '',
      'STIL:',
      '- Direkt, professionell, keine Emojis.',
      '- Nutze Fettschrift für kritische Erkenntnisse.',
      '',
      'DATENBASIS:',
      serialized,
    ].join('\n')
  }

  return [
    'Du bist ein hochintelligenter System-Analyst fuer das Admin-Dashboard vom ABI Planer.',
    'Erstelle einen tiefgreifenden strategischen Lagebericht auf Deutsch.',
    '',
    'ANALYSE-LOGIK:',
    '1. WACHSTUM: Analysiere Zuwachsraten aus registration_timeline. Bewerte den Trend.',
    '2. ANOMALIEN-CHECK: Scanne die recent_actions nach Mustern (Spam, Fehler, Missbrauch).',
    '3. ENGAGEMENT: Setze Aktionen ins Verhältnis zur Nutzerzahl.',
    '',
    'STRUKTUR:',
    '# Strategisches Lagebild',
    '## Wachstum & Akquisition',
    '## Engagement & Anomalien',
    '## Modul-Performance',
    '## Strategische Handlungsempfehlungen',
    '',
    'WICHTIGE REGELN:',
    '- KEINE Emojis.',
    '- Nutze **Fettschrift** für Kennzahlen.',
    '- Interpretiere die Daten, anstatt sie nur aufzulisten.',
    '',
    'DATENBASIS:',
    serialized,
  ].join('\n')
}

function cleanSummary(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/\n{3,}/g, '\n\n').slice(0, 5000)
}

async function requestSummaryFromGroq(prompt: string, model: string = DEFAULT_GROQ_MODEL) {
  const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
  if (!apiKey) throw toRouteError('GROQ_API_KEY not configured on server.', 500)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      console.error('[Groq Error]', response.status, err)
      throw toRouteError(`Groq API error (${response.status})`, 502)
    }
    const payload = await response.json()
    return cleanSummary(payload?.choices?.[0]?.message?.content)
  } catch (e) {
    if (e instanceof Error && (e as any).status) throw e
    console.error('[Groq Fetch Error]', e)
    throw toRouteError('Failed to reach Groq API', 504)
  }
}

async function requestSummaryFromAnthropic(prompt: string) {
  const apiKey = (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY)?.trim().replace(/^['\"]|['\"]$/g, '')
  if (!apiKey) throw new Error('CLAUDE_API_KEY_MISSING')

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_CLAUDE_MODEL,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      console.error('[Anthropic Error]', response.status, err)
      throw new Error(`ANTHROPIC_ERROR_${response.status}`)
    }
    const payload = await response.json()
    return cleanSummary(payload?.content?.[0]?.text)
  } catch (e) {
    console.error('[Anthropic Fetch Error]', e)
    throw e
  }
}

async function requestSummaryFromGroqFull(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
  if (!apiKey) throw toRouteError('GROQ_API_KEY not configured', 500)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[Groq Fallback Error]', response.status, err)
      throw toRouteError('Groq Fallback failed', 502)
    }
    const payload = await response.json()
    return cleanSummary(payload?.choices?.[0]?.message?.content)
  } catch (e) {
    if (e instanceof Error && (e as any).status) throw e
    console.error('[Groq Fallback Fetch Error]', e)
    throw toRouteError('Failed to reach Groq API for fallback', 504)
  }
}

export async function handleAdminSystemAISummary(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ ok: false, error: 'Missing auth' }, { status: 401 })
    const auth = await verifyAdminFromHeader(authHeader)
    
    const body = await request.json().catch(() => null)
    if (!isObject(body)) return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })

    const mode = (body.mode === 'briefing' ? 'briefing' : 'full') as 'briefing' | 'full'
    const forceRefresh = Boolean(body.forceRefresh)

    if (mode === 'briefing' && !forceRefresh) {
      const today = new Date().toISOString().slice(0, 10)
      const cacheRef = auth.db.collection('admin_cache').doc('daily_briefing')
      try {
        const cacheSnap = await cacheRef.get()
        if (cacheSnap.exists) {
          const cacheData = cacheSnap.data()
          if (cacheData?.date === today && cacheData?.summary) {
            return NextResponse.json({
              ok: true,
              summary: cacheData.summary,
              meta: {
                model: cacheData.model || 'cached',
                generatedAt: cacheData.generatedAt || new Date().toISOString(),
                mode: 'briefing',
                isCached: true
              }
            }, { status: 200 })
          }
        }
      } catch (cacheErr) {
        console.warn('[AI Summary] Cache read failed, proceeding with generation', cacheErr)
      }
    }

    const promptData = buildPromptData(body as SummaryInput)
    const prompt = buildPrompt(promptData, mode)

    let summary: string
    let model: string

    if (mode === 'briefing') {
      summary = await requestSummaryFromGroq(prompt)
      model = DEFAULT_GROQ_MODEL
      
      try {
        const today = new Date().toISOString().slice(0, 10)
        await auth.db.collection('admin_cache').doc('daily_briefing').set({
          summary,
          model,
          date: today,
          generatedAt: new Date().toISOString()
        })
      } catch (cacheWriteErr) {
        console.warn('[AI Summary] Cache write failed', cacheWriteErr)
      }
    } else {
      try {
        summary = await requestSummaryFromAnthropic(prompt)
        model = DEFAULT_CLAUDE_MODEL
      } catch (e) {
        console.warn('[AI Summary] Claude failed, falling back to Groq 70B', e)
        summary = await requestSummaryFromGroqFull(prompt)
        model = 'llama-3.3-70b-versatile (Fallback)'
      }
    }

    return NextResponse.json({
      ok: true,
      summary,
      meta: {
        model,
        generatedAt: new Date().toISOString(),
        requestedBy: auth.uid,
        mode
      }
    }, { status: 200 })
  } catch (error) {
    console.error('[AI Summary Global Error]', error)
    const status = (error as LocalRouteError)?.status || 500
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
