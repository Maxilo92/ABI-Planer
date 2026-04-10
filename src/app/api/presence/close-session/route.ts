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
    const db = getFirestore(app)

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
    console.error('Error closing session:', error)
    return NextResponse.json({ ok: false, error: 'Failed to close session' }, { status: 502 })
  }
}