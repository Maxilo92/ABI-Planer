// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// These values should ideally match your client-side firebase config.
// Since this is a static file in /public, you may need to hardcode them here
// or use a build script to populate them.
firebase.initializeApp({
  apiKey: "AIzaSyA5BJ9VEv-2GD0gcIhItGA2c316-rzN56Y",
  authDomain: "abi-planer-75319.firebaseapp.com",
  projectId: "abi-planer-75319",
  storageBucket: "abi-planer-75319.firebasestorage.app",
  messagingSenderId: "951302193724",
  appId: "Y1:951302193724:web:31f24f0d557f7ceff33939"
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
