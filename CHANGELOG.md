# Changelog

## [0.15.0] - 2026-03-18
- Feature: **Profil-Detailseite** (`/profil/[id]`) implementiert, um Profile anderer Nutzer einzusehen.
- Feature: Autor-Verlinkung in der News-Detailansicht hinzugefügt.
- UX: News-Detailansicht optisch überarbeitet (bessere Abstände, stärkere Typografie gemäß Feedback).
- Logic: View-Tracking verbessert: Nur noch ein View pro Nutzer/Konto möglich (Statistik-Schutz).
- Refactor: `NewsEntry` Datenmodell um `viewed_by` erweitert.

## [0.14.0] - 2026-03-18
- Fix: Firestore-Verbindungsfehler behoben ("Database '(default)' not found"). Die explizite Datenbank-ID `abi-data` wurde wiederhergestellt.

## [0.14.3] - 2026-03-18
- Fix: TypeScript Build-Fehler behoben (Type 'null' is not assignable to type 'Firestore').

## [0.14.2] - 2026-03-18
- Fix: Stabilität der Authentifizierung verbessert (Hängenbleiben bei "Verifiziere Anmeldung..." behoben).
- Fix: Fehlerbehandlung beim Laden des Nutzerprofils hinzugefügt (Try-Catch-Finally).
- Refactor: Robusterer Firebase-Initialisierungsprozess bei fehlender Konfiguration.

## [0.14.1] - 2026-03-18
- Refactor: Vollständige Migration aller verbleibenden `asChild` Props auf die `render`-Prop in allen Modal-Komponenten (`AddEvent`, `EditEvent`, `AddFinance`, `EditFinance`) zur Behebung von Firebase Build-Fehlern.

## [0.14.0] - 2026-03-18
- Feature: Vollständige Edit- und Delete-Funktionalität für alle Planungsmodule (**News, Todos, Kalender, Finanzen**).
- Feature: **News-Detailansicht** mit View-Count Tracking implementiert.
- Feature: Zentrale Steuerung der App-Einstellungen (Abiball-Datum & Finanzziel) für Admins und Co-Admins.
- UX: News-Übersicht mit Textvorschau und "Weiterlesen"-Option.
- UX: Finanzliste mit Anzeige der verantwortlichen Klasse.
- Refactor: Einheitliche Verwendung von `asChild` in allen Dialogen und Dropdowns.
- UX: Globale Einführung von Toast-Benachrichtigungen (`sonner`) für Nutzer-Feedback.

## [0.13.0] - 2026-03-18
- Feature: **News-Detailansicht** implementiert.
- Feature: Automatische Zählung der Aufrufe (`view_count`) beim Öffnen der News-Details.

## [0.12.1] - 2026-03-18
- Feature: Berechtigungen erweitert: Auch **Co-Admins** können nun das Abiball-Datum und das Finanzziel bearbeiten.

## [0.12.0] - 2026-03-18
- Feature: Zentrale Steuerung der App-Einstellungen (Abiball-Datum & Finanzziel) über das Admin-Panel.
- Feature: Bearbeiten-Funktion für **News-Beiträge** und **Aufgaben (Todos)**.

## [0.11.0] - 2026-03-18
- Bugfix: Firestore-Konfiguration flexibler gestaltet (Entfernung der hardcodierten `abi-data` Datenbank-ID).
- UX: Implementierung eines globalen Toast-Systems mit `sonner`.

## [0.10.0] - 2026-03-18
- Feature: Erweitertes Rollenmodell mit **Main Admin** und **Co-Admin**.
- Feature: **Planungsgruppen** für Planer.

## [0.5.1] - 2026-03-17
- Initial release of ABI Planer
