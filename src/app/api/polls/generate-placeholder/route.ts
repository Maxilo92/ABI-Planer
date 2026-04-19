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

async function verifyApprovedUserFromHeader(authHeader: string) {
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false as const, status: 401, error: 'Missing bearer token' }
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    return { ok: false as const, status: 401, error: 'Missing bearer token' }
  }

  try {
    const app = getAdminApp()
    const auth = getAuth(app)
    const db = getFirestore(app, 'abi-data')

    const decoded = await auth.verifyIdToken(idToken)
    const profileSnap = await db.collection('profiles').doc(decoded.uid).get()
    
    if (!profileSnap.exists) {
      return { ok: false as const, status: 404, error: 'Profile not found' }
    }

    const profile = profileSnap.data()
    if (!profile?.is_approved) {
      return { ok: false as const, status: 403, error: 'Profile not approved' }
    }

    return { ok: true as const, uid: decoded.uid }
  } catch (_err) {
    return { ok: false as const, status: 401, error: 'Auth failed' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Missing authorization header' }, { status: 401 })
    }

    const authResult = await verifyApprovedUserFromHeader(authHeader)
    if (!authResult.ok) {
      return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json().catch(() => null)
    const question = typeof body?.question === 'string' ? body.question.trim() : ''

    if (!question) {
      return NextResponse.json({ ok: false, error: 'Missing question' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'GROQ_API_KEY not configured' }, { status: 500 })
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
      return NextResponse.json({ ok: false, error: 'Groq request failed' }, { status: 502 })
    }

    const parsed = await groqResponse.json()
    let placeholder = parsed?.choices?.[0]?.message?.content?.trim() || ''
    
    // Cleanup any quotes if the AI included them
    placeholder = placeholder.replace(/^["']|["']$/g, '')

    return NextResponse.json({ ok: true, placeholder }, { status: 200 })
  } catch (error: any) {
    console.error('Error generating poll placeholder:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
