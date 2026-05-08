// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// These values should ideally match your client-side firebase config.
// This file is generated at build time by scripts/generate-sw.mjs from this template.
firebase.initializeApp({
  apiKey: "%%NEXT_PUBLIC_FIREBASE_API_KEY%%",
  authDomain: "%%NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN%%",
  projectId: "%%NEXT_PUBLIC_FIREBASE_PROJECT_ID%%",
  storageBucket: "%%NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET%%",
  messagingSenderId: "%%NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID%%",
  appId: "%%NEXT_PUBLIC_FIREBASE_APP_ID%%"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-small.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
