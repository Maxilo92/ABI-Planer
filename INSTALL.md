# Installation & Setup (v1.0.0 Release)

Folge diesen Schritten, um den ABI Planer produktiv zu setzen.

## 1. Firebase Projekt Setup
- Erstelle ein neues Projekt in der [Firebase Console](https://console.firebase.google.com/).
- Aktiviere **Authentication** (Methode: E-Mail/Passwort).
- Aktiviere **Cloud Firestore** (Region: europe-west3/4 empfohlen).
- Erstelle eine **Web-App** im Projekt und kopiere die Konfiguration.

## 2. Umgebungsvariablen (.env)
Erstelle eine `.env.local` (lokal) oder füge die Variablen in deinem Hosting (z.B. Vercel) hinzu:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

## 3. Firestore Datenbank Initialisierung
Damit das Dashboard (Countdown & Finanzziel) korrekt funktioniert, musst du **einmalig** dieses Dokument manuell in Firestore anlegen:

- **Collection:** `settings`
- **Document ID:** `config`
- **Felder:**
  - `ball_date` (string): `2027-06-19T18:00:00Z` (Beispiel)
  - `funding_goal` (number): `10000`

## 4. Sicherheitsregeln anwenden
Kopiere den Inhalt der Datei `FIRESTORE_RULES.md` in den Tab **Rules** deiner Firestore Database.

## 5. Den ersten Admin erstellen
1. Starte die App und gehe auf **Registrieren**.
2. Registriere dich mit deiner **@hgr-web.lernsax.de** Adresse.
3. **Wichtig:** Der allererste Nutzer, der sich in der Datenbank registriert, wird automatisch zum **Admin**.
4. Danach kannst du über das **Admin Dashboard** andere Nutzer zu Planern befördern.

## 6. Sicherheitsempfehlung (Optional aber empfohlen)
In der Firebase Console unter **Authentication > Settings > User actions**:
- Deaktiviere "Allow account creation" falls die Registrierungsphase vorbei ist.
- Aktiviere "Email enumeration protection".
- **Lernsax-Check:** Da wir die Domain `@hgr-web.lernsax.de` erzwingen, ist die App bereits gut gegen fremde Zugriffe geschützt.
