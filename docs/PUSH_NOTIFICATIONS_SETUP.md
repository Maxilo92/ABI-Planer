# Setup-Anleitung für Push-Benachrichtigungen (FCM)

Diese Anleitung beschreibt die notwendigen Schritte in der Firebase Console, um das implementierte Push-System zu aktivieren.

## 1. Cloud Messaging in Firebase aktivieren

1. Gehe zur [Firebase Console](https://console.firebase.google.com/).
2. Wähle dein Projekt aus.
3. Klicke auf das Zahnrad-Icon neben "Project Overview" und wähle **Project Settings**.
4. Gehe zum Tab **Cloud Messaging**.
5. Stelle sicher, dass die **Cloud Messaging API (Firebase) v1** aktiviert ist (dies ist bei neuen Projekten standardmäßig der Fall).

## 2. VAPID-Key (Web Push Zertifikat) generieren

Für den Empfang von Nachrichten im Browser wird ein VAPID-Key benötigt:

1. Bleibe in den **Project Settings** im Tab **Cloud Messaging**.
2. Scrolle nach unten zum Abschnitt **Web Push configuration**.
3. Klicke unter "Web Push certificates" auf **Generate Key Pair**.
4. Kopiere den generierten Schlüssel (dies ist dein Public VAPID Key).

## 3. Umgebungsvariablen aktualisieren

Füge den kopierten Schlüssel zu deinen Umgebungsvariablen hinzu:

### Lokal (`.env.local`)
```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=DEIN_KOPIERTER_VAPID_SCHLUESSEL
```

### Produktion (Firebase App Hosting)
Füge die Variable `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in den App Hosting Einstellungen deines Projekts hinzu, damit sie beim nächsten Build verfügbar ist.

## 4. Service Worker Konfiguration (`public/firebase-messaging-sw.js`)

In der Datei `public/firebase-messaging-sw.js` befinden sich Platzhalter für die Firebase-Konfiguration. Diese müssen mit den Werten deines Projekts befüllt werden (die gleichen Werte, die auch in `src/lib/firebase.ts` genutzt werden).

```javascript
firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
});
```

## 5. Cloud Functions deployen

Nachdem die Änderungen im Code vorgenommen wurden, müssen die Cloud Functions neu deployt werden, damit die Trigger aktiv werden:

```bash
cd functions
npm run deploy
```

## Funktionsprüfung
1. Logge dich in die App ein.
2. Gehe zu den **Einstellungen**.
3. Aktiviere den Schalter **Native Push-Benachrichtigungen**.
4. Bestätige die Browser-Abfrage für Benachrichtigungen.
5. Erstelle (z.B. als Admin) eine neue News, um zu testen, ob die Benachrichtigung ankommt.
