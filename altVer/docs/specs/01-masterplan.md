# Abi-Planer Masterplan

## 1. Vision & Zielsetzung
Abi-Planer transformiert die bestehende monolithische Anwendung in eine skalierbare, multi-tenant SaaS-Plattform. Der Fokus liegt auf der Kernfunktionalität der Abitur-Organisation (Finanzen, Kalender, Aufgaben) unter Ausschluss von Gamification-Elementen (TCG/Shop).

### Kernziele
- **Multi-Tenancy**: Jede Schule erhält eine isolierte Instanz unter einer eigenen Subdomain.
- **Self-Service**: Automatisierter Onboarding-Prozess inklusive Stripe-Integration.
- **Modularität**: Strikt getrennte Domänen-Module für einfache Wartbarkeit und Erweiterbarkeit.
- **Compliance**: DSGVO-konforme Datenhaltung und automatisierte Löschzyklen.

## 2. Projekt-Phasen (Produkt-Lifecycle 0-8)
Der Lebenszyklus einer Schule und ihrer Jahrgänge ist in neun Phasen unterteilt:

| Phase | Bezeichnung | Beschreibung | Status |
|-------|-------------|--------------|--------|
| **0** | **Onboarding** | Registrierung der Schule, Domain-Verifizierung, Stripe-Checkout. | Initial |
| **1** | **Setup** | Erstellung des ersten Jahrgangs, Rollenzuweisung. | Aktiv |
| **2** | **Planung I** | Frühe Planungsphase (z.B. Q1/Q2), Budgetierung. | Aktiv |
| **3** | **Planung II** | Intensive Planungsphase (z.B. Q3/Q4), Event-Management. | Aktiv |
| **4** | **Execution** | Heiße Phase der Organisation, Ticket-Verkauf, Deadline-Management. | Aktiv |
| **5** | **Abschluss** | Durchführung des Abiballs/Events, Finalisierung der Finanzen. | Aktiv |
| **6** | **Übergabe** | Vorbereitung der Archivierung, Export von Daten. | Aktiv |
| **7** | **Retention** | 12-monatige Read-Only Periode nach Ablauf/Archivierung. | Read-Only |
| **8** | **Purge** | Endgültige, automatisierte Löschung der Jahrgangs-Daten. | Gelöscht |

## 3. Scope & Modul-Grenzen
Das System ist in unabhängige Module unterteilt, die über eine zentrale **Feature-Registry** gesteuert werden.

### Enthaltene Module (MVP)
- **Identity & Access**: Multi-Tenant Auth, 4-stufiges Rollenmanagement:
    - **School Admin** (Lehrer): Erstellt Schule/Jahrgänge, verwaltet Stripe-Zahlungen.
    - **Year Group Admin** (Schüler): Verwaltet den Jahrgang (Mitglieder, Einstellungen). Der erste Year Admin (Primary Admin) kann seine Rolle nicht verlieren.
    - **Planer**: Voller Schreibzugriff auf Planungs-Module (Finanzen, Kalender, Todos).
    - **Viewer**: Lesezugriff auf die meisten Inhalte des Jahrgangs, keine Editier-Rechte.
- **Finanzen**: Budgetplanung, Einnahmen/Ausgaben, Transaktions-Tracking.
- **Kalender**: Terminverwaltung, Fristen, Event-Planung.
- **Todos**: Aufgabenlisten, Zuweisungen, Status-Tracking.
- **Billing**: Stripe-Integration, Abonnement-Verwaltung.

### Explizit ausgeschlossen
- Sammelkarten-System (TCG)
- Shop-System & Merchandising
- Gamification-Features

## 4. Rollout-Strategie
1. **Phase A (Pilot)**: Testlauf mit einer ausgewählten Schule (Legacy-Migration).
2. **Phase B (Beta)**: Öffnung für 5-10 Schulen mit manuellem Onboarding-Support.
3. **Phase C (GA)**: General Availability mit vollautomatisiertem Self-Service.

## 5. Risikomanagement
- **Stripe-Komplexität**: Risiko von Fehlern bei Abonnements. *Mitigation: Idempotente Webhook-Verarbeitung.*
- **Daten-Isolation**: Risiko von Cross-Tenant Zugriffen. *Mitigation: Hierarchische Firestore-Rules (Deny-by-Default).*
- **Subdomain-Routing**: Komplexität bei dynamischen SSL-Zertifikaten. *Mitigation: Vercel Edge Middleware & Plattform-Features.*

## 6. Erfolgskriterien
- Erfolgreiche Bereitstellung einer neuen Schul-Instanz in < 5 Minuten.
- Null-Fehlertoleranz bei der Trennung von Schuldaten.
- Automatisierte Einhaltung der 12-monatigen Löschfrist.
