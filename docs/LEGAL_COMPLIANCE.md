# Legal Compliance Checklist (Developer)

Ziel dieses Dokuments ist maximale rechtliche Absicherung bei technischen Aenderungen.

Hinweis:
Dieses Dokument ersetzt keine juristische Beratung. Es ist eine Entwickler-Checkliste.

## Wann muss diese Checkliste verwendet werden?
- Aenderungen an Registrierung, Login, Rollen oder Freigaben
- Aenderungen an personenbezogenen Daten
- Aenderungen an Tracking, Logs oder Audit-Daten
- Aenderungen an Zahlungs-/NP-Flows
- Aenderungen an rechtlichen Seiten (`/legal/*`)

## Pflichtpruefung vor Merge
1. Datenschutzbezug identifiziert (ja/nein).
2. Betroffene Datenkategorien dokumentiert (z. B. Profil, Logs, Zahlungsdaten).
3. Loesch- und Anonymisierungslogik geprueft (z. B. `onProfileDeleted`).
4. Rechtsseiten geprueft:
- `src/app/legal/datenschutz/page.tsx`
- `src/app/legal/agb/page.tsx`
- `src/app/legal/impressum/page.tsx`
5. Falls noetig, Texte auf Rechtsseiten aktualisiert.
6. Changelog aktualisiert.

## Datenschutz- und Aufbewahrungsregeln (technischer Blick)
- Personenbezug nur speichern, wenn fachlich erforderlich.
- Datenminimierung beachten.
- Wo moeglich anonymisieren statt loeschen, falls gesetzliche Aufbewahrungspflichten greifen.
- Kein unkontrolliertes Logging von E-Mail, Klarname, IP oder Zahlungsdetails.

## Trigger fuer juristische Ruecksprache
- Neue Datenkategorie wird eingefuehrt.
- Zweckbindung aendert sich wesentlich.
- Neue Drittanbieter fuer Verarbeitung.
- Aenderung der Einwilligungslogik.
- Zahlungs-/Abo-Logik mit Verbraucherauswirkung.

## Definition of Done bei Compliance-relevanten Changes
1. Technische Aenderung umgesetzt.
2. Diese Checkliste durchlaufen und dokumentiert.
3. Rechtsseiten und Doku synchron.
4. Changelog mit Compliance-Hinweis vorhanden.
