import { NextRequest, NextResponse } from 'next/server'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { formatHelpFaqContext, getHelpFaqItems, searchFaqItems, type HelpFaqItem } from '@/lib/helpFaqs'

export const runtime = 'nodejs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const RATE_LIMIT_MAX = 5 // Lower for guests
const RATE_LIMIT_WINDOW_SECONDS = 60
const MAX_PROMPT_CHARS = 2000

function getFallbackAnswer(locale: 'de' | 'en' | 'es') {
  if (locale === 'en') {
    return 'I could not find a safe answer for this right now. Please use the contact form or the complaints page.'
  }

  if (locale === 'es') {
    return 'No he encontrado una respuesta segura para esto por ahora. Usa el formulario de contacto o la página de reclamaciones.'
  }

  return 'Ich habe dazu gerade keine sichere Antwort gefunden. Bitte nutze das Kontaktformular oder die Beschwerdeseite.'
}

function getAdminApp() {
  const apps = getApps()
  if (apps.length > 0) return apps[0]

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      })
    } catch (error) {
      console.error('Failed to initialize admin app with cert:', error)
    }
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    })
  } catch (error: any) {
    return initializeApp({ projectId: projectId || 'dev-project' })
  }
}

function getDb() {
  const app = getAdminApp()
  try {
    return getFirestore(app, 'abi-data')
  } catch {
    return getFirestore(app)
  }
}

async function checkAndIncrementRateLimit(identifier: string) {
  const db = getDb()
  const docRef = db.collection('rate_limits').doc(`${identifier}_support_bot_message`)

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
        identifier,
        operation_type: 'support_bot_message',
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

function sanitizePrompt(rawPrompt: unknown): string {
  if (typeof rawPrompt !== 'string') return ''
  return rawPrompt.trim().slice(0, MAX_PROMPT_CHARS)
}

function sanitizeHistory(rawHistory: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(rawHistory)) return []

  return rawHistory
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map((item) => ({
      role: item.role as 'user' | 'assistant',
      content: (item.content as string).trim().slice(0, MAX_PROMPT_CHARS),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-8)
}

async function buildFaqContext(prompt: string, locale: 'de' | 'en' | 'es') {
  const combinedFaqItems = getHelpFaqItems(locale)
  const matches = searchFaqItems(prompt, combinedFaqItems, 3)
  return {
    matches,
    context: formatHelpFaqContext(matches),
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const body = await request.json().catch(() => null)
  const prompt = sanitizePrompt(body?.prompt)
  const history = sanitizeHistory(body?.history)
  const locale = (body?.locale || 'de') as 'de' | 'en' | 'es'

  if (!prompt) {
    return NextResponse.json({ ok: false, error: 'prompt is required' }, { status: 400 })
  }

  // Identify user by Bearer token OR IP
  let identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const authHeader = request.headers.get('authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const idToken = authHeader.slice(7).trim()
      const app = getAdminApp()
      const auth = getAuth(app)
      const decoded = await auth.verifyIdToken(idToken)
      identifier = decoded.uid
    } catch {
      // Fallback to IP if token is invalid
    }
  }

  const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const faqMatchResult = await buildFaqContext(prompt, locale)

  const rateLimit = await checkAndIncrementRateLimit(identifier)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: locale === 'en' ? 'Rate limit exceeded.' : locale === 'es' ? 'Límite de velocidad excedido.' : 'Rate-Limit erreicht.',
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
    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const systemPrompt = `Du bist der Support Bot fuer den ABI Planer.
Antworte in der Sprache des Nutzers (bevorzugt: ${locale}).
Dein Ziel ist es, Schülern und Lehrern bei Fragen zur App zu helfen.
Nutze den bereitgestellten Hilfe-Kontext (FAQs), um genaue Antworten zu geben.
Wenn du keine Antwort in den FAQs findest, verweise freundlich auf das Kontaktformular oder die Beschwerdeseite.
Halte dich kurz und präzise.
Du bist ein KI-Assistent und kannst keine manuellen Änderungen am System vornehmen.`

    const faqContextMessage = faqMatchResult.context !== 'Keine passenden FAQ-Treffer gefunden.'
      ? `Hilfe-Kontext:\n${faqMatchResult.context}`
      : 'Hilfe-Kontext: Keine passenden FAQ-Treffer gefunden.'

    const groqPayload = {
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: faqContextMessage },
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: 'user', content: prompt },
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
      return NextResponse.json({ ok: false, error: 'ABI Bot currently unavailable' }, { status: 502 })
    }

    const parsed = await upstreamResponse.json()
    const upstreamAnswer = parsed?.choices?.[0]?.message?.content?.trim() || ''
    const emptyAnswer = upstreamAnswer.length === 0
    const answer = emptyAnswer ? getFallbackAnswer(locale) : upstreamAnswer

    return NextResponse.json({
      ok: true,
      answer,
      emptyAnswer,
      requestId,
      meta: {
        faqLookupUsed: faqMatchResult.matches.length > 0,
        faqMatches: faqMatchResult.matches.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: 'ABI Bot failed to respond.' }, { status: 500 })
  }
}
