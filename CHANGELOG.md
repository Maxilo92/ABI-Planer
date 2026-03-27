# Changelog

## [0.27.00] - 2026-03-27
- Feature: **Booster Shop & Wirtschaftssystem**. Einführung eines (vorerst simulierten) Shops zum Erwerb zusätzlicher Booster-Packs.
    - **Drei Pakete**: Starter Pack (1), Booster Bundle (5) und Elite Box (12) mit ansprechenden 3D-Visualisierungen.
    - **Monatliche Limits**: Zur Wahrung des Spielgleichgewichts und zum Jugendschutz wurden Limits eingeführt (10/5/2 Käufe pro Monat).
    - **Sichere Transaktionen**: Der Kaufprozess wurde vollständig in eine Cloud Function ausgelagert, um Manipulationen zu verhindern.
- Feature: **Transparenz-Zentrale für Wahrscheinlichkeiten**. Neue Info-Seite (`/sammelkarten/info`) mit exakten Drop-Rates für alle Seltenheiten und Varianten.
    - **Terminologie-Klarheit**: Eindeutige Unterscheidung zwischen "Karten" und "Booster Packs" im gesamten System.
    - **Rechtliche Absicherung**: Integration von Hinweisen zum Jugendschutz und zum Ausschluss materieller Werte.
- Security: **Firestore-Härtung**. Das Feld `booster_stats` wurde in den Sicherheitsregeln gegen direkte Client-Schreibzugriffe gesperrt.
- UI: **Veredeltes Shop-Design**. Hochwertige CSS-basierte Visualisierungen für Booster-Packs und Kartenstapel sowie ein neues Erfolgs-Overlay nach dem Kauf.
- Fix: **Cloud Function Datenbank-Routing**. Fehler behoben, bei dem Funktionen fälschlicherweise auf die Default-Datenbank statt auf `abi-data` zugreifen wollten.
- Fix: **Theme-Konsistenz**. Farbanpassungen der Info-Seite an das globale System-Theme (Dark Mode Support).

## [0.26.48] - 2026-03-27
- Hotfix: **Fehlendes Icon-Import korrigiert**. Ein `ReferenceError` wurde behoben, der durch einen versehentlich entfernten Import von `MoreVertical` in der Admin-Zentrale verursacht wurde.

## [0.26.47] - 2026-03-27
- Feature: **Begründetes Warn- & Sperrsystem**. Admins können Nutzer nun gezielt verwarnen oder zeitlich begrenzt sperren.
    - **Sperr-Dialog**: Beim Setzen eines Timeouts muss nun zwingend eine Begründung angegeben werden. Die Dauer ist frei wählbar (in Stunden).
    - **Nutzer-Overlay**: Gesperrte Nutzer sehen nun ein bildschirmfüllendes Overlay mit der verbleibenden Dauer und dem exakten Grund der Sperre. Der Zugriff auf alle Funktionen ist währenddessen blockiert.
    - **Warn-System**: Wird eine Dauer von 0 Stunden gewählt, erhält der Nutzer beim nächsten Besuch einen auffälligen, aber wegklickbaren Warn-Banner am oberen Bildschirmrand mit dem administrativen Hinweis.
    - **Transparenz**: Sperrgründe werden in der Admin-Tabelle nun als Tooltip auf dem "Sperre"-Badge angezeigt.

## [0.26.46] - 2026-03-27
- Fix: **Registrierungs-Validierung verschärft**. Der vollständige Name kann nun nicht mehr durch Überspringen von Schritten leer gelassen werden; alle Pflichtfelder werden vor der finalen Erstellung erneut geprüft.
- Fix: **Sammelkarten-Layout stabilisiert**. Die Karten "springen" beim Umdrehen nicht mehr nach oben/unten, da die Texte für "Tippen" und "Chancen" nun in einem Container mit fester Mindesthöhe liegen.
- Fix: **Kein Clipping mehr bei Lehrernamen**. Die Zeilenhöhe (`leading`) wurde angepasst und vertikales Padding hinzugefügt, damit Umlaute wie 'Ä' oder hohe Zeichen oben nicht mehr abgeschnitten werden.
- UI: **Flimmerfreie Booster-Öffnung**. Die alten Ergebnisse werden nun erst ausgeblendet, wenn die neuen Karten wirklich bereitstehen, was das visuelle Flimmern beim schnellen Öffnen beseitigt.
- UI: **Permanente Chancen-Anzeige im Debug-Modus**. Die Wahrscheinlichkeiten für jede Karte werden nun auch in der 10er-Pack-Übersicht angezeigt, wenn der Debug-Modus (Stern-Icon) aktiv ist.
- Feature: **Erweiterte Feedback-Sichtbarkeit**. Nutzer sehen im Feedback-Tab nun nicht nur ihre eigenen, sondern alle öffentlichen Meldungen anderer Personen. Eigene private Meldungen bleiben weiterhin für den Ersteller sichtbar.

## [0.26.45] - 2026-03-27
- Feature: **Erhöhung der Willkommens-Belohnung**. Neu geworbene Nutzer erhalten nun **5 Booster-Packs** (statt bisher 3) als Start-Bonus nach der Profil-Vervollständigung.
- Fix: Alle System-Benachrichtigungen und internen Tests wurden auf den neuen Wert von 5 Packs aktualisiert.

## [0.26.44] - 2026-03-27
- Documentation: **Referral-Programm Logik-Verifizierung**. Vollständige Überprüfung und Dokumentation des Freunde-werben-Freunde Systems.
    - **Auszahlungs-Logik**: Bestätigung der atomaren Vergabe von 5 Boostern für geworbene Nutzer und skalierenden Belohnungen (2 bis 10 Booster) für Werber.
    - **Sicherheits-Check**: Verifizierung der monatlichen 30-Booster-Grenze und der Idempotenz-Prüfung gegen Doppel-Belohnungen.
    - **Redirect-Check**: Validierung des `/r/[id]` Kurzlink-Systems zur nahtlosen Registrierungs-Integration.

## [0.26.43] - 2026-03-26
- UI: **Layout-Fix für Sammelkarten-Opening (iPhone 12 Pro Max)**. Die Karten beim Öffnen von Packs berühren sich nun nicht mehr auf Geräten mit schmalerem Display.
    - **Erhöhte Abstände**: Die horizontalen Gaps wurden im Grid vergrößert (`gap-x-4` -> `gap-x-6`).
    - **Anpassbare Breite**: Die Kartenbreite auf Mobilgeräten wurde minimal reduziert (`w-42vw` -> `w-40vw`), um mehr Platz für Gaps zu schaffen.
    - **Erzwungenes Padding**: Jede Karte erhält nun ein minimales `p-0.5`, um Überlappungen durch Animationen oder Schatten zu verhindern.
    - **Mass-Opening Optimierung**: Auch in der Listenansicht bei 10 Packs wurden die Abstände erhöht.
- UI: **Systemweites 'Compact Toggle' Design-Muster**. Alle `TabsList`-Komponenten wurden auf das `w-fit` Muster umgestellt, um überdimensionierte Toggles auf Mobilgeräten zu verhindern. Betrifft: Einstellungen, Admin-Zentrale, Logs, Todos und Kalender.
- Fix: **Robuste Tabs-Selektoren**. Die `Tabs`-Komponente wurde technisch überarbeitet, um `data-orientation` Attribute direkt für das Styling zu nutzen, anstatt sich auf fehleranfällige Eltern-Gruppen zu verlassen.

## [0.26.42] - 2026-03-26
- Feature: **Globale Belohnungs-Popups**. Das System für Belohnungs-Hinweise ("unseen gifts") wurde globalisiert. Nutzer erhalten nun auf jeder Seite (nicht nur auf dem Dashboard) sofort einen Hinweis, wenn sie neue Packs erhalten haben.
- Feature: **Referral-Belohnungen mit Popup**. Wenn Nutzer über das Freunde-Werben-Programm Bonus-Booster erhalten, wird nun automatisch ein globales Popup ausgelöst, über das die Belohnung direkt eingesehen werden kann. Dies gilt sowohl für den Werbenden als auch für den neu registrierten Nutzer.

## [0.26.41] - 2026-03-26
- Feature: **Booster-Empfehlungsprogramm implementiert**. Nutzer können nun Freunde über personalisierte Kurzlinks (`/r/code`) einladen. 
    - **Skalierende Belohnungen**: Der Werber erhält für die erste Einladung 2 Booster, für jede weitere +1, bis zu einem Maximum von 10 Boostern pro Freund.
    - **Neuzugänge**: Geworbene Nutzer erhalten nach Profil-Vervollständigung sofort 5 Booster.
    - **Sicherheit**: Ein monatliches Limit von 30 Boostern pro Werber wurde serverseitig via Cloud Function (Firestore Transactions) implementiert.
- UI: **Einstellungen-Zentrale restrukturiert**. Einführung eines Tab-Interfaces zur besseren Gruppierung von Konto-Optionen, Darstellungs-Präferenzen und Verwaltungs-Tools. Die wichtigsten Optionen (Profil, Darstellung/Theme, Feedback) befinden sich nun direkt im ersten Tab "Allgemein". Sekundäre Funktionen wie das Einladungs-System und die Abmelde-Funktion wurden in den zweiten Tab "Konto & Boni" verschoben.
- Cleanup: **Empfehlungsseite entschlackt**. Redundante DSGVO-Texte wurden entfernt, da diese bereits durch die globale Datenschutzerklärung abgedeckt sind.

## [0.26.40] - 2026-03-26
- UI: **Konsistente, kompakte Toggles systemweit**. Nach den Anpassungen in den Einstellungen wurden nun alle verbleibenden Tab-Listen (Toggles) auf `w-fit` umgestellt (u.a. in Admin-Zentrale, Logs, Todo-Liste, Kalender). Toggles nehmen nun systemweit nur noch den benötigten Platz am oberen Rand ein und wirken auf Mobilgeräten nicht mehr überdimensioniert.

## [0.26.39] - 2026-03-26
- Fix: **Tabs-Layout korrigiert (Top-to-Bottom Bug)**. Ein Fehler in der Tailwind-Selektoren-Logik der `Tabs`-Komponente wurde behoben, der dazu führte, dass Tab-Listen und Inhalte fälschlicherweise nebeneinander (vertikal gestreckt) statt übereinander dargestellt wurden. Die Komponente nutzt nun korrekte `data-[orientation]` Selektoren.
- UI: **Kompaktere Toggles in Einstellungen & Admin**. Die Tab-Leisten (Toggles) in den Einstellungen und im Sammelkarten-Manager nehmen auf Mobilgeräten nun nicht mehr die volle Breite ein, sondern bleiben kompakt ("w-fit") am oberen Rand, wie vom Nutzer gewünscht.

## [0.26.38] - 2026-03-26
- Fix: **Base UI Button-Logik verfeinert**. Die automatische Deaktivierung von `nativeButton` wurde für `Dialog` und `DropdownMenu` Komponenten zurückgenommen, da sie bei der Verwendung von Standard-Buttons zu Fehlern führte. Stattdessen wird `nativeButton={false}` nun gezielt an Stellen eingesetzt, an denen Triggerelemente keine nativen Buttons sind (z.B. Text-Links im Todo-Dashboard).

## [0.26.37] - 2026-03-26
- Fix: **Build-Fehler im Dropdown-Menu behoben**. Ein Syntaxfehler in `src/components/ui/dropdown-menu.tsx` wurde korrigiert.
- Fix: **Next.js Build-Isolation**. Der `scripts`-Ordner wird nun explizit von der TypeScript-Kompilierung ausgeschlossen, um Konflikte zwischen Node-Skripten und dem Web-Frontend zu vermeiden.
- Fix: **Purity-Verletzungen (React Hooks) behoben**. Unzulässige Aufrufe von unreinen Funktionen wie `Date.now()` oder `Math.random()` während des Render-Prozesses wurden in stabile Zustände (`useState` + `useEffect`) überführt.
- DX: **ESLint Performance & Scope optimiert**. Die Linting-Konfiguration ignoriert nun konsequent Build-Artefakte und externe Unterprojekte (`CardDesign`), was die Fehlerquote und Analysezeit drastisch reduziert.

## [0.26.36] - 2026-03-26
- Fix: **Weitere Base UI Button-Warnungen behoben**. Die automatische Deaktivierung von `nativeButton` bei Verwendung des `render`-Props wurde nun auch auf `DialogTrigger`, `DialogClose`, `DropdownMenuTrigger` und `DropdownMenuSubTrigger` ausgeweitet. Dies eliminiert verbleibende Konsolen-Fehler, wenn z.B. Spans oder Icons als Trigger verwendet werden.

## [0.26.35] - 2026-03-26
- Feature: **Vollständige Nutzerlöschung (Full Wipe)**. Das Löschen eines Nutzers in der Admin-Verwaltung führt nun automatisch zur Löschung des zugehörigen Firebase-Authentication-Kontos sowie zur Bereinigung aller nutzerspezifischen Daten (Sammelkarten, Geheimnisse, Stimmen, Geschenke) über einen neuen Cloud-Function-Trigger.

## [0.26.34] - 2026-03-26
- Fix: **Berechtigungsfehler im Referral-System behoben**. Fehlende Firestore-Regeln für die `referrals`-Collection wurden ergänzt, sodass Nutzer ihre eigenen Einladungs-Statistiken nun korrekt laden können.
- Fix: **Base UI Button-Rendering**. Ein technischer Fehler im `Button`-Component wurde behoben, der zu Konsolen-Warnungen/Fehlern führte, wenn Buttons als Links (`render={<Link ... />}`) gerendert wurden.
- Fix: **Referral-Code Fallback**. Bestehende Nutzer, die noch keinen `referral_code` in ihrem Profil haben, erhalten nun automatisch einen temporären Code basierend auf ihrer ID, damit sie das Einladungs-System sofort nutzen können.
- Security: **Profil-Daten gehärtet**. Die Felder `referral_code` und `referred_by` wurden in den Firestore-Regeln gegen nachträgliche Manipulation durch den Nutzer gesperrt.

## [0.26.33] - 2026-03-26
- Feature: **Freunde-werben-Freunde Programm eingeführt**. Nutzer können nun über ihr Einstellungs-Dashboard Freunde einladen.
    - Jeder Nutzer erhält einen persönlichen Einladungs-Code (`/r/XXXXXX`).
    - Neue Nutzer können bei der Registrierung über einen Empfehlungs-Link automatisch zugeordnet werden.
    - Sowohl der Werber als auch der Geworbene erhalten Belohnungen (Booster-Packs) für erfolgreiche Registrierungen.
- Feature: **Referral Dashboard**. Eine neue Seite unter `/einstellungen/referrals` zeigt den aktuellen Status, eingeladene Freunde und verdiente Belohnungen an.
- Feature: **Integrierte Registrierungs-Abläufe**. Das Registrierungs-Formular unterstützt nun `Suspense` für stabilere Abfragen von URL-Parametern (`?ref=...`).

## [0.26.32] - 2026-03-26
- Refactor: **Popup senden in eigene Unterseite ausgelagert**. Das komplexe Modal zum Versenden von Popups und Packs in der Benutzerverwaltung wurde entfernt. Alle entsprechenden Aktionen ("Popup senden" einzeln oder als Massenaktion) leiten nun nahtlos auf die dedizierte "Kommunikations-Zentrale" (`/admin/send`) weiter.
- Feature: **Admin Main Schnellauswahl auf Sendeseite**. Auf der `/admin/send` Seite wurde ein Button hinzugefügt, um Haupt-Administratoren mit einem Klick zur Empfängerliste hinzuzufügen.

## [0.26.31] - 2026-03-26
- Feature: **Belohnungssystem für Umfragen eingeführt**. Nutzer erhalten nun für jede erste Teilnahme an einer regulären Umfrage (z.B. Motto, Menü) sofort 1 zusätzliches Booster-Pack als Dankeschön.
- Feature: **Belohnungen für Lehrer-Bewertungen (Crowdsourced Rarity)**. Um die Beteiligung bei der Festlegung der offiziellen Kartenseltenheiten zu fördern, erhalten Nutzer nun Booster-Packs für ihre Bewertungen:
    - 1 Pack für die allererste Bewertung.
    - 1 Pack für die 5. Bewertung.
    - Danach 1 Pack für jede weiteren 10 Bewertungen (15, 25, 35...).
- Improvement: **Transaktionssichere Belohnungsvergabe**. Alle Belohnungen werden über atomare Firestore-Transaktionen vergeben, um Konsistenz sicherzustellen und Missbrauch zu verhindern.

## [0.26.30] - 2026-03-26
- Feature: **Admin-Popup-System umfassend überarbeitet**. Das Senden von Popups an Nutzer wurde in "Pack-Schenkungen" und "Multicast-Nachrichten" aufgeteilt, um die Unterscheidung zwischen Belohnungen und reinen Informationen zu erleichtern.
- Feature: **Live-Vorschau für Admin-Popups**. Im Sendedialog wird nun eine Echtzeit-Vorschau des finalen Popups (inkl. Titel, Text, Icons und Buttons) angezeigt, damit Admins das Ergebnis vor dem Versand prüfen können.
- Feature: **Nutzer-Kontextmenü in der Admin-Verwaltung erweitert**. "Popup senden" ist nun direkt über das Aktions-Menü (3 Punkte) jedes einzelnen Nutzers erreichbar.
- Fix: **Layout-Kollaps in Dropdown-Menüs behoben**. Dropdown-Menüs (Kontextmenüs) in der Benutzerverwaltung wurden "entquetscht" und nutzen nun eine angemessene Mindestbreite, auch wenn sie durch kleine Icons ausgelöst werden.
- Feature: **Admin Main-Schnellauswahl**. Im Popup-Dialog wurde eine Schaltfläche hinzugefügt, um den Hauptadministrator ("admin_main") mit einem Klick zur Empfängerliste hinzuzufügen.

## [0.26.29] - 2026-03-26
- Refactor: **Alte Karten-Skalierungslogik vollständig ersetzt**. Die `TeacherCard`-Komponente nutzt kein `cqw` mehr in instabilen Umgebungen, sondern ein neues Prozent-/`clamp`-basiertes Layoutsystem für Abstände, Icons und Typografie (unterstützt durch explizites `container-type: inline-size`). Dadurch bleibt das Kartendesign bei unterschiedlichen Bildschirmgrößen stabil, ohne Deformationen.
- Fix: **Kartenöffnung (Reveal) auf Smartphones stabilisiert**. Das redundante Back-Overlay in `page.tsx` wurde entfernt und ein Layout-Kollaps behoben, der Karten auf 0px Breite schrumpfen ließ; stattdessen nutzt die `TeacherCard` nun einen nativen 3D-Flip-Effekt (`preserve-3d`, `backface-hidden`). Das verhindert das Verschwinden von Karten beim Aufdecken auf iOS/Safari und sorgt für eine flüssige Animation.
- Fix: **Skalierung ohne Detailverlust strukturell gehärtet**. Kritische Container-Queries innerhalb der Karte wurden so angepasst, dass sie sich auf den direkten Karten-Container beziehen, was Deformationen bei extrem kleinen oder großen Viewports verhindert.

## [0.26.28] - 2026-03-26
- Fix: **Booster-Öffnungen werden nicht mehr geloggt**. Die Events für Einzel- und 10er-Pack-Opening wurden aus dem Aktivitäts-Log entfernt, damit die Logs nicht mit hochfrequenten Loot-Einträgen überflutet werden.
- Fix: **Kartenöffnung auf Mobile/iPad responsiv stabilisiert**. Das Reveal-Layout nutzt jetzt ein klares Grid: auf kleinen Geräten beginnen die Karten in einer zweiten Reihe statt sich zu stark zu verkleinern, und auf iPad wurde der Abstand/Max-Width so angepasst, dass Karten sich nicht mehr berühren.
- Fix: **Kartenskalierung bei der Ziehung auf allen Displays vereinheitlicht**. Reveal-Karten verwenden nun robuste Mindest-/Maximalbreiten mit größeren Grid-Abständen, damit sie weder kollidieren noch zu klein werden; zusätzlich wurde die Vergrößerung von `black_shiny_holo`-Treffern reduziert, damit keine Karte aus dem Layout „herauswächst“.
- Hotfix: **Regression bei Reveal-Kartengröße behoben**. Die Breitenlogik wurde auf kompatible responsive Tailwind-Klassen zurückgestellt (ohne `min(...)`-Arbitrary-Value), damit Karten wieder zuverlässig in voller Größe gerendert werden.
- Fix: **Sammelkarten-Manager auf Mobile besser nutzbar**. Die großen Tabs/Toggles wurden auf feste Trigger-Größen gebracht, horizontal scrollbar gemacht und das Layout so angepasst, dass keine überdimensionierten Leerräume mehr entstehen.
- Fix: **Tabs im Sammelkarten-Manager korrekt über dem Inhalt positioniert**. Das Tabs-Layout wurde auf eine eindeutige vertikale Anordnung gesetzt, sodass die Toggle-Leiste direkt über den Kacheln liegt und links kein unnötiger Leerraum mehr entsteht.
- Fix: **Mobile Kartenöffnung gegen Mini- und Flip-Ausfall gehärtet**. Reveal-Karten erhalten auf kleinen Viewports eine feste Mindestbreite, damit verdeckte Karten nicht zu klein rendern. Zusätzlich wurden WebKit-kompatible 3D-/Backface-Regeln ergänzt, damit aufgedeckte Karten auf iOS/Safari beim Flip nicht verschwinden.
- Fix: **Booster-Reveal auf Smartphones weiter stabilisiert**. In der Öffnungsansicht wird die Karte nun durch ein robustes Back-Overlay verdeckt statt per 3D-Flip zwischen Front/Back zu wechseln. Das verhindert mobile Rendering-Aussetzer („Karte verschwindet nach Tap“) zuverlässig und hält die Karten zugleich deutlich größer.

## [0.26.27] - 2026-03-25
- Fix: **Korrekte Varianten-Wahrscheinlichkeit im Debug-Modus**. Ein Logikfehler in der Berechnung der Wahrscheinlichkeiten für Karten-Varianten (Holo, Shiny etc.) wurde behoben. Der Debug-Modus zeigt nun die exakte, korrekte Drop-Chance für die gezogene Seltenheit *und* Variante an.

## [0.26.26] - 2026-03-25
- Fix: **Genaue Wahrscheinlichkeiten im Debug-Modus**. Die Wahrscheinlichkeitsberechnung für gezogene Karten wurde korrigiert und berücksichtigt nun auch die Chance für die jeweilige Variante (Normal, Holo, Shiny etc.), was zu einer präzisen Anzeige der tatsächlichen Drop-Chance führt.
- Fix: **Zuverlässiges Aufdecken der Karten**. Ein Bug wurde behoben, bei dem das Umdrehen einer Karte nicht korrekt an die Seite gemeldet wurde. Die Klick-Logik wurde zentralisiert, sodass das Aufdecken nun zuverlässig den Gesamtfortschritt aktualisiert und die Navigations-Buttons korrekt erscheinen.
- Fix: **Build-Fehler behoben**. Ein doppelter schließender Tag (`/>`) in der `sammelkarten`-Seite, der zu einem Parsing-Fehler im Build-Prozess führte, wurde entfernt.
- Fix: **Stabiles Karten-Reveal beim Booster-Opening**. Ein Fehler wurde behoben, durch den aufgedeckte Karten in der Booster-Ansicht wieder verdeckt werden konnten, was das Erscheinen der Navigations-Buttons verhinderte. Karten bleiben nun nach dem ersten Klick permanent aufgedeckt, was für einen zuverlässigen und klaren Ablauf sorgt.
- Fix: **Überlappende Sammelkarten auf dem iPad behoben**.
    - Stacking-Context optimiert: Booster-Pack `zIndex` erhöht, um Überlappungen während der Ripping-Animation zu vermeiden.
    - Layout-Anpassung: Kartenbreite auf Tablets (`sm:w-52`) reduziert, um unerwünschte Zeilenumbrüche im Hochformat zu verhindern.
    - Grid-Fix: `hover:z-10` und `active:z-10` im Album hinzugefügt, damit vergrößerte Karten bei Touch-Bedienung nicht hinter Nachbarn verschwinden.

## [0.26.21] - 2026-03-25
- Feature: **Debug-Modus für Kartenziehungen**.
    - Ein neuer Debug-Toggle (Stern-Icon) wurde hinzugefügt, um exakte Wahrscheinlichkeiten anzuzeigen.
    - Anzeige der individuellen Ziehungs-Chance für jede enthüllte Karte basierend auf den Slot-Gewichtungen.
    - Berechnung und Anzeige der Gesamt-Wahrscheinlichkeit des gesamten Packs (unter Berücksichtigung des Godpack-Faktors).

## [0.26.20] - 2026-03-25
- Fix: ** Upgrade-Animation gebändigt**. Ein Fehler in der Animations-Steuerung wurde behoben, durch den Karten bei einem Level-Up unkontrolliert mehrfach rotierten. Die Drehung wird nun präzise einmalig pro Upgrade ausgelöst und die Zustände für das Level-Badge stabiler synchronisiert.
- Fix: **Album-Interaktion veredelt**. Karten in der Album-Übersicht drehen sich beim Anklicken nicht mehr um. Ein Klick öffnet nun direkt die Detailansicht, was für eine flüssigere Nutzerführung sorgt. In der Detailansicht und beim Öffnen von Boostern bleiben die Karten wie gewohnt interaktiv drehbar.

## [0.26.19] - 2026-03-25
- Feature: **10er Pack-Opening für "Suchtis"**.
    - Nutzer mit mindestens 10 Boostern im Inventar können diese nun gleichzeitig mit einem Klick öffnen.
    - Neue Ergebnis-Ansicht: Eine scrollbare Liste zeigt alle 10 Packs untereinander (3 Karten + Pack-Visual pro Zeile).
    - Individuelle Godpack-Highlights innerhalb der Massen-Öffnung.
    - Atomare Transaktion im Backend: Das Budget für alle 10 Packs wird in einem einzigen Vorgang geprüft und abgezogen.

## [0.26.18] - 2026-03-25
- Fix: **Synchronisierte Karten-Drehung im Album**. Ein Fehler wurde behoben, durch den Karten im Album unerwünscht rotierten, wenn die Detailansicht geöffnet oder dort eine Karte umgedreht wurde. Die Animations-Logik wurde auf ein deklaratives Modell umgestellt, das stabiler gegenüber Parent-Re-renders ist und den manuellen Flip-Status besser beibehält.

## [0.26.17] - 2026-03-25
- Performance: **Optimierung der Upgrade-Animationen**.
    - Die Partikel-Effekte beim Level-Up wurden grundlegend optimiert: Statt komplexer SVGs werden nun einfache, Hardware-beschleunigte CSS-Shapes verwendet.
    - Die Anzahl der Partikel wurde halbiert (von 24 auf 12) und die Berechnungen stabilisiert (Memoization), um Ruckeln beim Öffnen mehrerer Packs zu verhindern.

## [0.26.16] - 2026-03-25
- UI: **Platzsparende Filter-Grids**. Die Filter für Seltenheit und Karten-Varianten im Album wurden in kompakte, quadratische Grids umgewandelt. Dies verhindert unerwünschtes Scaling bei unterschiedlichen Textlängen und macht das Menü deutlich übersichtlicher.

## [0.26.15] - 2026-03-25
- UI: **Veredelte Upgrade-Animationen & Responsive Fixes**.
    - Die Level-Up Animation wurde auf eine volle 360°-Horizontal-Rotation umgestellt.
    - Das schwebende Badge zeigt nun den präzisen Level-Übergang (z.B. "LVL 3 → 4") an.
    - **Responsive Layout**: Booster-Cards brechen auf kleinen Bildschirmen nun in zwei Zeilen um.
    - **Bugfix**: Die Karten-Drehung in der Detailansicht und im Album funktioniert wieder einwandfrei durch Konsolidierung der Animations-Logik.

## [0.26.15] - 2026-03-25
- UI: **Großes Shiny-Effekt Overhaul**.
    - Der Shiny-Effekt wurde komplett neu entworfen, um harte Kanten in den Reflektionen vollständig zu eliminieren.
    - Verwendung eines breiten Bell-Curve-Verlaufs für extrem weiche Übergänge.
    - Die Animationsgeschwindigkeit wurde weiter auf 12s verlangsamt für einen natürlicheren, metallischen Schimmer.
    - Zusätzliche subtile Licht-Layer für mehr Tiefe.

## [0.26.14] - 2026-03-25
- UI: **Karten-ID auf gesperrten Karten**. Auch gesperrte Lehrer-Karten zeigen nun ihre Sammlungs-Nummer (unten links) an, um die Orientierung im Album zu erleichtern.

## [0.26.13] - 2026-03-25
- UI: **Refined Shiny Effekt**. Weichere Gradienten und langsamere Animationen für einen hochwertigeren Look.

## [0.26.12] - 2026-03-25
- UI: **Komprimiertes Filter-Menü & Toggle-Sortierung**.
    - Das Filter-Menü im Album wurde komplett überarbeitet und für mehr Übersichtlichkeit komprimiert.
    - **Toggle-Sortierung**: Ein erneuter Klick auf den aktiven Sortier-Modus kehrt nun die Sortierreihenfolge um (Aufsteigend/Absteigend), visualisiert durch neue Icons.
    - Seltenheits- und Varianten-Filter wurden platzsparend als Button-Grids gruppiert.
    - Der Besitz-Status wird nun über einen kompakten Segmented-Control gesteuert.
