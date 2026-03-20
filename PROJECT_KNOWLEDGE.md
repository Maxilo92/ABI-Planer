# Projekt-Wissen & Architektur (ABI Planer v1.0.0)

Dieses Dokument sichert das Wissen über die technische Struktur und die getroffenen Entscheidungen für die Production-Release.

## 1. Architektur & Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4 & shadcn/ui
- **Backend:** Firebase (Auth & Firestore)
- **Deployment:** Firebase App Hosting (automatisiert via GitHub)

## 2. Datenbank (Firestore)
- **Datenbank-ID:** `abi-data` (Wichtig: Nicht die Standard-ID `(default)`!).
- **Pfad:** `src/lib/firebase.ts` initialisiert Firestore explizit mit dieser ID.
- **Struktur:**
  - `profiles/{uid}`: Nutzerdaten inkl. `role` ('viewer', 'planner', 'admin') und `is_approved`.
  - `settings/config`: Zentrale App-Werte (`ball_date`, `funding_goal`).
  - `finances`, `news`, `events`, `todos`, `polls`, `votes`: Module der App.

## 3. Sicherheits-Konzept (Zero Trust)
### E-Mail-Sperre
- Sowohl in der **UI** (`RegisterPage`, `LoginPage`) als auch in den **Firestore Rules** wird die Domain `@hgr-web.lernsax.de` erzwungen.
- Code: `email.toLowerCase().endsWith('@hgr-web.lernsax.de')`.

### Rollen-System
- **Viewer:** Standard für alle Lernsax-Nutzer (darf lesen und abstimmen).
- **Planner:** Darf Termine, News und Aufgaben erstellen.
- **Admin:** Darf zusätzlich Rollen vergeben und Profile löschen.
- **Erster Nutzer:** Der allererste registrierte Nutzer in der Datenbank erhält automatisch die `admin` Rolle.

## 4. Deployment-Workflow
Das Deployment erfolgt über GitHub-Branches:
1.  **Entwicklung:** Änderungen werden auf dem `main` Branch gesammelt.
2.  **Produktion:** Um die Live-Seite zu aktualisieren, muss `main` in den **`release`** Branch gemergt und gepusht werden.
3.  **CI/CD:** Firebase App Hosting überwacht den `release` Branch und baut die Seite im `standalone` Modus.

## 5. Umgebungsvariablen (Environment Variables)
Die Firebase-Keys (`NEXT_PUBLIC_...`) müssen an zwei Stellen existieren:
1.  **Lokal:** In der Datei `.env.local` (nicht auf GitHub!).
2.  **Produktion:** Im Firebase Web Dashboard unter **App Hosting > Settings > Environment Variables**.

## 6. Wichtige Konfigurationsdateien
- `firebase.json`: Hosting & Firestore Verknüpfung.
- `firestore.rules`: Die "Türsteher"-Logik für die Datenbank.
- `firestore.indexes.json`: Performance-Indexe für Sortierungen nach Datum.
- `next.config.ts`: Konfiguriert den `standalone` Build für Cloud-Umgebungen.
