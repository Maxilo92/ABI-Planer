<!-- AGENT_NAV_METADATA -->
<!-- path: CHANGELOG.md -->
<!-- role: reference -->
<!-- read_mode: latest-first -->
<!-- token_hint: tail-only -->
<!-- default_action: read newest entries only unless a regression requires older history -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

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
