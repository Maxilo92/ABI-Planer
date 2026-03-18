# ABI Planer 2027

Zentrale Plattform für die Planung des Abiturs.

## Features
- Dashboard mit Countdown & Finanzstatus
- Nutzerverwaltung (Admin/Planer/User)
- Kalender, Aufgaben, Finanzen, News & Umfragen

## Deployment
Die App wird über **Firebase App Hosting** bereitgestellt.

## Quality Checks
- `npm run test:regressions` prueft kritische UI-Guards (Login/Register-Backlink, Dashboard-News-Detail-Link, Countdown-Theme-Marker).
- `npm run check` fuehrt Regression-Guard + Typecheck + Production Build aus.

## Dokumentation
- [Projekt-Wissen & Architektur](./PROJECT_KNOWLEDGE.md) - Zentrale technische Übersicht
- [Sicherheitsregeln](./FIRESTORE_RULES.md) - Details zu Datenbank-Berechtigungen
- [Installation & Setup](./INSTALL.md) - Schritt-für-Schritt Anleitung für den Release

---
*Deployment Trigger 0.6.9*
