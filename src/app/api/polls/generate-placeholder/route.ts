import { NextRequest, NextResponse } from 'next/server'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'

function getAdminApp() {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) {
    // In bypass mode, we don't strictly need a real project ID for initialization
    if (process.env.MAESTRO_DEV_BYPASS === 'true') {
      return initializeApp({ projectId: 'dev-project' })
    }
    throw new Error('FIREBASE_PROJECT_ID is missing from environment variables.')
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      })
    } catch (e) {
      console.error('Firebase Admin cert initialization failed:', e)
    }
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

function getDb() {
  const app = getAdminApp()
  try {
    // Attempt to use 'abi-data' database if it exists
    return getFirestore(app, 'abi-data')
  } catch {
    // Fallback to default database
    return getFirestore(app)
  }
}

async function verifyApprovedUserFromHeader(authHeader: string | null) {
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'
  if (isBypass) {
    console.log('[API] Maestro Dev Bypass active for generate-placeholder')
    return { ok: true as const, uid: 'dev-user' }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false as const, status: 401, error: 'Missing or invalid authorization header' }
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    return { ok: false as const, status: 401, error: 'Empty bearer token' }
  }

  try {
    const app = getAdminApp()
    const auth = getAuth(app)
    const db = getDb()

    const decoded = await auth.verifyIdToken(idToken)
    const profileSnap = await db.collection('profiles').doc(decoded.uid).get()
    
    if (!profileSnap.exists) {
      console.warn(`[API] Profile not found for UID: ${decoded.uid}`)
      return { ok: false as const, status: 404, error: 'Profile not found in database' }
    }

    const profile = profileSnap.data()
    if (!profile?.is_approved) {
      console.warn(`[API] Profile not approved for UID: ${decoded.uid}`)
      return { ok: false as const, status: 403, error: 'User profile is not approved' }
    }

    return { ok: true as const, uid: decoded.uid }
  } catch (err: any) {
    console.error('[API] Auth verification failed:', err?.message || err)
    return { 
      ok: false as const, 
      status: 401, 
      error: 'Authentication failed', 
      details: err?.message || 'Unknown error during token verification' 
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const authResult = await verifyApprovedUserFromHeader(authHeader)
    
    if (!authResult.ok) {
      return NextResponse.json(
        { ok: false, error: authResult.error, details: (authResult as any).details }, 
        { status: authResult.status }
      )
    }

    const body = await request.json().catch(() => null)
    const question = typeof body?.question === 'string' ? body.question.trim() : ''

    if (!question) {
      return NextResponse.json({ ok: false, error: 'Missing question in request body' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
    if (!apiKey) {
      console.error('[API] GROQ_API_KEY is not configured')
      return NextResponse.json({ ok: false, error: 'Server configuration error: GROQ_API_KEY missing' }, { status: 500 })
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 50,
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein kreativer Assistent für den ABI Planer. Erstelle einen kurzen, motivierenden Platzhalter-Text für ein Eingabefeld einer Umfrage. Der Platzhalter soll Nutzer dazu anregen, einen eigenen Vorschlag einzureichen. Gib NUR den reinen Text des Platzhalters aus. Maximal 5 Wörter. Keine Anführungszeichen, kein Gelaber. Beispiele: "Dein ultimatives Motto...", "Welcher Song fehlt noch?", "Deine Idee für das Menü..."',
          },
          {
            role: 'user',
            content: `Frage der Umfrage: ${question}`,
          },
        ],
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error('[API] Groq API Error:', groqResponse.status, errorText)
      return NextResponse.json({ ok: false, error: 'Groq request failed', details: errorText }, { status: 502 })
    }

    const parsed = await groqResponse.json()
    let placeholder = parsed?.choices?.[0]?.message?.content?.trim() || ''
    
    placeholder = placeholder.replace(/^["']|["']$/g, '')

    return NextResponse.json({ ok: true, placeholder }, { status: 200 })
  } catch (error: any) {
    console.error('[API] Error in generate-placeholder:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}
