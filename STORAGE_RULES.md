# Storage Security Rules

Diese Regeln gelten für Firebase Storage und steuern den Upload für News-Bilder.

## Wichtiger Hinweis

Die Datei STORAGE_RULES.md ist nur Dokumentation.
In den Firebase Rules Editor darf nur der Inhalt aus storage.rules eingefuegt werden, nicht diese Markdown-Datei.

## Bucket

Verwende in der App folgenden Bucket:

- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="abi-planer-75319.firebasestorage.app"`

## Aktuelle Storage-Regeln

Datei: `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /news-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    match /{allPaths=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

## Bedeutung

- Lesen: News-Bilder sind öffentlich sichtbar.
- Schreiben: Nur eingeloggte Nutzer duerfen hochladen.
- Dateigröße: Maximal 5 MB.
- Dateityp: Nur Bilder (`image/*`).
- Alles ausserhalb von `news-images/...` ist gesperrt.

## Deploy

Storage-Regeln deployen:

```bash
firebase deploy --only storage
```

Falls auch Firestore-Regeln mit deployed werden sollen:

```bash
firebase deploy --only firestore,storage
```

## Kurztest

1. Eingeloggt ein Bild unter 5 MB hochladen -> muss funktionieren.
2. Ein Bild über 5 MB hochladen -> muss abgelehnt werden.
3. Nicht eingeloggt hochladen -> muss abgelehnt werden.
