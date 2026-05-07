---
type: note
status: active
tags:
  - feature
  - calendar
---

# Kalender und Events

Dieses Modul koordiniert alle Termine des Jahrgangs, von Versammlungen bis zum Abiball.

## Kernfunktionen
- **Terminübersicht**: Monatliche und listenbasierte Ansicht aller Events.
- **Event-Details**: Ort, Zeit, Beschreibung und Verantwortliche.
- **ICS-Export**: Generierung von Kalender-Dateien für die Integration in private Kalender (Google, Apple, etc.).
- **Anwesenheitsliste**: (Optional) Tracking, wer an einem Event teilnimmt.

## Innere Mechanik (Technical Depth)
- **Datenmodell**: Collection `events`.
- **Denormalisierung**: Event-Ersteller werden denormalisiert gespeichert, um zusätzliche Reads zu vermeiden (`scripts/denormalize-event-creators.js`).
- **Push-Notifications**: Bei Erstellung eines neuen Events wird automatisch eine Benachrichtigung via `onEventCreatedPush` (Cloud Functions) versendet.

## UX & Design
- Mobile-First Darstellung der Terminliste.
- Deutliche Hervorhebung des nächsten anstehenden Termins ("Coming Up Next").

## Verwandte Quellen
- [docs/PUSH_NOTIFICATIONS_SETUP.md](../../docs/PUSH_NOTIFICATIONS_SETUP.md)
- [[Systems/Functions-and-Async-Jobs]]
