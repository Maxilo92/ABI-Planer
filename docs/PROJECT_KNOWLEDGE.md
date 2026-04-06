<!-- AGENT_NAV_METADATA -->
<!-- path: docs/PROJECT_KNOWLEDGE.md -->
<!-- role: primary -->
<!-- read_mode: read-first -->
<!-- token_hint: full -->
<!-- default_action: read before deeper file exploration -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# Projekt-Wissen & Architektur (ABI Planer v1.0.0)

Dieses Dokument sichert das Wissen über die technische Struktur und die getroffenen Entscheidungen für die Production-Release. (Stand: 29. März 2026)

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

### iPad & Tablet Optimierung
- **Breakpoint:** Die Desktop-Sidebar wird erst ab `lg` (1024px) angezeigt.
- **Strategie:** iPads im Portrait-Modus (768px - 834px) nutzen den mobilen Drawer. Dies maximiert den Platz für Dashboards und Listen auf Tablets.
- **Dashboard:** Nutzt ein 2-spaltiges Layout ab `md` (768px), da ohne Sidebar genug Platz auf iPads vorhanden ist.

## 3. Sicherheits-Konzept (Zero Trust)
### Daten-Zugriff (Read Rules)
- **Öffentlich:** Die `news` Collection ist für alle Nutzer (auch unauthentifiziert) lesbar, um Transparenz zu gewährleisten.
- **Kritisch:** Alle anderen Kern-Collections (`events`, `finances`, `polls`, `teachers`, `todos`) sind gegen öffentlichen Lesezugriff gesperrt.
- **Regel:** Zugriff erfolgt nur nach erfolgreicher Authentifizierung via `@hgr-web.lernsax.de`.

### Sammelkarten & RNG (TCG)
- **Autoritär:** Die Generierung von Karten-Packs und Varianten (RNG) erfolgt ausschließlich serverseitig über die Cloud Function `openBooster`.
- **Integrität:** Client-seitige Manipulationen der Sammlung sind unmöglich, da Schreibrechte auf `user_teachers` für Nutzer gesperrt sind und nur via Admin SDK (Cloud Functions) aktualisiert werden.

### Rollen-System
...
- **Erster Nutzer:** Der allererste registrierte Nutzer in der Datenbank erhält automatisch die `admin` Rolle.

## 4. Backend & Automatisierung (Cloud Functions)
### Rarity Sync (Cron)
- **Job:** Ein 15-minütiger Cron-Job (`syncTeacherRarities`) stabilisiert die Seltenheiten basierend auf globalen Limits (z.B. max. 1 Legendary). Dies verhindert "Rarity Drift".

### GDPR & Löschung
- **Vollständig:** Die Lösch-Logik (`onProfileDeleted`) umfasst alle Nutzer-Daten, inkl. der `referrals` Collection, `poll_votes` und Profil-Subcollections.
- **Anonymisierung:** 
  - **Finanzen:** Stripe-Transfers werden aus GoBD-Gründen (10 Jahre) anonymisiert aufbewahrt (`masked_userId`).
  - **Audit Logs:** Log-Einträge in der `logs` Collection werden anonymisiert (`masked_userId`, `user_name` gelöscht), um die Revisionssicherheit bei gleichzeitiger Wahrung des "Rechts auf Vergessenwerden" zu garantieren.

## 5. Deployment-Workflow
...

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
