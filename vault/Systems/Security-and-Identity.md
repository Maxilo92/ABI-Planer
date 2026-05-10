---
type: note
status: active
tags:
  - systems
  - security
---

# Security und Identity

Dieses Dokument beschreibt, wie wir sicherstellen, dass nur die richtigen Personen Zugriff auf sensible Daten haben.

## Das "is_approved" Gate
Jeder neue Nutzer, der sich registriert, landet zuerst in einem Wartestatus.
- **Logik**: `is_approved` ist standardmäßig `false`.
- **Auswirkung**: Die meisten Firestore-Rules prüfen `request.auth.token.is_approved == true`. Ohne dieses Flag sieht der Nutzer ein leeres Dashboard oder wird zum Onboarding umgeleitet.
- **Freigabe**: Nur Admins können Nutzer freigeben.

## Rollenhierarchie
Wir verwenden ein flaches, aber strenges Rollenmodell in `profiles/{uid}.role`:
1. **Viewer**: Kann Daten lesen (News, Kalender, Finanzen-Übersicht), aber nichts bearbeiten.
2. **Planner**: Kann Termine, Aufgaben und Finanzen verwalten.
3. **Admin**: Voller Zugriff auf Nutzerverwaltung und Systemeinstellungen.
4. **Admin_Main / Admin_Co**: Spezielle administrative Rollen für die Jahrgangsleitung.

## Domain Restriction
- Registrierungen sind auf `@hgr-web.lernsax.de` beschränkt, um sicherzustellen, dass nur Schüler der Schule beitreten können.

## Server-Side Truth
Kritische Aktionen (Booster öffnen, Transaktionen validieren) finden **niemals** im Client statt. Der Client sendet nur den *Wunsch* (Intent), die Cloud Function validiert den Status in der Datenbank und führt die Änderung atomar durch.

## Verwandte Quellen
- [docs/SECURITY_GUIDE.md](../../docs/SECURITY_GUIDE.md)
- [firestore.rules](../../firestore.rules)
