# Changelog

## [0.14.0] - 2026-03-18
- Bugfix: Kritische Syntaxfehler in `PollList.tsx` und `TodoList.tsx` behoben (Korrupte JSX-Blöcke und duplizierte Logik).
- Bugfix: Ungültige Rollen-Vergleiche (`role === 'admin'`) durch korrekte Typen (`admin_main`, `admin_co`) ersetzt.
- Refactor: Vollständige Migration von `asChild` auf `render`-Prop für alle `@base-ui/react` Komponenten (Button, DialogTrigger, DropdownMenuTrigger) zur Sicherstellung der Build-Kompatibilität.
- Bugfix: Fehlende Icon-Referenz (`SettingsIcon`) im Admin-Panel korrigiert.

## [0.13.0] - 2026-03-18
- Feature: **News-Detailansicht** implementiert.
- Feature: Automatische Zählung der Aufrufe (`view_count`) beim Öffnen der News-Details.
- UX: News-Übersicht verbessert: Kurze Textvorschau mit "Weiterlesen"-Option statt Volltext.
- Refactor: Datum-Format in der News-Liste kompakter gestaltet.

## [0.12.1] - 2026-03-18
- Feature: Berechtigungen erweitert: Auch **Co-Admins** können nun das Abiball-Datum und das Finanzziel bearbeiten.

## [0.12.0] - 2026-03-18
- Feature: Zentrale Steuerung der App-Einstellungen (Abiball-Datum & Finanzziel) über das Admin-Panel.
- Feature: Bearbeiten-Funktion für **News-Beiträge** hinzugefügt.
- Feature: Bearbeiten-Funktion für **Aufgaben (Todos)** hinzugefügt.
- Refactor: DialogTrigger in allen Modals auf den Standard `asChild` umgestellt für bessere Stabilität.
- UX: Verbesserte Hover-Effekte in der Aufgabenliste für Desktop-Nutzer.

## [0.11.0] - 2026-03-18
- Bugfix: Firestore-Konfiguration flexibler gestaltet (Entfernung der hardcodierten `abi-data` Datenbank-ID).
- UX: Implementierung eines globalen Toast-Systems mit `sonner` zur Verbesserung des Feedbacks.
- Feature: Löschfunktion für **News-Beiträge** hinzugefügt (für Planer/Admins).
- Feature: Löschfunktion für **Aufgaben (Todos)** hinzugefügt (für Planer/Admins).
- Refactor: Alle `alert()` und `confirm()` Aufrufe im Admin-Bereich durch moderne Toasts ersetzt.
- Refactor: Konsistente Rollenprüfung (`admin_main`, `admin_co`, `planner`) über mehrere Seiten hinweg.

## [0.10.0] - 2026-03-18
- Feature: Erweitertes Rollenmodell mit **Main Admin** und **Co-Admin**.
- Feature: **Planungsgruppen** für Planer (Finanzen, Location, Programm, Deko, IT).
- Security: Selbstschutz für Main Admins (Rolle kann nicht von anderen oder sich selbst geändert werden).
- Security: Firestore Rules verschärft, um Rollen-Hierarchie abzusichern.

## [0.9.0] - 2026-03-18
- Feature: Umfassendes Tracking-System implementiert (Wer hat was wann erstellt/erledigt?)
- Feature: Klassen-Wettstreit (Klassen 12A-12D) mit Leaderboard auf dem Dashboard
- Feature: Finanzzuordnung zu Klassen und Personen
- Feature: Semi-anonyme Umfragen (Admins sehen Teilnehmer, aber bei Bedarf nicht deren Wahl)
- Feature: Aufrufe-Zähler für News

## [0.8.0] - 2026-03-18
- Feature: Ticketpreis-Schätzung im Finanzierungsstatus hinzugefügt. Der Preis berechnet sich dynamisch basierend auf einer einstellbaren Anzahl erwarteter Ticketverkäufe, um das restliche Ziel zu decken.

## [0.7.3] - 2026-03-18
- Build: Erneuter Versuch nach `RPC::DEADLINE_EXCEEDED`. Empfehlung: Indizes direkt über den Link in der Console erstellen.

## [0.7.2] - 2026-03-18
- Build: Erneuter Versuch des Deployments nach `RPC::DEADLINE_EXCEEDED` im vorherigen Lauf

## [0.7.1] - 2026-03-18
- Fix: Deployment der Firestore Indexe und Regeln explizit auf die `abi-data` Datenbank konfiguriert

## [0.7.0] - 2026-03-18
- Fix: Fehlende Firestore Composite Indexes für Umfragen und Aufgaben hinzugefügt, um Ladefehler zu beheben

## [0.6.9] - 2026-03-17
- Fix: Unterstützung für benutzerdefinierte Firestore Datenbank-ID (`abi-data`) hinzugefügt

## [0.6.8] - 2026-03-17
- Feature: Native Firebase Konfigurationsdateien hinzugefügt (`firebase.json`, `firestore.rules`, `apphosting.yaml`)
- Build: Automatisierte Unterstützung für Firebase App Hosting implementiert
- Fix: Dashboard zeigt nun robuste Standardwerte an, falls das `settings/config` Dokument noch nicht in Firestore existiert

## [0.6.7] - 2026-03-17
- Feature: Automatische Freischaltung (`is_approved: true`) für alle neu registrierten Nutzer
- Feature: `FIRESTORE_RULES.md` mit Sicherheitsregeln und Berechtigungsmatrix hinzugefügt
- Refactor: Admin Dashboard fokussiert nun primär auf Rollenbeförderung (Planer/Admin)

## [0.6.6] - 2026-03-17
- Fix: TypeScript-Fehler in `AdminPage` behoben (`ResetPasswordDialog` erwartet nun `userEmail` statt `userId`)
- Fix: TypeScript-Fehler in `AuthContext` und `ProfilePage` behoben (`Profile`-Typ mit `created_at` synchronisiert)
- Fix: Base UI Kompatibilität in `AddEventDialog` verbessert (`asChild` durch `render`-Prop ersetzt)
- Build: Firebase-Initialisierung resilienter gegenüber fehlenden Umgebungsvariablen während des Prerendering-Prozesses gemacht

## [0.5.3] - 2026-03-17
- Spezifische Admin-Regel für "Maximilian Priesnitz" entfernt
- Nur noch der allererste registrierte Nutzer erhält automatisch Admin-Rechte
- Database Trigger `handle_new_user` vereinfacht

## [0.5.2] - 2026-03-17
- Der erste registrierte Nutzer wird automatisch zum Admin
- Maximilian Priesnitz erhält bei der Registrierung automatisch Admin-Rechte
- Update des Database Triggers `handle_new_user`

## [0.5.1] - 2026-03-17

- Initial release of ABI Planer
- Dashboard with Countdown and Funding Tracker
- User Authentication with Approval System
- Admin Dashboard for User Management and Password Reset
- Planning Tools: Todos, Calendar, Finance, News, and Polls
- Mobile-first UI using Next.js 16, Tailwind CSS 4, and shadcn/ui
## [0.2.0] - 2026-03-17\n- Renamed app to 'ABI Planer'\n- Enabled public read-only access for guests\n- Added explanation about email/security on login and register pages\n- Implemented is_approved check for voting and planning actions\n- Updated RLS policies for public read access
## [0.3.0] - 2026-03-17\n- Added target date and time display below the countdown\n- Implemented EditSettingsDialog for planners to update the ball date and funding goal
## [0.6.5] - 2026-03-17
- Update: Hinweis auf der Login-Seite an die neue E-Mail-Verifizierungslogik angepasst
## [0.6.4] - 2026-03-17
- Refactor: Anmeldung erfolgt nun über eine direkt gestylte Link-Komponente, um Navigationsprobleme mit Base UI zu beheben
## [0.6.3] - 2026-03-17
- Fix: Base UI Console Error bezüglich `nativeButton` behoben, wenn ein `Link` innerhalb eines `Button` gerendert wird
## [0.6.2] - 2026-03-17
- Fix: React Console Error bezüglich `asChild` Prop behoben (Wechsel auf `render` Prop für Base UI Kompatibilität)
## [0.6.1] - 2026-03-17
- Refactor: Der Name in der Navigationsleiste ist nun ein direkter Link zur Profilseite
- Abmelden-Button wurde separat neben dem Namen platziert
- "Anmelden" wird nun korrekt angezeigt, wenn kein Nutzer eingeloggt ist
## [0.6.0] - 2026-03-17
- Feature: Lernsax E-Mail-Verifizierung implementiert
- Registrierung nur noch mit @hgr-web.lernsax.de Adressen möglich
- Bestätigungsmail-Screen nach der Registrierung hinzugefügt
- Verbesserte Fehlermeldungen im Login für unbestätigte E-Mails
- Dokumentation zur Supabase-Konfiguration (AUTH.md) hinzugefügt

## [0.5.1] - 2026-03-17
- Fix: Anmeldung-Button in der Navigationsleiste reagiert nun korrekt auf Klicks
## [0.5.0] - 2026-03-17
- Verbesserte Navigationsleiste mit Dropdown-Menü für den Benutzerstatus
- Implementierung einer dedizierten Profilseite (Kontoseite)
- Echtzeit-Synchronisation des Anmeldestatus im Frontend
- Klarere Anzeige von Abmelde- und Profil-Optionen
