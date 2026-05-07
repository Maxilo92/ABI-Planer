---
type: note
status: active
tags:
  - feature
  - communication
---

# News und Kommunikation

Zentrale Anlaufstelle für Ankündigungen und den Austausch innerhalb des Jahrgangs.

## Kernfunktionen
- **News-Feed**: Chronologische Liste von Ankündigungen mit Bildern und Formatierung.
- **Reaktionen**: Nutzer können auf News mit Emojis reagieren (Interaktionstoken).
- **Kommentare**: Diskussionen unterhalb von Ankündigungen.
- **Push-Integration**: Sofortige Benachrichtigung bei wichtigen Updates.

## Innere Mechanik (Technical Depth)
- **Datenmodell**: Collection `news`.
- **Performance**: Bilder werden über Firebase Storage geladen und via CDN (Firebase Hosting) optimiert.
- **Security**: News sind oft öffentlich lesbar (für die Landingpage), aber Kommentare und Reaktionen erfordern einen verifizierten Account (`is_approved: true`).

## UX & Design
- News-Karten mit Fokus auf das Titelbild.
- Verwendung von Skeletons beim Laden des Feeds zur Vermeidung von Layout-Shifts.

## Verwandte Quellen
- [firestore.rules](../../firestore.rules)
- [[Design/UI-Guidelines]]
