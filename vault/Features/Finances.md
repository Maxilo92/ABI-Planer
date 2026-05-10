---
type: note
status: active
tags:
  - feature
  - finances
---

# Finanzen

Das Finanzmodul ist das Herzstück der Budgetplanung für den Abiturjahrgang. Es ermöglicht die Erfassung von Einnahmen, Ausgaben und die Prognose der Endsumme.

## Kernfunktionen
- **Budget-Übersicht**: Visualisierung der Gesamteinnahmen vs. Gesamtausgaben.
- **Transaktionsliste**: Detaillierte Erfassung jeder Buchung mit Kategorie, Betrag und Status.
- **Finanzprognosen**: Dynamische Berechnung, ob das Sparziel für Abiball/Abizeitung erreicht wird.
- **Sponsoring-Tracking**: Verwaltung von Sponsorenverträgen und Zahlungseingängen.

## Innere Mechanik (Technical Depth)
- **Datenmodell**: Gespeichert in der Collection `finances`.
- **Berechnungen**: Die Aggregation der Summen erfolgt aktuell clientseitig im Dashboard, kritische Validierungen (z.B. NP-Währung für TCG) erfolgen serverseitig in Cloud Functions.
- **Rollen**: Nur Nutzer mit der Rolle `planner` oder `admin` haben Schreibzugriff auf Finanzdaten. `viewer` können die Übersicht sehen, aber nichts ändern.

## UX & Design
- Verwendung von klaren Hierarchien (keine Kachel-Wüste).
- Status-Indikatoren für "Bezahlt", "Ausstehend" und "Überfällig".
- Fokus auf Lesbarkeit bei langen Tabellen.

## Verwandte Quellen
- [docs/FIRESTORE_SCHEMA.md](../../docs/FIRESTORE_SCHEMA.md)
- [[Systems/Data-and-Rules]]
