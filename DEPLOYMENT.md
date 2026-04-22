# Deployment Guide

Dieses Dokument beschreibt den verbindlichen Deployment-Workflow fuer den ABI Planer.

## Branch-Strategie (verbindlich)
- Entwicklung erfolgt standardmaessig auf `main`.
- `release` wird nur aktualisiert, wenn es explizit angefordert ist.
- Firebase App Hosting deployt automatisch vom `release` Branch.

## Release-Ablauf
1. Lokale Aenderungen abschliessen und Diff pruefen.
2. Qualitaets-Gate lokal ausfuehren:
- `npm run check`
3. Falls Cloud Functions betroffen sind:
- `cd functions && npm run build`
4. Auf `main` committen und pushen.
5. Nur auf Anweisung: `main` in `release` mergen und `release` pushen.
6. Deployment in Firebase App Hosting verifizieren.

## Vor jedem Deployment pruefen
- `VERSION` ist korrekt.
- `CHANGELOG.md` ist aktualisiert.
- Bei Rule-Aenderungen: `firestore.rules` und/oder `storage.rules` aktualisiert.
- Bei Index-Aenderungen: `firestore.indexes.json` aktualisiert.
- Environment-Variablen sind in App Hosting gesetzt.

## Konflikt- und Push-Regeln
- Keine destruktiven Git-Befehle (`reset --hard`, pauschale Reverts).
- Bei Push-Fehlern: lokale Aenderungen sichern, Remote-Stand holen, Konflikte gezielt aufloesen.
- Keine fremden Aenderungen ueberschreiben.

## Rollback (praxisnah)
1. Letzten stabilen Commit auf `release` identifizieren.
2. Revert-Commit auf `release` erstellen (kein History-Rewrite).
3. Push auf `release` ausfuehren.
4. Deployment-Status und Kernfunktionen pruefen.
5. Changelog-Eintrag fuer den Rollback dokumentieren.

## Wichtige Quellen
- `firebase.json` (Functions predeploy, Firestore DB-ID `abi-data`)
- `package.json` (`check`, `build`, `sync:version`)
- `CLAUDE.md` (Team- und Branch-Konventionen)
- `docs/CI-CD.md` (Pipeline- und Gate-Details)
