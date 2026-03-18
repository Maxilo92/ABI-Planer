import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

export { app, auth, db, storage };
