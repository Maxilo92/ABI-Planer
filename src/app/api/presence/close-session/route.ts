import { NextRequest, NextResponse } from 'next/server'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      })
    } catch (error) {
      console.error('Failed to initialize admin app with cert in close-session route:', error)
    }
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    })
  } catch (error: any) {
    if (isBypass) {
      console.warn('Close-session: Admin SDK init failed, bypass active:', error?.message || String(error))
      return initializeApp({ projectId: projectId || 'dev-project' })
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const idToken = typeof body?.idToken === 'string' ? body.idToken : ''
    const sessionStartedAt = typeof body?.sessionStartedAt === 'string' ? new Date(body.sessionStartedAt) : null

    if (!idToken) {
      return NextResponse.json({ ok: false, error: 'Missing idToken' }, { status: 401 })
    }

    if (!sessionStartedAt || Number.isNaN(sessionStartedAt.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid sessionStartedAt' }, { status: 400 })
    }

    const app = getAdminApp()
    const auth = getAuth(app)
    const db = getFirestore(app, 'abi-data')

    const decodedToken = await auth.verifyIdToken(idToken)
    const uid = decodedToken.uid
    const profileRef = db.collection('profiles').doc(uid)
    const profileSnap = await profileRef.get()

    if (!profileSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Profile not found' }, { status: 404 })
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartedAt.getTime()) / 1000))

    await profileRef.set(
      {
        isOnline: false,
        lastOnline: FieldValue.serverTimestamp(),
        onlineSince: null,
        lastSessionDurationSeconds: durationSeconds,
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, durationSeconds }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Could not load the default credentials')) {
      // Local dev fallback: closing presence should not fail hard if ADC is missing.
      return NextResponse.json(
        {
          ok: true,
          skipped: true,
          reason: 'firebase_admin_credentials_missing',
        },
        { status: 200 }
      )
    }

    console.error('Error closing session:', error)
    return NextResponse.json({ ok: false, error: 'Failed to close session' }, { status: 502 })
  }
}