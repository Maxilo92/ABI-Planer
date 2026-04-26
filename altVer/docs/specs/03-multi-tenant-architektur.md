# Abi-Planer Multi-Tenant Architektur

## 1. Datenmodell (Hierarchisches Firestore Schema)
Die Isolation der Mandanten (Schulen) erfolgt über eine strikte hierarchische Struktur in Firestore. Dies ermöglicht einfache Sicherheitsregeln und eine klare Trennung der Daten.

### 1.1 Struktur
```typescript
/schools/{schoolId}                  // Schul-Metadaten, Subscription, School Admins
    /cohorts/{cohortId}              // Jahrgangs-Metadaten (z.B. "Abi 2027")
        /finances/{transactionId}    // Finanz-Transaktionen
        /calendar/{eventId}          // Kalender-Events
        /todos/{todoId}              // Aufgaben
        /members/{userId}            // Kohorten-Mitglieder (Year Admin, Planer, Viewer)
```

### 1.2 School Document (`/schools/{schoolId}`)
```typescript
interface School {
  id: string;
  name: string;
  subdomain: string;                 // Eindeutig, z.B. "hgr"
  domainVerified: boolean;
  admins: string[];                  // UIDs der School Admins (meist Lehrer)
  subscription: {
    tier: 'free' | 'pro';
    status: 'active' | 'past_due' | 'canceled';
    stripeCustomerId: string;
    expiresAt: Timestamp;
  };
  createdAt: Timestamp;
}
```

### 1.3 Cohort Document (`/schools/{schoolId}/cohorts/{cohortId}`)
```typescript
interface Cohort {
  id: string;
  schoolId: string;
  name: string;                      // z.B. "Abi 2026"
  status: 'active' | 'read_only';    // Phase 1-6 vs Phase 7
  graduationDate: Timestamp;
  archivedAt?: Timestamp;
  settings: {
    modules: string[];               // Aktivierte Module laut Registry
  };
}

interface Member {
  uid: string;
  role: 'year_admin' | 'planer' | 'viewer';
  isPrimaryAdmin?: boolean;          // Nur für den ersten Year Admin (unentfernbar)
  joinedAt: Timestamp;
}
```

## 2. Subdomain-Auflösung
Die Anwendung nutzt dynamische Subdomains zur Identifizierung des Mandanten.

### 2.1 Middleware-Logik (Vercel Edge)
1. Extraktion der Subdomain aus dem Hostname (z.B. `hgr.abi-planer.io` -> `hgr`).
2. Validierung der Subdomain gegen die `schools` Collection (Cache in Edge Config oder Redis).
3. Rewrite der Anfrage auf den internen Tenant-Pfad: `/_sites/[site]/...`.
4. Falls Subdomain unbekannt: Redirect auf die Landingpage (`www.abi-planer.io`).

## 3. Modulare Architektur (Registry-Driven)
Um die Wartbarkeit zu erhöhen, ist das System in strikt entkoppelte Domänen-Module unterteilt.

### 3.1 Feature Registry
Eine zentrale Registry definiert die verfügbaren Module und deren Abhängigkeiten.
```typescript
const FeatureRegistry = {
  finances: {
    id: 'finances',
    label: 'Finanzen',
    minTier: 'free',
    path: '/modules/finances',
  },
  calendar: {
    id: 'calendar',
    label: 'Kalender',
    minTier: 'pro',
    path: '/modules/calendar',
  },
  // ...
};
```

### 3.2 Modul-Grenzen
- **Keine direkten Cross-Module Imports**: Module kommunizieren nur über definierte Interfaces oder Shared Kernel (z.B. `types/shared`).
- **Standardisierter Lifecycle**: Jedes Modul muss Methoden für `Deactivate`, `Readonly` und `Cleanup` (Löschung) implementieren.

## 4. Onboarding & Provisionierung
Der automatisierte Onboarding-Workflow wird durch Cloud Functions gesteuert:
1. **Trigger**: Erfolgreicher Stripe-Checkout (`checkout.session.completed`).
2. **Action**: Erstellung des `School` Dokuments.
3. **Action**: Reservierung der Subdomain.
4. **Action**: Versand der Verifizierungs-E-Mail an den Admin.
5. **Action**: Initialisierung des ersten `YearGroup` Dokuments nach Verifizierung.

## 5. Sicherheit (Firestore Rules)
Sicherheitsregeln erzwingen die Isolation auf Pfad-Ebene und validieren Rollen:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /schools/{schoolId} {
      // Zugriff auf Schul-Dokument (Read: Mitglieder & Admins, Write: Nur Cloud Functions)
      allow read: if request.auth != null && (isSchoolAdmin(schoolId) || isMemberOfAnyCohort(schoolId));
      
      match /cohorts/{cohortId}/{document=**} {
        // Lesezugriff für alle Mitglieder des Jahrgangs
        allow read: if request.auth != null && isMemberOfCohort(schoolId, cohortId);
        
        // Schreibzugriff:
        // 1. Year Admin hat volle Rechte im aktiven Status
        // 2. Planer hat Schreibrechte in Modulen (finances, calendar, todos)
        // 3. Niemand schreibt im Read-Only Status (Phase 7)
        allow write: if request.auth != null 
          && !isReadOnly(schoolId, cohortId)
          && (isYearAdmin(schoolId, cohortId) || (isPlaner(schoolId, cohortId) && isModulePath(request.path)));
      }
    }
  }
}
```
 }
    }
  }
}
```
