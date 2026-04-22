# Firestore Schema Referenz

Diese Referenz beschreibt das logische Datenmodell und die wichtigsten Zugriffsregeln.

## Grundsaetze
- Datenbank-ID: `abi-data`
- Security-Enforcement erfolgt in `firestore.rules`
- Indexe werden in `firestore.indexes.json` gepflegt

## Zentrale Collections

### `profiles/{uid}`
Kernfelder:
- `role` (`viewer`, `planner`, `admin`, `admin_main`, `admin_co`)
- `is_approved` (Boolean)
- `planning_groups`, `led_groups`
- `currencies` (inkl. NP)
- `subscription`

Zugriff:
- Lesen fuer authentifizierte Nutzer (laut Rules)
- Selbstaenderungen eingeschraenkt
- Kritische Felder nur mit Admin-/Service-Logik

### `settings/config`
Kernfelder:
- `ball_date`
- `funding_goal`

Zugriff:
- Lesen oeffentlich
- Schreiben fuer Planner

### `settings/features`
Kernfelder:
- globale Feature-Flags

Zugriff:
- Lesen oeffentlich
- Schreiben fuer Planner

### `events`, `todos`, `finances`, `polls`, `tasks`
Zugriff:
- Lesen typischerweise nur fuer authentifizierte/freigegebene Nutzer
- Schreiben fuer Planner/Admin je nach Rule-Abschnitt

### `news`
- Oeffentlich lesbar
- Schreiben fuer Planner
- Interaktionsfelder (z. B. Reactions/View-Tracking) mit speziellen Update-Regeln

### `user_teachers`
- Kritisch fuer Sammelkarten-Inventar
- Direkte User-Manipulation unzulaessig
- Writes nur via Service-Logik/Cloud Functions oder explizite Admin-Pfade

## Wichtige Subcollections
- `profiles/{uid}/unseen_gifts`
- `profiles/{uid}/custom_pack_queue`
- `notifications/{uid}/messages`

## Index-Strategie (Auszug)
Aktive Composite-/Single-Field-Indexe umfassen u. a.:
- `events(event_date)`
- `news(created_at DESC)`
- `todos(status, created_at)`
- `polls(is_active, created_at)`
- `card_trades(members array-contains, status, updatedAt)`
- `matches(playerA_uid|playerB_uid, status, createdAt)`
- `tasks(status, submitted_at)`

## Aenderungsprozess
1. Neue Query entwerfen.
2. Rule-Auswirkung pruefen.
3. Noetigen Index in `firestore.indexes.json` eintragen.
4. Doku aktualisieren.
5. Changelog pflegen.

## Referenzen
- `firestore.rules`
- `firestore.indexes.json`
- `src/types/database.ts`
