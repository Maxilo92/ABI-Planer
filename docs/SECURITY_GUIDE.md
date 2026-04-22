# Security Guide

Dieses Dokument beschreibt die technischen Sicherheitsprinzipien fuer die Entwicklung im ABI Planer.

## Zero-Trust Prinzip
- Autorisierung wird serverseitig durch `firestore.rules` und `storage.rules` erzwungen.
- Client-seitige Rollenpruefungen sind nur UX, nie Sicherheitsgrenze.

## Auth und Domain Restriction
- Registrierung ist auf `@hgr-web.lernsax.de` beschraenkt.
- Schreib- und Lesezugriffe auf Kernbereiche erfordern authentifizierte und freigegebene Nutzer.

## Rollenmodell
Rollen im Profil:
- `viewer`
- `planner`
- `admin`
- `admin_main`
- `admin_co`

Wichtig:
- Der erste registrierte Nutzer wird initial `admin`.
- Produktiver Zugriff setzt `is_approved: true` voraus.

## Firestore Sicherheitskern
- DB-ID ist immer `abi-data`, nie `(default)`.
- Sensitive Collections sind nicht oeffentlich lesbar.
- Write-Zugriffe werden in Rules und Cloud Functions abgesichert.

## TCG und RNG Integritaet
- Booster-RNG laeuft ausschliesslich serverseitig in `openBooster`.
- Nutzer duerfen `user_teachers` nicht direkt manipulieren.

## NP-Waehrung
- NP wird wie eine transaktionskritische Waehrung behandelt.
- Balance-Updates sind atomar.
- Transaktionen werden nachvollziehbar protokolliert.
- Siehe auch `PHASE1_NP_SETUP.md` fuer die Sicherheitsarchitektur des NP-Systems.

## Security-Aenderungen: Definition of Done
1. Rule-/Function-Aenderung implementiert.
2. Sicherheitsrelevante Doku aktualisiert.
3. Regressionspruefung (`npm run check`) erfolgreich.
4. Changelog-Eintrag mit Security-Kontext vorhanden.
