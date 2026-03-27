import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!isConfigValid && typeof window !== 'undefined') {
  console.error('Firebase configuration is missing! Check your environment variables.');
}

// Initialize Firebase
const app = isConfigValid ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;
const auth = app ? getAuth(app) : ({} as any);
const db = app ? getFirestore(app, 'abi-data') : ({} as any);
const storage = app ? getStorage(app) : ({} as any);
const functions = app ? getFunctions(app, 'europe-west3') : ({} as any);

// Connect to Emulators only if explicitly requested via ENV or if you want to test locally
// To use emulators, add NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true to your .env.local
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

if (useEmulators && process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const host = window.location.hostname;
  
  // Use a global variable to prevent re-connecting during HMR
  if (!(window as any)._firebaseEmulatorsConnected) {
    // Firestore Emulator (abi-data)
    if (db) connectFirestoreEmulator(db, host, 8080);
    
    // Auth Emulator
    if (auth) connectAuthEmulator(auth, `http://${host}:9099`);
    
    // Functions Emulator
    if (functions) connectFunctionsEmulator(functions, host, 5001);
    
    // Storage Emulator
    if (storage) connectStorageEmulator(storage, host, 9199);
    
    (window as any)._firebaseEmulatorsConnected = true;
    console.log('--- CONNECTED TO LOCAL FIREBASE EMULATORS ---');
  }
} else if (process.env.NODE_ENV === 'development') {
  console.log('--- USING PRODUCTION FIREBASE (Local Dev) ---');
}

export { app, auth, db, storage, functions };
