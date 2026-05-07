---
type: note
status: active
tags:
  - feature
  - tcg
---

# TCG (Sammelkarten) System

Das Trading Card Game (TCG) ist ein Kern-Gamification-Element des ABI Planers. Es ermöglicht Schülern, Karten von Lehrern zu sammeln, zu tauschen und Booster zu öffnen.

## Seltenheitsstufen (Rarity)
- **Common / Selten / Episch / Legendär**: Standard-Hierarchie.
- **Iconic (Ikonen)**: Die höchste Stufe über Legendär.
    - **Design**: Schwarz/Goldene Krone, spezielles Holo-Finish.
    - **Modell**: Rein administratives Modell. Das ursprüngliche Voting-System wurde entfernt.

## Mechaniken
- **Booster**: Öffnen erfolgt ausschließlich serverseitig via Cloud Functions (`openBooster`), um Manipulation zu verhindern.
- **Booster-Overflow**: Logik im `useUserTeachers` Hook stellt sicher, dass Belohnungen korrekt verarbeitet werden.
- **Reward-System**: `GiftNoticeBanner` ist global in die `AppShell.tsx` integriert. Benachrichtigungen über Geschenke und Empfehlungen (Referrals) sind auf jeder Seite sichtbar.
- **Sammelkarten-Album**: Zentrale Übersicht der eigenen Sammlung mit Filterfunktionen.

## Management (Admin/Planer)
- **Lehrer-Management**: Unterstützung für CSV-Bulk-Import (Merge/Overwrite).
- **ID-Stabilisierung**: Vergabe von stabilen Slugs basierend auf Namen zur Vermeidung von Dubletten.
- **Export**: PDF-Export-Funktion für physische Karten (Holo-Differenzierung, Spiegelungskorrekturen).

## UI/UX Patterns
- **TCG Dashboard**: Eigener Bereich mit News-Bannern für Season-Ankündigungen.
- **Visuals**: Verwendung von atmosphärischen Texturen und Tiefeneffekten (siehe [[Design/Visual-Principles]]).
- **Mobile Optimierung**: Symmetrische Karten-Darstellung und optimierte Lade-Skeletons.
