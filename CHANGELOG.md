# Changelog

## [0.20.1] - 2026-03-21
- Fix: **News-Interaktionen stabilisiert**. Berechtigungsfehler (`permission-denied`) bei Aufrufen, Bewertungen und Kommentaren behoben.
- Security: **Firestore-Rules für News erweitert**. Zugelassene Felder für freigeschaltete Nutzer um `view_count`, `viewed_by` und robustere `ratings`-Logik ergänzt.
- UX: **Gated News Interaction**. Interaktionen (Bewerten, Kommentieren) und Aufrufszählung werden im UI nun explizit nur für freigeschaltete Profile angeboten/ausgeführt, um Fehler bei neuen Accounts zu vermeiden.
- UI: **Feedback für nicht freigeschaltete Nutzer**. Ein klarer Hinweis informiert nun darüber, dass der Account erst freigeschaltet werden muss, bevor Kommentare verfasst werden können.

## [0.20.0] - 2026-03-21
- Rebranding: **Sammelkarten-System**. Die "Lootbox" und der "Top Secret"-Bereich wurden vollständig in "Sammelkarten" umbenannt.
- Navigation: **Neue Route für Sammelkarten**. Der geheime Bereich ist nun offiziell unter `/sammelkarten` erreichbar (vorher `/geheim`).
- Admin: **Lehrer-Pool Editor**. In den globalen Einstellungen können Lehrer nun bequem über einen Modal-Editor zum Sammelkarten-Pool hinzugefügt oder bearbeitet werden.
- UI: **Konsistentes Branding**. Alle Texte, Icons und Hinweismeldungen wurden an das neue "Sammelkarten"-Design angepasst.

## [0.19.0] - 2026-03-21
- Feature: **Privatsphäre für Feedback**. Feedback kann nun anonym (Name wird versteckt) oder privat (nur für Admins sichtbar) gesendet werden.
- Feature: **Lehrer-Album & Leveling**. Lehrer aus der Lootbox werden in einem Album gesammelt. Duplikate erhöhen das Level des jeweiligen Lehrers.
- Feature: **Interaktive News**. News-Beiträge können nun bewertet (Daumen hoch/runter) und kommentiert werden.
- Feature: **Detailliertes Audit-Logging**. Neue Aktionen (Looting, Feedback, News-Interaktionen) werden revisionssicher protokolliert.
- UI: **Log-Kontextmenüs**. Verbesserte Darstellung und Bedienung der Admin-Logs.
- UX: **Automatisches Speichern**. Änderungen an globalen Einstellungen und Lehrer-Loot werden nun sofort im Hintergrund gespeichert.
- Compliance: **Datenschutz-Update**. Link zur Datenschutzerklärung in der Registrierung prominent platziert und Checkbox-Workflow optimiert.
- Logging: Jeder Log-Eintrag enthält jetzt garantiert den Nutzernamen (wird ggf. aus Firestore geladen).
- Logging: Neuer Log-Typ ACCOUNT_CREATED für erfolgreiche Account-Registrierungen.

## [0.18.13] - 2026-03-20
- UX: **Rechtstexte in Registrierung zerstörungsfrei**. Links zu AGB und Datenschutz öffnen jetzt in einem neuen Tab, sodass der Registrierungsfortschritt beim Nachlesen erhalten bleibt.
- UI: **Consent-Checkbox Layout stabilisiert**. In der Registrierung umbrechen die Texte neben den Checkboxen jetzt auf allen Geräten korrekt (inklusive Links zu AGB/Datenschutz) ohne zerrissene Zeilen.
- Performance: **Lootbox-Animationen optimiert**. Schwergewichtige Effekte (große Blur-/Ping-Layer, aggressive Shake-Amplituden) wurden durch leichtere, transform-basierte Animationen ersetzt, damit Mobile-Browser deutlich flüssiger bleiben.
- UI: **Footer Mobile-Zeilenumbruch**. Auf kleinen Displays stehen Copyright und Footer-Links jetzt in getrennten Zeilen mit sauberem Wrap statt gequetschter Einzeile.
- UX: **Dashboard-Layout ohne sichtbares Umsortieren**. Widgets werden erst angezeigt, nachdem alle initialen Datenquellen geladen sind, damit die Personalisierung ohne sichtbares Springen erfolgt.
- Finanzen: **Zielbetrag entkoppelt**. Das Finanzierungsziel ist jetzt wieder ein eigener Schätzwert aus den Einstellungen und wird nicht mehr aus Ausgaben abgeleitet.
- Dashboard/Finanzen: **Konsistente Fortschrittslogik**. Der Funding-Fortschritt basiert auf dem aktuellen Kontostand, während Ausgaben separat nur in "Gesamtausgaben" erscheinen.
- Fix: **Globales UI-Flackern & Navigations-Hänger behoben**. Der Presence-Heartbeat im `AuthContext` war an das gesamte `profile`-Objekt gekoppelt und erzeugte dadurch eine Re-Subscribe-/Write-Schleife (`isOnline`/`lastOnline`) mit permanenten Re-Renders.
- Stability: **Auth-Heartbeat entkoppelt**. Online-Status-Updates laufen jetzt nur noch pro Benutzer-ID-Lifecycle statt bei jeder Profil-Änderung, wodurch Dashboard, News, Feedback und Admin-Logs wieder stabil reagieren.
- UI: **Footer adaptiv einzeilig bei genug Platz**. Copyright und Rechtslinks dürfen auf breiten Viewports wieder in einer Zeile stehen und umbrechen nur bei engem Platzbedarf.

## [0.18.12] - 2026-03-20
- Legal: **Datenschutzerklärung hinzugefügt**. Neue Seite `/datenschutz` mit Verantwortlichem, Verarbeitungszwecken, Rechtsgrundlagen, Speicherdauer, Betroffenenrechten und Kontakt.
- Legal: **Firebase/Firestore transparent gemacht**. Datenschutzerklärung nennt nun konkret Firebase Hosting, Firebase Authentication und Cloud Firestore inklusive Drittland-Hinweis.
- Legal: **AGB und Impressum aktualisiert**. Mindestalter (16+) klargestellt, Hinweis auf privaten Betrieb (kein offizielles Schulangebot) ergänzt, Impressum auf `§ 5 DDG` aktualisiert.
- Auth/Legal: **Verpflichtende Einwilligungen bei Registrierung**. Schritt 3 der Registrierung erfordert nun aktive Bestätigung von Mindestalter (16+), AGB und Datenschutzerklärung.
- Compliance: **Consent-Nachweis gespeichert**. Bei Registrierung werden Zustimmungsmetadaten (`legal_consents`) inklusive Versionsstand und Zeitstempel im Profil dokumentiert.
- UI: **Footer-Rechtslinks erweitert**. Link auf Datenschutz zusätzlich zu Impressum und AGB eingebunden.

## [0.18.11] - 2026-03-20
- Fix: **Release-Check Stabilization**. `lint` nutzt jetzt die ESLint-CLI statt `next lint` und ist kompatibel mit Next.js 16.
- Fix: **Funding Logic Consistency**. Dashboard berücksichtigt wieder ausgabengetriebenes Ziel (mit sauberem Fallback), und die Finanzseite nutzt im Finanzstatus den tatsächlichen Kontostand.
- Security: **Log Write Guard Hardening**. Log-Erstellung ist auf eigene Einträge (`user_id == auth.uid`) mit valide gesetzter Aktion eingeschränkt.
- Quality: **Regression Guard Hardening**. Pattern-Checks tolerieren nun stabile Syntax-Varianten (`||`/`??`) ohne Verhaltensverlust.

## [0.18.10] - 2026-03-20
- Feature: **Mobile-First User Management**. Die Benutzerverwaltung im Admin-Bereich wurde für mobile Geräte komplett überarbeitet und bietet nun volle Feature-Parität zur Desktop-Version (Rollen, Kurse, Gruppen, Timeouts).
- UI: **Mobile Accessibility Improvements**. Größere Touch-Targets für To-Do Aktionen, reaktiver Finanzverlauf mit horizontalem Scrolling und verbesserte mobile Bedienung der Pinnwand-Aktionen.

## [0.18.9] - 2026-03-20
- Fix: **Groups Page Router**. Resolved a build error in `src/app/gruppen/page.tsx` where `router` was undefined.

## [0.18.8] - 2026-03-20
- Feature: **User Presence System**. Implementierung einer "Ist online" und "Zuletzt online" Statusanzeige für alle Benutzer.
- Core: **Heartbeat Mechanism**. Ein in `AuthContext` integrierter Heartbeat aktualisiert den Status alle 2 Minuten in Firestore.
- UI: **Status Indicators**. Auf der Profilseite wird nun ein grüner Punkt für aktive Nutzer und ein "Zuletzt online" Zeitstempel (mit 5-Minuten-Stale-Session-Fallback) für inaktive Nutzer angezeigt.

## [0.18.7] - 2026-03-20
- Feature: **Simplified Admin User Management**. Die Benutzerverwaltung für Admins wurde grundlegend vereinfacht und modernisiert.
- UI: **Responsive Profile Tables**. Tabellarische Übersicht aller Nutzer mit direkter Bearbeitungsfunktion für Rollen und Kurszuweisungen.

## [0.18.6] - 2026-03-20
- Feature: **Groups Page Overhaul**. Die Gruppen-Seite wurde komplett überarbeitet, um eine reaktive Navigation mittels `useSearchParams` zu ermöglichen.
- Fix: **Reactive Group Navigation**. Die Navigation innerhalb der Gruppen wurde auf `useSearchParams` umgestellt, um die Reaktivität und Browser-History-Unterstützung zu verbessern.

## [0.18.5] - 2026-03-20
- UI: **Dashboard News Preview**. Die News-Vorschau auf dem Dashboard zeigt nun auch das jeweilige Vorschaubild (falls vorhanden) klein auf der linken Seite an, um die visuelle Attraktivität zu steigern.
- UI: **Layout Refinement**. Optimierung des Abstands und der Ausrichtung von Titeln und Inhalten in der Dashboard-Vorschau.

## [0.18.4] - 2026-03-20

- Fix: **Version Synchronization**. The version in `package.json` is now automatically synced with the `VERSION` file during build.
- Automation: **Version Script**. Added `npm run sync:version -- patch` to automatically increment and sync the version.
- UI: **Lootbox Animation Overhaul**. Die Lootbox-Animationen wurden grundlegend überarbeitet, um sie flüssiger und aufregender zu gestalten.
- UI: **Rarity-Specific Shakes**. Jede Seltenheitsstufe (Common bis Legendary) hat nun einen eigenen, immer intensiver werdenden Shake-Effekt mit dynamischer Skalierung und Rotation.
- UI: **Enhanced Visual Feedback**. Neue Idle-Animationen (Floating), Flash-Effekte beim Reveal und verbesserte Upgrade-Indikatoren sorgen für ein deutlich hochwertigeres "Gefühl" beim Öffnen der Boxen.

## [0.18.3] - 2026-03-20
- UI: **Group Navigation Overhaul**. Internal page toggles in the Groups section have been removed in favor of the primary sidebar sub-menu for a cleaner, more integrated experience.
- UI: **Widget Layout Fixes**. Resolved overlapping and glitching issues in the group workspace by optimizing the grid layout and removing problematic fixed heights.

## [0.18.2] - 2026-03-20
- UI: **Lootbox Progress Fix**. Die Fortschrittsanzeige unter der Lootbox zeigt nun korrekt nur noch die 4 Upgrade-Phasen an. Der finale 5. Klick zum Öffnen wird visuell separat behandelt.

## [0.18.1] - 2026-03-20
- UI: **Secret Page Layout**. Die Lootbox-Seite ist nun korrekt in das Standard-Layout (mit Sidebar) integriert, behält aber ihren minimalistischen, fokussierten Look im Inhaltsbereich bei.

## [0.18.0] - 2026-03-20
- Feature: **Navigation Guard**. Auf der Einstellungsseite erscheint nun eine Warnung (Modal), wenn man versucht die Seite mit ungespeicherten Änderungen am Kurssystem oder den Planungsgruppen zu verlassen.

## [0.17.9] - 2026-03-20
- UI: **Lootbox Refinement**. Die Lootbox-Seite wurde auf das Wesentliche reduziert. Das Öffnen erfolgt nun nach genau 5 Klicks (4 Upgrades + 1 Reveal).
- UI: **Animationen**. Shake-Effekte beim Upgrade und eine verbesserte Reveal-Animation hinzugefügt.
- Admin: **Lehrer-Management**. Die Verwaltung unterstützt nun bis zu 100 Lehrer mit Suchfunktion und optimierter Listenansicht.

## [0.17.8] - 2026-03-20
- Fix: **Build-Fehler GlobalSettings**. Ein Syntaxfehler (Platzhalter `...`) in der globalen Einstellungsseite wurde behoben, um das Deployment wieder zu ermöglichen.

## [0.17.7] - 2026-03-20
- UI: **Horizontal Tabs Overhaul**. Replaced the bulky "mega" vertical toggles with a clean, horizontal tab layout across Todos, Calendar, and Planning Groups for better space efficiency and visual consistency.

## [0.17.6] - 2026-03-20
- Feature: **Lehrer-Lootbox**. Das Easter Egg wurde zu einer interaktiven Lootbox umgebaut, aus der man Lehrer ziehen kann.
- UI: **Rarity Upgrades**. Die Lootbox kann durch 4 Klicks aufgewertet werden (Upgrades für Seltenheit basierend auf Wahrscheinlichkeiten).
- Admin: **Loot-Verwaltung**. Lehrer und ihre Seltenheitsstufen können nun in den Globalen Einstellungen gepflegt werden.

## [0.17.5] - 2026-03-20
- Fix: **Build-Fehler CountdownHeader**. Die `asChild` Prop wurde durch die im Projekt verwendete `render` Prop für Base UI Komponenten ersetzt, um den Firebase Deployment-Fehler zu beheben.

## [0.17.4] - 2026-03-20
- UI: **Mobile Edit Buttons**. Fixed visibility of edit and delete buttons for ToDos and Calendar events on mobile devices.

## [0.17.3] - 2026-03-20
- UI: **Calendar Tabs Fix**. Replaced the "mega" vertical tabs with a more subtle, top-aligned horizontal layout to improve visibility and ease of use.
- Feature: **Interaktiver Timer**. Der Countdown-Header ist nun klickbar und öffnet einen informativen Dialog mit detaillierten Zeitangaben (Gesamtstunden, -minuten und -sekunden) bis zum Abiball.
- Logic: **Cookie Banner First Visit**. The cookie banner now always appears on the very first visit to the site, regardless of the randomized settings. After the first visit, it reverts to the configured random chance.
- Feature: **Easter Egg**. Added a hidden easter egg triggered by clicking the version number in the footer. Unlocks a "Top Secret" page for the account.

## [0.17.0] - 2026-03-20
- UI: **Theme Labels**. Theme toggle now shows text labels ("Hell", "Dunkel", "System") for better accessibility and clarity.
- Feature: **Location field**. Support for location fields added to news and calendar entries.
- Logic: **Nested todos**. Improved stability and display of nested sub-task structures.
- Admin: **Admin emails**. Fixed issues with admin notification emails.
- Performance: **Feedback performance**. Optimized loading and list rendering in the feedback admin module.
- Finance: **Finance stand**. Updated finance calculations and overview dashboard.
- Auth: **Auth timeout info**. Better session timeout handling and user information.

## [1.2.0] - 2026-03-20
- Feature: **ToDo DetailView**. Clicking a task title now opens a detailed view with a description and sub-tasks list.
- Logic: **Nesting Limit**. Sub-tasks are now limited to 5 levels (0-4) to ensure layout stability.
- UI: **Beta Labels Removed**. Removed "Beta" badges from Dashboard, Groups, and Admin Logs to reflect the platform's release state.

## [0.16.4] - 2026-03-20
- Feature: **ToDo Unteraufgaben**. Aufgaben unterstützen nun rekursive Verschachtelung. Unteraufgaben werden eingerückt im Dashboard angezeigt.
- Logic: **Cascading Deletes**. Das Löschen einer Hauptaufgabe löscht nun automatisch alle zugehörigen Unteraufgaben.
- Fix: **Log-Spam behoben**. In der `FundingStatus`-Komponente (Dashboard/Finanzen) wurde ein redundanter Update-Trigger auf Mount unterbunden, der bei jedem Seitenaufruf unnötige Log-Einträge erzeugte.
- Logging: **SUBTODO_CREATED** hinzugefügt, um die Erstellung von Unteraufgaben separat zu tracken.

## [0.16.3] - 2026-03-19
- Logging: **Aktionsabdeckung erweitert**. Nutzergetriggerte Create/Update/Delete-Aktionen wurden in den Kernmodulen konsistent mit `logAction` abgesichert.
- Logging: **Audit-Details verbessert**. Logs enthalten jetzt mehr Kontext (z. B. betroffene IDs, Titel, Status, Herkunft), um Support und Moderation zu erleichtern.
- Security/UX: **Admin-Logs stabilisiert**. Chunk-Laden und Rollen-Gating bleiben aktiv, sodass Berechtigungsfehler bei unberechtigtem Zugriff vermieden werden.

## [0.16.2] - 2026-03-19
- Admin: **Logs in Chunks**. Die Logs-Seite lädt jetzt paginiert mit Nachladen beim Scrollen und reduziert so DB- sowie UI-Last deutlich.
- Admin: **Permission-Hotfix**. Der Logs-Listener startet nur noch für berechtigte Nutzer, wodurch `permission-denied`-Fehler bei Redirects vermieden werden.
- Gruppen: **Untermenüs neu aufgebaut**. Die verschachtelte Struktur wurde entfernt und in drei klare Bereiche neu organisiert: Mein Team, Alle Gruppen, Shared Hub.
- Gruppen: **Duplikate entfernt**. Die doppelte Mitgliederzuordnung wurde in eine zentrale Ansicht zusammengeführt.
- UI: **Beta-Kennzeichnung**. Dashboard, Gruppen und Admin-Logs sind jetzt in Navigation und Seitentitel mit `Beta` markiert.
- Build: **Versionssync stabilisiert**. `VERSION` und `package.json` werden vor dem Build automatisch synchronisiert (`scripts/sync-version.mjs`).

## [0.16.1] - 2026-03-19
- UI: **Kurs-Ranking** (ehemals Kurswettstreit) optisch verfeinert und Clipping-Fehler in der Kachel-Ansicht behoben.
- Feature: **Event-Mentions**. In Kalenderterminen können nun gezielt Personen, Rollen (z.B. 'Admin') oder Planungsgruppen erwähnt werden.
- UX: **Intelligente Kalender-Sortierung**. Anstehende Termine werden nun zuerst angezeigt (aufsteigend), während vergangene Termine automatisch ans Ende der Liste rücken (absteigend).
- Fix: **Registrierungs-Workflow optimiert**. Ein Fehler wurde behoben, durch den die Kursauswahl bei der Registrierung übersprungen werden konnte.
- Feature: **Nachträgliche Kursänderung**. Schüler können ihren zugewiesenen Kurs nun jederzeit in ihren Profileinstellungen selbst korrigieren.
- Fix: Kritischer TypeScript-Fehler in der Gruppen-Pinnwand (`GroupWall.tsx`) durch Migration auf die korrekte `render`-Prop behoben.

## [0.16.0] - 2026-03-19
- Feature: **Kollaborative Planungs-Hubs** (`/gruppen`). Die Gruppenseite wurde zu einem vollwertigen Workspace für Teams ausgebaut.
- Feature: **Interne Team-Bereiche**. Jede Gruppe hat nun einen privaten Bereich mit eigener Pinnwand, Team-Aufgaben und Team-Kalender.
- Feature: **Shared Hub**. Ein neuer zentraler Ort für den Austausch und die Koordination zwischen verschiedenen Planungsgruppen.
- Feature: **Erweiterte Gruppenleiter-Funktionen**. Teamleiter (`is_group_leader`) können nun eigenständig Mitglieder für ihr Team verwalten und wichtige Nachrichten auf der Pinnwand pinnen.
- Feature: **Targeted Messaging**. Im Shared Hub können Nachrichten gezielt an bestimmte Gruppen adressiert werden.
- Security: Firestore-Regeln wurden angepasst, um Gruppenleitern administrative Rechte innerhalb ihrer eigenen Teams zu gewähren.
- Security: Autoren können ihre eigenen Nachrichten in der Pinnwand und im Hub nun wieder selbst löschen.
- Fix: Bei der Zuweisung eines neuen Gruppenleiters wird die Berechtigung beim vorherigen Leiter nun korrekt entzogen.

## [0.15.24] - 2026-03-19
- Fix: **Kritische Fehler bei Registrierung und Anmeldung behoben**. Das Nutzerprofil wird nun sofort nach der Erstellung erkannt (`onSnapshot`), und neue Nutzer landen nicht mehr in einer Endlosschleife auf der Login-Seite oder vor verschlossenen Einstellungen.
- Feature: **Planungsgruppen-Modul** (`/gruppen`). Strukturierte Teams mit Gruppenleitern und Mitgliedern. Plannungsgruppen können nun effizienter verwaltet und Aufgaben gezielt zugewiesen werden.
- Feature: **Öffentlicher Bug-Tracker & Feedback-System**. Feedback ist nun für alle Nutzer einsehbar. Unterstützung für **Bild-Uploads** (Screenshots) direkt im Feedback-Formular.
- Feature: **Erweitertes Logging-System**. Alle wichtigen Aktionen (Abstimmungen, Finanz-Updates, Feedback) werden nun revisionssicher mit Zeitstempel und Nutzer-ID protokolliert.
- Feature: **Interaktiver Kalender**. Termine sind nun klickbar und zeigen eine detaillierte Ansicht mit allen Informationen.
- Feature: **Finanz-Update**. Der Finanzstatus berechnet sich nun korrekt aus Einnahmen minus Ausgaben. Anzeige von Ticketpreis-Prognosen basierend auf dem Finanzierungsziel und den erwarteten Verkäufen.
- UX: **Verbesserte Navigation & Responsivität**. Fix für iPad/Tablet Layout-Glitches (Footer/Account-Button). Korrektur der Menü-Hervorhebung bei Admin-Unterseiten.
- UX: **Theme-Switcher Optimierung**. Die aktuelle Theme-Wahl wird nun im Dropdown klar markiert.
- UX: **Umfragen-Verbesserung**. Nutzer können ihre Teilnahme an Umfragen nun zurückziehen (sofern die Umfrage Änderungen erlaubt).
- Fix: **Sonderzeichen-Support**. Korrekte Behandlung und Normalisierung von ä, ö, ü und ß im gesamten System.
- Legal: Neue **AGB-Seite** (`/agb`) hinzugefügt und im Footer verlinkt.

## [0.15.23] - 2026-03-18
- UI: Optimierung des Dashboard-Layouts für einen perfekten "Tiled"-Look (nx1 Kacheln). Die Höhe der Karten wurde vereinheitlicht und der Kurswettstreit scrollt nun intern, wenn die Liste zu lang wird.

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
