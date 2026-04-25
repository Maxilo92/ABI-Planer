<!-- AGENT_NAV_METADATA -->
<!-- path: CHANGELOG.md -->
<!-- role: reference -->
<!-- read_mode: latest-first -->
<!-- token_hint: tail-only -->
<!-- default_action: read newest entries only unless a regression requires older history -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

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
