---
type: note
status: active
tags:
  - feature
  - admin
---

# Lehrer-Management (Admin)

Das Lehrer-Management-System wurde für v1.0.51 grundlegend überarbeitet, um eine robuste Verwaltung des Lehrer-Pools für das TCG zu gewährleisten.

## Kernfunktionen
- **CSV Bulk Import**: Ermöglicht den Import großer Mengen an Lehrerdaten.
    - **Merge Mode**: Aktualisiert bestehende Lehrer basierend auf dem Slug.
    - **Overwrite Mode**: Ersetzt den bestehenden Pool.
- **ID-Stabilisierung**: Lehrer erhalten automatisch generierte Slugs (z.B. `nachname-vorname`), die als stabile IDs in Firestore dienen. Dies verhindert Dubletten bei wiederholten Importen.
- **Rarity Synchronisation**: Änderungen an der Seltenheit eines Lehrers werden atomar über die Sammlungen hinweg synchronisiert.
- **Cleanup Tool**: Ein manueller Cleanup-Button im Admin-Bereich ermöglicht das Entfernen von verwaisten oder fehlerhaften Datensätzen.

## Technische Details
- Die Logik für den Import befindet sich in `scripts/import_teachers.js` und den entsprechenden Cloud Functions.
- Verwendet atomare Transaktionen für Metadaten-Updates.
