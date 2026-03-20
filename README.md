# ABI Planer v1.0.0

📚 Zentrale Plattform für die Planung und Organisation des Abiturs 2027.

## ✨ Core Features
- **Dashboard** — Countdown mit Finanzstatus, Aufgaben-Übersicht, News & Events
- **Veranstaltungsplanung** — Kalender mit Ereignissen und Erinnerungen
- **Finanzmanagement** — Einnahmen, Ausgaben, Finanzierungsziele tracking
- **Aufgabenverwaltung** — Todo-Listen mit Prioritäten & Zuständigkeit
- **Schnelle Abstimmungen** — Umfragen für Gruppen-Entscheidungen
- **News-Hub** — Zentrale Kommunikation mit Bildern & Links
- **Rollenverwaltung** — Admin/Planner/Viewer mit granularer Berechtigung

## 🚀 Quick Start
1. [Installation & Setup](./INSTALL.md) — Firebase-Projekt vorbereiten
2. [Testing Guide](./TESTING_GUIDE.md) — Für Test-Phase anfangen
3. [User Guide](./USER_GUIDE.md) — Wie man die App nutzt

## 📚 Complete Documentation
- [README Testing Phase](./README_TESTING_PHASE.md) — Überblick Testing Phase
- [Test Environment Setup](./TEST_ENVIRONMENT_SETUP.md) — Lokal zum Testen starten
- [Testing Checklist](./TESTING_CHECKLIST.md) — 41 konkrete Test-Cases
- [Deployment Guide](./DEPLOYMENT.md) — Production auf Firebase deployen
- [Projekt-Wissen & Architektur](./PROJECT_KNOWLEDGE.md) — Technische Details

## 🔒 Security
- ✅ Lernsax Domain-Validierung (@hgr-web.lernsax.de)
- ✅ Firestore Zero-Trust Security Rules
- ✅ Admin-per-Instance Modell (1. Nutzer = Admin)
- ✅ 0 Critical CVE-Vulnerabilities

## ⚙️ Development
- `npm run lint` — Code-Qualität prüfen
- `npm run test:regressions` — Kritische Funktionen testen
- `npm run check` — Full Release Gate (lint + test + build)
- `npm run build` — Production Build für Deployment

---
**Version:** 1.0.0 | **Status:** Ready for Testing
