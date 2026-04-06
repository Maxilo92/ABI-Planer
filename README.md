<!-- AGENT_NAV_METADATA -->
<!-- path: README.md -->
<!-- role: primary -->
<!-- read_mode: read-first -->
<!-- token_hint: full -->
<!-- default_action: read before deeper file exploration -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# ABI Planer v1.3.0

📚 Zentrale Plattform für die Planung und Organisation des Abiturs 2027.

## ✨ Features
- **Dashboard** — Countdown mit Finanzstatus, Aufgaben-Übersicht, News & Events
- **Veranstaltungsplanung** — Kalender mit Ereignissen und Erinnerungen
- **Finanzmanagement** — Einnahmen, Ausgaben, Finanzierungsziele tracking
- **Aufgabenverwaltung** — Todo-Listen mit Prioritäten & Zuständigkeit
- **Schnelle Abstimmungen** — Umfragen für Gruppen-Entscheidungen
- **News-Hub** — Zentrale Kommunikation mit Bildern & Links
- **Gruppenystem** — Dynamischer Kollaborations-Hub mit Chat, Threads, Medienanhängen & Read-Tracking
- **Freundessystem** — Freundschaftsanfragen, Freundesliste mit Suche & Filterung
- **Sammelkarten (TCG)** — Lehrer-Karten sammeln, Booster öffnen, Tauschen mit Freunden
- **Shop** — In-App-Shop für Booster und Items
- **Rollenverwaltung** — Admin/Planner/Viewer mit granularer Berechtigung

## 🚀 Quick Start
1. [Installation & Setup](./INSTALL.md) — Firebase-Projekt vorbereiten

## 📚 Complete Documentation
- [Agent Context Index](./docs/AGENT_CONTEXT_INDEX.md) — Startpunkt für Agenten mit Kontext-Sparstrategie (relevante Dateien zuerst)
- [README Testing Phase](./README_TESTING_PHASE.md) — Überblick Testing Phase
- [Test Environment Setup](./TEST_ENVIRONMENT_SETUP.md) — Lokal zum Testen starten
- [Testing Checklist](./TESTING_CHECKLIST.md) — 41 konkrete Test-Cases
- [Deployment Guide](./DEPLOYMENT.md) — Production auf Firebase deployen
- [Projekt-Wissen & Architektur](./docs/PROJECT_KNOWLEDGE.md) — Technische Details & Stack
- [Changelog](./CHANGELOG.md) — Alle Änderungen seit v1.0.0

## 🔒 Security
- ✅ Lernsax Domain-Validierung (@hgr-web.lernsax.de)
- ✅ Firestore Zero-Trust Security Rules
- ✅ Admin-per-Instance Modell (1. Nutzer = Admin)
- ✅ Sammelkarten-RNG ausschließlich serverseitig (Cloud Functions)
- ✅ 0 Critical CVE-Vulnerabilities

## ⚙️ Development
- `npm run lint` — Code-Qualität prüfen
- `npm run test:regressions` — Kritische Funktionen testen
- `npm run check` — Full Release Gate (regressions + tsc + build)
- `npm run build` — Production Build für Deployment

---
**Version:** 1.3.0 | **Status:** Active Development
