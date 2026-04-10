import { NextRequest, NextResponse } from 'next/server'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_SECONDS = 60
const MAX_PROMPT_CHARS = 3000
const MAX_MESSAGES_CONTEXT = 16

type ChatType = 'internal' | 'hub' | 'role' | 'system'

type ConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string | null
}

type AuthResult =
  | { ok: true; uid: string; profile: Record<string, unknown> }
  | { ok: false; status: number; error: string; details?: string }

function getAdminApp() {
  const apps = getApps()
  if (apps.length > 0) return apps[0]

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'

  if (!projectId && !isBypass) {
    throw new Error('FIREBASE_PROJECT_ID is not configured')
  }

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
    if (isBypass) {
      console.warn('Firebase Admin initialization failed, but bypass is active:', error.message)
      return initializeApp({ projectId: projectId || 'dev-project' })
    }
    throw error
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

function parseChatType(value: unknown): ChatType | null {
  if (value === 'internal' || value === 'hub' || value === 'role' || value === 'system') {
    return value
  }
  return null
}

function normalizeRoleAccess(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  return normalized
}

function isPlanner(role: unknown): boolean {
  return role === 'planner' || role === 'admin' || role === 'admin_main' || role === 'admin_co'
}

function isAdmin(role: unknown): boolean {
  return role === 'admin' || role === 'admin_main' || role === 'admin_co'
}

function hasChatAccess(profile: Record<string, unknown>, chatType: ChatType, groupName: string, roleAccess: string | null): boolean {
  const role = profile.role
  const planningGroups = Array.isArray(profile.planning_groups) ? profile.planning_groups : []

  if (chatType === 'system') {
    return true
  }

  if (chatType === 'hub') {
    return groupName === 'hub'
  }

  if (chatType === 'internal') {
    return planningGroups.includes(groupName)
  }

  if (chatType === 'role') {
    if (roleAccess === 'viewer') return true
    if (roleAccess === 'planner') return isPlanner(role)
    if (roleAccess === 'admin') return isAdmin(role)
    if (roleAccess === 'system') return true
    return false
  }

  return false
}

function buildChatKey(uid: string, chatType: ChatType, groupName: string, roleAccess: string | null): string {
  const rolePart = roleAccess || 'none'
  return `${uid}__${chatType}__${groupName}__${rolePart}`
}

async function verifyApprovedUser(authHeader: string | null): Promise<AuthResult> {
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'

  if (isBypass) {
    console.log('--- MAESTRO_DEV_BYPASS ACTIVE: Skipping Admin SDK Auth in ABI Bot ---')
    return { 
      ok: true, 
      uid: 'dev-user', 
      profile: { 
        is_approved: true, 
        role: 'admin',
        full_name: 'Dev User',
        planning_groups: ['hub']
      } 
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
    const app = getAdminApp()
    const auth = getAuth(app)
    const db = getDb()

    const decoded = await auth.verifyIdToken(idToken)
    const profileSnap = await db.collection('profiles').doc(decoded.uid).get()

    if (!profileSnap.exists) {
      console.warn(`ABI Bot Auth: Profile ${decoded.uid} not found in database.`)
      return { ok: false, status: 404, error: 'Profile not found' }
    }

    const profile = (profileSnap.data() || {}) as Record<string, unknown>
    if (!profile.is_approved) {
      return { ok: false, status: 403, error: 'Profile not approved' }
    }

    return { ok: true, uid: decoded.uid, profile }
  } catch (error: any) {
    console.error('verifyApprovedUser error details:', error)
    
    if (error?.message?.includes('Could not load the default credentials')) {
      return { 
        ok: false, 
        status: 500, 
        error: 'Firebase Admin credentials missing', 
        details: 'Local dev needs GOOGLE_APPLICATION_CREDENTIALS or gcloud auth application-default login.' 
      } as any
    }

    return { ok: false, status: 401, error: 'Authentication failed: ' + (error?.message || 'Unknown error') }
  }
}

async function checkAndIncrementRateLimit(uid: string) {
  const db = getDb()
  const docRef = db.collection('rate_limits').doc(`${uid}_abi_bot_message`)

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
        operation_type: 'abi_bot_message',
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

async function writeAuditLog(payload: Record<string, unknown>) {
  try {
    const db = getDb()
    await db.collection('abi_bot_logs').add({
      ...payload,
      created_at: Timestamp.now(),
    })
  } catch (error) {
    console.error('Failed to write abi bot audit log:', error)
  }
}

function sanitizePrompt(rawPrompt: unknown): string {
  if (typeof rawPrompt !== 'string') return ''
  return rawPrompt.trim().slice(0, MAX_PROMPT_CHARS)
}

async function loadRecentMessages(chatKey: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const db = getDb()
  const snap = await db
    .collection('abi_bot_conversations')
    .doc(chatKey)
    .collection('messages')
    .orderBy('created_at', 'desc')
    .limit(MAX_MESSAGES_CONTEXT)
    .get()

  return snap.docs
    .map((doc) => doc.data() as { role?: 'user' | 'assistant'; content?: string })
    .filter((msg) => (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string' && msg.content.trim().length > 0)
    .reverse()
    .map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content as string }))
}

async function persistConversationMessages(
  chatKey: string,
  uid: string,
  chatType: ChatType,
  groupName: string,
  roleAccess: string | null,
  prompt: string,
  answer: string,
  requestId: string
) {
  const db = getDb()
  const now = Timestamp.now()
  const conversationRef = db.collection('abi_bot_conversations').doc(chatKey)
  const userMessageRef = conversationRef.collection('messages').doc()
  const assistantMessageRef = conversationRef.collection('messages').doc()

  const batch = db.batch()

  batch.set(
    conversationRef,
    {
      chat_key: chatKey,
      user_id: uid,
      chat_type: chatType,
      group_name: groupName,
      role_access: roleAccess,
      updated_at: now,
      last_message_preview: answer.slice(0, 180),
      last_request_id: requestId,
      created_at: now,
    },
    { merge: true }
  )

  batch.set(userMessageRef, {
    role: 'user',
    content: prompt,
    request_id: requestId,
    created_by: uid,
    created_at: now,
  })

  batch.set(assistantMessageRef, {
    role: 'assistant',
    content: answer,
    request_id: requestId,
    created_by: 'abi-bot',
    created_at: now,
  })

  await batch.commit()
}

function mapConversationMessages(
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[]
): ConversationMessage[] {
  return docs.map((messageDoc) => {
    const data = messageDoc.data() as {
      role?: 'user' | 'assistant'
      content?: string
      created_at?: Timestamp
    }

    return {
      id: messageDoc.id,
      role: data.role === 'assistant' ? 'assistant' : 'user',
      content: typeof data.content === 'string' ? data.content : '',
      created_at: data.created_at ? data.created_at.toDate().toISOString() : null,
    }
  })
}

export async function GET(request: NextRequest) {
  const authResult = await verifyApprovedUser(request.headers.get('authorization'))
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error, details: authResult.details }, { status: authResult.status })
  }

  const chatType = parseChatType(request.nextUrl.searchParams.get('chatType'))
  const groupName = (request.nextUrl.searchParams.get('groupName') || '').trim()
  const roleAccess = normalizeRoleAccess(request.nextUrl.searchParams.get('roleAccess'))

  if (!chatType || !groupName) {
    return NextResponse.json({ ok: false, error: 'chatType and groupName are required' }, { status: 400 })
  }

  if (!hasChatAccess(authResult.profile, chatType, groupName, roleAccess)) {
    return NextResponse.json({ ok: false, error: 'Forbidden chat access' }, { status: 403 })
  }

  try {
    const chatKey = buildChatKey(authResult.uid, chatType, groupName, roleAccess)
    const db = getDb()

    const snapshot = await db
      .collection('abi_bot_conversations')
      .doc(chatKey)
      .collection('messages')
      .orderBy('created_at', 'asc')
      .limit(300)
      .get()

    return NextResponse.json({
      ok: true,
      messages: mapConversationMessages(snapshot.docs),
    })
  } catch (error: any) {
    const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'
    console.error('Failed to load ABI bot conversation:', error)

    if (isBypass) {
      console.warn('ABI Bot: Firestore access failed in bypass mode, returning empty conversation.')
      return NextResponse.json({
        ok: true,
        messages: [],
        bypass_warning: 'Firestore unavailable: History not loaded.'
      })
    }

    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to load conversation',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const authResult = await verifyApprovedUser(request.headers.get('authorization'))
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error, details: authResult.details }, { status: authResult.status })
  }

  const body = await request.json().catch(() => null)
  const chatType = parseChatType(body?.chatType)
  const groupName = typeof body?.groupName === 'string' ? body.groupName.trim() : ''
  const roleAccess = normalizeRoleAccess(body?.roleAccess)
  const prompt = sanitizePrompt(body?.prompt)

  if (!chatType || !groupName || !prompt) {
    return NextResponse.json({ ok: false, error: 'chatType, groupName and prompt are required' }, { status: 400 })
  }

  if (!hasChatAccess(authResult.profile, chatType, groupName, roleAccess)) {
    return NextResponse.json({ ok: false, error: 'Forbidden chat access' }, { status: 403 })
  }

  const chatKey = buildChatKey(authResult.uid, chatType, groupName, roleAccess)
  const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'

  let rateLimit = { allowed: true, remaining: 10, resetAt: new Date(Date.now() + 60000) }
  try {
    rateLimit = await checkAndIncrementRateLimit(authResult.uid)
  } catch (rlErr) {
    console.warn('ABI Bot: Rate limit check failed, proceeding anyway in bypass mode:', rlErr)
    if (!isBypass) throw rlErr
  }

  if (!rateLimit.allowed) {
    try {
      await writeAuditLog({
        request_id: requestId,
        user_id: authResult.uid,
        chat_key: chatKey,
        chat_type: chatType,
        group_name: groupName,
        role_access: roleAccess,
        status: 'rate_limited',
        prompt,
        response: null,
        error: 'Rate limit exceeded',
        rate_limit: {
          max: RATE_LIMIT_MAX,
          remaining: rateLimit.remaining,
          reset_at: rateLimit.resetAt.toISOString(),
        },
        latency_ms: Date.now() - startedAt,
      })
    } catch (logErr) {
      console.error('ABI Bot: Failed to log rate limit event:', logErr)
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Rate limit exceeded. Maximal 10 ABI-Bot Nachrichten pro Minute.',
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
    try {
      await writeAuditLog({
        request_id: requestId,
        user_id: authResult.uid,
        chat_key: chatKey,
        chat_type: chatType,
        group_name: groupName,
        role_access: roleAccess,
        status: 'error',
        prompt,
        response: null,
        error: 'GROQ_API_KEY missing',
        latency_ms: Date.now() - startedAt,
        rate_limit: {
          max: RATE_LIMIT_MAX,
          remaining: rateLimit.remaining,
          reset_at: rateLimit.resetAt.toISOString(),
        },
      })
    } catch (logErr) {
      console.error('ABI Bot: Failed to log API key error:', logErr)
    }

    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
  }

  try {
    let history: any[] = []
    try {
      history = await loadRecentMessages(chatKey)
    } catch (histErr) {
      console.warn('ABI Bot: Failed to load history in bypass mode:', histErr)
      if (!isBypass) throw histErr
    }

    const systemPrompt = `Du bist der ABI Bot fuer den ABI Planer. Antworte auf Deutsch, knapp, praezise und hilfreich. Beziehe dich nur auf die aktuelle Chat-Nachricht und den sichtbaren Verlauf. Erfinde keine Fakten.`

    const groqPayload = {
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
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

    const rawUpstreamBody = await upstreamResponse.text()

    if (!upstreamResponse.ok) {
      try {
        await writeAuditLog({
          request_id: requestId,
          user_id: authResult.uid,
          chat_key: chatKey,
          chat_type: chatType,
          group_name: groupName,
          role_access: roleAccess,
          status: 'error',
          prompt,
          response: null,
          error: `Groq request failed (${upstreamResponse.status})`,
          upstream_status: upstreamResponse.status,
          upstream_body: rawUpstreamBody,
          latency_ms: Date.now() - startedAt,
          rate_limit: {
            max: RATE_LIMIT_MAX,
            remaining: rateLimit.remaining,
            reset_at: rateLimit.resetAt.toISOString(),
          },
        })
      } catch (logErr) {
        console.error('ABI Bot: Failed to log Groq failure:', logErr)
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'ABI Bot derzeit nicht erreichbar',
          upstreamStatus: upstreamResponse.status,
        },
        { status: 502 }
      )
    }

    let parsed: any = null
    try {
      parsed = JSON.parse(rawUpstreamBody)
    } catch {
      try {
        await writeAuditLog({
          request_id: requestId,
          user_id: authResult.uid,
          chat_key: chatKey,
          chat_type: chatType,
          group_name: groupName,
          role_access: roleAccess,
          status: 'error',
          prompt,
          response: null,
          error: 'Invalid Groq response format',
          upstream_body: rawUpstreamBody,
          latency_ms: Date.now() - startedAt,
          rate_limit: {
            max: RATE_LIMIT_MAX,
            remaining: rateLimit.remaining,
            reset_at: rateLimit.resetAt.toISOString(),
          },
        })
      } catch (logErr) {
        console.error('ABI Bot: Failed to log parse error:', logErr)
      }

      return NextResponse.json({ ok: false, error: 'Invalid AI response format' }, { status: 502 })
    }

    const answerRaw = parsed?.choices?.[0]?.message?.content
    const answer = typeof answerRaw === 'string' ? answerRaw.trim() : ''
    if (!answer) {
      throw new Error('Groq returned an empty response.')
    }

    try {
      await persistConversationMessages(chatKey, authResult.uid, chatType, groupName, roleAccess, prompt, answer, requestId)
    } catch (persistErr) {
      console.error('ABI Bot: Failed to persist conversation:', persistErr)
      if (!isBypass) throw persistErr
    }

    try {
      await writeAuditLog({
        request_id: requestId,
        user_id: authResult.uid,
        chat_key: chatKey,
        chat_type: chatType,
        group_name: groupName,
        role_access: roleAccess,
        status: 'success',
        prompt,
        response: answer,
        model: DEFAULT_GROQ_MODEL,
        latency_ms: Date.now() - startedAt,
        rate_limit: {
          max: RATE_LIMIT_MAX,
          remaining: rateLimit.remaining,
          reset_at: rateLimit.resetAt.toISOString(),
        },
      })
    } catch (logErr) {
      console.error('ABI Bot: Failed to write audit log:', logErr)
    }

    return NextResponse.json({
      ok: true,
      answer,
      requestId,
      rateLimit: {
        max: RATE_LIMIT_MAX,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt.toISOString(),
      },
      meta: {
        model: DEFAULT_GROQ_MODEL,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    const message = error?.message || String(error)
    console.error('ABI bot route failure:', error)

    return NextResponse.json({ 
      ok: false, 
      error: 'ABI Bot konnte nicht antworten.',
      details: message,
      is_bypass: isBypass
    }, { status: 500 })
  }
}
