# Changelog

## [0.25.01] - 2026-03-25
- Fix: **Guest Permission Stability**. Verbleibende `permission-denied` Fehler auf dem Dashboard (Poll-Votes) und in der Termin-Komponente (Profile-Collection) wurden behoben, indem Abfragen für unauthentifizierte Nutzer übersprungen werden. Dies stellt eine absolut saubere Konsole für den AdSense-Crawler sicher.

## [0.25.00] - 2026-03-25
- Feature: **AdSense Compliance Finalization**. Erstellung der `public/ads.txt` zur Verifizierung der Anzeigenberechtigung.
- Feature: **Datenschutz-Update**. Die Datenschutzerklärung (`/datenschutz`) wurde um die verpflichtende Google AdSense-Passage (Cookies, Datenverarbeitung) ergänzt.
- Fix: **Silent Guest Mode**. Hooks wie `useUserTeachers` und `useGiftNotices` brechen nun bei fehlender Authentifizierung sofort ab. Dies verhindert `permission-denied` Fehler in der Konsole für Gäste und Crawler, was die AdSense-Verifizierung stabilisiert.
- Fix: **RootLayout Script Cleanup**. Der fälschlicherweise hinzugefügte Import von `AuthProvider` im Layout wurde korrigiert und ungenutzte Next.js-Komponenten entfernt.

## [0.24.03] - 2026-03-25
- Fix: **AdSense Verification Stability**. Das AdSense-Skript wird nun als natives HTML-Element (`<script>`) statt über die Next.js-Komponente eingebunden, um die Erkennung durch den statischen Google-Crawler zu optimieren.
- Fix: **Quiet Banner Loading**. Der `DangerAlertBanner` unterdrückt nun Fehlermeldungen bei unzureichenden Berechtigungen (z. B. für Gäste oder Crawler), um Konsolenfehler während der Verifizierung zu vermeiden.

## [0.24.02] - 2026-03-25
- Fix: **AdSense Crawler Context**. Die `GoogleAdSense`-Komponente wartet nicht mehr auf den Authentifizierungsstatus (`loading`), um sicherzustellen, dass AdSense-Crawler den Kontext auch bei kurzen Ladezeiten sofort erfassen können.
- Fix: **Permission-Denied Logs**. Firestore-Rules für `delayed_actions` wurden angepasst, damit der Status `pending` für alle Besucher (inkl. Gästen/Crawlern) lesbar ist. Dies behebt die Konsolen-Fehler, die durch den globalen `DangerAlertBanner` verursacht wurden.

## [0.24.01] - 2026-03-25
- Fix: **Google AdSense Crawler Verification**. Das AdSense-Skript wurde global in den `<head>` des `RootLayout` verschoben und auf `strategy="beforeInteractive"` umgestellt. Dies stellt sicher, dass der AdSense-Crawler den Verifizierungscode sofort findet, unabhängig vom Authentifizierungsstatus oder Client-seitigen Ladevorgängen.
- UI: **AdSense Redundancy Cleanup**. Entfernung des redundanten Skript-Tags aus der `GoogleAdSense`-Komponente bei gleichzeitiger Beibehaltung des visuellen Anzeigen-Platzhalters.

## [0.24.00] - 2026-03-25
- Feature: **Sammelkarten Admin Suite**. Einführung eines dedizierten Admin-Dashboards unter `/admin/sammelkarten` zur vollständigen Kontrolle über den Lehrerpool, Drop-Rates und Pack-Parameter.
- Feature: **Dynamic Card Configuration**. Migration der Sammelkarten-Einstellungen von einer statischen Konfiguration zu einem dynamischen, echtzeit-steuerbaren Firestore-Dokument (`settings/sammelkarten`).
- Feature: **Pack Simulator**. Ein neues Admin-Tool zur Simulation von Tausenden von Booster-Öffnungen, um die tatsächliche Drop-Verteilung der konfigurierten Gewichte zu validieren.
- Feature: **Custom Weights & Probabilities**. Admins können nun individuelle Gewichte für alle 3 Slots in regulären und Godpacks sowie die Wahrscheinlichkeiten für alle Karten-Varianten (Shiny, Holo, Black Shiny Holo) anpassen.
- Feature: **Teacher Pool Management**. Erweiterte Funktionen zum Hinzufügen, Bearbeiten und Löschen von Lehrern im Lootpool, inklusive automatischem Sync mit der Voting-Datenbank.
- Security: **Route Protection**. Implementierung der `AdminGuard`-Komponente für einen robusten Zugriffsschutz auf administrative Routen.
- Refactor: **Frontend Integration**. Die Sammelkarten-Seite und die zugehörigen Hooks (`useUserTeachers`) nutzen nun konsistent die dynamische Konfiguration statt hartcodierter Fallbacks.

## [0.23.07] - 2026-03-25
- UI: **AdSense Refinement**. Die AdSense-Komponente hat nun ein dezentes "Anzeige"-Label und einen Platzhalter, um Layout-Shifts zu vermeiden.
- UI: **Mobile Safe Areas**. Implementierung von `pb-safe` (Safe Area Insets) für eine bessere Unterstützung des iOS Home-Indicators in der AppShell und der mobilen Navigation.
- UI: **Responsive Layout Audit**. Optimierungen der Abstände im Sammelkarten-Bereich und verbesserte Darstellung des "Booster öffnen"-Buttons auf Mobilgeräten.

## [0.23.06] - 2026-03-25

- Feature: **AdSense Integration**. Implementierung des Google AdSense Scripts als Client-Komponente (`GoogleAdSense.tsx`). Um die Nutzererfahrung für Bestandsnutzer nicht zu beeinträchtigen, werden Anzeigen initial nur für nicht-angemeldete Nutzer (Gäste) ausgespielt.

## [0.23.04] - 2026-03-24
- Bugfix: **Tailwind v4 CSS Parsing Error**. Fix für den "Unexpected end of input" Fehler durch Entfernung ungültiger `[@container]:` Varianten in `TeacherCard.tsx`. Die `cqw`-Einheiten funktionieren in v4 nativ ohne diesen Präfix.

## [0.23.03] - 2026-03-24
- UI: **Proportional Card Scaling**. Implementierung von Container-Query-Units (`cqw`), wodurch alle Kartenelemente (Icons, Schriften, Abstände) proportional zur Kartengröße skalieren. Die Karten sehen nun auf jeder Skalierung identisch aus.

## [0.23.02] - 2026-03-24
- UI: **Static Card Numbers**. Die Karten-Nummer (z. B. "005") ist nun fest an die Position des Lehrers in der globalen Liste gekoppelt und dient als eindeutige Album-ID.

## [0.23.01] - 2026-03-24
- UI: **Mobile Optimization for Cards**. Karten-Sizing und Border-Radius wurden für Mobile optimiert, um das "Pillen"-Aussehen zu beheben.
- UI: **Card Draw Logic**. Karten werden nun standardmäßig mit der Rückseite zuerst angezeigt und erst beim Umdrehen enthüllt.
- UI: **Label Cleanup**. Redundante Varianten-Labels wurden entfernt; Status-Badges (NEW/LEVEL UP) werden jetzt subtiler und nur nach dem Umdrehen angezeigt.

## [0.23.00] - 2026-03-24
- Feature: **Modern Card Redesign**. Komplettes visuelles Redesign der Lehrer-Sammelkarten mit neuen 3D-Effekten, Glasmorphismus und interaktiven Animationen.
- Feature: **Rarity-Specific Designs**. Jede Seltenheitsstufe (Common bis Legendary) besitzt nun ein eigenes, einzigartiges Design-Pattern und Farbschema.
- Feature: **Enhanced Card Variants**. Überarbeitete visuelle Overlays für Holo, Shiny-v2 und Secret Rare (Blckshiny) Varianten mit komplexen Shadern und Lichteffekten.
- UI: **Responsive Card Layout**. Optimierte Darstellung der Karten im Lehrer-Album und beim Öffnen von Booster-Packs für Mobile und Desktop.
- Refactor: **Card Component Architecture**. Einführung einer modularen `TeacherCard` Komponente mit dedizierten `RaritySymbol` und `CardEffectOverlay` Sub-Komponenten.
- Dependency: **Framer Motion Integration**. Hinzufügen von `framer-motion` für flüssige 3D-Rotationen und interaktive Karten-Interaktionen.

## [0.22.15] - 2026-03-24
- Fix: **Build Error: Duplicate `collectBooster`**. Behoben: Mehrfache Definition von `collectBooster` in `useUserTeachers.ts` wurde zusammengeführt.
- Fix: **Missing `CardVariant` Imports**. Fehlende Typ-Importe in `useUserTeachers.ts` und `TeacherAlbum.tsx` wurden hinzugefügt.
- Logic: **`getRandomVariant` Implementation**. Die fehlende Hilfsfunktion zur Generierung von Karten-Varianten (Holo, Shiny, Secret Rare) wurde implementiert und in den Zieh-Prozess integriert.
- Refactor: **Cleanup `useUserTeachers`**. Die ungenutzte und undefinierte `collectTeacher` Referenz wurde aus dem Hook-Return entfernt.

## [0.22.14] - 2026-03-24
- Feature: **Card Progression & Rarity Overhaul**. Komplettes Rebalancing der Zieh-Wahrscheinlichkeiten für ein belohnenderes Langzeit-Erlebnis.
- Feature: **Ultra Secret Variant (Black Shiny Holo)**. Einführung einer extrem seltenen Variante (1:1000 Packs) für einen geheimen Lehrer mit speziellen visuellen Effekten.
- Feature: **Godpacks**. Seltene Chance (1:2000) auf ein goldenes Booster-Pack, das ausschließlich Spezial-Varianten und höhere Seltenheiten enthält.
- UI: **Enhanced Card Visuals**. Überarbeitete visuelle Effekte für Holo, Shiny und die neue Secret Rare Variante inklusive Shimmer, Partikel-Effekten und adaptiven Rahmen.
- Logic: **Booster Rebalancing**. Mythische und Legendäre Karten wurden seltener gemacht, während die Verteilung so angepasst wurde, dass man nach ca. 900 Packs (ein Schuljahr) alle normalen Karten und die meisten Holos besitzt.

## [0.22.13] - 2026-03-24
- Feature: **Card Variants (Holo/Shiny)**. Lehrer-Karten können nun in den Varianten "Normal", "Holo" und "Shiny" gezogen und im Album gesammelt werden.
- Feature: **Small Updates für News**. Kurze Neuigkeiten können als "Small Update" markiert werden, um direkt in der Übersicht vollständig (ohne "Weiterlesen") angezeigt zu werden.
- Fix: **Booster Balancing & Navigation**. Mythische Karten sind nun seltener als Legendäre; zudem wurde die Navigation zwischen Booster-Pack und Album durch direkte Buttons verbessert.
- Fix: **Super Danger Zone Stabilität**. Die `SYSTEM_TEST_DRY_RUN` Aktion wurde korrigiert und durchläuft nun den vollständigen Protokoll-Zyklus.
- Fix: **Kalender-Creator Sichtbarkeit**. Gäste können nun korrekt sehen, wer einen Termin erstellt hat, da der Name direkt im Termin-Dokument gespeichert wird.
- Fix: **Apple Calendar Integration**. Die Referenzzeit für den Apple Kalender-Export wurde auf den Standard (2001) korrigiert.
- UI: **Finanz-Ranking Ziel-Erklärung**. Im Kurs-Ranking wurde eine Erläuterung zum individuellen Kurs-Spendenziel hinzugefügt.
- Fix: **News Markdown Detailview**. Die Markdown-Formatierung wird nun auch in der Detailansicht von News-Beiträgen korrekt gerendert.

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
