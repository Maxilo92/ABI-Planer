# Changelog

All notable changes to this project will be documented in this file.

## [0.0.8.1] - 2026-04-26

### Removed
- "Freunde"-Modul vollständig aus der Anwendung entfernt (Code, Mockups und Navigationspfade bereinigt), da es für die Kernfunktionalität der Abitur-Organisation keinen Verwendungszweck bietet.

## [0.0.8.0] - 2026-04-26

### Added
- "Pro vs. Free" Umschalter implementiert, um beide Versionen der App testen zu können.
- Dynamische Filterung der Navigation: Im Free-Modus sind nur Basis-Module (Dashboard, News, Polls, Konto, Hilfe) sichtbar.
- Pro-Module (Kalender, Aufgaben, Gruppen, Finanzen, Shop, Sammelkarten-Manager) erfordern nun den Pro-Status.

### Changed
- Mobile Navigation grundlegend überarbeitet: Die Sidebar dient nun als primärer Drawer auf allen Geräten.
- Mobile `BottomNav` (Fußmenü) vollständig entfernt für ein cleaneres Interface.

## [0.0.7.3] - 2026-04-26

### Added
- Komplette Mockup-Abdeckung für alle verbleibenden Seiten abgeschlossen:
    - **Kalender:** Monatliche Terminübersicht.
    - **Shop:** E-Commerce Interface für Jahrgangs-Produkte.
    - **Sammelkarten-Warteschlange:** Tabellarische Ansicht für Genehmigungsprozesse.
    - **Freunde:** Kontaktliste mit Rollenanzeige und Avataren.
    - **Admin-Benutzerverwaltung:** Mockup für Rollenmanagement.
- Alle `ModulePlaceholder` Instanzen in `App.tsx` durch reale Seiten-Komponenten ersetzt.

## [0.0.7.2] - 2026-04-26

### Changed
- Versionsanzeige im User Interface (Sidebar und Footer) auf die tatsächliche Versionsnummer (`v0.0.7.2`) umgestellt.

## [0.0.7.1] - 2026-04-26

### Removed
- Alle Referenzen auf "v2", "Version 2.0" und ähnliche Branding-Zusätze entfernt. Die App wird nun konsistent als "ABI Planer" ohne Versions-Suffix im User Interface und in der Dokumentation bezeichnet.

## [0.0.7.0] - 2026-04-26

### Added
- Vollständige Mockups für alle App-Seiten implementiert:
    - **News:** Feed mit Beiträgen und Autoren-Infos.
    - **Polls:** Aktive und beendete Umfragen mit Status-Badges.
    - **Aufgaben:** Tabellarische Übersicht mit Prioritäten und Status.
    - **Gruppen:** Card-Layout für Planungsteams.
    - **Sammelkarten-Pool:** Dashboard mit Statistiken und Druck-Logistik-Vorschau.
    - **Admin Hub:** Zentrales Dashboard für Super-Admins mit Modul-Kacheln.
    - **Profil:** Benutzerseite mit Avatar (Dicebear), Metadaten und Cover-Bild.
    - **Einstellungen:** Gruppierte Einstellungsbereiche mit Toggle-Mockups.
- `ModulePlaceholder` Komponente für noch nicht implementierte Unterseiten erstellt.
- `PageRenderer` in `App.tsx` vervollständigt, sodass alle Navigationslinks funktionieren.

## [0.0.6.0] - 2026-04-26

### Added
- Submenüs in der Sidebar implementiert, um die Navigationsstruktur der Legacy-Version abzubilden.
- Unterstützung für einklappbare Navigationsbereiche (Übersicht, Planung, Finanzen, Sammelkarten, Konto, Hilfe, Admin).
- Animationen für Submenüs mittels `framer-motion` hinzugefügt.
- Hilfsfunktion `cn` und `utils.ts` für dynamische Tailwind-Klassen hinzugefügt.
- Navigations-Icons für alle neuen Unterseiten ergänzt.
- `Page` Typ im `AppContext` erweitert, um alle Legacy-Module zu unterstützen.

### Changed
- Sidebar-Logik aktualisiert: Klick auf einen Hauptpunkt öffnet das Submenü; Klick auf Unterpunkte navigiert zur entsprechenden Seite.
- Header-Breadcrumbs unterstützen nun alle neuen Seitentitel.

## [0.0.5.1] - 2026-04-26

### Changed
- Navigation (Sidebar, BottomNav, Header) optisch an die Legacy-Version angepasst für ein konsistenteres "Look & Feel".
- Sidebar verwendet nun einen neutralen weißen Hintergrund mit schlichten Hover- und Active-States anstelle von Indigo-Akzenten.
- BottomNav auf mobilen Endgeräten vereinfacht (flacheres Design ohne schwebende Effekte).
- Branding (Logo-Schriftzug) in der Sidebar vergrößert und Icons verkleinert für eine kompaktere Optik.
- YearSwitcher und Header-Breadcrumbs auf eine neutrale Farbpalette umgestellt.

## [0.0.5.0] - 2026-04-26

### Added
- Spezifikation für ein 4-stufiges Rollensystem implementiert:
    - **School Admin** (Lehrer): Schul-Verwaltung & Billing.
    - **Year Group Admin** (Schüler): Jahrgangs-Verwaltung (erster Admin unentfernbar).
    - **Planer**: Schreibrechte für Planungs-Module.
    - **Viewer**: Rein lesender Zugriff.
- Datenmodell in `03-multi-tenant-architektur.md` um `schoolAdmins` und `Member` Interface erweitert.
- Firestore Security Rules Pseudocode in `05-security-compliance.md` an das neue Rollenmodell angepasst.
- Frontend UX-Spezifikation (`06-frontend-ux-spezifikation.md`) um rollenbasierte Sichtbarkeit ergänzt.
- Isolations-Logik für Kohorten (Jahrgänge) implementiert.
- `userRole` ('admin' | 'student') zum `AppContext` hinzugefügt, um Benutzerberechtigungen zu simulieren.
- Rollen-Umschalter zum Benutzerprofil in `Sidebar` und `Header` für Testzwecke hinzugefügt.

### Changed
- `availableYears` im `AppContext` wird nun basierend auf `userRole` gefiltert. Schüler sehen nur ihren aktuellen Jahrgang.
- `YearSwitcher` ist nun deaktiviert und zeigt eine statische Ansicht an, wenn nur ein Jahr verfügbar ist.

## [0.0.4.0] - 2026-04-26

### Added
- Restructured project into a Monorepo format (`apps/`, `packages/`, `docs/`).
- Created root `package.json` with workspace configuration and convenience scripts.
- Created root `README.md` with project overview and development instructions.
- Organized documentation into `docs/specs/`.

### Fixed
- Fixed several pre-existing TypeScript errors in the frontend (missing type-only imports, incorrect property names in `Header.tsx`, and missing `Github` icon in the specific `lucide-react` version).

## [0.0.3.0] - 2026-04-26

### Added
- Initial monorepo scaffolding for Abi-Planer.
- Basic frontend shell with responsive layout and navigation.
- Product specification documents.
