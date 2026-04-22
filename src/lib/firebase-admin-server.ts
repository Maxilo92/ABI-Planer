import * as admin from 'firebase-admin'

const project_id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
const client_email = process.env.FIREBASE_CLIENT_EMAIL
const private_key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

export function initAdmin() {
  if (admin.apps.length > 0) return admin.app()

  if (!project_id || !client_email || !private_key) {
    console.error('Firebase Admin Init Error: Missing credentials', { 
      hasProjectId: !!project_id, 
      hasClientEmail: !!client_email, 
      hasPrivateKey: !!private_key 
    })
    // Fallback for local development
    if (process.env.NODE_ENV !== 'production') {
       return admin.initializeApp({
         projectId: project_id || 'demo-project',
         credential: admin.credential.cert({
            projectId: project_id || 'demo-project',
            clientEmail: 'dev@demo.local',
            privateKey: '-----BEGIN PRIVATE KEY-----\nMIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAM\n-----END PRIVATE KEY-----\n'
         })
       })
    }
    throw new Error('Missing Firebase Admin environment variables')
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: project_id,
      clientEmail: client_email,
      privateKey: private_key,
    }),
    projectId: project_id,
  })
}

export const adminAuth = () => initAdmin().auth()
export const adminDb = () => initAdmin().firestore()
