# Changelog

<!-- AGENT_NAV_METADATA -->
<!-- path: CHANGELOG.md -->
<!-- role: reference -->
<!-- read_mode: latest-first -->
<!-- token_hint: tail-only -->
<!-- default_action: read newest entries only unless a regression requires older history -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

## [1.37.2.83] - 2026-05-10

### Added

- **ABI Bot – Lerneffekt durch Nutzer-Feedback**: Der Bot kann nun aktiv aus Likes und Dislikes lernen.
    - **Personalisierter Kontext**: Bei jeder Anfrage werden die letzten 10 Feedback-Einträge des Nutzers aus der Datenbank geladen.
    - **Adaptives Verhalten**: Der System-Prompt wurde um eine dynamische "Lerneffekt"-Sektion erweitert. Der Bot sieht nun konkret, welche seiner past-Antworten dem Nutzer gefallen haben und welche nicht.
    - **Stil-Anpassung**: Die KI ist angewiesen, erfolgreiche Interaktionsmuster aus positiven Bewertungen zu replizieren und Fehler oder unpassende Töne aus negativen Bewertungen künftig zu vermeiden.

## [1.37.2.83] - 2026-05-10

### Changed

- **Finanzen – Clipping-Fix**: Das Abschneiden der Buttons bei geöffnetem Assistenten wurde behoben. Die Support-Buttons werden nun bei extremem Platzmangel automatisch auf Icons reduziert, und das Layout stapelt sich nun früher und robuster.

## [1.37.2.82] - 2026-05-10

### Changed

- **Finanzen – Header-Aufräumaktion**: Der "Button-Salat" im Kopfbereich der Finanzseite wurde behoben. Spenden-Buttons wurden in einer dezenten Pill-Gruppe zusammengefasst, während administrative Aktionen klarer davon getrennt und pro Gerätetyp optimal ausgerichtet werden.

## [1.37.2.81] - 2026-05-10

### Changed

- **Finanzen – Intelligentes Container-Layout**: Die Finanzseite nutzt nun Tailwind v4 Container Queries (`@container`). Das Layout entscheidet nun nicht mehr nur anhand der Bildschirmbreite, sondern anhand des **tatsächlich verfügbaren Platzes**, ob es ein- oder zweispaltig angezeigt wird. Dies behebt das Problem, dass die Sidebar bei geöffnetem ABI Bot Assistenten gequetscht wurde.

## [1.37.2.80] - 2026-05-10

### Changed

- **ABI Bot – Proaktive Transaktionszuordnung**: Die Logik zur Bearbeitung von Finanzeinträgen wurde verbessert. Der Bot versucht nun aktiv, Transaktionen anhand von Nutzerbeschreibungen (Betrag, Datum, Zweck) in seinem Kontext zu identifizieren. Er nutzt die gefundenen IDs nun selbstständig, anstatt den Nutzer unnötig nach technischen IDs zu fragen.

## [1.37.2.79] - 2026-05-10

### Changed

- **ABI Bot – Token-Optimierung**: Umfassende Maßnahmen zur Reduzierung des Token-Verbrauchs und zur Vermeidung von Rate-Limits implementiert.
  - **Duales Modell-System**: Die Generierung von Chat-Titeln nutzt nun das hocheffiziente `llama-3.1-8b-instant` Modell, während der Haupt-Chat weiterhin auf `llama-3.3-70b-versatile` basiert.
  - **Kontext-Kompression**: Die im System-Prompt mitgesendeten Finanzdaten wurden optimiert. Aufschlüsselungen nach Kursen und Kategorien zeigen nun nur noch die Top-Einträge; kleinere Positionen werden intelligent zu "Sonstige" zusammengefasst.
  - **Abfrage-Effizienz**: Bei der Zusammenstellung des KI-Kontexts werden nun gezielt nur die benötigten Datenbankfelder (Projetion) aus Firestore geladen, was die Latenz und den Speicherbedarf reduziert.

## [1.37.2.78] - 2026-05-10

### Changed

- **Finanzen – Adaptives Layout**: Zweispaltiges Layout wiederhergestellt, aber auf `xl` (1280px) angehoben statt `lg` (1024px). Unterhalb von 1280px stapeln sich alle Widgets automatisch einspaltig. Die vier Übersichtskarten zeigen bei mittlerer Breite (`md`) zwei Spalten und ab `xl` vier Spalten.

## [1.37.2.77] - 2026-05-10

### Changed

- **Finanzen – Vollständig einspaltig**: Das zweispaltige Haupt-Layout (Diagramm links, Sidebar rechts) wurde vollständig entfernt. Alle Widgets stapeln sich nun immer untereinander: Diagramm → Kassenabgleich → Finanzverlauf → Finanzierungsziel → Kurs-Ranking.

## [1.37.2.76] - 2026-05-10

### Fixed

- **Finanzen – Strikte einspaltige Karten**: Die vier Übersichtskarten (Einnahmen, Ausgaben, Ziel, Stand) wurden auf `grid-cols-1` ohne jegliche Breakpoint-Ausnahmen umgestellt. Sie werden nun immer untereinander gestapelt – unabhängig von der Bildschirmbreite.

## [1.37.2.75] - 2026-05-10

### Changed

- **Finanzen – Einspaltiges Layout**: Die Finanzwidgets wurden auf ein konsequentes einspaltiges Layout umgestellt, um jegliche Quetschung von Beträgen zu vermeiden.
  - Die Hauptkarten der Finanzübersicht stapeln sich nun bis zu einer Breite von 1280px (XL) einspaltig und nutzen erst ab 1536px (2XL) die volle Breite.
  - Alle Sidebar-Widgets (Tickets, UVP, Budget) wurden auf eine strikte einspaltige Darstellung umgestellt, um auch in der schmalen Seitenleiste optimale Lesbarkeit zu garantieren.

## [1.37.2.75] - 2026-05-10

### Added

- **ABI Bot – Finanz-Korrekturen**: Der Assistent kann nun bestehende Finanzeinträge bearbeiten. 
  - Nutzer können Korrekturen anfordern (z.B. "Ändere den Betrag von Bäcker Müller auf 70€" oder "Verschiebe die Deko-Ausgabe in die Kategorie 'Location'").
  - Der Bot identifiziert Transaktionen über eindeutige IDs, die nun im Finanz-Kontext mitgesendet und bei Bedarf angezeigt werden.
  - Änderungen an Betrag, Zweck, Kategorie und Kurs-Zuordnung werden unterstützt.
  - Das Backend validiert die Existenz des Eintrags vor der Änderung und loggt die Bearbeitung revisionssicher.

## [1.37.2.74] - 2026-05-10

### Changed

- **Finanzen – Responsive Stacking**: Die Finanzwidgets und Sidebar-Elemente stapeln sich nun früher vertikal, bevor sie unleserlich schmal werden.
  - Die vier Hauptkarten der Finanzübersicht wechseln nun bereits bei mittleren Bildschirmbreiten in eine 2-Spalten-Ansicht (statt 4), um das Abschneiden von Beträgen zu verhindern.
  - Sidebar-Widgets wie "Dein Ticketpreis" und "Ziel-Budget" stapeln sich nun ebenfalls flexibler, um in der schmalen Seitenleiste maximale Lesbarkeit zu gewährleisten.

## [1.37.2.73] - 2026-05-10

### Changed

- **ABI Bot – Input Blockade**: Das Chat-Eingabefeld und der Senden-Button werden nun automatisch deaktiviert, solange der Bot noch "nachdenkt" (API-Anfrage) oder die Antwort noch per Typewriter-Effekt animiert wird. Dies verhindert das Senden von Mehrfachnachrichten und sorgt für einen geordneten Gesprächsfluss. Der Platzhalter im Eingabefeld signalisiert den Wartezustand ("Warte auf Antwort...").

## [1.37.2.72] - 2026-05-10

### Changed

- **Black Market – 20 zentrierte Vorlagen**: Alle Templates komplett neu gestaltet und auf exaktes 8×8-Raster ausgerichtet. Jede Zeile hat genau 8 Zeichen, Designs sind symmetrisch um die Mittelachse (Spalten 3-4). 8 neue Designs: POISON, SHIELD, CRYSTAL, ROCKET, ALIEN, MUSHROOM, PLANET, PORTAL, SUN. Kachelgröße im Grid auf 3-5 Spalten erhöht.

## [1.37.2.71] - 2026-05-10

### Added

- **Avatar-Studio – Black Market**: Neuer einklappbarer Abschnitt unterhalb der Leinwand mit 12 exklusiven Pixel-Vorlagen (Skull, Heart, Diamond, Lightning, Crown, Ghost, Flame, Star, Galaxy, Wave, Snake, Matrix). Jede Vorlage hat ein Rarity-Tag (DARK / RARE / EPIC / LEGENDARY), eine Live-Pixelvorschau und ein 2-Klick-Bestätigungssystem (zweimal klicken um zu laden, verhindert versehentliches Überschreiben).

### Fixed

- **Avatar-Studio – Style-Warning**: React-Warnung `Updating a style property during rerender (background) when a conflicting property is set (backgroundImage)` durch Vereinheitlichung auf das `background`-Shorthand in Pixel-Zellen und Farbanzeige behoben.

## [1.37.2.70] - 2026-05-10

### Fixed

- **AppShell – Studio-Layout**: Crash durch Rules-of-Hooks-Verletzung behoben. Der frühere `bareRoutes`-Early-Return stand zwischen Hook-Aufrufen und führte zu `Rendered more hooks than during the previous render`. Gelöst durch einen `isStudioRoute`-Flag der alle Hooks korrekt durchlaufen lässt: Für `/profil/studio` erhält `<main>` kein Padding und keinen `max-w-7xl`-Wrapper – das Studio füllt den gesamten Content-Bereich aus. Die Sidebar bleibt erhalten.

## [1.37.2.69] - 2026-05-10

### Changed

- **Avatar-Studio – Standalone-Layout**: Das Studio rendert jetzt komplett ohne AppShell (kein Sidebar, kein Navbar, kein Footer). Technisch über eine `bareRoutes`-Menge in `AppShell.tsx` gelöst – die Route `/profil/studio` gibt `<>{children}</>` zurück, bevor jegliches Shell-Chrome aufgebaut wird.
- **Avatar-Studio – Abmelden**: Neuer Abmelden-Button (LogOut-Icon, Rot-Hover) rechts im Header. Löscht das `sessionStorage`-Flag und meldet den Nutzer komplett ab.

## [1.37.2.68] - 2026-05-10

### Changed

- **Avatar-Studio – Personalisierte Kernel-Sequenz**: Das Rätsel-Pool-System wurde durch eine echte nutzerbezogene Authentifizierung ersetzt.
  - Jeder Nutzer besitzt eine einzigartige **Kernel-Sequenz** im Format `WORT-WORT-ZAHL` (z.B. `ALPHA-ECHO-4721`), die deterministisch aus der UID berechnet wird.
  - Die Sequenz ist **nirgendwo im UI sichtbar** – außer tief im NFT-Avatar-Dialog des eigenen Profilbilds, versteckt hinter dem einklappbaren „Technische Metadaten"-Bereich.
  - Das Studio-Gate fragt nach dieser persönlichen Sequenz. Sie ist für jeden Nutzer einzigartig und kann nicht erraten werden.
  - Neue Datei: `src/lib/studio-code.ts` (DJB2-Hash-basierte Code-Generierung, serverseitig verifizierbar).
  - 4 Fehlversuche → 45s Sperre. Session-Flag bleibt nach erfolgreicher Authentifizierung erhalten.

## [1.37.2.67] - 2026-05-10

### Changed

- **Avatar-Studio**: 3 Verbesserungen in einem Update:
  - **Rätsel-Pool**: 8 verschiedene Rätsel (pixel, 64, 16, svg, avatar, rückgängig, symmetrie…) – bei jedem Seitenaufruf wird zufällig eines gewählt.
  - **Globales Studio-Theme**: Solange man auf `/profil/studio` ist, wird das gesamte App-Theme (inkl. AppShell, Navigation, Sidebar) auf das dunkle Zink/Grün-Labor-Thema umgestellt. Beim Verlassen der Seite wird der ursprüngliche Theme-Zustand wiederhergestellt.
  - **Mobile-First**: Layout, Toolbar, Farbpalette und Canvas funktionieren vollständig auf kleinen Bildschirmen. Canvas füllt die volle Breite. Header komprimiert sich auf mobilen Geräten.

## [1.37.2.66] - 2026-05-10

### Changed

- **Avatar-Studio – Zugangsmechanismus**: Der Long-Press-Trigger auf dem Profilbild wurde vollständig entfernt (war zu buggy). Der Zugang zum Studio erfolgt nun ausschließlich über die direkte URL `/profil/studio`, die aber durch ein **Rätsel-Gate** gesichert ist.
  - Beim Aufruf der URL erscheint ein Terminal-Style-Sperrbildschirm mit einer Typewriter-Sequenz und einem Rätsel.
  - Erst nach korrekter Antwort wird Zugang gewährt (`sessionStorage`-Flag, sodass man das Rätsel in der Session nicht wiederholen muss).
  - Bei Fehlantworten: Fehlermeldung + Versuche-Zähler. Nach 4 Fehlversuchen: 30-Sekunden-Sperre.
- **ProfileView**: Alle Trigger-Mechanismen (Klick-Counter, Long-Press) wurden restlos entfernt.

## [1.37.2.65] - 2026-05-10

### Changed

- **Profil – Secret Avatar-Studio-Trigger**: Wechsel von 7×-Klick auf **3-Sekunden Long Press** auf das eigene Profilbild. Kurzes Antippen öffnet weiterhin den NFT-Info-Dialog; langes Halten zeigt einen grünen Conic-Gradient-Fortschrittsring und navigiert nach 3 s zum Studio. Kein Konflikt mit dem bestehenden Klick-Verhalten mehr.
- **Avatar-Studio – Leinwand**: Das Pixel-Grid füllt jetzt die volle Breite des Editorbereichs aus (kein festes `400px`-Maximum mehr).

## [1.37.2.64] - 2026-05-10

### Added

- **Profil – Geheimes Avatar-Studio** (`/profil/studio`): Vollwertiger Pixel-Art-Editor zum Malen eigener 8×8-Avatar-Designs – versteckt und nur über einen Secret-Trigger erreichbar.
  - **Versteckter Zugang**: 7× in schneller Folge auf das eigene Profilbild klicken → visueller Glitch-Effekt als Feedback (Farbfilter ab Klick 4, Pulsieren ab Klick 6) → automatische Weiterleitung zum Studio.
  - **Pixel-Editor**: Volle 8×8-Leinwand mit Stift, Radierer und Fülleimer-Werkzeug. Drag-to-paint (Pointer Events). Symmetriemodus (horizontale Spiegelung). Undo bis 20 Stufen. Alles-löschen. Zufällig-Füllen.
  - **Farbpalette**: Alle 16 AVATAR_PALETTE-Farben + Transparenz-Eraser. Aktive Farbe wird hervorgehoben.
  - **Live-Vorschau**: Animierter NFT-Render (`AnimatedNftAvatar`) in Echtzeit – in vier Größen zur Kontrolle.
  - **Pixel-Stats**: Gefüllte Pixel, eindeutige Farben, Symmetriestatus und Verlaufsstufen werden live angezeigt.
  - **Speichern**: Setzt den Custom-Avatar direkt als `photo_url` im Profil (schreibt `cosmetics.pixel_avatar_mode: 'custom'`).
  - **Boot-Intro**: Terminalartige Typewriter-Sequenz beim ersten Laden unterstreicht den „geheimen Labor"-Charakter.
  - **Keyboard-Shortcuts**: P = Stift, E = Radierer, F = Füllen, Ctrl+Z = Rückgängig.

## [1.37.2.63] - 2026-05-10

### Added

- **Profil – Avatar Shop** (`/profil/shop`): Neuer Profilbild-Store, in dem Nutzer einzigartige, seeded Pixel-Avatar-Designs mit Notenpunkten (NP) kaufen und ausrüsten können.
  - **12 Designs** in drei Kategorien: Kostenlos (3), Premium (6, 50–120 NP), Exklusiv (3, 250–400 NP).
  - **Live-Animierte Vorschauen**: Alle Avatare werden als animierte NFT-Pixel-Matrix dargestellt (identisch zur bestehenden `AnimatedNftAvatar`-Komponente).
  - **Sofortige Anwendung**: Beim Ausrüsten wird `photo_url`, `cosmetics.pixel_avatar_seed` und `cosmetics.pixel_avatar_mode` direkt in Firestore aktualisiert.
  - **Kaufbestätigung**: Modale Bestätigungsdialog mit NP-Kontrolle vor dem Kauf.
  - **Kategorie-Filter**: Tabs für Alle / Kostenlos / Premium / Exklusiv.
  - **NP-Balance-Anzeige**: Aktuelles NP-Guthaben und aktiver Avatar prominent im Header.

## [1.37.2.62] - 2026-05-10

### Changed

- **Admin – Animierte Pixel-Avatare**: Die NFT-Pixelprofilbilder in der Admin-Nutzerverwaltung (Übersicht & Detailansicht) sowie überall wo `NftAvatar` gerendert wird, sind nun wie der ABI-Bot-Avatar animiert. Das Grundmuster (8×8-Pixelmatrix mit den originalgetreuen Farben) bleibt vollständig erhalten – die einzelnen Pixel schimmern und flackern nun subtil über einen Canvas-Renderer, der die Farben aus dem SVG des Nutzerprofils ausliest. Neue Komponente `AnimatedNftAvatar` erstellt.

## [1.37.2.61] - 2026-05-10

### Changed

- **Einstellungen – Pixelprofilbilder**: Die Pixelprofilbild-Käufe akzeptieren jetzt zusätzlich Albumkarten als Zahlungsmittel. Der Zwei-Schritt-Kauf bleibt unverändert: 5 Karten für den Entwurf, 25 Karten für den Kauf.

## [1.37.2.59] - 2026-05-10

### Added

- **Einstellungen – Pixelprofilbilder**: In den Profileinstellungen gibt es jetzt einen Zwei-Schritt-Kauf für Pixelprofilbilder. Nutzer können für 5 Lehrerkarten ein neues Zufallsbild erzeugen und es anschließend für 25 Lehrerkarten als aktives Profilbild kaufen. Die frühere 200-Lehrerkarten-Galerie wurde entfernt; der Kauf läuft weiterhin serverseitig.

## [1.37.2.56] - 2026-05-10

### Changed

- **Einstellungen – Profileinstellungen**: Der Profilbereich wurde aus der Kontoverwaltung herausgelöst und bekommt nun einen eigenen Bearbeitungsblock für Name, Schule und Kurs. Profilbilder lassen sich in den Einstellungen nicht mehr ändern. Sicherheitsfunktionen wie Passwort-Reset, 2FA, Abmelden und Kontolöschung sind jetzt klar getrennt.

### Fixed

- **Einstellungen – Layout**: Die Seiten- und Formularspalten skalieren auf schmaleren Desktopbreiten jetzt deutlich sauberer und brechen erst später in die Zweispaltenansicht um.
- **Einstellungen – Navigation**: Die linke Navigation wird auf normalen Laptopbreiten nicht mehr neben den Inhalt gequetscht, sondern erst auf sehr breiten Displays eingeblendet.

## [1.37.2.55] - 2026-05-10

### Changed

- **ABI Bot – Avatar Interaktion**: Das Klicken auf das Profilbild des Bots im Chat öffnet nun nicht mehr den Detail-Dialog (NFT-Info), sondern navigiert direkt zur Profilseite des Bots. Dies sorgt für einen schnelleren Zugriff auf den Bot-Steckbrief.

## [1.37.2.54] - 2026-05-10

### Fixed

- **UI – Overlay Z-Index Fix**: Ein Problem wurde behoben, bei dem Popover (z.B. KI-Modell-Details), Dropdown-Menüs und Dialoge hinter der ABI Bot Sidebar erschienen. Die Z-Indizes dieser Komponenten wurden auf 1000 erhöht, um sicherzustellen, dass Overlays immer im Vordergrund angezeigt werden.

## [1.37.2.53] - 2026-05-10

### Changed

- **ABI Bot – Content Displacement**: Die Sidebar des Bots verdrängt nun im Desktop-Modus (wenn angedockt) den Seiteninhalt, anstatt ihn zu überlagern. Dies sorgt für eine bessere Übersichtlichkeit, da der Hauptinhalt der Seite (z.B. Dashboard-Widgets) automatisch zur Seite geschoben wird, wenn der Bot geöffnet wird.

## [1.37.2.52] - 2026-05-10

### Changed

- **ABI Bot – UI Cleanup**: Der Avatar wurde aus dem Header des Chat-Fensters entfernt, um das Design cleaner zu gestalten.
- **ABI Bot – Avatar Scaling Fix**: Ein Fehler bei der Skalierung des Bot-Avatars im Profil wurde behoben. Der Avatar nutzt nun die korrekten responsiven Größenklassen und ist nun konsistent mit den User-Profilen.

## [1.37.2.51] - 2026-05-10

## [1.37.2.50] - 2026-05-10

## [1.37.2.49] - 2026-05-10

## [1.37.2.48] - 2026-05-10

## [1.37.2.47] - 2026-05-10

## [1.37.2.46] - 2026-05-10

### Changed

- **ABI Bot – Profile Interaction**: Der Bot-Steckbrief wurde von einem Popover auf einen **Dialog (Modal)** umgestellt. Dies sorgt für eine zuverlässigere Interaktion und eine bessere Darstellung der Profilinformationen, insbesondere auf mobilen Endgeräten.

## [1.37.2.45] - 2026-05-10

### Fixed

- **ABI Bot**: Ein `ReferenceError` ("Avatar is not defined") wurde behoben, der durch fehlende Importe in der `AiAssistantWidget.tsx` Komponente verursacht wurde.

## [1.37.2.44] - 2026-05-10

### Added

- **ABI Bot – Profil & Identität**: Der Bot hat nun eine eigene Identität mit Profilbild und klickbarem Namen.
    - **Bot-Avatar**: Ein neues, freundliches Roboter-Avatar-Icon wurde generiert und systemweit für den Bot integriert.
    - **Interaktives Profil**: Durch Klicken auf den Namen oder das Avatar-Icon öffnet sich ein Popover mit Details zum Bot (Rolle, Beschreibung, Fähigkeiten und Version).
    - **UI Enhancement**: Die Chat-Nachrichten des Bots zeigen nun das Avatar-Icon anstelle des generischen Sparkles-Icons, was für eine persönlichere Atmosphäre sorgt.

## [1.37.2.43] - 2026-05-10

### Added

- **ABI Bot – Typewriter-Effekt**: Antworten des Bots werden nun Zeichen für Zeichen (bzw. Wort für Wort) eingeblendet, um den Prozess der Textgenerierung in Echtzeit zu simulieren. Dies sorgt für eine natürlichere und weniger abrupte Benutzererfahrung.
- **ABI Bot – UI Refinement**: Die "Spring"-Animationen der Nachrichtenblasen wurden reduziert, um den Fokus stärker auf den Textfluss zu legen.

## [1.37.2.42] - 2026-05-10

### Added

- **ABI Bot – Feedback System**: Die Daumen-Hoch/Runter Bewertungen haben nun eine echte Funktion.
    - **Zentrales Logging**: Feedback wird nun in einer dedizierten `ai_assistant_feedback` Kollektion gespeichert, inklusive Kontext (Frage, Antwort, Modell).
    - **Admin-Sichtbarkeit**: Bewertungen werden als System-Aktionen geloggt und sind für Admins in den Activity-Logs einsehbar.
    - **UI-Feedback**: Nutzer erhalten sofortige Bestätigung via Toasts ("Freut mich, dass ich helfen konnte!" oder "Danke, wurde an die Entwickler gemeldet.").

## [1.37.2.41] - 2026-05-10

### Fixed

- **ABI Bot**: Ein `ReferenceError` wurde behoben, bei dem die `Popover`-Komponenten im `AiAssistantWidget` nicht korrekt importiert waren.

## [1.37.2.40] - 2026-05-10

### Fixed

- **ABI Bot**: Ein 502 Bad Gateway Fehler wurde behoben, der durch Instabilitäten beim Upstream-KI-Modell verursacht wurde. Der Bot nutzt nun das stabilere `llama-3.3-70b-versatile` Modell.
- **ABI Bot**: Die Fehlerberichterstattung im Backend wurde verbessert, um bei zukünftigen API-Problemen präzisere Diagnosedaten zu liefern.

## [1.37.2.39] - 2026-05-10

### Added

- **ABI Bot**: Neues Kopieren-Icon hinzugefügt, mit dem Nutzer Antworten des Bots direkt in die Zwischenablage kopieren können. Inklusive visuellem Erfolgs-Feedback (Check-Icon).

### Fixed

- **ABI Bot**: Firebase-Fehler behoben, der beim Erstellen neuer Chats auftrat, wenn optionale Felder (wie Modell-Info oder Feedback) noch nicht gesetzt waren.

## [1.37.2.38] - 2026-05-10

### Fixed

- **ABI Bot**: Syntax-Fehler im Chat-Widget behoben, der durch ein überschüssiges `div`-Tag verursacht wurde und zum Absturz der UI führte.

## [1.37.2.37] - 2026-05-10

### Fixed

- **ABI Bot**: Syntax-Fehler im Chat-Widget behoben, der durch ein überschüssiges `div`-Tag verursacht wurde und zum Absturz der UI führte.

## [1.37.2.36] - 2026-05-10

### Added

- **ABI Bot – Feedback & Model Info**: Neue Interaktionsmöglichkeiten für KI-Antworten.
  - **Feedback-System**: Nutzer können nun jede Bot-Antwort mit einem "Daumen hoch" oder "Daumen runter" bewerten. Das Feedback wird persistent gespeichert.
  - **KI-Modell-Info**: Ein neues Info-Icon (ⓘ) unter den Antworten zeigt bei Klick oder Hover Details zum verwendeten KI-Modell (z.B. Llama 3.1) und dem Provider an.
  - **UI-Integration**: Die Feedback-Leiste fügt sich dezent in das Design der Chat-Blasen ein und bietet direktes haptisches Feedback.
## [1.37.2.35] - 2026-05-10

### Added

- **ABI Bot – Visible Thinking**: Das "Denken" des Bots ist nun für Nutzer sichtbar.
  - **Thinking-Prozess**: Bot-Antworten enthalten nun eine einklappbare Sektion "Thinking...", in der die internen Überlegungen und Planungsschritte der KI transparent dargestellt werden.
  - **Upgrade auf DeepSeek-R1**: Der Standard-KI-Motor wurde auf `deepseek-r1-distill-llama-70b` aktualisiert, um tiefgründigere Analysen und präzisere Planungsvorschläge zu ermöglichen.
  - **UI-Integration**: Ein pulsierender Indikator zeigt visuell an, dass der Bot gerade aktiv nachdenkt, bevor die Antwort erscheint.
  - **Transparenz**: Nutzer können nun nachvollziehen, warum der Bot bestimmte Aufgaben, Termine oder Aktionen vorschlägt.

## [1.37.2.35] - 2026-05-10

### Added

- **ABI Bot – UI Polishing**: Die Animationen wurden für ein noch flüssigeres Erlebnis verfeinert.
  - **Spring-Animations**: Nachrichten erscheinen nun mit einem physikalisch korrekten Bounce-Effekt (Spring).
  - **Glow-Effekt**: Das Bot-Icon leuchtet nun dezent auf, wenn eine neue Nachricht erscheint, um die Aufmerksamkeit zu lenken.
  - **Smooth Scrolling**: Der Chat scrollt nun flüssig und sanft zur neuesten Nachricht, anstatt abrupt zu springen.

## [1.37.2.34] - 2026-05-10

### Added

- **ABI Bot – UI Experience**: Einführung von flüssigen Animationen für den Chat-Verlauf.
  - **Bot-Antworten**: Animieren nun sanft mit einem Fade-In, Slide-Up und Scale-Effekt hinein.
  - **User-Nachrichten**: Erscheinen mit einer subtilen Slide-In Animation von rechts.
  - **Sparkles-Icon**: Das Icon des Assistenten rotiert und blendet weich ein, wenn eine neue Nachricht erscheint.
  - **Performance**: Animationen werden nur auf die jeweils neueste Nachricht angewendet, um die CPU-Last bei langen Chat-Verläufen minimal zu halten.

## [1.37.2.33] - 2026-05-10

### Fixed

- **ABI Bot**: Die Resilienz des Backends wurde weiter maximiert. Der gesamte Prozess der Kontext-Zusammenstellung (Finanzen, Termine, Aufgaben) ist nun in `try-catch`-Blöcke gehüllt, sodass der Bot auch dann antwortet, wenn einzelne Datenquellen Fehler liefern.
- **ABI Bot**: Fehlermeldungen im Frontend enthalten nun detailliertere Informationen zur Fehlerursache aus dem Backend.

## [1.37.2.32] - 2026-05-10

### Added

- **ABI Bot – Finanz-Management**: Der Bot kann nun vollständig mit den Finanzen der Stufe arbeiten.
  - **Einträge buchen**: Einnahmen und Ausgaben direkt im Chat erstellen mit automatischer Kategorisierung (Sponsoring, Deko, Catering, DJ/Musik, Location, etc.).
  - **Finanz-Analyse**: Der Bot "sieht" nun die **kompletten** Finanzdaten in Echtzeit: Gesamteinnahmen, Gesamtausgaben, aktueller Stand, Fortschritt zum Ziel, Aufschlüsselung nach Kurs und Kategorie, sowie die letzten 10 Transaktionen.
  - **Intelligente Auswertung**: Kann Trends erkennen, Hochrechnungen anstellen, Kurs-Vergleiche ziehen und bei Budget-Engpässen warnen.
  - **Shop-Einnahmen**: Auch Abi-Anteile aus dem Shop werden in die Analyse einbezogen.
- **ABI Bot – Kontext-Erweiterung**: Die Echtzeit-Kontext-Injektion wurde von einem simplen Finanzierungsziel auf einen vollständigen Finanzbericht ausgebaut (Totals, Kurs-Breakdown, Kategorie-Breakdown, letzte Transaktionen).

### Changed

- **ABI Bot**: `max_tokens` von 1000 auf 1500 erhöht, um ausführlichere Finanz-Analysen zu ermöglichen.

### Fixed

- **ABI Bot**: Ein kritischer 500-Fehler im Backend wurde behoben, der durch fehlende Fehlerbehandlung bei Datenbankabfragen (insbesondere Finanzen) verursacht wurde. Die Abfragen sind nun resilienter gegenüber fehlenden Indizes oder leeren Kollektionen.

## [1.37.2.31] - 2026-05-10

### Added

- **ABI Bot**: Drei neue "extreme" Persönlichkeits-Modi hinzugefügt:
    - **Sassy**: Sarkastisch, schlagfertig und leicht arrogant.
    - **Genervt**: Kurz angebunden, mürrisch und wenig motiviert.
    - **Asozial/Trashy**: Extremer Straßenslang ("Digga", "Wallah"), direkt und respektlos.
- **ABI Bot**: Die Backend-Logik und das Menü wurden erweitert, um diese Persönlichkeiten konsistent über alle Funktionen hinweg abzubilden.

## [1.37.2.30] - 2026-05-10

### Changed

- **ABI Bot**: Das Aktions-Menü in der Input-Leiste wurde umstrukturiert. Die Modus-Auswahl befindet sich nun in einem Untermenü ("Modus wechseln"), um Platz für zukünftige Funktionen zu schaffen.
- **ABI Bot**: Ein Platzhalter für Dateianhänge ("Anhang (Bald verfügbar)") wurde dem Hauptmenü hinzugefügt.

## [1.37.2.29] - 2026-05-10

### Added

- **ABI Bot**: Ein neuer Modus-Umschalter wurde direkt in die Input-Leiste integriert (hinter dem "Drei-Punkte"-Menü auf der linken Seite). Nutzer können nun zwischen **Planer-**, **Kreativ-** und **Smalltalk-Modus** wählen, um die Persönlichkeit und Zielsetzung des Bots anzupassen.
- **ABI Bot**: Die Input-Leiste wurde auf eine maximale Länge von 1000 Zeichen begrenzt, um die Stabilität der KI-Anfragen zu erhöhen.


## [1.37.2.29] - 2026-05-10

### Added
- **ABI Bot**: Umfassendes Skill-Update. Der Assistent kann nun aktiv Abstimmungen erstellen, News-Einträge verfassen, Finanz-Transaktionen buchen, Planungsgruppen gründen und Nachrichten in Gruppen-Chats posten.
- **ABI Bot**: Real-time Context Injection. Der Assistent "sieht" nun die aktuellen 5 Aufgaben, Termine und News sowie das Finanzierungsziel, um präzisere und kontextbezogene Antworten zu geben.

## [1.37.2.28] - 2026-05-10

### Changed

- **ABI Bot**: Der System-Prompt wurde dahingehend gelockert, dass der KI-Assistent nun auch offener für Smalltalk und allgemeine Lebenshilfe ist. Wenn Nutzer über Themen abseits der Abi-Planung sprechen, geht der Bot natürlicher darauf ein, anstatt krampfhaft zu versuchen, neue Todos oder Termine daraus zu generieren.

## [1.37.2.27] - 2026-05-10

### Fixed

- **ABI Bot**: Ein Sicherheitsproblem behoben, bei dem der Bot auf Notfälle (z.B. medizinische Krisen) mit unangemessenen Vorschlägen (wie dem Aussetzen von Aufgaben) reagiert hat. Der System-Prompt wurde um Notfall-Richtlinien erweitert. Wenn nun ein akuter Notfall geschildert wird, bricht der Bot jede Planung ab und verweist direkt auf den Notruf (112/110) oder eine Vertrauensperson, ohne interaktive Buttons anzubieten.

## [1.37.2.26] - 2026-05-10

### Added

- **ABI Bot**: Ein neuer Vollbildmodus für Desktop-Nutzer wurde hinzugefügt. Über ein Icon im Header kann der Chat nun den gesamten Bildschirm einnehmen (sowohl im angedockten als auch im schwebenden Modus), um komplexere Konversationen komfortabler zu führen.

## [1.37.2.25] - 2026-05-10

## [1.37.2.24] - 2026-05-10

## [1.37.2.23] - 2026-05-10

### Fixed

- **ABI Bot**: Ein Bug wurde behoben, bei dem die Generierung des Chat-Titels im Hintergrund permanent fehlschlug und dadurch immer auf "Neuer Chat" zurückgefallen ist. Der Groq-API-Aufruf nutzt nun explizit den `json_object` Response-Format-Zwang, wodurch das LLM (Llama 3.1 8b) die Titel zuverlässig generiert.

## [1.37.2.23] - 2026-05-10

### Changed

- **ABI Bot**: Die Größe (Breite der Sidebar), der Docking-Status und der Öffnungszustand des Chat-Fensters werden nun dauerhaft im Browser gespeichert (`localStorage`) und beim Neuladen der Seite wiederhergestellt.

## [1.37.2.22] - 2026-05-10

## [1.37.2.21] - 2026-05-10

### Changed

- **ABI Bot**: In der Chat-Historie wird nun standardmäßig "Neuer Chat..." angezeigt, bis die KI eine dynamische Zusammenfassung generiert hat, anstatt einfach die erste Nachricht abzuschneiden. Der KI-Prompt zur Titel-Generierung wurde optimiert, um eine prägnante Zusammenfassung (2-6 Wörter) des Gesprächs zu erstellen, anstatt den eingegebenen Text zu wiederholen.

## [1.37.2.20] - 2026-05-10

### Fixed

- **ABI Bot**: Problem behoben, bei dem interaktive Optionen (Buttons/Fragen) als reiner Text statt als klickbare Elemente im Chat angezeigt wurden. Der System-Prompt wurde verschärft, um die Nutzung von JSON für strukturierte Rückfragen zu erzwingen, und der Antwort-Parser wurde robuster gestaltet, um JSON-Objekte zuverlässiger aus dem KI-Output zu extrahieren.

## [1.37.2.19] - 2026-05-10

## [1.37.2.18] - 2026-05-10

### Changed

- **ABI Bot**: Das Texteingabefeld im Chat wird während der Generierung einer Antwort nicht mehr deaktiviert. Nutzer können ihre nächste Nachricht bereits eintippen, während die KI noch antwortet.

## [1.37.2.17] - 2026-05-10

### Changed

- **ABI Bot**: Die Sidebar des AI Assistenten ist nun im Desktop-Modus (gedockt) in der Breite verstellbar (resizable). Nutzer können die Sidebar stufenlos zwischen 20% und 80% der Bildschirmbreite per Drag-and-Drop anpassen.

## [1.37.2.16] - 2026-05-10

### Added

- **ABI Bot**: Der Assistent kann nun interaktive Rückfragen im Chat stellen. Die Benutzeroberfläche unterstützt jetzt "Multiple Choice" (klickbare Buttons) und "Text Input" (Eingabefelder) direkt in den Bot-Nachrichten, um strukturierte Informationen vom Nutzer einzuholen.

## [1.37.2.15] - 2026-05-10

### Changed

- **ABI Bot**: Gemeinsames Prompt-Modul (`abi-bot-prompt.ts`) eingeführt. Dashboard-Assistent, Gruppen-Bot und Support-Bot teilen nun dieselbe Persönlichkeit – freundlicher, motivierender Ton mit jugendlicher Sprache, Emoji-Einsatz und proaktiver Gesprächsführung. Der Dashboard-Assistent behält zusätzlich die Fähigkeit, Aufgaben und Termine anzulegen.

## [1.37.2.14] - 2026-05-10

### Added

- **NFT Avatare**: Profilbilder wurden in einzigartige NFT-Style Matrizen umgewandelt. Jedes Bild erhält eine deterministische ID (`#ABI-XXXX`).
- **Avatar Ansicht**: Beim Klicken auf das eigene Profilbild öffnet sich nun eine vergrößerte Detailansicht mit Informationen zur Einzigartigkeit des Pixels.
- **Admin System Control**: Ein One-Time Button zur asynchronen Migration aller bestehenden Profilbilder wurde unter "System Control" hinzugefügt.

## [1.37.2.13] - 2026-05-10

### Changed

- **ABI Bot**: Der KI-Assistent wurde offiziell in "ABI Bot" umbenannt. Dies umfasst die UI-Titel, Begrüßungstexte in allen Sprachen, System-Prompts und die Lehrer-Einreichungs-Plattform.

## [1.37.2.12] - 2026-05-10

### Added

- **Account-Erstellung**: Automatische Generierung von 8x8 Pixel Profilbildern (Avataren) bei der Registrierung unter Verwendung einer 16-Farben-Palette.
- **Benutzerprofile**: Bestehende Nutzer ohne Profilbild bekommen automatisch bei ihrer ersten Aktion ein generiertes Bild, bzw. via Admin-Migrationsskript.

## [1.37.2.11] - 2026-05-10

### Changed

- **AI Assistant**: Chatverlauf-Titel werden nach der ersten Antwort jetzt dynamisch von der KI erstellt und anschließend in der Session gespeichert.

## [1.37.2.10] - 2026-05-10

### Fixed

- **AI Assistant**: Schema-artige Modellantworten mit `action:`- und `answer:`-Zeilen werden jetzt auf die sichtbare Antwort reduziert, damit interne Struktur nicht im Chat erscheint.

## [1.37.2.9] - 2026-05-10

### Added

- **AI Assistant**: Der Dashboard-Assistent kann jetzt Todos, Unteraufgaben und Termine als bestätigungspflichtige Entwürfe vorbereiten und für berechtigte Rollen direkt speichern.

### Changed

- **AI Assistant**: Die Assistenz antwortet nun mit einer strukturierten Aktionsvorschau, damit der Nutzer vor dem Anlegen alles prüfen kann.

## [1.37.2.8] - 2026-05-10

### Changed

- **AI Assistant**: Bei leeren Modellantworten erscheint jetzt nur ein kurzer Hinweis im Chat statt eines langen Ersatztexts.

## [1.37.2.7] - 2026-05-10

### Fixed

- **AI Assistant**: Leere Antworten werden jetzt mit einem sicheren Fallback ersetzt, damit im Chat keine leeren Sprechblasen mehr erscheinen.

## [1.37.2.6] - 2026-05-10

### Fixed

- **AI Assistant**: Fokusverlust im Eingabefeld behoben. Der Chat-Input bleibt nun beim Tippen stabil fokussiert und verliert nicht bei jedem Tastendruck den Cursor.

## [1.37.2.5] - 2026-05-10

### Fixed

- **AI Assistant**: Firestore-Updates für Chat-Sessions bereinigen nun Nachrichten vor dem Speichern, damit keine `undefined`-Werte mehr in `ai_chat_sessions` landen.

## [1.35.1.2] - 2026-05-08

### Fixed
- **Marktplatz**: Clipping-Fehler bei den Tabs auf kleinen Bildschirmen behoben (Tabs sind nun scrollbar).

## [1.35.1.1] - 2026-05-08

### Fixed
- **Ad-Manager**: Bildskalierung in der Admin-Übersicht auf `object-contain` umgestellt, um abgeschnittene Bilder zu verhindern.

## [1.35.2.2] - 2026-05-08

### Fixed
- **Ad-Manager**: TypeScript-Fehler bei der Prioritäts-Auswahl behoben (null-Safety für `parseInt`).
- **Aufgaben-Seite**: Fehlende `Badge`-Komponente importiert und `SheetContent`-Unterstützung für die linke Seite (`side="left"`) implementiert.
- **Dashboard**: Fehlender `ads`-Key im Dashboard-Layout-Manager (`CustomizeDashboardDialog`) hinzugefügt.

## [1.35.2.1] - 2026-05-08

### Changed
- **Aufgaben-Detailansicht**: Sparkles-Icon aus dem Empfehlungs-Bereich entfernt.

## [1.35.2.0] - 2026-05-08

### Added
- **Infinite Scroll**: Endloses Scrollen für alle Tabs der Aufgaben-Seite (Angebote, Beobachtet, Validierung) implementiert. Dies verbessert die Ladezeiten und Performance bei einer großen Anzahl von Aufgaben erheblich.
- **Paginiertes Laden**: Aufgaben werden nun in Häppchen von 12 Elementen geladen, was Bandbreite spart.

### Changed
- **Aufgaben-Seite**: Kompletter Refactor der Daten-Abfrage auf Firestore-Pagination (limit/startAfter).
- **Validierungs-Tab**: Integration der Admin-Prüfungsfunktionen direkt in das paginierte System der Hauptseite.

## [1.35.1.0] - 2026-05-08

### Added
- **Aufgaben-Detailansicht**: Anzeige der Aufrufe (View Count) implementiert.
- **Marktplatz-Empfehlungen**: Bereich "Das könnte dich auch interessieren" am Ende der Detailansicht hinzugefügt, um zum Entdecken weiterer Aufgaben anzuregen.

### Changed
- **Datenmodell**: `Task` Typ um `view_count` und `viewed_by` erweitert.

## [1.35.0.13] - 2026-05-08

### Changed
- **Marktplatz**: Redundante "Sofort verfügbar" Labels durch aussagekräftige Call-to-Actions ersetzt ("Geld sparen", "Booster sammeln").
- **Aufgaben-Status**: Status-Labels präzisiert ("Angenommen" -> "In Arbeit", "Nachbesserung nötig" -> "Überarbeiten").

## [1.35.0.12] - 2026-05-08

### Fixed
- **Ad-Manager**: Crash durch fehlenden `cn`-Import behoben.

## [1.35.0.11] - 2026-05-08

### Changed
- **Ad-Manager**: Modernisiertes Layout mit Tabs, Dialogen und integrierter Live-Vorschau.

## [1.35.0.10] - 2026-05-08

### Changed
- **Dashboard**: Dynamisches Prioritätssystem für Werbung eingeführt.

## [1.35.0.9] - 2026-05-08

### Changed
- **Ad-Tile**: Optisches Polishing des Werbe-Labels (Pill-Design & Zentrierung).

## [1.35.0.8] - 2026-05-08

### Added
- **Ad-Manager**: Auto-Vervollständigung von `https://` für externe Links.

### Changed
- **Ad-Tile**: Verbesserte Erkennung externer Links.

## [1.35.0.7] - 2026-05-08

### Changed
- **Ad-Tile**: Bildskalierung auf `object-contain` umgestellt (kein Beschnitt mehr).

## [1.35.0.6] - 2026-05-08

### Changed
- **Ad-Tile**: Text unter das Bild verschoben und Werbe-Label nach links korrigiert.

## [1.35.0.5] - 2026-05-08

### Added
- **Ad-Manager**: Vollständige Bearbeitungsfunktion für bestehende Anzeigen hinzugefügt.

### Changed
- **Ad-Tile**: Werbe-Label ("Anzeige") neben den Titel verschoben.

## [1.35.0.7] - 2026-05-08

### Fixed
- **Logging**: Absturz beim Loggen von Task-Freigaben behoben (Firebase `undefined` Error).
- **Logging**: Globaler Schutz gegen `undefined` Werte in Firestore-Logs implementiert.

## [1.35.0.6] - 2026-05-08

### Changed
- **Marktplatz**: Sidebar-Status zeigt nun "Aktuell" vs. "Ziel" an.
- **Marktplatz**: Fortschrittsbalken zur Status-Sektion hinzugefügt.

## [1.35.0.5] - 2026-05-08

### Fixed
- **Marktplatz**: Tab-Indicator Ausrichtung korrigiert (kein "floating" mehr).
- **Marktplatz**: Indicator-Farbe an das ABI Planer Branding angepasst.

## [1.35.0.4] - 2026-05-08

### Changed
- **Marktplatz**: UI-Polishing der Toggles und Tabs auf der `/aufgaben` Seite.
  - Tabs verwenden nun den `line` Variant für ein saubereres Design.
  - Grid/List Toggle wurde zu einer einheitlichen Switcher-Komponente umgebaut.

## [1.35.0.3] - 2026-05-08

### Changed
- **Marktplatz**: Umfassendes Redesign der `/aufgaben` Seite für ein echtes Marketplace-Erlebnis.
  - Einführung eines hybriden Layouts mit einer permanenten Sidebar (Desktop) und einem Sheet-basierten Filter-Drawer (Mobil).
  - Neue Top-Bar mit prominenter Suche und einem View-Mode-Toggle (Grid/List).
  - Persistente Speicherung des View-Modes im `localStorage`.
  - Optimierte Filter-Sidebar mit Kategorien-Navigation und Status-Übersicht (Ersparnis).
  - Responsive Anpassungen für eine nahtlose Erfahrung auf allen Geräten.

## [1.35.0.2] - 2026-05-08

### Changed
- **Marktplatz**: `MarketplaceCard` unterstützt nun `grid` und `list` Varianten.
  - Die neue `list` Variante bietet ein horizontales Layout (eBay-Stil) mit optimierter Darstellung für Mobilgeräte und Desktop.
  - Bereinigung ungenutzter Imports in der Komponente.

## [1.35.0.1] - 2026-05-08

### Changed
- **Navigation**: Das **Aufgaben-Modul** wurde zum Hauptmenüpunkt befördert. Es ist nun nicht mehr unter "Planung" versteckt, sondern direkt als "Aushängeschild" in der Sidebar und Navbar verfügbar.

## [1.35.0.0] - 2026-05-08

### Added
- **AD-Manager**: Neues Modul zur Verwaltung benutzerdefinierter Werbung und Hinweise auf dem Dashboard.
  - Integration von Werbe-Kacheln (`AdTile`) direkt in das Dashboard-Layout.
  - Vollständiges Admin-Interface (`/admin/ads`) zum Erstellen, Bearbeiten und Deaktivieren von Anzeigen.
  - Integration in die Admin-Sidebar (`DashboardNavbar`) für schnellen Zugriff.
  - Unterstützung für Bilder, Links, Beschreibungen und Priorisierung.
  - Dynamische Rotation der Anzeigen bei mehreren aktiven Einträgen.
  - Automatisches Score-basiertes Sorting im Dashboard (Priorität direkt unter Todos/Events).
  - Firestore-Integration mit neuen Security-Rules für die `ads` Collection.

## [1.34.4.55] - 2026-05-08

### Changed
- **Marktplatz**: Komplettes Redesign im klassischen, minimalistischen "eBay-Stil".
  - Entfernung von massiven Drop-Shadows, Farbverläufen und großen Border-Radien.
  - Fokus auf eine präsente, einfache Suchleiste ganz oben und klare Linien.
  - Tabs in schlichter Unterstreichungs-Optik anstelle von großen Button-Toggles.
  - `MarketplaceCard` radikal vereinfacht: Quadratisches Bild, fetter Preis, klares Layout ohne verspielte Animationen für eine authentische E-Commerce Erfahrung.

## [1.34.4.54] - 2026-05-08

### Fixed
- **Marktplatz**: Fehlende Component- und Icon-Imports (`Badge`, `Sparkles`, `ChevronRight`) behoben, die zu Runtime-Errors führten.

## [1.34.4.53] - 2026-05-08

### Added
- **Marktplatz**: Umfassendes Redesign der `/aufgaben` Seite für ein professionelles "Online Marketplace" Feeling.
  - Neue Hero-Sektion mit dynamischem Design und verbesserter Nutzerführung.
  - Überarbeiteter Kategorie-Carousel mit größeren Icons und interaktiven Effekten.
  - Integration eines "Validierung" Tabs für Admins zur direkten Prüfung eingereichter Aufgaben.
  - `MarketplaceCard` mit verbesserten Animationen, "Hot Deal" Badges für hohe Belohnungen und optimierter visueller Hierarchie.
  - Implementierung des `w-fit` Musters für die `TabsList` Navigation gemäß Design-Guidelines.
  - Neue `TaskValidationTab` Komponente für saubere Code-Struktur.

## [1.34.4.52] - 2026-05-08

### Fixed
- **Benachrichtigungssystem**: "Hängende" rote Punkte (Notifications) behoben.
  - `thread_reply` Benachrichtigungen werden nun korrekt der Kategorie "Gruppen" zugeordnet statt fälschlicherweise "Sammelkarten".
  - Neue Logik zum automatischen Gelesen-Markieren von `card_removal` und `admin_action` Benachrichtigungen im Album und Trading Hub integriert.
  - `thread_reply` Benachrichtigungen werden nun beim Betreten der Gruppen-Seite als gelesen markiert.
  - Race-Condition im `useNotifications` Hook durch synchronisierte Status-Verwaltung behoben.

## [1.34.4.51] - 2026-05-08

### Fixed
- **Kategorie-Navigation**: Definitive Lösung für das Badge-Clipping.
  - Padding des Scroll-Containers massiv erhöht (`pt-8`), um Platz für Badges und Scale-Effekte zu schaffen.
  - Horizontale Ausrichtung durch `px-4 -mx-4` optimiert, um Scroll-Anschnitt an den Seiten zu vermeiden.
  - Badge-Offset auf `-top-1.5 -right-1.5` korrigiert für stabilere Darstellung innerhalb der Container-Safe-Zone.

## [1.34.4.50] - 2026-05-08

### Fixed
- **Kategorie-Navigation**: Clipping-Fehler bei den Aufgaben-Zählern (Badges) behoben.
  - `overflow-hidden` vom Hauptcontainer entfernt, um Badges und Auswahlringe vollständig anzuzeigen.
  - Eigener Wrapper für Kategorie-Bilder implementiert, der die Abrundung korrekt übernimmt.
  - Abstände nach oben (`pt-4`) korrigiert, um Clipping durch den Scale-Effekt zu verhindern.

## [1.34.4.49] - 2026-05-08

### Changed
- **Kategorie-Navigation**: Umfassendes Redesign der Kategorien im Marktplatz für eine hochwertigere Optik.
  - Hochkontrast-Status für aktive Kategorien (Schwarz/Weiß-Invertierung) mit Tiefenschatten.
  - Integration von Live-Zählern (Badges) für verfügbare Aufgaben pro Kategorie.
  - Optimierte Typografie und Abstände für ein professionelles "Segmented Control"-Feeling.
  - Verbesserte Hover- und Aktivierungs-Animationen für direktes haptisches Feedback.

## [1.34.4.48] - 2026-05-08

### Added
- **Ehrenpunkte-System**: Überhang aus dem Ticket-Rabatt wird nun als Ehrenpunkte (1€ = 1 Punkt) gutgeschrieben.
  - Verhindert den Wertverlust von erledigten Aufgaben, wenn der Ticket-Rabatt bereits das Maximum (30€) erreicht hat.
  - Anzeige der Ehrenpunkte im Marktplatz, in der Profil-Detailansicht und in der Admin-Nutzerverwaltung.
- **Profil-Erweiterung**: Neue Karte "Engagement & Aufgaben" in der Profilansicht zur Darstellung von Statistiken.

### Fixed
- **Admin-UI**: Fehlende Komponenten und Badge-Varianten ergänzt, Typ-Fehler in der Nutzerverwaltung behoben.

## [1.34.4.44] - 2026-05-08

### Changed
- **Benutzerverwaltung (Liste)**: Anpassung der angezeigten Spalten für eine bessere Übersicht im Arbeitsalltag.
  - Entfernung der Status-Spalte (Aktiv/Wartet), da diese Information nun primär in der Detailansicht verwaltet wird.
  - Wiedereinführung der Spalten **Kurs** und **Rolle** in der Hauptliste, um wichtige Zuordnungen auf einen Blick erfassbar zu machen.

## [1.34.4.47] - 2026-05-08

### Added
- **Erweiterte Rabatt-Historie**: Die Ticket-Rabatt-Historie zeigt nun einen vollständigen chronologischen Verlauf.
  - Integration von Aufgaben-Abschlüssen und Prämienteilungen (Claiming).
  - Sichtbarkeit von Admin-Prüfungen: Wann und durch wen eine Aufgabe freigegeben wurde.
  - Kombinierte Ansicht von manuellen Admin-Anpassungen und durch Eigenleistung gesammelten Rabatten.
- **Logging**: Neue Log-Aktionen `TASK_REWARD_CLAIMED`, `TASK_APPROVED` und `TASK_REJECTED` für eine lückenlose Nachvollziehbarkeit im Belohnungssystem.

## [1.34.4.47] - 2026-05-08

### Changed
- **Digitaler Fragebogen (Fallback)**: Kennzeichnung der Online-Anmeldung als "letzte Lösung" für abwesende oder kranke Lehrer.
  - Anpassung der Einleitung auf `/lehrer-anmeldung`.
  - Anpassung des QR-Code-Labels auf dem gedruckten Fragebogen zu "Für Abwesende: Digital nachreichen".

## [1.34.4.46] - 2026-05-08

### Changed
- **Printable Fragebogen**: Umgestaltung des Lehrer-Anmeldeformulars zu einem "Fragebogen".
  - Umbenennung aller Bezeichnungen von "Anmelde-Formular" zu "Fragebogen".
  - Entfernung formaler Labels wie "Authorized Document" im Footer.
  - Aktualisierung der Foto-Sektion: Information über Vor-Ort-Fotografie durch das Team mit optionalem späteren Termin.

## [1.34.4.45] - 2026-05-08

### Added
- **User Settings Detail View**: Implementierung einer dedizierten Detailansicht für die Benutzerverwaltung unter `/admin/user/[id]`.
  - Konsolidierung aller Benutzereinstellungen (Rollen, Kurse, Planungsgruppen, Finanzen) an einem zentralen Ort.
  - Tab-basierte Navigation für Einstellungen, Statistiken und Sicherheit.
  - Integration der Ticket-Rabatt-Historie und manuellen Anpassungen.
- **Benutzerverwaltung (Übersicht)**:
  - Streamlining der Benutzerliste durch Entfernung komplexer Eingabefelder zugunsten einer schnelleren Übersicht.
  - Erweiterung des Kontextmenüs und des Aktionen-Dropdowns um einen Schnellzugriff auf die Detailansicht ("Details anzeigen").
  - Verbesserte responsive Darstellung der Nutzerliste.

### Fixed
- **UI-Komponenten**: Die `Separator`-Komponente wurde optimiert, um Abhängigkeiten zu reduzieren und die Performance zu steigern.

## [1.34.4.43] - 2026-05-08

### Added
- **Admin-Benutzerverwaltung**: Erweiterte Kontrolle über den manuellen Ticket-Rabatt.
  - Admins können nun den Rabattbetrag (Mitarbeit-Gutschrift) manuell zwischen 0€ und 30€ anpassen.
  - Einführung einer detaillierten Rabatt-Historie für jeden Nutzer, um vergangene Anpassungen und den verantwortlichen Admin nachvollziehen zu können.
  - Validierung des Eingabebereichs (0-30€) sowohl im UI als auch in der Logik.
- **Logging**: Neue Log-Aktion `TICKET_DISCOUNT_ADJUSTED` für präzisere Audit-Trails bei Rabattänderungen.
- **Aufgaben-Kategorien Icons**: Admins können nun beim Erstellen einer Kategorie aus einer Liste von Icons wählen.
- **Image Persistence**: Placeholder-Bilder für Aufgaben sind nun persistent durch einen permanenten Seed.

### Changed
- **Kategorien UI Redesign**: Komplette Überarbeitung der Kategorie-Navigation im Marktplatz zu modernen, abgerundeten Quadraten.

### Fixed
- **Belohnungsberechnung (Aufgaben)**: Die Berechnung der Ticket-Preisreduzierung wurde robuster gestaltet.
- **Bugfix Merkliste**: Fehler beim Speichern der Merkliste behoben.

## [1.34.4.42] - 2026-05-07

### Fixed
- **Belohnungsberechnung (Aufgaben)**: Die Berechnung der Ticket-Preisreduzierung wurde robuster gestaltet.
  - Explizite Typ-Konvertierung zu `Number` stellt sicher, dass keine Berechnungsfehler bei unvollständigen Datenbank-Einträgen auftreten.
  - Die Fallback-Logik für ältere Accounts wurde verfeinert, um präzisere Ergebnisse bei individuellen Aufgabenwerten zu liefern.
- **Bugfix Merkliste**: Ein Fehler wurde behoben, bei dem die Merkliste (Favoriten) nicht korrekt gespeichert wurde (falscher Datenbank-Pfad).

## [1.34.4.41] - 2026-05-07

### Fixed
- **MarketplaceCard**: Kritischer Fehler behoben, bei dem die Variable `secondaryReward` nicht definiert war (ReferenceError).

## [1.34.4.40] - 2026-05-07

### Fixed
- **Placeholder-Bilder (Aufgaben)**: Unerwünschte Rahmen und Artefakte bei API-generierten Platzhalter-Bildern entfernt.
  - Platzhalter nutzen nun wieder `object-cover`, um den Rahmen sauber auszufüllen (keine Balken mehr für generic Content).
  - Die Such-Keywords für die Bild-API wurden verfeinert, um modernere und fehlerfreie Bilder zu erhalten.
  - Echte Aufgaben-Bilder nutzen weiterhin `object-contain` für maximale Sichtbarkeit ohne Beschnitt.

## [1.34.4.39] - 2026-05-07

### Fixed
- **Bilddarstellung (Aufgaben)**: Die Balken (Letterboxing), die bei nicht füllenden Bildern entstehen, passen sich nun dem gewählten Theme an (`bg-muted`), anstatt fest auf Schwarz eingestellt zu sein. Dies sorgt für eine harmonischere Integration in das Gesamtdesign.

## [1.34.4.38] - 2026-05-07

### Fixed
- **Bilddarstellung (Aufgaben)**: Bilder in den Marketplace-Cards, der Detailansicht und dem ImageCarousel werden nun nicht mehr abgeschnitten (`object-contain`). Falls ein Bild den Rahmen nicht ausfüllt, werden nun schwarze Balken (Letterboxing) angezeigt, um die vollständige Sichtbarkeit des Bildes zu garantieren.

## [1.34.4.37] - 2026-05-07

### Changed
- **Theme-System (Aufgaben)**: Das Aufgaben-Modul (`/aufgaben`, Detailansicht und Admin-Bereich) ist nun vollständig theme-aware.
  - Hardcodierte dunkle Hintergründe und Slate-Farben wurden durch semantische Variablen (`bg-card`, `text-foreground`, `border-border`) ersetzt.
  - Der Ticket-Bonus-Fortschrittsbalken passt sich nun dynamisch an das gewählte Theme an.
- **Konsistente Widget-Größen**: Alle Angebots-Karten (MarketplaceCards) haben nun eine einheitliche Höhe, unabhängig von der Textlänge. Dies sorgt für ein sauberes Grid-Layout und eine ruhige Optik im horizontalen Scroller.

## [1.34.4.36] - 2026-05-07

### Fixed
- **Aufgaben-Detailansicht**: Korrektur doppelt angezeigter Wasserzeichen bei Platzhalter-Bildern.
- **Code-Qualität**: Migration von Standard-`<img>`-Tags auf die Next.js-`Image`-Komponente für Platzhalter-Bilder zur besseren Performance und SEO. Bereinigung ungenutzter Imports in den Aufgaben-Modulen.

## [1.34.4.35] - 2026-05-07

### Fixed
- **Aufgaben-Detailansicht**: Platzhalter-Bilder zeigen nun auch in der Detailansicht das "Beispielbild"-Wasserzeichen bei Hover.
- **Konsistente Bilddarstellung**: Umstellung des `ImageCarousel` auf `object-cover`, um eine einheitliche Größe über alle Inserate hinweg zu gewährleisten (keine schwarzen Balken mehr bei unterschiedlichen Formaten).

## [1.34.4.34] - 2026-05-07

### Fixed
- **Aufgaben-Karten Design**: Die Bildgrößen im Marktplatz sind nun konsistent (Square Aspect Ratio + Object-Cover) für alle Inserate.
- **Platzhalter-Kennzeichnung**: Zufällige API-Bilder zeigen nun bei Hover ein "Beispielbild"-Wasserzeichen, um sie klar von echten Fotos abzugrenzen.
- **Horizontaler Scroll**: Einheitliche Kartenbreiten in der Sektion "Neu eingetroffen".

## [1.34.4.32] - 2026-05-07

### Added
- **On-the-fly Kategorien**: Neue Aufgaben-Kategorien können jetzt direkt im Erstellungsprozess hinzugefügt werden, ohne den Flow zu unterbrechen. Ein neuer Plus-Button neben der Kategoriewahl öffnet einen Dialog zur schnellen Erstellung.

### Changed
- **Booster-Slider**: Der Slider für die Booster-Belohnung bei neuen Aufgaben lässt sich nun bis auf 0 reduzieren, um Aufgaben ohne Belohnung zu ermöglichen.

## [1.34.4.31] - 2026-05-07

### Added
- **Dynamische Platzhalter-Bilder**: Aufgaben ohne eigene Fotos nutzen nun einen intelligenten Platzhalter-Dienst (LoremFlickr).
  - Die Bilder werden basierend auf der Kategorie oder dem Titel der Aufgabe ausgewählt, um thematische Relevanz zu gewährleisten.
  - Das visuelle Design der Platzhalter wurde mit Filtern (Helligkeit/Kontrast) an den modernen Stil des Marktplatzes angepasst.
  - Gilt sowohl für die Marktplatz-Übersicht als auch für die Detailansichten.

## [1.34.4.30] - 2026-05-07

### Fixed
- **Tabs UI Fix**: Die Tabs für den Marktplatz wurden repariert und nutzen nun das konsistente "Compact Toggle" Design (zentriert, abgerundet, mit Schatten).
- **Mobile Optimierung**: Komplette Überarbeitung der Aufgaben-Seite für Handys.
  - Schriftgrößen und Abstände wurden für kleine Bildschirme reduziert.
  - Kategorie-Icons und Header passen sich nun dynamisch an.
  - Grid-Layouts wurden für bessere Lesbarkeit auf Mobilgeräten optimiert.
- **Bugfix**: Fehler beim Speichern von Favoriten behoben (korrekte Datenbankreferenz).

## [1.34.4.29] - 2026-05-07

### Changed
- **Layout Refactoring (Aufgaben)**: Die Anordnung auf der Aufgaben-Seite wurde für einen intuitiveren Flow optimiert.
  - **Kategorie-Navigation zuerst**: Die Kategorien (Highlights) stehen nun ganz oben als primäres Navigations-Element.
  - **Kompakter Header**: Reduzierung der vertikalen Abstände und Integration von Suche und Ticket-Status in einen gemeinsamen Bereich.
  - **Smarter Ticket-Status**: Die Spar-Fortschrittsanzeige ist nun kompakter und fügt sich besser in die Seite ein.
  - **Verbesserte Hierarchie**: Klare Trennung zwischen "Entdecken" (Kategorien), "Suche" und "Neuheiten" (Featured Scroller).

## [1.34.4.28] - 2026-05-07

### Added
- **Dynamische Aufgaben-Kategorien**: Admins können nun Kategorien im Aufgaben-Bereich flexibel verwalten.
- **eBay-Style Layout**: Der Marktplatz (`/aufgaben`) wurde komplett überarbeitet.
  - **Aktuelle Angebote**: Ein horizontaler Slider zeigt die neuesten Inserate.
  - **Highlights**: Kategorien werden als Bild-Kacheln (ähnlich eBay) angezeigt und dienen als Schnellfilter.
  - **Kategorien-Badge**: Jede Aufgabe zeigt nun ihre Kategorie direkt auf der Karte an.
- **Admin-Kategorien-Verwaltung**: In `/admin/aufgaben` können Kategorien erstellt, mit Icons versehen und gelöscht werden.

### Changed
- **Aufgaben-Erstellung**: Beim Erstellen einer Aufgabe kann nun direkt eine Kategorie ausgewählt werden.

## [1.34.4.33] - 2026-05-07

### Fixed
- **Image Scaling Fix**: Bilder werden nun nicht mehr beschnitten (gezoomt). Alle Aufgaben-Bilder nutzen jetzt `object-contain` mit schwarzen Balken (Letterboxing), um sicherzustellen, dass das gesamte Bild unabhängig vom Format sichtbar ist.

## [1.34.4.27] - 2026-05-07

### Changed
- **Mobile-First Optimierung**: Der Aufgaben-Marktplatz wurde für Mobilgeräte perfektioniert.
  - **Kompakter Mobile-Header**: Das Ticket-Banner passt sich nun intelligent an kleine Bildschirme an.
  - **Responsive Grid**: Die Karten nutzen nun 2 Spalten auf dem Handy für bessere Übersicht.
  - **Touch-Optimierte Cards**: Schriftgrößen und Abstände wurden für die mobile Nutzung angepasst; wichtige Infos sind ohne Hover sichtbar.

## [1.34.4.26] - 2026-05-07

### Fixed
- **Firebase Permissions**: Fehler beim Speichern von Favoriten behoben (korrekte Collection-Referenz auf `profiles`).
- **Next.js Performance**: Mehrere Warnungen bezüglich `Image` (fehlende `sizes`, ungültige `position`) in den Aufgaben-Komponenten behoben.

## [1.34.4.25] - 2026-05-07

### Added
- **Marketplace Suche & Filter**: Neue Suchleiste und Schwierigkeits-Filter (Complexity) zur gezielten Suche nach Aufgaben.
- **Priority Sorting**: Gelikte Aufgaben (Favoriten) werden nun automatisch an den Anfang der Liste sortiert.

### Changed
- **Responsive Grid-Optimierung**: Verbessertes Skalierungsverhalten auf großen Bildschirmen. Die Karten sind nun kleiner und übersichtlicher (bis zu 6 Spalten auf 2K-Monitoren).
- **Tight Layout**: Header und Abstände wurden optimiert, um mehr Inhalt "Above the Fold" sichtbar zu machen.

## [1.34.4.24] - 2026-05-07

### Added
- **Funktionale Merkliste**: Der Herz-Button in den Aufgaben-Karten ist nun voll funktionsfähig und speichert Favoriten dauerhaft im Nutzerprofil (Firestore).

### Changed
- **Minimalistischer Aufgaben-Header**: Das klobige Dashboard wurde durch ein schlankes, platzsparendes Banner am oberen Rand ersetzt. Dies reduziert Scroll-Aufwand und rückt die Marktplatz-Angebote sofort ins Blickfeld.
- **UX-Optimierung**: Schnellzugriff auf Finanzen direkt aus dem Aufgaben-Banner.

## [1.34.4.23] - 2026-05-07

### Changed
- **Premium Aufgaben Marktplatz**: Kompletter Redesign des Aufgaben-Bereichs für ein modernes "Marketplace"-Gefühl (inspiriert von eBay Kleinanzeigen/Facebook Marketplace).
  - **Neue Marketplace-Cards**: Fokus auf quadratische Produktbilder, fette Belohnungs-Anzeigen ("Preis") und cleane Typografie ohne störende Footer.
  - **Interaktive Herz-Icons**: Nutzer können Aufgaben visuell "merken" (Favoriten-Vorschau).
  - **Neues Progress-Dashboard**: Elegante Visualisierung des Ticket-Status mit Fokus auf Ersparnis und Fortschritt.
  - **Motion-Experience**: Staggered Grid-Animationen für das Laden der Aufgaben-Listen.

## [1.34.4.23] - 2026-05-07

### Added
- **Manuelle Belohnungs-Abholung**: Aufgaben-Belohnungen (Booster) werden nun nicht mehr automatisch vergeben.
  - Nutzer müssen ihre Belohnung nach der Admin-Freigabe manuell über einen neuen "Belohnung abholen" Button abholen.
  - Dies maximiert den "Dopamin-Effekt" durch eine gezielte Interaktion und eine große "Fette Animation" beim Abholen.
  - Neue Cloud Function `claimTaskReward` zur sicheren Abwicklung der Belohnungsvergabe.

## [1.34.4.22] - 2026-05-07

### Added
- **Dopamine-Animationen**: Einführung von feierlichen Partikel-Effekten (Bursts) zur Belohnung von Nutzeraktionen.
  - Neuer `DopamineBurst`-Komponente basierend auf Framer Motion.
  - Automatischer Burst-Effekt beim erfolgreichen Einreichen eines Aufgaben-Beweises.
  - Einmaliger feierlicher Burst beim Betrachten einer erfolgreich abgeschlossenen Aufgabe.

## [1.34.4.21] - 2026-05-07

### Added
- **Einheitliches Profilsystem**: Einführung einer konsistenten Profilansicht für das eigene und öffentliche Profile.
  - Neues, modernes "Shared Design" mit Banner-Layout, großen Avataren und klarer Informationsstruktur.
  - Integriertes Sammelkarten-Album und Community-Status in beiden Ansichten.
- **Profil-Personalisierung**:
  - Nutzer können nun ihren Schulnamen in den Einstellungen frei bearbeiten (Standard: Gymnasial-Schule am See).
  - Das Ändern des Profilbildes (Avatar-URL) ist nun für alle Nutzer kostenlos möglich (bisher Premium-Feature).

### Changed
- **Ticket-Preissystem**: Verfeinerung der Strafreduktion.
  - Aufgaben haben nun einen individuellen Euro-Wert für den Ticket-Abzug (statt pauschal 10€).
  - Beim Erstellen einer Aufgabe kann der Abzugsbetrag (0-30€) festgelegt werden.
  - Automatisches Tracking der gesamten Reduktion im Nutzerprofil über Cloud Functions.
  - UI-Anpassungen im Marktplatz und in der Status-Übersicht zur Anzeige der spezifischen Geldbeträge.

## [1.34.4.20] - 2026-05-07

### Changed
- **Theme-System**: Grüner Akzent-Theme (Classic Green) ist jetzt kostenpflichtig
  - Kostenlose Basis-Themes: Pure White (Light) und Midnight Black (Dark)
  - Alle anderen Premium-Themes erfordern Freischaltung im Shop
  - Alte Benutzer mit Classic Green werden automatisch zu Pure White downgraded
- **Shop**: Cosmetics können jetzt gekauft werden
  - Premium Theme Pack (4,99€) – Schaltet alle Premium-Akzentthemen frei
  - Custom User Icon (2,99€) – Erlaubt eigene Avatar-URLs
  - Nach dem Kauf sind die Features sofort verfügbar
- **Stripe Integration**: Cosmetics jetzt vollständig in die Stripe-Checkout-Integration integriert

## [1.34.4.19] - 2026-05-07

### Added
- **Ticket-Preissystem**: Implementierung eines dynamischen Straf- und Rabattsystems für Ticketpreise.
  - Standardmäßig 30€ Aufschlag für fehlende Mitarbeit.
  - Jede erledigte Aufgabe im Marktplatz reduziert den Aufschlag um 10€.
  - Admins können manuelle Gutschriften für externes Engagement vergeben.
  - Anzeige des individuellen Ticketpreises (UVP + Strafe) im Finanzwidget.
  - Status-Widget auf der Aufgaben-Seite zur Verfolgung der Preisreduktion.
- **Einstellungen**: Globale Konfiguration für Basis-Strafe und Abzugsbetrag in den Finanz-Einstellungen hinzugefügt.

## [1.34.4.18] - 2026-05-07

### Fixed

- **Avatare**: Externe DiceBear-Avatare können jetzt wieder über `next/image` geladen werden, indem `api.dicebear.com` in der Next.js-Bildkonfiguration erlaubt ist.

## [1.34.4.17] - 2026-05-06

### Changed
- **Trading**: Mindestanforderung für Tausch wieder auf 100 Karten angehoben (für maximale Exklusivität).
- **News Reactions**: Nutzer können nun nur noch EINE Reaktion pro News-Beitrag abgeben. Bei Auswahl eines neuen Emojis wird die vorherige Reaktion automatisch entfernt.
- **News**: Korrektur der Hype-Ankündigung (Limit & Rarity-Wording).

## [1.34.4.16] - 2026-05-06

### Fixed
- **Settings Layout (Desktop/Mobile)**: Drastisch verbesserte Sichtbarkeit und Navigation
  - Header-Höhe reduziert (kleiner Padding, kleinere Schriften)
  - Sidebar ist jetzt auf Desktop sichtbar und funktionsfähig
  - Content-Padding korrekt angepasst - kein Overlap mit Header mehr
  - Mobile Sidebar-Position synchronisiert mit neuem Header
  - Alle 8 Einstellungen-Sections jetzt vollständig zugreifbar
- **Settings Navigation**: Behoben dass Sidebar auf Desktop nicht angezeigt wurde (`md:display` → `md:block`)

## [1.34.4.15] - 2026-05-06

### Fixed
- **Settings Layout**: Behobene ungültige Button-Props und Header-Padding für bessere Content-Sichtbarkeit
  - Entfernte ungültige `render=` Props auf Link-Buttons (Profil, Shop, Referrals)
  - Erhöhte Header-Padding von 60px/76px auf 72px/84px
  - Korrigierte mobile Sidebar-Position zur Header-Höhe
- **Settings Page**: JSX Parsing-Fehler behoben (fehlende div-Schließung)

## [1.34.4.15] - 2026-05-06

### Fixed
- **News Reactions**: Kritischer Fehler behoben, bei dem leere Emojis in den News-Reaktionen zu Firebase-Fehlern und React-Key-Konflikten führten. Die Emoji-Listen wurden mit validen Standard-Emojis gefüllt und eine Validierung gegen leere Eingaben hinzugefügt.

## [1.34.4.14] - 2026-05-06

### Added
- **Hype Update**: Trading Hub Alpha und Kampf-System offiziell für alle Nutzer freigeschaltet.
- **Social Loop**: Neue News-Ankündigung im Dashboard integriert, um Nutzer über die neuen Interaktionsmöglichkeiten zu informieren.

### Changed
- **Trading**: Die Mindestanforderung für die Teilnahme am Tausch wurde von 100 auf 10 Karten gesenkt, um die soziale Interaktion für neue Nutzer massiv zu vereinfachen.
- **System Control**: Combat-Status von `admins_only` auf `enabled` gesetzt.

## [1.34.4.13] - 2026-05-06

### Changed
- **Settings Layout**: Komplett neue GitHub-ähnliche 2-Spalten-Navigation in den Einstellungen implementiert. Linke Sidebar mit Navigationsmenu, rechts Hauptinhalt. Mobile-responsiv mit Hamburger-Menu auf kleinen Geräten.
- **Settings UX**: Jede Einstellung hat jetzt eine eigene Sektion mit Überschrift und Beschreibung. Bessere visuelle Hierarchie und Navigation zwischen Sections.

## [1.34.4.12] - 2026-05-06

### Changed
- **Footer**: Der Status-Hinweis "SYSTEMS OPERATIONAL" wurde aus dem Footer entfernt.

## [1.34.4.11] - 2026-05-06

### Fixed
- **Dashboard**: Die Progressbar des Finanzierungsziels zeigt nun auch auf dem Dashboard die detaillierte Kurs-Verteilung und Farben analog zur Finanzseite an.
- **Finance Utils**: Berechnung der Finanz-Verteilung in eine zentrale Utility-Funktion ausgelagert.

## [1.34.4.10] - 2026-05-01

### Changed
- **Vault Depth**: Der Obsidian-Vault wurde um Systems-, Meta- und Decisions-Notizen erweitert, damit Beiträge fuer alle relevanten Faelle eine klare Anlaufstelle haben.
- **Vault Hygiene**: Bestehende Vault- und Leitnotizen wurden auf konsistente Markdown-Struktur gebracht.

## [1.34.4.9] - 2026-05-01

### Changed
- **Project Knowledge**: `docs/PROJECT_KNOWLEDGE.md` nennt jetzt den Vault als zentrales Handbuch und setzt ihn an den Anfang der Quellen.

## [1.34.4.8] - 2026-05-01

### Changed
- **Agent Entry**: `GEMINI.md` weist nun ebenfalls direkt auf den Vault als ersten Arbeitsschritt hin.

## [1.34.4.7] - 2026-05-01

### Changed
- **Vault First**: Der Obsidian-Vault ist nun in den Haupt-Einstiegen als erster Startpunkt verankert, damit alle Contributors dort beginnen.

## [1.34.4.6] - 2026-05-01

### Added
- **Obsidian-Vault**: Neuer Vault unter `vault/` als zentrales Handbuch fuer Agenten, Architektur, Design, Prozesse, Testing und Compliance angelegt.
- **Navigation**: Die Einstiegspunkte in `README.md`, `GEMINI.md`, `docs/AGENT_CONTEXT_INDEX.md` und `docs/PROJECT_KNOWLEDGE.md` verweisen jetzt auf den Vault.

## [1.34.4.5] - 2026-05-01

### Added
- **TCG Dashboard**: Neuer News-Banner im TCG-Dashboard integriert, der direkt auf wichtige Season-Ankündigungen verlinkt.

## [1.34.4.4] - 2026-04-29

### Added
- **Benachrichtigungen**: Implementierung eines nativen Push-Benachrichtigungs-Systems (Web Push) via Firebase Cloud Messaging (FCM).
  - Nutzer können nun Push-Benachrichtigungen für neue News, zugewiesene Aufgaben (Todos), neue Termine und Direktnachrichten (Gruppen-Messages) aktivieren.
  - Neuer Service Worker für den Empfang von Nachrichten im Hintergrund.
  - Opt-In Schalter in den Einstellungen zur Verwaltung der Benachrichtigungen hinzugefügt.
  - Backend-Trigger (Cloud Functions) zum automatischen Versenden der Benachrichtigungen bei neuen Einträgen integriert.

## [1.34.4.3] - 2026-04-29

### Fixed
- **Logo**: Die Logo-Assets wurden in den `src`-Ordner verschoben (`src/assets/logos/`) und die Importe in `Logo.tsx` wurden auf `@/assets/...` umgestellt, um die Zuverlässigkeit der Modulauflösung in TypeScript zu verbessern.
- **Config**: `baseUrl` wurde zur `tsconfig.json` hinzugefügt, um eine konsistente Auflösung von Pfad-Aliasen zu gewährleisten.

## [1.34.4.2] - 2026-04-29

### Fixed
- **Logo**: Die Import-Pfade in `src/components/Logo.tsx` wurden korrigiert und die Logo-Dateien umbenannt, um Leerzeichen und Sonderzeichen zu entfernen, die zu Build-Fehlern führten.
- **Abstimmungen**: Ein TypeScript-Typisierungsfehler beim Laden von Einreichungen in `src/app/abstimmungen/[id]/page.tsx` wurde behoben.

## [1.34.4.1] - 2026-04-29

### Changed
- **Sammelkarten-Manager**: Der Index (`cardNumber`) wird nun basierend auf der Seltenheit vergeben.
  - Ikonische Karten erhalten die niedrigsten Nummern (001, 002...), gefolgt von Legendär, Mythisch, Episch, Selten und Gewöhnlich.
  - Neue Funktion "Neu nummerieren" im Pool-Manager hinzugefügt, um alle Karten im Pool automatisch nach Seltenheit und Name zu sortieren und neu zu indizieren.
  - Die Standard-Sortierung im Pool-Manager wurde auf den Karten-Index (`cardNumber`) umgestellt.
- **Admin-Pool**: Die Seltenheits-Sortierung wurde vereinheitlicht, sodass seltenere Karten (Ikonisch zuerst) nun bei aufsteigender Sortierung am Anfang der Liste stehen.

## [1.34.4.0] - 2026-04-29

### Added
- **Umfrage-Export**: Umfrageergebnisse können nun als CSV-Datei exportiert werden.
  - Der Export enthält alle Antwortmöglichkeiten, Stimmenanzahlen und die Namen der Teilnehmer.
  - Eigene Vorschläge (Submissions) werden ebenfalls im Export berücksichtigt und gruppiert dargestellt.
  - Zugriff auf den Export haben Planer, Administratoren und der jeweilige Ersteller der Umfrage.

## [1.34.3.2] - 2026-04-29

### Fixed
- **Export**: Überarbeitung der Druck-Sichtbarkeit mit einem robusteren `visibility`-Ansatz. Dies behebt das Problem der leeren Seiten bei beiden Export-Größen (Fullsize & Poker), indem die Export-Ansicht gezielt eingeblendet wird, während der Rest der App während des Drucks unsichtbar bleibt.

## [1.34.3.1] - 2026-04-29

### Fixed
- **Export**: Behebung eines Fehlers, bei dem der Poker-Karten-Export (Originalgröße) eine leere Seite erzeugte. Die Print-Sichtbarkeit wurde optimiert, um sicherzustellen, dass die Karten unabhängig von der Verschachtelung im DOM korrekt gerendert werden.

## [1.34.3.0] - 2026-04-29

### Added
- **Sammelkarten-Export**: Einführung von Export-Größenoptionen im PDF-Dialog.
  - **Fullsize**: Die bisherige postergroße Ansicht (skaliert auf A4).
  - **Originalgröße**: Export in exakten Poker-Karten-Maßen (63mm x 88mm), ideal für den direkten Druck auf Karten-Rohlinge oder Bastelbögen.

## [1.34.2.16] - 2026-04-29

### Fixed
- **Export**: Radikale Lösung des „Zwei-Seiten-Problems“. Die Export-Ansicht wird nun absolut auf der Seite fixiert und alle anderen Seitenelemente werden während des Drucks zwangsweise ausgeblendet. Die Skalierung wurde auf 2.05 optimiert, um jeglichen Überlauf (Overflow) zu eliminieren.

## [1.34.2.15] - 2026-04-29

### Fixed
- **UI/UX**: Die Varianten-Auswahl im Export-Dialog wurde komplett überarbeitet. Conflicting Event-Handler wurden entfernt und visuelles Feedback (Farben, Animationen) hinzugefügt, damit sich die Auswahl „snappy“ und direkt anfühlt.

## [1.34.2.14] - 2026-04-29

### Fixed
- **Code**: Syntax-Fehler in der `layout.tsx` behoben, der durch eine fehlerhafte Text-Ersetzung in den Druck-Styles verursacht wurde.

## [1.34.2.13] - 2026-04-29

### Fixed
- **Export**: Ein „Print Lock“ verhindert nun, dass Karten beim PDF-Export doppelt getriggert werden (behebt das Problem der mehrfachen PDF-Dialoge).
- **Export**: Durch striktere CSS-Höhenbeschränkungen (`100vh`) und `overflow: hidden` im Druck-View wird die Erstellung einer unnötigen zweiten Leerseite im PDF unterbunden.

## [1.34.2.12] - 2026-04-29

### Fixed
- **Sammelkarten-Design**: Die Position der Kartennummer wurde auf den vorherigen Stand zurückgesetzt, da dieser bereits als optimal bewertet wurde.

## [1.34.2.11] - 2026-04-29

### Changed
- **Sammelkarten-Design**: Die Position der Kartennummer wurde final angepasst (Nudge) und über alle Komponenten hinweg harmonisiert.
- **Sammelkarten-Design**: Das Muster-Overlay wurde nun auch bei der „Iconic“ (Ikonen) Rarity entfernt, um ein ruhigeres Gesamtbild zu gewährleisten.
- **Export**: Der Skalierungsfaktor im PDF-Export wurde von 2,2 auf 2,1 reduziert, um einen sichereren Druckbereich zu garantieren und potenzielle Rendering-Artefakte zu minimieren.

## [1.34.2.10] - 2026-04-29

### Fixed
- **Sammelkarten-Design**: Das Hexagon-Muster im Hintergrund der „seltenen“ Karten-Variante wurde entfernt, um ein klareres Erscheinungsbild zu erzielen.

## [1.34.2.6] - 2026-04-29

### Changed
- **Sammelkarten-Manager**: Der Manager ist nicht mehr exklusiv für Admins zugänglich, sondern kann nun auch von Benutzern mit der Rolle „Planer“ verwendet werden.
- **Berechtigungen**: Einführung des `StaffGuard` zur konsistenten Verwaltung von Admin- und Planer-Zugriffen.
- **Navigation**: Der Sammelkarten-Manager wurde als Unterpunkt im Bereich „Sammelkarten“ in der Sidebar für berechtigte Rollen hinzugefügt.

## [1.34.2.5] - 2026-04-29

### Fixed
- **Sammelkarten-Manager (Matrix)**: Die Position der Kartennummer auf den Lehrer-Sammelkarten wurde symmetrisiert. Der Abstand zum rechten Rand entspricht nun dem Abstand zum oberen Rand.

## [1.34.2.7] - 2026-04-29

### Changed
- **Marketing/Dokumentation**: Das Pitch-Dokument wurde um konkrete Produktionszahlen, die Seltenheits- und Variantenstruktur sowie einen realistischen Kostenrahmen für Karten- und Effektfoliendruck ergänzt.

## [1.34.2.6] - 2026-04-29

### Changed
- **Marketing/Dokumentation**: Das Pitch-Dokument für das Sammelkarten-Konzept wurde zu einem mehrseitigen, schulleitungstauglichen Konzeptpapier ausgebaut, mit Fokus auf Freiwilligkeit, Datenschutz, Fairness und Kostenrahmen.

## [1.34.2.8] - 2026-04-29

### Changed
- **Marketing/Dokumentation**: Pitch-Dokument um verbindliche rechtliche Leitplanken, Einwilligungs- und Proof-Prozess sowie konkreten Ablauf (Fragebögen, Foto-Termine, Datenaufbewahrung) ergänzt.

## [1.34.2.9] - 2026-04-29

### Changed
- **Marketing/Dokumentation**: Pitch-Dokument um Finanzierungshinweis, Lessons-Learned (früherer Versuch) und Maßnahmen zur finanziellen Absicherung ergänzt.

## [1.34.2.4] - 2026-04-29

### Added
- **Sammelkarten-Manager**: Auswahl-Dialog für PDF-Export-Varianten (Standard, Holo, Selten).
- **Sammelkarten-Manager**: Unterstützung für sequenziellen PDF-Export mehrerer Varianten (Print-Queue), wobei jede Variante als eigene PDF-Datei ausgegeben wird.

## [1.34.2.3] - 2026-04-27

### Added
- **Sammelkarten-Manager**: Dynamische Benennung der PDF-Export-Dateien. Exportierte Einzelkarten werden nun automatisch nach dem Format `Nachname_Seltenheit_Variante.pdf` benannt.

## [1.34.2.2] - 2026-04-27

### Changed
- **Sammelkarten-Manager**: Die Karten im Einzelkarten-PDF-Export wurden um den Faktor 2,2 skaliert, um die DIN-A4-Seite im Querformat optimal auszufüllen.

## [1.34.2.1] - 2026-04-27

### Fixed
- **Sammelkarten-Manager**: Korrektur der Spiegelung der Kartenrückseite beim Einzelkarten-PDF-Export. Die Rückseite wird nun lesbar und ungespiegelt dargestellt.

## [1.34.2.0] - 2026-04-27

### Added
- **Sammelkarten-Manager**: Implementierung eines Einzelkarten-PDF-Exports im Querformat.
  - Neuer "Export PDF" Button für jede Karte im Pool (Grid- und Tabellenansicht).
  - Automatischer Druckdialog mit optimiertem Landscape-Layout, das Vorder- und Rückseite der Karte nebeneinander darstellt.
  - Isolierte Druckansicht, die das restliche UI während des Exports ausblendet.

## [1.34.1.24] - 2026-04-26

### Fixed
- **Build**: Korrektur eines TypeScript-Fehlers in `firebase-admin-server.ts`. Die `firestore()`-Methode des Admin-Apps wurde durch den expliziten `getFirestore`-Import ersetzt, um die korrekte Typisierung für die Datenbank-ID `abi-data` sicherzustellen.

## [1.34.1.23] - 2026-04-26

### Fixed
- **Datenbank (Firestore)**: Behebung von kritischen Fehlern in der Produktionsumgebung basierend auf Log-Analysen.
  - Hinzufügen des fehlenden zusammengesetzten Index für `matches` (Status + turnStartTime), um die Timeout-Prüfung im Combat-System zu reparieren.
  - Korrektur der Datenbank-Initialisierung: Alle Admin-API-Routen nutzen nun explizit die Datenbank `abi-data`, was 502/NOT_FOUND Fehler bei der Sitzungsbeendigung (`close-session`) behebt.
  - Robusteres Fallback für Firebase Admin: In Produktionsumgebungen wird nun automatisch auf `applicationDefault()` zurückgegriffen, falls explizite Service-Account-Umgebungsvariablen fehlen.

## [1.34.1.22] - 2026-04-26

### Fixed
- **Admin/Benutzerverwaltung**: Verbesserung der mobilen Nutzbarkeit.
  - Das Drei-Punkte-Aktionsmenü wurde in die mobile Listenansicht integriert, sodass Nutzeraktionen (Sperren, Löschen, Rollenänderung) nun auch auf kleinen Bildschirmen verfügbar sind.
  - Die Kurs- und Gruppenauswahl wurde zur mobilen Ansicht hinzugefügt, um die vollständige Profilverwaltung auf mobilen Endgeräten zu ermöglichen.
  - Optimierung des mobilen Layouts der Benutzerkarten für bessere Übersichtlichkeit.

## [1.34.1.21] - 2026-04-26

### Added
- **Kalender**: Einführung einer Löschfunktion für Termine. Termine können nun direkt über den Bearbeiten-Dialog gelöscht werden (nur für Planer/Admins).

### Fixed
- **Kalender**: Wiederherstellung der Bearbeitbarkeit von Terminen. 
  - Die Bearbeitungs-Schaltfläche (Stift-Icon) wurde in die Termin-Karten der Seitenleiste integriert.
  - Der Bearbeiten-Dialog wurde zusätzlich auf der Termin-Detailseite verfügbar gemacht.
  - Jede Termin-Karte im Kalender verlinkt nun korrekt auf die entsprechende Detailseite.

## [1.34.1.20] - 2026-04-26

### Fixed
- **Analytics (PostHog)**: Korrektur eines TypeScript-Build-Fehlers in `providers.tsx`. Die Konfigurationseigenschaft `cookie_domain` wurde durch `cross_subdomain_cookie: true` ersetzt, da erstere im offiziellen PostHog-SDK nicht direkt im Config-Objekt unterstützt wird.

## [1.34.1.19] - 2026-04-26

### Fixed
- **Analytics (PostHog)**: Behebung der fehlerhaften Initialisierung außerhalb von localhost.
  - Der Standard-Host wurde auf die US-Instanz (`us.i.posthog.com`) korrigiert, um mit dem verwendeten Projekt-Token im Entwicklungsprozess übereinzustimmen.
  - Implementierung einer dynamischen `cookie_domain`-Erkennung (z.B. `.abi-planer-27.de`), um ein nahtloses Tracking über alle Subdomains (Dashboard, Shop, TCG) hinweg zu ermöglichen.
  - Umstellung auf `person_profiles: 'always'`, um auch anonyme Nutzer zuverlässig zu erfassen und die Datenqualität im Dashboard zu verbessern.
  - Hinzufügen von Debug-Logging in der Konsole zur schnelleren Identifizierung von fehlenden Umgebungsvariablen in Produktionsumgebungen.

## [1.34.1.18] - 2026-04-26

### Fixed
- **Build**: Ausschluss des Verzeichnisses `altVer` von der TypeScript-Kompilierung. Dies verhindert Build-Fehler, die durch Typ-Inkonsistenzen in alten oder parallelen Entwicklungsständen innerhalb des Repositorys verursacht wurden.

## [1.34.1.17] - 2026-04-26

### Fixed
- **Build**: Behebung des "Both middleware file and proxy file are detected" Fehlers in Next.js 16. Die Migration von `middleware.ts` zu `proxy.ts` wurde korrigiert, indem die exportierten Funktionen ebenfalls von `middleware` zu `proxy` umbenannt wurden. Dies verhindert Konflikte bei der automatischen Datei-Erkennung durch Turbopack und entspricht den neuen Konventionen von Next.js 16.

## [1.34.1.16] - 2026-04-26

### Fixed
- **UI/Base UI**: Behebung einer React-Warnung ("unknown property"), bei der die `nativeButton`-Eigenschaft fälschlicherweise an native DOM-Elemente durchgereicht wurde. Die Propagierung wurde so verfeinert, dass sie nur noch für React-Komponenten erfolgt, während native HTML-Tags sauber bleiben.

## [1.34.1.15] - 2026-04-26

### Fixed
- **UI/Base UI**: Behebung eines kritischen Fehlers ("invalid-render-prop"), bei dem die `render`-Eigenschaft fälschlicherweise einen String statt eines validen React-Elements erhielt. Alle UI-Komponenten stellen nun sicher, dass die `render`-Eigenschaft immer ein klonbares Element (`<button />`, `<div />`) oder `undefined` ist, was die Stabilität der Anwendung bei der Verwendung von Triggern und Buttons wiederherstellt.

## [1.34.1.14] - 2026-04-26

### Fixed
- **UI/Base UI**: Implementierung einer robusten `nativeButton`-Propagierung mittels `React.cloneElement`. Trigger- und Close-Komponenten geben nun ihren berechneten `nativeButton`-Status explizit an ihre Kinder weiter. Dies stellt sicher, dass benutzerdefinierte Komponenten wie `Button` synchronisiert sind und ihr Rendering (z.B. Umstellung auf `div`) korrekt anpassen, um widersprüchliche Accessibility-Warnungen in der Konsole vollständig zu eliminieren.

## [1.34.1.13] - 2026-04-26

### Fixed
- **UI/Base UI**: Verfeinerung der `nativeButton` Logik zur Vermeidung von gegensätzlichen React-Warnungen. Die Komponenten erkennen nun zuverlässig native HTML-Buttons und setzen die Eigenschaft entsprechend. Zusätzlich wurde die `Button`-Komponente so erweitert, dass sie bei `nativeButton={false}` (z.B. innerhalb von Triggern) automatisch als `div` statt als `button` rendert, was die strengen Anforderungen von Base UI an die Barrierefreiheit und Attribut-Validierung erfüllt, ohne die Funktionalität einzuschränken.

## [1.34.1.12] - 2026-04-26

### Fixed
- **UI/Base UI**: Vollständige Behebung von React-Warnungen bezüglich der `nativeButton` Eigenschaft in den UI-Komponenten `Dialog`, `Popover`, `Sheet` und `DropdownMenu`. Die Trigger- und Close-Komponenten erkennen nun automatisch, wenn sie mit benutzerdefinierten Komponenten (wie `Button` oder `ContextMenuItem`) verwendet werden, und deaktivieren die redundanten nativen Button-Prüfungen, um Konsolenfehler zu vermeiden und die Barrierefreiheit zu wahren.

## [1.34.1.11] - 2026-04-26

### Fixed
- **Kalender**: 
  - Ein Linksklick auf einen Tag im Kalender öffnet nicht mehr fälschlicherweise direkt den Dialog zur Terminerstellung, sondern dient nur noch der Auswahl des Tages.
  - Das Kontextmenü (Rechtsklick) auf Kalendertagen wurde repariert und lässt sich nun wieder ordnungsgemäß nutzen, um Tage auszuwählen oder direkt Termine hinzuzufügen.
  - Fehler bei der Anzeige behoben: Mehrtägige Termine werden jetzt wieder korrekt über alle relevanten Tage im Kalender-Grid verteilt visualisiert.

## [1.34.1.10] - 2026-04-26

### Fixed
- **Analytics**: Wiederherstellung der fehlenden `PHProvider` und `PostHogPageView` Komponenten. Die PostHog-Integration ist nun wieder funktionsfähig und trackt Seitenaufrufe sowie Benutzeraktionen korrekt im Next.js App Router.
- **PostHog**: Korrektur der Initialisierungs-Logik unter Verwendung der korrekten Umgebungsvariablen (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`).

## [1.34.1.9] - 2026-04-26

### Changed
- **Kalender**: Umstellung auf die standardisierte `Calendar` UI-Komponente, um eine konsistente visuelle Integration in das aktuelle Design-System zu gewährleisten.

## [1.34.1.8] - 2026-04-26

### Fixed
- **Layout**: Korrektur der `AppShell` Desktop-Struktur. Durch das Hinzufügen von `lg:flex` wird die Sidebar nun wieder korrekt neben dem Inhaltsbereich positioniert, anstatt ihn nach unten aus dem sichtbaren Bereich zu schieben.

## [1.34.1.7] - 2026-04-26

### Fixed
- **Proxy/Routing**: Behebung einer Endlos-Weiterleitungsschleife auf `localhost` Subdomains (z.B. `dashboard.localhost`). Das Proxy-System erkennt nun korrekt, wenn es sich bereits auf der Ziel-Subdomain befindet, und verhindert redundante Domain-Präfixe.

## [1.34.1.6] - 2026-04-26

### Added
- **PostHog Analytics Integration**: Umfassendes Produkt-Tracking inklusive Funnels, Retention-Analyse, Heatmaps und Session Replays zur Verbesserung der User Experience.
- **Privacy-First Tracking**: Nutzung der PostHog EU-Cloud (Frankfurt), anonymisierte IPs und Cookie-freie Persistenz (Memory-Mode) für maximale DSGVO-Konformität.
- **Event-Bridging**: Automatische Weiterleitung aller `logAction`-Events an PostHog bei gleichzeitiger Filterung von PII (personenbezogenen Daten).
- **User Journey Tracking**: Automatisches Tracking von Seitenaufrufen im Next.js App Router.

### Changed
- **Datenschutzerklärung**: Aktualisiert auf Version 26.04.2026 mit neuem Abschnitt zur Produktanalyse via PostHog.
- **AuthContext**: Automatische Identifikation von Nutzern in PostHog nach erfolgreichem Login.
- **Env Reference**: Dokumentation der erforderlichen PostHog Umgebungsvariablen ergänzt.

## [1.34.1.6] - 2026-04-26

### Fixed
- **UI/Base UI**: Umfassende Behebung von Base UI Warnungen bezüglich der `nativeButton` Eigenschaft. Die Komponenten `Button`, `DialogTrigger` und `DialogClose` erkennen nun präziser, wann sie sich als natives HTML-Button-Element verhalten sollen, insbesondere bei Verwendung von `asChild` oder benutzerdefinierten `render` Props.

## [1.34.1.5] - 2026-04-26

### Fixed
- **UI/Accessibility**: Behebung einer Base UI Warnung bezüglich nativer Button-Semantik in `DialogTrigger` und `DialogClose`.
- **Kalender**: Umstellung der Tages-Zellen im Kalender von `div` auf `button` für bessere Barrierefreiheit und zur Erfüllung der Base UI Anforderungen.

## [1.34.1.4] - 2026-04-26

### Fixed
- **Navigation**: Wiederherstellung des klassischen Navigationssystems (Navbar/DashboardNavbar). Das neue Sidebar-Design wurde entfernt, um das bewährte Layout und die gewohnte Nutzererfahrung wiederherzustellen.
- **Layout**: Korrektur der `AppShell` Struktur, um wieder mit dem Standard-Layout (ohne Sidebar-Flex-Container) zu arbeiten.

## [1.34.1.3] - 2026-04-26

### Fixed
- **Routing**: Korrektur des Auto-Routing-Systems für angemeldete Nutzer auf der Landingpage. Die Weiterleitung zum Dashboard funktioniert nun auch korrekt in lokalen Entwicklungsumgebungen (`localhost`), ohne dass spezifische Umgebungsvariablen (`NEXT_PUBLIC_DASHBOARD_URL`) gesetzt sein müssen.

## [1.34.1.2] - 2026-04-26

### Fixed
- **Next.js Proxy/Middleware**: Korrektur eines Export-Fehlers in `src/proxy.ts`. Es wurden sowohl ein Default-Export als auch ein benannter `proxy`-Export hinzugefügt, um die Anforderungen neuerer Next.js-Versionen (v15/v16) an die Middleware/Proxy-Erkennung zu erfüllen.

## [1.34.1.1] - 2026-04-26

### Fixed
- **Profil-Seite**: Korrektur des fehlerhaften Links zum Einstellungsbereich (von `/settings` zu `/einstellungen`).
- **Sidebar**: Refactoring der Active-State-Logik. Parent-Items bleiben nun auch auf Detail-Seiten (z. B. `/news/[id]` oder `/abstimmungen/[id]`) korrekt hervorgehoben.
- **Dark Mode**: Umfassender Audit und Fix von visuellen Inkonsistenzen in der Sidebar und auf der Profilseite. Hardcodierte Farben wurden durch CSS-Variablen (`bg-card`, `text-foreground`, `border-border`) ersetzt, um eine konsistente Darstellung im Dark Mode zu gewährleisten.

### Changed
- **Versionierung**: Synchronisierung der in der Sidebar angezeigten Versionsnummer mit der tatsächlichen Projektversion (`v1.34.1.1`).

## [1.34.1.0] - 2026-04-26

### Changed
- **Kalender-Design**: Vollständige Überarbeitung des Terminkalenders (`/kalender`) mit einer interaktiven Monatsübersicht.
  - Einführung eines visuellen Monats-Grids mit Datums-Logik (Wochentage, Monatswechsel).
  - Implementierung einer Sidebar für anstehende Termine (Desktop: rechts, Mobile: unten).
  - Integration von Firebase-Events direkt in das Grid (Punkt-Indikatoren für Termine).
  - Optimierung des Workflows: Klick auf einen Tag öffnet direkt den `AddEventDialog` mit vorausgefülltem Datum.
  - Unterstützung für Dark Mode und verbesserte mobile Responsivität.

## [1.34.0.61] - 2026-04-26

### Changed
- **Profil-Design**: Komplette Überarbeitung der Profilseite (`/profil`) im modernen "Hero"-Stil.
  - Einführung eines dunklen Slate-Banners und eines überlappenden Avatars mit dynamischem Dicebear-Seed.
  - Integration des Sammelkarten-Albums und der Freundes-Übersicht in das neue Layout.
  - Optimierung der Informationsdarstellung (Rollen-Badges, Schulname, Mitgliedschafts-Status).

## [1.34.0.60] - 2026-04-26

### Added
- **Datenbank-Cleanup**: Einführung des administrativen Skripts `scripts/db_cleanup.ts` zur Bereinigung von Legacy-Collections (votes, poll_votes, teacher_ratings) und zur automatisierten Archivierung/Löschung veralteter Logs und Benachrichtigungen.

### Changed
- **Sicherheits-Regeln**: Bereinigung der `firestore.rules` durch Entfernung nicht mehr genutzter Top-Level-Collections (votes, poll_votes, teacher_ratings, fraud_alerts) zur Verbesserung der Übersichtlichkeit und Wartbarkeit.

## [1.34.0.59] - 2026-04-26

### Changed
- **Terminologie-Update**: Umbenennung von "Kohorte" in "Jahrgang" (technisch: `year_group`, `YearGroup`, `yearGroupId`) in allen Planungsdokumenten (`new/01-08`) und im Master-Design-Dokument zur Verbesserung der Nutzerakzeptanz und Konsistenz.

## [1.34.0.58] - 2026-04-26

### Added
- **v2 Dokumentation**: Detaillierung der Billing-Flows (Stripe, Idempotenz, Refunds) und Sicherheits-Protokolle (Tenant-Isolation, DSGVO-Audit-Logging) für Abi-Planer v2 in `new/04-billing-entitlements.md` und `new/05-security-compliance.md`.

## [1.34.0.57] - 2026-04-26

### Fixed
- **Turbopack-Absturz**: Behebung eines fatalen Fehlers ("corrupted database") durch Bereinigung des `.next`-Verzeichnisses.
- **Middleware-Migration**: Umbenennung von `src/middleware.ts` zu `src/proxy.ts`, um der Deprecation-Warnung von Next.js 16 zu entsprechen.

## [1.34.0.56] - 2026-04-26

### Fixed
- **Polls-Berechnung**: Korrektur der Prozentanzeige in Umfragen. Der Nenner (`totalParticipants`) wird nun robust berechnet, indem das Maximum aus der Teilnehmer-Subcollection und der tatsächlichen Stimmen-Anzahl verwendet wird. Dies verhindert fehlerhafte Werte über 100%, wenn die Teilnehmer-Tracking-Daten (z. B. durch Legacy-Polls) unvollständig sind.

## [1.34.0.55] - 2026-04-26

### Changed
- **Repository-Cleanup (sicher)**: Nicht aktiv referenzierte Einmal-Skripte aus dem Root-/Scripts-Bereich in eine Legacy-Struktur unter `scripts/legacy/` verschoben, um die produktive Skriptfläche zu verkleinern.
- **Datei-Organisation**: Root-Beispieldateien für News nach `docs/archive/repo-cleanup/news-examples/` verschoben, damit das Projekt-Root klarer bleibt.

### Removed
- **Lokale Artefakte**: Temporäre Build-/Cache-Dateien wie `tsconfig.tsbuildinfo`, `.DS_Store` und `test-results/.last-run.json` aus dem Arbeitsstand entfernt.

### Notes
- Sensible Exportdateien (z. B. Lehrer-/Feedback-Exporte) wurden in dieser Runde bewusst nicht automatisch gelöscht und bleiben bis zur dokumentierten DSGVO-Prüfung unverändert.

## [1.34.0.54] - 2026-04-25

### Fixed
- **Sammelkarten-Manager (Matrix)**: Tatsächliche Korrektur der Bild-Transformationen durch korrekten Zugriff auf das `imageSettings`-Objekt (bisher wurden fälschlicherweise `data`-Felder abgefragt, die im neuen Schema nicht mehr existierten).

## [1.34.0.53] - 2026-04-25

### Changed
- **Versions-System**: Finale Konsolidierung des vierstufigen Formats (`1.34.0.53`) über alle Projektdateien und die gesamte Historie des aktuellen Tages.

## [1.34.0.52] - 2026-04-25

### Fixed
- **Sammelkarten-Manager (Matrix)**: Bild-Transformationen (Skalierung, Position, Rotation) werden nun auch in der Design-Matrix korrekt angezeigt. Bisher wurden dort nur die Standard-Werte verwendet, was zu fehlerhaften Kartenvorschauen führte.

## [1.34.0.51] - 2026-04-25

### Changed
- **Sammelkarten-Design (Holo Differentiation)**: Holo-Karten verschiedener Seltenheiten unterscheiden sich nun deutlicher voneinander.
  - **Digitale Karten**: Der Holo-Effekt ("Oil-Slick") integriert nun dynamisch die jeweilige Seltenheitsfarbe in die Schimmer-Gradienten.
  - **Druck-Karten**: Die Farbsättigung der Holo-Hintergründe wurde durch zusätzliche Blend-Layer (`mix-blend-overlay`) verstärkt, um die Rarity-Farbe prominenter hervorzuheben.

## [1.34.0.50] - 2026-04-25

### Changed
- **Versions-Format**: Korrektur der Versionsnummer auf das vierstufige Format (`1.34.0.50`). Die vierte Stelle ging beim Release von 1.34.14 verloren und wurde hiermit restauriert.
- **Sammelkarten-Design (Legendär Refinement)**: Das Design für legendäre Karten wurde weiter verfeinert.
  - **Standard-Variante**: Nutzt nun die neue Goldfarbe (Amber-400) ohne Textur für einen sauberen Look.
  - **Holo-Variante**: Verwendet jetzt die exklusive Goldfolien-Textur (`goldfolie.jpg`), um die Holo-Stufe deutlich wertvoller abzuheben.
  - Anpassungen in allen Komponenten (Printable, Digital, EffectOverlay) vorgenommen.

## [1.34.0.49] - 2026-04-25

### Changed
- **Sammelkarten-Design**: Die Rarity "Legendär" wurde optisch überarbeitet.
  - Das bisherige "Kot-Braun" (Amber-600) wurde durch ein strahlendes Gold (Amber-400) und eine echte Goldfolien-Textur (`goldfolie.jpg`) ersetzt.
  - Die "Selten" Variante (Sunburst) wurde ebenfalls veredelt und hat nun einen goldigeren Schimmer über alle Seltenheitsstufen hinweg.
  - Die Änderungen wurden konsistent auf alle Kartenkomponenten (Printable und Digital) sowie die Design-Matrix angewendet.

## [1.34.0.48] - 2026-04-25

### Added
- **Sammelkarten-Manager (Queue)**: Bilder aus Lehrer-Einsendungen können jetzt direkt heruntergeladen werden.
  - Neuer Button `Bild` je Entwurf in der Queue.
  - Funktioniert für Base64-Bilder und für URL-basierte Bilder.
  - Dateiname wird automatisch aus Lehrername gebildet, damit die Weiterbearbeitung einfacher ist.

## [1.34.0.47] - 2026-04-25

### Fixed
- **Sammelkarten-Manager (Editor)**: React-Warnung zum Wechsel von uncontrolled auf controlled `Select` behoben.
  - Beim Laden aus Queue/Pool werden jetzt Fallback-Werte für `title`/`rarity` gesetzt.
  - Editor-Selects nutzen stabile Default-Werte und wechseln nicht mehr den Steuerungsmodus.

### Changed
- **Sammelkarten-Manager (Editor)**: Bild-Fine-Tuning erweitert.
  - Für `Zoom`, `X-Pos`, `Y-Pos` und `Rotation` gibt es zusätzlich zu den Slidern direkte numerische Eingabefelder.
  - Eingaben werden auf die gültigen Wertebereiche begrenzt (Zoom 0.1-3.0, Position -200 bis 200, Rotation -180 bis 180).

## [1.34.0.46] - 2026-04-25

### Fixed
- **Sammelkarten-Manager**: Die Buttons zum Bearbeiten/Navigieren funktionierten wieder korrekt.
  - In der Queue navigiert `Open in Designer` nach dem Laden des Drafts wieder direkt in den Editor.
  - Im Pool navigieren die Bearbeiten-Buttons nach dem Übernehmen der Kartendaten wieder direkt in den Editor.

## [1.34.0.45] - 2026-04-25

### Changed
- **Lehrer-Anmeldung**: Kompletter Redesign der Seite `/lehrer-anmeldung` als minimalistisches 2-Schritt-Formular.
  - Schritt 1: kompakte Eingabe aller Profildaten mit klaren Inline-Fehlermeldungen statt Alert-Popups.
  - Alle Formularfelder sind verpflichtend und werden vor dem Wechsel in Schritt 2 strikt validiert.
  - Schritt 2: verpflichtender Review- und Einwilligungsbereich mit DSGVO/Foto-Zustimmung sowie AGB- und Datenschutz-Bestätigung.
  - Die Live-Vorschau über `PrintableTeacherCard` bleibt erhalten, wurde aber visuell reduziert und klarer eingebettet.
  - Der Submit-Flow bleibt funktional robust (inkl. Bildkompression), speichert jetzt zusätzlich einen `legal_consents`-Block im Draft.
  - Erfolgszustand überarbeitet: neue Anmeldung ohne Seiten-Reload möglich.

## [1.34.0.44] - 2026-04-25

### Fixed
- **Lehrer-Anmeldung**: Optimierung der Karten-Vorschau.
  - Fix der Card-Index Darstellung: Es wird nun eine zufällige 3-stellige Nummer generiert.
  - UI-Korrektur: Die vertikale Nummer überlappt nicht mehr mit dem Textblock der Fächer/Namen durch reduzierte Schriftgröße und angepasste Positionierung.

## [1.34.0.43] - 2026-04-25

### Changed
- **Sammelkarten-Manager**: Automatisierung der Index-Vergabe (Card Number).
  - Der Index (`cardNumber`) wird nun automatisch generiert (Max + 1) anstatt manuell vergeben zu werden.
  - Deaktivierung der manuellen Eingabe im Editor zur Vermeidung von Dubletten.
  - Integration der Automatik in den Queue-Approval-Prozess und den Editor-Reset.

## [1.34.0.42] - 2026-04-25

### Changed
- **Lehrer-Anmeldung**: Vollständige Überarbeitung des Anmeldeformulars (`/lehrer-anmeldung`).
  - Implementierung einer Live-Vorschau der Sammelkarte während der Dateneingabe (Vorder- und Rückseite).
  - Optimierung der Responsivität für alle Bildschirmgrößen mit einem modernen Two-Column Layout auf Desktop.
  - Integration der `PrintableTeacherCard` für eine akkurate Darstellung des Endergebnisses.
  - Verbessertes User-Interface mit klaren Schritten und Sticky-Submit-Buttons.

## [1.34.0.41] - 2026-04-25

### Changed
- **Sammelkarten-Manager**: UI-Verbesserung der "Registration QR" Card.
  - Der QR-Code wird nun explizit in seinem Container zentriert.
  - Der "Digital-Poster öffnen" Button wurde entfernt, um das Layout zu entschlacken.

## [1.34.0.40] - 2026-04-25

### Added
- **Sammelkarten-Manager**: Neues Druck-Poster für die Lehrer-Anmeldung hinzugefügt (`/admin/qr-poster`).
  - Optimiertes A4-Layout für Schulaushänge mit großem QR-Code und 3-Schritt-Anleitung für Schüler.
  - Integration eines "Druck-Poster öffnen" Buttons in der Manager-Queue.

### Changed
- **Sammelkarten-Manager**: UI-Verbesserung der "Registration QR" Card in der Sidebar.
  - Moderneres Design mit Hintergrund-Akzenten und verbesserter Typografie.
  - Neue "Link teilen/kopieren" Funktionalität.

## [1.34.0.39] - 2026-04-25

### Fixed
- **Navigation**: Der Countdown-Timer in der Sidebar (Dashboard & TCG) klappt nun beim Minimieren der Sidebar mit ein (zeigt nur noch das Uhren-Icon).

## [1.34.0.38] - 2026-04-25

### Changed
- **Sammelkarten-Manager**: Umstellung auf echte URLs für alle Manager-Bereiche (`/sammelkarten-manager/queue`, `/editor`, etc.).
  - Implementierung eines `SammelkartenManagerContext` zur Erhaltung von Zuständen (z.B. Editor-Formular) beim Wechsel zwischen den Seiten.
  - Aufteilung des monolithischen Managers in dedizierte Page-Komponenten pro Bereich für bessere Wartbarkeit.
  - Saubere Pfadstruktur in der Sidebar ohne Query-Parameter.

## [1.34.0.37] - 2026-04-25

### Changed
- **Navigation**: Der Sammelkarten-Manager nutzt nun Unterpunkte in der Sidebar anstelle von Tabs auf der Seite.
  - Integration von Direktlinks für Warteschlange, Designer, Pool, Logistik und Matrix in das Navigationsmenü.
  - Entfernung der redundanten Tab-Leiste auf der Manager-Seite für ein saubereres UI.
  - Unterstützung von tiefen Verlinkungen und korrektem Active-State-Highlighting in der Sidebar basierend auf Query-Parametern.

## [1.34.0.36] - 2026-04-25

### Changed
- **Sammelkarten-Manager**: Konsolidierung des "Produktions-Designers" und der "Druck-Logistik" in eine einzige, zentrale Manager-Oberfläche.
  - Entfernung redundanter "Pool"- und "Warteschlange"-Ansichten.
  - Zusammenführung aller Produktions-Workflows (Drafts, Design, Pool-Management, Booster-Config, Export) in eine tab-basierte Ansicht.
  - Vereinfachung der Navigation durch einen einzigen Menüpunkt in der Sidebar.

## [1.34.0.35] - 2026-04-25

### Changed
- **Logistik**: Die CSV-Export-Buttons wurden über die Vorschautabelle verschoben, um die Erreichbarkeit bei langen Listen zu verbessern.

## [1.34.0.34] - 2026-04-25

### Added
- **UI/UX**: URL-basierte Tab-Navigation im Sammelkarten-Designer.
  - Jeder Tab (Warteschlange, Editor, Matrix, Pool) hat nun eine eigene URL über Query-Parameter (`?tab=...`).
  - Unterstützung von Browser-Vor/Zurück-Navigation.
  - Direktes Verlinken auf spezifische Designer-Ansichten ermöglicht.
- **Logistik**: Neuer Konfigurationsbereich für Varianten-Quoten (Standard, Holo, Selten). Die Wahrscheinlichkeiten können nun direkt im Config-Tab angepasst werden.

## [1.34.0.33] - 2026-04-25

### Changed
- **Logistik**: Die Tabelle im Bereich "Pool" und die Vorschau im Bereich "Export" zeigen nun separat "Nachname" und "Vorname" an.
- **Logistik**: Die CSV-Exporte ("Druckauftrag" und "Booster-Manifest") wurden auf das neue Format mit getrennten Spalten für Nachname und Vorname umgestellt.
- **Admin**: Verfeinerung des CSV-Imports für eine robustere Erkennung des neuen 5-Spalten-Formats.

### Fixed
- **UI/UX**: Finale Korrektur der Karten-Überlappung im Pool.
  - Weitere Erhöhung der Abstände (`gap-x-16`, `gap-y-24`) für maximale Trennung.
  - Implementierung von `hover:z-50`, um sicherzustellen, dass die fokussierte Karte immer über allen anderen liegt.
  - Verstärkung des Schattens beim Hover zur besseren Tiefenwirkung.

## [1.34.0.32] - 2026-04-25

### Changed
- **Admin**: Der CSV-Export für Sammelkarten wurde angepasst. Die ersten beiden Spalten sind nun separat "Nachname" und "Vorname" (aufgeteilt aus dem Namen).
- **Admin**: Der CSV-Import wurde aktualisiert, um sowohl das neue Format (Nachname/Vorname getrennt) als auch das alte Format (Name kombiniert) automatisch zu erkennen und zu unterstützen.

### Fixed
- **I18n**: Komplette Lokalisierung des Sammelkarten-Designers.
  - Alle Benutzeroberflächen-Texte wurden in das zentrale Übersetzungssystem integriert.
  - Volle Unterstützung für Deutsch, Englisch und Spanisch.
  - Behebung von Inkonsistenzen bei englischen Labels auf der deutschen Benutzeroberfläche.

## [1.34.0.31] - 2026-04-25

### Fixed
- **UI/UX**: Behebung von Überlappungen im Karten-Pool (Galerie).
  - Erhöhung der horizontalen und vertikalen Abstände zwischen den Karten zur Vermeidung von Kollisionen beim Hover-Effekt.
  - Optimierung des Grids für extrem breite Bildschirme (max 5 Spalten bei 2XL).
  - Verbesserung der visuellen Hierarchie im Pool durch größeres Padding und Schatten.

## [1.37.2.4] - 2026-05-10
- [Maestro] Added new skills to ABI Bot: create_poll, create_news, add_finance_transaction.
