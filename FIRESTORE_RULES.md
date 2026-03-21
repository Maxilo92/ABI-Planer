# Firestore Security Rules

Kopiere diese Regeln in die **Firebase Console** unter **Firestore Database > Rules**.

Diese Regeln erlauben Gästen den Lesezugriff auf öffentliche Daten. Jeder Nutzer mit einer **@hgr-web.lernsax.de** E-Mail gilt automatisch als verifizierter Nutzer und darf abstimmen. Nur Admins/Planer dürfen Inhalte erstellen oder Rollen verwalten.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Hilfsfunktionen für Berechtigungen
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isLernsax() {
      // Prüft, ob der Nutzer eine verifizierte Lernsax-Mail nutzt
      return isAuthenticated() && request.auth.token.email.matches('.*@hgr-web\\.lernsax\\.de$');
    }
    
    function getProfile() {
      return get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data;
    }
    
    function isApproved() {
      return isAuthenticated() && getProfile().is_approved == true;
    }

    function isPlanner() {
      // Planer/Admin Rechte müssen explizit im Profil gesetzt sein
      return isAuthenticated() && (
        getProfile().role == 'planner' ||
        getProfile().role == 'admin' ||
        getProfile().role == 'admin_main' ||
        getProfile().role == 'admin_co'
      );
    }
    
    function isAdmin() {
      return isAuthenticated() && (
        getProfile().role == 'admin' ||
        getProfile().role == 'admin_main' ||
        getProfile().role == 'admin_co'
      );
    }

    function isGroupLeader(groupName) {
      return isAuthenticated() && getProfile().planning_group == groupName && getProfile().is_group_leader == true;
    }

    function isMainAdmin() {
      return isAuthenticated() && (
        getProfile().role == 'admin_main' ||
        getProfile().role == 'admin'
      );
    }

    function isCoAdmin() {
      return isAuthenticated() && getProfile().role == 'admin_co';
    }

    // --- COLLECTION REGELN ---

    // Profile: Jeder Lernsax-Nutzer darf sein eigenes Profil erstellen/sehen.
    // Detaillierte Rechte für Admins (Main & Co) und Gruppenleiter.
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      allow create: if isLernsax() && request.auth.uid == userId;
      
      allow update: if (
        // 1. Selbst-Update (keine Rollen/Berechtigungen)
        (request.auth.uid == userId && !isAdmin() &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'is_approved', 'planning_group', 'class_name', 'is_group_leader'])) ||

        // 2. Selbst-Update für Admins (können Kurs/Gruppe selbst ändern)
        (request.auth.uid == userId && isAdmin() &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'is_approved', 'is_group_leader'])) ||
        
        // 3. Main Admin (volle Rechte außer Selbst-Demontage)
        (isMainAdmin() && (
          (request.auth.uid == userId && request.resource.data.role == resource.data.role) || 
          (request.auth.uid != userId)
        )) ||
        
        // 4. Co-Admin (Zuweisungen)
        (isCoAdmin() && request.auth.uid != userId &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['class_name', 'planning_group'])) ||

        // 5. Co-Admin (Allgemein, darf Admins nicht bearbeiten)
        (isCoAdmin() && resource.data.role != 'admin_main' && resource.data.role != 'admin' && request.auth.uid != userId &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'email'])) ||

        // 6. Gruppenleiter (Mitglieder verwalten)
        (isGroupLeader(getProfile().planning_group) && request.auth.uid != userId && (
          (resource.data.planning_group == null && request.resource.data.planning_group == getProfile().planning_group) ||
          (resource.data.planning_group == getProfile().planning_group && request.resource.data.planning_group == null)
        ) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'is_approved', 'is_group_leader', 'email']))
      );
      
      allow delete: if isMainAdmin() && resource.data.role != 'admin_main' && resource.data.role != 'admin';
    }

    // Gruppen-Nachrichten (Intern & Hub):
    // Lesbar für freigeschaltete Nutzer. Erstellen im eigenen Chat / Hub.
    match /group_messages/{id} {
        allow read: if isApproved();
        allow create: if isApproved() && (
          (request.resource.data.type == 'internal' && request.resource.data.group_name == getProfile().planning_group) || 
          (request.resource.data.type == 'hub')
        );
        allow update, delete: if isAdmin() || isGroupLeader(resource.data.group_name) || (isAuthenticated() && resource.data.created_by == request.auth.uid);
    }

    // Einstellungen (Datum, Ziel, Planungsgruppen): Öffentlich lesbar, bearbeitbar durch Planer/Admins.
    match /settings/{docId} {
      allow read: if true;
      allow write: if isPlanner();
    }

    // Inhalte (Todos, Events, Finanzen, News, Abstimmungen):
    // Öffentlich lesbar, bearbeitbar durch Planer/Admins.
    match /todos/{id} { allow read: if true; allow write: if isPlanner(); }
    match /events/{id} { allow read: if true; allow write: if isPlanner(); }
    match /finances/{id} { allow read: if true; allow write: if isPlanner(); }
    
    match /news/{id} { 
      allow read: if true; 
      allow write: if isPlanner(); 
      
      // Bewertung und Kommentar-Zähler
      allow update: if isPlanner() || (isApproved() && (
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['ratings', 'comment_count'])
      ));

      match /comments/{commentId} {
        allow read: if true;
        allow create: if isApproved();
        allow update, delete: if isAdmin() || (isAuthenticated() && resource.data.created_by == request.auth.uid);
      }
    }

    // Eigene Lehrer-Sammlung
    match /user_teachers/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    match /polls/{pollId} {
      allow read: if true;
      allow write: if isPlanner();

      match /options/{optionId} {
        allow read: if true;
        allow write: if isPlanner();
      }

      match /votes/{voteId} {
        allow read: if true;
        allow create: if isAuthenticated() && request.auth.uid == voteId && request.resource.data.user_id == request.auth.uid;
        allow update: if isAuthenticated() && request.auth.uid == voteId && request.resource.data.user_id == request.auth.uid &&
          get(/databases/$(database)/documents/polls/$(pollId)).data.allow_vote_change == true;
        allow delete: if isPlanner() || (isAuthenticated() && resource.data.user_id == request.auth.uid);
      }
    }

    match /feedback/{feedbackId} {
        // Admins sehen alles. Ersteller sieht eigenes. 
        // Andere sehen es nur, wenn es nicht privat ist.
        allow read: if isAdmin() || (isAuthenticated() && resource.data.created_by == request.auth.uid) || (isApproved() && resource.data.is_private == false);
        allow create: if isApproved();
        allow update, delete: if isAdmin();
    }

    // Logs: nur Admins lesen; freigeschaltete Nutzer dürfen nur eigene Aktionen schreiben.
    match /logs/{logId} {
      allow read: if isAdmin();
      allow create: if isApproved()
        && request.resource.data.user_id == request.auth.uid
        && request.resource.data.action is string;
      allow update, delete: if false;
    }
  }
}
```

## Berechtigungs-Übersicht

| Aktion | Gast | Lernsax-Nutzer | Planer / Admin |
| :--- | :---: | :---: | :---: |
| Dashboard sehen | ✅ | ✅ | ✅ |
| Abstimmen | ❌ | ✅ | ✅ |
| Chatten (Hub / Intern) | ❌ | ✅ | ✅ |
| Termine/News erstellen | ❌ | ❌ | ✅ |
| Nutzer befördern | ❌ | ❌ | ✅ (nur Admin) |
| Finanzen verwalten | ❌ | ❌ | ✅ |
| Gruppen leiten | ❌ | ❌ | ✅ (Admins / Leiter) |

**Hinweis:** Die automatische Erkennung als "User" erfolgt über die E-Mail-Domain. Eine manuelle Freischaltung durch den Admin ist für Basisfunktionen (wie Abstimmen) nicht mehr nötig.
