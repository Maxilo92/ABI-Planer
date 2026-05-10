---
type: note
status: active
tags:
  - feature
  - operations
---

# Wartungsmodus (Maintenance Mode)

Der Wartungsmodus ermöglicht es Administratoren, geplante Wartungsarbeiten durchzuführen, während die Nutzer über einen Countdown und eine dedizierte Informationsseite informiert werden.

## Funktionen
- **Planung**: Admins können Wartungsfenster im Voraus planen.
- **Echtzeit-Countdown**: Ein Banner informiert Nutzer systemweit über die verbleibende Zeit bis zum Beginn der Wartung.
- **Lockout**: Während der Wartung werden alle Nicht-Admin-Nutzer automatisch auf die Seite `/maintenance` umgeleitet.
- **News-Feed**: Die Wartungsseite enthält einen News-Feed, um über den Fortschritt oder den Grund der Wartung zu informieren.
- **Admin-Zugriff**: Administratoren behalten während der Wartung vollen Zugriff auf das Dashboard, um Änderungen zu testen oder Vorbereitungen zu treffen.

## Technische Umsetzung
- Gesteuert über Firestore-Flags.
- Middleware- oder App-Level-Redirect Logik prüft den Status und die Nutzerrolle.
- Real-time Updates sorgen dafür, dass Nutzer sofort nach Ende der Wartung wieder Zugriff haben.
