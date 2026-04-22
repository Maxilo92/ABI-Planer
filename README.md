<!-- AGENT_NAV_METADATA -->
<!-- path: README.md -->
<!-- role: primary -->
<!-- read_mode: read-first -->
<!-- token_hint: full -->
<!-- default_action: read before deeper file exploration -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# ABI Planer v1.30.1.03

 Zentrale Plattform fuer die Planung und Organisation des Abiturs 2027.

##  Features
- **Dashboard** — Countdown mit Finanzstatus, Aufgaben-Übersicht, News & Events
- **Veranstaltungsplanung** — Kalender mit Ereignissen und Erinnerungen
- **Finanzmanagement** — Einnahmen, Ausgaben, Finanzierungsziele tracking
- **Aufgabenverwaltung** — Todo-Listen mit Prioritäten & Zuständigkeit
- **Schnelle Abstimmungen** — Umfragen für Gruppen-Entscheidungen
- **News-Hub** — Zentrale Kommunikation mit Bildern & Links
- **Gruppensystem** — Dynamischer Kollaborations-Hub mit Chat, Threads, Medienanhaengen und Read-Tracking
- **Freundessystem** — Freundschaftsanfragen, Freundesliste mit Suche & Filterung
- **Sammelkarten (TCG)** — Lehrer-Karten sammeln, Booster öffnen, Tauschen mit Freunden
- **Shop** — In-App-Shop für Booster und Items
- **Rollenverwaltung** — Admin/Planner/Viewer mit granularer Berechtigung

##  Quick Start
1. [Installation & Setup](./INSTALL.md) — Firebase-Projekt vorbereiten
2. [Environment Variables](./docs/.env-reference.md) — zentrale Env-Referenz
3. [Deployment Guide](./DEPLOYMENT.md) — Release-Workflow fuer Produktion

##  Complete Documentation
- [Agent Context Index](./docs/AGENT_CONTEXT_INDEX.md) — Startpunkt für Agenten mit Kontext-Sparstrategie (relevante Dateien zuerst)
- [Testing Phase](./testing/README_TESTING_PHASE.md) — Ueberblick Testprozess
- [Test Environment Setup](./testing/TEST_ENVIRONMENT_SETUP.md) — lokal starten und verifizieren
- [Testing Checklist](./testing/TESTING_CHECKLIST.md) — konkrete Test-Cases
- [Deployment Guide](./DEPLOYMENT.md) — Production auf Firebase deployen
- [CI/CD und Gates](./docs/CI-CD.md) — Release-Gates und Pipeline-Logik
- [Environment Variables](./docs/.env-reference.md) — Public vs Secret Variablen
- [Security Guide](./docs/SECURITY_GUIDE.md) — Zero-Trust, Rollen und Schutzprinzipien
- [Legal Compliance](./docs/LEGAL_COMPLIANCE.md) — DSGVO-/Rechts-Checkliste fuer Entwickler
- [Firestore Schema](./docs/FIRESTORE_SCHEMA.md) — Collections, Zugriff und Index-Bezug
- [Cloud Functions API](./docs/CLOUD_FUNCTIONS_API.md) — zentrale Function-Uebersicht
- [Troubleshooting](./docs/TROUBLESHOOTING.md) — typische Fehlerbilder und Diagnose
- [Projekt-Wissen & Architektur](./docs/PROJECT_KNOWLEDGE.md) — Technische Details & Stack
- [Changelog](./CHANGELOG.md) — Alle Änderungen seit v1.0.0

##  Security
-  Lernsax Domain-Validierung (@hgr-web.lernsax.de)
-  Firestore Zero-Trust Security Rules
-  Admin-per-Instance Modell (1. Nutzer = Admin)
-  Sammelkarten-RNG ausschließlich serverseitig (Cloud Functions)
-  0 Critical CVE-Vulnerabilities

## ️ Development
- `npm run lint` — Code-Qualität prüfen
- `npm run test:regressions` — Kritische Funktionen testen
- `npm run check` — Full Release Gate (regressions + tsc + build)
- `npm run build` — Production Build für Deployment

---
**Version:** 1.30.1.03 | **Status:** Active Development
