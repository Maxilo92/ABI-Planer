# Changelog

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
