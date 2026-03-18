# Changelog

## [0.15.22] - 2026-03-18
- UI: Der Kurswettstreit wurde optisch komplett überarbeitet, um besser zum restlichen Design der App zu passen (Listenansicht mit Rang-Indikatoren, verbesserte Typografie und subtilere Schatten).

## [0.15.21] - 2026-03-18
- UI: Globalen Footer mit Impressum, Urheberrecht und Versionsnummer hinzugefügt.
- UI: Neue Impressum-Seite (`/impressum`) erstellt.

## [0.15.20] - 2026-03-18
- Feature: **Persistente Benachrichtigungen**. Rote Punkte verschwinden nun automatisch, sobald die entsprechende Seite (News, Kalender) besucht wurde, basierend auf einem neuen `last_visited` Zeitstempel im Nutzerprofil.
- UI: **Mehr Tiefe im Hellmodus**. Einführung von subtilen Schatten (`shadow-card`) und weicheren Rahmen für ein hochwertigeres Design. Der Hintergrund wurde minimal abgedunkelt, um weiße Karten besser hervorzuheben.
- Fix: Fehlende Card-Importe im Dashboard behoben, die zu Build-Fehlern führten.

## [0.15.19] - 2026-03-18
- Feature: **Interaktive Dashboard-Kacheln**. Alle Dashboard-Elemente sind nun klickbar und führen direkt zur entsprechenden Detailseite, inklusive haptischem Feedback (`scale`-Effekt) für Mobile.
- UX: **Verfeinerte Benachrichtigungslogik**. Die roten Punkte verschwinden nun präziser: News-Punkte nur nach Aufruf des Beitrags, Kalender-Punkte nur für neue Termine (24h).
- UI: Der Countdown auf mobilen Geräten wird nun platzsparend nur noch auf dem Dashboard angezeigt.
- Refactor: Das Kurs-Leaderboard fokussiert sich nun rein auf das Geldsammeln (Einnahmen) und wurde im Dashboard prominenter platziert.

## [0.15.18] - 2026-03-18
- Feature: **Dynamisches Dashboard-Layout** (`useDashboardSorting`) implementiert. Die Dashboard-Elemente werden nun intelligent nach Relevanz (offene Aufgaben, anstehende Termine, neue Umfragen) für den jeweiligen Nutzer sortiert.
- Feature: **Echtzeit-Benachrichtigungsindikatoren** in der Navbar (`useNotifications`) für Todos, Kalender, News und Umfragen hinzugefügt.
- UX: Optimierte Scoring-Logik für die Dashboard-Reihenfolge (Todos: 100, Events: 80, Polls: 70, Finanzen: 50, News: 30).
- CI: Regression-Guard um Prüfungen für das dynamische Layout und die Navigations-Indikatoren erweitert.

## [0.15.17] - 2026-03-18
- Feature: Aufgaben (Todos) können nun entweder einer Person, einem Kurs ODER einer Gruppe zugewiesen werden. Die Benutzeroberfläche wurde mit einem neuen, gruppierten Auswahlfeld optimiert, um diese Exklusivität sicherzustellen.

## [0.15.16] - 2026-03-18
- UI: Die Schnelleinstellungen im Dashboard wurden vereinfacht. Die Kursverwaltung wurde entfernt, sodass nur noch das Abiball-Datum und das Finanzziel direkt bearbeitet werden können.

## [0.15.15] - 2026-03-18
- UI: Das Dashboard-Layout wurde optimiert. Die News-Vorschau füllt nun die Lücke neben dem Finanzstatus (wo früher der Timer war).
- UI: Das Zahnrad für die globalen Einstellungen (Abiball-Datum, Finanzziel) wurde direkt neben den Dashboard-Titel verschoben.

## [0.15.14] - 2026-03-18
- Security: Main Admins können ihr Konto nun nicht mehr selbst löschen, ohne die Rolle vorher auf einen anderen Nutzer übertragen zu haben. Dies stellt sicher, dass immer mindestens ein Main Admin im System verbleibt.

## [0.15.13] - 2026-03-18
- Feature: Aufgaben (Todos) können nun mit einer optionalen Deadline versehen werden.
- UI: Überfällige Aufgaben werden farblich hervorgehoben (rot) und mit einem pulsierenden Warnhinweis markiert.
- UI: Deadlines werden in der Aufgabenliste mit einem Kalender-Icon angezeigt.

## [0.15.12] - 2026-03-18
- UI: Der Countdown wurde aus dem Dashboard entfernt und prominent (aber dezent) in den Header integriert.
- UI: Implementierung einer kompakten Countdown-Komponente (`CountdownHeader`) für Desktop und Mobile.

## [0.15.11] - 2026-03-18
- Anpassung der App für den Abiturjahrgang 2027.
- Aktualisierung des Ziel-Datums (Abiball) auf den 19.06.2027.
- Aktualisierung der Projektdokumentation (PROJECT_KNOWLEDGE.md, INSTALL.md).

## [0.15.10] - 2026-03-18
- Fix: Das Erstellen von News ist nun auch für von Admins bestätigte Nutzer (`is_approved`) möglich, nicht mehr nur für Planer/Admins.

## [0.15.9] - 2026-03-18
- Security: Das Einreichen von Feedback ist nun nur noch für von Admins bestätigte Nutzer (`is_approved`) möglich, um die Qualität der Einreichungen zu sichern.

## [0.15.8] - 2026-03-18
- Feature: **Dark Mode** implementiert. Nutzer können nun zwischen einem hellen, einem dunklen und dem System-Theme wechseln.
- UX: Der Theme-Switcher wurde in der Navbar (Desktop & Mobile) platziert.

## [0.15.7] - 2026-03-18
- Feature: **Feedback & Feature-Request System** implementiert.
  - Alle angemeldeten Nutzer können über einen Button in der Navbar detailliertes Feedback (Bug, Feature-Wunsch, Sonstiges) einreichen.
  - Admins erhalten eine neue, geschützte Seite (`/admin/feedback`) zur Verwaltung aller Einreichungen.
  - Admins können den Status des Feedbacks ändern (Neu, In Arbeit, Umgesetzt, Abgelehnt) oder es löschen.
- Security: Firestore Rules für die neue `feedback`-Collection hinzugefügt.

## [0.15.6] - 2026-03-18
- Feature: **Zielgerichtete Aufgaben (Todos)**. Aufgaben können nun spezifischen Personen oder Kursen zugewiesen werden.
- UX: **Highlights für Zuweisungen**. Nutzer sehen sofort, welche Aufgaben direkt an sie oder ihren Kurs gerichtet sind ("An Dich" / "Dein Kurs" Badges).
- UX: **News-Indikator**. Neue News, die der Nutzer noch nicht gesehen hat, werden auf dem Dashboard mit einem pulsierenden "NEU"-Badge markiert.

## [0.15.5] - 2026-03-18
- Feature: **Nutzergruppen-spezifisches Dashboard** implementiert. Die Reihenfolge der Dashboard-Elemente passt sich nun automatisch der Nutzerrolle an:
  - **Gäste (nicht eingeloggt)**: Fokus auf News und Updates.
  - **Schüler (Viewer)**: Fokus auf Abstimmungen und das Klassen-Leaderboard.
  - **Planer/Admins**: Fokus auf Finanzstatus und offene Aufgaben (Todos).
- Feature: Integration der **Umfragen (Polls)** direkt auf dem Dashboard.

## [0.15.4] - 2026-03-18
- Fix: Kritischer Build-Fehler behoben (TypeScript). Die `asChild` Prop wurde durch die korrekte `render` Prop für alle Base UI Komponenten (Dropdown-Trigger, Buttons) ersetzt.

## [0.15.3] - 2026-03-18
- Feature: **Dynamische Kursverwaltung** implementiert. Admins können nun die verfügbaren Kurse in den Einstellungen definieren (hinzufügen/entfernen).
- Feature: **Kurs-Zuweisung für Admins**. Admins können nun in der Benutzerverwaltung die Kurse einzelner Nutzer nachträglich ändern oder neu zuweisen.
- Refactor: Alle kursabhängigen Komponenten (Registrierung, Leaderboard, Finanzen) nutzen nun die dynamische Kursliste aus der Datenbank.

## [0.15.2] - 2026-03-18
- Fix: Wiederherstellung der Admin-Erkennung durch Unterstützung der Legacy-Rolle `'admin'` in allen Berechtigungsprüfungen und Sicherheitsregeln.
- Security: Firestore Rules aktualisiert, um die Legacy-Admin-Rolle mit denselben Rechten wie `admin_main` auszustatten.

## [0.15.1] - 2026-03-18
- Feature: **Kurswahl bei Registrierung** implementiert. Nutzer werden nun direkt bei der Anmeldung ihrem Stammkurs (12A-12D) zugeordnet.
- UX: Systemweite Umstellung der Terminologie von "Klasse" auf "Kurs" zur besseren Anpassung an die gymnasiale Oberstufe.

## [0.15.1] - 2026-03-18
- Fix: Behebung der "verschwundenen" Admin-Seite durch Optimierung der Redirect-Logik während des Ladevorgangs.
- Refactor: Letzte verbleibende `render`-Props in der Benutzerverwaltung auf stabilen `asChild` Trigger umgestellt.

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
