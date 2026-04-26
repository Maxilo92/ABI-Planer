# Abi-Planer Produkt-Spezifikation

## 1. Abonnement-Modelle (Tiers)
Abi-Planer wird als gestaffeltes SaaS-Modell angeboten. Abonnements werden auf Schulebene abgeschlossen.

### 1.1 Free Tier
- **Zielgruppe**: Kleine Jahrgänge oder Schulen in der Testphase.
- **Features**: Nur Modul "Finanzen".
- **Limits**: Max. 1 aktive Kohorte (Jahrgang).
- **Kosten**: Kostenlos.
- **Subdomain**: Inklusive (`schule.abi-planer.io`).

### 1.2 Pro Tier
- **Zielgruppe**: Standard-Abiturjahrgänge mit vollem Organisationsbedarf.
- **Features**: Alle Module (Finanzen, Kalender, Todos).
- **Limits**: Max. 3 aktive Kohorten gleichzeitig. Eine 4. Kohorte kann erst erstellt werden, wenn eine aktive archiviert oder gelöscht wurde.
- **Kosten**: Monatlich, Jährlich oder Prepaid (1-5 Jahre).
- **Support**: Priorisierter E-Mail-Support.

## 2. Abrechnung & Upgrades
- **Stripe-Integration**: Alle Zahlungen werden über Stripe abgewickelt.
- **Upgrades**: Ein Wechsel von Free zu Pro ist jederzeit ohne Datenverlust möglich.
- **90-Tage Geld-zurück-Garantie**: Kunden können innerhalb der ersten 90 Tage nach Abschluss eines Pro-Abos eine volle Rückerstattung verlangen.

## 3. Daten-Lifecycle & Retention (Phase 7 & 8)
Um die DSGVO-Konformität und Systemhygiene zu gewährleisten, gilt ein strikter Lebenszyklus für Jahrgangs-Daten.

### 3.1 Read-Only Status (Phase 7)
Sobald ein Jahrgang sein Abschlussdatum erreicht hat oder das Abonnement endet, tritt er in den **Read-Only Status** ein.
- **Dauer**: 12 Monate.
- **Einschränkungen**: Daten können eingesehen und exportiert, aber nicht mehr verändert werden.
- **Benachrichtigungen**: Das System sendet automatisierte Erinnerungen per E-Mail an alle Schul-Admins:
    - 90 Tage vor Löschung.
    - 30 Tage vor Löschung.
    - 7 Tage vor Löschung.

### 3.2 Automatisierte Löschung (Phase 8)
Nach Ablauf der 12-monatigen Read-Only Frist werden alle Daten des Jahrgangs unwiderruflich aus der Datenbank und dem Storage gelöscht.

## 4. Onboarding-Prozess
Der Onboarding-Prozess ist vollautomatisiert (Self-Service) und richtet sich an den **School Admin** (meist ein verantwortlicher Lehrer):
1. **Registrierung**: School Admin erstellt Account.
2. **Schul-Profil**: Angabe von Schulname, Standort und gewünschter Subdomain.
3. **Domain-Verifizierung**: Nachweis der Zugehörigkeit zur Schule (z.B. via offizieller E-Mail-Adresse).
4. **Subscription**: Auswahl des Tiers und Stripe-Checkout (Zahlungsverantwortung liegt beim School Admin).
5. **Provisionierung**: Automatische Erstellung der Firestore-Strukturen.
6. **Jahrgangs-Setup**: Der School Admin erstellt den ersten Jahrgang und lädt die ersten Schüler als **Year Group Admins** ein.

## 5. Modulare Feature-Gating
Die Verfügbarkeit von Features wird über eine zentrale Registry gesteuert:
- `isModuleEnabled(schoolId, moduleId)`: Prüft Tier-Zugehörigkeit.
- `isReadOnly(cohortId)`: Prüft Lifecycle-Status.
- UI-Komponenten reagieren deklarativ auf diese Flags (z.B. Ausblenden von "Add"-Buttons im Read-Only Modus).
