import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth'
import { getFirestore, initializeFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions'

const bucketEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const resolvedBucket = bucketEnv === 'abi-planer-75319.appspot.com' 
  ? 'abi-planer-75319.firebasestorage.app' 
  : bucketEnv;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: resolvedBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

function initialize() {
  // Client-only Firebase SDK initialization:
  // client components may be evaluated during server rendering in Next.js,
  // so we must not initialize (or throw for missing NEXT_PUBLIC vars) on the server.
  if (typeof window === 'undefined') {
    return
  }

  const isConfigValid = !!firebaseConfig.apiKey;
  if (!isConfigValid) {
    throw new Error('Firebase configuration is missing! Check your environment variables.');
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (!auth) auth = getAuth(app);
  
  if (!db) {
    const isDevBrowser = process.env.NODE_ENV === 'development' && typeof window !== 'undefined'
    if (isDevBrowser) {
      // In development, we use initializeFirestore with experimentalForceLongPolling to avoid 
      // "Unexpected state (ID: ca9)" errors often caused by HMR or proxy issues.
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, 'abi-data')
    } else {
      db = getFirestore(app, 'abi-data')
    }
  }

  if (!storage) storage = getStorage(app);
  if (!functions) functions = getFunctions(app, 'europe-west3');

  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

  if (useEmulators && process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    if (!(window as any)._firebaseEmulatorsConnected) {
      const host = window.location.hostname;
      connectFirestoreEmulator(db, host, 8080);
      connectAuthEmulator(auth, `http://${host}:9099`);
      connectFunctionsEmulator(functions, host, 5001);
      connectStorageEmulator(storage, host, 9199);
      (window as any)._firebaseEmulatorsConnected = true;
      console.log('--- CONNECTED TO LOCAL FIREBASE EMULATORS ---');
    }
  } else if (process.env.NODE_ENV === 'development' && !useEmulators && typeof window !== 'undefined') {
    if (!(window as any)._firebaseConnectedLog) {
      console.log('--- USING PRODUCTION FIREBASE (Local Dev) ---');
      (window as any)._firebaseConnectedLog = true;
    }
  }
}

export function getFirebaseAuth() {
  if (!auth) initialize();
  return auth;
}

export function getFirebaseDb() {
  if (!db) initialize();
  return db;
}

export function getFirebaseStorage() {
  if (!storage) initialize();
  return storage;
}

export function getFirebaseFunctions() {
  if (!functions) initialize();
  return functions;
}

export function getFirebaseApp() {
  if (!app) initialize();
  return app;
}

// Backward-compatible named exports for existing imports across the app.
initialize();

export { app, auth, db, storage, functions }
