import { NextRequest, NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { generateReportSectionAnalysis, ReportSection } from '@/lib/reportAnalysisModule' // Final cache-buster rename

// Reuse Firebase Admin initialization logic
import { applicationDefault } from 'firebase-admin/app'

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]
  
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

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized')
  
  const idToken = authHeader.split('Bearer ')[1]
  const app = getAdminApp()
  
  let decoded: any
  try {
    decoded = await getAuth(app).verifyIdToken(idToken)
  } catch (err) {
    console.error('[ReportAnalyzeAPI] Token verification failed:', err)
    throw new Error('Unauthorized')
  }
  
  // Local dev fallback for role check
  if (process.env.NODE_ENV !== 'production') {
    return decoded.uid
  }

  const db = getFirestore(app, 'abi-data')
  const profileSnap = await db.collection('profiles').doc(decoded.uid).get()
  const profile = profileSnap.data()
  
  if (profile?.role !== 'admin' && profile?.role !== 'admin_main' && profile?.role !== 'admin_co') {
    throw new Error('Forbidden')
  }
  
  return decoded.uid
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request)
    
    const body = await request.json()
    const { section, data } = body as { section: ReportSection, data: any }
    
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 })
    }
    
    const analysis = await generateReportSectionAnalysis(
      { type: section, stats: data },
      apiKey
    )
    
    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('[ReportAnalyzeAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 })
  }
}
