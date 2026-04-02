# ABI Planer v1.2.12

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

## 📚 Dokumentation
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
**Version:** 1.2.12 | **Status:** Active Development
