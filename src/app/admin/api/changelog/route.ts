import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export const runtime = 'nodejs'

type LocalRouteError = Error & { status?: number }

function toRouteError(message: string, status: number): LocalRouteError {
  const error = new Error(message) as LocalRouteError
  error.status = status
  return error
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

async function verifyTokenFromHeader(authHeader: string): Promise<void> {
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

  if (!decoded?.uid) {
    throw toRouteError('Invalid authentication token', 401)
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Missing authorization header' }, { status: 401 })
    }

    await verifyTokenFromHeader(authHeader)
    const changelogPath = join(process.cwd(), 'CHANGELOG.md')
    const content = await readFile(changelogPath, 'utf8')

    return NextResponse.json({ ok: true, data: { content } }, { status: 200 })
  } catch (error) {
    const status = (error as LocalRouteError)?.status || 500
    const message = error instanceof Error ? error.message : 'Unable to load changelog'
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}