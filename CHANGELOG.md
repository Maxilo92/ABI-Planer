<!-- AGENT_NAV_METADATA -->
<!-- path: CHANGELOG.md -->
<!-- role: reference -->
<!-- read_mode: latest-first -->
<!-- token_hint: tail-only -->
<!-- default_action: read newest entries only unless a regression requires older history -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

## [1.34.14] - 2026-04-24

### Added
- **Offizielle Design-Galerie**: Die neue Design-Matrix ist nun offiziell unter `/cards/new/galerie` erreichbar.
- **Rollenbasierte Zugriffskontrolle**: Das Feature ist vorerst exklusiv für Administratoren (`admin`, `admin_main`, `admin_co`) und Planer (`planner`) freigeschaltet. Nicht autorisierte Nutzer sehen ein `ProtectedSystemGate`.

### Removed
- **Demo-Route**: Die temporäre Route `/demo/galerie` wurde entfernt.

## [1.34.13] - 2026-04-24

### Added
- **Neues Lehrer-Kartendesign**: Implementierung einer modernen, druckoptimierten TCG-Karte (`PrintableTeacherCard`) mit Vollbild-PNG, dynamischen Hintergründen und strukturierten Stats auf der Rückseite.
- **Design Matrix Galerie**: Neue Route `/demo/galerie` zur Visualisierung aller 18 Kombinationen aus Seltenheiten (Common-Iconic) und Varianten (Standard, Selten, Holo) für die Qualitätssicherung.
- **Holo- & Sunburst-Effekte**: Dynamische Design-Varianten, die sich farblich an die Seltenheit der Karte anpassen.
- **PDF-Export / Drucken**: Vollständige Unterstützung für den Ausdruck im TCG-Format (63mm x 88mm) auf A4-Querformat.
- **Lehrer-Selektor**: Auswahlfunktion in der Galerie, um verschiedene Lehrer-Profile in der Matrix zu testen.

### Changed
- **Namensdarstellung**: Auf der Vorderseite wird nun nur noch die Anrede und der Nachname zweizeilig angezeigt, um das Gesicht des Lehrers freizugeben.
- **Kontrast-Optimierung**: Signifikante Erhöhung der Lesbarkeit von Kartennummern durch neue Outline- und Schatten-Kombinationen.

## [1.34.12] - 2026-04-24

### Added
- **Sammelkarten:** Implementierung der `PrintableTeacherCard` Komponente. Diese bietet ein druckoptimiertes TCG-Format (63x88mm), einen interaktiven 3D-Flip-Effekt mittels Framer Motion und detaillierte Lehrer-Stats auf der Rückseite.

## [1.34.11] - 2026-04-24

## [1.34.10] - 2026-04-24

### Added
- **Navigation:** Das System erkennt nun automatisch die Nutzerrolle (Admin/Planer) auch auf der Standalone-TCG-Seite. Für berechtigte Nutzer wird in der Menüleiste automatisch der Button "Zum Planer" sowie Links zu den Einstellungen und zum Feedback eingeblendet, um einen nahtlosen Wechsel zwischen den Modulen zu ermöglichen.

## [1.34.09] - 2026-04-24

### Changed
- **TCG-Dashboard:** Das statische Karten-Visual im Banner wurde durch das interaktive und animierte `SammelkartenPromo` Karussell ersetzt, um eine lebendigere und konsistentere UI zu gewährleisten.

## [1.34.08] - 2026-04-24

### Fixed
- **TCG-Dashboard:** Fehlender Import von `useMemo` behoben, der zu einem Absturz der Seite führte.

## [1.34.07] - 2026-04-24

### Added
- **Domain-Handling:** `tcg.abi-planer-27.de` wurde als vollständig alleinstehende TCG-Seite konfiguriert. Alle Planer-Links werden auf dieser Subdomain nun automatisch ausgeblendet.

### Fixed
- **TCG-Dashboard:** Ein Logikfehler in der Sammlungs-Statistik wurde behoben, bei dem die Fortschrittsanzeige über 100% steigen konnte (verursacht durch redundante Lehrer-IDs). Die Zählung basiert nun auf eindeutigen kanonischen IDs.
- **UI/UX:** Das TCG-Banner wurde optisch an das aktuelle Theme angepasst (Farben, Kontraste) und für kleine Bildschirme optimiert. Die Skalierung und das Grid-Layout wurden verbessert, um auf Smartphones eine bessere Übersichtlichkeit zu gewährleisten.
- **UI:** Das Seitenverhältnis der News-Bilder wurde auf ein konstantes 16:10 Format fixiert, um optische Verzerrungen bei unterschiedlichen Textlängen zu verhindern.

## [1.34.06] - 2026-04-24

### Fixed
- **News:** Fehlender Import der `cn`-Utility behoben, der zu einem Absturz der News-Seite führte.

## [1.34.05] - 2026-04-24

### Fixed
- **UI:** Das fehlerhafte Grid-Layout der Newskarten im Landing-Mode wurde repariert. Bild und Inhalt nutzen nun die volle Breite der Karte und sind auf Desktop-Geräten sauber nebeneinander angeordnet.

## [1.34.04] - 2026-04-24

### Fixed
- **Layout:** Header-Überlappung auf der News-Seite (insbesondere auf `localhost`) behoben, indem die Layout-Erkennung (Landing vs. Dashboard) mit der App-Shell synchronisiert wurde.

## [1.34.03] - 2026-04-24

### Changed
- **Statistiken:** Die Code-Metriken auf der Jobs-Seite wurden auf Basis einer exakten Zählung aktualisiert (80.620 Zeilen Quellcode).

## [1.34.02] - 2026-04-24

### Added
- **Backend:** Neue Cloud-Funktion `getFriendsAvailableCards` hinzugefügt, die effizient alle Karten-IDs ermittelt, die von Freunden in einer bestimmten Variante besessen werden.

### Changed
- **Trading-UI:** Die Kartenauswahl beim Erstellen eines neuen Trades wurde komplett überarbeitet. Sie entspricht nun dem Design des Lehrer-Albums und ist in zwei Abschnitte unterteilt: "Bei Freunden verfügbar" und "Nicht bei Freunden gefunden". Dies erleichtert das Finden von Karten, die tatsächlich getauscht werden können.
- **Trading-Wizard:** Die Schritte für das eigene Angebot und die Bestätigung wurden ebenfalls an das neue Album-Design angepasst, um eine konsistente UX zu gewährleisten.
- **UI Redesign:** Die Karriereseite wurde von einem Kachel-basierten Design auf ein offeneres, redaktionelles Listen-Layout umgestellt. Dies verhindert unsaubere Überlagerungen und verbessert die Lesbarkeit auf allen Geräten.

## [1.34.01] - 2026-04-24

### Fixed
- **Jobs:** Fehlender Import von `ArrowRight` behoben, der zu einem Absturz der Karriereseite führte.

## [1.34.00] - 2026-04-24

### Added
- **Karriere:** Die neue Jobs-Seite (`/jobs`) ist live! Sie ersetzt die alte `/uber` Sektion und bietet ein komplett überarbeitetes Design, klare Rollenprofile (Frontend, Backend, Design) und einen optimierten Bewerbungsprozess.
- **Mobile Optimization:** Die neue Jobs-Seite wurde von Grund auf für Smartphones optimiert (Responsive Grids, angepasste Paddings und Touch-freundliche Elemente).

### Removed
- **Legacy:** Die veralteten Pfade `/uber` und `/uber/join` wurden entfernt und durch den zentralen `/jobs` Hub ersetzt.

## [1.33.1.14] - 2026-04-24

### Fixed
- **Trading-System:** Die Identifizierung von Karten im Inventar von Freunden wurde robuster gestaltet. Das System unterstützt nun sowohl die kanonischen `teacher_vol1:`-Präfixe als auch die alten `teachers_v1:`-Präfixe und Kurz-IDs. Dies behebt den Fehler, bei dem fälschlicherweise gemeldet wurde, dass kein Freund eine bestimmte Karte besitzt.
- **Backend:** `acceptTradeOffer`, `getFriendsWithCard` und Besitz-Prüfungen im Backend wurden aktualisiert, um ID-Diskrepanzen während des Tauschvorgangs abzufangen und erhaltene Karten automatisch auf das neue kanonische Format zu migrieren.

## [1.33.1.13] - 2026-04-24

### Added
- **Navigation:** Ein neuer Menüpunkt "Jobs" wurde im `LandingHeader` hinzugefügt, der auf die Karriereseite (`/jobs`) verlinkt.

## [1.33.1.12] - 2026-04-24

### Fixed
- **UI/UX:** Die Deckkraft der Marketing-Bilder auf der Landingpage wurde auf 100% erhöht, um die Verblasstheit zu korrigieren.
- **Layout:** Icons, die über den Marketing-Bildern lagen, wurden entfernt, um den Fokus auf den App-Inhalten zu belassen.
- **Navigation:** Der `LanguageToggle` wurde aus dem globalen Layout entfernt und fest in den `LandingHeader` integriert, um Überlappungen mit anderen Navigations-Buttons zu verhindern.

## [1.33.1.11] - 2026-04-24

### Added
- **Marketing:** Die Landingpage wurde visuell überarbeitet. Sechs neue Marketing-Bilder (Screenshots und Lifestyle-Fotos) wurden in `public/marketing/` integriert und ersetzen die bisherigen Icon-Platzhalter in den Sektionen "Dual Focus", "Features" und "Mission". Dies verbessert den visuellen Eindruck der App und macht die Features greifbarer.

## [1.33.1.10] - 2026-04-24

### Changed
- **Branding:** Die Logos wurden in ein zentrales `Assets/`-Verzeichnis umgezogen. Die `Logo`-Komponente verwendet nun dynamisch die optimierten Versionen (`klein`, `mittel`, `groß`) basierend auf der Anzeige-Breite, was die Ladezeiten der App (insbesondere in der Navbar) deutlich reduziert.
- **Konfiguration:** Pfad-Alias `@Assets` in `tsconfig.json` hinzugefügt, um saubere Importe der Grafik-Assets zu ermöglichen.

## [1.33.1.09] - 2026-04-24

### Changed
- **Finanzprognose:** Der Prognose-Algorithmus wurde auf einen "Weighted Moving Average" (WMA) umgestellt. Aktuellere Transaktionen werden nun stärker gewichtet als ältere (linear abnehmend über 90 Tage), was zu einer präziseren und reaktionsschnelleren Vorhersage der Ziel-Erreichung führt.

## [1.33.1.08] - 2026-04-24

### Added
- **Finanzübersicht:** Neues Eingabefeld für den "Geplanten Ticketpreis" in `FundingStatus` hinzugefügt. Dies ermöglicht es Planern, mit verschiedenen Preisszenarien zu experimentieren.
- **Finanzprognose:** Die Prognose im Diagramm und die Berechnung der "Ziel-Erreichung" sind nun dynamisch. Sie berücksichtigen sowohl zukünftige manuelle Transaktionen als auch die virtuellen Einnahmen aus geplanten Ticketverkäufen.

### Changed
- **Finanzübersicht:** Der `FundingStatus` zeigt nun zusätzlich die "Prognose Differenz" (Überdeckung/Fehlbetrag) und das "Erwartete Budget (Gesamt)" an, um eine präzisere Planung zu ermöglichen.
- **Finanzgrafik:** Der Prognose-Algorithmus wurde erweitert, um zukünftige "Spikes" (große Einzeleinnahmen) korrekt in den linearen Trend einzurechnen.

## [1.33.1.07] - 2026-04-23

## [1.33.1.06] - 2026-04-23

### Fixed
- **Finanzgrafik:** Die Jahresansicht wurde radikal überarbeitet und aggregiert Daten nun sauber pro Monat (12 Datenpunkte) statt pro Tag (365 Punkte). Dies behebt die fehlerhafte Y-Achsen-Skalierung und die visuelle Überlagerung von Datenpunkten.
- **Finanzprognose:** Die Prognoselinie verbindet sich nun nahtlos mit dem Ist-Verlauf und füllt die Grafik in der Jahresansicht bis zum Jahresende (Dezember) aus, wodurch ungenutzter Raum im Diagramm vermieden wird.
- **UI/UX:** Die "Ziel-Erreichung"-Anzeige zeigt nun das exakt berechnete Datum (z.B. 15.09.2030) statt nur Monat und Jahr.

## [1.33.1.05] - 2026-04-23

### Fixed
- **Finanzgrafik:** Ein schwerwiegender Bug in der Datenaggregation der Jahresansicht wurde behoben. Die Beträge wurden aufgrund fehlerhafter Datumsiteration nicht korrekt summiert, was zu falschen Y-Achsen-Werten (z. B. 1,20 € statt > 400 €) führte. Die Iteration ist nun für alle Ansichten tagesscharf und exakt.
- **Finanzprognose:** Die fehlende Prognose in der Jahresansicht wurde korrigiert und der "Lücke"-Bereich oben rechts im Diagramm wird nun vollständig mit dem Vorhersage-Trend bis Dezember (bzw. Jahresende) gefüllt.
- **UI/UX:** Das Sternchen (`*`) bei der "Ziel-Erreichung"-Anzeige wurde entfernt, um das echte berechnete Datum klarer und seriöser zu präsentieren.

## [1.33.1.04] - 2026-04-23

### Added
- **Finanzgrafik:** Neue "Insight"-Anzeige ergänzt. Das System berechnet nun auf Basis des aktuellen Tempos den geschätzten Monat der Ziel-Erreichung und zeigt diesen oben rechts an.

### Fixed
- **Finanzgrafik:** Skalierungsproblem der Y-Achse bei sehr kleinen Beträgen behoben (Rundungsfehler entfernt, dynamische Nachkommastellen hinzugefügt).
- **Finanzprognose:** Die gestrichelte Prognoselinie schließt nun nahtlos an den aktuellsten Datenpunkt an.

## [1.33.1.03] - 2026-04-23

### Fixed
- **Finanzgrafik:** Die Prognose wird nun auch in der Jahresansicht korrekt über das aktuelle Datum hinaus gezeichnet. Der Lifecycle-Algorithmus wurde verfeinert, um realistischere Trends bis zum Abiball-Termin abzubilden.

## [1.33.1.02] - 2026-04-23

### Changed
- **Finanzprognose:** „Smarter“ Lifecycle-Algorithmus implementiert. Die Prognose berücksichtigt nun die verbleibende Zeit bis zum Abiball und passt die Wachstumsgeschwindigkeit dynamisch an (geringere Intensität in frühen Projektphasen, exponentieller Anstieg in der Finalphase).

## [1.33.1.01] - 2026-04-23

### Changed
- **Mobile UI:** Finanzgrafik-Steuerung für Smartphones optimiert. Kompakteres Layout, kleinere Buttons und angepasste Datumsformate sorgen für eine bessere Bedienbarkeit auf kleinen Bildschirmen.

## [1.33.1.00] - 2026-04-23

### Changed
- **Finanzprognose:** Algorithmus auf gewichtete Multi-Fenster-Regression umgestellt. Berücksichtigt nun kurz- und langfristige Trends unterschiedlich stark und gewichtet aktuellere Daten höher für präzisere Vorhersagen.

## [1.33.0.33] - 2026-04-23

### Added
- **Finanzgrafik:** Komplexe Datumsnavigation hinzugefügt. Zeiträume sind nun an Kalenderwochen (Mo-So), Kalendermonaten und Kalenderjahren ausgerichtet.
- **UI/UX:** Navigationselemente (Vor/Zurück) und ein „Heute“-Button ermöglichen das gezielte Ansehen vergangener oder zukünftiger Zeiträume in der Finanzentwicklung.

## [1.33.0.32] - 2026-04-23

### Changed
- **Finanzgrafik:** Zeiträume auf „Woche“, „Monat“ und „Jahr“ umgestellt, um eine bessere Skalierung der Daten zu ermöglichen.
- **Finanzprognose:** Die Länge der Vorhersage passt sich nun dynamisch dem gewählten Zeitraum an (z. B. kürzere Prognose in der Wochenansicht), um die Übersichtlichkeit zu wahren.

## [1.33.0.31] - 2026-04-23

### Fixed
- **Finanzgrafik:** Syntax-Fehler (doppelte Variablen-Deklaration) behoben, der zum Absturz der Komponente führte.

## [1.33.0.30] - 2026-04-23

### Fixed
- **Finanzgrafik:** Das aktuelle Datum wird nun explizit als „HEUTE“ markiert, um den Übergang von Historie zu Prognose visuell eindeutig zu kennzeichnen. Die X-Achse wurde für eine bessere Lesbarkeit optimiert.

## [1.33.0.29] - 2026-04-23

### Changed
- **Finanzgrafik:** Zeitraum „Alle“ in „Gesamt“ (intern: `NOW`) umbenannt und als Standardansicht festgelegt, um den kompletten Verlauf bis zum aktuellen Datum präziser abzubilden.

## [1.33.0.28] - 2026-04-23

### Added
- **Finanzübersicht:** Interaktives Liniendiagramm (`FinanceChart`) hinzugefügt, das die kumulative Budgetentwicklung über Zeit anzeigt.
- **Finanzprognose:** Lineare Regressionsanalyse implementiert, die den zukünftigen Kontostand bis zum Abiball-Datum vorhersagt.
- **UI/UX:** Zeitraum-Selektoren (1M, 3M, 6M, YTD, Alle) für die Finanzgrafik zur gezielten Analyse von Trends.

## [1.33.0.27] - 2026-04-23

### Added
- **Finanzübersicht:** Segmentierter Fortschrittsbalken in `FundingStatus` hinzugefügt, der die Einnahmen nach Kursen und Quellen (inkl. Kassenabgleich) farblich aufgeschlüsselt anzeigt.
- **Mobile UI:** Der Abiball-Countdown-Timer wurde zur besseren Übersicht auch im mobilen Header aller Bereiche (Dashboard, TCG, Shop) mittig hinzugefügt.
- **Navigation:** Countdown-Timer in die TCG- und Shop-Menüleisten integriert für eine konsistente Nutzererfahrung.

### Fixed
- **Build:** Kritische Type-Errors in `src/app/page.tsx` und `AdminSystemContext` behoben, die den Produktions-Build verhinderten.
- **Admin System:** Fehlendes `user_role` Feld in der Analytics-Schnittstelle ergänzt.

## [1.33.0.25] - 2026-04-23

### Fixed
- **Landingpage:** Type-Error im Tooltip des Budget-Wachstumscharts behoben (Null-Check für Chart-Daten).

## [1.33.0.24] - 2026-04-23

### Changed
- **Finanzübersicht:** Die Budgetplanung und das Dashboard zeigen nun konsistent den jeweils höheren Betrag zwischen virtuellem Kontostand (Transaktionen) und physischem Kassenabgleich (Prüfsumme) an.
- **Finanzübersicht:** Bei Abweichungen zwischen virtuellem und physischem Stand wird nun ein Warn-Icon mit Popover-Erklärung angezeigt.
- **Dashboard:** Der Finanzierungsstatus auf der Hauptseite unterstützt nun ebenfalls die Anzeige des Kassenabgleichs und warnt bei Differenzen.

## [1.33.0.05] - 2026-04-23

### Added
- **Globale Theme-Synchronisierung:** Das gewählte Farbschema (Hell/Dunkel/System) und die Akzentfarbe werden nun im Nutzerprofil gespeichert und über alle Geräte und Tabs hinweg in Echtzeit synchronisiert.

## [1.33.0.04] - 2026-04-23

### Changed
- **2FA Login-Verhalten:** Die 2FA-Erinnerung wurde von Cookie-basierter Speicherung auf nutzerspezifisches `localStorage` umgestellt. Die Verifizierung gilt nun 30 Tage pro Nutzer und wird nicht mehr über Cookies/Subdomain-Cookies gesteuert.

## [1.33.0.03] - 2026-04-23

### Fixed
- **Mobile UI:** Der mobile Header in `DashboardNavbar` und `TcgNavbar` wurde über das Overlay des Side-Drawer-Menüs gehoben (z-index Fix), damit er bei geöffnetem Menü nicht mehr ausgegraut erscheint.

## [1.33.0.01] - 2026-04-23

### Added
- **System-Analytics:** Umfassendes Upgrade des Analytics-Dashboards (/admin/system/analytics):
  - **Interaktive Graphen:** Alle Diagramme wurden auf Chart.js (via react-chartjs-2) umgestellt und bieten nun Interaktivität.
  - **Wählbare Zeiträume:** Daten können nun für 24h, 7 Tage, 30 Tage oder 90 Tage angezeigt werden (dynamische Nachladung aus Firestore/API).
  - **Graph-Typen:** Für die meisten Diagramme kann nun zwischen Linien-, Balken- und Tortendiagramm gewechselt werden.
  - **Verbesserte Visualisierung:** Neue `UniversalChart` und `ChartCard` Komponenten sorgen für ein konsistentes, modernes Design mit Farbschemata und Kennzahlen (Summe, Peak, Einträge).
  - **Optimierte Skalierung:** Stat-Widgets oben im Dashboard wurden für bessere mobile Responsiveness und flexible Grid-Anpassung optimiert (Font-Scaling, Padding-Adjustments).
  - **Echtzeit-Anpassung:** Backend und Frontend unterstützen nun parametrisierte Zeitfenster für präzisere Analysen.
  - **Neues Growth-Chart:** Dedizierter Graph für App-Wachstum (kumulierte Nutzerzahlen) hinzugefügt, um den Erfolg der App live mitverfolgen zu können.
  - **Robuste Datenverarbeitung:** Das Parsing von Registrierungsdaten wurde verbessert, um verschiedene Datumsformate (ISO-Strings, Timestamps, JS-Dates) zuverlässig zu verarbeiten.
  - **Client-Side Enrichment:** Die Growth-Statistiken sowie die Karten-Raritätsverteilung werden nun auch bei lokaler Datenaufbereitung (Fallback) korrekt aus Firestore berechnet.
  - **Bessere Beschriftung:** Alle Graphen verfügen nun über aussagekräftige Labels in den Legenden und Tooltips (z.B. "Events/Tag", "Nutzer/Tag") sowie explizite Y-Achsenbeschriftungen.
  - **Mobile-Optimierung:** Gesamte Analytics-Sektion für Smartphones optimiert (umbruchsichere Header, scrollbare Zeitwähler, angepasste Font-Größen).
  - **KI Wachwaechter-Detektiv:** Das automatische Briefing wurde zum System-Detektiv aufgewertet. Es nutzt nun Llama 3.3 70B für tiefere Analysen und konzentriert sich auf Anomalien, verdächtige Muster und strategische Trends (1-2 Sätze). Der Detektiv verfügt nun über einen strikten Admin-Filter, der Entwickler-Tests ignoriert und sich auf echte Nutzer-Ereignisse fokussiert.
  - **Briefing-Cache & Transparenz:** Das Wachwaechter-Briefing wird nun kostensparend in Firestore zwischengespeichert und nur einmal täglich (oder bei manuellem Refresh) neu generiert. Beide KI-Berichte zeigen nun explizit das verwendete Modell (z.B. Llama 3.3 oder Claude 3.5) an.
  - **Smarter KI-Bericht:** Der strategische Lagebericht wurde umfassend verbessert: Er nutzt nun Claude 3.5 Sonnet (via Anthropic) für tiefere Analysen und verfügt über einen automatischen Fallback auf Groq (Llama 3.3 70B). Berichte sind nun durch Markdown-Listen und Fettschrift deutlich besser scanbar.
  - **Interactive Loading:** Die Wartezeit auf KI-Berichte wurde durch einen animierten Ladebalken, schrittweise Statusmeldungen ("Scanne Logs...", "Analysiere Trends...") und eine neue `MarkdownTypewriter` Komponente deutlich aufgewertet. Diese rendert den Text in hoher Geschwindigkeit und unterstützt dabei volle Markdown-Formatierung (Fett, Header, Listen).
  - **Export-Funktionen:** KI-Berichte können nun mit einem Klick in die Zwischenablage kopiert oder als `.txt` Datei heruntergeladen werden.
  - **Dynamisches UI:** Das KI-Berichtsfeld erscheint nun nur noch on-demand bei aktiver Generierung oder vorhandenem Bericht, was das Dashboard aufgeräumter macht.
  - **Optimiertes API-Handling:** Unterstützung für `ANTHROPIC_API_KEY` als Fallback für `CLAUDE_API_KEY` hinzugefügt und Fehlermeldungen für die lokale Entwicklung verbessert.
  - **Bugfix:** `ReferenceError` beim Laden der Systemdaten behoben (falsche Variablen-Initialisierung in `AdminSystemContext`).
  - **Bugfix:** Fehlender `useEffect` Import in den System-Komponenten behoben, der zum Absturz der Analytics-Page führte.
  - **Bugfix:** Fehlende `'use client'` Direktive in der Analytics-Page wiederhergestellt, um SSR-Abstürze zu beheben.

## [1.32.1.02] - 2026-04-23

### Changed
- **Branding:** Der Shop wurde einheitlich von "Stufen-Shop" / "ABI Shop" in **ABISHOP** umbenannt. Dies betrifft den Shop-Header, die Navigationsleisten und Feature-Gates.

## [1.32.1.01] - 2026-04-23

### Added
- **Shop:** Platzhalter für externe Stores hinzugefügt:
  - Printify Pop-up Store für Stufen-Merchandise.
  - pretix.eu für den Verkauf von Event-Tickets.

## [1.32.1.00] - 2026-04-23

### Fixed
- **Shop & Gifts:** Kritischen "Double-Granting"-Fehler behoben, bei dem Booster sowohl im alten `extra_available` als auch im neuen `inventory` Feld gutgeschrieben wurden (führte zur Verdopplung beim Öffnen).
- **Referrals:** Empfehlungs-Belohnungen auf das moderne `inventory`-System umgestellt und Konsistenz verbessert.

### Security
- **Shop Logic:** Die unsichere Cloud Function `purchaseBoosters` entfernt, da diese Booster-Käufe ohne Zahlungsprüfung oder Admin-Berechtigung ermöglichte. Der offizielle Weg über Stripe war davon unberührt und bleibt die einzige Methode für Käufe.

## [1.32.0.03] - 2026-04-23

### Added
- **Landingpage:** Neuer Bereich "Transparenz & Daten" mit dualen Wachstums-Graphen (Nutzer & Budget).
- **Internationalisierung:** Neue Übersetzungsschlüssel für die Transparenz-Sektion hinzugefügt (DE, EN, ES).
- **UI/UX:** Budget-Entwicklungs-Graph mit Währungsformatierung (€) und markenspezifischem Styling (Blau) integriert.
- **State Management:** `landingStats` um `budgetGrowth` erweitert und mit dem Live-Listener für `public/landing_stats` verknüpft.

## [1.32.0.02] - 2026-04-23

### Added
- **Cron:** `collectLandingStats` um `budget_growth` Daten erweitert. Diese aggregieren Einnahmen über die letzten 30 Tage mit einem Start-Offset von 54.320 € für die Landingpage-Visualisierung.

## [1.31.0.06] - 2026-04-23

### Added
- **Internationalisierung:** Übersetzungsschlüssel `growthTitle` für den neuen Nutzerwachstums-Graphen auf der Landingpage hinzugefügt (DE, EN, ES).

## [1.31.0.05] - 2026-04-23

### Geändert
- **Landingpage:** Dekorative Graphen aus den Sektionen Mission, Finanzen und Teams entfernt für ein saubereres Erscheinungsbild.
- **Public Stats:** Implementierung eines echten Nutzer-Wachstums-Charts basierend auf Live-Daten aus Firestore.
- **State Management:** `landingStats` State und Listener aktualisiert, um `user_growth` Daten zu erfassen und anzuzeigen.

## [1.31.0.04] - 2026-04-23

### Changed
- **Roadmap:** Priorisierung des Kampfsystems (Combat Engine) vor der Pretix-Ticket-Integration, um die spielerische Interaktion früher zu fördern.

## [1.31.0.03] - 2026-04-23

### Added
- **Roadmap:** Implementierung einer realistischen Roadmap auf der Über-Seite (`/uber`), inklusive Meilensteinen für Pretix-Integration (Ticketverkauf) und das neue Lehrer-Karten Kampfsystem.

## [1.32.0.01] - 2026-04-23

### Fixed
- **Security Rules:** Fehlende Firestore-Berechtigungen für die `shop_items` Collection hinzugefügt, um `permission-denied` Fehler im Shop zu beheben.

## [1.32.0.00] - 2026-04-23

### Added
- **Shop-Verwaltung (Admin):** Neues Admin-Modul zur dynamischen Verwaltung von Shop-Artikeln direkt in der UI (Firestore-basiert).
- **Externe Shops:** Unterstützung für externe Verlinkungen (z.B. Printify Popup-Stores oder pretix Tickets) via `externalUrl`.
- **Hybrider Checkout:** Der Shop entscheidet automatisch zwischen internem Stripe-Checkout und externem Link-Redirect.
- **Initial-Sync:** Button im Admin-Bereich zum schnellen Befüllen des Shops mit Standard-Artikeln.

## [1.31.0.02] - 2026-04-23

### Changed
- **UI:** Vollständige Entfernung der Notenpunkte (NP) aus der Benutzeroberfläche (Shop, Widgets, Abo-Seite). Die Logik bleibt im Hintergrund für zukünftige Zwecke erhalten.

## [1.31.0.01] - 2026-04-23

### Refactored
- **Shop UI:** Umstellung auf ein minimalistisches Store-Layout ohne überflüssige Kacheln und Container.
- **Hero Section:** Redesign der Einleitung für ein saubereres Erscheinungsbild.
- **Produktkarten:** Verschlankung der Karten-UI und Integration einer interaktiven Varianten-Auswahl bei Hover.

## [1.31.0.00] - 2026-04-23

### Added
- **Shop Redesign:** Vollständige Modernisierung der Shop-Landingpage als One-Pager mit Fokus auf Highlights (Featured Items).
- **Merchandise:** Unterstützung für Merch-Artikel mit Varianten-Auswahl (z.B. Kleidergrößen) und spezialisierten Visuals.
- **Tickets:** Neues Ticket-System für Events inkl. Anzeige von Datum und Ort auf den Produktkarten.
- **Gast-Optimierung:** Neue Sortierungs-Logik für Gäste, die Merch und Tickets vor Sammelkarten priorisiert.
- **Backend:** Erweiterung der Stripe-Checkout-Integration zur Erfassung von Varianten und Metadaten.

## [1.30.7.09] - 2026-04-22

### Added
- **Cron:** Updated `collectLandingStats` to include `global_managed_budget` and `global_completed_tasks` for the landing page.

## [1.30.7.08] - 2026-04-22

### Fixes
- **DashboardNavbar:** Resolved type error by consistently using `isExternal` instead of `isExternalLink` in NavItem definition and usage.
- **Logging:** Added `'CASH_VERIFIED'` to `LogActionType` to fix build errors in `VerifyCashDialog.tsx`.
<!-- AGENT_NAV_METADATA -->
<!-- path: CHANGELOG.md -->
<!-- role: reference -->
<!-- read_mode: latest-first -->
<!-- token_hint: tail-only -->
<!-- default_action: read newest entries only unless a regression requires older history -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

## [1.34.07] - 2026-04-24

### Fixed
- **UI:** Das Seitenverhältnis der News-Bilder wurde auf ein konstantes 16:10 Format fixiert, um optische Verzerrungen bei unterschiedlichen Textlängen zu verhindern.

## [1.34.07] - 2026-04-24

### Added
- **Domain-Handling:** `tcg.abi-planer-27.de` wurde als vollständig alleinstehende TCG-Seite konfiguriert. Alle Planer-Links werden auf dieser Subdomain nun automatisch ausgeblendet.

### Fixed
- **TCG-Dashboard:** Ein Logikfehler in der Sammlungs-Statistik wurde behoben, bei dem die Fortschrittsanzeige über 100% steigen konnte (verursacht durch redundante Lehrer-IDs). Die Zählung basiert nun auf eindeutigen kanonischen IDs.
- **UI/UX:** Das TCG-Banner wurde optisch an das aktuelle Theme angepasst (Farben, Kontraste) und für kleine Bildschirme optimiert. Die Skalierung und das Grid-Layout wurden verbessert, um auf Smartphones eine bessere Übersichtlichkeit zu gewährleisten.

## [1.34.06] - 2026-04-24

### Fixed
- **News:** Fehlender Import der `cn`-Utility behoben, der zu einem Absturz der News-Seite führte.

## [1.34.05] - 2026-04-24

### Fixed
- **UI:** Das fehlerhafte Grid-Layout der Newskarten im Landing-Mode wurde repariert. Bild und Inhalt nutzen nun die volle Breite der Karte und sind auf Desktop-Geräten sauber nebeneinander angeordnet.

## [1.34.04] - 2026-04-24

### Fixed
- **Layout:** Header-Überlappung auf der News-Seite (insbesondere auf `localhost`) behoben, indem die Layout-Erkennung (Landing vs. Dashboard) mit der App-Shell synchronisiert wurde.

## [1.34.03] - 2026-04-24

### Changed
- **Statistiken:** Die Code-Metriken auf der Jobs-Seite wurden auf Basis einer exakten Zählung aktualisiert (80.620 Zeilen Quellcode).

## [1.34.02] - 2026-04-24

### Radikaler Cache-Buster Fix
- **Datei-Cleanup:** `reportAiEngine.ts` vollständig entfernt (auch die Proxy-Datei), da der Turbopack-Cache hartnäckig an einer alten Definition festhält.
- **Modul-Renaming:** `reportAnalysisCore.ts` in `reportAnalysisModule.ts` umbenannt, um eine völlig neue Import-Kette zu erzwingen, die keine Altlasten im Cache hat.
- **Import-Update:** Alle Referenzen in der API-Route und im Admin-Bericht auf das neue Modul aktualisiert.

## [1.30.7.06] - 2026-04-22

## [1.30.7.05] - 2026-04-22

## [1.30.7.04] - 2026-04-22

### Fixes
- **Build-Cache Fix:** Variable `DELAY_MS` in `REPORT_DELAY_MS` umbenannt, um persistente Build-Fehler und Caching-Probleme im Dev-Server zu beheben.

## [1.30.7.03] - 2026-04-22

### Finalisierung
- **Vollständige Integration:** Alle wählbaren Sektionen (Features, Intro, Social, Technik) werden nun korrekt im PDF-Report ausgegeben.
- **KI-Optimierung:** Spezifische Prompts für die Einleitungs-Sektion hinzugefügt.
- **Fehlerbehebung:** HTML-Attribute im PDF-Template korrigiert.

## [1.30.7.02] - 2026-04-22

### Fixes
- **Build-Fehler:** Persistente doppelte Definition von `DELAY_MS` in `reportAiEngine.ts` behoben. Datei komplett bereinigt.

## [1.30.7.01] - 2026-04-22

### Fixes & Cleanup
- **Code-Cleanup:** Nicht genutzte Icon-Imports entfernt.
- **Hinweis:** Die `proxy.js` Fehlermeldungen in der Konsole beziehen sich auf Browser-Extensions (z.B. React DevTools) und beeinträchtigen die Funktionalität des Berichts nicht.

## [1.30.7.00] - 2026-04-22

### Clean Report Modus
- **Radikale Vereinfachung:** Sämtliche Emojis, Farbverläufe, Schatten und dekorative Elemente wurden aus dem Bericht und dem Generator entfernt.
- **Minimalistisches Design:** Der Bericht nutzt nun ein rein sachliches Layout mit Standard-Schriftarten, einfachen Linien und Schwarz-Weiß-Tabellen.
- **KI-Anpassung:** Die KI wurde angewiesen, ausschließlich nüchternen Text ohne schmückende Adjektive oder Emojis zu generieren.
- **Fokus:** Konzentration auf reine Fakten, Zahlen und Graphen für eine professionelle interne Dokumentation.

## [1.30.6.00] - 2026-04-22

### Overhaul: Pitch & Guide Studio
- **Modus-Wechsel:** Der "Academic Mode" wurde durch einen praxisorientierten "Pitch & Guide"-Modus ersetzt.
- **Inhaltliche Neuausrichtung:** Fokus auf überzeugende Projektvorstellungen (Pitch) und praktische Anleitungen für das Team.
- **Design:** Professionelle Business-Serifen mit modernem Navy-Akzent und Erfolgs-Diagrammen.
- **KI-Stabilität:** Implementierung eines intelligenten 429-Handlings (Rate Limit). Bei Überlastung der Groq-API (70B) erfolgt ein automatischer Fallback auf das schnellere 8B-Modell mit kurzen Verzögerungen zwischen den Requests.

## [1.30.5.01] - 2026-04-22

### Fixes
- **Import Error:** Fehlendes `BookOpen`-Icon aus `lucide-react` hinzugefügt, um den `ReferenceError` beim Laden der Seite zu beheben.

## [1.30.5.00] - 2026-04-22

### Major Update: Academic Report Studio
- **Wissenschaftlicher Modus:** Komplette Umgestaltung des Berichts-Generators in ein wissenschaftliches "Paper"-Format.
- **Akademisches Design:** Verwendung von Serif-Schriftarten, Blocksatz, formalen Tabellen und Abbildungskennzeichnungen (keine Kacheln oder modernen UI-Elemente mehr).
- **Strukturelle Erweiterung:** Neue Sektionen für Abstract, Methodik und Referenzen hinzugefügt.
- **KI-Persona:** Die Analyse-Engine nutzt nun einen rein akademischen Schreibstil (Fachautor/Wissenschaftler).

## [1.30.4.07] - 2026-04-22

### Fixes & Verbesserungen
- **PDF-Layout:** Korrektur von überlappenden Texten und fehlerhaften Seitenumbrüchen.
- **Formatierung:** KI-Texte werden nun von Markdown bereinigt und korrekt als HTML gerendert (keine `**` oder `#` mehr).
- **Neue Sektion:** "Sprechernotizen & Talking Points" Seite für Präsentationen vor der Schulleitung hinzugefügt.
- **Anhang:** Neue Sektion mit einer tabellarischen Zusammenfassung aller Rohdaten am Ende des Berichts.

## [1.30.4.06] - 2026-04-22

### Neue Features
- **Bericht-Erweiterung (Shop):** Integration von Shop-Einnahmen (Brutto, Netto, Abikasse-Anteil) inkl. eigener Analyse-Sektion und Diagramm.
- **Bericht-Erweiterung (Features):** Neue Sektion zur Vorstellung der wichtigsten System-Innovationen (TCG, Organisation, Finanztransparenz) für die Schulleitung.

## [1.30.4.05] - 2026-04-22

### Geändert
- **2FA-Persistence:** Anpassung der Speicherdauer auf 7 Tage (statt 30) und automatische Löschung der Geräteverifizierung beim Abmelden, wie vom Nutzer gewünscht.

## [1.30.4.04] - 2026-04-22

### Fixes
- **Admin-Bericht:** Behebung von Skalierungsproblemen bei Diagrammen (kein Abschneiden mehr am Rand).
- **KI-Stabilität:** Implementierung eines Fallback-Modells (`8b-instant`) und Timeout-Handlings für die Analyse-Engine, um Fehler bei API-Auslastung zu vermeiden.

## [1.30.4.03] - 2026-04-22

### Fixes
- **Sicherheit & UX:** Behebung der zu häufigen 2FA-Abfragen.
    - **Persistence:** 2FA-Verifizierungsstatus wird nun user-spezifisch für 30 Tage in Cookies gespeichert und NICHT mehr bei jedem Logout gelöscht.
    - **Smart Login:** Die Login-Seite erkennt nun bereits verifizierte Geräte und überspringt den 2FA-Schritt automatisch.
    - **Subdomain-Support:** Korrektur der 2FA-Ausnahmeregeln für Shop- und TCG-Subdomains, um auch beim Zugriff auf die Startseite der Subdomain unnötige Sperren zu vermeiden.

## [1.30.4.02] - 2026-04-22

### Fixes
- **Admin-Bericht:** Behebung eines Authentifizierungsfehlers (401) in der Analyse-API durch Hinzufügung eines lokalen Entwicklungs-Fallbacks.

## [1.30.4.01] - 2026-04-22

### Fixes
- **Admin-Bericht:** Fehlende Imports und Direktiven im Report Studio behoben.

## [1.30.4.00] - 2026-04-22

### Neue Features
- **Report Studio Professional:** Einführung eines hochmodernen Bericht-Generators für akademische Projektberichte.
    - **Modulare Konfiguration:** Admins können Sektionen (Finanzen, Nutzer, Technik, TCG etc.) individuell an- und abwählen.
    - **KI-Analyse (Llama-3.1 70B):** Dynamische Generierung von tiefgehenden Analysen basierend auf Live-Systemdaten durch ein leistungsstarkes Sprachmodell.
    - **Diagramm-Auswahl:** Unterstützung für verschiedene Diagrammtypen (Balken, Linien, Kreis, Ring) pro Sektion mittels Chart.js.
    - **Akademisches PDF-Layout:** Professionelles Multi-Page Design (10-20 Seiten) mit Deckblatt, Inhaltsverzeichnis und Compliance-Siegel.
    - **Sichere API:** Neue Server-Route zur Verarbeitung von KI-Anfragen unter Einhaltung von Sicherheitsstandards.

## [1.30.3.07] - 2026-04-22

### Verbessert
- **Admin-Bericht:** Vollständige Wiederherstellung und Erweiterung des akademischen Projektberichts.
    - Hinzufügung von Inhaltsverzeichnis, Executive Summary und detaillierten Sektionen zu Architektur, Sicherheit und DSGVO-Compliance.
    - Optimierung des PDF-Layouts für einen professionellen Druck (A4).

## [1.30.3.06] - 2026-04-22

### Fixes
- **Internationalisierung (i18n):** Behebung eines kritischen Absturzes (`TypeError: map is not a function`) auf der Landingpage.
    - Die `t()` Funktion im `LanguageContext` wurde erweitert, um auch Arrays und Objekte (statt nur Strings) zurückzugeben, was für Features-Listen auf der Landingpage notwendig ist.

## [1.30.3.05] - 2026-04-22

### Fixes
- **Dashboard:** Behebung eines unendlichen Ladezustands ("hört nicht auf zu laden").
    - Entfernung des redundanten Full-Page-Skeletts in der `AppShell`, das die granularen Dashboard-Skelette überlagerte.
    - Integration der 3-Sekunden-Timeout-Logik in die `loading` Props aller Dashboard-Komponenten (`FundingStatus`, `News`, `Todos`, `Kalender`, `Finanzen`, `Polls`), um bei Netzwerkverzögerungen zuverlässig zur Live-Ansicht zu wechseln.
    - Sicherheits-Timeout (10s) im `AuthContext` hinzugefügt, um Hängenbleiben bei fehlgeschlagener Firebase-Auth-Initialisierung zu verhindern.

## [1.30.3.04] - 2026-04-22

### Fixes
- **Admin-Bericht:** Zugriffsschutz der Seite `/admin/bericht` an den übrigen Admin-Bereich angeglichen (`reason`/`from` Redirect-Parameter) und sichtbaren Ladezustand ergänzt, um leere Ansicht während der Auth-Prüfung zu vermeiden.

## [1.30.3.03] - 2026-04-22

### Hinzugefügt
- **Admin-Bereich:** Neuer Generator (`/admin/bericht`) zur Erstellung eines akademischen PDF-Projektberichts inklusive echter, aggregierter System- und Finanzdaten (Compliance, Finanzen, Registrierungen, etc.) zur Präsentation bei der Schulleitung.

## [1.30.3.02] - 2026-04-22

### Fixes
- **Finanzen:** "Permission Denied" Fehler beim Kassenabgleich durch Hinzufügen fehlender Firestore-Indizes behoben.
- **Sicherheit:** Lesezugriff für `cash_verifications` auf alle verifizierten Profile (`isApproved`) erweitert, um Probleme bei der lokalen Entwicklung zu vermeiden.

## [1.30.3.01] - 2026-04-22

### Hinzugefügt
- **Finanzen (Kassenabgleich):** Neues System zur Verifizierung des physischen Kassenbestands (Prüfsumme).
    - `VerifyCashDialog`: Erlaubt Planern, den tatsächlichen Barbestand zu erfassen.
    - Differenzberechnung: Automatische Anzeige der Abweichung zwischen Transaktionsverlauf ("Virtueller Kontostand") und gezähltem Kassenbestand.
    - Sicherheitsregeln: Zugriffsschutz für die neue `cash_verifications` Collection.

## [1.30.3.00] - 2026-04-22

### Hinzugefügt
- **Schuljahres-Übergang:** Integration des `SchoolYearTransitionGate` in die `AppShell` zur Steuerung von jahrgangsspezifischen Zugriffen.
- **Benutzerprofile:** Automatische Initialisierung des `school_year` Feldes bei der Profilerstellung (Bootstrap) basierend auf der globalen Konfiguration (`settings/config`).

## [1.30.2.03] - 2026-04-22

### Hinzugefügt
- **Support-Tickets:** Einführung eines direkten Kontaktformulars auf der Support-Subdomain zur Erstellung von Support-Tickets.
- **Kontakt-Integration:** Neue Kachel "Direkter Kontakt" auf der Hilfe-Startseite für eine bessere Erreichbarkeit des Administratoren-Teams.

## [1.30.2.02] - 2026-04-22

### Fixes
- **Support Routing:** Fehler behoben, bei dem die Support-Subdomain fälschlicherweise die Landingpage statt der Support-Startseite anzeigte.
- **Subdomain-Erkennung:** Verbesserung der Host-Erkennung in der Dashboard-Hauptkomponente zur korrekten Unterscheidung zwischen Landing, Dashboard und Support.

## [1.30.2.01] - 2026-04-22

### Verbessert
- **2FA Support-Integration:** Hinzufügen eines direkten Links zur Support-Seite bei Verlust des 2FA-Codes in der `TwoFactorGate`-Komponente und auf der Login-Seite.
- **Lokalisierung:** Vollständige Lokalisierung der `TwoFactorGate`-Komponente (DE, EN, ES).

## [1.30.2.00] - 2026-04-22

### Hinzugefuegt
- **Cross-Subdomain Authentication (SSO):** Implementierung einer sitzungsübergreifenden Anmeldung zwischen Subdomains (Dashboard, Shop, TCG, Support).
    - Neue API-Route `/api/auth/session` zur Verwaltung von Session-Cookies auf der Hauptdomain.
    - `AuthContext` synchronisiert nun automatisch den Auth-Status via Custom Tokens über Subdomain-Grenzen hinweg.
    - 2FA-Verifizierungsstatus wird nun via Cookie geteilt, um erneute Abfragen beim Wechsel der Subdomain zu vermeiden.
    - Unterstützung für Subdomain-Session-Sharing in lokalen Entwicklungsumgebungen (`*.localhost`).

## [1.30.1.03] - 2026-04-22

### Hinzugefuegt
- **Developer-Dokumentation (Kernpaket):** Neue kanonische Doku fuer Deployment, CI/CD, Environment, Security, Compliance, Firestore-Schema, Cloud-Functions-API und Troubleshooting.
    - `DEPLOYMENT.md`
    - `docs/CI-CD.md`
    - `docs/.env-reference.md`
    - `docs/SECURITY_GUIDE.md`
    - `docs/LEGAL_COMPLIANCE.md`
    - `docs/FIRESTORE_SCHEMA.md`
    - `docs/CLOUD_FUNCTIONS_API.md`
    - `docs/TROUBLESHOOTING.md`

### Geaendert
- **README/Onboarding:** Veraltete Links und Versionsangaben korrigiert, zentrale Doku-Navigation erweitert.
- **Installationsdoku:** `INSTALL.md` auf aktuelle Setup- und Sicherheitsrealitaet aktualisiert.
- **Architektur-Index:** `docs/PROJECT_KNOWLEDGE.md` als technischer Index mit klaren Verweisen auf Spezialdokumente neu strukturiert.
- **Testing-Doku:** `testing/README_TESTING_PHASE.md` und `testing/TEST_ENVIRONMENT_SETUP.md` auf aktuellen Stand gebracht und auf neue Kern-Doku ausgerichtet.
- **Agent-Drift reduziert:** `GEMINI.md` auf schlanke Weiterleitung zur kanonischen Quelle `CLAUDE.md` umgestellt.

## [1.30.1.02] - 2026-04-22

### Geändert
- **Rechtliche Seiten:** Dezente Hinweise zum laufenden Entwicklungsstand ergänzt.
    - In Impressum, Datenschutzerklärung, AGB und den besonderen Sammelkarten-Bedingungen wurde klargestellt, dass die Plattform fortlaufend weiterentwickelt wird.
    - Es wurde rechtlich zurückhaltend ergänzt, dass vereinzelt vorübergehende Funktionsstörungen oder Darstellungsfehler auftreten können.

## [1.30.1.01] - 2026-04-22

### Geändert
- **Registrierungsprozess:** Der Registrierungsprozess wurde vereinfacht und auf ein 3-Schritte-Modell (plus Erfolgsmeldung) umgestellt.
  - Die Kursauswahl wurde durch eine direkte Auswahl der Klassenstufe (5-12) und ein optionales Suffix-Feld (z.B. für Kursbezeichnungen) ersetzt.
  - Lehrer können sich weiterhin über eine dedizierte Option registrieren.
  - Das aktuelle Schuljahr wird nun automatisch bei der Registrierung im Benutzerprofil hinterlegt.
- **Internationalisierung:** Neue Übersetzungen für Klassenstufen-Suffixe und Platzhalter in Deutsch, Englisch und Spanisch hinzugefügt.

## [1.30.1.00] - 2026-04-22

### Hinzugefügt
- **Schuljahresverwaltung:** Einführung einer zentralen Steuerung für das aktuelle Schuljahr in den globalen Einstellungen.
  - Admins können das aktuelle Schuljahr einsehen und manuell erhöhen.
  - Das Schuljahr wird im `settings/config` Dokument in Firestore gespeichert.
- **Benutzerprofile:** Das `Profile` Interface wurde um das optionale Feld `school_year` erweitert, um Nutzerdaten jahrgangsspezifisch zuordnen zu können.

## [1.30.0.00] - 2026-04-22

### Geändert
- **Struktur (Legal):** Alle rechtlich relevanten Seiten wurden zur besseren Übersicht unter einem gemeinsamen Pfad zusammengefasst.
  - `/agb` -> `/legal/agb`
  - `/agb/sammelkarten` -> `/legal/agb/sammelkarten`
  - `/datenschutz` -> `/legal/datenschutz`
  - `/impressum` -> `/legal/impressum`
- **Navigation:** Aktualisierung aller internen Verweise im Footer, im Registrierungsprozess und im Lehrer-Kartendesigner.
- **Konfiguration:** Anpassung der `middleware.ts` und `robots.ts` an die neue Verzeichnisstruktur.

## [1.29.5.01] - 2026-04-22

### Behandelte Probleme
- **Security (Trading):** Behebung kritischer Sicherheitslücken im Tausch-System.
  - Schutz gegen Tausch-Hijacking durch Dritte in `acceptTradeOffer`, `declineTradeOffer` und `counterTradeOffer`.
  - Fix für unautorisiertes Ablehnen von Tauschanfragen.
  - Absicherung der `cancelTradeOffer` Funktion: Nutzer können nun ihre eigenen Gegenangebote korrekt abbrechen.
- **Logik (Trading):**
  - Implementierung einer transaktionssicheren Inventarprüfung in `counterTradeOffer` zur Vermeidung von Race Conditions.
  - Korrektur des Level-Downgrades: Lehrer-Level werden nun korrekt neu berechnet, wenn ein Nutzer seine letzte Karte einer Variante abgibt.
  - Atomare Erstellung von Tauschangeboten und Benachrichtigungen mittels Firestore Batches.
- **Administration:**
  - Synchronisation der Trading-Feature-Gates mit dem Frontend. Unterstützung für den `admins_only` Status im Backend inklusive Rollenprüfung.

## [1.29.5.00] - 2026-04-22

### Geändert
- **UX/UI (Admin Hub):** Optimierung der Modul-Karten für bessere Skalierbarkeit.
  - Fix für Textüberläufe bei schmalen Bildschirmen durch Einsatz von `min-w-0` und `break-words`.
  - Anpassung der Grid-Breakpoints (`sm:grid-cols-2`) für stabilere Darstellung auf Tablets und kleinen Desktops.
  - Hover-Effekte (Scale) für Icons zur besseren visuellen Rückmeldung.
- **UI (System Components):** Verbesserung der `StatCard` und `ToggleRow` Komponenten.
  - Reduzierung der Schriftgrößen und Paddings für kompaktere Darstellung.
  - Einsatz von `truncate` und Tooltips (native `title`) für überlange Titel.
  - Verhindern von Icon-Shrinking in Flex-Layouter.

## [1.29.4.00] - 2026-04-22

### Hinzugefügt
- **Security (Feature Gate):** Implementierung eines neuen `FeatureGate` Systems.
  - Automatisches Blockieren von Zugriffen auf deaktivierte Module (News, Umfragen, Kalender, Todos, Finanzen, Sammelkarten).
  - Anzeige eines informativen "Modul gesperrt"-Screens für Nutzer, statt einfacher Fehler oder leerer Seiten.
  - Integration in die `AppShell` für eine konsistente Durchsetzung über alle Subdomains hinweg.

### Geändert
- **Admin System Overview:** Überarbeitung der **Emergency Feature Toggles**.
  - Logische Gruppierung der Toggles in "Sammelkarten-Ökosystem" und "Planungs-Tools".
  - Verbesserte Labels und Beschreibungen für eine intuitivere Administration.
  - Responsives Grid-Layout für die Toggles (bis zu 3 Spalten auf Desktop).
- **Bugfix (System Features):** Korrektur eines hartcodierten Zustands im `useSystemFeatures` Hook, durch den das Kampf-System fälschlicherweise immer als aktiv markiert wurde.

## [1.29.3.00] - 2026-04-22

### Geändert
- **Admin System Overview:** Bereinigung und Modernisierung des Control-Panels.
  - Die technisch und optisch veraltete Sektion **"Admin Quick Actions"** wurde entfernt.
  - Die statischen (gefakten) **"Live Indicators"** wurden ersatzlos gestrichen.
  - Die Funktion **"Session-Statistiken zurücksetzen"** wurde in die Hauptkarte unter den Wartungsbereich integriert.
  - Die Hauptkarte für Emergency Feature Toggles nutzt nun die volle Breite (**xl:col-span-3**) für eine bessere Übersicht auf Desktop-Systemen.

## [1.29.3.00] - 2026-04-22

### Hinzugefügt
- **Benutzerverwaltung:** Seitenübergreifende Massenauswahl ("Alle auswählen") implementiert.
  - Ermöglicht die Auswahl tausender Nutzer mit einem Klick, auch wenn diese noch nicht geladen sind.
  - Implementierung eines "All Selected Modes" mit Unterstützung für gezielte Deselektierungen (Ausnahmen).
  - Hintergrund-Laden von IDs zur Sicherstellung einer schnellen UI-Reaktion.
  - Optimierte Massenverarbeitung in Batches zur Vermeidung von Timeouts und Client-Blockaden.

## [1.29.2.00] - 2026-04-22

### Geändert
- **Admin Bereich:** Umstrukturierung der Admin-Seiten.
  - Die Benutzerverwaltung wurde von `/admin` nach `/admin/user` verschoben.
  - `/admin` dient nun als zentrales Admin Control Center (Hub) mit Verweisen auf alle Module.
- **Performance:** Die Benutzerverwaltung wurde massiv optimiert.
  - Umstellung von Echtzeit-Listenern (`onSnapshot`) auf Paginierung (`getDocs`) mit Infinite Scroll.
  - Reduzierung der Client-Last durch Laden von Nutzer-Batches (50 Profile pro Batch).
  - Lokale State-Updates bei Einzeländerungen zur Vermeidung von Voll-Reloads.

## [1.29.1.00] - 2026-04-22

### Geändert
- **Footer:** Copyright-Angabe korrigiert (Entfernung des Team-Zusatzes).

## [1.29.0.00] - 2026-04-22

### Hinzugefügt
- **Globaler Footer:** Implementierung eines umfassenden Footers im Apple-Stil für alle Subdomains.
  - **Grid-Layout:** 6-spaltiges Desktop-Grid und mobiles Akkordeon-System.
  - **Zentrale Navigation:** Verlinkung aller Funktionsbereiche (Planer, Sammelkarten, Shop, Support).
  - **Subdomain-Support:** Nahtlose Integration über alle Bereiche hinweg.

## [1.28.8.00] - 2026-04-22

### Hinzugefügt
- **Admin System Control Center:** 
  - **Funktions-Checkliste:** Eine neue Seite (`/admin/system/check`), die alle System-Module und Routen in einer interaktiven Tabelle auflistet.
  - **Status-Tracking:** Admins können den Zustand jeder Seite tracken (Funktioniert, Minimale Bugs, Große Bugs, Katastrophal, Down, Ungetestet).
  - **Echtzeit-Synchronisierung:** Änderungen werden sofort in der Firestore-Sammlung `system_checks` gespeichert und für alle Admins synchronisiert.
  - **Routen-Scan:** Funktion zum automatischen Synchronisieren bekannter Routen mit der Datenbank.
  - **Dashboard-Statistiken:** Übersichtliche Karten zur Anzeige der Anzahl stabiler, fehlerhafter und kritischer Module.

## [1.28.7.00] - 2026-04-22

### Geändert
- **Internationalisierung (i18n):**
  - **Login-Seite:** Vollständige Umstellung auf das i18n-System. Alle hardcodierten deutschen Texte wurden durch `t()` Aufrufe ersetzt.
  - **Login-Seite:** Integration des `LanguageToggle` in der oberen rechten Ecke für einen schnellen Sprachwechsel vor der Anmeldung.
  - **Home-Seite (TCG):** Einbindung des `useLanguage` Hooks zur Vorbereitung auf zukünftige Lokalisierungen.
  - **Fehlerbehandlung:** Lokalisierte Fehlermeldungen für Login-Szenarien (Timeout, unberechtigter Zugriff, falsche Anmeldedaten, 2FA-Fehler).

## [1.28.6.00] - 2026-04-22

## [1.28.5.00] - 2026-04-22

### Hinzugefügt
- **Developer-Onboarding (/uber/join):** Neue Informationsseite für potenzielle Entwickler mit Details zu Aufgaben, Tech-Stack, Anforderungen und dem Bewerbungsprozess via E-Mail.
- **CTA-Update:** Der Button auf der Über-Seite leitet nun direkt zum Bewerbungsprozess weiter.

## [1.28.4.00] - 2026-04-22

### Behoben
- **Über-Seite (/uber):** GitHub-Profile-Links auf das korrekte Profil (`github.com/Maxilo92`) aktualisiert.

## [1.28.3.00] - 2026-04-22

### Geändert
- **Über-Seite (/uber):** Call-to-Action Bereich überarbeitet, um den dringenden Bedarf an neuen Entwicklern hervorzuheben ("Verstärkung gesucht").

## [1.28.2.00] - 2026-04-22

### Hinzugefügt
- **Über-Seite (/uber):** Vollständiges Redesign der Informationsseite im "Modern & Immersive"-Stil.
  - **Hero-Sektion:** Neues visuelles Banner mit Gradienten und Fokus auf den Abiturjahrgang 2027.
  - **Feature-Grid:** Interaktive Kacheln für Dashboard, Kalender, Aufgaben, Finanzen, News und Abstimmungen.
  - **Roadmap:** Visuelle Timeline der Projektentwicklung (v1.0.0 bis v2.0.0+).
  - **Team & Credits:** Ansprechende Profil-Darstellung der Entwickler und Unterstützer.
  - **Bento-Grid:** Neue Struktur für technische Architektur und Sicherheits-Features.
  - **Responsiveness:** Optimiertes Layout für alle Bildschirmgrößen mit modernen Tailwind-Animationen.

## [1.28.1.00] - 2026-04-22

### Behoben
- **Internationalisierung (i18n):**
  - **Import-Fehler:** Korrektur fehlerhafter Import-Pfade für `useLanguage` in `src/app/page.tsx` (von `@/lib/i18n/useLanguage` zu `@/context/LanguageContext`).
  - **Typ-Sicherheit:** Ersetzung der undefinierten Variable `locale` durch `language` in `src/app/page.tsx`, um Kompatibilität mit dem `LanguageContext` herzustellen.
  - **Komponenten-Import:** Fix des `LanguageToggle` Imports in `src/app/register/page.tsx` (Umstellung auf Named Import).
  - **Syntax-Fehler:** Behebung von JSX-Syntaxfehlern in `src/app/page.tsx`, die durch fehlerhafte Code-Ersetzungen entstanden waren.

### Validiert
- **Übersetzungssystem:** Erfolgreiche Validierung der `translations.ts` mit vollständigen Objekten für Deutsch, Englisch und Spanisch.
- **Integration:** Bestätigung der korrekten Einbindung des `LanguageProvider` in das Root-Layout und der funktionalen Nutzung in den Kern-Seiten (Landing, Registrierung, Einstellungen).
- **UI-Elemente:** Verifizierung der korrekten Platzierung und Funktionalität des `LanguageToggle` auf der Landingpage.

## [1.28.0.00] - 2026-04-22


### Hinzugefügt
- **Internationalisierung (i18n):**
  - **LanguageToggle Komponente:** Einführung einer kompakten und modernen Sprachumschalter-Komponente (`LanguageToggle`) in der UI-Library.
  - **Kompaktes Design:** Nutzt ein Globe-Icon und ein Dropdown-Menü mit Kurzcodes (DE, EN, ES) für eine platzsparende Integration in Navigationsleisten.
  - **Shadcn/UI Integration:** Basierend auf `DropdownMenu` und `Button` Komponenten für konsistentes Styling.

## [1.27.0.00] - 2026-04-22

### Hinzugefügt
- **Internationalisierung (i18n):**
  - **Core i18n System:** Implementierung eines robusten Übersetzungssystems mit Unterstützung für Deutsch (de-DE), Englisch (en-US) und Spanisch (es-ES).
  - **LanguageContext:** Zentraler React Context zur Verwaltung der Sprache, mit automatischer Erkennung (Browser-Sprache, LocalStorage, Nutzerprofil).
  - **Profil-Synchronisierung:** Die gewählte Sprache wird automatisch im Benutzerprofil in Firestore gespeichert und geräteübergreifend synchronisiert.
  - **Dot-Notation Support:** Die `t()` Funktion unterstützt verschachtelte Übersetzungsschlüssel (z.B. `landing.hero.title`).
  - **Übersetzungen:** Basis-Übersetzungen für die Landingpage, Registrierung und Einstellungen wurden hinzugefügt.

## [1.28.0.00] - 2026-04-22

### Hinzugefügt
- **Internationalisierung des Support-Centers:**
  - **Mehrsprachiges Routing:** Unterstützung für `/de/` und `/en/` Prefixe auf der `support` Subdomain.
  - **Sprachumschalter:** Neue Sprachwahl im Support-Header zur nahtlosen Navigation zwischen Deutsch und Englisch.
  - **Lokalisierte Inhalte:** Umstellung der FAQ-Datenstruktur auf ein mehrsprachiges Modell (`src/lib/helpFaqs.ts`).
  - **Deskriptive Routen:** Umbenennung der technischen Routen für bessere SEO und Lesbarkeit (`/a/` -> `/artikel/`, `/c/` -> `/kategorie/`).

### Geändert
- **Middleware-Intelligenz:** Automatische Locale-Erkennung und Redirects (Fallback auf `/de/`).
- **Middleware-Legacy-Support:** Transparente Weiterleitung alter FAQ-Shortcuts auf die neuen, lokalisierten Pfade.
- **Lokalisierte UI:** Vollständige Übersetzung aller UI-Elemente im Support-Center (Footer, Suche, Feedback-System, Beschwerdeformular).

## [1.27.0.00] - 2026-04-22

### Hinzugefügt
- **Dediziertes Support-Center (support.abi-planer-27.de):**
  - **Claude-inspiriertes Design:** Neues, eigenständiges Support-Layout mit Hero-Suche, Kategorie-Kacheln und übersichtlichen Artikel-Seiten.
  - **Subdomain-Integration:** Automatisches Routing via Next.js Middleware. Anfragen an `support.*` werden auf die neue `/support`-Struktur umgeschrieben.
  - **Suche & Feedback:** Verbesserte FAQ-Suche und "War dieser Artikel hilfreich?"-Feedback-System.
  - **Lehrer-Beschwerden Migration:** Das Beschwerde-Formular für Lehrer wurde vollständig in das Support-Center integriert und unter `/beschwerden` erreichbar gemacht.

### Geändert
- **Zentrale Hilfe-Verlinkung:** Alle "Hilfe"-Links in der Haupt-App (Sidebars, Menüs, Fehlerseiten) leiten nun direkt auf das externe Support-Center weiter.
- **Middleware-Update:** Implementierung von Redirects für alle alten `/hilfe`-Routen auf die neue Subdomain.

### Entfernt
- **Altlasten:** Die alten Hilfe-Routen unter `src/app/hilfe` wurden vollständig entfernt, um Code-Duplikation zu vermeiden.

## [1.25.0.00] - 2026-04-22

### Hinzugefügt
- **Architektonische Domänen-Trennung:**
  - **Spezialisierte Navbars:** Einführung von `DashboardNavbar`, `TcgNavbar` und `ShopNavbar` für eine klare visuelle und funktionale Trennung der Bereiche.
  - **Domänen-Selektor:** Die Haupt-`Navbar` erkennt nun automatisch die aktuelle Subdomain (`dashboard.`, `tcg.`, `shop.`) und zeigt das entsprechende Layout an.
  - **Rollenbasiertes Routing:** Nach dem Login werden Nutzer automatisch basierend auf ihrem Jahrgang (Klasse 11) zum Dashboard oder zum TCG-Bereich weitergeleitet.
  - **Gast-Zugang für den Shop:** Der Shop ist nun vollständig ohne Login zugänglich (für Merch und Spenden). Login wird nur noch für den Kauf von Sammelkarten-Boostern (Inventory-Verknüpfung) benötigt.
  - **Dashboard-Schutz:** Strengere Prüfung des Jahrgangs beim Zugriff auf die `dashboard.` Subdomain in der `AppShell`.

## [1.24.2.00] - 2026-04-21

### Hinzugefügt
- **Kampfsystem (Phase 2 - Energie/Mana):**
  - **Energie-Pools:** Spieler und KI starten mit 3 Energie und regenerieren +2 Energie pro Zug (Maximal 10).
  - **Angriffskosten:** Jeder Angriff hat nun spezifische Energiekosten (dynamisch berechnet aus dem Schaden, falls nicht explizit in der Karte hinterlegt).
  - **Energie-Balken UI:** Neue Energie-Balken (10 Punkte) für Spieler (Blau) und KI (Gold) unter den HP-Balken im GameBoard.
  - **Kosten-Visualisierung:** Energiekosten werden nun als blaue Punkte direkt auf den Angriffen (sowohl auf den Karten als auch im Focus-Menü) angezeigt.
  - **Validierung:** Angriffe ohne ausreichende Energie sind ausgegraut und blockiert (Frontend) und werfen einen Fehler (Backend).
  - **KI-Energie-Management:** Die KI priorisiert Angriffe, die sie sich leisten kann, und überspringt ihren Zug, wenn keine Angriffe oder Wechsel möglich sind, um Energie zu regenerieren.


## [1.24.1.19] - 2026-04-21

### Verbessert
- **Kampfsystem (KI-Overhaul):** Die KI-Gegner-Logik wurde von Grund auf überarbeitet für strategischere und zuverlässigere Züge:
  - **Sofortige Ersatzkarten-Wahl:** Wenn die aktive Karte der KI besiegt wird, wählt sie sofort die beste verfügbare Bankkarte als Ersatz, statt auf den nächsten Trigger zu warten.
  - **Strategisches Wechseln:** KI wechselt Karten nur noch bei kritisch niedrigen HP (<25%) UND wenn eine deutlich bessere Alternative vorhanden ist (>30% Verbesserung), statt wie zuvor fast bei jeder Gelegenheit.
  - **Kill-Priorisierung:** Lethal-Bonus für Angriffe massiv erhöht (14→30), Near-Lethal-Bonus (+8) und Overkill-Penalty eingeführt. Die KI priorisiert nun konsequent Kills.
  - **ELO-basierte Fehler:** Niedrige ELO = mehr zufällige (suboptimale) Entscheidungen. Hohe ELO = fast optimales Spiel.
  - **0-Punkte-Bug behoben:** KI bleibt nicht mehr hängen wenn sie keine Punkte für einen Wechsel hat – sie fällt jetzt auf Angriff zurück.
  - **Deadlock-Prävention:** KI übergibt den Zug an den Spieler wenn keine gültige Aktion möglich ist.
  - **Dynamische Verzögerung:** KI-Züge haben nun eine ELO-abhängige Verzögerung (1-3.5s) statt fester 1s für ein natürlicheres Spielgefühl.

### Behoben
- **HP-Bar:** Beide HP-Balken (Spieler und Gegner) zeigen nun korrekte Prozentwerte, auch wenn `maxHp` undefiniert ist.
- **Perspektiv-Guard:** Das GameBoard zeigt eine Ladeanzeige statt einer falschen Perspektive wenn die Auth-Session kurzzeitig leer ist.
- **Focus-Overlay:** Das Angriffs-Overlay schließt sich automatisch wenn der Gegner am Zug ist, damit KI-Züge sichtbar bleiben.

### Hinzugefügt
- **Floating Damage Numbers:** Schadenszahlen erscheinen als animierte, aufsteigende Zahlen über der getroffenen Karte (rot, verblassend).
- **KI-Zug-Indikator:** Der Turn-Indicator zeigt "KI denkt nach..." mit pulsierender Animation wenn die KI am Zug ist, statt des uninformativen "Warten...".

## [1.24.1.18] - 2026-04-20

### Behoben
- **Storage-Konfiguration:** Der in der Production-Umgebung fälschlicherweise konfigurierte Storage-Bucket (`abi-planer-75319.appspot.com`, welcher in diesem Projekt nicht existiert) wurde durch ein hartcodiertes Fallback in `src/lib/firebase.ts` abgefangen. Alle Upload-Anfragen für diesen Bucket werden nun automatisch an den korrekten Bucket (`abi-planer-75319.firebasestorage.app`) umgeleitet, um den 404/CORS-Fehler beim Bilder-Upload (`/task-images`) zu beheben.

## [1.24.1.17] - 2026-04-20

### Behoben
- **Shop-API CORS:** Die Next.js Konfiguration (`next.config.ts`) wurde um generische CORS-Header für `/api/:path*` erweitert, um Fehler bei API-Aufrufen zwischen Subdomains (z.B. von `tcg.abi-planer-27.de` nach `shop.abi-planer-27.de`) zu verhindern.

## [1.24.1.16] - 2026-04-20

### Hinzugefügt
- **Admin-Aufgaben:** Umfassendes strukturiertes Logging für den kompletten Aufgaben-Workflow:
  - `adminReviewTask`: Detaillierte Events beim Freigeben (approve) und Ablehnen (reject) von Beweisen mit Nutzer-/Admin-Kontext und Belohnungsdetails.
  - `trackTaskLifecycle`: Neue Trigger-Funktion für alle Aufgaben-Statusübergänge: task_created, task_claimed, task_proof_submitted, task_rejected, task_approved.
  - Alle Logs enthalten eindeutige Event-Namen und strukturierte Daten (UIDs, TaskIDs, Belohnungen, Ablehnungsgründe) für einfache Nachverfolgung und Debugging.

## [1.24.1.16] - 2026-04-20

### Behoben
- **Shop-Header Überlagerung:** Auf `shop.abi-planer-27.de` wurde der `LandingHeader` der Hauptseite über den eigenen Shop-Header gerendert, was zu einer Überlagerung führte. Behoben durch:
  - `AppShell`: `isDashboardSubdomain`-Check erkennt jetzt auch `shop.*`-Subdomains → kein `LandingHeader` mehr auf der Shop-Subdomain.
  - `shop/page.tsx`: Eigenen redundanten sticky Header entfernt, da die App-Navbar die Navigation übernimmt.

## [1.24.1.15] - 2026-04-20

### Geändert
- **Shop-Subdomain:** Alle Shop-bezogenen Routen (`/shop`, `/shop/abo`) werden ab sofort über die neue Subdomain `shop.abi-planer-27.de` ausgeliefert.
  - Neue Domain-Registry (`SHOP_DOMAIN`) und URL-Utilities (`getShopBaseUrl()`) analog zu `dashboard.*` und `tcg.*`.
  - Middleware leitet Zugriffe auf `/shop` automatisch auf die Shop-Subdomain um.
  - Navbar-Navigation: Shop-Links (Karten-Shop, Merch-Shop, Stufen-Shop) zeigen auf `shop.*`.
  - Stripe-Callback-URLs (`success_url`, `cancel_url`) auf `shop.abi-planer-27.de` umgestellt.
  - Interne Links in TCG-Dashboard, Battle-Pass, Finanzen/Spenden und Sammelkarten-Redirect aktualisiert.
  - 2FA-Gate: Shop-Bereich ist (wie TCG) von der Zwei-Faktor-Authentisierung ausgenommen.
  - Next.js Dev-Origins um `shop.abi-planer-27.localhost` erweitert.

## [1.24.1.14] - 2026-04-20

### Behoben
- **Admin-Aufgaben:** `adminReviewTask` auf die benannte Firestore-Datenbank `abi-data` umgestellt (statt `(default)`), wodurch der Backend-Fehler `Error: 5 NOT_FOUND` und der daraus resultierende `500 / INTERNAL` beim Freigeben/Ablehnen behoben wird.

## [1.24.1.13] - 2026-04-20

### Behoben
- **Admin-Aufgaben:** LCP-Hinweis für Beweisbilder reduziert, indem das oberste sichtbare `Image` in der Prüfungsansicht gezielt mit `loading="eager"` geladen wird.

## [1.24.1.12] - 2026-04-20

### Behoben
- **Admin-Aufgaben:** `adminReviewTask` gegen ungefangene Laufzeitfehler gehärtet (strikte Eingabevalidierung, sichere Behandlung von `reward_boosters`, sauberes Error-Mapping auf `HttpsError`). Dadurch wird der `500 / FirebaseError: INTERNAL` beim Freigeben/Ablehnen zuverlässig vermieden.

## [1.24.1.11] - 2026-04-20

### Behoben
- **Admin-Aufgaben:** Next.js-Warnung für Beweisbilder behoben, indem bei `Image` mit `fill` ein responsiver `sizes`-Wert ergänzt wurde. Dadurch wird die Bildauswahl optimiert und die Konsolenwarnung entfernt.

## [1.24.1.10] - 2026-04-20

### Behoben
- **Storage:** Kompatibilität der Storage-Rules verbessert. Ersetzung der ungültigen `startsWith`-Funktion durch `matches` und String-Slicing, was die korrekte Prüfung von Dateinamen und Content-Types sicherstellt.

## [1.24.1.9] - 2026-04-20

### Behoben
- **Storage:** Kritischer Fehler in den Storage-Rules behoben, bei dem die Firestore-Abfragen auf die `(default)` Datenbank verwiesen, während das Projekt die benannte Datenbank `abi-data` verwendet. Dies behebt den `storage/unauthorized` Fehler beim Hochladen von Aufgaben-Beweisen.

## [1.24.1.8] - 2026-04-20

### Behoben
- **Storage:** Optimierung der Berechtigungsprüfung für Aufgaben-Beweise. Durch die Neuanordnung der Regeln (Short-Circuiting) wird nun zuverlässig auch dann der Upload erlaubt, wenn die Firestore-Abfrage in den Storage-Rules aufgrund fehlender Leseberechtigungen für die Aufgabe fehlschlägt.

## [1.24.1.7] - 2026-04-20

### Hinzugefügt
- **Aufgaben:** Unterstützung für Text-Beweise bei der Aufgabeneinreichung implementiert. Nutzer können nun eine Beschreibung ihrer Erledigung eingeben, optional ergänzt durch ein Foto oder Video.
- **Admin:** Erweiterung der Aufgabenprüfung um die Anzeige eingereichter Text-Beweise.

## [1.24.1.6] - 2026-04-18

### Verbessert
- **Aufgaben-Detailseite:** Die Sidebar-Karte wurde strukturell optimiert. Durch den Verzicht auf Standard-Paddings (`py-0`, `gap-0`) und explizite Steuerung wird ein perfekt balancierter Abstand erreicht. Der Bereich "Aufgabe löschen" wurde extrem kompakt gestaltet und hinterlässt bei Nicht-Plannern keine Lücken.

## [1.24.1.5] - 2026-04-20

### Verbessert
- **Aufgaben-Detailseite:** Farbschema neutralisiert. Die grüne Markenfarbe (`brand`) wurde in der Sidebar, dem Bestätigungsmodal und der Erfolgsmeldung durch neutrale Primärtöne ersetzt, um ein seriöseres und weniger "grünes" Erscheinungsbild zu erzielen.

## [1.24.1.4] - 2026-04-20

### Verbessert
- **Aufgaben-Detailseite:** Ersetzung des Zap-Icons durch den Text "Booster" in der Belohnungsanzeige (Sidebar und Erfolgsmeldung) für eine klarere Kommunikation der Belohnung.

## [1.24.1.3] - 2026-04-20

### Verbessert
- **Aufgaben-Detailseite:** Die Sidebar-Karte wurde weiter vereinfacht und nutzt nun eine einheitliche Hintergrundfarbe für den gesamten Block. Der separate Header-Hintergrund und die Trennlinie wurden entfernt, um ein ruhigeres, monolithisches Design zu schaffen.

## [1.24.1.2] - 2026-04-20

### Verbessert
- **Aufgaben-Detailseite:** Signifikante Reduzierung des vertikalen Paddings in der Sidebar-Karte. Das Layout wurde kompakter gestaltet und die Abstände zwischen den Elementen symmetrisch harmonisiert, um ein effizienteres und übersichtlicheres Erscheinungsbild zu erzielen.

## [1.24.1.1] - 2026-04-20

### Verbessert
- **Aufgaben-Detailseite:** Design-Refinement der Sidebar-Karte für ein hochwertigeres, aber minimalistisches Erscheinungsbild. Nutzung von subtilen Markenfarben und verbesserten Typografie-Hierarchien.
- **Aufgaben-Flow:** Ein Bestätigungsmodal ("Bist du würdig?") wurde beim Annehmen von Aufgaben hinzugefügt, um die Verbindlichkeit und das Spielerlebnis (Gamification) zu steigern.

## [1.24.1.0] - 2026-04-20

### Verbessert
- **Aufgaben-Detailseite:** Harmonisierung der Abstände und Schriftgrößen. Statt einer extremen Vergrößerung wurde ein konsistentes Padding-Schema (`p-6` für Karten) eingeführt, das für ein aufgeräumtes und professionelles Erscheinungsbild sorgt, ohne die Elemente zu überdimensionieren.

## [1.24.0.0] - 2026-04-20

### Verbessert
- **Aufgaben-Detailseite:** Vollständige Überarbeitung der Layout-Struktur für ein luxuriöseres, großzügigeres Nutzererlebnis ("High-End Feel"). 
  - Konsistentes, deutlich vergrößertes Padding (`p-8` bis `p-16`) für alle Karten und Sektionen.
  - Optimierung der Typografie: Größere Titel (`text-3xl font-black`), vergrößerte Fließtexte (`text-xl`) und skalierte Icons für bessere Lesbarkeit und visuelle Präsenz.
  - Die Sidebar nutzt nun `shadow-2xl` und ein `p-8` Layout für maximale Übersichtlichkeit.
  - Buttons wurden für eine bessere Haptik vergrößert (`h-16`, `text-2xl`).

## [1.23.4.9] - 2026-04-20

### Verbessert
- **Aufgaben-UI:** Der "Aufgabe löschen" Button wurde für eine kompaktere Darstellung direkt in die Belohnungskarte integriert, statt eine eigene Karte zu beanspruchen.

## [1.23.4.8] - 2026-04-20

### Behoben
- **Storage:** "Unauthorized" Fehler beim Hochladen von Aufgaben-Beweisen behoben. Die Regeln wurden optimiert und ein Fallback-Mechanismus via UID-Präfix hinzugefügt, falls die Firestore-Abfrage in den Storage-Rules verzögert oder blockiert ist.

## [1.23.4.7] - 2026-04-20

### Fixes
- **Secret Rare Foil Alignment:** Die "Secret Rare" (Black Shiny) Folien wurden oft als zu klein oder falsch ausgerichtet angezeigt. Durch eine strukturelle Änderung am `TeacherCard`-Layout (Separation des Rahmens in eine eigene Ebene) füllen die Folien-Effekte nun wieder die gesamte Karte bis zum Rand aus.
- **Card Layering:** Ein Fehler im Z-Index wurde behoben, durch den Folien-Effekte teilweise über dem Karteninhalt (Text/Icons) lagen, anstatt dahinter. Die Hierarchie wurde für alle Karten-Varianten (Iconic, Holo, Shiny, Secret Rare) vereinheitlicht.

## [1.23.4.6] - 2026-04-20

### Hinzugefügt
- **Aufgaben:** Planner und Admins können nun Aufgaben direkt auf der Detailseite löschen. Dabei werden auch verknüpfte Beweis-Medien automatisch aus dem Storage entfernt.

## [1.23.4.5] - 2026-04-20

### Verbessert
- **Karten-Effekte:** Die Shimmer-Animationen der Kartenfolien (Shinys) wurden deutlich verlangsamt (bis zu 100% längere Dauer), um einen edleren, subtileren Effekt zu erzielen.
- **Visuals:** Ein sichtbarer "Cut" beim Übergang der Shimmer-Balken wurde durch die Umstellung auf `bg-no-repeat` und optimierte Animation-Offsets behoben.

## [1.23.4.4] - 2026-04-20

### Behoben
- **Architektur:** Warnung "Cannot update a component while rendering a different component" behoben, indem `onDismiss`-Callbacks im `SystemMessageProvider` asynchron via `setTimeout` ausgeführt werden.
- **Sammelkarten-Album:** Bereinigung der Drawer-Synchronisationslogik und Korrektur des URL-Handlings beim Schließen des Drawers.

## [1.23.4.3] - 2026-04-20

### Behoben
- **UI:** Fehlender Import von `cn` in `DrawerMessage` behoben.

## [1.23.4.2] - 2026-04-20

### Hinzugefügt
- **Popup Manager:** Neue `drawer`-Methode für seitlich ausklappbare Panels (Right Slide-Over).
- **UI-Komponenten:** Einführung der `Sheet`-Komponente (basierend auf @base-ui/react) für responsive Drawer-Layouts.
- **DrawerMessage:** Neue System-Nachrichten-Komponente für Drawer-Popups.

### Geändert
- **Sammelkarten-Album:** Die Detailansicht der Karten wurde vom modalen Dialog auf den neuen seitlichen Drawer umgestellt. Dies ermöglicht eine bessere Übersicht bei gleichzeitigem Zugriff auf den Hintergrund auf großen Bildschirmen und Vollbild-Ansicht auf Mobilgeräten.
- **System-Nachrichten:** Unterstützung von `ReactNode` als Content in System-Nachrichten für flexiblere UI-Einbindungen.

## [1.23.4.1] - 2026-04-20

### Geändert
- **Architektur:** Auslagerung der Karten-Detailansicht in eine modulare Komponente (`CardDetailView`).
- **Deep Linking:** URLs unter `/album/karte/[id]` öffnen nun das Album-Modal direkt, ohne eine separate Seite zu benötigen.
- **UI/Layout:** Der "Teilen"-Button wurde stabil im Header des Modals positioniert, um Überlappungen zu vermeiden.

## [1.23.4.0] - 2026-04-20

### Hinzugefügt
- **Karten-Detailansicht (Deep Linking):** Jede Sammelkarte hat nun eine eigene eindeutige URL (`/album/karte/[id]`). Karten können so direkt verlinkt und geteilt werden.
- **URL-Synchronisierung:** Beim Durchblättern des Albums wird die Browser-URL automatisch aktualisiert.

### Behoben
- **UI/Layout:** Der "Teilen"-Button wurde im Dialog-Header neu positioniert, um Überlappungen mit dem Kartendesign zu vermeiden.

## [1.23.3.3] - 2026-04-20

### Hinzugefügt
- **Sharing:** Sammelkarten können nun direkt aus der Detailansicht geteilt werden. Ein neuer Teilen-Button ermöglicht das Versenden eines Direktlinks via Web Share API oder Zwischenablage.

## [1.23.3.2] - 2026-04-20

### Geändert
- **Support-Spec-Karte:** Design vollständig an die Lehrer-Spec-Karten angepasst (gleiches Layout, Header und Footer), um System-Konsistenz zu gewährleisten.

## [1.23.3.1] - 2026-04-20

### Geändert
- **Support-Karten:** Einführung des Art/Spec-Modells. Die Hauptansicht (ArtCard) ist nun minimalistischer, während die Detailansicht (SpecCard) alle Angriffs-Informationen liefert.
- **Album:** Dynamische Unterstützung von Support-Spec-Karten in der Detailansicht.

## [1.23.3.0] - 2026-04-20

### Geändert
- **Support-Karten:** Vollständiges Redesign des Karten-Layouts. Support-Fähigkeiten sind nun als strukturierte Angriffe konzipiert (Name, Schaden, Beschreibung).
- **Technik:** Update der `SupportCardConfig` Typdefinition und Erweiterung des `SUPPORT_V1` Sets um neue strategische Angriffs-Karten ("Spickzettel", "Klassenkasse", "ABI Zeitung").

## [1.23.2.6] - 2026-04-20

### Behoben
- **Lehrer-Album:** Karten werden nicht mehr doppelt angezeigt. Die Deduplizierungs-Logik wurde verbessert, um Überschneidungen zwischen Legacy-IDs und neuen Set-IDs (mit Präfix) korrekt zu handhaben.

## [1.23.2.5] - 2026-04-20

### Hinzugefügt
- **Navigation:** Das Lehrer-Album hat nun eine eigene dedizierte Route unter `/album`.

### Geändert
- **Sammelkarten:** Alle internen Links und Navigationspunkte wurden von `/sammelkarten?view=album` auf die neue Route `/album` umgestellt.

## [1.23.2.4] - 2026-04-20

### Fixes
- **Sammelkarten-Album:** Hardkodierte Basis-Sets (wie das Support-Set) werden nun korrekt mit dynamischen Firestore-Daten zusammengeführt, sodass sie nicht mehr verschwinden, wenn Lehrer-Daten in der Datenbank vorhanden sind. Dies stellt sicher, dass der Set-Filter und alle verfügbaren Karten angezeigt werden.

## [1.23.2.3] - 2026-04-20

### Hinzugefügt
- **Sammelkarten-Album:** Support-Karten werden nun im Album angezeigt und können nach Sets gefiltert werden.
- **Sammelkarten-Album:** Gesperrte (noch nicht entdeckte) Karten sind jetzt anklickbar und zeigen einen Hinweis-Text (`obtainMessage`) an, wie sie freigeschaltet werden können.

### Geändert
- **Sammelkarten-System:** Das Card-Mapping wurde flexibilisiert, um verschiedene Kartentypen (Lehrer, Support) im Album einheitlich zu unterstützen.

## [1.23.2.2] - 2026-04-20

### Geändert

- **Sammelkarten:** Das Spendenbanner (FundingBanner) wird auf der `/booster`-Seite nun ausgeblendet, um eine sauberere UI beim Öffnen von Packs zu gewährleisten.

## [1.23.2.1] - 2026-04-20

### Fixes

- **Navbar:** Der `ReferenceError: useMemo is not defined` wurde behoben, indem der fehlende Import hinzugefügt wurde.

## [1.23.2.0] - 2026-04-20

### Hinzugefügt

- **TCG Dashboard Redesign:** Das Dashboard wurde komplett überarbeitet und bietet nun eine immersive "Game Hub" Experience mit animierten Hero-Bereich, schnellen Sammlungs-Stats und direktem Fokus auf das Pack-Opening.
- **Verbesserte Theme-Synchronisation:** Das Farbschema (Dark/Light) und das Akzent-Theme werden nun zuverlässiger zwischen Planer- und TCG-Modul synchronisiert, indem das Benutzerprofil als zentrale Quelle genutzt wird.

### Fixes

- **Navigation:** Der Button "Zum Planer-Modul" funktioniert nun korrekt und leitet zuverlässig auf das Planer-Dashboard zurück.
- **Domain-Erkennung:** Die Erkennung der aktuellen Subdomain wurde beschleunigt, um Navigationsfehler beim ersten Laden zu vermeiden.

## [1.23.1.0] - 2026-04-20

### Hinzugefügt

- **TCG-Subdomain-Routing:** Die TCG-Infrastruktur wurde für die Nutzung von `tcg.localhost:3000` (lokal) und `tcg.abi-planer-27.de` (Produktion) optimiert.
  - Das TCG-Dashboard ist nun unter `/home` erreichbar.
  - Das Öffnen von Boostern hat eine eigene dedizierte Route unter `/booster`.
  - Die Root-URL `/` auf der TCG-Subdomain leitet automatisch auf das TCG-Dashboard (`/home`) weiter.
  - Die Navigation (Navbar) wurde auf die neuen Pfade angepasst.

## [1.23.0.0] - 2026-04-20

### Hinzugefügt

- **TCG-Trennung (Navigation):** Das Sammelkarten-System (TCG) wurde strukturell stärker vom Planer-Modul getrennt. 
  - In der Haupt-Menüleiste des Planers wird nun nur noch ein einziger Link "Zu den Sammelkarten" angezeigt.
  - Sobald man sich im TCG-Bereich befindet, wechselt die Menüleiste automatisch und zeigt alle TCG-spezifischen Funktionen (Booster, Album, Decks, Trading, Kämpfe, TCG-Shop).
  - Für Planer wurde ein Link "Zum Planer-Modul" in der TCG-Menüleiste hinzugefügt, um den schnellen Rückweg zum Dashboard zu ermöglichen.
  - Die Anmeldung bleibt über alle Bereiche hinweg synchron (Single Sign-On).

## [1.22.1.0] - 2026-04-20

### Geändert

- **Dashboard Layout (Masonry):** Das Dashboard-Grid wurde auf ein CSS-Spalten-Layout (`columns-2`) umgestellt. Dadurch rücken Widgets vertikal auf ("aufrücken"), um ungenutzte Lücken zwischen Elementen mit unterschiedlichen Höhen zu schließen und die Platznutzung auf Desktop-Geräten zu optimieren.

## [1.22.0.3] - 2026-04-20

### Behoben

- **Performance (Infinite Loop):** Ein kritischer unendlicher Re-render-Loop auf der Umfragen-Seite (`src/app/abstimmungen/page.tsx`) wurde behoben. Der Loop wurde durch eine fehlende Zeitprüfung bei der Aktualisierung von `last_visited.umfragen` und instabile Abhängigkeiten im `useEffect` ausgelöst.
- **Stabilität:** Die Synchronisierung des Genehmigungsstatus (`is_approved`) im `AuthContext` wurde robuster gestaltet, um potenzielle Loops bei fehlenden Feldern zu verhindern.
- **Zustands-Management:** Optimierung der `last_visited`-Aktualisierungen in den Modulen `todos` und `abstimmungen` durch Verwendung primitiver Abhängigkeiten (`profile.id`, etc.) anstelle des gesamten Profil-Objekts.

## [1.22.0.2] - 2026-04-20

### Behoben

- **Performance (Infinite Loop):** Ein kritischer Fehler wurde behoben, der zu einer "Maximum update depth exceeded" Fehlermeldung und einem unendlichen Re-render-Loop in der `useNotifications` Hook führte. 
- **Stabilität:** Die `useNotifications` Hook wurde stabilisiert, indem die Abhängigkeiten im `useEffect` (insbesondere Arrays wie `planning_groups`) nun via String-Vergleich (JSON.stringify) überwacht werden und Zustands-Updates nur bei tatsächlichen Wertänderungen ausgelöst werden.
- **Provider-Optimierung:** Der `AuthContext` Provider wurde memoisiert, um unnötige Re-renders des gesamten Komponentenbaums bei jeder Profilaktualisierung zu verhindern.

## [1.22.0.1] - 2026-04-20

### Geändert

- **Versionssystem:** Umstellung auf ein vierstelliges Versionierungsschema (`x.x.x.x`). 
  - 1. Stelle: App-Generation (Quasi neue App)
  - 2. Stelle: Große Features / Feature-Sammlungen
  - 3. Stelle: Kleine Features
  - 4. Stelle: Texte und Bugfixes

## [1.22.0.0] - 2026-04-20

### Behoben

- **Umfragen (Benachrichtigungen):** Ein Fehler wurde behoben, durch den der rote Benachrichtigungspunkt in der Navbar bestehen blieb, auch wenn Umfragen bereits angesehen wurden. Der Punkt verschwindet nun präzise, sobald eine Umfrage auf dem Bildschirm (Viewport) erscheint.
- **Umfragen (Teilnehmerzahl):** Die Zählung der Teilnehmer bei Umfragen im Vorschlags-Modus wurde korrigiert. Durch den Einsatz von `getCountFromServer` ist die Zählung nun performanter und erfasst auch Nutzer korrekt, die lediglich Vorschläge eingereicht, aber nicht an klassischen Wahlmöglichkeiten teilgenommen haben.
- **Umfragen (Sicherheit & Berechtigungen):** Firestore-Berechtigungsfehler (403 Forbidden) beim Abstimmen oder Einreichen von Vorschlägen wurden behoben. Die Regeln wurden so angepasst, dass alle authentifizierten Nutzer mit Lernsax-Konto an Umfragen teilnehmen können, auch wenn sie noch nicht manuell vom Admin freigeschaltet wurden (is_approved).
- **Umfragen (UI):** Die Bezeichnung "Briefkasten" wurde systemweit durch neutralere Begriffe wie "Vorschläge" oder "Vorschlags-Modus" ersetzt.

## [1.21.04] - 2026-04-19

### Behoben

- **Layout (Landing Header):** Ein Fehler wurde behoben, durch den der Header auf der Haupt-Landingpage nicht mehr angezeigt wurde. Die Logik wurde in die `AppShell` zentralisiert, sodass nun alle öffentlichen Seiten (Impressum, Datenschutz, Hilfe, Vorteile etc.) auf der Hauptdomain konsistent den Landing-Header und Footer anzeigen. Redundante Header-Imports in Einzelseiten wurden entfernt und das Hero-Padding auf der Startseite optimiert.

## [1.21.03] - 2026-04-19

### Behoben

- **Umfragen (Teilnehmerzahl):** Ein Fehler wurde behoben, durch den Teilnehmer, die nur Vorschläge im "Briefkasten" eingereicht (aber nicht bei klassischen Optionen abgestimmt) hatten, nicht in der Gesamt-Teilnehmerzahl gezählt wurden.

## [1.21.02] - 2026-04-19

### Behoben

- **Umfragen (Mobile-Fix):** Ein Fehler wurde behoben, durch den das Eingabefeld für eigene Vorschläge (Briefkasten-Modus) auf Mobilgeräten teilweise nicht angezeigt oder durch Animationen verdeckt wurde.
- **Umfragen (Dashboard):** Fehlende Benutzer-Berechtigungen in der Dashboard-Ansicht von Umfragen wurden ergänzt, um eine konsistente Anzeige zu gewährleisten.

## [1.21.01] - 2026-04-19

### Hinzugefügt

- **Account-gebundene Themes:** Das gewählte Farbschema (Hell/Dunkel) und die Akzentfarbe werden nun im Benutzerprofil gespeichert und geräteübergreifend synchronisiert.

## [1.21.00] - 2026-04-19

### Hinzugefügt

- **Umfragen (KI-Platzhalter):** Der Platzhalter-Text ("Ghosttext") im Eingabefeld für eigene Vorschläge wird nun automatisch von einer KI (Groq) passend zur jeweiligen Umfrage-Frage generiert. Dies sorgt für eine kreativere Nutzeransprache (z.B. "Welcher Song fehlt noch?" bei einer Musik-Umfrage).

## [1.20.00] - 2026-04-19

### Geändert

- **Umfragen (Minimalistische Details):** Die Umfrage-Details wurden von einem Modal auf eine dedizierte Detailseite umgestellt. Dies sorgt für eine übersichtlichere Darstellung der Teilnehmerlisten und Briefkasten-Vorschläge ohne Scroll-Containern in Modals.
- **Umfragen (Sicherheit & UI):** Der Zugriff auf detaillierte Teilnehmerlisten und Briefkasten-Vorschläge ist nun strikt auf Ersteller, Planer und Admins begrenzt. Redundante Hinweistexte wurden entfernt, da die geschützten Bereiche für unbefugte Nutzer ohnehin vollständig ausgeblendet werden.
- **PollList Komponente:** Die Komponente wurde bereinigt und navigiert nun direkt zur Detailseite, anstatt ein komplexes Modal zu öffnen.

## [1.19.00] - 2026-04-19

### Hinzugefügt

- **Umfragen (Briefkasten-Modus):** Umfragen können nun als vertrauliche Ideensammlung genutzt werden. Eingereichte Vorschläge werden nicht öffentlich zur Wahl gestellt, sondern landen in einem privaten "Briefkasten", der nur für Planer und Admins einsehbar ist. 
- **Umfragen (Admin-Einsicht):** Planer können eingegangene Briefkasten-Vorschläge über den neuen "Briefkasten"-Reiter im Detail-Dialog einsehen.

## [1.18.10] - 2026-04-19

### Behoben

- **Middleware (Stabilität):** Ein Absturz (`TypeError: Invalid URL`) in der Next.js Edge Middleware wurde behoben, indem die Basis-URLs nun automatisch mit einem Protokoll (Standard: `https://`) versehen werden, falls dieses in den Umgebungsvariablen fehlt.

## [1.18.10] - 2026-04-19

### Verbessert

- **Umfragen (Ideen-Limits):** Ersteller können nun die maximale Zeichenlänge für eigene Vorschläge (5-200 Zeichen) sowie ein persönliches Limit an Vorschlägen pro Nutzer (z.B. nur 1 Idee pro Person) festlegen. 
- **Umfragen (UX):** In der Umfragen-Liste wird nun live angezeigt, wie viele Zeichen noch verfügbar sind und wie viele eigene Ideen bereits eingereicht wurden.

## [1.18.00] - 2026-04-19

### Hinzugefügt

- **Umfragen (Ideen-Sammlung):** Ersteller können nun freie Texteingaben erlauben. Nutzer können eigene Vorschläge (z.B. Motto-Ideen) einreichen, die sofort für alle anderen wählbar werden. Inklusive automatischer Duplikat-Prüfung.

## [1.17.00] - 2026-04-19

### Hinzugefügt

- **Umfragen (Sharing):** Umfragen können nun geteilt werden. Über einen neuen "Share"-Button kann ein Direktlink in die Zwischenablage kopiert werden.
- **Umfragen (Einzelseite):** Es wurde eine dedizierte Detailseite für Umfragen unter `/abstimmungen/[id]` erstellt.

## [1.16.11] - 2026-04-19

### Sicherheit

- **Firestore Rules:** Zugriff auf Umfragen wird nun strikt auf Datenbankebene geprüft. Private Umfragen sind nur für die definierte Zielgruppe lesbar.

### Behoben

- **Umfragen (UX):** Konsolen-Fehler beim Erreichen des Stimmen-Limits entfernt. Die Validierung erfolgt nun geräuschlos vor der Transaktion.

## [1.16.10] - 2026-04-19

### Verbessert

- **Umfragen (UX):** Die Auswahl der Zielgruppe wurde neu gestaltet. Es gibt nun eine klare Unterscheidung zwischen öffentlichen und eingeschränkten Umfragen mit einer intuitiven Rollen- und Gruppenwahl.

## [1.16.00] - 2026-04-19

### Hinzugefügt

- **Umfragen (Multiple Choice):** Umfragen unterstützen nun Mehrfachauswahl. Ersteller können ein Limit festlegen (z.B. "Wähle 2 von 5 Optionen").
- **Umfragen (Rollen-Filter):** Die Zielgruppenauswahl wurde verfeinert. Es können nun gezielt spezifische Admin-Rollen (`Haupt-Admins`, `Co-Admins`) oder der gesamte Jahrgang als Zielgruppe für Umfragen ausgewählt werden.

## [1.15.00] - 2026-04-19

### Hinzugefügt

- **Umfragen (Upgrade):** Ersteller können nun Zielgruppen für Umfragen festlegen. Umfragen können auf spezifische Rollen (z.B. Planer) oder Planungsgruppen eingeschränkt werden.
- **Umfragen (Ergebnisse):** Planer und Administratoren können nun über einen neuen "Details"-Button genau einsehen, welcher Nutzer für welche Option abgestimmt hat. Die Namen der abstimmenden Nutzer werden für eine performante Anzeige direkt beim Votum gespeichert.

## [1.14.30] - 2026-04-19

### Behoben

- **UX (Dashboard-Einstellungen):** Bestehende Werte werden nun zuverlässig in den Bearbeitungs-Dialogen (Einstellungen, Termine, Aufgaben, Finanzen) vorausgefüllt. Ein neuer Synchronisierungs-Mechanismus stellt sicher, dass die Felder auch dann korrekt befüllt sind, wenn die Daten verzögert laden.

## [1.14.29] - 2026-04-19

### Behoben

- **Lehrer-Einreichung Rules komprimiert:** Die Validierung für `teacher_submissions` wurde in eine zentrale Hilfsfunktion ausgelagert, bei gleicher Sicherheitslogik und besserer Lesbarkeit.
- **Deployment:** Firestore-Regeln wurden erfolgreich live deployed (`firebase deploy --only firestore:rules`).

## [1.14.28] - 2026-04-19

### Geändert

- **Lehrer-Submission Admin-Ansicht:** Die Übersicht der eingereichten Lehrerkarten wurde komplett überarbeitet.
  - **Karten-Vorschau:** Jede Einreichung zeigt nun eine Echtzeit-Vorschau der Vorder- und Rückseite (Details) der Karte an.
  - **Strukturierte Daten:** Die vom Lehrer eingegebenen Texte (Beschreibung, Werte, Fähigkeiten) werden nun übersichtlich neben der Karte dargestellt, um die Prüfung zu erleichtern.
  - **Visuelles Feedback:** Neues Layout mit Fokus auf die Ästhetik des Sammelkartenspiels.

## [1.14.27] - 2026-04-19


### Behoben

- **Lehrer-Einreichung ohne Login:** Firestore-Regeln für `teacher_submissions` angepasst, damit unangemeldete Lehrkräfte Karten sicher einreichen können, ohne an einem Berechtigungsfehler zu scheitern.
    - Entfernt die potenzielle Rechte-Blockade durch Cross-Document-Read in der Create-Regel.
    - Stattdessen strikte Feldvalidierung der Einreichungsdaten direkt in der Rule.

## [1.14.27] - 2026-04-19

### Behoben

- **Lehrer-Submission Stabilität:** Der Einreichungs-Flow auf `/lehrer/erstellen/[token]` wurde gehärtet, damit der Absenden-Button auf frischen/unangemeldeten Geräten nicht mehr im Ladezustand hängen bleibt.
    - Foto-Upload nutzt jetzt direkt den zugeschnittenen Blob statt `fetch(blob:...)`.
    - Timeout-Schutz für Upload und Firestore-Schreibvorgänge mit sauberem Fehler-Rückfall.
    - Object-URL-Handling beim Bildwechsel und Cleanup verbessert.

## [1.14.27] - 2026-04-19

### Behoben

- **UI-Fix Bestätigungstext:** Der Text im Bestätigungsfeld fließt nun korrekt als ein zusammenhängender Absatz und wird nicht mehr durch das Flex-Layout in Spalten zerteilt.

## [1.14.26] - 2026-04-19

### Behoben

- **UI-Fix Lehrer-Abschluss:** Layout des Bestätigungsfeldes und Design des Absenden-Buttons korrigiert (Zentrierung, Textfluss und Schattenwurf).

## [1.14.25] - 2026-04-19

### Behoben

- **Lehrer-Submission Berechtigungen:** Firestore-Regeln angepasst, damit Lehrer ihre Karte auch ohne eigenen Account erfolgreich einreichen können. Der Berechtigungsfehler beim Abschließen des Prozesses wurde behoben.

## [1.14.24] - 2026-04-19

### Geändert

- **Lehrer-Kartendesigner:** Verlinkung der speziellen Bedingungen für Sammelkarten (AGB) im Bestätigungs-Schritt hinzugefügt.

## [1.14.23] - 2026-04-19

### Geändert

- **Lehrer-Kartendesigner:** Der Foto-Upload wurde explizit als optional/freiwillig markiert.
- **Benutzerführung:** Anpassung der Texte und Buttons im Foto-Schritt, um die Freiwilligkeit zu betonen (z.B. "Ohne Foto weiter").

## [1.14.22] - 2026-04-19

### Behoben

- **Lehrer-Redirect-Fix:** Ein Fehler in der AppShell wurde behoben, der trotz öffentlicher Route fälschlicherweise zum Login umgeleitet hat, wenn man nicht angemeldet war. Lehrer-Einladungslinks funktionieren nun garantiert ohne Login.

## [1.14.21] - 2026-04-19

### Behoben

- **Lehrer-Einladungslink:** Login-Zwang für die Kartenerstellung entfernt. Lehrer können nun den Link direkt öffnen und ihre Karte erstellen, ohne sich anmelden zu müssen.

## [1.14.20] - 2026-04-19

### Geändert

- **Mobile & Tablet Optimierung:** Der Lehrer-Kartendesigner wurde für Touch-Geräte perfektioniert.
  - **Full-Screen Foto-Editor:** Optimierter Zuschneide-Dialog für Smartphones mit Touch-Gesten-Unterstützung.
  - **Responsive Wizard:** Adaptive Navigation und Buttons, die sich an die Bildschirmgröße anpassen (stacked Layout auf Mobile).
  - **Verbesserte Touch-Flächen:** Vergrößerte Eingabefelder und Schalter für fehlerfreie Bedienung auf kleinen Displays.
  - **Adaptive Typografie:** Schrifthöhen und Abstände passen sich nun flüssig an das Endgerät an.

## [1.14.19] - 2026-04-19

### Geändert

- **Minimalistischer Lehrer-Kartendesigner:** Komplette Neugestaltung der Oberfläche für maximale Übersichtlichkeit.
  - **Entfall von Kacheln:** Wechsel zu einer schlichten, zentrierten Wizard-UI.
  - **Start-Wahl:** Erster Schritt ermöglicht die Wahl zwischen geführtem Modus und Experten-Modus.
  - **Personalisierung:** Individuelle Begrüßung des Lehrers mit Titel und Nachnamen.
  - **Sequentieller Workflow:** Mehrstufiger Prozess (Wizard) statt Einseiten-Formular zur Reduzierung der kognitiven Last.

## [1.14.18] - 2026-04-19

### Geändert

- **Lehrer-Kartendesigner Optimierung:** Der Erstellungsprozess für Lehrer wurde grundlegend verbessert.
  - Neuer **Assistenten-Modus** für detaillierte Erklärungen (aktivierbar via Toggle).
  - **Beispiel-Vorschläge:** Lehrer können nun per Klick fertige Textbeispiele für Beschreibungen und Fähigkeiten laden, um die Erstellung zu erleichtern.
  - **Wizard-UI:** Klare visuelle Trennung der Schritte (Basisdaten, Fähigkeiten, Foto) mit Fortschrittsanzeige.
  - **Verständlichere Terminologie:** Fachbegriffe werden im Hilfe-Modus für weniger technik-affine Nutzer umschrieben (z.B. "KP" als "Widerstand").
  - **Kompakter Experten-Modus:** Bei deaktivierter Hilfe wird die Oberfläche für erfahrene Nutzer deutlich entschlackt.

## [1.14.17] - 2026-04-19

### Geändert

- **Support-Banner bearbeitbar:** Der Banner hat jetzt eine feste Referenz `support-banner` und sitzt direkt unter dem Seitentitelbereich.
- **Getrenntes Support-Ziel:** Das Support-Ziel ist als eigene `support_goal`-Einstellung erfasst und kann über die Seiteneinstellungen bearbeitet werden.

## [1.14.16] - 2026-04-19

### Geändert

- **Support-Pool getrennt:** Der Banner für Server- und Entwicklungskosten ist jetzt klar von der Abikasse getrennt.
- **Startziel 100 €:** Das erste Ziel für den Support-Pool ist auf 100 € gesetzt und wird nur in Dashboard und TCG angezeigt.

## [1.14.15] - 2026-04-19

### Behoben

- **Landingpage ohne Dashboard-Shell:** Auf `localhost` wird die Startseite nicht mehr als Dashboard-Subdomain behandelt, sodass die Landingpage nicht mehr in der Dashboard-Struktur mit Seitenmenü gerendert wird.
- **Menüleiste auf Landing entfernt:** Die obere Landing-Menüleiste wurde auf der Startseite entfernt (`/`), damit die Seite ohne Menünavigation angezeigt wird.

## [1.14.14] - 2026-04-19

### Geändert

- **Banner-Zielbereiche eingeschränkt:** Der Finanzbanner erscheint jetzt nur noch im Dashboard und in der TCG-Ansicht, nicht mehr auf der öffentlichen Startseite.
- **Banner wiederverwendet:** Der Banner wurde als gemeinsame Komponente ausgelagert und in Dashboard sowie Sammelkarten-Seite eingebunden.

## [1.14.13] - 2026-04-19

### Geändert

- **Finanzbanner auf der Startseite:** Die Landing Page zeigt jetzt direkt unter dem Header ein einklappbares Banner mit aktueller Summe, Zielsumme, Fortschrittsbalken und kurzem Erklärungstext.
- **Öffentlicher Finanz-Cache:** Der Cron-Job schreibt den aktuellen Finanzstand und die Zielsumme in den öffentlichen Landing-Cache, damit der Banner ohne Login live anzeigen kann.

## [1.14.12] - 2026-04-19

### Geändert

- **Spendenoptionen erweitert:** Die Spenden-Seite bietet jetzt drei klar getrennte Wege: direkte Kontoüberweisung für die Abikasse, Buy Me a Coffee für die App-Unterstützung und Stripe für schnelle Kartenzahlungen mit dem Hinweis auf verbleibende Gebühren.
- **Spenden-Übersicht:** Ein prominenter Banner hebt das Finanzziel hervor und führt die drei Unterstützungswege zusammen.

## [1.14.11] - 2026-04-17

### Hinzugefügt

- **Aufgaben-Marktplatz Redesign:** Die `/aufgaben` Seite wurde im "Kleinanzeigen"-Stil umgestaltet, um Aufgaben visuell ansprechender zu präsentieren.
- **Marktplatz-Karten:** Neue `MarketplaceCard` Komponente mit großen Vorschaubildern und prominenter Booster-Belohnung.
- **Bilder-Karussell:** Interaktives, wischbares `ImageCarousel` (Swipe-fähig) auf der Aufgaben-Detailseite für die Präsentation von bis zu 3 Erklärbildern.
- **Detail-Layout:** Überarbeitetes Produkt-Detail-Layout für Aufgaben zur besseren Übersicht von Beschreibung, Belohnung und Status.
### Behoben
- **Storage-Berechtigungen:** Fehler `storage/unauthorized` beim Hochladen von Aufgabenbildern behoben, indem die Validierungsregeln für `task-images` optimiert wurden.
- **Typen-Fix:** Fehlender Typ `DASHBOARD_LAYOUT_RESET` im `LogActionType` ergänzt, um Build-Fehler zu beheben.

## [1.14.2] - 2026-04-16
### Behoben
- **2FA Login CORS Robustness:** Die CORS-Konfiguration für Cloud Functions wurde auf `cors: true` umgestellt. Dies ist für Callable Functions sicher (da sie durch Firebase Auth geschützt sind) und stellt eine robustere Preflight-Handhabung über alle Subdomains hinweg sicher, was die verbleibenden `ERR_FAILED` Fehler beim 2FA-Login auf `tcg.abi-planer-27.de` behebt.

## [1.14.1] - 2026-04-16
### Behoben
- **2FA Login CORS Fix:** Korrektur der CORS-Konfiguration für Cloud Functions (insbesondere `verifyLogin2FA`). Die Verwendung von Regex in der `CALLABLE_CORS_ORIGINS` Liste wurde durch explizite Domain-Strings ersetzt, um Preflight-Fehler auf der TCG-Subdomain zu beheben.

## [1.14.0] - 2026-04-16
### Behoben
- **CORS Policy Violations:** Cross-Subdomain-Navigation (z. B. vom Dashboard zum TCG-Modul) nutzt nun Standard-`<a>`-Tags anstelle von `next/link`. Dies verhindert das fehlerhafte Abrufen von RSC-Payloads über Subdomain-Grenzen hinweg und behebt `ERR_BLOCKED_BY_CORS`.
- **Redirect-Schleifen (Finaler Fix):** Die Middleware normalisiert Hostnamen nun konsistent ohne Port-Angaben und verwendet eine verbesserte Loop-Prävention in `safe_redirect`.
- **Navbar & Promo-Links:** Alle Navigations- und Promo-Links, die Subdomain-Grenzen überschreiten, wurden auf absolute URLs und Hard-Navigation umgestellt.

## [1.13.15] - 2026-04-16
### Behoben
- **Redirect-Schleife auf TCG-Domain:** Die Middleware normalisiert den Host nun robust (ohne Port) und nutzt einen Redirect-Guard, der identische Ziel-URLs erkennt und Self-Redirects verhindert (`ERR_TOO_MANY_REDIRECTS`).
- **Domain-Routing robuster:** Subdomain-Erkennung und Weiterleitungen bleiben aktiv, vermeiden aber Endlosschleifen bei fehlerhaften oder inkonsistenten URL-Konfigurationen.

## [1.13.14] - 2026-04-16
### Geändert
- **Kontextuelle Graphen-Integration:** Die 3 Kern-Graphen wurden direkt in die funktionalen Blöcke der Landing Page eingebettet, statt isoliert zu stehen.
- **Storytelling mit Daten:** 
    - Der **Momentum-Graph** wurde in die Mission-Sektion integriert, um den Gesamterfolg der Plattform zu untermauern.
    - Der **Effizienz-Graph** visualisiert nun direkt im Finanzen-Feature den Optimierungsvorteil.
    - Der **Koordinations-Graph** wurde in das Teams-Feature eingebettet, um die verbesserte Zusammenarbeit zu zeigen.
- **Layout-Bereinigung:** Entfernung der separaten 'Success Metrics' Sektion für ein flüssigeres, integriertes Nutzererlebnis.

## [1.13.13] - 2026-04-16
### Geändert
- **Graphen-Konsolidierung:** Reduktion der Chart.js Visualisierungen auf die 3 aussagekräftigsten Graphen, um die Seite übersichtlicher zu gestalten.
- **Zentraler Wachstums-Graph:** Ein neuer, prominenter Graph in der Stats-Sektion visualisiert das gesamte Plattform-Engagement.
- **Performance-Fokus:** Beibehaltung der zwei Graphen für Planungs-Effizienz und Team-Koordination als Kern-Visuals.
- **Minimalistische Icons:** Rückkehr zu sauberen Icons in den Sektionen Features und Sammelkarten zur Unterstützung des Open Space Designs.

## [1.13.12] - 2026-04-16
### Geändert
- **Ganzheitliche Datenvisualisierung:** Vollständiger Ersatz von statischen Metriken und Icons durch interaktive Chart.js Graphen auf der gesamten Landing Page.
- **Sparkline Integration:** Die Public Stats und Sammelkarten-Vorteile nutzen nun kleine, dynamische Sparklines mit steilen Erfolgskurven.
- **Feature-Charts:** Ersatz der SVG-Visuals in der Features-Sektion durch detaillierte Chart.js Linien- und Flächendiagramme zur besseren Funktionsdarstellung.
- **Konsistente Erfolgskurven:** Alle Graphen wurden einheitlich auf eine steile Aufwärtsentwicklung optimiert, um den Performance-Boost der Plattform zu unterstreichen.

## [1.13.11] - 2026-04-16
### Hinzugefügt
- **Erfolgsgraphen:** Integration von dynamischen Chart.js Graphen in die Landing Page, um den Planungsfortschritt und die Effizienzsteigerung zu visualisieren.
- **Performance-Visualisierung:** Zwei neue Graphen zeigen die steile Erfolgskurve bei der Nutzung der Plattform für Planungs-Effizienz und Team-Koordination.

## [1.13.10] - 2026-04-16
### Behoben
- **News-Bilder:** Korrektur der Anzeige von News-Bildern in der Landing-Page-Listenansicht.

### Geändert
- **Grafische Aufwertung:** Integration von abstrakten SVG-Grafiken, Graphen und Diagrammen in den Feature-Sektionen zur besseren Visualisierung der Funktionen.
- **Raumtrenner:** Implementierung von hochwertigen Gradient-Dividern zwischen den Hauptsektionen für eine klarere visuelle Struktur.
- **Interaktive Platzhalter:** Aufwertung der Visuals in der Dual-Focus-Sektion durch dynamische Gradients und Grid-Muster.
- **Background-Atmosphäre:** Hinzufügen von subtilen Hintergrund-Blobs und Glow-Effekten, um den 'Open Space' lebendiger zu gestalten.

## [1.13.9] - 2026-04-16
### Geändert
- **Open Space Redesign:** Vollständige Abkehr vom Kachel-basierten Layout. Trennung von Inhalten erfolgt nun primär durch Whitespace und Typografie statt durch Rahmen und Container.
- **Editorial Features:** Umstellung der Feature-Präsentation auf ein großzügiges Zick-Zack-Layout mit Fokus auf Text und Visuals.
- **Metric Highlights:** Darstellung von System-Statistiken als freistehende, prominente Typografie-Elemente ohne umschließende Boxen.
- **Listen-basierte News:** Umstellung der News-Sektion von Kacheln auf eine saubere, offene Listenansicht mit dezenten Dividern.
- **Integration Sammelkarten:** Der interaktive Sammelkarten-Bereich wurde nahtloser in das offene Gesamtdesign integriert.

## [1.13.8] - 2026-04-16
### Hinzugefügt
- **Kontextsensitive Navigation:** Die Menüleiste erkennt nun die aktuelle Domain und zeigt für externe Nutzer auf der TCG-Domain nur relevante Inhalte an.
- **Cross-Domain Navigation:** Planer und Admins behalten auf der TCG-Domain Zugriff auf alle Planungsmodule über automatische Cross-Domain-Links (absolut statt relativ).
- **"Zurück zum Planer":** Neue Navigationssektion für Planer auf der TCG-Domain, um schnell zum Dashboard oder Kalender zurückzukehren.

### Geändert
- **Landing Page Redesign:** Vollständige Überarbeitung der Landing Page (`/`) in einem minimalistischen und modernen Stil.
- **Typografie-Update:** Entfernung aggressiver Stilmittel (exzessives Uppercase/Italic/Font-Black) zugunsten einer saubereren, besser lesbaren Schriftgestaltung.
- **Inhalts-Mix:** Optimierte Balance zwischen Planungs-Features (Organisation) und interaktiven Sammelkarten.
- **UI-Polishing:** Konsistente Abrundungen (rounded-3xl/2xl) und reduzierte Hover-Effekte für ein ruhigeres Nutzererlebnis.
- **Kompaktes Design:** Optimierung der Sektionsabstände und Whitespace für eine bessere Darstellung auf mobilen Endgeräten.

## [1.13.7] - 2026-04-16
### Behoben
- **Local Dev Redirects:** Redirects im Localhost nutzen nun `http` statt `https` und behalten die Port-Nummer bei, um SSL-Protokollfehler zu vermeiden.
- **Dashboard-Flackern:** Behebung eines kritischen Render-Bugs, bei dem Widgets bei Datenaktualisierungen unnoetig unmounted und remounted wurden (Fix: Entfernen von internen Komponenten-Definitionen in der Render-Schleife).
- **Synchronisation der Ladezustaende:** Vereinheitlichung der Skeleton-Logik fuer das Kurs-Ranking, um visuelle Spruenge (Flickering) zwischen verschiedenen Daten-Streams zu vermeiden.

## [1.13.6] - 2026-04-16
### Hinzugefuegt
- **Striktes Domain-Routing:** Implementierung von automatischen Redirects (HTTP 307) zwischen `abi-planer-27.de` (Landing), `dashboard.abi-planer-27.de` (Planner) und `tcg.abi-planer-27.de` (Sammelkarten).
- **Subdomain-Enforcement:** Nutzer werden nun automatisch auf die korrekte Subdomain umgeleitet, wenn sie eine Seite ueber den falschen Host aufrufen, anstatt einen 404-Fehler zu erhalten.
- **Routenzuweisung:** `/uber`, `/vorteile`, `/agb`, `/datenschutz` und `/impressum` sind jetzt exklusiv auf der Landing-Domain verfügbar; `/sammelkarten`, `/shop` und `/battle-pass` auf der TCG-Domain; alle Planungsmodule inklusive `/aufgaben` auf der Dashboard-Domain.

## [1.13.5] - 2026-04-16
### Geaendert
- **Native Browser-Bestaetigungen entfernt:** Alle verbleibenden `confirm`/`prompt`-Bestaetigungen im Frontend wurden auf den zentralen Popup-Manager migriert.
- **Admin-Flows vereinheitlicht:** Kritische Aktionen in Admin-Bereichen (u. a. Nutzerverwaltung, Sammelkarten-Admin, Danger Zone, Logs, Global Settings, System Control, Einladungen, Teacher Edit, 2FA-Disable) nutzen jetzt konsistente Modal-Bestaetigungen statt Browser-Dialogs.
- **2FA-Disable modernisiert:** Der Code fuer die Deaktivierung der Zwei-Faktor-Authentisierung wird nun ueber den neuen Prompt-Modal-Flow abgefragt.

## [1.13.4] - 2026-04-16
### Geaendert
- **Popup-Manager gehaertet:** Das System unterstuetzt jetzt async-sichere Aktionen mit Pending-State und Fehleranzeige in Modal- und Banner-Nachrichten.
- **Modal-Queue eingefuehrt:** Es wird immer genau ein Modal gleichzeitig angezeigt (FIFO), wodurch ueberlappende Dialoge vermieden werden.
- **Prompt-Unterstuetzung ergaenzt:** Der zentrale Popup-Manager bietet nun `prompt()` mit einfacher String-Validierung fuer typed confirmations.
- **Kontoloeschung migriert:** Die Profil-Loeschbestaetigung in `src/app/profil/page.tsx` nutzt den neuen Popup-Prompt statt nativer Browser-Eingabe.

## [1.13.3] - 2026-04-16
### Geaendert
- **TCG-Auslagerung gestartet:** Die App bekommt eine eigene `tcg`-Subdomain, damit Sammelkarten und Spielfunktionen getrennt von der Planung laufen können.
- **Klassenbasierte Zielzuordnung:** Login und Registrierung leiten künftig anhand von `class_name` bzw. `access_target` auf dashboard oder tcg.
- **Sammelkarten-Routing:** Kartenrouten werden serverseitig nach tcg umgeleitet; tcg blockt dafür Planungsrouten.
- **Callable CORS erweitert:** `tcg.abi-planer-27.de` ist jetzt für Cloud Functions freigegeben.

## [1.13.2] - 2026-04-16
### Geaendert
- **Modularisierung (Status erweitert):** `src/modules/shared/status.ts` um wiederverwendbare Status-Metadaten für Aufgaben (`Task`) und Karten-Tausch (`Trade`) ergänzt.
- **Aufgaben-Status zentralisiert:** `src/app/aufgaben/page.tsx` und `src/app/aufgaben/[id]/page.tsx` nutzen gemeinsame Task-Status-Helper statt lokaler Switch-Logik.
- **Trade-Status zentralisiert:** `src/app/sammelkarten/tausch/page.tsx` und `src/app/admin/trades/page.tsx` rendern Status-Badges nun aus derselben Trade-Status-Quelle.
- **Deck/Card-Mapping vereinheitlicht:** `src/components/cards/DeckEditor.tsx` und `src/components/modals/DeckSelectionModal.tsx` verwenden das zentrale Mapping aus `src/modules/cards/cardData.ts` sowie gemeinsame Rarity-Badge-Helper.
- **Rarity-Hex global wiederverwendet:** `src/app/sammelkarten/_modules/utils/cardData.ts` bezieht Farbwerte jetzt aus `src/modules/shared/rarity.ts` statt lokaler Duplikate.

## [1.13.1] - 2026-04-16
### Behoben
- **Landing/Dashboard Trennung:** Die Host-Erkennung für das App-Layout wurde korrigiert, damit Landingpages auf `*.localhost` nicht mehr im Dashboard-Layout (Sidebar/Navbar) gerendert werden.
- **Root-Mode Konsistenz:** Die Root-Logik in `src/app/page.tsx` nutzt nun dieselbe strikte Erkennung wie das Layout und behandelt nur echte `dashboard.*`/`app.*` Hosts als Dashboard.

## [1.13.0] - 2026-04-16
### Hinzugefügt
- **Dashboard-Personalisierung:** Nutzer können nun die Reihenfolge der Widgets auf dem Dashboard individuell anpassen und einzelne Widgets (z. B. Finanz-Status, Aufgaben, Abstimmungen) ein- oder ausblenden. Die Einstellungen werden im Profil gespeichert.
- **CustomizeDashboardDialog:** Neues Modal zur intuitiven Verwaltung des Dashboard-Layouts mit Up/Down-Steuerung und Sichtbarkeits-Toggles.

### Behoben
- **Widget-Flackern:** Das "Glitschen" der Widgets beim Laden der Daten wurde durch eine stabilere Sortierlogik im `useDashboardSorting` Hook und den Einsatz von `AnimatePresence` mit `layout`-Animationen (framer-motion) behoben. Sprünge während der Initialisierung werden nun unterdrückt.

## [1.12.37] - 2026-04-16
### Geändert
- **Performance:** Optimierung der Ladevorgänge durch effizientere Firestore-Abfragen.
- **Modularisierung (Fortsetzung):** Zentrale Status-Mappings für Feedback und Todos in `src/modules/shared/status.ts` eingeführt (Labels, Badge-Varianten, Status-Tones) und in zentrale UI-Flows eingebunden.
- **Feedback-Status vereinheitlicht:** `src/components/admin/FeedbackList.tsx` und `src/app/feedback/page.tsx` nutzen dieselbe Status-Metadatenquelle statt doppelter lokaler Switch-Logik.
- **Todo-Status vereinheitlicht:** `src/components/modals/TodoDetailDialog.tsx` und `src/components/dashboard/TodoList.tsx` greifen auf gemeinsame Status-Helper zu, wodurch Anzeige-Logik an einer Stelle gepflegt wird.
- **Technische Bereinigung:** Ungenutzte Imports in bereits migrierten Komponenten entfernt (u. a. DeckGrid, CalendarEvents, PollList, AdminSystemContext, GameBoard) für bessere Wartbarkeit und weniger Lint-Rauschen.

## [1.12.35] - 2026-04-16
### Behoben
- **Landingpage-Zugriff:** Die automatische Weiterleitung von eingeloggten Nutzern von der Landingpage zum Dashboard wurde entfernt. Nutzer können nun die Landingpage jederzeit besuchen, auch wenn sie bereits angemeldet sind. Der Wechsel zum Dashboard erfolgt nun manuell über den Dashboard-Button im Header.

## [1.12.37] - 2026-04-16
### Geaendert
- **Landingpage modernisiert:** Die Root-Landing (`src/app/page.tsx`) wurde klarer und minimalistischer strukturiert, mit serioserer Ansprache fuer Schulen und weiterhin sichtbarem, aber reduzierterem Kartenfokus fuer Schueler.
- **Tonalitaet ueberarbeitet:** Jugendsprachliche Begriffe und starkes Hype-Wording wurden in Hero, CTA, Feature-Bereichen und Karten-Sektion durch modernere, sachlichere Formulierungen ersetzt.
- **Vertrauenskommunikation ergaenzt:** Neue Trust-Indikator-Sektion auf der Landing mit Fokus auf Datenschutz, Struktur fuer Schulen und Beteiligung fuer Schueler.
- **Navigation geschliffen:** `LandingHeader` sprachlich aktualisiert (Funktionen/Karten), Support-Link aus der Hauptnavigation entfernt und CTA auf "Zugang starten" angepasst.
- **Vorteile-Seiten konsistent:** Texte in `src/app/vorteile/page.tsx` und `src/app/vorteile/[feature]/page.tsx` auf denselben modernisierten Stil angepasst.

## [1.12.33] - 2026-04-16
### Geändert
- **Modularisierung (Start):** Einführung eines zentralen Popup-Managers als Hook in `src/modules/popup/usePopupManager.ts` (confirm/alert/notify) auf Basis des bestehenden `SystemMessageContext`.
- **Bestätigungsdialoge vereinheitlicht:** Alle `window.confirm`-Aufrufe im Frontend wurden auf den neuen Popup-Manager migriert (u. a. Decks, Todos, Kalender, Umfragen, News, Finanzen, Feedback, Kampf-Aufgabe, Admin-Session-Reset).
- **UX/Technik:** Confirm-Dialoge sind damit konsistent gestylt, Promise-basiert und zentral wartbar, statt verteilt über native Browser-Prompts.

## [1.12.32] - 2026-04-15
### Hinzugefügt
- **Erweiterte Barrierefreiheit & Themes:** Die Lehrer-Erstellungsseite bietet nun einen "Erleichterte Bedienung"-Modus (standardmäßig aktiv) und einen Theme-Umschalter (Hell/Dunkel).
  - **Standard-Modus:** Die Seite startet nun standardmäßig im hellen Design für maximale Lesbarkeit.
  - **Erleichterte Bedienung:** Wenn dieser Modus aktiv ist, werden alle Erklärungen (HP, KP, Seltenheit etc.) direkt inline angezeigt. Wenn deaktiviert, werden sie platzsparend in anklickbare Informations-Symbole (Popovers) umgewandelt.

## [1.12.31] - 2026-04-15
### Geändert
- **Design-Anpassung Lehrer-Karten:** Das Porträtfoto wird auf der Vorderseite der Karte nun durch ein neutrales Symbol ersetzt und ist ausschließlich auf der Detailseite ("Details") sichtbar. Dies sorgt für ein einheitlicheres Erscheinungsbild der Kartenvorderseiten.

## [1.12.30] - 2026-04-15
### Geändert
- **Barrierefreiheit Lehrer-Erstellung:** Die Seite zur Erstellung von Lehrer-Sammelkarten (`/lehrer/erstellen/`) wurde grundlegend überarbeitet, um sie für alle Altersgruppen (insbesondere ältere Lehrer) zugänglicher zu machen.
  - Einführung einer Schritt-für-Schritt-Führung ("Schritt 1", "Schritt 2", "Abschluss").
  - Hinzufügen von direkt sichtbaren Infoboxen für Spielbegriffe wie **HP/KP** (Lebensenergie/Kraftpunkte), **Seltenheit** und **Attacken/Schaden**.
  - Optimierung der Beschriftungen (Labels) und Hinzufügen von Hilfstexten für Screenreader via `aria-describedby`.
  - Anpassung der Benutzeroberfläche für bessere Lesbarkeit und Bedienbarkeit (größere Klickflächen, klarere Strukturen).

## [1.12.29] - 2026-04-15
### Geändert
- **Bild-Format auf Karten:** Das Seitenverhältnis der Lehrerbilder auf den Sammelkarten wurde von 4:3 auf 2:1 angepasst (ca. 1/3 weniger Höhe), um mehr Platz für Texte und Angriffe zu schaffen und dem Benutzerwunsch nach kleineren Bildern nachzukommen.

## [1.12.28] - 2026-04-15
### Geändert
- **Globale Bild-Formate:** Alle Lehrer-Sammelkarten verwenden nun ein einheitliches 4:3-Seitenverhältnis für das Bildfenster (zuvor 1:1 bzw. 2.2:1). Dies sorgt für eine bessere Kompatibilität mit dem Cropper auf der Erstellungsseite (`/lehrer/erstellen`) und eine authentischere Darstellung.

## [1.12.27] - 2026-04-15
### Behoben
- **Karten-Vorschau:** Fix für abgeschnittene Ränder und Schatten in der Kartenvorschau (z. B. unter `/lehrer/erstellen`). Durch das Entfernen von `overflow-hidden` an den äußeren Aspect-Ratio-Containern in `TeacherCard`, `TeacherSpecCard` und `CardRenderer` werden harte Schatten und dicke Rahmen nicht mehr fälschlicherweise gekappt.

## [1.12.26] - 2026-04-15
### Behoben
- **Umfragen-Exploit:** Nutzer konnten durch wiederholtes Abgeben und Zurückziehen von Stimmen unbegrenzt Booster-Packs farmen. Die Belohnung wird nun pro Umfrage nur noch einmalig gewährt (persistentes Tracking im Nutzerprofil).

## [1.12.25] - 2026-04-15
### Geändert
- **Sammelkarten Admin System:** Vollständige Umstellung auf das neue `CardConfig` Typ-System zur Unterstützung verschiedener Kartentypen (Lehrer, Support, etc.).
    - `TeacherList`, `TeacherListItem` und `TeacherEditDialog` unterstützen nun generische Kartenkonfigurationen.
    - `SammelkartenAdminContext` bietet nun typsichere Funktionen für alle Kartentypen.
### Behoben
- **Build (Type Error):** Fix für `Type 'CardConfig[]' is not assignable to type 'LootTeacher[]'` Fehler auf der Pool-Seite.
- **UI (Import Preview):** Sicherer Zugriff auf HP-Werte in der Import-Vorschau für Nicht-Lehrer-Karten.

## [1.12.24] - 2026-04-15
### Behoben
- **Build (Turbopack):** Behebung von Export-Fehlern (`Export getProposalStatusBadge doesn't exist in target module`) in `src/app/admin/sammelkarten/ideen-labor/page.tsx`.
    - Zirkuläre Abhängigkeiten zwischen `utils.tsx` und der `Badge`-Komponente wurden durch Verschieben der Helferfunktionen direkt in die betroffene Seite aufgelöst.
    - Bereinigung von ungenutzten Importen in `src/lib/utils.tsx`.

## [1.12.23] - 2026-04-14
### Behoben
- **Layout (Sidebar Clipping):** Fix für ein Problem, bei dem zu breite Tabellen in der Admin-Ansicht die gesamte Inhaltskarte nach links in die Seitenleiste verschoben haben. 
    - Durch `min-w-0` in der `AppShell` und explizite Breitenbeschränkungen in den Tabellen-Containern bleibt der Inhalt nun korrekt positioniert und scrollt bei Bedarf innerhalb der Karte.
    - `w-full` für den Inhalts-Wrapper in der `AppShell` sorgt für stabile Zentrierung auch bei breitem Inhalt.

## [1.12.22] - 2026-04-14
### Geändert
- **Admin-Dashboard:** Der Breakpoint für die Benutzerliste und Admin-Logs wurde von `lg` (1024px) auf `xl` (1280px) angehoben. Dies stellt sicher, dass die Liste rechtzeitig in das kompakte Kartenformat wechselt, bevor horizontales Scrollen in der Tabellenansicht erforderlich ist.

## [1.12.20] - 2026-04-14
### Geändert
- **Lehrer-Einladungen:** Die Bestätigungsseite nach der Karteneinreichung wurde personalisiert. Sie zeigt nun eine Dankesnachricht, einen direkten Link zur Anmeldung und Kontaktinformationen für Rückfragen.

## [1.12.19] - 2026-04-14
### Behoben
- **UI (Hydration/DOM Nesting):** Behebung eines kritischen Hydration-Fehlers (`<button> cannot be a descendant of <button>`) in `PopoverTrigger`, `DropdownMenuTrigger` und `DialogTrigger`. 
    - Die Komponenten unterstützen nun das `asChild`-Prop-Pattern durch internes Mapping auf das `render`-Prop von `@base-ui/react`.
    - Dies verhindert ungültige Verschachtelungen, wenn ein `Button` (der selbst ein `<button>` rendert) als Kind übergeben wird.
    - Betrifft insbesondere die QR-Code-Ansicht in der Lehrer-Einladungs-Tabelle.

## [1.12.18] - 2026-04-14
### Geändert
- **Lehrer-Einladungen:** Die Liste der Einladungen im Admin-Bereich wurde komplett überarbeitet und nutzt nun ein kompaktes Tabellen-Layout statt Kacheln. 
- **UI:** Implementierung eines QR-Code-Popovers für schnellen Zugriff ohne Platzverschwendung. Alle Labels und Status-Badges sind nun auch auf kleineren Bildschirmen optimal sichtbar und werden nicht mehr abgeschnitten.

## [1.12.17] - 2026-04-14
### Geändert
- **Admin-Dashboard (Einladungen):** Optimierung der mobilen Benutzeroberfläche für die Verwaltung von Lehrer-Einladungen. Formularelemente und Karten wurden für eine bessere Bedienbarkeit auf Smartphones angepasst (Responsive Layouts, größere Touch-Ziele).

## [1.12.16] - 2026-04-14
### Geändert
- **Admin-Dashboard:** Die Statistiken und der Pack-Simulator in der rechten Seitenleiste wurden für den Tab "Einladungen" entfernt, um mehr Platz für die Verwaltung der Lehrer-Einladungen zu schaffen.

## [1.12.15] - 2026-04-14
### Geändert
- **Lehrer-Kartendesigner:** Der Rechtstext wurde gekürzt und präziser formuliert. Detaillierte Bestimmungen (Rechteeinräumung, Druckfreigabe, Balancing) werden nun explizit auf die Seite `/agb/sammelkarten` ausgelagert, um die Übersichtlichkeit auf Mobilgeräten zu erhöhen.

## [1.12.14] - 2026-04-14
### Geändert
- **Lehrer-Kartendesigner:** Optimierung der mobilen Responsivität für die Seite `/lehrer/erstellen`. Die rechtliche Bestätigung, Header-Elemente und Eingabefelder wurden für kleine Displays angepasst (Mobile-First).
- **UI:** Besseres Layout für die Einreichungs-Bestätigung und den Zuschneide-Dialog auf Smartphones.

## [1.12.13] - 2026-04-14
### Geändert
- **Lehrerbrief:** Der Brief nutzt nun den vollen Namen im Adressfeld (Fenster), aber nur noch die Anrede und den Nachnamen in der persönlichen Grußformel (z.B. "Sehr geehrte Frau Müller").
- **Lehrer-Einladungen:** Das System unterstützt nun Namen mit mehreren Vornamen. Für die persönliche Anrede wird automatisch das letzte Wort als Nachname extrahiert (z.B. "Max Moritz Müller" -> "Sehr geehrter Herr Müller").
- **Kartendesigner:** Die Begrüßung auf der Erstellungsseite wurde professionalisiert und nutzt nun ebenfalls die Anrede und den Nachnamen.

## [1.12.12] - 2026-04-14
### Hinzugefügt
- **Lehrer-Einladungen:** Einführung der Anrede (Herr/Frau) bei der Erstellung von Einladungen.
- **Validierung:** Zwingende Angabe von Vor- und Nachname für eine korrekte Adressierung.
- **UI:** Neuer Button-Toggle zur einfachen Auswahl der Anrede im Admin-Bereich.
- **Lehrerbrief:** Dynamische Grußformel (z.B. "Sehr geehrte Frau ...") basierend auf der gewählten Anrede.

## [1.12.11] - 2026-04-14
### Geändert
- **Branding:** Alle Referenzen auf "HGR Planer" und "hgr-planer.de" im Lehrerbrief wurden durch **"Abi Planer 2027"** und **"abi-planer-27.de"** ersetzt.
- **Lehrerbrief:** Korrektur des Footers und der Absenderzeile zur Sicherstellung der Konsistenz der neuen Domain.

## [1.12.10] - 2026-04-14
### Geändert
- **Lehrer-Einladungen:** Alle generierten Links (QR-Code und Text) verweisen nun auf die öffentliche Domain **https://abi-planer-27.de** statt auf localhost oder eine dashboard-Subdomain.
- **Lehrerbrief:** Der Logo-Pfad in der Druckansicht wurde ebenfalls auf die Hauptdomain fixiert.

## [1.12.09] - 2026-04-14
### Geändert
- **Lehrerbrief:** Entfernung des redundanten Zugangscodes aus der Druckansicht und dem Word-Export (Code bleibt als Teil des direkten Links sichtbar).

## [1.12.08] - 2026-04-14
### Geändert
- **Lehrerbrief:** Aktualisierung des Projektjahres auf **2027**.
- **UI:** Layout-Optimierung im Druck-Design zur Vermeidung von Clipping am unteren Seitenrand.
- **Adressfeld:** Reduzierung der Fensteransicht auf den Namen der Lehrkraft für eine saubere Optik.
- **Validierung:** Bei der Generierung von Einladungen sind nun Vor- und Nachname der Lehrkraft zwingend erforderlich.

## [1.12.07] - 2026-04-14
### Behoben
- **Kartendesigner:** Korrektur eines Syntaxfehlers in der `handleSubmit`-Funktion und Ergänzung fehlender Firebase-Imports (`collection`).

## [1.12.06] - 2026-04-14
### Geändert
- **Lehrerbrief:** Komplettes Redesign für Fensterbrief-Kompatibilität (DIN 5008).
- **Header:** Logo und Projektname stehen nun nebeneinander statt untereinander.
- **UI:** Entfernung von Kacheln/Boxen im Brief-Design für einen klassischeren und professionelleren Look.

## [1.12.06] - 2026-04-14
### Hinzugefügt
- **Kartendesigner:** Lehrer können nun zusätzlich KP/HP und den Schaden ihrer Spezial-Attacken vorschlagen.
- **UI:** Optimierung des Designer-Layouts für HP und Damage-Eingaben.

## [1.12.05] - 2026-04-14
### Behoben
- **Routing:** Rechtliche Seiten (AGB, Datenschutz, Impressum) sind nun auch über die Dashboard-Subdomain erreichbar (Fix für 404 Fehler).
- **Middleware:** Korrektur der Routen-Kategorisierung für das Lehrer-Einladungssystem.

## [1.12.04] - 2026-04-14
### Hinzugefügt
- **Seltenheits-Vorschlag:** Lehrer können nun im Kartendesigner eine gewünschte Seltenheitsstufe für ihre Karte vorschlagen.
- **Rechtliche Ergänzung:** Die AGB und die Bestätigung im Designer wurden um einen Passus zur möglichen Anpassung von Kartendetails (Balancing/Produktion) erweitert.

## [1.12.03] - 2026-04-14
### Geändert
- **Kartendesigner:** Die Vorschau zeigt nun beide Seiten der Karte (Vorderseite & Speccard) über ein Tab-System an.

## [1.12.02] - 2026-04-14
### Hinzugefügt
- **Sammelkarten-AGB:** Einführung einer spezialisierten AGB-Seite für Sammelkarten (`/agb/sammelkarten`).
- **Physische Sammelkarten:** Rechtliche Absicherung für den geplanten Druck und Verkauf physischer Sammelkarten.
  - Einbindung der neuen Klauseln in den Kartendesigner für Lehrer (`/lehrer/erstellen/[token]`).
  - Verlinkung der spezialisierten AGB in den allgemeinen Geschäftsbedingungen.

## [1.12.01] - 2026-04-14
### Behoben
- **TeacherCard:** Fehler bei der `frontOnly`-Darstellung behoben, durch den Karten ohne festes Seitenverhältnis gestreckt wurden.
- **Kartendesigner (Lehrer):** Vorschau-Größe auf Desktop-Geräten optimiert, damit die Karte nicht mehr den ganzen Bildschirm einnimmt.

## [1.12.00] - 2026-04-14
### Hinzugefügt
- **Lehrer-Einladungssystem:** Einführung eines Systems zur offiziellen Aufnahme von Lehrkräften als Sammelkarten.
  - **Brief-Generator (Admin):** Neues Tool im Sammelkarten-Dashboard (`Einladungen`) zum Erstellen personalisierter A4-Briefe für Lehrer.
  - **Exporte:** Unterstützung für den Export der Einladungsbriefe als Word-Datei (.docx) und Direktdruck (inkl. Print-to-PDF) mit Logo und QR-Code.
  - **Kartendesigner (Öffentlich):** Eine öffentliche Seite (`/lehrer/erstellen/[token]`), auf der Lehrer ohne Login ihre Karte gestalten können.
  - **Foto-Upload & Zuschnitt:** Integrierter Bild-Editor für Lehrer zum Hochladen und Zuschneiden von Fotos im 4:3-Format.
  - **Echtzeit-Vorschau:** Interaktive Karten-Vorschau für Lehrer während des Gestaltungsprozesses.
  - **Rechtliche Absicherung:** Integrierte Bestätigung für Namens- und Bildrechte vor der Einreichung.
  - **Review-System (Admin):** Neuer Bereich zur Sichtung und Genehmigung der eingereichten Lehrer-Entwürfe.

## [1.11.28] - 2026-04-14
### Hinzugefügt
- **Community Support (Landingpage):** Einführung einer prominenten Spenden-Option zur Unterstützung des Projekts ohne Login.
  - **Support-Sektion:** Neuer Bereich auf der Landingpage, der die Notwendigkeit von Spenden für Serverkosten und Weiterentwicklung erklärt.
  - **Buy Me a Coffee Integration:** Direkte Verlinkung zum BMC-Profil in der Landing-Sektion und im Header.
  - **Header-Integration:** "Support"-Link mit Kaffee-Icon im Landing-Header für schnellen Zugriff von jeder Position auf der Startseite.

## [1.11.27] - 2026-04-14
### Hinzugefügt
- **Aufgaben Marketplace:** Einführung eines gamifizierten Aufgaben-Systems parallel zu den To-Dos.
  - **Marketplace (`/aufgaben`):** Alle Nutzer können offene Aufgaben (z.B. Aufbau-Hilfe, Fahrdienste) durchstöbern und annehmen.
  - **Aufgaben-Details (`/aufgaben/[id]`):** Anzeige von Komplexität (Lvl 1-10), Belohnungen und bis zu 3 Erklärbildern.
  - **Beweis-Einreichung:** Nutzer können Foto- oder Video-Beweise (max. 30MB) direkt in der App hochladen.
  - **Client-Komprimierung:** Automatische Bildkomprimierung vor dem Upload zur Entlastung der Datenbank.
  - **Admin Prüfung (`/admin/aufgaben`):** Zentrales Dashboard für Admins zur Validierung der Beweise (inkl. Download-Option).
  - **Automatische Löschung:** Zur Kosteneinsparung werden Beweismedien nach der Freigabe automatisch aus dem Storage entfernt.
  - **Helfer-Ranking (`/aufgaben/leaderboard`):** Rangliste der Schüler mit den meisten abgeschlossenen Aufgaben und verdienten Boostern.
  - **Automatischer Reset:** Ein Cronjob setzt abgelehnte Aufgaben nach 7 Tagen automatisch wieder auf "offen", falls keine Nachbesserung erfolgt.
- **Backend:** Neue Cloud Function `adminReviewTask` für sichere Booster-Vergabe und Storage-Cleanup.

## [1.11.26] - 2026-04-14
### Hinzugefügt
- **Analytics Dashboard (Admin):** Erweiterung um drei neue Diagramme für tiefere Einblicke:
  - **Aktivität nach Wochentag:** Visualisierung der Lastverteilung über die Woche.
  - **Karten-Raritäten:** Systemweite Verteilung aller Sammelkarten nach Seltenheit (Iconic bis Common).
  - **Tausch-Status:** Verhältnis von aktiven zu abgeschlossenen Trades.
- **Header-Metriken:** Neue Stat-Cards für News-Einträge und Umfragen-Anzahl.
- **Daten-Anreicherung:** Backend-Update in `buildGlobalStats` zur automatischen Aggregation der Raritätsverteilung aus Nutzerinventaren.
- **Optimierung:** Layout-Anpassungen für eine kompaktere und konsistentere Darstellung der Analyse-Module.

## [1.11.25] - 2026-04-14

### Fixed
- **Feedback Sichtbarkeit:** Öffentliche Meldungen (`is_private != true`) sind nun für alle angemeldeten Nutzer sichtbar, nicht mehr nur für freigegebene (`is_approved`) Accounts.
- **Privatsphäre-Regeln:** Private Feedbacks bleiben weiterhin auf Ersteller sowie Planer/Admins beschränkt; anonyme Anzeige bleibt unverändert.

## [1.11.24] - 2026-04-14

### Added
- **Admin System Analytics:** 3 neue Diagramme hinzugefügt: "Aktivität nach Uhrzeit", "Aktivste Nutzer (Top 10)" und "Session-Dauer Verteilung".
- **Analytics Engine:** Die Datenberechnung wurde auf Client-, API- und Cloud-Functions-Ebene erweitert, um stündliche Aktivitätsmuster, Nutzer-Rankings und Sitzungsdauern präzise zu erfassen.

## [1.11.23] - 2026-04-14

### Refactored
- **Admin System Dashboard:** Das System-Dashboard wurde in Sub-Routen aufgeteilt (`/admin/system`, `/admin/system/analytics`, `/admin/system/control`), um die Wartbarkeit zu erhöhen und die Ladezeiten der einzelnen Sektionen zu optimieren.
- **Shared Components:** Gemeinsam genutzte UI-Komponenten (Charts, StatCards) wurden in `src/components/admin/system/SystemComponents.tsx` ausgelagert.

## [1.11.22] - 2026-04-14

### Changed
- **Maintenance Scope:** Die Wartungssperre wurde auf Dashboard-Subdomains (`dashboard.*`, `app.*`) eingeschränkt. Die Landingpage auf der Hauptdomain (`abi-planer-27.de`) bleibt auch während Wartungsarbeiten für alle Nutzer erreichbar.

## [1.11.21] - 2026-04-14


### Fixed
- **Security Rules:** Fehlende Lese-Berechtigungen für die `admin_tasks`-Collection in `firestore.rules` hinzugefügt, um den `permission-denied`-Fehler beim Tracking der Hintergrund-Analyse zu beheben.

## [1.11.19] - 2026-04-14


### Added
- **Maintenance Planning:** Neuer Button "Planung löschen" im Admin-Panel hinzugefügt, um geplante Wartungsfenster (Start/Ende) mit einem Klick zu entfernen.

## [1.11.20] - 2026-04-14

### Fixed
- **Maintenance Mode Fix:** Kritischen Fehler behoben, bei dem die App für Nutzer gesperrt blieb, obwohl das Admin-Panel "Online" anzeigte.
- **Improved Maintenance UI:** Die System-Steuerung im Admin-Bereich zeigt nun den "effektiven" Status an (berücksichtigt geplante Wartungsfenster).
- **Manual Override:** Admins können geplante Wartungen nun jederzeit manuell über "Wartung beenden" aufheben, wodurch alle Zeitpläne und Flags zuverlässig zurückgesetzt werden.
- **Automatic Expiry:** Wartungspausen enden nun automatisch, sobald der voraussichtliche Endzeitpunkt erreicht ist.
- **State-Sync:** Synchronisierung zwischen globalen Wartungseinstellungen und dem Feature-Toggle (`maintenance_mode`) verbessert.

## [1.11.19] - 2026-04-14

### Fixed
- **Admin:** Doppelte Import-Statements in `FeedbackList.tsx` behoben, die zu Kompilierungsfehlern führten.

## [1.11.18] - 2026-04-14

### Improved
- **Feedback KI-Analyse (UI & Backend):** Der Ladebalken im Analyse-Button ist nun persistent und wird in Echtzeit mit dem Backend-Job synchronisiert. Auch nach dem Verlassen und Zurückkehren auf die Seite bleibt der Fortschritt sichtbar.
- **Task Management:** Einführung einer Task-Tracking-Logik via Firestore (`admin_tasks`), um langlaufende Hintergrund-Jobs sicher zu überwachen.

## [1.11.17] - 2026-04-14

### Fixed
- **Feedback KI-Analyse (Backend):** CORS-Fehler behoben, der den Aufruf der Cloud Function von lokalen Subdomains blockierte. Die Funktion nutzt nun die globalen `CALLABLE_CORS_ORIGINS`.

## [1.11.16] - 2026-04-14

### Improved
- **Feedback KI-Analyse (Backend):** Die Bulk-Analyse wurde in eine asynchrone Cloud Function (`bulkAnalyzeFeedback`) ausgelagert. Admins können den Vorgang nun starten und die Seite verlassen, während die Analyse im Hintergrund mit niedriger Priorität (3s Intervall) abläuft.
- **API-Priorisierung:** Durch die Verlagerung in das Backend werden interaktive API-Anfragen im Frontend nicht mehr durch den Bulk-Analyse-Loop verzögert.
- **UI-Entkoppelung:** Der Analyse-Button im Admin-Dashboard blockiert nun nicht mehr den Thread und zeigt lediglich den Start des Hintergrund-Jobs an.

## [1.11.15] - 2026-04-14

### Improved
- **Feedback KI-Analyse Robustheit:** Implementierung einer automatischen Retry-Logik (bis zu 2 Versuche) bei `429 (Too Many Requests)` Fehlern in der Bulk-Analyse.
- **Throttling:** Erhöhung der Standard-Verzögerung zwischen Analyse-Anfragen auf 1500ms (und 3000ms bei Retries), um Rate-Limits der Groq-API zuverlässiger zu umgehen.

## [1.11.14] - 2026-04-14

### Improved
- **Feedback KI-Analyse Stability:** Einführung eines 800ms Throttlings zwischen API-Anfragen in der Bulk-Analyse, um Rate-Limits (502/429 Fehler) der Groq-API zu verhindern.
- **API Fehlerbehandlung:** Die Analyse-Route gibt nun den tatsächlichen Status-Code der Upstream-KI-Schnittstelle zurück, was das Debugging bei Rate-Limits verbessert.

## [1.11.13] - 2026-04-14

### Improved
- **Feedback KI-Analyse UI:** Der Analyse-Button im Admin-Dashboard fungiert nun selbst als dynamische Fortschrittsanzeige. Der bisherige Spinner wurde durch einen integrierten Ladebalken-Effekt innerhalb des Buttons ersetzt, um ein flüssigeres UI-Feedback zu bieten.

## [1.11.12] - 2026-04-14

### Fixed
- **Feedback KI-Analyse:** Fehler behoben, bei dem unvollständige KI-Antworten zu `undefined`-Werten in Firestore führten (`FirebaseError`).
- **Robustheit:** Einführung von Validierung und Fallback-Werten in der API-Route und den Frontend-Komponenten für die Feedback-Kategorisierung.
- **Fehlerbehandlung:** Bessere Abhandlung von API-Gateways-Fehlern (502) während der Bulk-Analyse.

## [1.11.11] - 2026-04-14


### Improved
- **Admin System Control Center:** Deutliche Erweiterung der Statistiken um "Benutzer gesamt", "Erfolgreiche Trades", "News/Posts" und "Umfragen".
- **Live-Aktivitäts-Graph:** Unterstützung für Umschalten zwischen Aktionen und eindeutigen Nutzern.
- **Aktivitäts-Historie:** Neue Echtzeit-Tabelle mit den aktuellsten Log-Einträgen direkt im Dashboard.

### Changed
- **Admin System Control Center:** Die redundante shortcuts-Sektion (Admin-Bereiche) wurde entfernt, da diese permanent über die Navigationsleiste erreichbar ist.

## [1.11.11] - 2026-04-14

### Improved
- **Feedback KI-Analyse:** Der Analyse-Prompt wurde verfeinert, um eine differenziertere Wichtigkeit (1-10) zu vergeben. Die KI wird nun angewiesen, clumping (Häufung in der Mitte) zu vermeiden und kritischer zu bewerten.
- **Feedback Ranking:** Einführung eines sekundären Sortierkriteriums (Datum) für Einträge mit gleicher Priorität, um ein stabiles und logisches Ranking im Admin-Dashboard zu gewährleisten.
- **Feedback Transparenz:** Die KI-Begründung (`ai_reasoning`) wird nun in der Datenbank gespeichert und auf den Feedback-Karten im Admin-Bereich angezeigt, um Entscheidungen nachvollziehbar zu machen.

## [1.11.10] - 2026-04-14

### Fixed
- Stabilitätsverbesserungen im Bereich der Lehrer-Import-Schnittstelle.

## [1.11.9] - 2026-04-14

### Fixed
- **AppShell:** Fehlendes Import-Statement für `Loader2` hinzugefügt, um `ReferenceError` zu beheben.
- **Stability:** Weitere Stabilitäts-Fixes für das Domänen-Routing und die Initialisierung.

## [1.11.8] - 2026-04-14

### Fixed
- **Stability:** Einführung von Loader-Platzhaltern für `AppShell` und `Dashboard`, um "weiße Seiten" während der Initialisierung zu verhindern.
- **Routing:** Die Middleware-Logik für die Domänen-Trennung wurde robuster gestaltet und unterstützt nun auch `.localhost` für die lokale Entwicklung.
- **Performance:** Die Erkennung der Subdomain in der `AppShell` wurde optimiert, um Layout-Flashes zu vermeiden.
- **UX:** Der Theme-Toggle auf der Landing-Page zeigt nun einen Loader, bis der Theme-Status geladen ist.

## [1.11.7] - 2026-04-14

### Fixed
- **Redirection:** Middleware leitet nun App-Routen von der Hauptdomain auf die Dashboard-Subdomain weiter, statt einen 404 zurückzugeben.
- **Navigation:** Links auf der Landingpage (Header und MainDomainLanding) wurden auf absolute URLs umgestellt, um korrekt auf die Dashboard-Subdomain zu verweisen.
- **Auto-Redirect:** Eingeloggte Nutzer werden nun automatisch von der Landingpage auf die Dashboard-Subdomain weitergeleitet.
- **UI/Hydration:** Behebung von DOM-Nesting-Fehlern in der Benutzerverwaltung und in den Admin-Logs durch Verschieben von `ContextMenuContent` aus `TableCell` heraus.

## [1.11.6] - 2026-04-14

### Fixed
- **UI/Build:** Kritischen Fehler in `src/app/gruppen/page.tsx` behoben, bei dem ein ungültiges `render`-Prop am `ContextMenuTrigger` verwendet wurde.
- **TCG/Combat:** Fehlendes `compact`-Prop in `TeacherSpecCard` hinzugefügt und Styling-Logik implementiert, um TypeScript-Fehler in der Kartenauswahl zu beheben.
- **Combat:** Implizite `any`-Typen in `CombatDebugPanel` behoben.

## [1.11.5] - 2026-04-14

### Fixed
- **Admin:** TypeScript-Fehler in der Planungsgruppen-Verwaltung behoben, der den Build auf Firebase App Hosting blockierte. 
  - Die Typisierung von `leaderUserId` im `onValueChange`-Handler wurde korrigiert, um sicherzustellen, dass immer ein String (auch bei leerer Auswahl) verarbeitet wird.

## [1.11.4] - 2026-04-13

### Fixed
- **Feedback:** Kritischen Fehler behoben, bei dem die Toggles für Anonymität und Privatsphäre keine Auswirkung hatten. 
  - Privatsphäre-Einstellungen werden nun sowohl serverseitig (Firestore Rules) als auch clientseitig zuverlässig erzwungen.
  - Planer sehen private/anonyme Einträge weiterhin, jedoch mit klaren visuellen Indikatoren, um Verwechslungen mit der öffentlichen Ansicht zu vermeiden.
  - Altdaten ohne Privatsphäre-Felder werden nun standardmäßig als öffentlich behandelt (Korrektur der Firestore-Regeln).
  - Fehlerhafte Bild-Referenzen zwischen `AddFeedbackDialog` und `FeedbackPage` vereinheitlicht (`image_url`).
  - Fehlender `updateDoc` Import im `AddFeedbackDialog` behoben.
  - Unterstützung für die automatische Migration von Altdaten bei der KI-Analyse im Admin-Bereich hinzugefügt.

## [1.11.3] - 2026-04-13

### Fixed
- **Hilfe:** Namensextraktion aus der E-Mail für Lehrer-Sammelkarten-Vorschläge verbessert. Die Sortierung erfolgt nun nach "Longest Match", um die betroffenen Lehrer bei Beschwerden zuverlässiger an die oberste Stelle zu setzen.

## [1.11.2] - 2026-04-13

### Added
- **Hilfe:** Untermenü "Lehrer-Beschwerden" hinzugefügt. Lehrer können nun nach E-Mail-Verifizierung Korrekturwünsche oder Löschanträge für ihre Sammelkarten mit höchster Priorität an die Administratoren senden.
- **Admin:** Feedback-Verwaltung um einen speziellen "Lehrer-Anfrage" Badge und Unterstützung für den Typ "Beschwerde" erweitert.

## [1.11.1] - 2026-04-13

### Added
- **Footer:** Globaler "Buy Me a Coffee"-Link hinzugefügt, damit Nutzer den Entwickler einfacher unterstützen können.

## [1.11.0] - 2026-04-13

### Added
- **Chat-Menüs:** Das Chat-Fenster hat nun oben rechts ein Drei-Punkte-Menü (Vertical Ellipsis) für schnellen Zugriff auf Optionen wie "Gruppe verlassen" oder "Nach unten scrollen".
- **Kontext-Menü (Sidebar):** Chats in der Seitenleiste können nun per Rechtsklick (Kontextmenü) verwaltet werden (z.B. "Gruppe verlassen").
- **Feature:** Nutzer können nun Planungsgruppen selbstständig verlassen.

### Changed
- **Hook-Erweiterung:** Der `useGroupJoin`-Hook wurde um die `leaveGroup`-Funktion erweitert.

## [1.10.42] - 2026-04-13

### Fixed
- **Contrast (Gruppen):** Lesbarkeit des aktiven Chats in der Sidebar verbessert. Die Texte verwenden nun `primary-foreground`, um in jedem Theme einen hohen Kontrast zum aktiven Hintergrund zu gewährleisten.

## [1.10.44] - 2026-04-13

### Changed
- **Mobile Experience (Gruppen):** Implementierung eines "Two-Step" Systems für mobile Geräte. Die Chat-Liste und der aktive Chat werden nun jeweils im Vollbild angezeigt, um die Bedienbarkeit auf kleinen Displays zu maximieren.
- **UI Polishing:** Überarbeitung der Sidebar-Header und Card-Toleranzen. Die Abstände und Radien (md:rounded-3xl) wurden für ein moderneres, luftigeres Design optimiert.
- **ABI Bot:** Redundante Status-Anzeigen im Chat-Verlauf entfernt. Der Bot-Status ("Suche...") erscheint nun nur noch während der aktiven Generierung am Ende des Chats.

## [1.10.43] - 2026-04-13

### Fixed
- **UI (Gruppen):** Layout-Optimierung der Gruppenseite für bessere Skalierbarkeit.
- **Sidebar:** Der Header (Gruppe wählen + Beitreten) ist nun flexibler und bricht bei Platzmangel sauber um.
- **Chat Wall:** Die Höhe der Chat-Pinnwand ist nun viewport-abhängig statt fixiert (h-[calc(100vh-280px)]).
- **Footer:** Die Chat-Eingabe und Buttons sind kompakter gestaltet, um Platz auf kleineren Displays zu sparen.
- **Grid:** Rebalancing der Spaltenverteilung (xl:col-span-3/9) für mehr Platz im Hauptchat auf breiten Bildschirmen.

## [1.10.42] - 2026-04-13

### Fixed
- **UI-Verbesserung (ABI Bot):** Ein Anzeigefehler im Chat wurde behoben, bei dem Status-Meldungen des Bots ("Suche in Hilfe & FAQ") fälschlicherweise redundant am oberen Rand des Chatfensters erschienen. Diese Meldungen werden nun nur noch am unteren Ende des Chats (im aktuellen Kontext) angezeigt.

## [1.10.41] - 2026-04-13

### Fixed
- **UI (Base UI):** Der React-Warnhinweis "A component is changing the uncontrolled value state of Select to be controlled" wurde behoben. Die `Select`-Komponente in `src/app/gruppen/page.tsx` und `src/app/admin/global-settings/page.tsx` wird nun von Anfang an korrekt kontrolliert (mit einem definierten String-Wert statt `undefined`), um Zustandswechsel-Konflikte zu vermeiden.

## [1.10.40] - 2026-04-13

### Fixed
- **UI-Verbesserung (Admin):** In der Verwaltung der Planungsgruppen werden nun korrekt die Namen der Gruppenleiter (statt deren IDs) in der Auswahl angezeigt.

## [1.10.39] - 2026-04-13

### Fixed
- **Parsing-Fehler:** Der Syntax-Fehler (Parsing ecmascript source code failed) in `src/app/sammelkarten/tausch/page.tsx` wurde endgültig behoben. Die Klammersetzung im `activeTrades.map`-Block wurde korrigiert, um den JSX-Ausdruck und die Arrow-Function sauber zu schließen.

## [1.10.38] - 2026-04-13

### Fixed
- **Rendering-Fehler:** Ein Syntax-Fehler in der Trading-Liste wurde behoben, der durch die Deaktivierung abgelaufener Trades entstanden war.

## [1.10.37] - 2026-04-13

### Changed
- **Deaktivierung abgelaufener Trades:** Abgelaufene Tauschgeschäfte werden nun in der Liste ausgegraut und können nicht mehr geöffnet werden. Falls ein Tausch während der Ansicht abläuft, werden alle Interaktionsmöglichkeiten (Annehmen/Gegenangebot) gesperrt und ein entsprechender Hinweis angezeigt.

## [1.10.36] - 2026-04-13

### Added
- **Visual Countdown:** Der 48-Stunden-Countdown ist nun für jeden Tausch im Trading-Hub und im Verhandlungs-Modal sichtbar. Ein rotes Pulsieren warnt, wenn weniger als 6 Stunden verbleiben.

## [1.10.35] - 2026-04-13

### Added
- **Handels-Zeitlimit:** Tausche haben nun ein Zeitlimit von **48 Stunden pro Zug**. Wenn ein Partner nicht innerhalb von 48 Stunden reagiert, verfällt der Tausch automatisch (Status: Abgelaufen).
- **Auto-Cleanup:** Ein stündlicher Cron-Job prüft nun das System auf abgelaufene Tauschgeschäfte und markiert diese.

### Fixed
- **Trading Security:** Alle Tausch-Aktionen (Annehmen, Ablehnen, Counter) prüfen nun serverseitig auf das Zeitlimit.
- **Verhandlungs-Logik:** Ein Fehler wurde behoben, durch den die Verhandlungsrunden bei Gegenangeboten nicht korrekt gezählt wurden. Die maximale Anzahl der Runden wurde auf 3 erhöht.

## [1.10.34] - 2026-04-13

### Changed
- **Branding:** Das "Tausch-Zentrum" wurde in **Trading-Hub** umbenannt.

### Fixed
- **Berechtigungen (Trading):** Administratoren können den Trading-Hub nun auch dann betreten und nutzen, wenn das System im Control Center auf "Admins Only" eingestellt ist (bisher wurden Admins fälschlicherweise ebenfalls nach `/sammelkarten` umgeleitet).

## [1.10.33] - 2026-04-13
+
+### Fixed
+- **10er Pack Sichtbarkeit:** Der Button zum Öffnen von 10 Packs wird nun korrekt nur dann angezeigt, wenn mindestens 10 Booster *des aktuell ausgewählten Typs* vorhanden sind (statt der Summe aller Booster-Typen).
+
 ## [1.10.32] - 2026-04-13

+
+### Added
+- **10er Pack Animation:** Ein neues Bestätigungsmodal beim Öffnen von 10er Packs erlaubt es nun, eine hochwertige Aufreiß-Animation zuzuschalten.
+- **Sequentielles Aufreißen:** Bei aktivierter Animation werden alle 10 Packs nacheinander automatisch aufgerissen, was den Prozess immersiver macht.
+- **30-Karten Reveal:** Alle 30 Karten (aus 10 Packs) werden nun verdeckt präsentiert und können einzeln (oder via Leertaste) umgedreht werden, um die Spannung zu erhöhen.
+
+### Fixed
+- **Hook Dependencies:** Fehlende Abhängigkeiten in den Sammelkarten-Hooks behoben, um stabile React-Re-Renders zu gewährleisten.
+- **Keyboard Support:** Die Leertaste unterstützt nun auch das sequentielle Umdrehen aller 30 Karten im Massen-Modus.
+
 ## [1.10.31] - 2026-04-13
### Fixed
- **Iconic Card Background:** Der rotierende Sunburst-Hintergrund bei Ikonen-Karten wurde massiv vergrößert, sodass bei der Rotation keine "abgeschnittenen" Ränder mehr an den Ecken sichtbar sind.
- **Deck Cover Selection:** Bei der Wahl eines Deck-Covers werden nun ausschließlich Karten angezeigt, die bereits Teil des aktuellen 10er-Teams sind. Dies verhindert Inkonsistenzen zwischen Cover und Deck-Inhalt.

## [1.10.30] - 2026-04-13

### Fixed
- **Syntax Error (PackOpeningStage):** Korrumpierter Code in `PackOpeningStage.tsx` bereinigt, der die gesamte Karten-Öffnen-Ansicht blockiert hat.

## [1.10.29] - 2026-04-13

### Fixed
- **Syntax Error (FooterActions):** Korrumpierter Code in `SammelkartenFooterActions.tsx` bereinigt, der einen `Unterminated string constant` Fehler verursachte.

## [1.10.28] - 2026-04-13

### Fixed
- **ReferenceError (DeckEditor):** Fehlender Import für `GraduationCap` Icon behoben.

## [1.10.27] - 2026-04-13

### Added
- **Dedicated Cover Slot:** Im Deck-Editor gibt es nun einen separaten Spot für die Cover-Wahl am Anfang der Liste. Die dort gewählte Karte wird automatisch als Cover (`coverCardId`) gesetzt und mit den 10 Team-Karten synchronisiert.
- **SpecCard Selection:** In der Deck-Kartenauswahl werden nun standardmäßig die detaillierten `TeacherSpecCard`-Komponenten (inkl. HP und Attacken) angezeigt, um die taktische Zusammenstellung zu erleichtern.
- **Selection Sorting:** Die Kartenauswahl sortiert nun automatisch nach Seltenheit (Iconic > Legendary > ...) und Variante, sodass die "SpecCards" immer zuerst erscheinen.

### Fixed
- **Deck Controls Visibility:** Die Bearbeitungs-Buttons ("Aus Deck entfernen") auf den Karten im Deck-Editor sind nun auf allen Geräten dauerhaft sichtbar und nicht mehr an einen Hover-Status gebunden.
- **Selection Grid:** Optimierung des Grids in der Kartenauswahl für die detaillierte Spec-Ansicht (größere Karten, weniger Spalten für bessere Lesbarkeit auf Mobile).

## [1.10.26] - 2026-04-13

### Added

- **KI-Feedback-Sortierung:** Alle Feedback-Einträge im Admin-Bereich können nun KI-gestützt sortiert werden.
- **Bulk KI-Analyse:** Ein neuer Button in der Admin-Feedback-Liste ermöglicht die nachträgliche Analyse aller (auch alter) Einträge, um Prio- und Kategoriedaten zu vervollständigen.
- **Automatisierte Analyse:** Der Feedback-Dialog (`AddFeedbackDialog`) führt nun direkt nach dem Absenden eine Hintergrund-Analyse via KI durch, um eine konsistente Prio-Sortierung zu gewährleisten.
- **Logging:** Die Bulk-KI-Analyse wird nun revisionssicher im System-Log protokolliert.

## [1.10.25] - 2026-04-13

### Changed

- **Domain-Trennung (Domain Separation):** Striktes Routing zwischen Hauptdomain (`abi-planer-27.de`) und Dashboard-Subdomain (`dashboard.abi-planer-27.de`) via Next.js Middleware implementiert.
- **Routen-Sicherheit:** Alle App-spezifischen Routen (Dashboard, Sammelkarten, Finanzen, Login, etc.) sind nun ausschließlich über die Dashboard-Subdomain erreichbar. Landing-Page-Inhalte (AGB, Impressum, etc.) sind auf die Hauptdomain beschränkt.
- **Cross-Domain Navigation:** Verlinkungen im Header und Footer wurden auf absolute URLs umgestellt, um einen reibungslosen Übergang zwischen Informational-Content und App-Funktionen zu gewährleisten.
- **Fehlerbehandlung:** Unberechtigte Zugriffe auf domain-fremde Routen werden nun mit einem sauberen 404-Statuscode quittiert, um die Trennung auch auf Suchmaschinenebene zu forcieren.

## [1.10.24] - 2026-04-12

### IMPORTANT - DEPLOYMENT REQUIRED

️ **Diese Version erfordert ein Cloud Functions Deployment!**

```bash
cd functions && npm run build && npm run deploy
```

Ohne Deployment funktionieren Kartenmischung und aktive Match-Umleitung nicht.

### Added

- **Combat Initial Card Selection UI:** Neue Komponente erlaubt Spielern, ihre Startkarte zu wählen. (Backend-Cloud-Function: `selectInitialCard`)
- **Combat Debug Panel:** Automatische Console-Logs zeigen Kartenzustand und Shuffle-Status mit `[COMBAT DEBUG]` Logger.

### Changed

- **All Combat Match Creation:** Shuffle-Logik implementiert in:
  - matchmaking (`onQueueJoin`) 
  - AI matches (`startAiMatch`)
  - Friend matches (`createFriendMatch`)
  - Code-based matches (`createMatchWithCode`, `joinMatchByCode`, `joinMatchById`)

- **Active Match Detection Logging:** Bessere Debug-Ausgaben zeigen Match-Status und redirects.

### Fixed

- **Active Match Detection Listener:** Fixed nested Firestore listeners - jetzt zwei parallele Queries (playerA / playerB) statt nested.

---

## Debugging-Guide

Wenn Kartenmischung/Umleitung nicht funktioniert:

1. **Open DevTools Console** (F12)
2. **Start a new match**
3. **Look for `[COMBAT DEBUG]`** group in console
4. **Check "Card sequence"** - sollte NICHT in Reihenfolge sein
5. Wenn leer → **Karten wurden in Firestore nicht richtig gespeichert**

## [1.10.23] - 2026-04-12

### Changed

- **Combat All Matches Deck Shuffling:** Alle Match-Typen (Matchmaking, AI, Friend, Code-based) verwenden jetzt Fisher-Yates Shuffle für 10er-Decks. Karten werden random verteilt auf activeCard, bench (3), und reserve (6). Macht Spiel fairer und weniger vorhersehbar.

### Added

- **Backend Support für Initial Card Selection:** Neue Cloud Function `selectInitialCard` erlaubt Spielern, ihre Startkarte selbst zu wählen (statt immer die erste zu nutzen). Ready für Frontend-Integration.

### Fixed

- **Active Match Detection Listener Leak:** Fixed nested Firestore listeners die verhindert haben dass Redirect funktioniert. Jetzt läuft automat Redirect stabil zu aktiver Runde.

## [1.10.22] - 2026-04-12

### Fixed

- **Combat Cleanup Dev Logging:** In lokalen Dev-Umgebungen zeigt Cleanup jetzt nur Warnings statt Errors an, wenn Production Cloud Functions nicht erreichbar sind (das Fallback-System funktioniert normal). Reduziert Noise in der Browser Console.

## [1.10.21] - 2026-04-12

### Fixed

- **Combat Active Round Redirect:** Wenn ein Spieler noch in einer aktiven Runde (`status === 'active'`) ist und zu `/sammelkarten/kaempfe` navigiert, wird er jetzt automatisch zur laufenden Runde umgeleitet.
- **Combat 3-Knockout Win Condition:** Zusätzliche Robustheit für die 3-Punkte-Gewinn-Bedingung mit expliziter Konsistenzbprüfung und erweiterten Logging. Match endet garantiert, wenn ein Spieler 3 Knockouts erreicht.

## [1.10.20] - 2026-04-12

### Fixed

- **Combat Friend Avatar Typing:** Die Freundesliste im Kampf nutzt für das Profilbild jetzt einen defensiven Zugriff auf `photo_url`, damit der Next.js-TypeScript-Build nicht mehr an der Profilanzeige scheitert.
- **Combat Cleanup Degradation:** `endMyOpenMatches` fällt jetzt nach Proxy- und Callable-Fehlern auf eine lokale Queue-Bereinigung zurück, damit die Kampfseite in der lokalen Entwicklung nicht mehr an einem fehlenden Cloud-Function-Endpunkt hängen bleibt.

## [1.10.19] - 2026-04-12

### Fixed

- **Combat Win Condition:** Ein Match endet bei KOs jetzt konsistent über Punkte; bei leerem Deck entscheidet nicht mehr automatisch der letzte Angriff.
- **Combat Visibility:** Die aktuelle Attacke und ihr Schaden werden in der zentralen Kampfansage für beide Seiten klarer angezeigt.
- **Deck Persistenz:** Die gewählte Deck-ID bleibt jetzt pro Nutzer auch nach Reload als Standard erhalten.
- **Cleanup Fallback:** `endMyOpenMatches` fällt in Dev nach einem Proxy-Fehler wieder auf die Callable-Variante zurück.
- **Combat Match Page Typing:** `useSammelkartenConfig` gibt den Combat-Feature-Schalter jetzt explizit typisiert zurück, damit die Match-Seite sauber durch den TypeScript-Build kommt.

## [1.10.18] - 2026-04-12
### Changed

- **Combat Wide-Screen Scaling:** Die Kampfansicht unter `/sammelkarten/kaempfe` skaliert auf großen Bildschirmen nun stärker mit.

    - **HUD und Rundenanzeige:** Top-Bar, Log-Button und Turn-Indikator wachsen auf großen Viewports mit.
    - **Kartenlayout:** Aktive Karten, Bench-Karten und Reserve-Stacks erhalten auf `xl`/`2xl` mehr Breite.
    - **Overlay-Präsenz:** Fokus-Overlay und Kampflog nutzen auf Wide Screens etwas mehr Platz, ohne Mobile zu beeinflussen.


## [1.10.17] - 2026-04-12
### Added
- **Adaptive KI-Lernen:** Der KI-Gegner wertet nun global und anonymisiert Matchdaten aus, um stärkere Decks und sinnvollere Attacken zu bevorzugen.
    - **Deck-Lernen:** AI-Decks werden aus mehreren Kandidaten nach bisherigen Erfolgswerten und Karten-Synergien ausgewählt.
    - **Attacken-Lernen:** Angriffsauswahl berücksichtigt jetzt historische Winrates, Schaden und die Spielsituation.

### Changed
- **ELO-Difficulty Scaling:** Die KI spielt je nach ELO spürbar unterschiedlich aggressiv, flexibel und vorhersehbar, statt nur an harten Schwellen zu hängen.
- **Post-Match Learning:** Abgeschlossene AI-Matches schreiben jetzt aggregierte Karten-, Deck- und Attackenwerte fort, ohne personenbezogene Profile anzulegen.

## [1.10.17] - 2026-04-12

### Fixed

- **Local Dev Combat Cleanup:** `endMyOpenMatches` now uses a same-origin Next.js proxy in development, so the Kaempfe page no longer depends on browser-side cross-origin callable traffic when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` is disabled.
- **Auth Forwarding:** The proxy forwards the current Firebase ID token server-side before relaying to Cloud Functions, preserving the existing cleanup behavior without changing production callable endpoints.

## [1.10.16] - 2026-04-12
### Fixed
- **Stuck-Round Cleanup:** Neue Callable `endMyOpenMatches` beendet alle offenen Matches des aktuellen Nutzers (`active` und `waiting_for_opponent`) und löscht verwaiste Queue-Einträge.
- **Auto Cleanup beim Kampfstart:** Die Kampf-Lobby bereinigt offene Alt-Runden automatisch beim Öffnen und vor dem Start neuer Runden (PvP/PvE/Freund/Code).
- **30-Minuten Match-Limit:** Aktive Matches enden jetzt spätestens nach 30 Minuten automatisch.
    - **Entscheidung:** Spieler mit mehr Punkten gewinnt.
    - **Gleichstand:** Match endet als Unentschieden (`winner = null`).
- **Unentschieden UI:** Endscreen im Kampf zeigt bei `winner = null` nun korrekt `UNENTSCHIEDEN` statt Niederlage.

## [1.10.15] - 2026-04-12
### Added
- **Kampflog im Sammelkarten-Menü:** Unter `Sammelkarten` wurde ein neuer Unterpunkt `Kampflog` als letzter Eintrag ergänzt.
- **Kampfhistorie-Seite:** Neue Seite unter `/sammelkarten/kaempfe/log` zeigt alle beendeten Kämpfe des eingeloggten Spielers.
    - **Direkte Detailnavigation:** Klick auf einen Log-Eintrag öffnet die passende Kampf-Detailseite (`/sammelkarten/kaempfe/{matchId}`).
    - **Resultat-Badges:** Einträge zeigen Modus sowie Ergebnis (`Sieg`, `Niederlage`, `Unentschieden`).

### Changed
- **Firestore Indexes (Matches):** Composite-Indizes für Kampf-Historienabfragen nach `playerA_uid`/`playerB_uid` + `status` + `createdAt` wurden hinzugefügt.

### Fixed
- **KI Namensanzeige im Kampf:** Die Gegner-Perspektive im `GameBoard` wurde gegen Auth-Race-Conditions abgesichert, damit bei KI-Matches nicht mehr versehentlich der eigene Name als Gegner erscheint.
- **KI Name Fallback:** Falls alte/inkonsistente Matchdaten keinen gueltigen `ki-vorname` enthalten, wird jetzt ein stabiler `ki-vorname` aus der Match-ID abgeleitet (pro Match konstant, inkl. optionalem ELO-Suffix).
- **KI Start ohne Dev-Fallback:** Der stille Redirect auf Test-Matches wurde entfernt. Bei Startfehlern zeigt die UI nun eine klare Fehlermeldung statt auf nicht-persistente Testpfade zu wechseln.

## [1.10.14] - 2026-04-12
### Changed
- **KI Gegnername (stabil pro Match):** Beim Start eines KI-Kampfes wird jetzt serverseitig ein zufaelliger Vorname erzeugt und im Match gespeichert.
    - **Format:** Immer mit Praefix `ki-` (z. B. `ki-tom`, `ki-mike`).
    - **Custom ELO:** Bei Custom-KI bleibt die ELO sichtbar (`ki-vorname (ELO X)`).
    - **Reload-Stabilitaet:** Der Name bleibt beim Aktualisieren der Seite unveraendert, da keine clientseitige Neugenerierung erfolgt.
- **Combat Turn UI (Detailview):** Gegnerzug-Verhalten bleibt konsistent: Karten werden nicht turn-basiert ausgegraut, nur Aktionsbuttons in der Detailansicht sind bei `!isMyTurn` deaktiviert.

## [1.10.13] - 2026-04-12
### Fixed
- **Combat Top HUD Layout:** Oberes HUD wurde in eine zweizeilige, responsive Struktur umgebaut, damit Punkte-Leisten, Menü/Log-Buttons und Rundenanzeige auf kleinen Breiten nicht mehr überlappen.
- **Invalid Attack Guard:** Angriffsbuttons im Fokus-Overlay verwenden jetzt ausschließlich die Angriffe der aktuell aktiven Server-Karte.
    - **Index Validation:** Client prüft `attackIndex` vor dem Callable-Aufruf.
    - **Stale Focus Protection:** Angriffsauswahl wird nur angezeigt, wenn die Fokuskarte mit der aktuellen aktiven Karte übereinstimmt.

## [1.10.12] - 2026-04-12
### Changed
- **Switch Cost Rework:** Normales Einwechseln vergibt keine Gegnerpunkte mehr. Stattdessen wird dem wechselnden Spieler 1 eigener Punkt abgezogen.
- **No-Point Guard:** Ein normales Einwechseln ist jetzt gesperrt, wenn der Spieler 0 Punkte hat.
- **UI Copy/State:** Switch-Button zeigt jetzt `Einwechseln (-1 Punkt)` bzw. `Kein Wechsel (0 Punkte)` und deaktiviert sich korrekt.

## [1.10.11] - 2026-04-12
### Changed
- **Combat Button Copy:** Der Switch-Button im Fokus-Overlay wurde gekürzt auf `Einwechseln (+1 Gegner)`, damit die Beschriftung auf kleineren Viewports sauber passt.

## [1.10.11] - 2026-04-12
### Fixed
- **Mobile Combat Baseline (320px):** Kernbereiche der Kampf-UI wurden für kleine Displays stabilisiert, damit keine kritischen Layout-Brüche mehr auftreten und Aktionen zuverlässig bedienbar bleiben.
    - **GameBoard Topbar:** Obere Leiste und Kontrollbuttons sind jetzt responsiv skaliert; zentrale Rundenanzeige nutzt auf kleinen Screens kompaktere Abstände und Schrift.
    - **Touch Targets:** Primäre Rundungs-/Log-/Menü-Buttons im Kampf wurden auf mobile-taugliche Größen angehoben.
    - **Action Log Panel:** Kampflog nutzt jetzt eine viewport-basierte Breite mit mobilen Offsets statt starrem Desktop-Fokus, wodurch Überlagerungen auf schmalen Geräten reduziert werden.
    - **Board Positioning:** Spieler-/Gegnerbereiche wurden für schmale Viewports enger und stabiler positioniert (rechts/links/bottom/top samt Spacing).
- **Combat Lobby Mobile Layout:** Die Kampf-Lobby (`/sammelkarten/kaempfe`) wurde für 320px entzerrt.
    - **Responsive Typography:** Große Überschriften und Countdown-Texte skalieren nun stufenweise (`sm:`), damit Inhalte nicht aus dem Viewport laufen.
    - **Card/Button Sizing:** Auswahlkarten und CTA-Elemente (PvP/PvE/Ready) haben reduzierte Mobile-Paddings und kleinere Typo-Stufen.
    - **Queue Table Overflow:** Warteschlangen-Tabelle wurde mit horizontalem Overflow-Container und mobilen Zellbreiten/Paddings abgesichert.
- **Support Dice Overlay Responsive:** Das Würfel-Overlay wurde für Mobile verkleinert und skaliert jetzt über CSS-Variablen statt fester `128px`-Geometrie.
    - **Dice 3D Geometry:** `translateZ` ist nun an die aktuelle Würfelgröße gebunden.
    - **Overlay Spacing:** Header/Content/Footer paddings und Result-Typografie sind mobilfreundlich abgestuft.

## [1.10.10] - 2026-04-12
### Changed
- **Switch Penalty Rule:** Normales Einwechseln (ohne Kartenfähigkeit/`freeSwitch`) gibt jetzt dem Gegner direkt einen Punkt.
- **Points HUD Source:** Die Punkteanzeige im Kampf nutzt jetzt explizit `player.points` (mit Legacy-Fallback), damit Switch-Strafpunkte korrekt sichtbar sind.
- **Win Condition Alignment:** Der Match-Sieg bleibt bei 3 Punkten, jetzt konsistent aus K.O.-Punkten plus Switch-Strafpunkten.

## [1.10.9] - 2026-04-12
### Changed
- **Combat Handcards Hover Behavior:** Handkarten auf der Bank vergrößern sich beim Hover jetzt nur noch minimal (subtiler Preview-Effekt statt starker Zoom).
- **Switch Costs Turn:** Normales Einwechseln kostet jetzt einen Punkt/Zug (Turn wird an den Gegner übergeben). Die Logik bleibt vorbereitet für spätere Gratis-Wechsel über Karteneffekte (`freeSwitch`).

### Removed
- **Combat Layout Option:** Die experimentelle "Layout"-Option wurde aus der Kampf-Auswahl entfernt.
    - **UI Cleanup:** Kampfauswahl zeigt nur noch die produktiven Optionen (Spieler/PvE).
    - **Code Cleanup:** `LayoutExperiment` wurde vollständig entfernt.

### Fixed
- **KO Replacement Flow:** Nach dem Verlust der aktiven Karte muss jetzt manuell eine Handkarte als Ersatz gewählt werden.
- **Draw After Replacement:** Nach erfolgreicher Ersatzwahl wird automatisch eine Karte aus dem Stapel (`reserve`) in die Hand (`bench`) nachgezogen.

## [1.10.8] - 2026-04-12
### Changed
- **Combat Handcards Hover Behavior:** Handkarten auf der Bank vergrößern sich beim Hover jetzt nur noch minimal (subtiler Preview-Effekt statt starker Zoom).
- **Detailview Interaction:** Klick auf Handkarten bleibt konsequent eine reine Detailansicht (Karte ansehen), ohne direkte Kampfaktion.

## [1.10.7] - 2026-04-12
### Fixed
- **Combat Handcards Radius:** Handkarten im Kampf haben nun einen kompakteren Eckenradius, damit kleine Karten nicht mehr zu rund wirken.
- **SpecCard Foil Layer in Combat:** `TeacherSpecCard` rendert im Kampf jetzt immer einen sichtbaren Foil-Layer (auch bei `normal`-Variante), damit Effektfolien auf Handkarten zuverlässig erkennbar sind.
    - **Compact Radius Token:** Handkarten setzen explizit `--card-radius:0.9cqw`.
    - **Forced Combat Overlay:** `CardEffectOverlay` unterstützt eine Combat-Force-Variante mit subtiler Shimmer-Folie für normale Karten.

## [1.10.6] - 2026-04-12
### Fixed
- **Combat Card Scaling Consistency:** Kartengrößen im Kampf werden nun responsiv über Breitenklassen statt globaler `scale`-Transforms gesteuert. Dadurch skaliert der `cqw`-basierte Eckenradius wieder proportional zur tatsächlichen Kartengröße.
- **Combat Foil Visibility:** Effektfolien (`holo`, `shiny`, `black_shiny_holo`, `iconic`) sind im dunklen Kampf-Layout wieder deutlich sichtbar.
    - **Combat Context Rendering:** `TeacherSpecCard` gibt nun einen expliziten Combat-Kontext an den Overlay-Layer weiter.
    - **Dark Board Blend Tuning:** `CardEffectOverlay` nutzt im Kampf angepasste Blend-/Opacity-Profile für bessere Sichtbarkeit auf `bg-neutral-950`.
    - **Coverage Across Views:** Die Anpassung gilt für aktive Karte, Bankkarten und Fokus-Overlay.

## [1.10.5] - 2026-04-12
### Changed
- **Balanced Card Aesthetics:** Der Eckenradius wurde für eine bessere Balance leicht erhöht (`1.4cqw` / `rounded-xl`). Dies orientiert sich besser an den internen Elementen und Texten der Karten.
- **Ultra-Vivid Foil Effects:** Die Folien-Effekte (Holo, Shiny, Black Shiny) wurden massiv verstärkt. Höhere Deckkraft, schnellere Animationen und intensivere Glanzeffekte sorgen dafür, dass die Seltenheit der Karten deutlich spürbar ist.