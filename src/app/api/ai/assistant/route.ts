import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin-server'
import { Timestamp } from 'firebase-admin/firestore'
import { parseAssistantResponseContent } from '@/lib/assistant-actions'
import { getAbiBotBasePrompt, getActionCreationPrompt } from '@/lib/abi-bot-prompt'

export const runtime = 'nodejs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'
const FALLBACK_GROQ_MODEL = 'llama-3.1-8b-instant'
const TITLE_GROQ_MODEL = 'llama-3.1-8b-instant' // Cheaper and faster for utility tasks
const RATE_LIMIT_MAX = 25 // Slightly higher for personal assistant
const RATE_LIMIT_WINDOW_SECONDS = 60

type AuthResult =
  | { ok: true; uid: string; profile: Record<string, unknown> }
  | { ok: false; status: number; error: string; details?: string }

async function verifyApprovedUser(authHeader: string | null): Promise<AuthResult> {
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const idToken = authHeader.slice(7).trim()
      if (idToken) {
        const auth = adminAuth()
        const db = adminDb()

        const decoded = await auth.verifyIdToken(idToken)
        const profileSnap = await db.collection('profiles').doc(decoded.uid).get()

        if (profileSnap.exists) {
          const profile = (profileSnap.data() || {}) as Record<string, unknown>
          if (profile.is_approved) {
            return { ok: true, uid: decoded.uid, profile }
          } else if (!isBypass) {
            return { ok: false, status: 403, error: 'Profile not approved' }
          }
        } else if (!isBypass) {
          return { ok: false, status: 404, error: 'Profile not found' }
        }
      }
    } catch (error: unknown) {
      if (!isBypass) {
        return { ok: false, status: 401, error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    }
  }

  if (isBypass) {
    return {
      ok: true,
      uid: 'dev-user',
      profile: {
        is_approved: true,
        role: 'admin',
        full_name: 'Dev User',
        class_name: '12a',
        school_name: 'Dev High School',
        planning_groups: ['Abiball', 'Finanzen'],
      },
    }
  }

  return { ok: false, status: 401, error: 'Missing bearer token' }
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

interface FinanceEntry {
  id: string
  amount: number
  description: string
  date: string
  class: string | null
  category: string | null
}

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

function sanitizeTitleCandidate(title: string) {
  return title
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .slice(0, 48)
}

function buildFallbackChatTitle(messages: ChatMessage[]) {
  return 'Neuer Chat'
}

function extractJsonObject(content: string) {
  const trimmed = content.trim()
  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const jsonText = codeFenceMatch?.[1]?.trim() || trimmed

  const firstBrace = jsonText.indexOf('{')
  const lastBrace = jsonText.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null
  }

  return jsonText.slice(firstBrace, lastBrace + 1)
}

async function generateChatTitle(messages: ChatMessage[], locale: string) {
  const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^["']|["']$/g, '')
  const fallbackTitle = buildFallbackChatTitle(messages)

  if (!apiKey || messages.length === 0) {
    return fallbackTitle
  }

  const localeLabel = locale === 'en' ? 'English' : locale === 'es' ? 'Spanish' : 'German'
  const prompt = `Du bist ein präziser Titel-Generator. Erzeuge eine sehr kurze Zusammenfassung (als Titel) für diesen Chatverlauf in ${localeLabel}.
Regeln:
- Gib EXAKT ein JSON-Objekt mit dem Feld "title" zurück.
- Der Titel soll 1 bis 5 Wörter lang sein.
- Fasse das Thema basierend NUR auf den tatsächlichen Nachrichten zusammen. Erfinde NIEMALS Themen dazu (wie z.B. "Nudelrezepte" oder "Abiball", wenn sie nicht erwähnt wurden)!
- Wenn der Nutzer nur "Test" schreibt, antworte mit {"title": "Chat Test"}.
- Wenn der Nutzer nur Hallo sagt oder die Unterhaltung kein klares Thema hat, antworte mit {"title": "Begrüßung" oder "Allgemeiner Chat"}.
- Kein Punkt am Ende, keine Anführungszeichen im Titel.`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TITLE_GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 80,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: prompt },
          ...messages,
        ],
      }),
    })

    if (!response.ok) {
      return fallbackTitle
    }

    const parsed = await response.json()
    const assistantMessage = parsed?.choices?.[0]?.message
    const rawContent = typeof assistantMessage?.content === 'string' ? assistantMessage.content : ''
    const jsonText = extractJsonObject(rawContent)

    if (!jsonText) {
      return fallbackTitle
    }

    const payload = JSON.parse(jsonText) as { title?: unknown }
    const normalizedTitle = typeof payload.title === 'string' ? sanitizeTitleCandidate(payload.title) : ''

    return normalizedTitle || fallbackTitle
  } catch (error) {
    console.error('AI chat title generation failed:', error)
    return fallbackTitle
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const authResult = await verifyApprovedUser(request.headers.get('authorization'))
  
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error, details: authResult.details }, { status: authResult.status })
  }

  const body = await request.json().catch(() => null)
  const messages = sanitizeMessages(body?.messages)
  const mode = body?.mode === 'title' ? 'title' : 'assistant'
  const allowedModes = ['default', 'smalltalk', 'creative', 'sassy', 'annoyed', 'trashy']
  const botMode = allowedModes.includes(body?.botMode) ? body.botMode : 'default'

  if (mode === 'title') {
    const locale = typeof body?.locale === 'string' ? body.locale : 'de'
    const title = await generateChatTitle(messages.slice(0, 4), locale)

    return NextResponse.json({
      ok: true,
      title,
      meta: {
        model: TITLE_GROQ_MODEL,
        generatedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
    })
  }

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
    const userName = typeof authResult.profile.full_name === 'string' ? authResult.profile.full_name : null
    const className = typeof authResult.profile.class_name === 'string' ? authResult.profile.class_name : null
    const schoolName = typeof authResult.profile.school_name === 'string' ? authResult.profile.school_name : null
    const planningGroups = Array.isArray(authResult.profile.planning_groups) ? authResult.profile.planning_groups.filter((g): g is string => typeof g === 'string') : []
    const ledGroups = Array.isArray(authResult.profile.led_groups) ? authResult.profile.led_groups.filter((g): g is string => typeof g === 'string') : []

    // Fetch current state for context
    const db = adminDb()
    const [todosSnap, eventsSnap, newsSnap, settingsDoc, financesSnap, shopEarningsSnap] = await Promise.all([
      db.collection('todos').orderBy('created_at', 'desc').limit(5).get().catch(() => ({ docs: [] })),
      db.collection('events').where('start_date', '>=', new Date().toISOString()).orderBy('start_date', 'asc').limit(5).get().catch(() => ({ docs: [] })),
      db.collection('news').orderBy('created_at', 'desc').limit(3).get().catch(() => ({ docs: [] })),
      db.collection('settings').doc('config').get().catch(() => null),
      db.collection('finances').orderBy('entry_date', 'desc').select('amount', 'description', 'entry_date', 'responsible_class', 'category').get().catch(() => ({ docs: [] })),
      db.collection('shop_earnings').get().catch(() => ({ docs: [] })),
    ])

    let contextState = ''
    try {
      const currentTodos = (todosSnap as any).docs.map((d: any) => `- ${d.data().title} (${d.data().status})`).join('\n')
      const currentEvents = (eventsSnap as any).docs.map((d: any) => `- ${d.data().title} (${d.data().start_date})`).join('\n')
      const currentNews = (newsSnap as any).docs.map((d: any) => `- ${d.data().title}`).join('\n')
      const settings = settingsDoc && 'data' in settingsDoc ? settingsDoc.data() : null

      // --- Comprehensive Finance Analysis ---
      const financeEntries: FinanceEntry[] = (financesSnap as any).docs.map((d: any) => {
        const data = d.data()
        return { 
          id: d.id,
          amount: Number(data.amount) || 0, 
          description: data.description || '', 
          date: data.entry_date || '', 
          class: data.responsible_class || null, 
          category: data.category || null 
        }
      })

      const totalIncome = financeEntries.filter((e: FinanceEntry) => e.amount > 0).reduce((s: number, e: FinanceEntry) => s + e.amount, 0)
      const totalExpenses = financeEntries.filter((e: FinanceEntry) => e.amount < 0).reduce((s: number, e: FinanceEntry) => s + Math.abs(e.amount), 0)
      const currentBalance = totalIncome - totalExpenses
      const fundingGoal = Number(settings?.funding_goal) || 10000
      const progressPercent = Math.min(100, Math.round((currentBalance / fundingGoal) * 100))

      // Per-course breakdown
      const courseMap: Record<string, number> = {}
      financeEntries.forEach((e: FinanceEntry) => {
        if (e.class && e.amount > 0) {
          courseMap[e.class] = (courseMap[e.class] || 0) + e.amount
        }
      })

      // Per-category breakdown
      const catMap: Record<string, { income: number; expense: number }> = {}
      financeEntries.forEach((e: FinanceEntry) => {
        const cat = e.category || (e.amount >= 0 ? 'Sonstige Einnahmen' : 'Sonstige Ausgaben')
        if (!catMap[cat]) catMap[cat] = { income: 0, expense: 0 }
        if (e.amount >= 0) catMap[cat].income += e.amount
        else catMap[cat].expense += Math.abs(e.amount)
      })

      // Per-course breakdown (Limited to Top 5 to save tokens)
      const courseEntries = Object.entries(courseMap).sort((a, b) => b[1] - a[1])
      const topCourses = courseEntries.slice(0, 5)
      const otherCoursesSum = courseEntries.slice(5).reduce((s, e) => s + e[1], 0)
      
      let courseBreakdown = topCourses.map(([c, a]) => `  - Kurs ${c}: ${a.toFixed(2)}€`).join('\n')
      if (otherCoursesSum > 0) courseBreakdown += `\n  - Sonstige Kurse: ${otherCoursesSum.toFixed(2)}€`
      if (courseEntries.length > 5) courseBreakdown += `\n  (Insgesamt ${courseEntries.length} Kurse erfasst)`

      // Per-category breakdown (Limited to Top 8 to save tokens)
      const catEntries = Object.entries(catMap).sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
      const topCats = catEntries.slice(0, 8)
      const otherCats = catEntries.slice(8)
      
      let categoryBreakdown = topCats.map(([cat, v]) => {
        const parts = []
        if (v.income > 0) parts.push(`+${v.income.toFixed(2)}€`)
        if (v.expense > 0) parts.push(`-${v.expense.toFixed(2)}€`)
        return `  - ${cat}: ${parts.join(' / ')}`
      }).join('\n')
      
      if (otherCats.length > 0) {
        const otherInc = otherCats.reduce((s, e) => s + e[1].income, 0)
        const otherExp = otherCats.reduce((s, e) => s + e[1].expense, 0)
        categoryBreakdown += `\n  - Weitere ${otherCats.length} Kategorien: +${otherInc.toFixed(2)}€ / -${otherExp.toFixed(2)}€`
      }

      // Shop earnings total
      const shopTotal = (shopEarningsSnap as any).docs.reduce((s: number, d: any) => s + (Number(d.data().abi_share_eur) || 0), 0)

      // Recent 10 transactions for context
      const recentTransactions = financeEntries.slice(0, 10).map(e => {
        const sign = e.amount >= 0 ? '+' : ''
        const dateStr = e.date ? e.date.substring(0, 10) : '?'
        return `  - ${dateStr}: ${sign}${e.amount.toFixed(2)}€ – ${e.description}${e.class ? ` (${e.class})` : ''} [ID: ${e.id}]`
      }).join('\n')

      const financeContext = `
Finanzen:
  Finanzierungsziel: ${fundingGoal.toLocaleString('de-DE')}€
  Gesamteinnahmen: +${totalIncome.toFixed(2)}€
  Gesamtausgaben: -${totalExpenses.toFixed(2)}€
  Aktueller Stand: ${currentBalance.toFixed(2)}€ (${progressPercent}% vom Ziel)
  Noch fehlend: ${Math.max(0, fundingGoal - currentBalance).toFixed(2)}€
  Einträge gesamt: ${financeEntries.length}
  Shop-Einnahmen (Abi-Anteil): ${shopTotal.toFixed(2)}€

Aufschlüsselung nach Kurs:
${courseBreakdown || '  Keine kursspezifischen Einnahmen'}

Aufschlüsselung nach Kategorie:
${categoryBreakdown || '  Keine kategorisierten Einträge'}

Letzte 10 Transaktionen (Nutze die ID in Klammern für 'edit_finance_transaction'):
${recentTransactions || '  Keine Einträge'}`

      contextState = `
AKTUELLE SITUATION DER STUFE:
Bestehende Aufgaben (Top 5):
${currentTodos || 'Keine'}

Kommende Termine (Top 5):
${currentEvents || 'Keine'}

Letzte News:
${currentNews || 'Keine'}
${financeContext}
`
    } catch (dataErr) {
      console.error('Error constructing AI context state:', dataErr)
      contextState = 'Hinweis: Aktuelle Stufendaten konnten nicht vollständig geladen werden.'
    }

    // Fetch recent feedback for learning
    const feedbackSnap = await db.collection('ai_assistant_feedback')
      .where('user_id', '==', authResult.uid)
      .orderBy('created_at', 'desc')
      .limit(10)
      .get()
      .catch(() => ({ docs: [] }))

    const recentFeedback = (feedbackSnap as any).docs.map((d: any) => {
      const data = d.data()
      return {
        feedback: data.feedback,
        prompt: data.prompt,
        content: data.content,
      }
    })

    // --- TOKEN OPTIMIZATION: Keyword-based Context Injection ---
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || ''
    const needsFinance = /finanz|geld|kasse|einnahme|ausgabe|bezahlt|kosten|euro|€|sponsoring|budget|kauf|verkauf/i.test(lastUserMessage)
    const needsTasks = /aufgabe|todo|machen|planen|erledigen|liste|fertig|arbeit/i.test(lastUserMessage)
    const needsEvents = /termin|kalender|event|wann|treffen|datum|uhrzeit|veranstaltung/i.test(lastUserMessage)
    const needsNews = /news|neuigkeit|info|nachricht|ankündigung/i.test(lastUserMessage)

    let contextState = ''
    try {
      // Always fetch high-level stats (low cost)
      const settings = settingsDoc && 'data' in settingsDoc ? settingsDoc.data() : null
      const fundingGoal = Number(settings?.funding_goal) || 10000

      // Calculate totals (we still fetch but only send summaries to LLM if not needed)
      const financeEntries: FinanceEntry[] = (financesSnap as any).docs.map((d: any) => {
        const data = d.data()
        return { 
          id: d.id,
          amount: Number(data.amount) || 0, 
          description: data.description || '', 
          date: data.entry_date || '', 
          class: data.responsible_class || null, 
          category: data.category || null 
        }
      })

      const totalIncome = financeEntries.filter((e: FinanceEntry) => e.amount > 0).reduce((s: number, e: FinanceEntry) => s + e.amount, 0)
      const totalExpenses = financeEntries.filter((e: FinanceEntry) => e.amount < 0).reduce((s: number, e: FinanceEntry) => s + Math.abs(e.amount), 0)
      const currentBalance = totalIncome - totalExpenses
      const progressPercent = Math.min(100, Math.round((currentBalance / fundingGoal) * 100))

      // Build BASIC context (always sent, very small)
      contextState = `AKTUELLE STATS (KOMPAKT):
- Kassenstand: ${currentBalance.toFixed(2)}€ (${progressPercent}% vom ${fundingGoal}€ Ziel)
- Aufgaben: ${(todosSnap as any).docs.length}+ offen
- Nächster Termin: ${(eventsSnap as any).docs[0]?.data()?.title || 'Keiner'}`

      // Build DETAILED context ONLY ON DEMAND
      if (needsFinance) {
        // Per-course breakdown (Limited to Top 3 for extreme saving)
        const courseMap: Record<string, number> = {}
        financeEntries.forEach((e: FinanceEntry) => { if (e.class && e.amount > 0) courseMap[e.class] = (courseMap[e.class] || 0) + e.amount })
        const topCourses = Object.entries(courseMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
        const courseBreakdown = topCourses.map(([c, a]) => `  - Kurs ${c}: ${a.toFixed(2)}€`).join('\n')

        // Recent 5 transactions (Reduced from 10)
        const recentTransactions = financeEntries.slice(0, 5).map(e => {
          const sign = e.amount >= 0 ? '+' : ''
          return `  - ${e.date?.substring(5, 10)}: ${sign}${e.amount.toFixed(2)}€ – ${e.description} [ID: ${e.id}]`
        }).join('\n')

        contextState += `\n\nDETAILLIERTE FINANZEN:
Einnahmen/Ausgaben: +${totalIncome.toFixed(2)}€ / -${totalExpenses.toFixed(2)}€
Top Kurse:
${courseBreakdown || '  Keine'}
Letzte 5 Transaktionen:
${recentTransactions || '  Keine'}`
      }

      if (needsTasks) {
        const currentTodos = (todosSnap as any).docs.slice(0, 3).map((d: any) => `- ${d.data().title} (${d.data().status})`).join('\n')
        contextState += `\n\nDETAILLIERTE AUFGABEN:
${currentTodos || 'Keine'}`
      }

      if (needsEvents) {
        const currentEvents = (eventsSnap as any).docs.slice(0, 3).map((d: any) => `- ${d.data().title} (${d.data().start_date})`).join('\n')
        contextState += `\n\nKOMMENDE TERMINE:
${currentEvents || 'Keine'}`
      }

      if (needsNews) {
        const currentNews = (newsSnap as any).docs.slice(0, 2).map((d: any) => `- ${d.data().title}`).join('\n')
        contextState += `\n\nNEUIGKEITEN:
${currentNews || 'Keine'}`
      }

    } catch (dataErr) {
      console.error('Error constructing optimized AI context:', dataErr)
      contextState = 'Hinweis: Stufendaten eingeschränkt verfügbar.'
    }

    const systemPrompt = getAbiBotBasePrompt({ userName, userRole, className, schoolName, planningGroups, ledGroups, botMode, contextState, recentFeedback })
    const actionPrompt = getActionCreationPrompt(userRole, botMode)

    const buildPayload = (model: string) => ({
      model,
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: actionPrompt },
        ...messages
      ],
    })

    let selectedModel = DEFAULT_GROQ_MODEL
    let upstreamResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(selectedModel)),
    })

    // Fallback logic for Rate Limits or Upstream Errors
    if (!upstreamResponse.ok) {
      const errorData = await upstreamResponse.json().catch(() => ({}))
      const isRateLimit = upstreamResponse.status === 429
      const isBadGateway = upstreamResponse.status === 502
      
      if (isRateLimit || isBadGateway) {
        console.warn(`Primary model (${selectedModel}) failed with status ${upstreamResponse.status}. Attempting fallback...`)
        selectedModel = FALLBACK_GROQ_MODEL
        upstreamResponse = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildPayload(selectedModel)),
        })
      }
    }

    if (!upstreamResponse.ok) {
      const errorData = await upstreamResponse.json().catch(() => ({}))
      console.error('Groq API error:', upstreamResponse.status, errorData)
      
      const errorMsg = errorData?.error?.message || 'ABI Bot derzeit nicht erreichbar'
      const errorCode = errorData?.error?.code || 'upstream_error'
      
      return NextResponse.json(
        {
          ok: false,
          error: errorMsg,
          code: errorCode,
          upstreamStatus: upstreamResponse.status,
          details: errorData?.error?.message
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
    const question = structuredResponse?.question || null
    const thought = structuredResponse?.thought || null
    const actionMode = action ? (canPersistActions ? 'confirmable' : 'draft_only') : 'none'

    return NextResponse.json({
      ok: true,
      answer,
      action,
      actionMode,
      question,
      thought,
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
        model: selectedModel,
        generatedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
    })
  } catch (error: unknown) {
    console.error('ABI Bot Error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'ABI Bot konnte nicht antworten.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
