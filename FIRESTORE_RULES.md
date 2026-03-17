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
    
    function isPlanner() {
      // Planer/Admin Rechte müssen explizit im Profil gesetzt sein
      return isAuthenticated() && (getProfile().role == 'planner' || getProfile().role == 'admin');
    }
    
    function isAdmin() {
      return isAuthenticated() && getProfile().role == 'admin';
    }

    // --- COLLECTION REGELN ---

    // Profile: Jeder Lernsax-Nutzer darf sein eigenes Profil erstellen/sehen.
    // Nur Admins dürfen Rollen (role) ändern.
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      allow create: if isLernsax() && request.auth.uid == userId;
      allow update: if isAdmin() || (
        request.auth.uid == userId && 
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'is_approved'])
      );
      allow delete: if isAdmin();
    }

    // Einstellungen (Datum, Ziel): Öffentlich lesbar, bearbeitbar durch Planer/Admins.
    match /settings/{docId} {
      allow read: if true;
      allow write: if isPlanner();
    }

    // Inhalte (Todos, Events, Finanzen, News, Abstimmungen):
    // Öffentlich lesbar, bearbeitbar durch Planer/Admins.
    match /todos/{id} { allow read: if true; allow write: if isPlanner(); }
    match /events/{id} { allow read: if true; allow write: if isPlanner(); }
    match /finances/{id} { allow read: if true; allow write: if isPlanner(); }
    match /news/{id} { allow read: if true; allow write: if isPlanner(); }
    match /polls/{id} { allow read: if true; allow write: if isPlanner(); }

    // Stimmen für Abstimmungen (Polls): 
    // Jeder mit einer Lernsax-Mail darf abstimmen.
    match /votes/{voteId} {
      allow read: if true;
      allow create: if isLernsax() && request.resource.data.user_id == request.auth.uid;
      allow delete: if isAdmin() || (isAuthenticated() && resource.data.user_id == request.auth.uid);
    }
  }
}
```

## Berechtigungs-Übersicht

| Aktion | Gast | Lernsax-Nutzer | Planer / Admin |
| :--- | :---: | :---: | :---: |
| Dashboard sehen | ✅ | ✅ | ✅ |
| Abstimmen | ❌ | ✅ | ✅ |
| Termine/News erstellen | ❌ | ❌ | ✅ |
| Nutzer befördern | ❌ | ❌ | ✅ (nur Admin) |
| Finanzen verwalten | ❌ | ❌ | ✅ |

**Hinweis:** Die automatische Erkennung als "User" erfolgt über die E-Mail-Domain. Eine manuelle Freischaltung durch den Admin ist für Basisfunktionen (wie Abstimmen) nicht mehr nötig.
