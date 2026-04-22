<!-- AGENT_NAV_METADATA -->
<!-- path: docs/PROJECT_KNOWLEDGE.md -->
<!-- role: primary -->
<!-- read_mode: read-first -->
<!-- token_hint: full -->
<!-- default_action: read before deeper file exploration -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# Projekt-Wissen und Architektur

Stand: 22. April 2026

Dieses Dokument ist der technische Index fuer Entwickler. Detaillierte Prozesse sind in spezialisierten Dokumenten ausgelagert.

## 1. Technische Kernfakten
- Frontend: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- Backend: Firebase Auth, Firestore, Storage
- Cloud Functions: `functions/` (Node.js 22)
- Firestore Datenbank-ID: `abi-data` (nie `(default)`)
- Deployment: Firebase App Hosting, produktiv ueber Branch `release`

## 2. Sicherheits- und Rollenmodell
- Zero-Trust wird ueber `firestore.rules` und `storage.rules` erzwungen.
- Rollen in `profiles/{uid}.role`: `viewer`, `planner`, `admin`, `admin_main`, `admin_co`.
- Zugriff setzt `is_approved: true` voraus.
- Domain Restriction: Registrierung nur mit `@hgr-web.lernsax.de`.
- TCG-RNG bleibt serverseitig (`openBooster`), keine Client-RNG.

Details:
- `docs/SECURITY_GUIDE.md`
- `docs/FIRESTORE_SCHEMA.md`
- `docs/CLOUD_FUNCTIONS_API.md`

## 3. Deployment und CI/CD
- Standard-Workflow: Entwicklung auf `main`.
- Promotion nach `release` nur auf Anweisung.
- Lokales Pflicht-Gate vor Merge/Release: `npm run check`.

Details:
- `DEPLOYMENT.md`
- `docs/CI-CD.md`

## 4. Environment und Konfiguration
- Public Firebase Variablen: `NEXT_PUBLIC_*`.
- Secrets bleiben serverseitig (z. B. `GROQ_API_KEY`).
- Lokale Konfiguration in `.env.local`, Produktion in App Hosting Settings.

Details:
- `docs/.env-reference.md`

## 5. Recht und Compliance
- Bei Aenderungen an Auth, Profilen, Logs, Zahlungen oder Rechtsseiten ist die Compliance-Checkliste verpflichtend.

Details:
- `docs/LEGAL_COMPLIANCE.md`

## 6. Troubleshooting und Betrieb
- Haeufige Fehlerbilder und Diagnosepfade sind zentral dokumentiert.

Details:
- `docs/TROUBLESHOOTING.md`

## 7. Weitere wichtige Quellen
- `README.md` (Einstieg)
- `INSTALL.md` (Setup)
- `CHANGELOG.md` (Aenderungshistorie)
- `firestore.rules` / `storage.rules` (Sicherheitsquelle)
- `firestore.indexes.json` (Indexquelle)
