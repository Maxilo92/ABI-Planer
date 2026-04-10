import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, FieldPath, getFirestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore'

type LocalResetError = Error & { status?: number }

type ResetResult = {
  processed_profiles: number
  reset_profiles: number
  generated_at: string
}

type DbCandidate = {
  label: string
  db: FirebaseFirestore.Firestore
}

function toLocalError(message: string, status: number): LocalResetError {
  const error = new Error(message) as LocalResetError
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

function getDatabaseCandidates(app: ReturnType<typeof getAdminApp>): DbCandidate[] {
  const candidates: DbCandidate[] = []

  try {
    candidates.push({ label: 'abi-data', db: getFirestore(app, 'abi-data') })
  } catch {
    // Ignore and continue with default database candidate.
  }

  candidates.push({ label: 'default', db: getFirestore(app) })
  return candidates
}

async function resolveAdminDbFromHeader(authHeader: string): Promise<FirebaseFirestore.Firestore> {
  const app = getAdminApp()
  const auth = getAuth(app)

  if (!authHeader.startsWith('Bearer ')) {
    throw toLocalError('Missing bearer token', 401)
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    throw toLocalError('Missing bearer token', 401)
  }

  let decoded: { uid: string }
  try {
    decoded = await auth.verifyIdToken(idToken)
  } catch {
    throw toLocalError('Invalid authentication token', 401)
  }

  const candidateErrors: string[] = []

  for (const candidate of getDatabaseCandidates(app)) {
    try {
      const profileSnap = await candidate.db.collection('profiles').doc(decoded.uid).get()
      if (!profileSnap.exists) {
        candidateErrors.push(`[${candidate.label}] profile not found`)
        continue
      }

      const role = profileSnap.data()?.role
      if (role !== 'admin' && role !== 'admin_main' && role !== 'admin_co') {
        throw toLocalError('Admin permission required', 403)
      }

      return candidate.db
    } catch (error) {
      if ((error as LocalResetError)?.status === 403) {
        throw error
      }

      const message = error instanceof Error ? error.message : 'Unknown database error'
      candidateErrors.push(`[${candidate.label}] ${message}`)
    }
  }

  throw toLocalError(`Unable to resolve Firestore database for admin reset: ${candidateErrors.join(' | ')}`, 500)
}

export async function resetSessionStatsFromServer(authHeader: string): Promise<ResetResult> {
  const db = await resolveAdminDbFromHeader(authHeader)

  const batchSize = 400
  let processedProfiles = 0
  let resetProfiles = 0
  let lastDoc: QueryDocumentSnapshot | null = null

  while (true) {
    let query = db.collection('profiles').orderBy(FieldPath.documentId()).limit(batchSize)

    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }

    const snap = await query.get()
    if (snap.empty) break

    const batch = db.batch()

    snap.docs.forEach((profileDoc) => {
      processedProfiles += 1
      batch.update(profileDoc.ref, {
        isOnline: false,
        onlineSince: FieldValue.delete(),
        lastOnline: FieldValue.delete(),
        lastSessionDurationSeconds: FieldValue.delete(),
      })
      resetProfiles += 1
    })

    await batch.commit()

    lastDoc = snap.docs[snap.docs.length - 1]
    if (snap.size < batchSize) break
  }

  return {
    processed_profiles: processedProfiles,
    reset_profiles: resetProfiles,
    generated_at: new Date().toISOString(),
  }
}

export function getLocalResetHttpStatus(error: unknown): number {
  const maybeError = error as LocalResetError
  return maybeError?.status || 500
}
