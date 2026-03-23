# Changelog

## [0.22.12] - 2026-03-23
- UX: **Nur noch eine Kalender-Detailansicht**. Termine öffnen jetzt konsistent über die Route `/kalender/[id]`; die separate Modal-Detailansicht wurde entfernt.
- UX: **Teilen direkt auf der Kalenderseite**. In der Terminliste auf `/kalender` ist die Teilen-Funktion wieder verfügbar; auf dem Dashboard bleibt sie ausgeblendet.
- Feature: **Externer Kalender-Export ohne Dateidownload**. Google- und Apple-Buttons öffnen jetzt direkt den externen Kalender statt eine `.ics`-Datei zu laden.
- UI: **Export-Aktionen nach unten verlagert**. Die Kalender-Buttons stehen jetzt unterhalb der Termininhalte und stören den Header nicht mehr.

## [0.22.11] - 2026-03-23
- Feature: **Kalender-Einträge de-anonymisiert**. Termine zeigen jetzt den Namen der erstellenden Person in Übersicht und Detailansicht.
- Feature: **Kalender-Export für Google und Apple**. In der Termin-Detailansicht können Termine direkt nach Google Kalender übertragen oder als `.ics` für Apple Kalender exportiert werden.
- UX: **Termin-Teilen nur über Detailansicht**. Die Teilen-Aktion für Termine läuft jetzt gezielt über die Detailansicht statt über das Dashboard-Listing.

## [0.22.10] - 2026-03-23
- Feature: **Teilen-Buttons für News und Termine**. News-Einträge und Termine besitzen jetzt direkte Share-Aktionen zum Teilen des jeweiligen Resource-Links.
- Feature: **Direkte Termin-Detailseite**. Termine sind zusätzlich über eigene URLs erreichbar (`/kalender/[id]`), damit geteilte Links direkt zur Ressource führen.

## [0.22.09] - 2026-03-23
- UI: **Popups unten rechts vereinheitlicht**. Geschenk-Popups erscheinen jetzt konsistent als schwebende Nachricht unten rechts.
- Feature: **Schenkender kann alle Geschenk-Popup-Texte bearbeiten**. Titel, Haupttext, Zusatznachricht, Link-Label, Link-Ziel und Schließen-Text sind beim Verschenken frei konfigurierbar.
- Feature: **Custom Popup Messages für verschiedene Anwendungsfälle**. In den globalen Einstellungen können route-basierte, aktivierbare Popup-Nachrichten mit eigener Wahrscheinlichkeit und CTA gepflegt werden.
- UI: **Geschenk-Popup exakt in der Ecke**. Abstand zum rechten und unteren Rand ist jetzt identisch.
- UI: **CTA als eigener Button**. "Zu den Packs" steht jetzt als Button direkt neben "Gelesen".
- Feature: **Popup ohne Geschenk möglich**. Admins können jetzt auch reine Benachrichtigungen ohne Packs versenden (`Packs pro Person = 0`).
- UX: **Popup-Interaktion schließt Popup sofort**. Beim Folgen des CTA-Links wird das Popup automatisch geschlossen.
- UX: **Swipe-to-dismiss auf Mobile**. Schwebende Popups lassen sich per Wisch nach rechts schließen.

## [0.22.08] - 2026-03-23
- UI: **Geschenk-Banner jetzt auch auf der Startseite**. Neue Pack-Schenkungen werden zusätzlich im Dashboard angezeigt, inklusive Direktlink zur Sammelkarten-Seite.
- Refactor: **Universelle Banner-Basis eingeführt**. Geschenk-, Cookie- und Werbe-Banner nutzen jetzt eine gemeinsame `UniversalBanner`-Komponente für einheitliches Verhalten und Styling.
- UI: **Banner als Popup-Nachrichten**. Geschenk-Banner werden jetzt als schwebende Benachrichtigung angezeigt (statt im Layoutfluss), inklusive Animation und fixer Position.

## [0.22.07] - 2026-03-23
- Feature: **Benutzerverwaltung Mehrfachauswahl erweitert**. Ausgewählte Nutzer können jetzt nicht nur Packs erhalten, sondern auch per Massenaktion freigeschaltet/gesperrt, Kursen/Planungsgruppen zugewiesen sowie mit Timeouts versehen oder davon befreit werden.
- Fix: **CORS für Geschenk-Funktion korrigiert**. `giftBoosterPack` antwortet jetzt mit gültigen `Access-Control-Allow-Origin` Headern für Produktions- und Firebase-Domains.

## [0.22.06] - 2026-03-23
- Feature: **News unterstützt Markdown durchgängig**. News-Inhalte werden in der Übersicht formatiert gerendert, und die Editor-Dialoge weisen explizit auf Markdown-Syntax hin.
- Feature: **Schenkungen für mehrere ausgewählte Nutzer**. In der Benutzerverwaltung können nun mehrere Personen markiert und mit Packs + individueller Nachricht beschenkt werden.
- UI: **Geschenk-Banner auf Sammelkarten-Seite**. Neue Schenkungen werden als Banner angezeigt und können vom Nutzer als gelesen markiert werden.
- Fix: **Gift-Cloud-Function korrigiert**. Schenkungen schreiben jetzt in die richtige Collection (`profiles`) und prüfen Adminrechte zuverlässig über die Profilrolle.
- Feature: **Album-Sortierung erweitert**. Neue Sortieroptionen für A-Z, Z-A, Seltenheit auf-/absteigend sowie Level auf-/absteigend.
- Fix: **Raritäten-Sync automatisiert**. Bei neuen Lehrerbewertungen werden Seltenheiten automatisch in `teachers` und im Loot-Pool (`settings/global.loot_teachers`) synchron gehalten.
- Fix: **Manueller Raritäten-Sync stabilisiert**. Der Sync berücksichtigt nun zuverlässig bestehende Lehrer und ersetzt keine Einträge mehr unbeabsichtigt.
- Fix: **Pack-Carryover verbessert**. Verpasste Tages-Packs werden robuster übernommen; Booster-Tag-Berechnung wurde zeitzonensicher gemacht.
- Fix: **Sammelkarten-Mobile-Rendering verbessert**. Pack-Ansicht respektiert Safe-Area auf Mobilgeräten und überdeckt die UI-Leisten nicht mehr.
- Feature: **Feedback-Bilder schneller**. Nach dem Zuschnitt startet der Upload im Hintergrund; zusätzlich gibt es eine Hochkant-Zuschnitt-Option (3:4).

## [0.22.03] - 2026-03-22
- Fix: **CORS-Sicherheitsrichtlinien verschärft**. Erlaubte Origins für MFA- und Danger-Funktionen wurden explizit festgelegt (`abi-planer-27.de`, `abi-planer-75319.web.app`, `abi-planer-75319.firebaseapp.app`), um robustere Cross-Origin Requests zu ermöglichen.

## [0.22.02] - 2026-03-22
- Fix: **CORS-Fehler bei MFA/Danger Functions behoben**. Die Funktionen `setup2FA`, `verifyInitial2FA`, `disable2FA` und `authorizeDangerAction` haben nun explizit gesetzte CORS-Optionen und Regionen (`europe-west3`).
- Fix: **Modul-Inkonsistenz in `cron.ts` behoben**. Der Export und Import von `emptyAllAlbums` wurde vereinheitlicht, um Build-Fehler zu vermeiden.

## [0.22.01] - 2026-03-22
- Fix: **Registrierungs-Prozess & Kurssystem optimiert**. Ladezustand für die Kursauswahl hinzugefügt und robustere Fallbacks ("Kurs 1" bis "Kurs 7") im gesamten System implementiert.
- UI: **Feedback-Sortierung verbessert**. Neue und unbearbeitete Meldungen werden nun priorisiert oben angezeigt.

## [0.21.28] - 2026-03-22
- Security: **Super Danger Zone Framework**. Einführung eines mehrstufigen Sicherheitssystems für kritische Admin-Aktionen (z.B. Karten-Wipes).
- Security: **2FA (TOTP) Support**. Admins können nun die Zwei-Faktor-Authentisierung (Google/Apple Authenticator) in ihrem Profil aktivieren, um Zugriff auf die Danger Zone zu erhalten.
- Feature: **24h Delay & Reversibility**. Kritische Aktionen treten erst nach einer 24-stündigen Wartezeit in Kraft. Während dieser Zeit können Admins die Aktion jederzeit über den neuen "STOPP (Abbrechen)" Button rückgängig machen.
- UI: **Globaler Countdown-Banner**. Ein neuer Banner informiert alle Nutzer transparent über bevorstehende System-Operationen mit einem Live-Countdown.
- Backend: **Automated Execution via Cloud Functions**. Ein neuer Cron-Job prüft alle 15 Minuten auf fällige Aktionen und führt diese automatisch aus.
- Feature: **System-Test (Dry Run)**. Eine neue Test-Aktion in der Danger Zone erlaubt es Admins, den kompletten Sicherheitsworkflow gefahrlos zu testen.
- Security: **Audit-Logging**. Alle Phasen einer Danger-Action (Planung, Abbruch, Ausführung, Fehler) werden lückenlos im System-Log protokolliert.

## [0.21.26] - 2026-03-22
- Fix: **Fallback-Kursnamen korrigiert**. Die Standardkurse wurden von 12A-12G auf "Kurs 1" bis "Kurs 7" umgestellt, um der tatsächlichen Kursstruktur besser zu entsprechen.

## [0.21.27] - 2026-03-22
- Fix: **Kursauswahl in der Registrierung verbessert**. Ein Ladezustand für Kurse wurde hinzugefügt und die Fallback-Liste auf 7 Kurse erweitert, um sicherzustellen, dass Nutzer auch bei langsamer Firestore-Verbindung auf mobilen Geräten alle Kurse zur Auswahl haben.

## [0.21.26] - 2026-03-22
- Security: **Firestore Rules aktualisiert**. Authentifizierte Nutzer dürfen nun die Lehrer-Sammlungen anderer Nutzer lesen, um diese auf den Profilseiten anzuzeigen. Schreibrechte bleiben weiterhin auf den jeweiligen Besitzer beschränkt.

## [0.21.25] - 2026-03-22
- Fix: **Anzeige der Lehrer-Sammlung auf Profilen korrigiert**. Ein Filterfehler verhinderte, dass Karten in der Profil-Vorschau angezeigt wurden. Der Standard-Filter wurde für Profile auf "Nur Entdeckte" angepasst, um die eigene Sammlung korrekt darzustellen.

## [0.21.24] - 2026-03-22
- UI: **Design der Karten-Rückseiten verbessert**. Die Rückseiten der Lehrer-Sammelkarten haben nun deutlich mehr Kontrast, einen subtilen Leuchteffekt im Zentrum und eine besser lesbare Beschriftung, um die Benutzerfreundlichkeit auf mobilen Geräten zu erhöhen.

## [0.21.23] - 2026-03-22
- Feature: **Lehrer-Album Vorschau-Modus**. Auf Profilseiten wird nun standardmäßig nur eine Vorschau der 5 besten Karten (nach Level/Seltenheit) angezeigt. Ein "Mehr anzeigen"-Button ermöglicht das vollständige Ausklappen der Sammlung, um die Übersichtlichkeit der Profilseiten zu verbessern.

## [0.21.22] - 2026-03-22
- Fix: **Layout der Profilseiten optimiert**. Das Lehrer-Album wird auf Profilseiten nun nicht mehr horizontal gequetscht, sondern nutzt die volle verfügbare Breite (max-w-6xl), während die Profil-Informationen weiterhin kompakt (max-w-2xl) dargestellt werden.

## [0.21.21] - 2026-03-22
- Fix: **TypeScript Build-Fehler behoben**. Fehlender Import des `Profile`-Typs in `TeacherAlbum.tsx` hinzugefügt, der den Produktions-Build verhinderte.

## [0.21.20] - 2026-03-22
- Fix: **Versionsanzeige synchronisiert**. Die Version in der Fußzeile (Footer) liest nun direkt aus der `VERSION`-Datei. Zudem wurden alle Vorkommen in `package.json` und der Hilfe-Seite auf den neuesten Stand (v0.21.20) gebracht.

## [0.21.19] - 2026-03-22
- UI: **Hilfe-Seite Updates**. Manuelle Aktualisierungen an den FAQ-Kategorien und Vorbereitung für die neue App-Version.

## [0.21.18] - 2026-03-22
- UI: **Album auf Profilseite integriert**. Das Lehrer-Album ist nun sowohl auf der eigenen Profilseite als auch auf den öffentlichen Profilen anderer Nutzer einsehbar.
- Refactor: `useUserTeachers` Hook und `TeacherAlbum` Komponente unterstützen nun die Anzeige von Sammlungen anderer Nutzer.
- Feature: **Lehrer-Lootpool Vereinheitlichung**. Das Teacher-Rarity-Voting nutzt nun direkt den Lehrer-Pool aus den globalen Einstellungen als Datenbasis.
- Admin: **Sofortiges Voting**. Neu hinzugefügte Lehrer in den globalen Einstellungen werden nun automatisch im Voting-Pool initialisiert und sind sofort für Abstimmungen verfügbar.
- UI: **Hilfe-Seite aktualisiert**. Neue Kategorie "Sammelkarten & Lehrer" im FAQ-Bereich hinzugefügt.
- Logic: **Admin-Initialisierung**. Beim Hinzufügen oder Importieren von Lehrern im Admin-Bereich wird nun direkt ein korrespondierender Eintrag in der Voting-Datenbank (`teachers` Collection) erstellt.

## [0.21.17] - 2026-03-22
- UI: **Album-Statistiken hinzugefügt**. Das Lehrer-Album zeigt nun oben Statistiken über die Anzahl der entdeckten Lehrer, die insgesamt geöffneten Packs und die Gesamtzahl der gesammelten Karten an.
- Logic: **Tracker für geöffnete Packs**. Ein neuer `total_opened` Counter wurde in die `booster_stats` integriert, um die Langzeit-Statistik zu ermöglichen.
- Fix: **Build-Fehler behoben (Typen)**. Ein technischer Fehler in der `src/types/database.ts` wurde behoben, durch den die `total_opened` Eigenschaft in den `booster_stats` fehlte.

## [0.21.16] - 2026-03-22
- UI: **Verbleibende Booster-Anzeige verbessert**. Der Button "Noch einmal versuchen" zeigt nun die Anzahl der verbleibenden Packs in Klammern an. Zusätzlich wird der Status-Badge nun auch nach dem Öffnen eines Packs eingeblendet und die Darstellung von mehr als 2 verfügbaren Boostern (Bonus-Packs) wurde korrigiert.

## [0.21.15] - 2026-03-22
- Fix: **Wahrscheinlichkeiten für Mythische Karten korrigiert**. Ein Fehler in der Ziehungs-Logik wurde behoben, durch den mythische Karten eine Wahrscheinlichkeit von 0% hatten. Sie können nun wieder korrekt aus Boostern gezogen werden.
- UI: **Standard-Lehrer-Pool erweitert**. Die `DEFAULT_TEACHERS` enthalten nun auch ein Beispiel für die Seltenheit "Mythisch".

## [0.21.14] - 2026-03-22
- UI: **Intelligente Umfragen-Sortierung**. Unbeantwortete Umfragen werden nun automatisch am Anfang der Liste angezeigt.
- UI: **Dynamische Lehrer-Umfrage**. Wenn alle Lehrer bewertet wurden, rückt die Seltenheits-Umfrage ans Ende der Seite. Im Landscape-Modus entspricht sie nun exakt der Breite der Standard-Umfragen.
