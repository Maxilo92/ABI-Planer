<!-- AGENT_NAV_METADATA -->
<!-- path: CHANGELOG.md -->
<!-- role: reference -->
<!-- read_mode: latest-first -->
<!-- token_hint: tail-only -->
<!-- default_action: read newest entries only unless a regression requires older history -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

## [1.34.39] - 2026-04-25

### Fixed
- **Navigation**: Der Countdown-Timer in der Sidebar (Dashboard & TCG) klappt nun beim Minimieren der Sidebar mit ein (zeigt nur noch das Uhren-Icon).

## [1.34.38] - 2026-04-25

### Changed
- **Sammelkarten-Manager**: Umstellung auf echte URLs für alle Manager-Bereiche (`/sammelkarten-manager/queue`, `/editor`, etc.).
  - Implementierung eines `SammelkartenManagerContext` zur Erhaltung von Zuständen (z.B. Editor-Formular) beim Wechsel zwischen den Seiten.
  - Aufteilung des monolithischen Managers in dedizierte Page-Komponenten pro Bereich für bessere Wartbarkeit.
  - Saubere Pfadstruktur in der Sidebar ohne Query-Parameter.

## [1.34.37] - 2026-04-25

### Changed
- **Navigation**: Der Sammelkarten-Manager nutzt nun Unterpunkte in der Sidebar anstelle von Tabs auf der Seite.
  - Integration von Direktlinks für Warteschlange, Designer, Pool, Logistik und Matrix in das Navigationsmenü.
  - Entfernung der redundanten Tab-Leiste auf der Manager-Seite für ein saubereres UI.
  - Unterstützung von tiefen Verlinkungen und korrektem Active-State-Highlighting in der Sidebar basierend auf Query-Parametern.

## [1.34.36] - 2026-04-25

### Changed
- **Sammelkarten-Manager**: Konsolidierung des "Produktions-Designers" und der "Druck-Logistik" in eine einzige, zentrale Manager-Oberfläche.
  - Entfernung redundanter "Pool"- und "Warteschlange"-Ansichten.
  - Zusammenführung aller Produktions-Workflows (Drafts, Design, Pool-Management, Booster-Config, Export) in eine tab-basierte Ansicht.
  - Vereinfachung der Navigation durch einen einzigen Menüpunkt in der Sidebar.

## [1.34.35] - 2026-04-25

### Changed
- **Logistik**: Die CSV-Export-Buttons wurden über die Vorschautabelle verschoben, um die Erreichbarkeit bei langen Listen zu verbessern.

## [1.34.34] - 2026-04-25

### Added
- **UI/UX**: URL-basierte Tab-Navigation im Sammelkarten-Designer.
  - Jeder Tab (Warteschlange, Editor, Matrix, Pool) hat nun eine eigene URL über Query-Parameter (`?tab=...`).
  - Unterstützung von Browser-Vor/Zurück-Navigation.
  - Direktes Verlinken auf spezifische Designer-Ansichten ermöglicht.
- **Logistik**: Neuer Konfigurationsbereich für Varianten-Quoten (Standard, Holo, Selten). Die Wahrscheinlichkeiten können nun direkt im Config-Tab angepasst werden.

## [1.34.33] - 2026-04-25

### Changed
- **Logistik**: Die Tabelle im Bereich "Pool" und die Vorschau im Bereich "Export" zeigen nun separat "Nachname" und "Vorname" an.
- **Logistik**: Die CSV-Exporte ("Druckauftrag" und "Booster-Manifest") wurden auf das neue Format mit getrennten Spalten für Nachname und Vorname umgestellt.
- **Admin**: Verfeinerung des CSV-Imports für eine robustere Erkennung des neuen 5-Spalten-Formats.

### Fixed
- **UI/UX**: Finale Korrektur der Karten-Überlappung im Pool.
  - Weitere Erhöhung der Abstände (`gap-x-16`, `gap-y-24`) für maximale Trennung.
  - Implementierung von `hover:z-50`, um sicherzustellen, dass die fokussierte Karte immer über allen anderen liegt.
  - Verstärkung des Schattens beim Hover zur besseren Tiefenwirkung.

## [1.34.32] - 2026-04-25

### Changed
- **Admin**: Der CSV-Export für Sammelkarten wurde angepasst. Die ersten beiden Spalten sind nun separat "Nachname" und "Vorname" (aufgeteilt aus dem Namen).
- **Admin**: Der CSV-Import wurde aktualisiert, um sowohl das neue Format (Nachname/Vorname getrennt) als auch das alte Format (Name kombiniert) automatisch zu erkennen und zu unterstützen.

### Fixed
- **I18n**: Komplette Lokalisierung des Sammelkarten-Designers.
  - Alle Benutzeroberflächen-Texte wurden in das zentrale Übersetzungssystem integriert.
  - Volle Unterstützung für Deutsch, Englisch und Spanisch.
  - Behebung von Inkonsistenzen bei englischen Labels auf der deutschen Benutzeroberfläche.

## [1.34.31] - 2026-04-25

### Fixed
- **UI/UX**: Behebung von Überlappungen im Karten-Pool (Galerie).
  - Erhöhung der horizontalen und vertikalen Abstände zwischen den Karten zur Vermeidung von Kollisionen beim Hover-Effekt.
  - Optimierung des Grids für extrem breite Bildschirme (max 5 Spalten bei 2XL).
  - Verbesserung der visuellen Hierarchie im Pool durch größeres Padding und Schatten.
