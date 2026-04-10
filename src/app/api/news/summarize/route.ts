import { NextRequest, NextResponse } from 'next/server'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const MAX_CONTENT_CHARS = 12000

function getAdminApp() {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing from environment variables.')
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

  // Fallback for local development or GCP environment
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
    
    // In development, we can be more lenient if the profile fetch fails due to permission issues
    // but here we try to get the profile.
    const profileSnap = await db.collection('profiles').doc(decoded.uid).get()
    
    if (!profileSnap.exists) {
      // Fallback: If we can't find the profile via Admin SDK (maybe DB is different), 
      // but we have a valid UID, we might allow it in dev? No, let's stay secure but log.
      console.warn(`Profile ${decoded.uid} not found in Firestore 'abi-data' collection 'profiles'.`)
      return { ok: false as const, status: 404, error: 'Profile not found in database' }
    }

    const profile = profileSnap.data() as { is_approved?: boolean } | undefined
    if (!profile?.is_approved) {
      return { ok: false as const, status: 403, error: 'Profile not approved' }
    }

    return { ok: true as const, uid: decoded.uid }
  } catch (err: any) {
    console.error('Verification error details:', err)
    
    // Check for common local dev issues
    if (err?.message?.includes('Could not load the default credentials')) {
      return { 
        ok: false as const, 
        status: 500, 
        error: 'Firebase Admin credentials missing', 
        details: 'Local dev needs GOOGLE_APPLICATION_CREDENTIALS or gcloud auth application-default login.' 
      }
    }
    
    return { ok: false as const, status: 401, error: 'Auth failed: ' + (err?.message || 'Unknown error') }
  }
}

function cleanSummary(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/\n{3,}/g, '\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Missing authorization header' }, { status: 401 })
    }

    // Developer Bypass for local testing without Admin SDK Credentials
    const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'
    let uid = 'dev-user'

    if (isBypass) {
      console.log('--- MAESTRO_DEV_BYPASS ACTIVE: Skipping Admin SDK Auth ---')
    } else {
      const authResult = await verifyApprovedUserFromHeader(authHeader)
      if (!authResult.ok) {
        return NextResponse.json({ ok: false, error: authResult.error, details: authResult.details }, { status: authResult.status })
      }
      uid = authResult.uid
    }

    const body = await request.json().catch(() => null)
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!title || !content) {
      return NextResponse.json({ ok: false, error: 'Missing title or content' }, { status: 400 })
    }

    if (content.length > MAX_CONTENT_CHARS) {
      return NextResponse.json(
        { ok: false, error: `Content too long. Max ${MAX_CONTENT_CHARS} characters.` },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
    if (!apiKey) {
      console.error('GROQ_API_KEY is missing from environment variables.')
      return NextResponse.json(
        {
          ok: false,
          error: 'GROQ_API_KEY is not configured on the server. Restart `npm run dev` after updating .env.local.',
        },
        { status: 500 }
      )
    }

    const prompt = `Titel: ${title}\n\nNachricht:\n${content}`

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein hilfreicher Assistent fuer den ABI Planer. Erstelle eine kurze, sachliche deutsche Zusammenfassung in 3 bis 5 Saetzen. Gib NUR den Text der Zusammenfassung aus. Keine Einleitung (wie "Hier ist eine Zusammenfassung..."), keine Titel, kein "KI-Zusammenfassung" Label und kein Gelaber drumherum. Nur der reine Inhalt.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    const rawPayload = await groqResponse.text()
    if (!groqResponse.ok) {
      console.error('Groq API Error:', groqResponse.status, rawPayload)
      return NextResponse.json(
        {
          ok: false,
          error: 'Groq request failed',
          upstreamStatus: groqResponse.status,
          body: rawPayload,
        },
        { status: 502 }
      )
    }

    let parsed: any = null
    try {
      parsed = JSON.parse(rawPayload)
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid Groq response format' }, { status: 502 })
    }

    const summary = cleanSummary(parsed?.choices?.[0]?.message?.content)
    if (!summary) {
      return NextResponse.json({ ok: false, error: 'Empty summary returned by Groq' }, { status: 502 })
    }

    return NextResponse.json(
      {
        ok: true,
        summary,
        meta: {
          model: DEFAULT_GROQ_MODEL,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error generating news summary:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to generate summary',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}