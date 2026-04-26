# 08 - QA & Release Plan

## 1. Qualitätssicherungs-Strategie (QA)

Die QA-Strategie für Abi-Planer konzentriert sich auf die Kernversprechen: Mandantentrennung, Modularität und Stabilität.

### 1.1 Modul-Integritätstests (Modularity Tests)
Ein kritischer Aspekt der Plattform-Architektur ist die fehlerfreie Entfernbarkeit von Modulen.
*   **Test-Szenario:** Ein Modul (z.B. "Finanzen") wird in der `FeatureRegistry` deaktiviert oder physisch aus dem Code-Pfad entfernt.
*   **Erwartetes Ergebnis:**
    *   Die Anwendung startet ohne Runtime-Errors.
    *   Navigationselemente des Moduls verschwinden automatisch.
    *   Deep-Links zum Modul führen zu einer standardisierten "Feature Not Available" Seite.
    *   Keine verwaisten API-Calls oder Memory Leaks.

### 1.2 Contract Verification (Abwärtskompatibilität)
Um sicherzustellen, dass Änderungen am Kern (Shared Kernel) keine Module brechen:
*   **Stable Interfaces:** Definition von stabilen Interfaces für `UserContext`, `SchoolContext` und `BillingState`.
*   **Contract Tests:** Automatisierte Tests, die prüfen, ob Module die erwarteten Datenstrukturen vom Kern erhalten.
*   **Versionierung:** Interne APIs zwischen Modulen müssen versioniert sein, falls sie über einfache Props hinausgehen.

### 1.3 Multi-Tenant Isolation Tests
*   **Cross-Tenant Access:** Automatisierte Integrationstests versuchen, mit einem Token von `Schule A` auf Dokumente von `Schule B` zuzugreifen.
*   **Security Rules Validation:** Unit-Tests für Firestore Security Rules, die jede Hierarchie-Ebene (`schools`, `year_groups`) isoliert prüfen.

## 2. Release-Strategie (Phased Rollout)

Der Rollout erfolgt in drei Phasen, um Risiken zu minimieren.

### Phase 1: Pilot (Closed Alpha)
*   **Zielgruppe:** Eine ausgewählte Schule (Partnerschule).
*   **Onboarding:** Manuell durch das Entwicklerteam.
*   **Fokus:** UX-Validierung im echten Schulalltag, Identifikation von Edge-Cases im Kalender und in der Finanzplanung.
*   **Monitoring:** Full-Stack Tracing (Sentry/LogRocket) aktiviert.

### Phase 2: Beta (Public Limited)
*   **Zielgruppe:** 10-20 Schulen (First-Come-First-Serve).
*   **Onboarding:** Automatisiert über Stripe-Checkout und Subdomain-Provisionierung.
*   **Fokus:** Validierung des Billing-Flows, Lasttests für die Cloud Functions, Skalierbarkeit der Subdomain-Logik.
*   **Feedback:** Integriertes Feedback-Tool für Beta-Nutzer.

### Phase 3: GA (General Availability)
*   **Zielgruppe:** Alle Schulen.
*   **Onboarding:** Vollständig automatisiertes Self-Service-Portal.
*   **Fokus:** Maximale Stabilität und Performance.
*   **Support:** Etablierte Support-Prozesse und Dokumentation.

## 3. Rollback & Notfallplan

*   **Database Snapshots:** Automatisierte tägliche Backups mit Point-in-Time Recovery (PITR) Unterstützung in Firestore.
*   **Feature Flags:** Neue Features werden hinter Feature-Flags ausgerollt, um sie bei Problemen sofort deaktivieren zu können.
*   **Migration Rollbacks:** Jede Datenbank-Migration muss ein entsprechendes Rollback-Skript besitzen, das vor dem Deployment getestet wurde.
*   **Health Checks:** Automatisierte Überwachung der Cloud Functions und der Frontend-Verfügbarkeit mit sofortiger Alarmierung.
