# CI/CD und Qualitaets-Gates

Dieses Dokument beschreibt die verbindlichen Qualitaets-Gates vor Merge und Deployment.

## Lokale Pflichtpruefung
Vor jedem Merge/Release:
1. `npm run check`

Enthaelt:
- `npm run test:regressions`
- `npx tsc --noEmit`
- `npm run build`

## Wichtige Details
- Lint ist als separater Befehl verfuegbar: `npm run lint`.
- In diesem Repo ist `npm run typecheck` nicht definiert.
- `npm run build` fuehrt `prebuild` aus und synchronisiert Versionen ueber `sync:version`.

## Cloud Functions in der Pipeline
- Functions sind ein separates Package unter `functions/`.
- Build lokal bei Functions-Aenderungen:
- `cd functions && npm run build`
- Beim Firebase Deploy wird der Functions-Build laut `firebase.json` als `predeploy` ausgefuehrt.

## Merge/Release-Empfehlung
1. Feature fertigstellen.
2. `npm run check` erfolgreich.
3. Falls noetig `cd functions && npm run build` erfolgreich.
4. Changelog und Version aktualisieren.
5. Merge/Push nach `main`.
6. Nur auf Anweisung: Promotion nach `release` fuer Live-Deployment.

## Failure-Mode Hinweise
- TypeScript-Fehler: zuerst Typen in `src/types/*` gegen Firestore-Felder abgleichen.
- Build-Fehler mit alten Artefakten: `npm run build:clean` verwenden.
- Functions-Fehler: Build in `functions/` isoliert pruefen.
