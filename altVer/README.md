# Abi-Planer

Dieses Repository verwendet eine Monorepo-Struktur, um Frontend, Backend und Dokumentation sauber zu trennen.

## Projekt-Struktur

- **`apps/`**: Enthält die ausführbaren Anwendungen.
  - **`apps/web/`**: Die React (Vite) Frontend-Anwendung.
- **`packages/`**: Wiederverwendbare Bibliotheken und Konfigurationen (geplant).
- **`docs/`**: Projekt-Dokumentation.
  - **`docs/specs/`**: Technische Spezifikationen und Masterplan.
  - **`docs/maestro/`**: Orchestrierungs-Zustand des Maestro-Agenten.

## Entwicklung

### Voraussetzungen
- Node.js (v18+)
- npm (v7+)

### Befehle
- `npm install`: Installiert alle Abhängigkeiten für alle Workspaces.
- `npm run dev`: Startet die Web-App im Entwicklungsmodus.
- `npm run build`: Baut die Web-App für die Produktion.
- `npm run lint`: Führt Linting-Prüfungen durch.

## Versionierung
Das Projekt folgt einem vierstufigen Versionierungs-Schema (`X.X.X.X`). Details dazu finden sich im `GEMINI.md`.
 Jede Änderung muss im `CHANGELOG.md` dokumentiert und die Version in der Datei `VERSION` inkrementiert werden.
