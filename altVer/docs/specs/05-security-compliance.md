# Abi-Planer Security & Compliance

## 1. Mandantentrennung (Tenant Isolation)
Die Sicherheit der Daten basiert auf einem "Deny-by-Default" Prinzip. Zugriff wird nur explizit gewährt, wenn die Identität und die Mandantenzugehörigkeit verifiziert sind.

### 1.1 Firestore Security Rules
Die Regeln erzwingen die Isolation auf Pfad-Ebene und validieren Rollen innerhalb des Mandanten.

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Hilfsfunktionen für granulare Prüfung
    function isAuthenticated() { return request.auth != null; }
    function isSchoolAdmin(schoolId) {
      return get(/databases/$(database)/documents/schools/$(schoolId)).data.admins.hasAny([request.auth.uid]);
    }
    function getMemberRole(schoolId, cohortId) {
      return get(/databases/$(database)/documents/schools/$(schoolId)/cohorts/$(cohortId)/members/$(request.auth.uid)).data.role;
    }

    // Standardmäßig alles verbieten
    match /{document=**} {
      allow read, write: if false;
    }

    // Schul-Dokumente
    match /schools/{schoolId} {
      allow read: if isAuthenticated() && (isSchoolAdmin(schoolId) || isMemberOfAnyCohort(schoolId));
      allow write: if false; // Nur via Cloud Functions
      
      // Jahrgangs-Daten
      match /cohorts/{cohortId}/{document=**} {
        allow read: if isAuthenticated() && exists(/databases/$(database)/documents/schools/$(schoolId)/cohorts/$(cohortId)/members/$(request.auth.uid));
        
        // Schreibzugriff:
        // - Year Admin darf alles (außer im Read-Only Status)
        // - Planer darf Modul-Daten schreiben (außer im Read-Only Status)
        allow write: if isAuthenticated() 
          && !isReadOnly(schoolId, cohortId)
          && (getMemberRole(schoolId, cohortId) == 'year_admin' 
              || (getMemberRole(schoolId, cohortId) == 'planer' && isModulePath(request.path)));
      }
    }
  }
}
```

## 2. DSGVO & Audit Logging
Um die Anforderungen der DSGVO zu erfüllen, protokolliert das System alle sicherheitsrelevanten Aktionen und Datenzugriffe.

### 2.1 Audit Log Struktur
Jeder Mandant verfügt über eine interne Audit-Log Collection, die für Schul-Admins einsehbar ist.
- **Pfad**: `/schools/{schoolId}/auditLogs/{logId}`
- **Inhalt**:
    - `timestamp`: Zeitpunkt der Aktion.
    - `userId`: Wer hat die Aktion ausgeführt.
    - `action`: Typ der Aktion (z.B. `DATA_EXPORT`, `MEMBER_REMOVED`, `FINANCE_DELETE`).
    - `resource`: Betroffenes Dokument/Modul.
    - `ipAddress`: (Anonymisiert) Herkunft der Anfrage.

### 2.2 Datenlöschung & Export
- **Automatisierter Export**: Nutzer können jederzeit einen vollständigen Export ihrer Daten (JSON/CSV) anfordern.
- **Recht auf Vergessenwerden**: Bei Löschung eines Accounts oder Ablauf der 12-monatigen Retention-Frist (Phase 8) werden alle personenbezogenen Daten unwiderruflich gelöscht. Backups werden nach maximal 30 Tagen überschrieben.

## 3. Rechtliche Anforderungen (Legal Pages)
Jede Instanz (Subdomain) verweist auf die zentralen rechtlichen Dokumente, die jedoch mandantenspezifische Platzhalter unterstützen.

### 3.1 Erforderliche Dokumente
1. **Impressum**: Zentrales Impressum des Betreibers, ergänzt um die spezifische Schule (optional).
2. **Datenschutzerklärung**: Detaillierte Auflistung der Datenverarbeitung (Stripe, Firebase, Vercel).
3. **AVV (Auftragsverarbeitungsvertrag)**: Muss beim Onboarding vom Schul-Admin digital unterzeichnet werden (Checkbox-Verfahren mit Protokollierung).
4. **Nutzungsbedingungen (AGB)**: Definition der Service-Levels und der 90-Tage Garantie.

## 4. Infrastruktur-Sicherheit
- **Verschlüsselung**: Daten sind "at rest" (Firestore/Storage) und "in transit" (TLS 1.3 via Vercel) verschlüsselt.
- **Secrets Management**: API-Keys (Stripe, Firebase Admin) werden sicher über Vercel Environment Variables und Google Cloud Secret Manager verwaltet.
- **DDoS-Schutz**: Durch die Nutzung von Vercel Edge und Firebase Hosting ist ein nativer Schutz gegen volumetrische Angriffe gegeben.
