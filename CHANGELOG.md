<!-- AGENT_NAV_METADATA -->
<!-- path: CHANGELOG.md -->
<!-- role: reference -->
<!-- read_mode: latest-first -->
<!-- token_hint: tail-only -->
<!-- default_action: read newest entries only unless a regression requires older history -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

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
### Geändert
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

⚠️ **Diese Version erfordert ein Cloud Functions Deployment!**

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
- **Combat Hover Polish:** Hover auf Handkarten ist jetzt ein ruhiger, kleiner Standard-Hover ohne springenden Bounce-Effekt.
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

## [1.10.4] - 2026-04-12
### Changed
- **Interaktionsschutz (Handkarten):** Das Anklicken einer Handkarte (Bank) ist nun rein informativ und führt niemals direkt zu einem Wechsel.
    - **Separater Aktions-Button:** Die Aktion "Einwechseln" wurde aus der Kartenansicht in einen separaten Button unterhalb der Karte im Focus-Overlay verschoben.
    - **Read-Only Kartenansicht:** Bankkarten zeigen im Overlay nun ihre Angriffe statisch an, damit man sie vor dem Einwechseln in Ruhe prüfen kann, ohne dass ein Klick auf die Karte den Wechsel auslöst.

## [1.10.3] - 2026-04-12
### Changed
- **TCG Card Aesthetics:** Der Eckenradius der Sammelkarten wurde reduziert (`2.2cqw` -> `0.8cqw` / `rounded-xl` -> `rounded-lg`), um einen realistischeren und weniger "runden" TCG-Look zu erzielen.
- **Combat Foil Integration:** Im Kampfmodus werden nun automatisch die seltensten Folien-Varianten (Holo, Shiny, Black Shiny) angezeigt, die ein Spieler für die jeweilige Karte besitzt. Dies gilt sowohl für den eigenen Spieler als auch für den Gegner.

## [1.10.3] - 2026-04-12
### Changed
- **Combat Turn Optimization (Handkarten):** Ein Klick auf eine Handkarte (Bank) gilt nun nicht mehr automatisch als beendeter Zug.
    - **Focus Overlay for Bench:** Das Anklicken einer Karte auf der Bank öffnet nun zuerst eine vergrößerte Detailansicht, anstatt sofort den Wechsel zu erzwingen.
    - **Free Switch Action:** Der Wechsel der aktiven Karte (Switch) wurde zu einer "freien Aktion" herabgestuft. Das bedeutet, man kann nun einwechseln und im selben Zug noch angreifen.
    - **AI Adaptation:** Auch der KI-Gegner kann nun die neue Mechanik nutzen und nach einem Wechsel direkt angreifen.

## [1.10.2] - 2026-04-12
### Changed
- **Visual Consistency (Album Sync):** Die Darstellung der Karten im Kampf wurde exakt an das Lehrer-Album angepasst.
    - **Full Data Sync:** `adaptToCardData` nutzt nun die zentrale `cardRegistry`, um fehlende Metadaten (Farben, Kartennummern) zu ergänzen.
    - **Static HP Display:** Handkarten und die aktive Karte des Gegners zeigen nun ihre ursprünglichen Max-HP an (wie im Album), während der aktuelle Schaden über die separaten HP-Balken getrackt wird.
    - **Clean UI:** Redundante Schlagschatten (`shadow-2xl`) wurden entfernt, da die Karten bereits einen integrierten Hard-Shadow besitzen.
    - **Interaction Fix:** Die eigenen Handkarten sind nun wieder klickbar und haben einen verbesserten Hover-Zustand.

## [1.10.1] - 2026-04-12
### Fixed
- **Combat Card Layout Refinement:** Umfassende Korrekturen am visuellen Erscheinungsbild der Karten im Kampf.
    - **Corner Radius:** Der Eckenradius wurde von 3.5cqw auf 2.2cqw reduziert, um einen realistischeren und schärferen TCG-Look zu erzielen.
    - **Foil Effects Visibility:** Fix für verschwundene oder überdeckte Folien-Effekte. Der Z-Index der Inhalts-Ebene wurde erhöht (z-30), damit sie korrekt über den Spezialeffekten (z-20) liegt, ohne diese zu verdecken.
    - **Iconic Card Effects:** Iconic-Karten zeigen nun auch im Kampf ihren spezifischen goldenen Aura-Effekt an (Prop-Fix).
    - **Responsive Attack Buttons:** Die Angriffs-Buttons im Fokus-Overlay nutzen nun container-relative Einheiten (`cqw`) statt fester Pixelwerte, was das "zerstörte" Layout bei unterschiedlichen Skalierungen behebt.
    - **GameBoard Styling:** Der Eckenradius des gesamten Spielfelds wurde auf einen festen Wert (`2rem`) gesetzt, um unnatürlich große Rundungen auf Desktop-Monitoren zu vermeiden.
- **TypeScript Alignment:** `CardData` wurde um ein optionales `count`-Feld erweitert, um Build-Fehler im `LayoutExperiment` zu beheben.

## [1.10.0] - 2026-04-12
### Added
- **Server-Side Combat Engine:** Das gesamte Kampfsystem wurde auf serverseitige Logik (Firebase Cloud Functions) umgestellt.
    - **Anti-Cheat:** Sämtliche Schadensberechnungen, HP-Abzüge und KI-Züge erfolgen nun sicher auf dem Server.
    - **Match Persistence:** Der Spielzustand wird in Echtzeit in Firestore synchronisiert. Ein Neuladen der Seite ("F5") stellt das laufende Match exakt wieder her.
    - **Battle Log:** Neues UI-Panel ("Kampflog") zeigt alle Spielzüge (Angriffe, Wechsel, Knockouts) chronologisch an.
    - **First-to-3 Condition:** Matches enden nun regelkonform, sobald ein Spieler 3 Karten im Friedhof hat (Knockout-System).
    - **Sync-Animations:** Clientseitige Animationen (Shake, Action-Toasts) werden nun direkt durch Änderungen am serverseitigen `actionLog` getriggert.
- **Improved GameBoard UI:** Überarbeitetes Interface mit Fokus auf Server-Daten, Ladezuständen für Züge und verbesserter Punkteanzeige.

## [1.9.9] - 2026-04-12
### Added
- **TCG Standard Refinement:** Karten-Layout wurde auf exakte physische TCG-Maße optimiert.
    - **Corner Radius:** Auf 3.5cqw korrigiert für natürlichen Look.
    - **Albumsnummer:** Karten zeigen nun ihre echte Index-Nummer (`#83`) statt technischer IDs.
    - **UI-Platz:** Beschreibung in der Detailansicht wird nun ausgeblendet, um Platz für beide Attacken-Buttons zu schaffen.
    - **Button-Visibility:** Fix für abgeschnittene Buttons beim Hovern durch `overflow-visible` und Z-Index Korrekturen.
- **AI Combat Fix:** Die KI greift nun nach jedem Spielerzug zuverlässig mit einer zufälligen Attacke an.
- **Live HP:** Karten zeigen jetzt direkt ihren aktuellen HP-Stand (inkl. erlittenem Schaden) an.

## [1.9.8] - 2026-04-12
### Changed
- **Combat UX Overhaul:** Umfassendes Update des Spielbretts basierend auf Feedback.
    - **Visuals:** Karten nutzen nun die korrekten Raritätsfarben aus dem Album. Border-Radius ist proportional zur Kartengröße (`cqw`).
    - **Interaction:** Handkarten vergrößern sich beim Hovern deutlich (2.2x) für bessere Lesbarkeit auf kleinen Bildschirmen.
    - **Logic:** Gewinnbedingung auf 3 Kills gesetzt. Die HP-Anzeige zeigt nun die HP der aktiven Karte an.
    - **Rules:** Karten ohne Attacken werden sofort zerstört (Gegner erhält Kill).
    - **UI:** Menüleiste (Sidebar) auf Desktop nun sichtbar. In-Game Menü mit "Aufgeben"-Option hinzugefügt. Attacken-Buttons im Fokus-Overlay haben eine feste Größe.
- **Data Loading:** Fehlerbehebung beim Laden des Decks; reale Kartendaten werden nun zuverlässiger bevorzugt.

## [1.9.7] - 2026-04-12
### Added
- **Combat Game Board:** Implementierung des finalen Spielbretts für Sammelkarten-Kämpfe.
    - **Layout:** Spezifische Anordnung mit Stapel (unten links), 3 Handkarten (rechts daneben) und aktiver Karte (darüber). Gegner-Seite (oben rechts) gespiegelt mit verdeckten Karten.
    - **Interaction:** Klick auf die eigene aktive Karte öffnet ein Fokus-Overlay zur Auswahl von Attacken (mit den stylischen Buttons aus dem Layout-Experiment).
    - **Simulation:** Integrierte Angriffs-Animationen, HP-Balken-Updates und eine einfache KI-Gegenangriffs-Logik für PvE-Tests.
- **Match Integration:** Die Kampf-Seite (`/kaempfe/[matchId]`) lädt nun das echte Deck des Spielers und generiert ein zufälliges Gegner-Deck für KI-Matches. Ein 3-sekündiger Fallback-Timer stellt sicher, dass Tests auch ohne vollständige Datenbank-Einträge funktionieren.

## [1.9.6] - 2026-04-12
### Changed
- **Combat UX Refinement:** Das Layout der Attacken-Buttons wurde basierend auf Nutzerfeedback optimiert.
    - **Kontrast:** Raritätsspezifische Hintergrundfarben für Buttons sorgen für besseren Kontrast zur Karte.
    - **Layout:** Attacken-Titel und -Beschreibungen sind nun linksbündig ausgerichtet.
    - **Cleanup:** Das "DMG"-Label und das Schwerter-Icon auf den Buttons wurden entfernt.
    - **HP-Visuals:** Das Herz-Icon neben der HP-Anzeige auf der Karte wurde entfernt.
- **Color Consistency:** Die Raritätsfarben im Kampf-Experiment entsprechen nun exakt denen im Album und der restlichen App.

## [1.9.5] - 2026-04-12
### Added
- **Combat UX Experiment:** Neue "Layout"-Option in der Kampf-Auswahl für UI/UX Experimente hinzugefügt.
- **Attack Selection Experiment:** Erstes Experiment implementiert, bei dem Attacken von der Karte getrennt und als eigenständige Buttons mit Titel, Schaden und Beschreibung dargestellt werden.
- **TeacherSpecCard Enhancement:** Neuer `hideAttacks`-Prop hinzugefügt, um Attacken auf der Karte für Layout-Zwecke auszublenden.

## [1.9.4] - 2026-04-12
### Changed
- **PvE Matchmaking:** Die Option "KI Training" (Standard-Schwierigkeit) wurde entfernt. PvE-Matches führen nun direkt zur "Custom KI"-Auswahl, bei der die Schwierigkeit (ELO) individuell eingestellt werden kann.

### Fixed
- **Cloud Functions (CORS Alignment):** Unified CORS configuration across all callable and request-based Cloud Functions.
    - **Robust Local Testing:** Added a specific regex to `CALLABLE_CORS_ORIGINS` that reliably allows all `localhost` subdomains and ports (e.g., `http://dashboard.abi-planer-27.localhost:3000`).
    - **System-wide Consistency:** Replaced various `cors: true` and local `ALLOWED_ORIGINS` definitions with a shared constant in `functions/src/constants/cors.ts` to ensure reliable preflight handling for all modules (Combat, Shop, MFA, Gifts, etc.).

## [1.9.2] - 2026-04-12
### Improved
- **Queue Resilience:** Die Warteschlange kann nun mit Seitenaktualisierungen (Page Reload) umgehen. Der Spielmodus und das gewählte Deck werden automatisch aus Firestore wiederhergestellt, falls der Nutzer bereits in der Suche war.

## [1.9.1] - 2026-04-12
### Added
- **Queue Table Toggle:** Die integrierte Warteschlangen-Tabelle kann nun per Button ein- und ausgeblendet werden (standardmäßig ausgeblendet).
- **Smooth Animations:** Sanfte Ein- und Ausblend-Animationen beim Umschalten der Listen-Ansicht.
- **Improved Layout:** Größere Abstände und optimierte Animationen im Such-Bildschirm für ein hochwertigeres Look & Feel.

## [1.5.34] - 2026-04-11 - Posteingang Listener Berechtigung gefixt

### Fixed - Gruppenchat Permissions

- Im Posteingang (`type=system`) wird kein `group_messages`-Snapshot mehr gestartet.
- Dadurch verschwindet der Fehler `Missing or insufficient permissions` aus der Konsole in der lokalen Entwicklung.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx)

## [1.5.33] - 2026-04-11 - Eigene Chat-Nachrichten ohne Glow

### Changed - Chat Bubble Styling

- Eigene Nachrichten-Bubbles haben keinen farbigen Glow/Shadow-Effekt mehr und wirken dadurch ruhiger.
- Fremde Nachrichten behalten ihre bisherige visuelle Hervorhebung unveraendert.
- Betroffen: [src/components/groups/MessageItem.tsx](src/components/groups/MessageItem.tsx), [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx)

## [1.5.32] - 2026-04-11 - Chat Markdown Basis Support

### Changed - Gruppenchat & ABI Bot

- ABI-Bot-Nachrichten und normale Gruppen-Nachrichten unterstuetzen jetzt Basis-Markdown (fett, kursiv, Listen) statt reinem Plaintext-Rendering.
- Links in Chatnachrichten sind klickbar und werden sicher in einem neuen Tab geoeffnet (`target=_blank`, `rel=noopener noreferrer`).
- Das Rendering ist restriktiv gehalten (kein HTML-Rendering, keine erweiterten Markdown-Elemente ausserhalb des Basis-Scopes).
- Betroffen: [src/components/groups/ChatMarkdown.tsx](src/components/groups/ChatMarkdown.tsx), [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx), [src/components/groups/MessageItem.tsx](src/components/groups/MessageItem.tsx)

## [1.5.31] - 2026-04-11 - Sichtbare Umlaute in Lehrertexten

### Changed - Karten Admin & Import

- Sichtbare Lehrertexte werden beim manuellen Anlegen, Bearbeiten und CSV-Import jetzt auf echte Umlaute normalisiert (`ae/oe/ue` -> `ä/ö/ü`).
- Die Umstellung betrifft nur sichtbare Textfelder (z. B. `name`, `description`, Attacken-Texte), nicht technische IDs.
- Betroffen: [src/app/admin/sammelkarten/page.tsx](src/app/admin/sammelkarten/page.tsx), [src/lib/utils.ts](src/lib/utils.ts), [scripts/process_teachers.js](scripts/process_teachers.js)

### Added - Alt-Daten Migration

- Neues idempotentes Migrationsskript fuer bestehende Lehrer-Textfelder in `settings/sammelkarten` mit Dry-Run und Apply-Modus.
- Neue Skripte: `npm run migrate:visible-umlauts` (Dry-Run) und `npm run migrate:visible-umlauts:apply` (Write).
- Betroffen: [scripts/migrate_visible_teacher_umlauts.ts](scripts/migrate_visible_teacher_umlauts.ts), [package.json](package.json)

## [1.5.30] - 2026-04-11 - ABI Bot FAQ-Hinweis statt Tool Use

### Changed - ABI Bot UX

- Die technische Anzeige `Tool Use` wurde im ABI-Bot-Chat durch die nutzerfreundliche Formulierung `Suche in Hilfe & FAQ` ersetzt.
- Die Umbenennung gilt konsistent fuer Start-/Sending-Fallbacks und die laufende Bot-Statusanzeige.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx)

## [1.5.29] - 2026-04-11 - Dev Credentials Fallback fuer Presence & Audit

### Fixed - Lokale Entwicklung

- `POST /api/presence/close-session` liefert bei fehlenden Firebase-ADC in Local Dev keinen `502` mehr, sondern einen sicheren Fallback-`200` mit `skipped`-Hinweis.
- ABI-Bot-Auditlogging erzeugt bei fehlenden ADC keinen wiederholten Error-Stacktrace mehr, sondern nur noch einen einmaligen Warnhinweis.
- Next.js Dev-CORS-Warnung fuer `dashboard.abi-planer-27.localhost` ist ueber `allowedDevOrigins` in der Next-Config freigeschaltet.
- Betroffen: [src/app/api/presence/close-session/route.ts](src/app/api/presence/close-session/route.ts), [src/app/api/chats/abi-bot/route.ts](src/app/api/chats/abi-bot/route.ts), [next.config.ts](next.config.ts)

## [1.5.28] - 2026-04-11 - ABI Bot Keine falschen Versprechen

### Fixed - ABI Bot Antwortverhalten

- Der ABI Bot verspricht nicht mehr, selbst UI- oder Code-Aenderungen "jetzt" durchzufuehren.
- Zusaetzliche Sicherheitslogik filtert Antworten mit solchen Handlungsversprechen und ersetzt sie durch transparente Support-Antworten.
- Betroffen: [src/app/api/chats/abi-bot/route.ts](src/app/api/chats/abi-bot/route.ts)

## [1.5.27] - 2026-04-11 - Chatliste zeigt letzte Nachricht

### Changed - Chat Preview in Liste

- In der Gruppen-Chatliste wird unter dem Chatnamen jetzt die letzte Nachricht angezeigt statt der Anzahl aktuell online befindlicher Personen.
- Betroffen: [src/app/gruppen/page.tsx](src/app/gruppen/page.tsx)

## [1.5.26] - 2026-04-11 - Gruppen ohne Pflicht-Index

### Fixed - Gruppen & Notifications

- `group_messages`-Listener nutzen kein `orderBy(created_at)` mehr in kombinierten Filter-Queries, damit in der lokalen Entwicklung nicht fuer jeden Chat ein Composite-Index erzwungen wird.
- Die Reihenfolge der Nachrichten bleibt erhalten durch clientseitige Sortierung nach `created_at`.
- Betroffen: [src/app/gruppen/page.tsx](src/app/gruppen/page.tsx), [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx), [src/hooks/useNotifications.ts](src/hooks/useNotifications.ts)

## [1.5.25] - 2026-04-11 - ABI Bot Tool Use Label

### Changed - ABI Bot UX

- Wenn der ABI Bot Hilfe oder FAQ nachschlägt, erscheint jetzt eine explizite `Tool Use`-Markierung statt einer generischen Ladeanzeige.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx)

## [1.5.24] - 2026-04-11 - ABI Bot Group Listener Fix

### Fixed - Gruppen & Notifications

- Die Gruppen-Ansicht und der Benachrichtigungs-Hook lauschen jetzt nur noch auf Firestore-Teilbereiche, die mit den Regeln vereinbar sind.
- Dadurch verschwindet der `Missing or insufficient permissions`-Fehler bei `group_messages`-Snapshots in der lokalen Entwicklung.
- Betroffen: [src/app/gruppen/page.tsx](src/app/gruppen/page.tsx), [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx), [src/hooks/useNotifications.ts](src/hooks/useNotifications.ts)

## [1.5.23] - 2026-04-11 - ABI Bot Lookup Status

### Changed - ABI Bot Lookup Status

- Der ABI Bot zeigt jetzt beim Nachschlagen eine sichtbare Statusanzeige wie "Ich schaue in Hilfe & FAQ nach" an.
- Nach einer Antwort wird angezeigt, ob die Antwort auf Hilfe-/FAQ-Kontext basiert.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx), [src/app/api/chats/abi-bot/route.ts](src/app/api/chats/abi-bot/route.ts)

## [1.5.22] - 2026-04-11 - ABI Bot Help Support Foundation

### Changed - ABI Bot Support

- Der ABI Bot nutzt jetzt eine gemeinsame Hilfe-Wissensbasis aus [src/lib/helpFaqs.ts](src/lib/helpFaqs.ts), statt nur den reinen Chatverlauf zu bewerten.
- Fragen zu App-Funktionen, Orten und Abläufen bekommen jetzt passende FAQ-Kontexte als Prompt-Hilfe.
- Die Hilfe-Seite [src/app/hilfe/page.tsx](src/app/hilfe/page.tsx) nutzt denselben Shared-Content wie der Bot.

### Added - Support API

- Neue FAQ-Such-API unter [src/app/api/faqs/route.ts](src/app/api/faqs/route.ts) für UI- oder Support-Integrationen.
- Neue Logging-Aktionen für FAQ- und ABI-Bot-Support-Flows.

## [1.5.21] - 2026-04-11 - Chatliste nach letzter eigener Nachricht

### Changed - Gruppen Chatliste

- Die Chatliste unter Gruppen priorisiert jetzt den Chat, in dem der Nutzer zuletzt selbst geschrieben hat.
- Falls keine eigene Nachricht vorliegt, bleibt die bestehende Sortierung nach letzter Chat-Aktivität erhalten.
- Betroffen: [src/app/gruppen/page.tsx](src/app/gruppen/page.tsx)

## [1.5.20] - 2026-04-11 - ABI Bot Header & Context Fixes

### Changed - ABI Bot UX

- Im ABI-Bot-Modus wird das Label `GLOBAL HUB` jetzt nicht mehr angezeigt.
- Neuer Button `Chat loeschen` im ABI-Bot-Header, um den aktuellen Bot-Chatverlauf sofort zurueckzusetzen.

### Fixed - ABI Bot Antworten

- Der ABI-Bot erhaelt jetzt den aktuellen In-Memory-Chatverlauf pro Anfrage vom Frontend, damit Rueckfragen wie "was habe ich gerade gesagt" korrekt beantwortet werden koennen.
- Die Systemanweisung wurde gehaertet, damit interne Instruktionen nicht mehr in Antworten wiederholt werden.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx), [src/app/api/chats/abi-bot/route.ts](src/app/api/chats/abi-bot/route.ts)

## [1.5.19] - 2026-04-11 - ABI Bot Bouncing Dots

### Changed - ABI Bot UX

- Der Typing-Indikator im ABI-Bot-Chat wurde verfeinert: Die drei Punkte springen jetzt nacheinander auf und ab.
- Dadurch wirkt der Wartezustand lebendiger und klarer als beim statischen `...`.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx)

## [1.5.18] - 2026-04-11 - ABI Bot Typing Indicator

### Changed - ABI Bot UX

- Im ABI-Bot-Chat wird waehrend einer laufenden API-Anfrage jetzt ein klarer `...`-Indikator angezeigt.
- So ist fuer Nutzer sofort sichtbar, dass der Bot gerade antwortet und die Anfrage verarbeitet.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx)

## [1.5.17] - 2026-04-11 - ABI Bot Stateless Simple Mode

### Changed - ABI Bot

- ABI Bot laeuft jetzt im strikt simplen Modus ohne Verlaufssync: kein Laden aus Server, kein lokaler Cache, keine Persistenz.
- Frontend in [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx) nutzt nur noch den aktuellen In-Memory-Chat und sendet pro Nachricht direkt an die API.
- API in [src/app/api/chats/abi-bot/route.ts](src/app/api/chats/abi-bot/route.ts) arbeitet jetzt als reiner Prompt-Antwort-Endpunkt ohne Historienkontext.

## [1.5.16] - 2026-04-11 - ABI Bot Local History Cache

### Changed - ABI Bot Performance

- Das Laden des ABI-Bot-Verlaufs wurde beschleunigt: Der Verlauf wird jetzt zuerst lokal aus `localStorage` geladen.
- Falls lokal noch kein Verlauf vorhanden ist, wird einmalig die API genutzt und das Ergebnis danach lokal gecacht.
- Neue ABI-Bot-Nachrichten werden fortlaufend lokal gespeichert, damit der Chat beim erneuten Öffnen sofort sichtbar ist.
- Betroffen: [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx)

## [1.5.15] - 2026-04-11 - Mobile Menü Scroll Lock Fix

### Fixed - Navigation auf Smartphone

- Der mobile Navigations-Drawer sperrt den Seitenhintergrund beim Öffnen jetzt zuverlässig über einen robusten Body-Scroll-Lock (inklusive sauberer Wiederherstellung der vorherigen Scroll-Position beim Schließen).
- Das seitliche Drawer-Drag-Verhalten wurde entfernt, damit vertikale Touch-Gesten nicht mehr mit dem Menü-Scroll kollidieren.
- Der scrollbare Menübereich nutzt nun zusätzliche Touch-Stabilisierung für iOS/Smartphone (`overscroll-contain`, `-webkit-overflow-scrolling: touch`).
- Betroffen: [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx)

## [1.5.14] - 2026-04-11 - Gruppen-Layout Optimierung

### Changed - Gruppen-Ansicht

- Das Layout der Gruppen-Seite wurde für Mobilgeräte optimiert. Im Hochformat werden Chat-Liste und aktiver Chat nun nacheinander (mit einem "Zurück"-Button) angezeigt, statt nebeneinander.
- Die Chat-Liste wurde linksbündig zur Menüleiste ausgerichtet (Padding entfernt).
- Die "Kachel-Optik" des aktiven Chats wurde durch ein flaches Design ersetzt, das sich nahtlos in die Seite einfügt (Card-Komponenten entfernt, Schatten und Abrundungen reduziert).

## [1.5.13] - 2026-04-11 - ABI Bot Simplified Chat Flow

### Changed - ABI Bot Chat

- Der ABI Bot Chat wurde auf einen einfachen KI-Flow reduziert: Nachrichten senden, Antwort erhalten, Verlauf laden.
- Die API-Route [src/app/api/chats/abi-bot/route.ts](src/app/api/chats/abi-bot/route.ts) erwartet jetzt nur noch `prompt` statt kanalgebundener Parameter (`chatType`, `groupName`, `roleAccess`).
- Der Verlauf bleibt erhalten, wird aber als einfacher User-Chat gespeichert (`chat_key` pro User), damit der Bot ohne kanalbezogene Sonderlogik stabil laeuft.
- In [src/components/groups/GroupWall.tsx](src/components/groups/GroupWall.tsx) wurden die ABI-Bot-Requests auf den neuen API-Vertrag umgestellt und die spezielle Hinweis-/Rate-Limit-Box entfernt.
- Die Freigabepruefung bleibt bestehen: Nur freigegebene Nutzer koennen den ABI Bot weiterhin verwenden.

## [1.5.12] - 2026-04-11 - Mobile Karten-Crop Fix

### Fixed - Sammelkarten Mobile Rendering

- In der Karten-Render-Pipeline wurde das harte Clipping auf kleinen Screens entschärft, sodass Karten unten nicht mehr zu früh abgeschnitten werden.
- Betroffen: [src/components/cards/CardRenderer.tsx](src/components/cards/CardRenderer.tsx), [src/components/cards/TeacherCard.tsx](src/components/cards/TeacherCard.tsx)

## [1.5.11] - 2026-04-11 - Pack Opening Build Fix

### Fixed - Pack Opening TypeScript Build

- Der `useEffect`-Cleanup in [src/app/sammelkarten/_modules/components/PackOpeningStage.tsx](src/app/sammelkarten/_modules/components/PackOpeningStage.tsx) gibt jetzt sauber `void` zurueck und bricht den Next.js-Typecheck nicht mehr.
- Dadurch laeuft der Firebase App Hosting Build fuer das Pack-Opening-UI wieder durch.

## [1.5.10] - 2026-04-11 - Pack Opening Wobble Softer

### Fixed - Pack Opening Feedback

- Das Drag-Zittern beim Pack wurde nochmals deutlich subtiler eingestellt.
- Die progressive Bewegung bleibt erhalten, wirkt jetzt aber ruhiger und weniger dominant.
- Betroffen: [src/app/sammelkarten/_modules/components/PackOpeningStage.tsx](src/app/sammelkarten/_modules/components/PackOpeningStage.tsx)

## [1.5.9] - 2026-04-11 - Pack Opening Wobble Tuning

### Fixed - Pack Opening Feedback

- Das Wackeln beim Ziehen des Pack-Handles wurde etwas heruntergeregelt, bleibt aber weiter progressiv und bis kurz vor dem Pop sichtbar.
- Die kritische Endphase vor dem Aufpoppen ist jetzt subtiler, damit die Bewegung weniger zu stark wirkt.
- Betroffen: [src/app/sammelkarten/_modules/components/PackOpeningStage.tsx](src/app/sammelkarten/_modules/components/PackOpeningStage.tsx)

## [1.5.8] - 2026-04-11 - Pack Opening Wobble Intensified

### Fixed - Pack Opening Feedback

- Das Pack beim Aufreißen wackelt jetzt deutlich stärker und wird progressiv instabiler, je weiter der Drag fortschreitet.
- Kurz vor der bestehenden Trigger-Schwelle geht das Pack in eine kritische Endphase mit stärkerem Zittern, Rotation und Schatten-Intensität über, bevor es aufpopt.
- Betroffen: [src/app/sammelkarten/_modules/components/PackOpeningStage.tsx](src/app/sammelkarten/_modules/components/PackOpeningStage.tsx)

## [1.5.7] - 2026-04-10 - Deck Auswahl & Set-Filter

### Fixed - Deck Karten-Auswahl

- Fehler behoben, bei dem im Deck-Editor keine Karten mehr ausgewaehlt werden konnten, wenn Kartendaten aus `settings/sammelkarten.sets` statt nur aus `loot_teachers` geladen wurden.
- Deck-Auswahl und Deck-Cover-Aufloesung unterstuetzen jetzt set-basierte Karten-IDs (`setId:cardId`) inklusive Rueckwaertskompatibilitaet fuer bestehende Legacy-Decks.

### Added - Set Filter in Kartenfiltern

- In der Deck-Kartenauswahl wurde ein zusaetzlicher Filter nach Sets ergaenzt (neben Seltenheit).
- Im Lehrer-Album wurde der globale Filter um Set-Auswahl erweitert, inklusive korrekter Verarbeitung von Multi-Set-Daten.

## [1.5.6] - 2026-04-11 - Pack-Auswahl Redesign & Drag Hint Animation

### Fixed - Packauswahl: Kompletter UI Cleanup + Drag Handle Animation

- **Drag Handle Animation**: Der weiße Ball zum Aufreißen bewegt sich jetzt subtil nach links und zurück (nur im idle Zustand), um anzuzeigen, dass er beweglich/interaktiv ist. Mit 500ms Delay und 2s Cycle.
  - Betroffen: [src/app/sammelkarten/_modules/components/PackOpeningStage.tsx](src/app/sammelkarten/_modules/components/PackOpeningStage.tsx)
- **Pack Shake & Lift Animation**: Wenn man den Handle zieht, passiert interaktive Feedback:
    - Pack steigt visuell an (Y-Offset: bis zu -8px nach oben)
    - Pack wächst je weiter man zieht (Scale: 1.0 bis 1.12)
    - Pack wackelt/zittert während des Ziehens (subtile Rotation)
    - Schatten wird intensiver und weicher mit ripProgress
    - Subtales Pulsing ab 10% Drag-Progress
    - Betroffen: [src/app/sammelkarten/_modules/components/PackOpeningStage.tsx](src/app/sammelkarten/_modules/components/PackOpeningStage.tsx)

- **SelectionRing/Rahmen um Packs entfernt**: Der `ring-4 ring-sky-300/80` Blue-Ring ist weg. Selection ist nur subtiles `scale-[1.02]`.

- **Komplettes UI Cleanup**: 
    - Alle Border-Kacheln um Pack-Karten entfernt
    - Header-Sektion: Kein Border-Rahmen mehr
    - Grid-Layout bereinigt
    - Schwarze Border-Linien um Pack-Bilder entfernt

- **Dark Mode Theme Support** & **Button-Kontrast Dark Mode**: `dark:bg-blue-600` für Buttons.

- **CardBack Blitz-Icon**: Pillenförmige Container entfernt.

## [1.5.5] - 2026-04-10 - Mobile UX Verbesserungen

### Fixed - Mobile Menu & Sammelkarten Manager

- **Navigation Mobile Menu**: Touch-Event-Konflikt behoben, bei dem Finger hinter dem Menü scrollten oder das Menü nicht scrollbar war. `touchAction: 'none'` auf dem Overlay blockiert jetzt korrekt durchdringende Touch-Events, und der scrollbare Bereich hat `touchAction: 'pan-y'` für vertikales Scrollen.
  - Betroffen: [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx)
  
- **Admin Sammelkarten Manager**: Mobile Layout drastig vereinfacht.
  - Tab-Beschriftungen gekürzt auf Mobile (z.B. "Pool" statt "Lehrerpool", "Rates" statt "Drop-Rates").
  - Tabs sind nun horizontal scrollbar statt zu wrappen.
  - Admin-Maintenance-Buttons (Cleanup, Migrate, Sync) auf Mobile in ein collapsibles "Admin-Tools" Dropdown versteckt—nur "Cleanup Pool" und "Bulk Import" sind sichtbar.
  - Desktop hat weiterhin alle Buttons sichtbar.
  - Betroffen: [src/app/admin/sammelkarten/page.tsx](src/app/admin/sammelkarten/page.tsx)

## [1.5.4] - 2026-04-10 - News Smartphone Optimierung

### Fixed - News Smartphone UX

- Die News-Uebersicht ([src/app/news/page.tsx](src/app/news/page.tsx)) wurde fuer kleine Displays optimiert: reduzierte Abstaende, bessere Title-Wraps, flexiblere Meta-Chips und mobil gestapelte CTA-/Action-Bereiche.
- Mindestbreiten in Karten-Headern entfernt, damit Titel und Aktion-Buttons auf Smartphones nicht mehr gegeneinander druecken oder horizontal unruhig umbrechen.
- Die News-Detailansicht ([src/app/news/[id]/page.tsx](src/app/news/[id]/page.tsx)) wurde mobil entschlackt: angepasste Hero-/Typografie-Skalierung, kompaktere Metadatenzeile, bessere Button-Anordnung und flüssiger lesbarer Content-Block.
- Kommentarbereich in der Detailansicht auf kleinen Screens verbessert (engere Abstaende, robustere Wraps bei Namen/Zeitstempeln).

## [1.5.3] - 2026-04-10 - News Mobile Layout Fix

### Fixed - News Detail Mobile Header

- Mobile-Layout der News-Detailseite verbessert: Der Titel nutzt wieder die volle Breite und wrappt sauber, statt durch die Action-Leiste unguenstig umzubrechen.
- Der Button `Zusammenfassen` steht auf kleinen Screens jetzt unter dem Titel (mit responsiver Breite), waehrend das bisherige Desktop-Layout erhalten bleibt.

## [1.5.2] - 2026-04-10 - Logo Size Hotfix

### Fixed - Logo Rendering

- Regression im globalen Logo-Rendering behoben: In [src/components/Logo.tsx](src/components/Logo.tsx) wurde die erzwungene Style-Ueberschreibung (`width: auto`, `height: auto`) entfernt.
- Ergebnis: Das Logo respektiert wieder die gesetzten `width`/`height` Props (z. B. `40x40` in der Navbar) statt in nativer Bildgroesse zu rendern.

## [1.5.1] - 2026-04-10 - App Hosting Build Hotfix

### Fixed

- Firebase App Hosting Build-Fix: Der statische Import `@/bones/registry` in [src/app/layout.tsx](src/app/layout.tsx) wurde entfernt, da die Datei unter [src/bones/registry.js](src/bones/registry.js) durch [.gitignore](.gitignore) im Cloud-Build-Kontext nicht enthalten ist.
- Ergebnis: Kein `Module not found: Can't resolve '@/bones/registry'` mehr im Next.js Build auf App Hosting.

## [1.5.0] - 2026-04-10 - Platform Update (Cards, Admin, Presence, SEO)

### Added

- Neues modulares Kartensystem mit Set-Registry (`teacher_vol1`, `support_v1`) inklusive neuer Typen/Interfaces und Registry-Resolvern in Frontend und Functions.
- Neue Admin-Funktionen und Endpunkte fuer Changelog-Management, KI-gestuetzte Zusammenfassungen sowie Session-Stat-Reset-Fallbacks.
- ABI-Bot Chat-Flow pro Kanal (intern/hub/role/system) mit serverseitiger Zugriffspruefung, Persistenz und Audit-Logging.
- Neue Seiten und Routing-Bausteine fuer Battle-Pass/Premium-Vorbereitung, Admin-Changelog, SEO-Metadaten (`robots`, `sitemap`, `noindex` Heads).

### Changed

- Presence- und Session-Lifecycle deutlich erweitert: robustere Session-End-Verarbeitung, API-gestuetztes Close-Session-Handling und stabilere Analytics-Auswertung.
- Dashboard-, Gruppen-, Karten- und Navbar-Komponenten umfassend weiterentwickelt (Performance, UX, neue Controls, verbesserte States/Skeletons).
- Logging-Pipeline erweitert: mehr Aktionen mit `user_name`, verbesserte Namensaufloesung sowie zusaetzliche Admin- und Audit-Datenpfade.
- Test-, Doku- und Audit-Artefakte aktualisiert (u. a. Mobile Release Gate, Modular Card System Doku, Testing Guide).

### Fixed

- Stabilitaets- und Dev-Resilience-Verbesserungen bei Firebase-Admin initialisierung und lokalen Fallback-Flows.
- Diverse UI-Konsistenz- und Layout-Korrekturen in Karten-Overlays, Dialogen, Listen und responsiven Ansichten.
- Mehrere API-/Auth-/Fehlerbehandlungs-Pfade gehaertet, um 5xx-Fehler und intransparente Fehlermeldungen zu reduzieren.

## [1.4.34] - 2026-04-10 - ABI Bot Full Bypass Resilience

### Fixed - ABI Bot Full Bypass Resilience

- **Firestore Independence:** Der ABI Bot im `MAESTRO_DEV_BYPASS` Modus funktioniert nun auch dann, wenn absolut keine Firebase-Admin-Credentials vorhanden sind. Lese- und Schreibzugriffe auf Firestore (Verlauf & Logs) werden in diesem Fall übersprungen, statt den Request mit einem 500er Fehler abzubrechen.
- **AI-Antwort-Priorität:** Die Generierung der Bot-Antwort via Groq hat nun Vorrang vor der Persistierung. Nutzer erhalten auch dann eine Antwort, wenn die Datenbank temporär nicht erreichbar ist.
- **Frontend-Klarheit:** Fehlermeldungen im Chat-UI zeigen nun den exakten Grund (`details`) an, warum eine Aktion fehlgeschlagen ist.

## [1.4.33] - 2026-04-10 - ABI Bot Resilience & Debugging

### Fixed - ABI Bot Resilience & Debugging

- **Verbessertes Error-Reporting:** Die API-Route `/api/chats/abi-bot` gibt nun im Fehlerfall (500) detaillierte Informationen (`details`) zurück, um die Diagnose in der Browser-Konsole zu erleichtern.
- **Robustere Initialisierung:** Der `getAdminApp`-Helper wurde optimiert, um auch bei fehlenden Firebase-Admin-Credentials im `MAESTRO_DEV_BYPASS` Modus nicht abzustürzen.
- **Bypass-Erweiterung:** Der Developer-Bypass deckt nun auch die Datenbank-Initialisierung ab, um lokale Entwicklung ohne vollen Admin-Zugriff zu stabilisieren.

## [1.4.32] - 2026-04-10 - Feedback Dashboard Optimierung

### Added - Feedback Dashboard Optimierung

- **Admin-UI Update:** Das Admin-Feedback-Dashboard (`/admin/feedback`) zeigt nun prominent die KI-generierten Kategorien und Prioritäten an.
- **Priority-Indikatoren:** Feedback-Karten verfügen nun über farbliche Indikatoren (Rot/Gelb/Grün) basierend auf der Wichtigkeit (Importance).
- **Neue Sortierung & Filter:** Admins können nun nach Priorität sortieren und gezielt nach Kategorien (z.B. Bug, Feature) filtern.
- **Erweiterter Export:** Der CSV-Export enthält nun ebenfalls die Felder "Kategorie" und "Prio".

## [1.4.31] - 2026-04-10 - Optimierter KI-Newsflow & ABI Bot Auth Fix

### Added - Optimierter KI-Newsflow

- **Verbesserter Generator-Workflow:** Der KI-News-Generator leitet nun direkt zur News-Seite weiter und öffnet dort den Editor mit dem generierten Text, statt ein lokales Modal zu nutzen.
- **"Feel-Good" Delay:** Künstliche Verzögerung von 4 Sekunden bei der News-Generierung mit dynamischen Fortschrittsmeldungen (z.B. "KI formuliert Beitrag..."), um die Wertigkeit der generierten Inhalte zu unterstreichen.
- **Controlled AddNewsDialog:** Die `AddNewsDialog`-Komponente wurde refactored, um externe Initialisierung (Titel, Inhalt, AI-Flag) und gesteuertes Öffnen via Props zu unterstützen.
- **Suspense-Integration:** Die News-Seite wurde in einen `Suspense`-Boundary gehüllt, um Build-Fehler im Zusammenhang mit `useSearchParams` zu beheben.

### Fixed - ABI Bot Auth Fix & Dev-Bypass

- **Detailliertes Auth-Logging:** In der API-Route `/api/chats/abi-bot` werden nun detaillierte Fehlermeldungen zur Fehlerdiagnose bei Authentication-Failures ausgegeben.
- **Developer Bypass:** Integration des `MAESTRO_DEV_BYPASS` in den ABI-Bot Endpoint. Ermöglicht lokale Entwicklung ohne Firebase Admin SDK Credentials, sofern die Umgebungsvariable gesetzt ist.
- **Konsistente Profil-Bypass:** Der Bypass simuliert nun ein vollständiges Admin-Profil für den Zugriff auf alle ABI-Bot-Kanäle (Hub, Intern, Role).

## [1.4.28] - 2026-04-10 - KI-Features (Groq Integration)

### Added - KI-Features (Groq Integration)

- **KI-gestützte Feedback-Analyse:** Automatische Kategorisierung und Wichtigkeits-Ranking (1-10) via Groq (`llama-3.1-8b-instant`).
- **KI-gestützte News-Generierung:** Im Admin-Changelog können nun mehrere Release-Einträge ausgewählt werden, um daraus automatisch einen News-Beitrag zu generieren.
- **"KI-unterstützt"-Badge:** Transparente Kennzeichnung von KI-generierten oder unterstützten News-Inhalten im gesamten Frontend.
- **Admin-UI-Erweiterung:** Anzeige von Kategorie und Priorität im Feedback-Dashboard für Admins zur besseren Moderation.
- **Typescript-Fixes:** Fehlerbehebung bei framer-motion Variants in `AdminSystemDashboard` und Select-Handler-Typen in `AdminChangelogPage`.

## [1.4.27] - 2026-04-10 - Performance Optimierung (/gruppen)

### Fixed - Performance Optimierung (/gruppen)

- **O(N) Reply-Lookup:** Die Suche nach Antworten in Chats wurde von O(N²) auf O(N) optimiert, indem eine Map-basierte Gruppierung (`useMemo`) verwendet wird. Dies verhindert UI-Freezes bei vielen Nachrichten.
- **Memoization:** Die `MessageItem`-Komponente wurde mit `memo` geschuetzt, um unnoetige Re-Renders der gesamten Pinnwand bei Online-Status-Aenderungen oder neuen Nachrichten zu verhindern.
- **Listener-Konsolidierung:** Der redundante Firestore-Listener fuer Profile in `GroupWall` wurde entfernt. Die `onlineCount` wird nun effizient von der Parent-Page durchgereicht.
- **Stabile Callbacks:** Alle Event-Handler (`onDelete`, `onPin`, `onReply`) nutzen nun `useCallback` mit stabilen Referenzen (`messagesRef`), um die Memoization der Kind-Komponenten nicht zu durchbrechen.

## [1.4.26] - 2026-04-10 - ABI Bot Chat mit Voll-Logging

### Added - ABI Bot pro Chat

- In der Gruppenchat-Ansicht gibt es jetzt pro bestehendem Chat einen eigenen `ABI Bot` Modus (intern, hub, role, system).
- Der ABI Bot Verlauf wird chatbezogen geladen und angezeigt.

### Added - Serverseitige ABI Bot API

- Neue Route `/api/chats/abi-bot` (GET/POST) mit Bearer-Token-Pruefung und Approved-Check.
- Chat-Zugriffspruefung serverseitig anhand Profilrollen und Gruppenmitgliedschaft.
- Bot-Antworten werden ueber Groq (`llama-3.1-8b-instant`) erzeugt.

### Added - Pflicht-Logging und Rate-Limit

- Jede ABI-Bot Anfrage wird mit vollem Prompt und voller Antwort in `abi_bot_logs` auditierbar gespeichert.
- Konversationen werden in `abi_bot_conversations` persistiert.
- Neues serverseitiges Rate-Limit nur fuer ABI Bot: maximal 10 Nachrichten pro Minute pro Nutzer (`429` bei Ueberschreitung).

## [1.4.25] - 2026-04-10 - System Control Center KI Lagebericht

### Fixed - News Zusammenfassungen (Groq KI)

- API Route `api/news/summarize` stabilisiert: verbesserte Fehlerbehandlung und aussagekraeftigere Error-Responses (500 Details).
- Groq API-Integration (Llama 3.1 8B) mit korrektem Auth-Handling und Prompts wiederhergestellt.
- Firebase Admin Initialisierung robuster gestaltet (Fallback fuer lokale Entwicklung ohne Cert-Keys).
- UI: Die News-Detailseite zeigt nun detaillierte Fehlermeldungen bei fehlgeschlagenen Zusammenfassungen an.

### Added - Admin Control Center

- Das System Control Center hat jetzt den Button `KI-Zusammenfassung`, der on-demand einen kurzen Lagebericht aus den aktuellen Dashboard-Daten erstellt.
- Die Ausgabe wird direkt im Control Center als `KI Lagebericht` angezeigt, inklusive Modell- und Zeitstempel-Info.
- Kein Auto-Refresh fuer den KI-Call: die API wird nur bei explizitem Button-Klick genutzt.

### Added - Serverseitige Admin API

- Neue Admin-Routen `/api/admin/system/ai-summary` und `/admin/api/system/ai-summary` erzeugen den Lagebericht serverseitig ueber Groq.
- Zugriff ist auf Admin-Rollen beschraenkt (`admin`, `admin_main`, `admin_co`) und erfordert gueltigen Bearer-Token.
- Daten werden teilweise anonymisiert verarbeitet (keine Namen/E-Mails in der Zusammenfassungspayload) und nicht in Firestore gespeichert.

## [1.4.24] - 2026-04-10 - KI News Zusammenfassung

### Added - News Detailansicht

- In der News-Detailansicht gibt es jetzt oben den Button `Zusammenfassen` fuer angemeldete und freigeschaltete Nutzer.
- Die Zusammenfassung wird on-demand erzeugt und direkt unter dem Titel als `KI-Zusammenfassung` angezeigt.
- Die Zusammenfassung wird nicht in Firestore gespeichert.

### Added - Serverseitige KI API

- Neue Route `/api/news/summarize` erzeugt die Zusammenfassung serverseitig ueber Groq.
- Zugriff auf die API ist nur mit gueltigem Bearer-Token und freigeschaltetem Profil erlaubt.
- Der Groq API Key wird als serverseitige Umgebungsvariable `GROQ_API_KEY` genutzt (kein `NEXT_PUBLIC_`).

## [1.4.20] - 2026-04-10 - Admin Changelog Auth-Fix

### Fixed - Admin Changelog Laden

- Die Route `/admin/api/changelog` validiert jetzt nur noch den Firebase Bearer-Token, damit es in lokalen Dev-Setups mit Production Firebase nicht mehr zu fehlerhaften `403`-Antworten kommt.
- Die Seite `/admin/changelog` bleibt bei fehlendem Nutzer-Token nicht mehr endlos auf `Lade Changelog...`, sondern zeigt einen klaren Fehlerhinweis.
- Für `403`-Antworten wird jetzt eine verständliche Meldung angezeigt (Neu-Anmeldung/Rollenprüfung).

### Fixed - Admin Changelog UI

- Die Versionsauswahl wurde auf ein Dropdown umgestellt.
- Doppelte React-Keys in der Changelog-Liste wurden behoben, damit keine `Encountered two children with the same key` Warnungen mehr auftreten.
- Die Changelog-Seite lädt Einträge jetzt per Infinite Scroll in Batches nach.

## [1.4.19] - 2026-04-10 - Admin Changelog Ansicht

### Added - Admin Bereich

- Neuer Admin-Menüpunkt `Changelog` in Navigation und Control Center.
- Neue Admin-Seite `/admin/changelog` zeigt die Inhalte aus `CHANGELOG.md` direkt im Dashboard an.
- Changelog-Einträge sind für Admins nach Version filterbar (Freitext + Schnellfilter-Buttons).

### Added - Admin API

- Neue Route `/admin/api/changelog` lädt die Changelog-Datei serverseitig und prüft den Bearer-Token auf Admin-Rolle (`admin`, `admin_main`, `admin_co`).

## [1.4.18] - 2026-04-10 - Manuelle Leaderboard-Korrekturen

### Added - Kurs-Ranking

- Planner/Admins können im Kurs-Ranking jetzt pro Kurs manuelle Korrekturbeträge eintragen und speichern.
- Die Werte werden in `settings/config.leaderboard_adjustments` persistiert und direkt im Leaderboard verrechnet.
- Das Ranking summiert damit nun reguläre Finanzeinträge, Shop-Gewinne und manuelle Korrekturen.
- Die manuelle Korrektur wird im Dashboard nicht mehr angezeigt und bleibt nur auf der Finanzseite sichtbar.

## [1.4.17] - 2026-04-10 - Shop Gewinnsplit & Leaderboard

### Changed - Shop & Finanzen

- Die 90%-Formulierungen im Shop, in der Hilfe und in den AGB wurden auf Gewinne statt Einnahmen umgestellt.
- Das Kurs-Ranking berücksichtigt Shop-Gewinne jetzt direkt aus `shop_earnings` zusätzlich zu den normalen Finanzeinträgen.
- Die Finanz- und Dashboard-Seite laden `shop_earnings` separat, damit das Leaderboard auch ohne automatische Finanztab-Einträge weiterläuft.

### Changed - Firestore Rules

- `shop_earnings` ist jetzt für genehmigte Nutzer lesbar, damit das Kurs-Ranking die Shop-Gewinne aggregieren kann.

## [1.4.16] - 2026-04-10 - Album Scroll & Foil Performance

### Changed - Sammelkarten Album Performance

- `TeacherAlbum` nutzt jetzt Infinite Scroll mit 24er-Batches statt sofort alle Karten auf einmal zu rendern.
- Das Nachladen erfolgt automatisch über einen `IntersectionObserver` mit Vorladeabstand für flüssigeres Scrollen.
- Bei Filter-/Sortierwechsel wird die sichtbare Menge sauber zurückgesetzt, damit die Liste konsistent bleibt.

### Changed - Karten Rendering & Effekte

- Foil-Overlays werden nur noch gerendert, wenn die Karte im Viewport ist (`TeacherCard` + `CardEffectOverlay`).
- Karten außerhalb des Viewports haben keine aktiven Foil-Effekte mehr (komplett deaktiviert).
- `CardRenderer` ist jetzt per `React.memo` mit Prop-Vergleich abgesichert, um unnötige Grid-Re-Renders zu reduzieren.

## [1.4.14] - 2026-04-10 - Card Leveling & Balancing Overhaul

### Added - Card Mechanics
- **Card Leveling System**: HP und Schaden skalieren nun mit jedem Level der Karte (bis Max-Level 10).
- **Stat Scaling**: Jedes Level erhöht die Basiswerte um 10% (Level 10 entspricht 190% der Basiswerte).
- **Support Card Scaling**: Support-Karten skalieren nun ihren Multiplikator basierend auf dem Level.

### Changed - Balancing
- **Teacher Stat Rebalance**: Umfassendes Rebalancing aller Lehrer-Karten. Basis-HP und Schaden wurden an die Seltenheit angepasst (Common: ~95 HP / 15 DMG bis Iconic: ~160 HP / 80 DMG).
- **UI Enhancements**: Anzeige des Levels und der skalierten Werte in der Karten-Detailansicht (Spec Card).

## [1.4.13] - 2026-04-10 - Ignore Generated Artifacts

### Changed - Git Hygiene

- Generated workspace artefacts wie `.firebase/`, `src/bones/`, `docs/maestro/plans/`, `docs/maestro/state/archive/`, `PHASE1_NP_SETUP.md` und `lehrer_export_*.csv` werden nun standardmäßig ignoriert.

## [1.4.12] - 2026-04-10 - Deactivate Battle Pass & NP Currency

### Changed - Feature Deactivation
- **Battle Pass**: Deaktiviert und aus der Navigation entfernt. Eine "Pausiert"-Meldung wird angezeigt, falls die Seite direkt aufgerufen wird.
- **NP-Währung (Notenpunkte)**: Alle NP-Pakete und die NP-Kategorie wurden aus dem Shop entfernt. Das NP-Guthaben-Widget wurde ausgeblendet.
- **Premium Abo**: Das Abonnement wurde deaktiviert und aus dem Shop entfernt.

### Fixed - Project Integrity
- `TeacherAlbum.tsx`: Mehrere TypeScript-Fehler behoben (fehlende `calculateLevel` Funktion und `level` Variable) sowie ein falsch geschlossenes `BoneyardSkeleton`-Tag korrigiert.

## [1.4.11] - 2026-04-10

### Changed - Branch Push Policy

- Die Projektanweisungen wurden so angepasst, dass nach Code-Änderungen standardmäßig auf `main` gepusht wird und `release` nur auf ausdrücklichen Befehl.

## [1.4.14] - 2026-04-10 - Teacher Management Stats & Effects

### Added - Teacher Management Balancing Support

- `TeacherEditDialog` zeigt nun empfohlene HP- und DMG-Bereiche basierend auf der Seltenheit an (ca. 50% Skalierung von Common zu Iconic)
- `TeacherAttack` wurde um ein verstecktes `effect` Feld erweitert, das über ein Dropdown im Manager konfiguriert werden kann (none, sleep, poison, stun, heal, pierce)
- Angriffe im Manager unterstützen nun die manuelle Beschreibung des vordefinierten Effekts für maximale Flexibilität

## [Unreleased] - Battle Pass & NP Currency System

### Changed - Desktop Sidebar Collapse

- Die Desktop-Menueleiste ist jetzt ein- und ausklappbar. Der Zustand wird lokal gespeichert, und die mobile Navigation bleibt unveraendert.
- Der Toggle-Pfeil sitzt jetzt mittig neben der Leiste statt im Header-Bereich ueber dem Logo.
- Klick auf ein Symbol im eingeklappten Desktop-Modus klappt die Leiste automatisch wieder aus.
- Das kompakte Flyout wurde entfernt, um Schatten-/Overflow-Artefakte zu vermeiden.
- Der Toggle ist jetzt als kleine seitliche Lasche (Ausschnitt) direkt an der Menueleiste verankert.
- Die Breiten-Animation beim Ein-/Ausklappen wurde entfernt, um visuelle Bugs zu vermeiden.
- Toggle-Feintuning: ausgefahren oben in der Leiste neben „ABI Planer“, eingefahren als kleine Lasche oben neben dem Logo.
- Eingefahrene Lasche weiter verfeinert: Pfeil jetzt explizit mittig zentriert in der Lasche.
- Desktop-Menueleiste ist jetzt viewport-fixiert und scrollt beim Body-Scroll nicht mehr mit.
- Die eingeklappte Toggle-Lasche ist jetzt ebenfalls viewport-fixiert und scrollt nicht mit dem Body.

### Fixed - System Control Center Session Durations

- Die Sessiondauer wird jetzt pro Browser-Session gestartet und beim Tab-Schliessen bzw. Verlassen serverseitig sauber abgeschlossen, damit extrem hohe Laufzeiten nicht mehr durch fehlende Close-Signale entstehen
- Der Presence-Heartbeat nutzt einen stabilen Session-Start aus `sessionStorage`, damit Reloads dieselbe Sitzung fortsetzen statt sie ungewollt neu zu mischen
- Fuer Altbestandsdaten steht jetzt ein Cleanup-Tool bereit (`cleanup:session-metrics` / `cleanup:session-metrics:apply`), das alte Sessionfelder entfernt und optional veraltete Online-Flags zuruecksetzt
- Session-Ausreisser ueber 12 Stunden werden in Analytics (Cloud Function und lokaler Fallback) nicht mehr fuer Online-Dauer und Durchschnitt beruecksichtigt, damit alte Altwerte die KPI nicht mehr aufblasen
- Im System Control Center gibt es jetzt eine Admin-Quick-Action `Session-Statistiken zuruecksetzen`, die global fuer alle Profile `isOnline` auf `false` setzt und Session-Felder (`onlineSince`, `lastOnline`, `lastSessionDurationSeconds`) entfernt
- Der Session-Reset-API-Proxy nutzt jetzt einen lokalen Admin-SDK-Fallback, falls der Cloud-Function-Endpunkt noch nicht deployed oder temporaer nicht erreichbar ist (verhindert 502 im lokalen Dashboard-Setup)
- Der lokale Session-Reset waehlt jetzt robust zwischen `abi-data` und der Default-Firestore-DB und zeigt im UI den konkreten Server-Fehlertext an statt nur einer generischen Fehlermeldung
- Falls lokal keine Admin-Credentials verfuegbar sind (ADC fehlt), faellt der Session-Reset-Button im Control Center automatisch auf einen direkten Firestore-Client-Reset zurueck

### Fixed - System Control Center Live Stats

- Die Kennzahlen fuer „Aktuell online“ und „Ø Session“ verwenden jetzt eine einheitliche Presence-Definition mit 5-Minuten-Stale-Fallback, damit Dashboard, Cloud Function und lokaler Analytics-Fallback dieselben Werte liefern
- Die lokale Analytics-Aggregation wurde auf das gleiche 7-Tage-Fenster wie die Cloud Function synchronisiert, um inkonsistente Log-Zaehlungen zu vermeiden

### Fixed - Sammelkarten Ziehung Flip-Clipping

- Der Haupt-Container der Sammelkarten-Ziehung nutzt jetzt `overflow-visible` statt `overflow-hidden`, damit Karten waehrend der Umdreh-Animation oben/unten nicht mehr abgeschnitten werden.
- In der Ziehungs-Reveal-Ansicht rendert `CardRenderer` jetzt mit erzwungen sichtbarem Overflow (`!overflow-visible`), damit der 3D-Flip nicht mehr am Kartenrahmen vertikal geclippt wird.

### Fixed - Sammelkarten Karten-Spec Layout

- Die Karten-Spec bricht langen Karten- und Angriffs-Text jetzt erst an der echten Zeilenkante um, statt die Titel zu truncaten.
- Level-Badge, HP-Anzeige und Footer bleiben im festen Kartenlayout stabil positioniert, damit alle Elemente innerhalb der Kartenfläche sauber Platz finden.

### Fixed - Sammelkarten Album JSX Parse Error

- `TeacherAlbum` no longer contains a stray closing `BoneyardSkeleton` tag, which had broken the Sammelkarten page build in development

### Fixed - Sammelkarten Kartenfolie Corner-Clip

- `CardEffectOverlay` rendert jetzt mit leichtem Overscan (`-inset-px`) und geerbtem Radius auch auf `::before`/`::after`, damit die Folienebene sauber bis in die Karten-Ecken reicht und keine sichtbare Luecke mehr entsteht

### Fixed - Sammelkarten Booster CORS

- `openBooster` akzeptiert jetzt auch `https://abi-planer-27.de` und `https://dashboard.abi-planer-27.de`, damit Callable-Aufrufe aus dem aktuellen Dashboard nicht mehr an der Preflight-Pruefung scheitern

### Fixed - AdSense & SEO compliance

- Thin or technical routes such as login, register, help, legal pages, the placeholder battle page and referral redirects are now marked `noindex` and blocked in robots guidance where appropriate
- AdSense loading and rendering are now route-aware so ads only appear on content-rich public pages instead of low-value surfaces
- Public landing and feature pages were expanded with more unique explanatory content to reduce thin-content signals
- A sitemap was added for the indexable public routes only, keeping thin pages out of crawl focus

### Added - Sammelkarten Manager Statistiken

- Der Sammelkarten-Manager zeigt jetzt Live-Diagramme fuer Set-Verteilung, Ideen-Labor-Status und die Pack-Simulation via Chart.js
- Die bisherigen textbasierten Statistikwerte wurden um visuelle Diagramme erweitert, damit Verteilungen schneller erfassbar sind

### Added - Ideen-Labor Moderation Upgrade

- Der Admin-Flow im Ideen-Labor nutzt jetzt einen Bearbeitungsdialog vor der Annahme: Lehrername, HP, Beschreibung und Angriffe koennen vor dem finalen Entscheid manuell angepasst werden.
- Beim Annehmen wird jetzt explizit markiert, ob ein Vorschlag tatsaechlich genutzt wurde (`used`/`not_used`).
- Neue Proposal-Felder fuer Audit und Transparenz: `usage_status`, `reward_packs_awarded`, `edited_snapshot` sowie erweiterte Moderationsmetadaten.

### Fixed - Ideen-Labor Reward-Sicherheit

- Die Belohnungsvergabe bei Proposal-Moderation wurde auf Firestore-Transaktionen umgestellt, um Race-Conditions und doppelte Gutschriften zu verhindern.
- 2 Booster werden nur noch vergeben, wenn ein angenommener Vorschlag explizit als genutzt markiert wurde.
- Legacy-Backfill-Callable (`backfillCardProposalUsageStatus`) ergaenzt fehlende `usage_status`/Reward-Felder bei bereits moderierten Altfaellen.

### Added - Battle Pass UI (Optik)

- Neue Seite `/battle-pass` mit rein visueller Battle-Pass-Ansicht
- 30 Stufen als horizontaler, responsiver Track fuer Desktop und Mobile
- Free Pass und Premium Pass parallel sichtbar; Premium aktuell bewusst gelockt
- Hero- und Fortschrittsbereich mit klarer Trennung von Free/Premium und Platzhalter fuer spaetere Loot-/Claim-Logik
- Direkter Navbar-Eintrag **Battle Pass** fuer schnelleren Zugriff (zusätzlich zum Shop-Link)

### Added - Phase 1: Core NP Currency Infrastructure

- **NP Currency Core**
  - New `currencies.notepunkte` field in user profiles to track NP balance
  - NP Shop section with 4 tiered packs (100/550/1500/5000 NP) with 10-25% bonuses
  - Stripe integration for NP purchases (checkout → webhook → balance update)
  - NP balance widget in shop page showing current user balance
  - **Enhanced NP Visualizations**: Improved NP pack cards with Zap icons, color-coded gradients, glowing effects, and animated lightning strikes
  
- **Premium Abo (Subscription System)**
  - New dedicated subscription page at `/shop/abo` with detailed feature overview
  - Monthly auto-renewing subscription (€4,99/month, anytime cancellation)
  - Premium Abo benefits: Premium Battle Pass + 500 NP monthly + exclusive cosmetics + early access + ad-free experience
  - Subscription card in shop with Trophy icon and gradient visualization
  - Comparison table (Free vs. Premium) on subscription page
  - Comprehensive FAQ section with common subscription questions
  - Seamless Stripe integration for subscription checkout

- **Bank-Level Security for NP Currency**
  - **Transactional Integrity**: All NP changes logged to `np_transactions` collection (immutable audit trail)
  - **Rate Limiting**: Max transactions/purchases per hour to prevent abuse
  - **Fraud Detection**: Real-time pattern analysis (daily limits, suspicious volumes, rapid transactions, chargebacks)
  - **Webhook Idempotency**: Prevention of duplicate payment processing via event ID tracking
  - **Balance Validation**: Atomic transactions prevent negative balances and overflow exploits
  - **Admin Audit Trail**: All manual adjustments logged to `np_audit_log` with admin identity & reason
  
- **Backend Utility Functions**
  - `atomicNPUpdate(userId, amount, type, options)` - Atomic transaction with fraud checking
  - `addNotepunkte(userId, amount)` - Safe NP credit
  - `subtractNotepunkte(userId, amount)` - Balance-validated NP deduction
  - `checkFraudPatterns(userId)` - Fraud score (0-100) + flags for suspicious activity
  - `validateWebhookIdempotency(paymentIntentId, eventId)` - Replay attack prevention
  - `checkRateLimit(userId, operationType, window)` - Rate limiting enforcement
  
- **Admin Monitoring Functions**
  - `adminReviewNPTransactions(userId)` - Full transaction history + fraud analysis
  - `adminAdjustNP(userId, amount, reason)` - Manual balance correction with audit logging
  - `adminGetNPMetrics(hours)` - System-wide NP metrics & fraud alerts
  - `adminExportNPTransactions(dateFrom, dateTo, type)` - Compliance export
  
- **Data Model Extensions**
  - New Collections: `np_transactions`, `stripe_webhook_log`, `rate_limits`, `np_audit_log`, `fraud_alerts`
  - Added `subscription` fields to Profile: `active`, `expiry_date`, `stripe_subscription_id`, `renewal_count`
  - Added `currencies` object with nested `notepunkte` balance field

- **Firestore Security Rules**
  - Cloud Functions have write access to `currencies` and `subscription` fields only
  - `np_transactions` readable by Admins and transaction owners only
  - `stripe_webhook_log` restricted to Admins and Cloud Functions
  - **Strict**: Users cannot directly modify NP balance (only via Cloud Functions)

- **Enhanced Webhook Processing**
  - Signature verification (Stripe security)
  - Replay attack prevention (idempotency keys)
  - Rate limiting checks per user
  - Input validation (amount bounds, user existence)
  - Comprehensive logging of all transactions
  - Automatic fraud flagging for review

### Security Measures

- ✅ **Immutable Audit Trail**: Every NP transaction logged with timestamp, source, admin verification
- ✅ **Atomic Transactions**: Firestore transactions prevent race conditions and inconsistent state
- ✅ **Fraud Scoring**: Algorithmic detection of suspicious patterns (daily limits, frequency, chargebacks, overlap)
- ✅ **Rate Limiting**: Per-user operation limits (max 20 purchases/hour, 5 refunds/hour, etc.)
- ✅ **Balance Constraints**: Max 10M NP per account, negative balance prevention
- ✅ **Replay Protection**: Webhook event deduplication via event ID tracking
- ✅ **Admin Access Control**: Only Main Admins can adjust NP; all changes logged with reason
- ✅ **Encryption**: Stripe webhook signatures verified; no unencrypted PII in logs

### Contributing Changes

- Modified Firestore Rules to add NP-specific security collections
- Added `functions/src/npSecurity.ts` - Core security module (fraud detection, atomic updates, logging)
- Added `functions/src/npAdmin.ts` - Admin monitoring & compliance functions
- Updated `functions/src/shop.ts` - Webhook now uses atomic update with fraud checks
- Updated `functions/src/users.ts` - New user profiles initialize with `currencies: {notepunkte: 0}`

### Breaking Changes

- None yet (Phase 1 is non-breaking, new features only)

### TODO

- [ ] Stripe Products setup: Create 4 NP packs in Stripe Dashboard, update Price IDs
- [ ] Stripe Webhook Secret configuration
- [ ] Test end-to-end NP purchase flow in staging
- [ ] Deploy to production with monitoring
- [ ] Phase 2: Battle Pass season infrastructure
- [ ] Phase 3: Battle Pass rewards and premium purchase flow
- [ ] Phase 4: Event NP integration
- [ ] Phase 5: Subscription system with auto-renewal
- [ ] Phase 6: Legal AGB/Datenschutz updates and UI polish

## [1.4.20] - 2026-04-10

### Changed

- **Global Skeleton Rollout**: Alle primären App-Seiten wurden auf ein konsistentes Skeleton-Ladesystem umgestellt. Die veralteten `Loader2`-Spinner wurden durch seiten-spezifische Skeletons ersetzt, die das finale Layout bereits während des Ladens widerspiegeln.
- **AppShell Root Skeleton**: Beim ersten Laden des Dashboards (Auth-Check) wird nun ein Skeleton der Sidebar und des Inhaltsbereichs angezeigt, anstatt eines leeren Bildschirms.
- **Seiten-Updates**: Skeletons wurden für folgende Bereiche implementiert/optimiert:
  - **News & News-Details**: Vollständige Artikel-Skeletons inkl. Bildplatzhalter.
  - **Kalender-Details**: Strukturierte Platzhalter für Event-Informationen.
  - **Profil & Profil-Details**: Platzhalter für Avatare und Info-Karten.
  - **Shop**: Granulare Skeletons für Produkt-Karten und Kategorien.
  - **Abstimmungen**: Poll-Karten-Skeletons anstelle von Spinnern.
  - **Gruppen**: Layout-Skeletons für die Sidebar-Chat-Liste und die Wall.
  - **Feedback**: Skeletons für die Liste der eingereichten Meldungen.
  - **Auth-Flow**: Register- und Login-Pages nutzen nun Skeletons in den Suspense-Fallbacks.

## [1.4.16] - 2026-04-10

### Changed

- **Skeleton Pulse Style**: Alle Skeletons wurden auf den neuen "Pulse style" umgestellt. Die `Skeleton.tsx` nutzt nun standardmäßig Tailwind 4 `animate-pulse` für eine ruhigere Lade-Animation anstelle des vorherigen Shimmers.
- **Granulare Dashboard-Fixtures**: Die manuellen `div`-Skeletons in den `fixture`-Props auf dem Dashboard (`src/app/page.tsx`) wurden durch die `<Skeleton />` Komponente ersetzt, um ein einheitliches Styling und konsistentes Pulsieren über alle Module hinweg sicherzustellen.
- **Boneyard Registry Sync**: Die Boneyard-Registry wurde um fehlende Einträge (`dashboard-todos`, `dashboard-events`, `dashboard-leaderboard`, `dashboard-poll`) erweitert, um die Framework-Integration zu stabilisieren.

### Fixed

- **Maintenance Skeleton**: Die manuelle Lade-Anzeige auf der Wartungsseite nutzt nun ebenfalls die globale `Skeleton`-Komponente.

## [1.4.15] - 2026-04-08

### Changed

- **Teacher Set Canonical ID**: Das Lehrer-Set nutzt jetzt server- und clientseitig `teacher_vol1` als kanonische Set-ID. `teachers_v1` bleibt als Legacy-Alias kompatibel.

### Added

- **Inventory Migration Function**: Neue Admin-Function `migrateTeacherVol1Inventory` migriert Karten-Keys in `user_teachers` von Legacy-Formaten (`teacherId`, `teachers_v1:teacherId`) auf `teacher_vol1:teacherId` und konsolidiert `profiles.booster_stats.inventory.teachers_v1` nach `teacher_vol1`.
- **Admin Migration Trigger**: Im Sammelkarten-Admin wurde ein zusätzlicher Button **"Migrate teacher_vol1"** ergänzt, der die neue Migration serverseitig ausführt und die aktualisierten Zähler (`user_teachers`, `profiles`, `rewritten keys`) direkt als Ergebnis meldet.

### Fixed

- **Secret-Rare Sticker-Kompatibilitaet**: Der Album-Nummern-Sticker hat fuer `black_shiny_holo` jetzt ein eigenes violett-dunkles Styling mit verbessertem Kontrast, damit die Nummer auch auf Secret-Rare Karten sauber lesbar bleibt.
- **Nummern-Sticker Redesign**: Die Album-Nummer erscheint jetzt als leichter Sticker-Patch in einer abgedunkelten Variante der jeweiligen Karten-Hintergrundfarbe (weniger dominant als ein schwarzer Block).
- **Kartenlabel Position/Format**: Das technische ID-Label oben wurde entfernt. Stattdessen wird jetzt die Album-Nummer (`001`, `002`, ...) unten links auf der Kartenfront angezeigt.
- **Pack-Kartenfarbe korrigiert**: Lehrer-Karten im Pack-Reveal verwenden wieder die Rarity-Farben statt der blauen Set-Default-Farbe. Damit erscheinen gezogene Karten wieder bunt wie im Album; Folien-Overlays bleiben unveraendert.
- **Pack-Reveal ID-Normalisierung**: Karten aus `teacher_vol1:<id>`/`teachers_v1:<id>` werden beim Oeffnen jetzt korrekt auf die bestehenden alten Lehrer-Karten aufgeloest. Dadurch erscheinen keine generischen blauen Platzhalterkarten mehr und NEW/Level-Logik bleibt konsistent.
- **Lehrer-Pack Quelle korrigiert**: Normale Lehrer-Booster ziehen jetzt wieder aus `settings/sammelkarten.loot_teachers` (alter Pool wie im Album), damit nicht die unerwuenschten neuen blauen Karten droppen.
- **Album nach teacher_vol1 Migration**: Das Lehrer-Album erkennt jetzt auch migrierte Karten-Keys (`teacher_vol1:<id>` und `teachers_v1:<id>`) zuverlässig als Besitzstatus. Dadurch erscheinen vorhandene Karten nach der Migration wieder korrekt im Album statt als leer.
- **Sammelkarten Kartenform**: Die Karten-Roots verwenden jetzt eine feste, kleinere Rundung im Stil einer Standard-Spielkarte statt der vorherigen pillenartigen Ecken.

## [1.4.14] - 2026-04-08

### Fixed

- **Lehrer Booster v1 Loot-Fix**: `teachers_v1` zieht serverseitig jetzt wieder strikt aus dem kanonischen V1-Set aus dem Code. Dynamische Set-Änderungen im Admin-Bereich überschreiben den V1-Drop-Pool nicht mehr, wodurch keine unerwarteten "neuen blauen" Karten mehr aus dem V1-Lehrerpack kommen.

## [1.4.13] - 2026-04-08

### Fixed

- **Sammelkarten Album Cards**: Gemeinsame Karten-Wrapper clippen jetzt wieder korrekt, damit die Ecken im Album und in allen Karten-Views rund bleiben statt verzerrt auszusehen.
- **Boneyard Build Capture**: Die Boneyard-Integration rendert im Build-Modus jetzt eine feste Preview der Landing- und Dashboard-Skeletons, damit der Crawl nicht mehr an Auth-/Firestore-Zuständen hängen bleibt und echte `.bones.json`-Snapshots erzeugen kann.
  - **AppShell.tsx**: Skip `isDashboardSubdomain` Logik während Build-Mode (`window.__BONEYARD_BUILD`), damit `localhost` nicht zur Dashboard-Auth-Umleitung führt
  - **src/app/page.tsx**: Dashboard-Auth-Redirect und Blank-Render-Guard deaktiviert im Build-Mode; alle 8 Named Skeletons erhalten deterministische Fixtures (landing-news, dashboard-funding, dashboard-news, dashboard-todos, dashboard-events, dashboard-leaderboard, dashboard-cards, dashboard-poll)
  - **src/components/ui/skeleton.tsx**: Fixture-Fallback entfernt, um nur explizite Fixtures zu akzeptieren
  - **package.json**: `boneyard:build`-Script auf zuverlässigen Single-Pass updatert: `boneyard-js build http://localhost:3000 http://dashboard.abi-planer-27.localhost:3000 --no-scan`
  - **Result**: 4 Skeletons erfolgreich captured (landing-news, dashboard-funding, dashboard-news, dashboard-cards) mit responsive Layouts an 6 Breakpoints, `.bones.json` + `registry.js` generiert

## [1.4.11] - 2026-04-08

### Fixed
- **Set-separierte Lootpools**: `support_vol_1` zieht jetzt strikt nur noch aus `support_v1` (100%). Damit können aus Support-Boostern keine Lehrer-Karten mehr droppen.

## [1.4.10] - 2026-04-08

### Changed
- **Sammelkarten Pack-Opening UI**: Die kleine Explosions-Animation beim Aufreißen eines Packs wurde entfernt, um den Öffnungsablauf ruhiger und cleaner zu machen.

## [1.4.9] - 2026-04-08

### Fixed
- **Cloud Functions CORS Fix**: Explizite Erlaubnis für lokale Subdomains (`*.localhost:3000`) in allen `onCall` Cloud Functions hinzugefügt, um CORS-Fehler bei der Migration und beim Öffnen von Packs in der lokalen Entwicklungsumgebung zu beheben.

## [1.4.8] - 2026-04-08

### Added
- **Manueller Migrations-Trigger**: Ein neuer Button "Migrate Inventory" im Sammelkarten-Admin-Dashboard erlaubt es Admins, ihr Booster-Inventar sofort manuell in das neue skalierbare System zu überführen, ohne einen Booster verbrauchen zu müssen.
- **Cloud Function `migrateBoosterStats`**: Neue serverseitige Logik für eine sichere, transaktionale Überführung der Booster-Bestände.

## [1.4.7] - 2026-04-08

### Added
- **Automatische Inventar-Migration**: Ein Hintergrundprozess wurde implementiert, der bestehende Booster-Guthaben aus den alten Datenfeldern (`extra_available`, `support_extra_available`) automatisch in das neue, skalierbare `inventory` Map-System überführt.
- **On-the-fly Konsolidierung**: Das Frontend zeigt nun die kombinierte Anzahl aus alten und neuen Beständen an, um einen nahtlosen Übergang ohne Datenverlust zu gewährleisten.

## [1.4.6] - 2026-04-08

### Added
- **Skalierbares Booster-Inventar**: Umstellung der Booster-Verwaltung auf ein Map-basiertes System (`booster_stats.inventory`). Dies erlaubt das einfache Hinzufügen beliebig vieler Booster-Sets in der Zukunft.
- **Robust Gifting**: Die Schenkungs-Logik wurde stabilisiert und nutzt nun primär das neue Inventar-System, was die Zuverlässigkeit bei Belohnungen erhöht.

### Fixed
- **Support Booster Sync**: Ein Problem wurde behoben, bei dem geschenkte Booster nicht sofort in der Packwahl auftauchten.

## [1.4.5] - 2026-04-08

### Fixed
- **Support Booster Sichtbarkeit**: Ein Fehler in der `availablePacks` Logik wurde behoben, der dazu führen konnte, dass Support-Booster nicht korrekt angezeigt wurden, wenn gleichzeitig Custom Packs vorhanden waren.
- **Custom Support Pack Visuals**: Custom Packs, die im Admin-Bereich mit dem Support-Set erstellt wurden, nutzen nun korrekt das grüne Emerald-Design anstelle des Standard-Lila.
- **Packwahl-Synchronisierung**: Die `packId` wird nun konsistent über die gesamte Queue-Kette gereicht, um sicherzustellen, dass die Auswahl-Ansicht (`/sammelkarten/packs`) immer das richtige Design anzeigt.

## [1.4.4] - 2026-04-08

### Fixed
- **Invisible/Stuck Loading Cards**: Fixed a critical issue where cards were showing as skeletons (stuck loading) when the static registry was empty.
- **Improved Card Renderer**: The `CardRenderer` now supports dynamic cards from Firestore by reconstructing metadata from `CardData` if the registry lookup fails.
- **Type Safety**: Extended `CardData` with an explicit `type` field to ensure correct layout selection (Teacher/Support) without registry dependency.

## [1.4.3] - 2026-04-08

### Added
- **Erweiterter Lehrer-Export**: Der CSV-Export beinhaltet nun auch Beschreibungen und Attacken.
- **JSON Backup**: Neue Funktion zum Exportieren der gesamten Lehrer-Registry als JSON-Datei für maximale Datentreue.

### Fixed
- **CSV Import Fix**: Der Import-Parser wurde stabilisiert und unterstützt nun auch das Einlesen von komplexen Feldern (Beschreibungen, Attacken) sowie korrekte CSV-Maskierung.

## [1.4.2] - 2026-04-08

### Added
- **Lehrer-Export**: Ein neuer Button im Sammelkarten-Admin-Dashboard erlaubt den Export aller Lehrer aus der Datenbank als CSV-Datei.

## [1.4.1] - 2026-04-08

### Fixed
- **Support-Booster in Packwahl**: Support-Booster werden nun korrekt in der dedizierten Packwahl-Ansicht (`/sammelkarten/packs`) angezeigt, inklusive des passenden Emerald-Designs und der korrekten Kartenanzahl-Beschriftung.

## [1.4.0] - 2026-04-08

### Changed
- **Landing Page Redesign**: Komplettes Redesign der Startseite mit Fokus auf Schüler. 
  - Neuer Hero-Bereich ("Macht euer Abi Legendär").
  - "Dual-Focus" Sektion zur klaren Trennung zwischen **Planern** (Orga-Tools) und **Sammlern** (Sammelkarten-Action).
  - Modernisiertes Bento-Grid mit schülerzentrierten Texten ("Cash im Griff", "Eure Stimme").
  - Immersive Sammelkarten-Sektion mit Gaming-Vibe und Raritäten-Highlights.
- **Header-Update**: Navigation wurde auf Aktions-Begriffe umgestellt ("Planen", "Sammeln", "Vorteile").
- **Visuals**: Erweiterte Nutzung von `framer-motion` für dynamische Stagger-Effekte und Hover-Glows.

### Fixed
- **Sammelkarten Build Error**: Fehlende `DEFAULT_TEACHERS` Konstante in `src/app/sammelkarten/_modules/constants.ts` wiederhergestellt.
- **Hook Type Error**: Destructuring von `getRemainingSupportBoosters` in `useSammelkartenGame` korrigiert.
- **Skeleton Type Error**: TypeScript-Fehler in `src/components/ui/skeleton.tsx` durch Default-Wert für `loading` behoben.

## [1.3.14] - 2026-04-08

### Changed
- **Boneyard Subdomain Support**: Das `boneyard:build` Skript wurde erweitert, um zusätzlich zur Haupt-Domain auch die Dashboard-Subdomain (`http://dashboard.abi-planer-27.localhost:3000`) zu scannen. Dies stellt sicher, dass alle Skeletons auch im Dashboard-Kontext korrekt generiert werden.

## [1.3.13] - 2026-04-08

### Added
- **Set-Aware Gifting**: In der Kommunikations-Zentrale (`/admin/send`) kann nun explizit ausgewählt werden, aus welchem Set (z.B. Lehrer v1 oder Support v1) die verschenkten Random-Packs stammen sollen.
- **Backend Set-Support**: Die `giftBoosterPack` Cloud Function unterstützt nun `packId` und schreibt Belohnungen korrekt dem jeweiligen Pool (z.B. `support_extra_available`) gut.

### Changed
- **Registry Cleanup**: Veraltete `DEFAULT_TEACHERS` Konstanten wurden vollständig entfernt. Das System nutzt nun ausschließlich die zentrale `CardRegistry`.
- **Default Teachers Removed**: Die Platzhalter-Lehrer (Max Mustermann, Erika Musterfrau) wurden aus der Registry gelöscht.
- **Migration Ready**: Die `mapToTeacherCardData` Utility wurde vereinfacht, um die Migration bestehender Lehrer-Daten zu erleichtern.

## [1.3.12] - 2026-04-08

### Added
- **Boneyard Skeleton Framework**: Integration des Boneyard-Frameworks zur automatischen Generierung von pixelgenauen Lade-Skeletten aus dem echten DOM.
- **Automated Registry**: Setup einer globalen Skeleton-Registry in `src/bones/` und Anbindung an den Root-Layout.
- **New build script**: `npm run boneyard:build` zum Snapshotten des UI-Layouts hinzugefügt.

### Changed
- **Skeleton Architecture**: Migration von `TeacherAlbum` und `CardRenderer` auf das Boneyard-Modell. Manuelle Skeleton-Platzhalter wurden durch den generativen Ansatz ersetzt, was Layout-Shifts eliminiert.
- **Unified Skeleton Component**: Die UI-Komponente `Skeleton` unterstützt nun sowohl den klassischen manuellen Modus als auch den neuen Boneyard-Wrapper via `name`-Prop.

## [1.3.11] - 2026-04-08

### Changed
- **Standardized Card Rounding**: Alle Karten-Komponenten (Lehrer, Support, Deck-Editor) sowie deren Lade-Skelette nutzen nun eine einheitliche Ecken-Abrundung von `10%`. Dies behebt das Problem, dass Skeletons in einigen Ansichten wie "Pillen" aussahen und sorgt für ein konsistentes Format, das echten Sammelkarten entspricht.
- **Improved Card Skeletons**: Die Lade-Skelette wurden weiter verfeinert, um exakt die Form der finalen Karten widerzuspiegeln.

## [1.3.10] - 2026-04-08

### Added
- **Support Booster Bonus-System**: Support Booster Packs werden nun automatisch als GRATIS Bonus beim Kauf von Booster-Bundles ab 10€ (Bundle 20+) gewährt.
- **Bundle-Boni**: 
    - 20er Bundle -> 1 Support Booster gratis.
    - 50er Bundle -> 4 Support Booster gratis.
    - 100er Bundle -> 8 Support Booster gratis.
- **Dynamic Pack Sizing**: Das System unterstützt nun unterschiedliche Kartenanzahlen pro Pack (Support Booster enthalten genau 1 Karte).

### Changed
- **Shop UI Update**: Booster-Bundles heben nun den enthaltenen Support-Karten-Bonus hervor.
- **Sammelkarten UI**: Support-Booster werden nun in einem zentrierten Layout mit angepasster Beschriftung präsentiert.
- **Backend Fulfillment**: Die Stripe-Webhook-Logik wurde erweitert, um den automatischen Versand von Bonus-Packs sicherzustellen.

## [1.3.10] - 2026-04-08

### Changed
- **Improved Album Skeletons**: Das Design der Lade-Skelette im Lehrer-Album wurde vollständig überarbeitet. Die alten, textbasierten "Loading..."-Platzhalter wurden durch modernere, an das Kartendesign angepasste Skelette mit Shimmer-Effekt ersetzt.
- **CardRenderer Skeleton**: Der `CardRenderer` nutzt nun ein detaillierteres Skelett, das die Struktur der Karte (Avatar, Name, Rarity) nachahmt, um einen weicheren Übergang beim Laden zu ermöglichen.
- **Consolidated Loading States**: Die Ladezustände im Album wurden vereinheitlicht, um ein ruhigeres UI-Erlebnis während des Datenabrufs zu gewährleisten.

## [1.3.9] - 2026-04-08

### Added
- **Global Card Integration**: Die bestehenden Lehrer-Karten wurden vollständig in das neue Registry-System integriert (jetzt 8 Lehrer-Karten in `teachers_v1`).
- **Registry-Aware Custom Packs**: Support-Karten können nun in der Kommunikations-Zentrale für Custom Packs ausgewählt werden.

### Changed
- **Update Kommunikations-Zentrale**: Das Admin-Interface für den Versand von Nachrichten und Belohnungen nutzt nun die zentrale `CardRegistry`.
- **Card Preview in Admin UI**: Beim Konfigurieren von Custom Pack Slots wird nun eine Live-Vorschau der gewählten Karte (Lehrer oder Support) angezeigt.
- **Unified ID Resolution**: Backend und Frontend nutzen nun die `CardRegistry` zur Validierung und Auflösung von Karten-IDs.
- **Trade Wizard Update**: Der `NewTradeWizard` unterstützt nun den Tausch aller Karten aus der Registry (inkl. Support-Karten).

## [1.3.8] - 2026-04-08

### Added
- **Modular Global Card System**: Eine neue datengesteuerte Architektur für Sammelkarten, die beliebige Sets und Kartentypen unterstützt.
- **Support-Karten**: Neuer Kartentyp mit aktiven/passiven Effekten (z.B. "Noten würfeln").
- **3D Dice Combat Log**: Animierter Würfelwurf (CSS 3D) für Support-Effekte mit Schadensberechnung.
- **Support Booster Pack Vol. 1**: Ein spezielles Pack, das Support-Karten und Lehrer kombiniert.
- **Zentrales Card-Registry**: Alle Karten werden nun über `setId:cardId` (z.B. `teachers_v1:max-mustermann`) identifiziert.
- **CardRenderer**: Eine intelligente UI-Komponente, die automatisch das richtige Layout (Lehrer vs. Support) wählt.
- **Entwickler-Dokumentation**: `docs/MODULAR_CARD_SYSTEM.md` für die Erweiterung des Systems.

### Changed
- Refactoring von `TeacherCard.tsx` zu einem modulareren `TeacherLayout`.
- Update der Shop- und Sammelkarten-Logik für gemischte Loot-Pools und gewichtete Sets.
- Migration der bestehenden Lehrer in das `teachers_v1` Set.
- `useUserTeachers` Hook unterstützt nun spezifische `packId`s beim Öffnen von Boostern.

## [1.3.7] - 2026-04-08

- **Feature (Combat System):** Implementierung einer 3D CSS Würfel-Animation und eines Kampf-Overlays.
    - **DiceRoller:** Eine 6-seitige Würfel-Komponente mit reinen CSS 3D-Transformationen und flüssigen Animationen via Framer Motion.
    - **CombatOverlay:** Ein animiertes Overlay für Kampf-Ereignisse, das den Würfelwurf visualisiert und den berechneten Schaden (Ergebnis × Multiplikator) anzeigt.
    - **Game-Feel:** Professionelle Animationen mit zufälligen Drehungen und weichem Einrasten auf der Zielseite.

## [1.3.6] - 2026-04-06

- **Fix (Cloud Functions):** Behebung von CORS- und Timeout-Fehlern in `fixLogNames`.
    *   **Performance:** Umstellung auf Batch-Abfragen (30 Profile pro Request) statt Einzelauslesung zur Vermeidung von Datenbank-Timeouts.
    *   **Robustheit:** Globaler Try-Catch-Block liefert nun aussagekräftige `HttpsError` an das Frontend zurück.
    *   **CORS:** Optimierung der Header-Verarbeitung für lokale Subdomänen-Aufrufe.

## [1.3.4] - 2026-04-06

- **Improvement (Admin Logs):** Vereinfachung der Log-Reparatur.
    *   **Funktion:** Die Reparatur alter Log-Einträge (`fixLogNames`) ist keine "Danger Action" mehr und kann sofort ausgeführt werden.
    *   **UI:** Ein neuer Button **"Namen reparieren"** wurde direkt im Header der Admin-Logs hinzugefügt, um "Unbekannt"-Einträge on-the-fly zu korrigieren.
    *   **Security:** Die Aktion bleibt weiterhin auf Administratoren beschränkt, erfordert aber keine 24h-Warteschlange mehr.

## [1.3.3] - 2026-04-06

- **Feature (Admin Logs):** Einführung einer Reparatur-Funktion für alte Log-Einträge.
    - **Backend:** Neue Cloud Function `fixLogNames` durchläuft rückwirkend die `logs`-Kollektion und pflegt fehlende Nutzernamen ein.
    - **Security:** Die Aktion wurde als "Danger Action" registriert und erfordert 2FA sowie eine 24h-Warteschlange zur Sicherheit.
    - **UI:** Neuer Button "Admin-Logs reparieren" in der `/admin/danger` Zone hinzugefügt.
    - **Ergebnis:** Bestehende "Unbekannt"-Einträge können nun automatisiert mit Klarnamen oder E-Mail-Adressen verknüpft werden.

## [1.3.2] - 2026-04-06

- **Fix (Admin Logs):** Korrektur der Nutzeranzeige in den Admin-Logs.
    - **Logging:** `logAction` fällt nun auf die E-Mail zurück, falls der `full_name` im Profil fehlt.
    - **Komponenten:** Diverse Modals (`AddEvent`, `EditNews`, `AddPoll`) und Hooks (`useGroupJoin`) übergeben nun konsistent den Klarnamen an das Logging-System.
    - **Polls:** Die Umfrage-Komponente (`PollList`) wurde um ein `userName`-Prop erweitert, um Abstimmungen präzise zuzuordnen.
    - **Ergebnis:** In `/admin/logs` wird nun der Name (oder die E-Mail) statt "Unbekannt" angezeigt.

## [1.3.1] - 2026-04-06

- **Fix (Domain-Routing):** Korrektur der Dashboard-Fallback-URL von `https://dashboard.abi-planer-27` auf `https://dashboard.abi-planer-27.de`.
    - **Global:** Alle Verweise in `src/lib/dashboard-url.ts`, `functions/src/trades.ts`, `INSTALL.md` und `CHANGELOG.md` korrigiert.
    - **Ergebnis:** Der Dashboard-Button auf der Landingpage leitet jetzt zuverlässig auf die korrekte Subdomain weiter.

## [1.3.0] - 2026-04-06

- **Major**: Version bump to 1.3.0 reflecting significant architectural and UI/UX updates.
- **Fixes**:
  - Corrected registration flow regression guard to support 5-step flow.
  - Resolved TypeScript errors in system analytics (type narrowing and Chart.js properties).
  - Fixed Next.js build error on Sammelkarten packs page (added Suspense boundary).
  - Fixed profile name display in quick actions.
  - Fixed build errors on profile and friends pages.
- **Features**:
  - New Friends page sections and improved access for viewers.
  - Improved email verification and change flow guidance.
  - Manual global inventory synchronization for Sammelkarten.
- **UX**: Refined Sammelkarten booster flow (keyboard support, improved "Next Pack" flow, cleaner UI).

## [1.2.64] - 2026-04-06

- **UX (Sammelkarten / Tastatur-Flow):** Die `Leertaste` oeffnet nach komplett umgedrehtem Single-Pack direkt das naechste Pack.
    - **Fix:** Kein Ruecksprung mehr zur Booster-Ansicht bei verfuegbaren Rest-Boostern.
    - **Ergebnis:** Tastaturbedienung ist jetzt konsistent mit dem neuen Continue-Flow.

## [1.2.63] - 2026-04-06

- **UX (Sammelkarten / Reveal-Fortsetzung):** "Naechstes Pack oeffnen" startet jetzt direkt das naechste Single-Pack.
    - **Fix:** Kein Zwischenschritt mehr zur Booster-Ansicht bei vorhandenem Restkontingent.
    - **Ergebnis:** Fluessigerer Continue-Flow beim nacheinander Oeffnen mehrerer Packs.

## [1.2.62] - 2026-04-06

- **UX (Sammelkarten / Reveal-Ansicht):** Der Rueckweg zur Booster-Ansicht sitzt nicht mehr als Overlay ueber den Karten.
    - **Neu:** "Zur Booster-Ansicht" erscheint jetzt als kleiner, textbasierter Footer-Button direkt unter "Naechstes Pack oeffnen".
    - **Ergebnis:** Weniger visuelle Ablenkung im Karten-Reveal bei unveraenderter Navigation.

## [1.2.61] - 2026-04-05

- **UX (Sammelkarten / Booster-Ansicht):** Der sichtbare Pack-Wechsel wurde aus dem Karten-Overlay herausgezogen und die Booster-Ansicht insgesamt entschlackt.
    - **Neu:** Der Pack-Wechsel sitzt jetzt unaufdringlich in der Kopfzeile statt direkt ueber der Karte.
    - **Neu:** Die Footer-Aktionen wurden dichter gruppiert und visuell leicht zurueckgenommen.
    - **Neu:** Die Pack-Auswahl startet jetzt mit einer Shop-Kachel als erstem Ziel, gefolgt von den verfuegbaren Packs.
    - **Ergebnis:** Weniger visuelles Rauschen im Booster-Flow bei unveraenderter Funktionalitaet.

## [1.2.60] - 2026-04-05

- **UI (Sammelkarten / Custom Pack Label):** Custom Packs verwenden jetzt dieselbe Karten-Beschriftung wie der normale Booster.
    - **Fix:** Auf der Auswahlseite und in der Öffnungsansicht steht jetzt ebenfalls "3 Lehrer Karten" statt einer eigenen Slot-Angabe.

## [1.2.59] - 2026-04-05

- **UI (Sammelkarten / Pack-Album):** Die Pack-Karten auf `/sammelkarten/packs` nutzen jetzt exakt denselben Booster-Look wie in der Öffnungsansicht.
    - **Fix:** Huelle, Top/Bottom-Flaechen, Label-Chip, Badge und Footer-Details wurden 1:1 auf den Auswahl-Flow gespiegelt.
    - **Neu:** Jedes Pack bleibt weiterhin eindeutig erkennbar ueber eine Beschriftung unter der Booster-Karte.

## [1.2.58] - 2026-04-05

- **UX (Sammelkarten / Pack-Auswahlseite):** Theming und Pack-Darstellung an den restlichen Sammelkarten-White-Look angepasst.
    - **Fix:** Die Seite `/sammelkarten/packs` verwendet jetzt kein dark-spezifisches Layout mehr und erscheint konsistent im hellen Design.
    - **Neu:** Jedes verfügbare Pack wird als visuelle Booster-Karte im Album-Stil angezeigt (statt rein textbasierter Listenzeile).
    - **Fix:** Die Auswahl eines Packs wird wieder zuverlässig per URL-Parameter an `/sammelkarten` übergeben und dort aktiv gesetzt.

## [1.2.57] - 2026-04-05

- **UX (Sammelkarten / Pack-Auswahl):** Die Pack-Auswahl wurde aus der Booster-Detailansicht in eine eigene Seite verschoben.
    - **Neu:** "Pack wechseln" bleibt sichtbar und fuehrt jetzt auf `/sammelkarten/packs` mit kompletter Liste aller verfuegbaren Packs.
    - **Neu:** Die Auswahlseite zeigt Standard- und Custom-Packs inkl. verbleibender Anzahl in einer separaten Uebersicht.
    - **Neu:** Nach Auswahl eines Packs wird zur Sammelkarten-Hauptseite zurueck navigiert und das gewaehlte Pack per URL-Parameter aktiviert.
    - **Unveraendert:** Die Booster-Detailansicht bleibt im bestehenden Look, inklusive Gesten-Aufriss.

## [1.2.56] - 2026-04-05

- **UX (Sammelkarten / Booster-Aufriss):** Einzelpacks werden jetzt per Gesten-Interaktion geoefnet statt per Klick.
    - **Neu:** Sichtbare gestrichelte Risslinie direkt auf dem Pack; oeffnen nur durch Ziehen von links nach rechts (Maus und Touch).
    - **Neu:** Ausloesung bei ca. 80% Fortschritt, bei fruehem Loslassen federt der Fortschritt weich auf 0 zurueck.
    - **Neu:** Explosionsimpuls an der Risskante beim Trigger, danach Reveal wie gewohnt.
    - **Neu:** Space-Bypass und Idle-Einzelpack-Button entfernt, damit der Single-Pack-Flow konsistent nur ueber Ziehen erfolgt.
    - **Unveraendert:** 10er-Pack-Oeffnung bleibt buttonbasiert.

- **UX (Sammelkarten / Pack-Auswahl):** Mehrere Pack-Typen laufen jetzt in einem 2-Stufen-Flow: zuerst Auswahl, danach Detailansicht.
    - **Neu:** Bei mehreren verfügbaren Packs startet die Seite mit einer Karussell-Auswahl.
    - **Neu:** Ein Klick auf das aktive Pack oeffnet die Detailansicht dieses Packs (statt sofortigem Oeffnen).
    - **Neu:** In der Detailansicht kann ueber "Pack wechseln" zur Karussell-Auswahl zurueckgekehrt werden.
    - **Unveraendert:** Die Detailansicht nutzt weiterhin den bestehenden Booster-Look; Custom Packs bleiben ein Recolor davon.

## [1.2.55] - 2026-04-05

- **UI (Sammelkarten / Booster-Design):** Die Pack-Ansicht nutzt wieder das alte zentrale Booster-Layout; Custom Packs sind nur ein Recolor davon.
    - **Neu:** Falls mehrere Pack-Arten vorhanden sind, gibt es nur noch eine kompakte Typ-Auswahl statt eines Karussells.
    - **Neu:** Der sichtbare Booster bleibt im alten Look, inklusive Öffnen-Animation und Button-Fluss.
    - **Neu:** Custom Packs übernehmen dieselbe Huelle, aber mit eigener Farbgebung und Bezeichnung.

## [1.2.54] - 2026-04-05

- **Fix (Admin / Benutzerverwaltung):** Der neue Gruppen-Popup-Trigger importiert jetzt das fehlende `Users`-Icon korrekt.
    - **Ergebnis:** Der Runtime-Fehler `Users is not defined` in der Admin-Benutzerverwaltung ist behoben.

## [1.2.53] - 2026-04-05

- **UI (Admin / Benutzerverwaltung):** Die Gruppenanzeige in der Tabelle und Mobilansicht wurde auf ein kompaktes Popover umgestellt.
    - **Neu:** Statt vieler Inline-Badges zeigt die Zelle jetzt eine kompakte Zusammenfassung mit Popover-Details.
    - **Neu:** Im Popover lassen sich bestehende Gruppen direkt entfernen und neue Gruppen weiterhin per Suchauswahl hinzufuegen.
    - **Ergebnis:** Weniger visuelles Rauschen in der Benutzerverwaltung bei gleicher Bearbeitbarkeit.

## [1.2.52] - 2026-04-05

- **Fix (Auth / Missing Profile Recovery):** Fehlende Profile werden jetzt ueber eine Callable Cloud Function wiederhergestellt statt per clientseitigem `setDoc`.
    - **Neu:** Der Auth-Flow wartet auf die serverseitige Profil-Erstellung und setzt das geladene Profil direkt aus der Function-Rueckgabe.
    - **Ergebnis:** Keine lokalen Firestore-Permission-Fehler mehr beim Bootstrap eines fehlenden Profils, und das Admin-Loading bleibt stabil.

- **Fix (Auth / Presence + Self-Delete):** Presence-Heartbeat startet erst nach geladenem Profil, und die Profil-Loeschung ist jetzt fuer den eigenen Account erlaubt.
    - **Neu:** Der Online-Status wird nicht mehr gegen ein noch fehlendes Profil geschrieben.
    - **Neu:** Der Profil-Delete-Flow fuer eingeloggte Nutzer passt jetzt zu den Firestore-Regeln, ohne die Main-Admin-Sperre aufzuweichen.

- **Fix (Admin UI / Picker Trigger):** Suchbare Kurs- und Gruppen-Picker nutzen jetzt Base UI `render` statt eines verschachtelten Buttons.
    - **Ergebnis:** Der Hydration-Warnhinweis wegen ungueltiger Button-Nesting ist beseitigt.

## [1.2.52] - 2026-04-05

- **Feature (Kommunikations-Zentrale / Custom Packs):** Admins koennen jetzt deterministische Custom Packs mit festen Slots verschenken (Position, Lehrer, Folie/Variante).
    - **Neu (Admin UI):** Neuer Modus "Custom Packs" in der Kommunikations-Zentrale mit Slot-Builder und optionalem Preset-Laden aus `settings/sammelkarten.custom_pack_presets`.
    - **Neu (Backend):** `giftBoosterPack` akzeptiert `customPackSlots`, validiert Lehrer gegen `loot_teachers` und legt pro Empfaenger eine persistente Queue unter `profiles/{uid}/custom_pack_queue` an.
    - **Neu (Open-Flow):** `openBooster` verarbeitet zuerst Eintraege aus der Custom-Pack-Queue deterministisch und fuellt optionale Luecken nur bei aktivem Random-Fill.
    - **Sicherheit:** Neue Firestore-Regel fuer `profiles/{uid}/custom_pack_queue` mit kompletter Client-Sperre (Manipulationsschutz).
    - **Audit:** Versand-Logs enthalten jetzt Custom-Pack-Metadaten.

## [1.2.51] - 2026-04-05

- **UI (Admin / Benutzerverwaltung):** Dropdowns fuer Kurs- und Gruppenzuweisungen auf suchbare Picker mit Scroll-Listen umgestellt.
    - **Neu:** Suchfeld in den Pickern fuer schnelle Treffer bei vielen Kursen/Gruppen.
    - **Neu:** Verbesserte Lesbarkeit durch Truncation + Tooltip bei langen Gruppennamen.
    - **Neu:** Massenaktionen nutzen ebenfalls suchbare Auswahl fuer Kurs/Planungsgruppe.
    - **Ergebnis:** Deutlich besseres Skalierungsverhalten und weniger unleserliche Menues bei grossen Datenmengen.

## [1.2.50] - 2026-04-05

- **Fix (ReferenceError):** Missing `cn` utility import in `DeckEditor.tsx` added.

## [1.2.49] - 2026-04-05

- **Mobile Optimization**: 
    - **Persistent Controls**: Card controls (Remove/Set Cover) are now always visible on mobile/touch devices to ensure usability without hover.
    - **Responsive Layouts**: Optimized the Deck Editor header and grids for small screens.
    - **Touch Targets**: Enlarged interaction areas for better mobile handling.

- **Fix (Admin System / Top-Aktionen Fallback):** Wenn die Analytics-API zwar erreichbar ist, aber leere Arrays liefert, werden die Log-Analysen jetzt clientseitig aus Firestore rekonstruiert.
    - **Neu:** Fallback-Berechnung fuer `top_actions`, `activity_timeline`, `section_usage` und `recent_actions` aus den letzten Logs.
    - **Ergebnis:** Karten wie "Top-Aktionen aus den Logs" und "Aktive Nutzung" bleiben befuellt statt "Noch keine Logs vorhanden".

- **UI (Admin System / Analytics Charts):** Die Karte "Was zuletzt getan wurde" wurde entfernt; die Analytics-Darstellung ist jetzt konsequent chartbasiert.
    - **Neu:** "Online-Session Dauer" als Balkendiagramm (Top 12 online Nutzer).
    - **Neu:** "Bereichsnutzung" als Balkendiagramm statt Listenansicht.
    - **Ergebnis:** Einheitlichere, kompaktere Visualisierung der System-Analytics.

- **Perf (Admin System / Daten aktualisieren):** Analytics-Fallback wird nach dem initialen Rendern im Hintergrund angereichert statt den gesamten Refresh zu blockieren.
    - **Neu:** Sofortige Anzeige der Basisdaten, danach asynchrone Rekonstruktion aus Firestore-Logs.
    - **Neu:** Chart.js-basierte Liniendiagramme (react-chartjs-2) fuer die Analytics-Karten mit Tooltips, Achsen und Flaechen-Fuellung.
    - **Ergebnis:** Spuerbar schnelleres "Daten aktualisieren" bei weiterhin detaillierten Analytics.

- **UI (Admin System / Diagrammtypen + Kartenstatistik):** Diagrammtypen an die gewuenschte Lesbarkeit angepasst und Kartenverteilung pro Nutzer ergaenzt.
    - **Neu:** "Top-Aktionen" und "Bereichsnutzung" als Balkendiagramme.
    - **Neu:** Statistik "Karten pro Nutzer" (Top 12) aus `user_teachers` inkl. Profilnamen.
    - **Ergebnis:** Bessere Vergleichbarkeit haeufiger Aktionen/Bereiche und transparente Kartenverteilung pro Account.

- **UI (Admin System / Balken-Sichtbarkeit):** Balkendiagramme wurden fuer Ausreisser-Verteilungen besser lesbar gemacht.
    - **Neu:** Horizontale Balken, dynamische Diagrammhoehe pro Anzahl Eintraege und `minBarLength` fuer kleine Werte.
    - **Ergebnis:** Alle Balken bleiben visuell erkennbar, auch wenn einzelne Kategorien deutlich dominieren.

## [1.2.48] - 2026-04-05

- **Fix (Hydration/DOM Nesting):** Behebung eines kritischen Hydration-Fehlers in der `DeckSelection`-Komponente durch Umstellung von `asChild` auf das korrekte `render`-Prop-Pattern für den `DropdownMenuTrigger`. Dies verhindert die ungültige Verschachtelung von Buttons im HTML.

## [1.2.47] - 2026-04-05


- **Fix (Admin System / Log Count Accuracy):** Das KPI "Log-Eintraege" faellt im Dashboard nicht mehr auf `0`, wenn Analytics-Fallbacks keine verwertbaren Count-Daten liefern.
    - **Neu:** Clientseitiger Firestore-Count-Fallback fuer `logs` mit Zeitfenster-Filter (`timestamp >= now - window_days`).
    - **Sicherheit:** Zaehlt weiterhin nur mit dem angemeldeten Admin-Account gemaess Firestore-Regeln.
    - **Ergebnis:** "Letzte X Tage" zeigt wieder reale Werte aus den vorhandenen Logs.

## [1.2.47] - 2026-04-05

- **Deck UI Overhaul**: 
    - **Integrated Controls**: Redesigned the card controls (Remove/Set Cover) to be more stylish and less "out of place" with a hover-based action bar.
    - **Full-Page Selection**: Moved card selection from a modal to a dedicated full-screen view for a better browsing experience.
    - **Search & Filter**: Fixed and optimized the search functionality in the card selection view.
    - **Cover Aesthetics**: Improved the "Cover" badge design with gradients and better positioning.

## [1.2.46] - 2026-04-05


- **Fix (Admin System / Analytics History-Fallback):** Bei fehlenden Analytics-Functions werden jetzt historische Daten direkt aus vergangenen Firestore-Logs aggregiert statt nur leerer Fallback-Werte.
    - **Neu:** Serverseitiger Analytics-Aggregator mit Admin-Token-Pruefung (`src/lib/adminSystemAnalytics.ts`).
    - **Betroffen:** `/api/admin/system/analytics` und `/admin/api/system/analytics`.
    - **Ergebnis:** Auch bei Function-`404` bleiben Timeline, Top-Aktionen, Bereichsnutzung und letzte Aktionen aus vorhandenen Logs verfuegbar.

## [1.2.46] - 2026-04-05

- **Deck System Finalized**: Integrated the `DeckSelectionModal` into the `DeckEditor`.
    - **Card Selection**: Users can now pick cards from their own inventory to fill their decks.
    - **Validation**: Added limit checks (max 10 cards) and uniqueness enforcement.
- **UI Refinement**: Relaxed the font tracking for deck and card titles to ensure better readability of spaces.
- **Performance**: Optimized deck state updates to prevent unnecessary re-renders.

## [1.2.45] - 2026-04-05


- **Fix (Admin System / Analytics Degradation):** Wenn Analytics-Upstream lokal nicht deployed ist (`404`), liefern die Analytics-Proxys jetzt ein valides leeres Fallback-Payload statt `502`.
    - **Betroffen:** `/api/admin/system/analytics` und `/admin/api/system/analytics`.
    - **Ergebnis:** Das Admin-System bleibt nutzbar, auch wenn nur Analytics fehlt.

- **Fix (Admin System / Partial Load):** Die Admin-System-Seite bricht nicht mehr komplett ab, wenn nur Analytics fehlschlaegt.
    - **Neu:** Stats sind weiterhin Pflicht; Analytics wird bei Fehlern auf einen lokalen Fallback gesetzt und als degradiert angezeigt.
    - **Ergebnis:** Keine komplette Fehlseite mehr bei isolierten Analytics-Ausfaellen.

## [1.2.50] - 2026-04-05

- **Fix (Admin System / Fallback-Haertung):** Admin-System-Proxys schalten bei fehlenden `...Http`-Functions jetzt serverseitig auf die callable-Endpunkte um.
    - **Betroffen:** `/api/admin/system/global-stats`, `/api/admin/system/analytics` sowie die Spiegelpfade unter `/admin/api/system/*`.
    - **Neu:** Bei Upstream-`404` auf `getGlobalStatsHttp`/`getSystemAnalyticsHttp` wird intern auf `getGlobalStats`/`getSystemAnalytics` mit callable-Payload (`{ data: {} }`) gewechselt.
    - **Ergebnis:** Kein browserseitiger Direct-Call als Rettungsweg mehr noetig; weniger CORS-Fehler bei `dashboard.*.localhost`.

- **Fix (Admin System / Client-Fallback):** Direkte Browser-Fallbacks auf Cloud Functions (HTTP + callable) aus der Admin-System-Seite entfernt.
    - **Neu:** Daten kommen ausschliesslich ueber lokale Next-API-Routen (same-origin).
    - **Ergebnis:** Keine zusaetzlichen CORS-Preflight-Fehler mehr durch clientseitige Cross-Origin-Fallbacks.

## [1.2.49] - 2026-04-05

- **Fix (Admin System / Local Dev CORS-Loop):** Proxy-Responses fuer Admin-System-Statistiken liefern bei Upstream-Fehlern jetzt konsistent `502` statt den Upstream-`404` durchzureichen.
    - **Betroffen:** `/api/admin/system/global-stats`, `/api/admin/system/analytics` sowie die Spiegelpfade unter `/admin/api/system/*`.
    - **Ursache:** Ein echter Upstream-`404` wurde vom Client als fehlende lokale Route interpretiert, wodurch der Browser auf direkte Cloud-Function-URLs (CORS-Block) gefallen ist.
    - **Ergebnis:** Kein falscher Routing-Fallback mehr bei vorhandener lokaler Route; stattdessen sauberer Wechsel auf Callable-Fallback innerhalb der App.

## [1.2.48] - 2026-04-05

- **Fix (Admin System / Local Dev Routing):** Fallback fuer Admin-System-API-Pfade ergaenzt, um 404 bei Host-/Routing-Sonderfaellen in der lokalen Dashboard-Subdomain abzufangen.
    - **Client:** `AdminSystemDashboard` versucht bei `404` auf `/api/admin/system/*` automatisch den zweiten internen Pfad `/admin/api/system/*`.
    - **Zusatz:** Wenn beide lokalen Pfade `404` liefern, wird direkt auf die Functions-HTTP-Endpunkte (`getGlobalStatsHttp`, `getSystemAnalyticsHttp`) gewechselt.
    - **Zusatz 2:** Falls diese HTTP-Endpunkte noch nicht deployed sind, faellt der Client final auf die bestehenden Callable-Funktionen (`getGlobalStats`, `getSystemAnalytics`) zurueck.
    - **Server:** Neue spiegelnde Route-Handler unter `/admin/api/system/global-stats` und `/admin/api/system/analytics` als lokaler Backup-Pfad.
    - **Ergebnis:** Stabileres Laden der Systemdaten auf `dashboard.*.localhost` auch bei inkonsistenter Dev-Routenauflosung.

## [1.2.47] - 2026-04-05

- **Fix (Admin System CORS):** Admin-Systemdaten werden jetzt über lokale API-Proxy-Routen geladen statt direkt per Browser-Callable-Request.
    - **Neu:** Serverseitige Proxy-Endpoints unter `/api/admin/system/global-stats` und `/api/admin/system/analytics`.
    - **Backend:** Neue HTTP-Funktionsvarianten `getGlobalStatsHttp` und `getSystemAnalyticsHttp` mit Bearer-Token-Validierung und Admin-Rollencheck.
    - **Ergebnis:** Kein Browser-Preflight-CORS-Block mehr im Dashboard-Subdomain-Setup (`*.localhost`).

- **Fix (Auth/Profile):** Fehlende Profildokumente werden beim Login automatisch mit sicheren Standardwerten angelegt.
    - **Ergebnis:** Der Laufzeitfehler `No profile found for user ...` wird bei neuen/inkonsistenten Accounts abgefangen.

- **Mobile UI (Admin System):** Das System Control Center wurde für kleine Viewports entschärft.
    - Header und Refresh-Button responsiver, bessere Zeilenumbrüche in KPI-Karten, und Online-User-Details auf Mobil in einer Spalte statt gequetschter 2-Spalten-Ansicht.

## [1.2.46] - 2026-04-05

- **Fix (Decks / Firestore Rules):** Berechtigungen für `user_decks` ergänzt, damit angemeldete Nutzer ihre eigenen Decks wieder lesen, anlegen, ändern und löschen können.
    - **Ursache:** Für die neue Deck-Collection fehlten dedizierte Firestore-Regeln, wodurch `Missing or insufficient permissions` im Client ausgelöst wurde.
    - **Sicherheit:** Zugriff bleibt strikt auf `request.auth.uid == userId` begrenzt.

- **Fix (Admin System / CORS):** Callable Functions für Trading + Admin-Analytics auf explizite CORS-Origin-Liste umgestellt.
    - **Betroffen:** `getSystemAnalytics`, `getGlobalStats` (sowie weitere Trade-Callables).
    - **Ergebnis:** Requests vom lokalen Dashboard-Subdomain-Setup (`*.localhost`) werden bei korrekter Deployment-Version nicht mehr durch Preflight-CORS blockiert.

## [1.2.45] - 2026-04-05

- **Navigation Update**: "Meine Decks" and "Kämpfe" are now part of the main navigation menu under Sammelkarten.
    - **Sidebar Integration**: Access your decks and the future battle system directly from the sidebar.
    - **Battles Placeholder**: Added a dedicated placeholder page for the upcoming "Karten-Kämpfe" feature.
    - **Header/Footer Actions**: Integrated "Decks" button into the Sammelkarten header and mobile footer for quicker access.

## [1.2.44] - 2026-04-05

- **Card Deck System**: Users can now create, edit, and delete decks consisting of exactly 10 cards.
    - **Deck Cover**: One card from each deck can be selected as the cover for visual representation.
    - **Inventory Integration**: Integrated deck management with user inventory, ensuring only owned cards are added.
    - **Resilience Logic**: Decks automatically reflect "Incomplete" status if cards are traded or missing (e.g., 9/10).
    - **UI Integration**: New "Meine Decks" view in the Sammelkarten section with a compact mobile-friendly grid.

## [1.2.45] - 2026-04-05

- **Analytics (System Control Center):** Das Admin-System-Center zeigt jetzt deutlich mehr Nutzungsdaten statt nur Basis-Status.
    - **Online-Verlauf:** Aktuell online aktive Nutzer werden mit Session-Dauer und zuletzt genutztem Bereich angezeigt.
    - **Logs:** Die letzten 7 Tage werden aus den Aktions-Logs ausgewertet, inklusive Top-Aktionen, Bereichsnutzung und jüngsten User-Aktionen.
    - **Charts:** Die Admin-Seite zeigt nun Balken fuer Tagesaktivitaet und haeufigste Aktionen.
    - **Datenquelle:** Nutzungsdauer und Presence basieren auf Profil-Daten; Aktionen und Inhalte werden aus den bestehenden Logs aggregiert.

## [1.2.42] - 2026-04-05

- **Fix (Gruppenchat Header):** Die Anzeige `x Nachrichten` im Chat-Header wurde durch `x online` ersetzt.
    - **Hub:** Zaehlt alle aktuell online aktiven, freigeschalteten Nutzer.
    - **Teamchat:** Zaehlt nur online aktive Mitglieder der jeweiligen Planungsgruppe.

## [1.2.41] - 2026-04-05

- **UX (Gruppen):** Der Seiten-Untertitel auf der Gruppen-Seite wurde entfernt.
- **UX (Chatliste):** In der Chatliste wird jetzt pro Chat die Anzahl online aktiver Mitglieder angezeigt statt Nachrichten-Vorschau.
- **Benachrichtigung (Navigation):** Der Gruppen-Tab zeigt jetzt einen roten Punkt bei neuen Nachrichten in Hub- oder eigenen Gruppen-Chats.
    - Grundlage ist `last_visited.gruppen` im Nutzerprofil; eigene Nachrichten loesen keinen Punkt aus.

## [1.2.40] - 2026-04-05

- **UX (Gruppenchat):** Chat-Ansicht weiter an Messenger-Verhalten angepasst.
    - **Header:** Die "Gruppen-Chats"-Pille wurde entfernt.
    - **Chatliste:** Untertitel in jeder Unterhaltung verfeinert (Vorschautext/Global-Hinweis), Sortierung bleibt neueste Nachricht oben inkl. Global-Chat.
    - **Bilder im Chat:** Gesendete Bilder haben abgerundete Ecken, aber keine Chat-Bubble-Border mehr.

## [1.2.39] - 2026-04-05

- **Fix (Gruppenchat Bilder):** Laufzeitwarnungen von `next/image` bei Chat-Bildern beseitigt.
    - **Wall-Anhänge:** Bildanzeige verwendet jetzt stabile intrinsische Maße (`width`/`height`) statt `fill` in instabilen Containern.
    - **Chatlisten-Thumbnail:** Mini-Vorschau rendert als natives `img`-Element, um Größenkonflikte in 20x20-Previews zu vermeiden.

## [1.2.38] - 2026-04-05

- **Fix (Gruppenchat Bildvorschau):** `next/image` akzeptiert jetzt Firebase-Storage-URLs aus `firebasestorage.googleapis.com`.
    - **Ursache:** Der Host war in der Next-Image-Konfiguration nicht freigeschaltet.
    - **Ergebnis:** Bilder aus Chat-Anhängen laden wieder ohne `next-image-unconfigured-host` Laufzeitfehler.

## [1.2.37] - 2026-04-05

- **Fix (Gruppenchat Uploads):** Storage-Berechtigungen fuer `group-media` angepasst, damit authentifizierte Nutzer Bilder/PDFs wieder hochladen koennen.
    - **Regeln:** Der fragil gewordene Firestore-Approval-Lookup in den Storage Rules wurde entfernt.
    - **Sicherheit bleibt aktiv:** Uploads bleiben auf max. 5MB und Dateitypen Bild/PDF begrenzt.

## [1.2.36] - 2026-04-05

- **UX (Gruppen):** Die Gruppen-Seite wurde auf eine chat-zentrierte Listenansicht umgestellt (Messenger-Stil statt Kachel-Layout).
    - **Chatliste:** Eigene Gruppen und der Global-Chat werden als einheitliche Liste angezeigt.
    - **Sortierung:** Der Chat mit der neuesten Nachricht steht immer ganz oben.
    - **Flow:** In Gruppenchats koennen direkt gruppenspezifische Todos und Termine erstellt werden.
- **Navigation (Menue):** Unter Planung gibt es jetzt nur noch einen einzigen Eintrag **Gruppen** statt separater Team/Hub-Tabs.

## [1.2.35] - 2026-04-05

- **UX (Gruppen, Todos, Kalender):** Gruppenspezifische Erstellung und einfachere Gruppenzuordnung erweitert.
    - **Gruppenseite:** In der Teamansicht kann jetzt neben Aufgaben auch direkt ein Termin fuer die aktive Gruppe erstellt werden.
    - **Termine:** Termine haben jetzt eine explizite Gruppenzuordnung (`assigned_to_group`), damit sie klar einem Team zuordenbar sind.
    - **Globale Dialoge:** Auf den globalen Seiten fuer Todos und Kalender wird beim Erstellen eine Gruppen-Vorauswahl gesetzt (erste eigene Gruppe), damit Zuordnungen schneller gehen.
    - **Sichtbarkeit:** Gruppenzuordnung und Gruppenerwaehnungen werden in Kalenderlisten und der Termin-Detailansicht als Badges angezeigt.

## [1.2.34] - 2026-04-03

- **Bugfix (Navigation):** Behebung einer Endlosschleife bei der Weiterleitung von der Startseite zum Login auf `localhost`.
    - Die automatische Dashboard-Erkennung wurde verfeinert, sodass auf Entwicklungsmaschinen (localhost/127.0.0.1) standardmäßig die Landingpage angezeigt wird, anstatt unaufgefordert zum Login weiterzuleiten.

## [1.2.33] - 2026-04-03

- **Registrierung (Erweiterung):** Die Kurswahl bei der Registrierung wurde um die Optionen "Lehrer" und "andere KlassenStufe" erweitert.
    - **Bedingte Schritte:** Bei Auswahl einer dieser Optionen wird ein zusätzlicher 4. Schritt eingeblendet.
    - **Lehrer-Disclaimer:** Information über die eingeschränkte Teilnahme an Abstimmungen bei vollem Inhaltszugriff.
    - **Andere Klassenstufe:** Disclaimer und Textfeld zur manuellen Eingabe der Klassenstufe, welche im Nutzerprofil als `class_name` gespeichert wird.
    - **UI-Anpassungen:** Dynamische Anpassung des Fortschrittsbalkens und der Schrittzähler (Schritt X/4 statt X/3) je nach Auswahl.

## [1.2.32] - 2026-04-03

- **UI Fix (Sammelkarten-Karusell):** Behebung von Darstellungsfehlern auf der Landingpage.
    - **Geister-Ecken:** Die Karten im Karussell haben nun korrekt abgerundete Ecken, was das Durchscheinen von rechteckigen Schatten in den Ecken verhindert.
    - **3D-Rendering:** Die `perspective`-Eigenschaft wurde auf die Container-Ebene verschoben, um Artefakte bei der 3D-Rotation der Karten zu beseitigen.
    - **Dekorative Ringe:** Die rotierenden Ringe ("Sol Rings") wurden optisch verfeinert, mit `will-change-transform` für flüssigere Animationen ausgestattet und in einem `overflow-hidden` Container stabilisiert.

## [1.2.31] - 2026-04-03

- **Landing (Kennzahlen):** Die Startseiten-Stats lesen jetzt aus der öffentlichen Firestore-Collection `public/landing_stats` statt aus einer Admin-API; eine geplante Cloud Function aktualisiert die Collection regelmäßig und die Landing triggert bei leerer Collection automatisch den öffentlichen Backfill-Endpunkt.

## [1.2.30] - 2026-04-03

- **UX (Header):** Das offizielle Projekt-Logo wurde nun auch im Header der Startseite (LandingHeader) integriert und ersetzt den bisherigen Platzhalter.

## [1.2.29] - 2026-04-03
- **UX (Startseite Cleanup):** Die Startseite wurde entschlackt, um den Fokus stärker auf die Kernvorteile zu lenken.
    - **Entfernung:** Die rein dekorative "Live Dashboard" Kachel im Hero-Bereich wurde entfernt.
    - **KPI-Sektion:** Der Statistik-Block (Nutzerzahlen, Kartenmenge etc.) wurde entfernt, um die Seite kompakter und funktionaler zu gestalten.
    - **Performance:** Nicht mehr benötigte Datenabfragen und Event-Listener für Landing-Statistiken wurden entfernt.

## [1.2.28] - 2026-04-03

### Fixed
- **Routing (Dashboard-Domain):** Alle zentralen Dashboard-Weiterleitungen wurden auf das neue Ziel `https://dashboard.abi-planer-27.de` umgestellt.
    - **Global:** Login-Redirect, Landing-CTA und News-Detail-CTA nutzen jetzt denselben Resolver statt verteilter Hardcodes.
    - **Konfigurierbar:** Über `NEXT_PUBLIC_DASHBOARD_URL` kann das Ziel pro Umgebung überschrieben werden.

## [1.2.27] - 2026-04-03

### Changed
- **News (Dashboard):** Kleine Updates und Beiträge ohne Titelbild werden in der globalen News-Liste jetzt deutlich kompakter dargestellt.
    - **Layout:** Kürzere Karten, kleinere Typografie und keine leere Bildfläche mehr für textlastige Einträge.

## [1.2.26] - 2026-04-03
- **UX (Startseite Refactoring):** Die Navigation auf der Startseite wurde grundlegend überarbeitet, um Nutzern einen direkteren Einblick in die Funktionen zu geben.
    - **Renaming:** Die `/promo` Seite wurde in `/zugang` umbenannt, um ihre Funktion als Account-Vergleich (Gäste vs. Mitglieder) klarer zu kommunizieren.
    - **Vorteile-System:** Neuer Bereich `/vorteile/` mit dedizierten, themenspezifischen Erklärungsseiten für alle Kernfunktionen.
    - **Spezialisierte Seiten:** Einführung von Einzelseiten für Finanzen, Gruppen, Abstimmungen, Kalender und Sammelkarten (TCG).
    - **Landing-Integration:** Alle "Details ansehen" Links auf der Startseite führen nun direkt zur jeweiligen Funktionsbeschreibung statt zur allgemeinen Vergleichsseite.
    - **Hero-Update:** Der Button "Funktionen prüfen" leitet nun auf die neue Vorteile-Übersicht.

## [1.2.21] - 2026-04-02


### Fixed
- **Landing (Sammelkarten-Sektion):** Der große Kartenwerbe-Abschnitt auf der Landing verwendet jetzt Theme-abhängige Flächen, Glows und Typografie statt im Light Mode dunkel zu bleiben.

## [1.2.25] - 2026-04-03

### Changed
- **UX (Sammelkarten-Werbung):** Die Kartenwerbung passt sich jetzt an das aktuelle Theme an statt einen festen Dark-Mode-Look zu erzwingen.
    - **Light/Dark:** Hintergründe, Glows, Textfarben, Badges und CTA-Kontraste reagieren jetzt auf das aktive Theme.

## [1.2.24] - 2026-04-03

### Fixed
- **Landing (Framer Motion Typing):** Die Hero-Variant-Definition wurde vereinfacht, damit die aktuelle TypeScript-Konfiguration sie ohne Fehler akzeptiert.

## [1.2.23] - 2026-04-03

### Fixed
- **Landing (Motion Types):** Die Hero-Variants sind jetzt explizit typisiert, damit der TypeScript-Checker die Animationen korrekt akzeptiert.

## [1.2.22] - 2026-04-03

### Changed
- **Routing (Local Dev):** Die vorherige `dashboard=1`-Fallback-Logik wurde aus Root-, News- und Shell-Erkennung entfernt; lokale Dashboard-Ziele laufen jetzt nur noch über Subdomains.

### Fixed
- **Landing (Framer Motion):** Die Hero-Animation nutzt jetzt einen kompatiblen `ease`-Wert, damit der TypeScript-Check sauber durchläuft.

## [1.2.21] - 2026-04-03

### Changed
- **Copy (Landing & Public Pages):** Umfassende Überarbeitung der Texte auf der Startseite und den öffentlichen Seiten für einen professionelleren, funktionalen Ton.
  - **Entfernung von Buzzwords:** "Next-Gen" und "Professional Edition" wurden durch klare, beschreibende Begriffe ersetzt.
  - **Tonalität:** Verzicht auf "trashige" Wortspiele und übertriebenen Hype zugunsten einer verlässlichen und strukturierten Kommunikation.
  - **Sammelkarten:** Umbenennung von "Booster Drops" zu "Karten-Pakete" und "Shiny-Varianten" zu "Seltene Editionen" für bessere Verständlichkeit.
  - **Promo-Seite:** Klarere Kommunikation der Zugangs-Logik zwischen öffentlichem Bereich und geschütztem Dashboard.

## [1.2.20] - 2026-04-03


### Changed
- **Local Dev (Dashboard-Ziel):** Lokale Weiterleitungen aus Landing/Login/News-CTA nutzen jetzt bevorzugt die Dashboard-Subdomain mit identischem Port (z. B. `http://dashboard.abi-planer-27.de.localhost:3000`).
    - **Konsistenz:** Einheitliches Verhalten für `*.localhost`, `localhost` und `127.0.0.1` im lokalen Routing.

## [1.2.20] - 2026-04-03

### Fixed
- **Local Dev (Landing -> Dashboard):** Der Dashboard-Button auf der Landing nutzt lokal jetzt einen stabilen Fallback über `/?dashboard=1` statt erzwungenem Subdomain-Wechsel.
    - **Robustheit:** Funktioniert auch dann, wenn lokal nur ein einzelner Host läuft und `dashboard.*.localhost` nicht erreichbar ist.
    - **Konsistenz:** AppShell, Root-Mode-Erkennung (`/`, News, News-Detail) und Login-Redirect berücksichtigen den lokalen Dashboard-Modus einheitlich.

## [1.2.19] - 2026-04-03

### Fixed
- **Landing (Dashboard-CTA/Local Dev):** Der Dashboard-Button im Landing-Header behandelt jetzt auch `*.localhost` als lokale Entwicklungsumgebung.
    - **Fix:** Statt auf unerreichbare Hosts wie `dashboard.abi-planer-27.de.localhost` zu springen, wird jetzt korrekt auf `localhost` mit gleichem Port weitergeleitet.

## [1.2.18] - 2026-04-03

### Fixed
- **UI (Button/asChild):** Der zentrale Button fängt `asChild` jetzt korrekt intern ab und gibt das Prop nicht mehr an DOM-Elemente weiter.
    - **Ergebnis:** Die React-Warnung `React does not recognize the asChild prop on a DOM element` tritt nicht mehr auf.
- **Dev Console (System Messages):** Der Diagnose-Log beim Mounten des `SystemMessageProvider` wurde entfernt.
- **Dev Console (AdSense):** Das AdSense-Script wird auf `localhost` und `127.0.0.1` nicht mehr injiziert, um unnötige lokale Netzwerk-Fehler zu vermeiden.

## [1.2.17] - 2026-04-03

### Changed
- **Auth (Login Redirect):** Nach erfolgreicher Anmeldung (inkl. 2FA) leitet die Login-Seite jetzt explizit auf `https://dashboard.abi-planer-27.de` weiter.
    - **Konsistenz:** Gilt für Login ohne 2FA, Login mit 2FA und den Fallback-Fall bei fehlendem Profil.
    - **Dev-Flow:** Auf `localhost` und `127.0.0.1` bleibt die Weiterleitung lokal auf `/`, damit die Entwicklung unverändert funktioniert.

## [1.2.16] - 2026-04-02

### Changed
- **UX (Startseite Refresh):** Vollständige Integration des ABI Planer Brandings und interaktiver Elemente.
  - **Brand Colors:** Konsequente Nutzung des Markengrüns (`#7DD200`) für Headlines, interaktive Komponenten und visuelle Akzente.
  - **Interaktive Features:** Einbau von `framer-motion` für Scroll-Reveals, Hover-Effekte in einem Bento-Grid-Layout und einen globalen Scroll-Fortschrittsbalken.
  - **Visuals:** Hinzufügen von subtilen Glow-Effekten und Glasmorphismus-Karten für ein lebendiges, modernes Look-and-Feel.
  - **Struktur:** Konsolidierung der Landing- und Dashboard-Logik in einer hochperformanten Struktur.

## [1.2.15] - 2026-04-02

### Changed
- **UX (Promo Seite):** Kompletter Rewrite der Vorteils-Seite zur Klärung der Zugangs-Logik.
  - **Strikte Trennung:** Klare visuelle Unterscheidung zwischen öffentlichem "Besucher-Modus" und geschütztem "Dashboard-Zugang".
  - **Kein Gast-Dashboard:** Die irreführende Option "Ohne Konto zum Dashboard" wurde entfernt, da das Dashboard einen verifizierten Account erfordert.
  - **Interaktive Elemente:** Integration von `framer-motion` für flüssige Einblend-Animationen und Hover-Effekte.
  - **Branding:** Konsequente Nutzung des ABI Planer Grüns (`#7DD200`) und des professionellen Icon-Sets.
  - **Security Focus:** Hinzufügen eines Hinweises zur manuellen Freischaltung durch Admins zur Wahrung der Privatsphäre.

## [1.2.14] - 2026-04-02

### Changed
- **UX (Public News):** Eigene News-Ansicht für die öffentliche Startseite implementiert.
  - **Landing mode:** Erkennt automatisch, ob die News auf der Hauptdomain aufgerufen werden und zeigt ein professionelles, luftiges Layout mit dem neuen `LandingHeader`.
  - **Navigation:** Die News-Links auf der Startseite führen nun zu dieser neuen, optimierten Ansicht statt zur Dashboard-Version.
  - **Detailansicht:** Auch die Einzelansicht von News-Beiträgen wurde für die Startseite professionalisiert (breiteres Layout, SaaS-Stil).
- **Layout (Landing Header):** Der professionelle Sticky-Header wurde in eine eigene Komponente (`LandingHeader`) extrahiert, um ihn seitenübergreifend auf der öffentlichen Domain zu nutzen.
- **AppShell:** Die globale App-Hülle wurde optimiert, um öffentliche Routen auf der Hauptdomain korrekt ohne Dashboard-Sidebar darzustellen.

## [1.2.13] - 2026-04-02

### Changed
- **UX (Startseite/Branding):** Umfassender Relaunch der Startseite für einen professionellen "Enterprise-SaaS"-Look.
  - **Sticky Header:** Neuer, mitscrollender Header mit Backdrop-Blur, Logo-Animation und kontextsensitiven CTAs.
  - **Modernes Hero-Design:** Animierter Gradient-Text, subtile Hintergrund-Effekte (Grid, Blurs) und klare Value Proposition.
  - **Optimierte Sektionen:** Abwechslungsreiche Layouts (alternierende Features, Full-Width Highlights) statt repetitiver Kachelwände.
  - **Bessere Theme-Unterstützung:** Vollständige Integration von Light/Dark-Mode mit harmonischen Farbübergängen und verbesserter Lesbarkeit.
  - **Animationen:** Hinzufügen von Scroll-basierten Parallax-Effekten und Einblend-Animationen für ein dynamisches Erlebnis.
- **I18n (Umlaute):** Systemweite Korrektur von ASCII-Ersetzungen (ae, oe, ue) hin zu korrekten deutschen Umlauten (ä, ö, ü) in allen wichtigen User-Interfaces.

## [1.2.12] - 2026-03-31
    - **Wirkung:** Klare Trennung zwischen oeffentlichem Einstieg und produktiver Dashboard-Subdomain wird visuell und inhaltlich staerker kommuniziert.

- **UX (Strikte Trennung Landing/Dashboard):** Hauptdomain und Dashboard verhalten sich jetzt wie zwei getrennte Oberflächen.
    - **Landing ohne Popups:** Auf `abi-planer-27.de/` werden keine System-Popups/Banner mehr eingeblendet.
    - **Wartung isoliert:** Wartungspausen beeinflussen die Landing nicht mehr.
    - **Landing-Inhalte:** Lehrersammelkarten-Werbung und aktuelle News sind jetzt direkt auf der Landing sichtbar.
    - **Login-Pflicht Dashboard:** Ohne Konto kommt man nicht mehr ins Dashboard; nicht angemeldete Nutzer werden auf Login geleitet.

- **UX (Landing/Promo):** Die Seitenrollen sind jetzt klar getrennt und visuell aufgewertet.
    - **/zugang:** Das frühere Account-Vergleichsdesign wurde zurückgebracht.
    - **Hauptdomain-Root:** Die Startseite auf `abi-planer-27.de/` wurde ausgebaut und als eigenständiger Einstieg verbessert.
    - **Navigation:** CTA-Buttons führen konsistent zur Dashboard-Subdomain oder zu Login/Registrierung.

- **UX (Domain-Aufteilung):** Root-Routing ist jetzt klar nach Host getrennt.
    - **Hauptdomain:** `abi-planer-27.de/` zeigt die Startseite.
    - **Dashboard-Subdomain:** `dashboard.abi-planer-27.de` (und `app.`) zeigt direkt das Dashboard.
    - **Promo bleibt Promo:** `/zugang` bleibt als Account-Vergleich bestehen und springt bei "Zum Dashboard" auf die Dashboard-Subdomain.

- **UX (Navigation):** Mehrere Seiten haben ihre rein erklärenden Intro-Subtitles entfernt, damit die Kopfbereiche knapper bleiben.

- **UX (Typografie):** Die Brandfarbe beeinflusst Zahlen jetzt nicht mehr direkt.
    - **Zahlen:** Numerische Werte bleiben neutral und nutzen wieder die reguläre Textfarbe oder eine passende Statusfarbe.
    - **Akzente:** Brandfarbe bleibt für Labels, Flächen, Icons und Hervorhebungen erhalten.

- **UX (Subdomains):** Die Startseite-Logik unterscheidet jetzt zwischen Hauptdomain und Dashboard-Subdomains.
    - **Root-Flow:** `dashboard.` und `app.`-Hosts überspringen die Erstbesucher-Umleitung zur Startseite.
    - **Setup-Hinweis:** Das Subdomain-Routing ist dokumentiert; DNS und Custom Domain müssen zusätzlich beim Hosting-Anbieter eingerichtet werden.

- **UX (Shop/Checkout):** Der Shop nutzt jetzt einen gemischten Flow: Spendenartikel öffnen wieder das Bestätigungs-Modal mit Kurszuordnung und optionalem Namen, Packbundles gehen direkt zu Stripe.

- **UX (Startseite):** Erstbesucher landen jetzt auf einer dedizierten Einstiegseite, bevor sie ins Dashboard wechseln.
    - **Root-Flow:** Die Startseite prüft beim ersten anonymen Besuch ein lokales Flag und leitet dann auf [src/app/zugang/page.tsx](src/app/zugang/page.tsx) um.
    - **Landing-Erlebnis:** Die Promo-Seite ist jetzt eine echte Startseite mit Hero, Feature-Überblick und klaren Einstiegspunkten.
    - **Navigation:** Login- und Registrieren-Seiten führen jetzt zurück zur Startseite statt direkt ins Dashboard.

- **UX (Navigation):** Quick Actions in der Navbar koennen jetzt angepinnt und entfernt werden.
    - **Persistenz:** Angepinnte Eintraege bleiben in der gespeicherten Reihenfolge erhalten; entfernte Eintraege werden nicht direkt wieder in die Liste gezogen.
    - **UI:** Die Schnellzugriffe haben eine farbigere Darstellung und zeigen den Pin-Status direkt an.
- **UX (Branding):** Die neue Akzentfarbe `#7DD200` ist jetzt zentral als Brand-Token in [src/app/globals.css](src/app/globals.css) hinterlegt.
    - **Verwendung:** Dashboard, Finanzseite und Funding-Widget nutzen die Brandfarbe jetzt fuer Hervorhebungen, Karten und Statusanzeige.
- **Fix (Finanzen/Viewer):** Erwartete Ticketverkaeufe lassen sich fuer Viewer und andere nicht-berechtigte Rollen nicht mehr bearbeiten.
    - **UI-Schutz:** Das Eingabefeld wird nur noch fuer Rollen mit Schreibrechten angezeigt; ansonsten erscheint ein Read-only-Wert.
    - **Logik:** Das Update-Handling bleibt auf berechtigte Rollen begrenzt, damit kein schreibender Fallback mehr greift.

- **Refactor (Sammelkarten/SRP):** Die Seite [src/app/sammelkarten/page.tsx](src/app/sammelkarten/page.tsx) wurde nach Single-Responsibility in eigenständige Module aufgeteilt.
    - **Datenabfragen:** Firestore-Listener und Countdown-Logik wurden nach [src/app/sammelkarten/_modules/hooks/useSammelkartenConfig.ts](src/app/sammelkarten/_modules/hooks/useSammelkartenConfig.ts) verschoben.
    - **State-Management:** Pack-Flow, Tastatursteuerung und Reveal-State liegen jetzt in [src/app/sammelkarten/_modules/hooks/useSammelkartenGame.ts](src/app/sammelkarten/_modules/hooks/useSammelkartenGame.ts).
    - **Berechnungen/Utils:** Wahrscheinlichkeiten, Card-Mapping und Ergebnisaufbereitung wurden in dedizierte Utility-Dateien ausgelagert.
    - **UI-Bausteine:** Header, Pack-Stage und Reveal-Bereiche wurden in fokussierte Komponenten extrahiert, ohne Verhaltensänderung.

- **UX (Freunde/Mobile):** Der Bereichs-Toggle auf der Freunde-Seite ist auf kleinen Displays jetzt besser lesbar.
    - **Fix:** Tab-Buttons erlauben mobil Zeilenumbruch statt gequetschter Einzeilen-Texte, dadurch überlagern sich Labels nicht mehr.
- **UX (Quick Actions):** Profil-Quick-Actions zeigen jetzt den Namen des geöffneten Profils statt der UID.
    - **Nachladung:** Bereits gespeicherte Quick-Actions werden beim Laden aufgelöst, damit alte UID-Einträge automatisch ersetzt werden.
- **UX (Wartung/Admin):** Während aktiver Wartungspausen sehen Admins jetzt app-weit ein Hinweisbanner, dass der Wartungsmodus aktiv ist.
- **Fix (Sammelkarten/Limit):** Das kostenlose Tageskontingent wird wieder strikt begrenzt; verpasste Tage erzeugen keine zusätzlichen Gratis-Packs mehr.
    - **Root Cause:** Die bisherige Carryover-Logik addierte bei `openBooster` zusätzliche Tagespacks und erlaubte dadurch >2 kostenlose Packs pro Tag.
    - **Konsistenz:** Frontend-Anzeige und Backend-Validierung verwenden jetzt dieselbe strikte Berechnung (Tageskontingent + explizite `extra_available`-Packs).

## [1.2.12] - 2026-04-02

- **Fix (Trading/Permissions):** Das Starten eines Tauschs läuft jetzt ausschließlich über die Cloud Function `sendTradeOffer`.

    - **Client-Sicherheit:** Der frühere Firestore-Fallback im Browser wurde entfernt, damit der Trade-Start nicht mehr an gesperrten Direktwrites auf `card_trades` und `notifications` scheitert.
    - **Root Cause:** Die serverseitige Validierung bleibt erhalten, während der Client keinen ungeschützten Schreibpfad mehr nutzt.


## [1.2.11] - 2026-04-02

- **Fix (Migration):** Die Firestore-Migrationsskripte verwenden jetzt explizit die projektweite `abi-data`-Datenbank.
    - **Hierarchische Gruppen:** `scripts/migrate_to_hierarchical_groups.ts` schreibt und liest nicht mehr gegen die Default-Datenbank.
    - **Card Settings:** `scripts/migrate_card_settings.ts` wurde auf dieselbe Datenbank-Instanz ausgerichtet, damit Admin-Migrationen konsistent laufen.
    - **Projektkontext:** Beide Skripte setzen jetzt auch die Firebase-Projekt-ID explizit, damit `ts-node` nicht an fehlenden lokalen ADC-Metadaten scheitert.
- **Fix (Firestore Permissions):** `settings/features` ist jetzt öffentlich lesbar, damit globale Client-Listener nicht mehr mit `Missing or insufficient permissions` fehlschlagen.
- **Feature (Trading/Viewer):** Viewer können jetzt die Sammelkarten-Konfig und das Album ebenfalls laden, damit der Tauschfluss nicht mehr an den bisherigen Approval-Guards hängt.
- **Wording (Rollen):** Die Nutzertexte unterscheiden jetzt klar zwischen "Gast" ohne Konto und "Zuschauer" mit Konto.


## [1.2.10] - 2026-04-01
- **Trading (Regeln):** `black_shiny_holo` (Secret Rare) ist jetzt explizit nicht mehr tradebar.
    - **Backend-Schutz:** Die Cloud-Function-Validierung blockiert Secret-Rare-Varianten serverseitig.
    - **UI-Schutz:** Die Folien-Auswahl fuer neue Trades zeigt nur noch tradebare Varianten (`normal`, `holo`, `shiny`).
- **Trading (Auswahlalbum):** Die Zielkarten-Auswahl zeigt jetzt Artcards und wechselt beim Klick auf die Speccard.
 - **Trading (Qualitaet):** Zielkarten werden im Auswahlalbum jetzt nach Seltenheit absteigend sortiert.
 - **Trading (Sicherheit):** Beim Senden von Angeboten/Gegenangeboten wird serverseitig geprueft, dass die angebotene Karte wirklich im eigenen Inventar liegt.
 - **Trading (Klarstellung):** `mythic` ist wieder regulär tauschbar; gesperrt bleibt nur `iconic` (plus Secret Rare Variante).
 - **Trading (Anfrage):** Wunschkarten duerfen weiterhin Karten sein, die man selbst noch nicht gezogen hat.
 - **Trading (UI):** `iconic`-Karten werden im Anfragealbum nicht mehr angezeigt.
 - **Trading (Dev-Stabilitaet):** Bei CORS-Problemen auf `getFriendsWithCard` nutzt das Frontend automatisch einen Firestore-Fallback fuer die Freundesliste.
 - **Trading (Mobile):** Der gesamte Tausch-Flow ist auf kleine Displays kompakter geworden, mit einspaltigen Kartenrastern und schmaleren Containern.


## [1.2.09] - 2026-04-01
- **UX (Trading):** Neuer Tausch laeuft jetzt ueber eine eigene Seite statt ueber ein Modal.
    - **Navigation:** `Neuer Tausch` leitet direkt auf `/sammelkarten/tausch/neu` weiter.
    - **Auswahl:** Auf der neuen Seite gibt es ein kompaktes Album mit allen Lehrer-Karten und ein separates Dropdown fuer die Folien-Variante.


## [1.2.08] - 2026-04-01
- **UX (Trading):** Der erste Schritt im Tausch-Modal ist jetzt deutlich leichter und schneller.
    - **Selektion:** Lehrer und Folie werden ueber zwei Dropdowns festgelegt statt ueber die vorherige schwere Kartenansicht.
    - **Performance:** Die Auswahl reduziert das Rendern grosser Listen und macht den Einstieg in den Tausch spuerbar fluessiger.


## [1.2.07] - 2026-04-01
- **Fix (Sammelkarten/Trading):** Die Tausch-Sperre nutzt jetzt den echten Kartenbestand statt eines stale Profile-Caches.
    - **UI:** Die Trade-Seite liest die Anzahl direkt aus dem Inventar (`user_teachers`) und zeigt keine falschen `0 Karten`-Meldungen mehr an.
    - **Backend:** Die Tausch-Validierung prüft denselben Inventarbestand serverseitig und gleicht den Profil-Cache bei Bedarf nach.


## [1.2.06] - 2026-04-01
- **UX (Navigation):** Quick Actions in der Navbar bleiben jetzt ueber Browser-Sessions hinweg erhalten.
    - **Persistence:** Die zuletzt genutzten Navigationsziele werden pro Nutzer im `localStorage` gespeichert und nach dem erneuten Login wiederhergestellt.
    - **Stabilitaet:** Beim ersten Laden wird die gespeicherte Liste sauber rehydriert, ohne den initialen Zustand zu ueberschreiben.


## [1.2.05] - 2026-04-01
- **Fix (Database):** Hinzufügen des fehlenden zusammengesetzten Firestore-Indexes für `card_trades`.
    - Behebt den `FirebaseError` beim Laden der aktiven und vergangenen Tauschgeschäfte durch Optimierung der Abfragen (`members` array-contains + `status` + `updatedAt` desc).


## [1.2.04] - 2026-04-01
- **UX (Accessibility):** Behebung von Textkontrast-Problemen im System Control Center und auf der Wartungsseite.
    - **Maintenance Mode:** Optimierung der Farbschemata (`text-red-700`, `text-amber-700`) für bessere Lesbarkeit auf hellen Hintergründen gemäß WCAG-Prinzipien.
    - **Admin Dashboard:** Verbesserung der visuellen Hierarchie und Kontraste bei kritischen Feature-Toggles im Admin-Bereich.


## [1.2.03] - 2026-04-01
- **UX (Gruppensystem Redesign):** Komplette optische Überarbeitung des Gruppensystems für ein konsistentes Premium-Design.
    - **Branding:** Einführung von High-Impact Gradient-Headern und 3D-Effekten, die an das Dashboard und die Finanzseite angelehnt sind.
    - **Glassmorphism:** Systemweite Anwendung von `backdrop-blur-xl` und `bg-background/60` für eine moderne, luftige Ästhetik.
    - **Layout:** Optimierung der Grid-Systeme und Abstände (`rounded-[2.5rem]`) für bessere Lesbarkeit und Struktur.
    - **Chat-UI:** Überarbeitung der `GroupWall` mit modernen Message-Bubbles, verbesserten Hover-Zuständen und intuitiverer Navigation.
    - **Empty States:** Liebevoll gestaltete Platzhalter mit Lucide-Icons zur besseren Nutzerführung in leeren Gruppen.


## [1.2.02] - 2026-04-01
- **Fix (Security):** Behebung von "Missing or insufficient permissions" Fehlern in der Trade-Moderation und den Danger-Logs.
    - **Firestore Rules:** Ergänzung fehlender Sicherheitsregeln für die Kollektionen `card_trades`, `danger_logs` und `audit_archives`.
    - **Admin Access:** Sicherstellung, dass Administratoren vollen Lesezugriff auf alle Tauschvorgänge und System-Logs zur Moderation haben.
    - **User Privacy:** Implementierung von granularem Lesezugriff für Nutzer auf ihre eigenen `card_trades`, während andere Tauschvorgänge geschützt bleiben.


## [1.2.01] - 2026-04-01
- **Fix (Cloud Functions):** Kritische Behebung von "Firebase internal" und CORS Fehlern in `getGlobalStats` und anderen Tausch-Funktionen.
    - **Database Refactoring:** Umstellung aller betroffenen Funktionen auf die projekt-spezifische `abi-data` Datenbank-Instanz.
    - **CORS Support:** Aktivierung von expliziter CORS-Konfiguration für v2 onCall Funktionen, um Blockaden beim Aufruf von `localhost` zu vermeiden.
    - **Error Logging:** Implementierung von serverseitigem Error-Logging für Admin-Aggregations-Stats zur schnelleren Diagnose.
- **Improvement (Dashboard):** Einführung von Aktivitäts-Tracking für das Dashboard.
    - **Live-Stats:** Nutzerbesuche auf dem Dashboard werden nun alle 5 Minuten erfasst, um akkurate "Online-Nutzer" Statistiken im Admin-Bereich zu ermöglichen.
    - **Performance:** Throttling der Schreibzugriffe auf 5-Minuten-Intervalle zur Schonung des Firestore-Kontingents.


## [1.2.00] - 2026-04-01
- **Feature (Gruppensystem Upgrade):** Umfassende Überarbeitung des Gruppensystems von einer statischen Liste zu einem dynamischen Kollaborations-Hub.
    - **UI Refactor:** Modularisierung der Gruppenseite durch Einführung von `GroupNav` und `GroupContent` für eine bessere Wartbarkeit und ein flüssigeres Nutzungserlebnis.
    - **Threading:** Einführung von 1-stufigem Message-Nesting (Antwort-Funktion), um Diskussionen innerhalb von Gruppen übersichtlicher zu gestalten.
    - **Rich Media:** Vollständige Unterstützung für Bild- und PDF-Anhänge in Gruppennachrichten inklusive Vorschaubildern und sicherem Download.
    - **Read-Tracking:** Automatische Erfassung gelesener Nachrichten, damit Nutzer sofort sehen, welche Diskussionen neu für sie sind.
    - **Onboarding:** Neuer 'Open Joining' Mechanismus, der es Schülern erlaubt, öffentlichen Planungsgruppen selbstständig beizutreten.
    - **Cloud Integration:** Neue Cloud Function `groupMessages` für zuverlässige Benachrichtigungen bei neuen Antworten in abonnierten Threads.


## [1.1.00] - 2026-04-01
- **Feature (Sammelkarten):** Einführung eines komplexen Tausch-Systems für Freunde.
    - **Trading-Zentrum:** Neue Seite zum Verwalten von aktiven und vergangenen Tauschvorgängen.
    - **Multi-Step Wizard:** Benutzerfreundlicher Prozess zum Finden von Tauschpartnern und Erstellen von Angeboten.
    - **Verhandlungs-Logik:** Unterstützung von Gegenangeboten (bis zu 3 Runden pro Trade).
    - **Sicherheit & Balancing:** 
        - Mindesthürde von 100 Karten zur Teilnahme.
        - Strikter Rarity & Foil Match (1-zu-1 Tausch gleicher Seltenheit und Folierung).
        - Täglicher Limit von 3 erfolgreichen Tauschen pro Nutzer.
        - Ausschluss von Iconic und Secret Rare Karten zum Werterhalt.
    - **Admin-Tools:** Neue Moderations-Seite für Administratoren zur Überwachung aller Tauschvorgänge.
    - **Atomicity:** Alle Tauschvorgänge sind durch Firestore-Transaktionen gegen Kartenverlust oder -duplizierung geschützt.


## [1.0.95] - 2026-04-01
- **Security (Auth):** 2FA-Verifizierung wird nun für 30 Tage gespeichert (statt nur pro Sitzung), um die Benutzererfahrung zu verbessern.
    - **Persistence:** Speicherung der Verifizierung in `localStorage` mit Zeitstempel-Prüfung.
    - **Sicherheit:** Der Status wird bei manuellem Logout oder Timeout weiterhin zuverlässig gelöscht.
- **UX (Freunde):** Die Freundesliste ist nun sortierbar.
    - **Sortierung:** Neue Optionen für Name (A-Z, Z-A) und Hinzufügedatum (Neueste, Älteste).
    - **Integration:** Das Sortier-Dropdown wurde direkt in die neue Filterleiste integriert.


## [1.0.94] - 2026-04-01
- **UX (Freunde):** Neue Filterleiste für die bestehende Freundesliste hinzugefügt.
    - **Suche:** Textsuche nach Namen und E-Mails direkt in der Freundesliste möglich.
    - **Kategorien:** Filterung nach Kurs/Klasse über ein Dropdown-Menü integriert.
    - **Zurücksetzen:** Ein "Filter löschen"-Button erlaubt das schnelle Zurückkehren zur vollständigen Liste.
    - **Feedback:** Elegante Anzeige von Suchergebnissen und Hinweis bei leeren Filtertreffern.


## [1.0.93] - 2026-04-01
- **UX (Freunde):** Freunde-Seite auf eine kompakte Discovery-Ansicht umgebaut.
    - **Suchen-Tab:** Der Button `Freunde hinzufügen` wechselt jetzt direkt in den neuen Toggle-Bereich `Suchen` statt ein Modal zu oeffnen.
    - **Suche:** Ergebnisse werden nur nach aktiver Eingabe angezeigt (Name, Kurs, Gruppe, E-Mail), um die UI leichtgewichtig zu halten.
    - **Debounce:** Suche reagiert mit bis zu 1 Sekunde Verzoegerung nach Tasteneingaben, um Lastspitzen zu reduzieren.
    - **Bestehende Freunde:** In der Suche werden bereits befreundete Nutzer ebenfalls angezeigt, aber immer am Ende der Trefferliste und als `Schon befreundet` markiert.
    - **Mobile:** Toggle auf kleinen Displays fuer bessere Lesbarkeit und Touch-Bedienung als 2x2 Grid optimiert, inklusive kompakterer Abstaende.
    - **Vorschlaege:** Empfehlungen priorisieren jetzt gleichen Kurs, gleiche Gruppen und das Freundesnetzwerk und zeigen nur relevante Treffer.
    - **UI-Detail:** Die Lupe wurde bei `Vorgeschlagen` durch ein passenderes Vorschlags-Icon ersetzt.
- **Fix (Admin/System):** `Switch is changing from uncontrolled to controlled` Warnung im System-Dashboard behoben.
    - **Stabilisierung:** `ToggleRow` normalisiert `enabled` auf einen festen Boolean (`isEnabled`), sodass der Switch durchgehend kontrolliert bleibt.
- **Fix (Cloud Functions/CORS):** `getGlobalStats` Aufruf aus Local Dev (`localhost:3000`) wird nicht mehr durch fehlende CORS-Preflight-Antwort blockiert.
    - **Functions v2:** Globale Options um `invoker: "public"` erweitert, damit Browser-Callable Requests die Function erreichen koennen.


## [1.0.92] - 2026-04-01
- **UX (Freunde):** Oben auf der Freunde-Seite ein Toggle zwischen `Freunde`, `Vorgeschlagen` und `Einladungen` ergaenzt.
    - **Schnellzugriff:** Ein prominenter `Freunde hinzufügen`-Button springt direkt in die Vorschlaege.
    - **Layout:** Die Seite zeigt je nach Auswahl nur die jeweils relevante Ansicht statt alle Bereiche gleichzeitig.


## [1.0.91] - 2026-04-01
- **Bugfix (Build):** Syntax- und Type-Errors in Profil-Seiten behoben, die den Build verhinderten.
    - **Profil (Public):** Syntax-Fehler in `handleFriendAction` behoben und fehlendes `return` sowie `Button`-Tag ergaenzt.
    - **Profil (Main):** Fehlende `CardDescription` Importe in `src/app/profil/page.tsx` und `src/app/profil/[id]/page.tsx` ergaenzt.
    - **Freunde:** Type-Mismatch in `applySearch` onClick Handler in `src/app/profil/freunde/page.tsx` korrigiert.
- **Feature (Freunde):** Freundesystem fuer `viewer` freigeschaltet.
    - **Rules:** `friend_requests`/`friendships` Create nicht mehr an `is_approved` gebunden, sondern an Authentifizierung.
    - **UI/Hook:** Approval-Gates in Freundesystem-Ansichten entfernt, damit angemeldete Viewer Anfragen senden, annehmen und verwalten koennen.

## [1.0.90] - 2026-04-01
- **Feature (Freundesystem):** Grundlage fuer spaeteren Kartentausch als echtes Beziehungsmodell eingefuehrt.
    - **Friend Requests:** Nutzer koennen Freundschaftsanfragen senden, annehmen, ablehnen und zurueckziehen.
    - **Friendships:** Bestaetigte Freundschaften werden in einer eigenen Firestore-Collection gespeichert und sind fuer beide Seiten sichtbar.
    - **Profil-Integration:** Auf dem eigenen Profil gibt es jetzt einen Einstieg in die Freundeverwaltung, auf fremden Profilen direkte Freundschaftsaktionen.
    - **Navigation:** Der Bereich `Freunde` ist in der Konto-Navigation sichtbar und fuehrt zur neuen Uebersichtsseite.
- **Firestore (Security):** Neue Regeln fuer `friend_requests` und `friendships` ergaenzt.
    - **Sicherheit:** Nur beteiligte Nutzer koennen ihre Anfragen und Freundschaften lesen oder bearbeiten.
    - **Acceptance Flow:** Freundschaftsbeziehungen koennen nur auf Basis einer bestehenden Anfrage angelegt werden.

## [1.0.89] - 2026-04-01
- **UX (Einstellungen):** Interne Seitentoggles entfernt und durch eine klarere Abschnitts-Navigation ersetzt.
    - **Kein Tab-Umschalten mehr:** `Allgemein`, `Konto & Boni` und `Verwaltung` sind jetzt als durchgehende, logisch sortierte Abschnitte aufgebaut.
    - **Schnellzugriff oben:** Direkte Sprung-Buttons zu `Profil`, `Darstellung`, `Feedback`, `Boni`, `Konto` sowie Admin-Bereichen.
    - **Bessere Auffindbarkeit:** Alle Optionen sind auf einer Seite sichtbar statt hinter Tabs versteckt.
- **Testing (Navigation):** Regressions-Test fuer den Menue-Pfad zu `Einstellungen` ergaenzt.
    - **Automatisiert:** `scripts/regression-guard.mjs` prueft die Menuestruktur (`Konto` -> `Einstellungen`) in der Navbar.
    - **Manuell:** `testing/TESTING_CHECKLIST.md` enthaelt einen expliziten Testfall fuer den Klickpfad bis `/einstellungen`.
- **UX (Navigation):** Unter-Unter-Menues wurden wieder entfernt.
    - **Struktur:** Sidebar bleibt bei maximal 2 Ebenen fuer bessere Uebersicht (`Konto` -> `Einstellungen`).
- **Fix (Navigation):** Beim Klick auf `Einstellungen` bleibt das uebergeordnete Menue `Konto` nun geoeffnet.
    - **Ursache behoben:** Submenu-Toggle setzt nicht mehr alle anderen offenen Menues zurueck.
- **UX (Navigation):** Menueverhalten wieder auf exklusiv gestellt.
    - **Einfachere Orientierung:** Es ist immer nur ein Menueabschnitt gleichzeitig geoeffnet.

## [1.0.88] - 2026-04-01
- **Feature (Navigation):** Neue `QuickActions` in der Menueleiste mit den letzten bis zu 3 besuchten Seiten.
    - **Verlauf oben:** Die aktuelle Seite steht immer oben, darunter die vorherigen Seiten (max. 3 Eintraege).
    - **Kontextsensitiv:** Seiten mit Query-Parametern (z. B. Sammelkarten-Views) werden als eigene QuickAction beruecksichtigt.
    - **Mobile + Desktop:** QuickActions erscheinen sowohl im mobilen Drawer als auch in der Desktop-Seitenleiste oberhalb der normalen Navigation.
    - **Stabile Hierarchie:** Aufruf ueber QuickActions oeffnet Seiten direkt, ohne die bestehende QuickAction-Reihenfolge umzubauen.
    - **Kompakter Aufbau:** Menuepunkte und Unterpunkte sind enger gesetzt, um vertikal Platz zu sparen.
    - **Bessere Scanbarkeit:** Navigation ist in klare Bereiche (`Arbeitsbereiche`, `Konto & Hilfe`, `Admin`) gegliedert; der `QuickActions`-Titel wurde entfernt.

## [1.0.87] - 2026-04-01
- **UX (Navigation):** Menueleiste neu strukturiert, damit wichtige Bereiche schneller auffindbar sind.
    - **Konto als Hauptpunkt:** `Profil` und `Einstellungen` sind jetzt in einer eigenen Kategorie `Konto` statt unter `Support` versteckt.
    - **Hilfe klar getrennt:** `Hilfe & Info` und `Feedback geben` wurden in eine eigene Hauptkategorie `Hilfe` verschoben.
    - **Aufgeraeumt:** Doppelter Hilfelink in der Hauptnavigation entfernt, aktive Menuezustaende an die neue Struktur angepasst.

## [1.0.86] - 2026-04-01
- **UX (Finanzen/Dashboard):** Kurs-Ranking bewusst vereinfacht (cleaner Listenstil).
    - **Layout:** Keine Trennstriche und keine zusaetzlichen Kurs-Kacheln pro Eintrag.
    - **Look:** Ruhige, reduzierte Reihen mit dezentem Hover statt Box-Optik.
    - **Loading State:** Skeleton-Ansicht auf denselben minimalistischen Stil angepasst.

## [1.0.85] - 2026-04-01
- **Fix (Feedback Privacy):** Toggles `Anonym posten` und `Privat senden` greifen wieder korrekt.
    - **Frontend Role Gate:** `viewer` wird auf der Feedback-Seite nicht mehr als privilegierte Rolle behandelt und sieht damit keine privaten Eintraege mehr.
    - **Firestore Rules:** Pauschales Leserecht fuer `viewer` auf `feedback` entfernt.
    - **Resultat:** Private Eintraege sind nur noch fuer Ersteller und Planer/Admins sichtbar, anonyme Eintraege bleiben fuer normale Nutzer anonym.
- **Fix (Sammelkarten UI):** Speccards fuer `IKONISCH` und `Secret Rare` nutzen jetzt kontrastreiche helle Schrift auf dunklem Hintergrund.
    - **Kontrastlogik:** `iconic` wird in `TeacherSpecCard` als Dark-Theme behandelt (wie bereits bei der Art-Karte).
    - **Lesbarkeit:** Header, Attacken, Beschreibung und Seltenheitssymbol bleiben auf dunklen Karten klar lesbar.
- **UX (Karten Detail-View):** Animationen und Navigation im Detail-Modal verbessert.
    - **Flip Animation:** Wechsel zwischen Art-Card und Spec-Card erfolgt als klare 180-Grad-Drehung.
    - **Swipe Logik:** Wischrichtung ist jetzt konsistent zur Bewegungsrichtung beim Kartenwechsel.
    - **Ansicht beibehalten:** Beim Wischen zur naechsten/vorherigen Karte bleibt die aktuelle Ansicht (`Spec` oder `Art`) erhalten.
    - **Spec-Swipe Fix:** Wenn `Spec` aktiv ist, erscheint die naechste Karte direkt in der Spec-Ansicht ohne zusaetzliche Nach-Drehung.
    - **Entry Fix:** Einlauf-/Auslaufrichtung beim Swipe wurde fuer `next/prev` eindeutig und stabilisiert.
    - **Tempo:** Swipe-Transition verkuerzt (schnellerer Kartenwechsel).
- **Balancing/UX (Sammelkarten):** Globales Maximum fuer Angriffe auf 2 gesetzt.
    - **Rendering:** Speccards zeigen hoechstens 2 Angriffe.
    - **Admin/Edit & Vorschlaege:** Formulare erlauben und beschriften nur noch 1-2 Angriffe.
- **Admin (Sammelkarten Manager):** Neuer Tab `Ideen-Labor` fuer die Auslese eingereichter Kartenvorschlaege.
    - **Data Source:** Live-Auslese aus Firestore-Collection `card_proposals`.
    - **Uebersicht:** Status-Badges, HP, Beschreibung, bis zu 2 Angriffe, Autor und Datum werden pro Vorschlag angezeigt.
- **Fix (Firestore Permissions):** Regeln fuer `card_proposals` ergaenzt.
    - **Create:** Verifizierte Nutzer duerfen eigene Vorschlaege als `pending` erstellen.
    - **Read:** Planer/Admin lesen alle Vorschlaege; Nutzer nur die eigenen.
    - **Moderation:** Update/Delete nur durch Planer/Admin.
- **Feature (Ideen-Labor Moderation):** Vorschlaege koennen im Sammelkarten-Manager angenommen oder abgelehnt werden.
    - **Accept Flow:** Beim Annehmen werden automatisch 2 Booster als Belohnung an den Ersteller gutgeschrieben.
    - **Automation:** Vorschlag-Status, Admin-Notiz, Belohnung und Nutzer-Benachrichtigung werden serverseitig ueber `moderateCardProposal` verarbeitet.
    - **Safety:** Nur `pending` Vorschlaege sind moderierbar, doppelte Belohnungen sind ausgeschlossen.

## [1.0.84] - 2026-04-01
- **Feature (Sammelkarten Admin):** Lehrer-Bearbeitungsansicht im Karten-Manager um neue Kurz-Aktionen erweitert.
    - **Speich.:** Speichert nur die Lehrer-Änderungen.
    - **Speich. + Alb-:** Speichert und entfernt danach die Lehrer-Karten aus allen Alben (ohne Kompensation).
    - **Speich. + Alb- + Komp:** Speichert und entfernt danach aus allen Alben (mit Kompensation).
    - **Nur Alb-:** Entfernt nur aus allen Alben (ohne Speichern).
- **Backend (Cloud Function):** `removeTeacherCards` unterstützt jetzt optionales Entfernen ohne Kompensation über den Parameter `compensate`.
- **Fix (Admin Actions):** `Speich. + Alb-` triggert keine Seltenheits-Entschädigung mehr im Hintergrund und bleibt damit strikt ohne Kompensation.
- **Fix (Admin Actions):** `Speich.` ändert Lehrer-Daten nun still ohne Inventar-Eingriffe (kein Löschen, keine Kompensation).
- **Fix (Cloud Functions):** Stabilisierung von `removeTeacherCards`/`validateAndFixRarities` gegen `INTERNAL`-Batch-Fehler bei fehlenden Profil-Dokumenten (kompensierende Writes laufen nun fehlertolerant via Merge-Set).
- **UX (Mismatch Preview):** Überarbeitetes, größeres und mobiles Vorschau-Modal mit scanbarer, standardmäßig eingeklappter Nutzerliste, roten/grünen Summen je Nutzer sowie abwählbaren Schülern.
- **Execution Filter:** `validateAndFixRarities` unterstützt jetzt eine Nutzer-Auswahl (`targetUserIds`), sodass nur markierte Schüler verarbeitet werden.
- **Compensation Update:** Kompensation wird nun pro betroffenem Nutzer aus der Gesamtsumme der entfernten Karten berechnet: `Math.ceil(total_removed_cards / 3)`.
- **User Transparency:** Betroffene Nutzer erhalten eine klarere Übersicht mit Gesamtverlust, berechneter Kompensation und Detailliste der entfernten Karten.
- **Copy Fix (Lernsax Vorlage):** E-Mail-Beispiele wurden auf das gewünschte Muster `nachname.vorname@hgr-web.lernsax.de` korrigiert (Register, Login, Passwort-Reset, Hilfe).
- **Verification UX:** Im Verifizierungs-Banner werden Nutzer jetzt explizit aufgefordert, ihre E-Mail zu prüfen und können sie bei Bedarf direkt ändern (inkl. Bestätigungs-Mail an die neue Adresse).
- **Admin Cleanup (Sammelkarten):** Neue Funktion `syncOpenedPacksToInventory` synchronisiert `booster_stats.total_opened` pro Nutzer mit dem Inventar über `ceil(total_cards / 3)`.
- **Legacy Cleanup:** `cleanupLegacyTeachersVoted` entfernt jetzt beide veralteten Profilfelder `teachers_voted` und `rated_teachers` aus allen Nutzerprofilen.
- **Admin UI:** Neue Buttons `Sync Packs` und `Cleanup Legacy` im Karten-Manager für beide Aufräumaktionen.

## [1.0.83] - 2026-03-31
- **Feature (Sammelkarten Management):** Entfernung des Besitz-Limits-Systems und Einführung eines neuen Button-basierten Kartenverwaltungssystems.
    - **Card Removal:** Neue Admin-Funktion zur gezielten Entfernung aller Karten eines Lehrers aus allen Nutzer-Inventaren.
    - **Smart Compensation:** Betroffene Nutzer erhalten faire Entschädigung basierend auf Duplikaten: Math.ceil(duplicate_count / 3) Booster-Packs.
    - **Rarity Validation:** Neue Funktion zur Validierung und Bereinigung von Rarity-Mismatches in allen Nutzer-Alben.
    - **Deprecation:** Entfernung des alten `per_user_card_limits` Systems. Neue, flexible Admin-Kontrolle ersetzt starre Limits.
    - **Admin UX:** Neuer "Blitz"-Button (⚡) in der Lehrerliste ermöglicht schnelle, sichere Kartenverwaltung mit Bestätigung und detailliertem Feedback.
    - **Logging:** Vollständige Audit-Logs zeigen betroffene Nutzer, entfernte Karten und verteilte Kompensation.

## [1.0.82] - 2026-03-31
- **Fix (News Detail Page):** Behebung eines Build-Fehlers durch einen fehlenden Import von `useSystemMessage`.
    - **TypeScript Safety:** Die News-Detailseite kann nun wieder fehlerfrei gebaut werden.

## [1.0.81] - 2026-03-31
- **Fix (Maintenance Page):** Behebung eines kritischen Hydration-Fehlers durch verschachtelte HTML-Links.
    - **DOM Structure:** Die News-Vorschau auf der Wartungsseite nutzt nun eine bereinigte Text-Vorschau anstelle von gerendertem Markdown, um unzulässige Link-in-Link Verschachtelungen zu vermeiden.

## [1.0.80] - 2026-03-31
- **Ops (Update):** Vorbereitung des Systems für die neuen Sammelkarten-Features (Ikonen-Glanz, Inventar-Bereinigung & Compensation-Logik).
- **Versioning:** Inkrementierung der Projektversion für das anstehende Deployment der Cloud Functions.

## [1.0.79] - 2026-03-31
- **Feature (Sammelkarten Management):** Einführung eines fairen Seltenheits-Änderungssystems.
    - **Inventory Sync:** Bei einer Änderung der Seltenheit eines Lehrers wird dieser automatisch aus den Inventaren aller Schüler entfernt, um Konsistenz zu wahren.
    - **Fair Compensation:** Betroffene Nutzer werden automatisch entschädigt und erhalten pro entfernter Karte einen Gratis-Booster-Pack gutgeschrieben.
    - **Admin Safety:** Ein Bestätigungsdialog informiert den Admin vorab über die Auswirkungen und den Kompensationsprozess.

## [1.0.78] - 2026-03-31

- **Feature (Maintenance Mode):** News sind nun während der Wartungspause vollständig aufrufbar.
    - **Interactivity:** News-Einträge auf der Wartungsseite sind jetzt verlinkt und führen zur vollständigen Detailseite.
    - **Layout Adaptation:** Die News-Detailseiten werden während der Wartung in einem vereinfachten Layout (ohne App-Navigation) angezeigt.
    - **Navigation:** Der Zurück-Button auf der News-Seite führt während der Wartung automatisch zurück zur Wartungsseite.

## [1.0.79] - 2026-03-31
- **Fix (Maintenance Mode):** Fehlerbehebung beim Admin-Login während einer aktiven Wartungspause.
    - **Login Access:** Die Route `/login` wurde von der automatischen Weiterleitung auf die Wartungsseite ausgeschlossen.
    - **Admin Flow:** Admins können sich nun auch bei aktiver Wartung über den Button auf der Wartungsseite anmelden, ohne sofort wieder auf die Wartungsseite zurückgeworfen zu werden.

## [1.0.78] - 2026-03-31
- **Fix (Database):** Behebung von Firestore-Fehlern durch `undefined` Werte beim Speichern.
    - **Data Sanitization:** Implementierung einer rekursiven `sanitizeDataForFirestore` Funktion, die ungültige Felder vor dem Speichervorgang bereinigt.
    - **Stability:** Höhere Robustheit des Sammelkarten-Managers gegenüber unvollständigen oder migrierten Datensätzen.

## [1.0.77] - 2026-03-31
- **Fix (Admin UX):** Stabilisierung des automatischen Speicherns im Sammelkarten-Manager.
    - **Reliability:** Der Autosave-Timer wird nicht mehr bei jedem Tastendruck zurückgesetzt. Änderungen werden nun zuverlässig 10 Sekunden nach der letzten Interaktion im Hintergrund gespeichert.
    - **Debugging:** Hinzufügen von Error-Logging für fehlgeschlagene Speicherversuche.

## [1.0.76] - 2026-03-31
- **Upgrade (Card Design):** Exklusives Design für die "IKONISCH"-Seltenheit.
    - **Visual FX:** Einführung eines luxuriösen "Golden Sparkle" Overlays mit animiertem Sternenstaub und dynamischen Lichtreflexen.
    - **Differentiation:** Klare visuelle Abgrenzung von der "Secret Rare" (Black Shiny) durch permanente, edle Gold-Effekte über der gesamten Karte.

## [1.0.75] - 2026-03-31
- **Feature (Admin UI):** Lehrerliste im Sammelkarten-Manager jetzt sortierbar.
    - **Sortieroptionen:** Einführung von Sortierfunktionen für Name (A-Z, Z-A) und Seltenheit (aufsteigend, absteigend).
    - **UI Integration:** Kompakte Sortier-Leiste mit intuitiven Icons direkt über der Lehrerliste.

## [1.0.74] - 2026-03-31
- **Fix (Logging):** Behebung von Fehlern im Action-Logging-System.
    - **Parameter-Korrektur:** Fix der `logAction` Aufrufe im Sammelkarten-Manager (falsche Parameter-Reihenfolge führte zu Firestore-Fehlern).
    - **Type-Safety:** Ergänzung der neuen Action-Typen `CLEANUP_INVENTORIES` und `CLEANUP_POOL` im globalen Logging-System.

## [1.0.73] - 2026-03-31
- **Fix (Cloud Function):** Fehlerbehebung beim `FieldValue` Import in der globalen Inventar-Bereinigung.
    - **CORS & Reliability:** Korrektur des fehlerhaften `admin.firestore.FieldValue` Aufrufs in `cleanupNonExistentTeachers` zur Vermeidung interner Fehler beim Preflight.

## [1.0.72] - 2026-03-31
- **Fix (Admin UI):** Korrektur der Seltenheits-Anzeige im Sammelkarten-Manager.
    - **Reihenfolge:** Einführung einer festen Sortierung (`RARITY_ORDER`) für Drop-Rates, um eine konsistente Darstellung von "Gewöhnlich" bis "Ikonisch" zu gewährleisten.
    - **Vollständigkeit:** Sicherstellung, dass die neue Seltenheit "IKONISCH" auch dann in den Einstellungen erscheint, wenn sie in den Bestandsdaten der Datenbank noch nicht initialisiert wurde.

## [1.0.71] - 2026-03-31
- **Feature (Sammelkarten):** Vollständige Integration der neuen Seltenheit "IKONISCH".
    - **Drop Rates:** Aktivierung von "Ikonisch"-Drops in den Standard- und Godpack-Gewichten (Cloud Function & Admin Panel).
    - **Transparenz:** Aktualisierung der Wahrscheinlichkeitsanzeige in den Karten-Informationen für Schüler.
    - **Systemweite Logik:** Einbindung in die `openBooster` Cloud Function und die globalen Seltenheits-Limits.
    - **UI:** Konsistente Darstellung der neuen Seltenheit in allen Verwaltungs- und Anzeige-Komponenten.

## [1.0.70] - 2026-03-31
- **Admin Tool (Sammelkarten):** Implementierung einer globalen Inventar-Bereinigung.
    - **Cleanup Inventories:** Neuer Button im Sammelkarten-Manager zum Entfernen von nicht mehr existierenden Lehrern aus den Inventaren aller Schüler.
    - **Cloud Function:** Einführung der `cleanupNonExistentTeachers` Cloud Function zur sicheren und effizienten Verarbeitung großer Datenmengen im Batch-Verfahren.
    - **UI Enhancement:** Umbenennung des bisherigen "Cleanup" Buttons in "Cleanup Pool" zur besseren Unterscheidung.

## [1.0.69] - 2026-03-31
- **Fix (Auth & Verification):** Behebung des kritischen Fehlers `user.getIdToken is not a function` beim Senden von Verifizierungs-E-Mails und beim Aktualisieren des Auth-Status.
    - **Proto-Safe Auth:** Entfernung von fehlerhaftem Object-Spreading des Firebase-User-Objekts im `AuthContext`, welches die internen Methoden des Objekts zerstörte.
    - **Reliability:** Überarbeitung der `resendVerification` und `refreshAuth` Logik, um direkt auf den aktuellsten `auth.currentUser` zuzugreifen.
    - **Email Feature:** Bestätigung der Nutzung des nativen Firebase `sendEmailVerification` Features durch den Fix der Client-seitigen Implementierung.

## [1.0.68] - 2026-03-31
- **Fix (Sammelkarten Preview):** Behebung von Darstellungsfehlern und Performance-Problemen im Lehrer-Edit-Dialog.
    - **Shape Fix:** Die Karten werden nicht mehr als "Pillen" (elliptisch) dargestellt. Der Border-Radius wurde korrigiert und störende Container-Clippings entfernt.
    - **Orientation Fix:** Die Art-Karte in der Vorschau wird nun korrekt von vorne angezeigt.
    - **Performance Optimization:** Drastische Reduzierung des Lags beim Bearbeiten durch konsequente Memoïsierung von `cardData` und der `TeacherSpecCard`-Komponente.

## [1.0.67] - 2026-03-31
- **Upgrade (Admin UI):** Umfassendes Upgrade des Lehrerpool-Managers für bessere Usability und Performance.
    - **Live-Vorschau:** Integration einer Echtzeit-Kartenvorschau im Edit-Dialog. Admins sehen sofort, wie die Art- und Spec-Karten im Album aussehen werden.
    - **Performance-Boost:** Vollständige Entkopplung des Edit-States vom Haupt-Dashboard. Das Tippen im Dialog verzögert nun nicht mehr die gesamte App.
    - **Optimiertes Rendering:** Einführung memoïsierter Listen-Komponenten (`TeacherList`, `TeacherListItem`) für flüssiges Scrollen und Filtern bei großen Datenmengen.
    - **Refactoring:** Migration von `getRarityColor` und `getRarityLabel` in zentrale Utilities.
- **Build-Stabilität:** Bereinigung veralteter Abstimmungs-Komponenten und Optimierung der `tsconfig.json` (Ausschluss von Archiv-Verzeichnissen) zur Beschleunigung des Build-Prozesses.

## [1.0.66] - 2026-03-31
- **Fix (Admin UI):** Behebung eines `ReferenceError` im Sammelkarten-Manager (`handleSyncRarities is not defined`).
    - **Cleanup:** Endgültige Entfernung des "Sync Polls" Buttons und aller verbleibenden Logikfragmente des veralteten Teacher-Rarity-Voting-Systems aus dem Admin-Panel.
    - **UI-Bereinigung:** Entfernung von Live-Voting-Badges im Lehrerpool-Dashboard.

## [1.0.65] - 2026-03-31
- **Critical Stability Fix (2FA & CORS):** Endgültige Behebung von Preflight-CORS-Fehlern (`Access-Control-Allow-Origin`) in der lokalen Entwicklung.
    - **Explicit CORS Configuration:** Alle Cloud Functions (MFA, Shop, Danger, Gifts, Referrals) nutzen nun explizit `cors: true` in ihren Definitionen, um globale Einstellungen sicher zu überschreiben und Anfragen von `localhost:3000` zuverlässig zu erlauben.
    - **Region Alignment:** Alle Funktionen sind nun explizit auf `europe-west3` konfiguriert, passend zur Frontend-Initialisierung.

## [1.0.64] - 2026-03-31
- **Fix (Admin UI):** Behebung eines Syntaxfehlers im Sammelkarten-Manager, der den Build blockierte.

## [1.0.63] - 2026-03-31
- **Critical Stability Fix (CORS):** Vollständige Behebung von Preflight-Fehlern (`Access-Control-Allow-Origin`) bei lokalen Tests.
    - **Global Middleware:** Umstellung der CORS-Handhabung von funktionsspezifischen Definitionen auf eine globale Middleware in `index.ts`. Dies ist die zuverlässigste Methode in Firebase Functions v2.
    - **Permissive Mode:** Das Backend akzeptiert nun dynamisch Anfragen von autorisierten Frontend-Umgebungen (inkl. `localhost`).

## [1.0.62] - 2026-03-31
- **Diagnostics Update (2FA & Login):** Erweiterte Fehlerdiagnose zur Behebung des persistenten "internal" Fehlers.
    - **Enhanced Login Logs:** Die Anmeldeseite loggt nun detailliert jeden Schritt (Auth, Profil-Abruf, 2FA-Check) in die Browser-Konsole.
    - **Backend Resilience:** Die 2FA-Cloud-Function versucht nun robuster auf die Datenbank zuzugreifen (Fallback von 'abi-data' auf Standard-Instanz).
    - **Detailed Error Messages:** Im Fehlerfall liefert das Backend nun präzisere Informationen an die App zurück, anstatt eines generischen "internal" Fehlers.

## [1.0.61] - 2026-03-31
- **Critical Fix (2FA Backend):** Behebung des "internal" Fehlers bei der 2FA-Verifizierung.
    - **CORS Alignment:** Vervollständigung der `ALLOWED_ORIGINS` um die `.app`-Domain-Endung, um Übereinstimmung mit dem Hosting-Projekt sicherzustellen.
    - **Safe Initialization:** Explizite Initialisierung des Firebase-Admin-SDKs innerhalb der MFA-Module, um Laufzeitfehler beim Zugriff auf Auth und Firestore zu vermeiden.
    - **Robust Logging:** Implementierung einer detaillierten Fehlerprotokollierung (Try-Catch) in allen 2FA-Cloud-Functions zur schnelleren Diagnose zukünftiger Probleme.

## [1.0.60] - 2026-03-31
- **Neu (Sammelkarten):** Einführung der Seltenheitsstufe **"Ikonen" (Iconic)** oberhalb von Legendär.
    - **Visuals:** Edles Schwarz-Gold-Design mit einem neuen Kronen-Symbol in `RaritySymbol.tsx`.
    - **Administrative Kontrolle:** Umstellung von Crowdsourcing auf ein rein administratives Modell. Die Seltenheit wird nun fest vom Admin vergeben.
    - **System-Cleanup:** Restlose Entfernung aller Überreste des Teacher-Rarity-Votings.
        - Deaktivierung der Cloud Functions (`voteForTeacher`, `calculateTeacherRarity`).
        - Bereinigung der Datenbank-Modelle (`avg_rating` und `vote_count` entfernt).
        - Vollständige Entfernung der Abstimmungs-UI von der Umfragen-Seite.
    - **Migration:** Bereitstellung eines Cleanup-Scripts (`scripts/cleanup-voting-data.ts`) zur Bereinigung der Bestandsdaten.

## [1.0.59] - 2026-03-31
- **Neu (Ideen-Labor):** Einführung eines Formulars für eigene Kartenvorschläge in der Umfragen-Sektion.
    - **Mitgestaltung:** Nutzer können nun für jeden Lehrer Vorschläge für Lebenspunkte (HP), Beschreibungen und bis zu 3 Angriffe (Name, Schaden, Effekt) einreichen.
    - **Belohnungssystem:** Einreichungen, die vom Admin für das offizielle Album übernommen werden, werden mit **2 Booster-Packs** pro Karte belohnt.
    - **Strukturierte Erfassung:** Vorschläge werden in einer neuen Datenbank-Collection (`card_proposals`) gespeichert und dem Admin zur Inspiration vorgelegt.
    - **UI-Update:** Die Umfragen-Seite wurde auf ein Tab-Layout umgestellt, um zwischen regulären Abstimmungen und dem Ideen-Labor wechseln zu können.

## [1.0.58] - 2026-03-31

- **Security & Stability (2FA):** Optimierung des Zwei-Faktor-Authentisierungssystems.
    - **CORS Fix:** Behebung eines "internal" Fehlers bei lokalen Tests durch Aktualisierung der erlaubten Ursprünge (`localhost`) in den Cloud Functions.
    - **UX Polish:** Das 2FA-Gate wartet nun auf die Initialisierung des Session-Status, wodurch ein kurzes Aufblinken des Sperrbildschirms beim Neuladen der Seite verhindert wird.
    - **Session Persistence:** Bestätigte 2FA-Sitzungen bleiben nun zuverlässig über Page-Refreshes hinweg aktiv (via `sessionStorage`), solange der Tab geöffnet bleibt.

## [1.0.58] - 2026-03-31
- **Fix (Sammelkarten):** Behebung eines UI-Bugs in der Karten-Detailansicht beim Wischen.
    - **State-Sync:** Die Kartenvariante (Folie/Effekt) wird nun beim Navigieren zwischen Karten korrekt auf die jeweils beste verfügbare Variante des neuen Lehrers zurückgesetzt.
    - **Locked-State Navigation:** Beim Wischen zu noch nicht freigeschalteten Karten wird nun korrekt die Rückseite der Karte angezeigt (`isLocked`), anstatt die Vorderseite mit dem Effekt der vorherigen Karte zu "vererben".
    - **Stats-Schutz:** Der Zugriff auf die Detail-Statistiken (Spec-Ansicht) sowie die Pagination-Punkte wurden für gesperrte Karten deaktiviert, um Mystery-Cards-Geheimnisse zu wahren.

## [1.0.57] - 2026-03-31
- **Security Feature (2FA):** Einführung der optionalen Zwei-Faktor-Authentisierung (2FA) für alle Nutzer.
    - **Self-Service Setup:** Jeder Nutzer kann nun in seinem Profil unter "Mein Konto" 2FA via Authenticator-App (z.B. Google Authenticator, Authy) aktivieren.
    - **Login Protection:** Bei aktiviertem 2FA wird nach der Passworteingabe automatisch ein zweiter Schritt zur Code-Verifizierung eingeblendet.
    - **Session-Sicherheit:** Ein neues Sicherheitssystem (`TwoFactorGate`) stellt sicher, dass der Zugriff auf die App erst nach erfolgreicher 2FA-Bestätigung freigegeben wird. Die Verifizierung bleibt für die Dauer der aktuellen Sitzung bestehen.
    - **Backend-Validierung:** Die Prüfung der 6-stelligen Codes erfolgt manipulationssicher über eine neue Cloud Function (`verifyLogin2FA`).
    - **Admin-Funktionen:** Admins können den 2FA-Status von Nutzern bei Bedarf (z.B. Verlust des Geräts) über die Benutzerverwaltung zurücksetzen.

## [1.0.56] - 2026-03-31
- **Fix (Maintenance Mode):** Behebung von UI- und Logikfehlern in den Wartungseinstellungen.
    - **Timezone-Fix:** Korrektur der Zeitangaben in den `datetime-local` Inputs. Diese werden nun korrekt in die lokale Browser-Zeit umgerechnet, anstatt UTC-Werte anzuzeigen.
    - **UI Enhancement:** Neuer expliziter Button "Wartungspause planen" für mehr Sicherheit beim Speichern.
    - **Sicherheitsabfrage:** Bestätigungsdialog beim Löschen einer geplanten Wartung ergänzt.

## [1.0.55] - 2026-03-31
- **Hotfix (Card Manager):** Behebung eines `ReferenceError: fileInputRef is not defined`.
    - `useRef` fehlte in den React-Imports.
    - Deklaration von `fileInputRef` wurde in der Komponente ergänzt.

## [1.0.54] - 2026-03-31
- **UX Alignment (Verification):** Vollständige Vereinheitlichung des Verifizierungs-Status.
    - **Single Source of Truth:** Der "Verifiziertes Mitglied" Status ist nun direkt an die technische E-Mail-Bestätigung (`emailVerified`) gekoppelt. Dies beseitigt Verwirrungen, bei denen das Profil "verifiziert" anzeigte, aber der Banner weiterhin zur Bestätigung aufforderte.
    - **Auto-Sync:** Das System gleicht nun automatisch den internen Freischalt-Status (`is_approved`) mit der E-Mail-Verifizierung ab. Sobald ein Nutzer seine E-Mail bestätigt, wird er systemweit als verifiziertes Mitglied geführt.
    - **Admin Sync:** Die Admin-Massenaktionen aktualisieren nun ebenfalls synchron beide Status (Auth & Datenbank).

## [1.0.53] - 2026-03-31
- **UX Improvement (Profile):** Klarere Unterscheidung zwischen technischer E-Mail-Verifizierung und administrativer Freischaltung.
    - **Status-Anzeige:** Das Profil zeigt nun explizit zwei getrennte Status-Zeilen: "E-Mail Status" (Bestätigt/Unbestätigt) und "Account-Freischaltung" (Verifiziertes Mitglied/Wartet).
    - **Branding:** Umbenennung von "Mitglied-Status" zu "Account-Freischaltung", um Verwirrung mit dem E-Mail-Verifizierungsbanner zu vermeiden.

## [1.0.52] - 2026-03-31
- **Build Fix (Admin Page):** Behebung eines Syntaxfehlers in der Benutzerverwaltung, der durch falsch platzierte Import-Statements verursacht wurde.

## [1.0.51] - 2026-03-31

- **System Feature (Maintenance Mode):** Einführung eines umfassenden Wartungssystems für Admins.
    - **Planung:** Wartungspausen können nun im Admin-Bereich (`Globale Einstellungen`) mit Start- und geschätztem Endzeitpunkt geplant werden.
    - **Countdown-Banner:** Nutzer sehen vor Beginn der Wartung einen nicht entfernbaren Banner mit Echtzeit-Countdown. Bei weniger als 15 Minuten Restzeit wird dieser rot und pulsierend hervorgehoben.
    - **Automatischer Lockout:** Bei Beginn der Wartung werden alle Nicht-Admins sofort blockiert und auf eine spezielle Wartungsseite umgeleitet.
    - **Wartungsseite:** Eine neue, minimalistische Seite (`/maintenance`) informiert über die Wartung, zeigt die geschätzte Restzeit und integriert den aktuellen News-Feed.
    - **Admin-Exemption:** Admins behalten während der Wartung vollen Zugriff auf die Plattform, um Arbeiten durchzuführen und die Wartung zu beenden.
    - **Auto-Recovery:** Sobald die Wartung vom Admin beendet wird, werden alle Nutzer auf der Wartungsseite automatisch zurück auf die Startseite geleitet.

## [1.0.51] - 2026-03-31
- **Admin Suite (Email Verification):** Neue Massenaktionen zur manuellen Steuerung des Verifizierungsstatus.
    - **Bulk Actions:** Admins können nun ausgewählte Nutzer gesammelt verifizieren oder die Verifizierung entziehen. Dies nutzt die neue Cloud Function `toggleUserEmailVerification`.
    - **Cloud Function:** Implementierung einer sicheren administrativen Funktion zur Manipulation des Firebase Auth `emailVerified` Status.
- **UI Enhancement (Verification Banner):** Der Banner zeigt nun direkt die Ziel-E-Mail-Adresse an ("Verifizierungs-E-Mail an [email] gesendet"), um Klarheit über den Posteingang zu schaffen.

## [1.0.50] - 2026-03-31

- **Admin Overhaul (Teacher Management):** Umfassende Überarbeitung der Lehrerverwaltung im Karten-Manager.
    - **Bulk Import (CSV):** Neuer Datei-Upload für CSV-Listen (`name,rarity,hp`). Bietet nun die Wahl zwischen "Merge" (neue hinzufügen/existierende aktualisieren) und "Overwrite" (komplette Ersetzung des Pools).
    - **Duplicate Bugfix:** Einführung einer ID-Normalisierung und Deduplizierung. IDs werden nun konsistent aus dem Namen generiert und bei jedem Import/Speichervorgang bereinigt.
    - **Rarity Sync Fix:** Synchronisation der Seltenheiten wurde stabilisiert. Änderungen im Manager werden nun zuverlässig in das globale Metadaten-Array (`settings/sammelkarten`) und die Voting-Collection (`teachers`) übertragen, wodurch sie sofort im Nutzer-Album sichtbar sind.
    - **Cleanup Tool:** Neuer "Cleanup" Button im Dashboard zum manuellen Entfernen von Namensduplikaten.
    - **Import Preview:** Der Import-Dialog zeigt nun eine Vorschau aller in der Datei gefundenen Lehrer vor dem Bestätigen an.

## [1.0.50] - 2026-03-31
- **UX Refinement (Verification Banner):** Dynamische Textanpassung des Verifizierungs-Banners.
    - **Kontext-Logik:** Der Hinweis auf Willkommens-Booster wird nun nur noch Nutzern angezeigt, die tatsächlich über einen Empfehlungslink geworben wurden (`referred_by`).
    - **Allgemeiner Hinweis:** Für alle anderen Nutzer wurde der Text auf die Freischaltung des Empfehlungssystems (eigene Freunde werben) fokussiert.

## [1.0.49] - 2026-03-31
- **UI Integration (Verified Member):** Einführung eines visuellen "Verifiziertes Mitglied"-Status basierend auf dem administrativen Approval.
    - **Branding:** Nutzung des `ShieldCheck` Icons (Smaragd-grün) als einheitliches Symbol für Vertrauenswürdigkeit.
    - **Profil:** Der Mitglied-Status wurde von einer reinen Textanzeige auf ein hochwertiges Badge-System umgestellt.
    - **Navbar:** Verifizierte Nutzer erhalten ein dezentes Icon neben ihrem Namen in der Desktop-Sidebar und im mobilen Drawer.
    - **Gruppen:** In Mitgliederlisten wird der Verifizierungs-Status nun ebenfalls durch das Shield-Icon direkt am Namen visualisiert, um echte Mitschüler leichter erkennbar zu machen.

## [1.0.48] - 2026-03-31
- **Security & Anti-Fraud (Referrals):** Einführung einer verpflichtenden E-Mail-Verifizierung zur Bekämpfung von Fake-Accounts.
    - **Verification Gate:** Referral-Belohnungen (sowohl für Werber als auch Geworbene) werden erst nach erfolgreicher Verifizierung der `@hgr-web.lernsax.de` Adresse ausgeschüttet.
    - **Registration Flow:** Nach der Registrierung wird automatisch eine Verifizierungs-E-Mail gesendet. Nutzer werden über einen neuen Status-Schritt informiert.
    - **UI Reminder:** Ein neuer globaler Banner (`EmailVerificationBanner`) erinnert unverifizierte Nutzer an die Aktivierung und bietet Funktionen zum erneuten Senden sowie zur Status-Prüfung.
    - **Backend Protection:** Die Cloud Function `processReferralReward` prüft nun serverseitig den `emailVerified` Status via Firebase Auth, bevor Booster gutgeschrieben werden.
    - **UX:** Unverifizierte Nutzer können die App weiterhin eingeschränkt nutzen, erhalten aber keine Boni und können keine anderen Nutzer werben.

## [1.0.47] - 2026-03-30
- **Build Fix (Firebase):** Behebung eines TypeScript-Fehlers bei der Firestore-Initialisierung.
    - **Fehler:** Das Feld `forceLongPolling` wurde in neueren Firebase-Versionen entfernt und verhinderte den Build in der Cloud. Es wurde durch das korrekte Feld `experimentalForceLongPolling` ersetzt.

## [1.0.46] - 2026-03-30
- **Reactions UX Improvement:** Festlegen von Standard-Emojis.
    - **Änderung:** Die Daumen-hoch (👍) und Daumen-runter (👎) Emojis werden nun standardmäßig in der Reaktionsleiste angezeigt, auch wenn noch keine Reaktionen vorhanden sind. Alle weiteren Emojis erscheinen weiterhin dynamisch bei Benutzung.

## [1.0.45] - 2026-03-30
- **UI Refinement (News):** Reduzierung visuellen Rauschens in der Detailansicht.
    - **Änderung:** Die redundante Anzeige der Kommentaranzahl direkt unter den Reaktionen wurde entfernt, um das Layout sauberer zu gestalten.

## [1.0.44] - 2026-03-30
- **Social Engagement Update (v2):** Verbesserung des Emoji-Reaktionssystems.
    - **Native Interaction:** Ein neues auto-fokussiertes Eingabefeld im Picker ermöglicht nun das sofortige Nutzen von System-Emoji-Tastaturen (Mobil/PC).
    - **Bugfix:** Korrektur eines Anzeige-Bugs, bei dem alte Reaktions-Daten (User-IDs) fälschlicherweise als Emojis interpretiert wurden.

## [1.0.43] - 2026-03-30
- **Social Engagement Update:** Implementierung eines dynamischen "Slack-Style" Emoji-Reaktionssystems für News-Beiträge.
    - **Funktionalität:** Nutzer können nun mit mehreren Emojis reagieren (z.B. ❤️, 😂, 🔥, 🎓, 🥂). Jedes Emoji zeigt die Anzahl der Reaktionen an.
    - **UI:** Neuer "+"-Button mit einem animierten Emoji-Picker-Menü (Vorschlagsliste inklusive Jahrgangs-relevanter Emojis).
    - **System-Integration:** Unterstützung für native System-Emoji-Picker (Win+. / Cmd+Ctrl+Space).
    - **News-Feed:** In der Übersicht wird nun die Gesamtzahl aller abgegebenen Reaktionen angezeigt.

## [1.0.42] - 2026-03-30
- **Guest Experience Refinement:** Erweiterung des Konto-Incentives auf geschützte Bereiche.
    - **Komponente:** In `ProtectedSystemGate` wurde ebenfalls der Link "Warum ein Konto?" hinzugefügt. Dies betrifft alle für Gäste gesperrten Seiten, wie z.B. die Finanzübersicht.

## [1.0.41] - 2026-03-30
- **Bugfix (UI):** Behebung einer React-Warnung bezüglich der `asChild`-Prop.
    - **Komponente:** In `SammelkartenPromo` wurde die inkorrekte Prop `asChild` durch die korrekte Prop `render` ersetzt, die von der zugrundeliegenden `@base-ui/react` Bibliothek erwartet wird.

## [1.0.40] - 2026-03-30
- **Guest Experience Refinement:** Dezente Platzierung des Konto-Incentives.
    - **UI/UX:** Entfernung des plakativen Guest-Banners zugunsten einer subtileren Integration.
    - **Konvertierung:** Ein neuer Link "Warum ein Konto?" wurde direkt unter den Login-Buttons in der Sidebar (Navbar) und der Sammelkarten-Promo auf dem Dashboard platziert. Er führt zur Info-Seite `/zugang`.

## [1.0.39] - 2026-03-30
- **Guest Experience & Conversion (Draft):** Experimentelle Implementierung des `GuestPromoBanner`. (Wurde in 1.0.40 durch ein subtileres Design ersetzt).

## [1.0.38] - 2026-03-30
- **Sammelkarten-Promo Balancing:** Anpassung der Anzeige-Wahrscheinlichkeiten für Lehrer-Karten.
    - **Lehrer-Rarität:** Alle Lehrer-Raritäten (von Gewöhnlich bis Legendär) haben nun die gleiche Chance, in der Werbung zu erscheinen, um die Vielfalt des Pools besser zu demonstrieren.
    - **Varianten-Gewichtung:** Die Gewichtung der Karten-Varianten (Holo, Shiny, Secret Rare) bleibt bestehen, sodass spektakuläre Effekte weiterhin als besondere Highlights wahrgenommen werden.

## [1.0.37] - 2026-03-30
- **Dashboard Layout Update (Gäste):** Optimierung der vertikalen Anordnung für eine bessere Lesbarkeit.
    - **Spalten-Logik:** Die Sammelkarten-Promo wurde direkt unter die News-Vorschau in die linke Spalte verschoben. Dies verhindert ein unruhiges "Zick-Zack"-Layout und bündelt Informations-Inhalte logisch untereinander.

## [1.0.36] - 2026-03-30
- **Marketing & Guest Experience (Sammelkarten):** Behebung der fehlenden Sammelkarten-Promo für nicht angemeldete Nutzer.
    - **Firestore-Regeln:** Die `settings/sammelkarten` Dokumente sind nun öffentlich lesbar, damit die Werbung auch Gästen echte Lehrer-Karten präsentieren kann.
    - **Promo-Komponente:** Entfernung der Authentifizierungs-Sperre in `SammelkartenPromo`. Die Komponente lädt nun auch für Gäste den Lehrer-Pool und nutzt attraktive Fallback-Karten (`Herr Schmidt`, `Frau Müller`) während der Initialisierung.
    - **Visuelle Stabilität:** Sicherstellung, dass der Promo-Banner auch bei Berechtigungsfehlern oder leeren Konfigurationen immer mit Demonstrations-Inhalten sichtbar bleibt.

## [1.0.33] - 2026-03-30
- **Firestore Stabilitaet & Sicherheit:** Behebung interner Firestore SDK Assertion Failures (ca9, b815) durch Optimierung von Listener-Lifecycles und Berechtigungen.
    - **Regel-Update:** Lesezugriff fuer `settings/config` und `settings/global` auf oeffentlich umgestellt, um Basis-Konfigurationen und System-Meldungen (z.B. Cookie-Banner) fehlerfrei zu laden.
    - **Listener Haertung:** In `Dashboard.tsx` wird nun sichergestellt, dass `onSnapshot` Unsubscribe-Funktionen immer zurueckgegeben werden, was Listener-Leaks waehrend des Auth-Prozesses verhindert.
    - **Defensive Komponenten:** Die `SammelkartenPromo` wartet nun explizit auf die Authentifizierung, bevor sie geschuetzte Einstellungen abonniert, was Konsolenfehler und SDK-Instabilitaeten reduziert.
    - **Ressourcen-Effizienz:** Vermeidung redundanter Listener-Initialisierungen waehrend Profil-Ladevorgaengen.

## [1.0.32] - 2026-03-30
- **UI Design Polish (Dashboard):** Das Lade-Skeleton der Sammelkarten-Werbung wurde neutralisiert.
    - **Visuelle Konsistenz:** Entfernung der bunten Verlaeufe und Hintergruende im Ladezustand, damit die Werbung optisch exakt den anderen Dashboard-Widgets entspricht.
    - **Branding:** Nutzt nun die Standard-Card-Klassen (`elevated-card`) fuer einen einheitlichen Look waehrend des Initialisierungsprozesses.

## [1.0.31] - 2026-03-30
- **UX & Performance (Skeletons):** Grundlegende Überarbeitung des Ladesystems zur Vermeidung von Layout-Flimmern und zur Verbesserung der wahrgenommenen Performance.
    - **Resilientes Dashboard:** Der vollflächige "Lade Dashboard"-Sperrbildschirm wurde entfernt. Die App rendert nun sofort die Struktur und nutzt punktuelle, pulsierende Skeletons für noch ladende Daten.
    - **Systemweite Skeleton-Integration:** Einführung von strukturierten Platzhaltern für News, Termine, Aufgaben, Finanzen, Profile und Sammelkarten.
    - **Lehrer-Album Polish:** Das Album nutzt nun ein hochqualitatives Grid-Skeleton, das exakt die Dimensionen der späteren Karten widerspiegelt.
    - **Optimierte Transitions:** Weichere Übergänge von Ladezuständen zu echten Inhalten durch konsistente Skeleton-Animationen (Pulse-Effekt).

## [1.0.30] - 2026-03-30
- **Legal Readiness & Compliance:** Umfassende Pruefung und Aktualisierung aller Rechtstexte fuer den v1.0.0 Release.
    - **Impressum vervollstaendigt:** Anschrift und Telefonnummer gemaess § 5 DDG (ehem. TMG) ergaenzt.
    - **Cookie Consent (DSGVO):** Implementierung eines rechtssicheren Cookie-Consent-Banners (Opt-in) fuer Google AdSense.
    - **Dynamisches Script-Loading:** Das Google AdSense Script wird nun erst nach ausdruecklicher Zustimmung (`localStorage`) in den Document Head injiziert.
    - **Privacy Policy Update:** Abschnitt 8 (Google AdSense) aktualisiert, um den neuen Einwilligungsvorbehalt (Art. 6 Abs. 1 lit. a DSGVO) korrekt abzubilden.
    - **Version-Sync:** Die `terms_version` in der Registrierung wurde auf den Stand der aktuellen AGB (`2026-03-29`) synchronisiert.
    - **UI Integration:** Der Cookie-Banner nutzt das `shadcn/ui` Design und ist nahtlos in die `AppShell` integriert.

## [1.0.29] - 2026-03-30
- **Firestore-Stabilitaet:** Systematische `permission-denied`-Fehler behoben, indem Autorisierungs-Guards zu Firestore-Listenern hinzugefuegt wurden.
    - **Race-Conditions beseitigt:** Komponenten wie `CountdownHeader`, `ClassRanking` und `GroupWall` warten nun korrekt, bis das Nutzerprofil geladen und der "Approved"-Status bestätigt wurde, bevor sie Daten abfragen.
    - **Haertung von Hooks & Modals:** Auch der `useUserTeachers`-Hook und alle Finanz-/Event-Dialoge pruefen nun aktiv die Berechtigungen vor dem Starten von Snapshot-Listenern auf geschuetzte Sammlungen.
    - **Saubere Konsole:** Verhindert stoerende Fehlermeldungen in der Browser-Konsole waehrend des App-Initialisierungsprozesses.

## [1.0.28] - 2026-03-30
- **Dashboard Redesign (Sammelkarten-Werbung):** Die statische Werbung fuer Sammelkarten wurde durch ein dynamisches Karussell ersetzt.
    - **Live-Vorschau:** Es wird nun alle 5 Sekunden ein zufaelliger Lehrer mit einer zufaelligen Karten-Variante (Normal, Holo, Shiny, BlackHolo) angezeigt.
    - **Integration:** Die `SammelkartenPromo`-Komponente nutzt nun direkt die `TeacherCard`-Logik fuer eine authentische Vorschau.
    - **Echtzeit-Daten:** Die Liste der verfuegbaren Lehrer wird live aus den Systemeinstellungen geladen.

## [1.0.27] - 2026-03-30
- **Notifications stabilisiert:** Firestore `onSnapshot`-Listener in `useNotifications` haben jetzt durchgaengig Error-Callbacks, damit `permission-denied` nicht mehr als uncaught Listener-Fehler hochlaeuft.
- **Graceful Degradation:** Bei fehlenden Rechten werden betroffene Notification-Badges gezielt deaktiviert statt die Konsole mit ungefangenen Snapshot-Fehlern zu fluten.

## [1.0.26] - 2026-03-30
- **Firestore Stabilitaet (Dev):** Firebase Web SDK auf `12.11.0` aktualisiert, um bekannte interne Watch-Stream-Probleme zu vermeiden.
- **Firestore Init gehaertet:** In der Entwicklung wird Firestore jetzt mit robusterer Transport-Konfiguration initialisiert (`experimentalAutoDetectLongPolling`, `useFetchStreams: false`) inklusive sicherem Fallback.

## [1.0.25] - 2026-03-30
- **Registrierung (Passwort-Hinweis):** Im Schritt "E-Mail & Passwort" steht jetzt ein klarer Hinweis, dass ein neues Passwort vergeben werden kann und nicht das LernSax-Passwort genutzt werden muss.
- **Registrierung (Validierung gefixt):** Fehlermeldungen erscheinen nun erst nach aktiver Aktion im aktuellen Schritt; beim Wechsel zu Schritt 2 werden keine vorzeitigen Fehler mehr fuer noch nicht ausgefuellte Felder angezeigt.

## [1.0.24] - 2026-03-30
- **Admin Shop-Einnahmen stabilisiert:** Hook-Reihenfolge in der Admin-Seite korrigiert, sodass keine React-Fehler mehr durch wechselnde Hook-Order entstehen.
- **Eigene Einnahmen-Tabelle:** Neue dedizierte Collection `shop_earnings` fuer Shop-Umsaetze eingebunden (inkl. `month_key`, `90%` und `10%` Split pro Transaktion).
- **Admin-Auswertung umgestellt:** `src/app/admin/shop-earnings/page.tsx` liest nun aus `shop_earnings` statt `stripe_transactions`.
- **Regeln erweitert:** Firestore-Regel fuer `shop_earnings` hinzugefuegt (`read` nur fuer Admin-Rollen, `write` gesperrt fuer Clients).
- **Historische Kaeufe nachtragen:** Neue Callable Function `backfillShopEarnings` migriert bestehende `stripe_transactions` in `shop_earnings`.
- **Admin-Trigger:** In der Admin-Seite gibt es nun den Button **Altkäufe importieren**, um den Backfill einmalig sicher auszufuehren.
- **Stripe-Gebuehren einberechnet:** Shop-Einnahmen speichern jetzt Brutto, Stripe-Fee und Netto; die 90/10-Aufteilung basiert auf dem Netto-Betrag.
- **Gebuehrenformel (realer Shop-Wert):** Stripe-Fee wird fuer Earnings automatisch als `1,5% + 0,25 EUR` pro Transaktion berechnet (neu und beim Backfill).
- **Backfill aktualisiert Bestandsdaten:** Bereits vorhandene Datensaetze in `shop_earnings` werden bei Import auf die aktuelle Gebuehrenformel aktualisiert.

## [1.0.23] - 2026-03-30
- **Shop Visual Masking:** Visual-Bereich der Bundle-Karten hat jetzt einen dezenten Rahmen mit Innen-Schatten.
    - **Blur-Kanten kaschiert:** Falls Blur an Card-Grenzen abgeschnitten wird, ist der Uebergang deutlich unauffaelliger.

## [1.0.22] - 2026-03-30
- **Shop Visual Polish (Blur):** Blur-Hintergruende der Booster-Visuals laufen jetzt weicher aus und wirken nicht mehr hart abgeschnitten.
    - **Mehr Auslauf:** Blur-Layer in `BoosterPackVisual` wurden vergroessert (negative Insets) und auf sichtbaren Overflow abgestimmt.

## [1.0.21] - 2026-03-30
- **Korrektur (Live-Bundles):** Echte Booster-Bundles im Shop verwenden jetzt explizit die Faecher-Designs aus der Demo.
    - **Fan statt Auto:** Live-Visuals laufen fuer Bundles mit `experimental` + `fan`.
    - **Staffel wie Demo:** Pro Bundle-Stufe wird die Faecher-Kartenzahl um `+1` erhoeht.

## [1.0.20] - 2026-03-30
- **Live-Shop Bundle-Designs aktiviert:** Die experimentellen Booster-Bundle-Visuals laufen jetzt direkt in `/shop` als Standard.
    - **Produktiv statt Demo:** Booster-Karten nutzen jetzt `experimental` + `auto` Layout im echten Shop.
    - **Dichte fuer große Bundles:** Große Bundles (ab 50) werden im Live-Shop dichter dargestellt.
- **Demo-Route entfernt:** Die Route `/shop/demo-bundles` und der Hero-Link dorthin wurden entfernt.

## [1.0.19] - 2026-03-30
- **Bundle-Farblogik (Wert-Staffel):** Farben der Bundle-Karten auf eine klare Wertigkeit nach Preis umgestellt.
    - **Von Einstieg zu Premium:** Kleine Bundles starten in `slate/blue`, mittlere wandern zu `emerald/purple`, große zu `amber/rose`.
    - **Konsistent in Shop + Demo:** Die Preis-Wert-Progression gilt sowohl in `/shop` als auch im Bundle-Faecher-Vergleich auf `/shop/demo-bundles`.

## [1.0.18] - 2026-03-30
- **Demo Bundles (Faecher-Staffel + Sichtbarkeit):** Faecher in der Bundle-Demo so angepasst, dass jede naechste Bundle-Karte genau eine weitere Karte im Faecher zeigt.
    - **Stufenvergleich klarer:** Im Abschnitt "Ein Faecher pro Bundle" steigt die Anzahl sichtbarer Faecherkarten nun strikt pro Bundle-Schritt (`+1`).
    - **Farbiger Faecher:** Die hinteren Faecherkarten nutzen jetzt dieselbe Farbwelt wie die Vorderkarte statt neutraler Dark-Cards.
    - **Staerkere Praesenz:** Fan-Karten im Hintergrund vergroessert und die Demo-Kartenflaeche erhoeht, damit der Faecher nicht mehr klein untergeht.

## [1.0.17] - 2026-03-30
- **Demo Bundles (Faecher-Feinschliff):** `fan` so angepasst, dass die Hauptkarte visuell Teil des Faechers ist statt isoliert davor zu stehen.
    - **Vorderkarte integriert:** Fan-spezifische Position/Animation der Hauptkarte reduziert den Abstand zum Hintergrund-Faecher.
    - **Geometrie nachgezogen:** Symmetrische Layer bleiben erhalten, wirken aber enger und wie ein zusammenhaengender Kartenfuecher.

## [1.0.16] - 2026-03-30
- **Demo Bundles (Symmetrischer Faecher):** Faecher-Anordnung im Experimental-Renderer auf klare, symmetrische Layer hinter der Frontkarte umgestellt.
    - **Neues Prinzip fuer `fan`:** Vorne 1 Hauptkarte, dahinter paarweise links/rechts in Ebenen (`2 + 2 + 2`, je nach Bundlegroesse auch weniger Ebenen).
    - **Bundle-Lesbarkeit verbessert:** Kleine Bundles zeigen weniger Hinterkarten, groessere Bundles den vollen symmetrischen Faecher.

## [1.0.15] - 2026-03-30
- **Demo Bundles (Faecher verbessert):** Faecher-Darstellung auf `/shop/demo-bundles` visuell verfeinert.
    - **Praezisere Faecher-Geometrie:** `fan`, `fan-wide`, `fan-cascade` und `fan-ring` im Experimental-Renderer mit besserer Spreizung, Tiefe und Rotation aktualisiert.
    - **Neuer Bundle-Vergleich:** Eigener Abschnitt "Ein Faecher pro Bundle" mit genau einem Fan fuer jede Bundle-Groesse (1, 3, 5, 10, 20, 50, 100 Packs).
    - **Bessere Lesbarkeit:** Bundle-Faecher lassen sich jetzt direkt nach Menge vergleichen.

## [1.0.14] - 2026-03-30
- **Demo Bundles (Faecher-Fokus):** Experimentier-Route `/shop/demo-bundles` gezielt um viele weitere Faecher-Anordnungen erweitert.
    - **Neue Fan-Layouts:** `fan-wide`, `fan-cascade`, `fan-ring`.
    - **Mehr Beispielkarten:** Umfangreicher neuer Bereich "Faecher-Labor" mit vielen Kombinationen aus Pack-Mengen, Farben und Dichten.
    - **Auto-Mix verfeinert:** Kleine/mittlere Bundles nutzen im Experimental-Modus staerker faecherartige Anordnungen.
- **Live-Shop unveraendert:** Produktive Shop-Karten bleiben weiterhin im klassischen Design.

## [1.0.13] - 2026-03-30
- **Demo Bundles massiv erweitert:** Deutlich mehr Anordnungen fuer Packs auf der Extra-Route `/shop/demo-bundles` hinzugefuegt.
    - **Neue Layout-Typen:** `pile` (Haufen), `pyramid`, `wall`, `zigzag`, `double-crate`.
    - **Bestehende Layouts behalten:** `fan`, `tower`, `crate`, `mountain`, `auto`.
    - **Mehr Varianten insgesamt:** Viele neue Kombinationen aus Layout, Pack-Menge, Farbe und Dichte in gruppierten Sektionen (Haufen/Berge/Stapel/Kisten/Waende/Auto-Mix).
- **Sicherer Rollout:** Live-Shop bleibt weiterhin beim klassischen Bundle-Design; Experimente bleiben isoliert auf der Demo-Route.

## [1.0.12] - 2026-03-30
- **Shop Visual Routing:** Live-Shop wieder auf das klassische Bundle-Design zurückgestellt.
    - Alte Booster-Optik ist nun wieder Standard in den Produktkarten unter `/shop`.
    - Die neuen experimentellen Bundle-Designs bleiben bewusst auf der Extra-Route isoliert.
- **Experimentier-Route:** `/shop/demo-bundles` nutzt jetzt explizit den `experimental` Modus der Bundle-Visual-Komponente.
    - Alle neuen Layout-Experimente (Berge/Kisten/Stapel) werden dort weiterentwickelt, ohne das Live-Shop-Bild zu verändern.

## [1.0.11] - 2026-03-30
- **Shop Visual Upgrade (Bundles):** Booster-Bundle-Bilder deutlich aufgewertet und für große Mengen visuell klarer gemacht.
    - **Neue Visual-Stile:** Dynamische Darstellungen für `Pack-Berge`, `Kisten mit Packs` und `Stapel an Packs` ergänzt.
    - **Auto-Layout nach Bundle-Größe:** Kleine Bundles bleiben kompakt, große Bundles wechseln automatisch auf massivere Szenen (mehr Tiefenwirkung und besseres Mengen-Gefühl).
    - **Farbunterstützung erweitert:** Bundle-Visuals unterstützen jetzt zusätzlich `emerald`, `slate` und `rose`.
- **Neue Shop-Unterseite:** Demo-Galerie unter `/shop/demo-bundles` erstellt.
    - Enthält viele Beispielbilder/Varianten zum direkten Vergleich der Bundle-Optiken.
    - Inklusive kurzer Vorschlagssektion mit konkreten Ideen für Berge/Kisten/Stapel.
- **Shop UX:** Direktlink zur neuen Demo-Galerie im Shop-Hero ergänzt.

## [1.0.10] - 2026-03-30
- **Shop Update (Sammelkarten):** Preisstrategie erneut angepasst und Bundle-Namen überarbeitet.
    - **Einzelkartenpreis im Schnupper-Pack:** 0,20 € pro Karte (1 Pack = 0,60 € bei 3 Karten).
    - **Progressive Bundle-Staffel:** Mit jedem größeren Bundle sinkt der effektive Kartenpreis.
        - `Schnupper-Pack` (1 Pack / 3 Karten): 0,60 € (0,20 €/Karte)
        - `Starter-Box` (3 Packs / 9 Karten): 1,62 € (0,18 €/Karte)
        - `Fan-Bundle` (5 Packs / 15 Karten): 2,55 € (0,17 €/Karte)
        - `Sammler-Box` (12 Packs / 36 Karten): 5,40 € (0,15 €/Karte)
        - `Ultra-Tresor` (20 Packs / 60 Karten): 7,80 € (0,13 €/Karte)
    - **Backend-Sync:** Checkout- und Finanzlabels auf die neuen Preise und Bundle-Namen synchronisiert.

## [1.0.9] - 2026-03-30
- **Shop Update (Sammelkarten):** Booster-Preise auf neue Kartenpreis-Logik umgestellt (max. 0,11 € pro zufälliger Karte).
    - **Neue Preisbasis:** 1 Booster Pack (3 Karten) kostet nun 0,33 €.
    - **Starter Pack angepasst:** `Starter Pack` enthält jetzt 3 Packs für 0,99 €.
    - **Bestehende Bundles neu bepreist:**
        - `Booster Bundle` (5 Packs): 1,65 €
        - `Elite Box` (12 Packs): 3,96 €
    - **Neue Bundles ergänzt:**
        - `Einzelpack` (1 Pack): 0,33 €
        - `Mega Kiste` (20 Packs): 6,60 €
    - **Checkout/Backend synchronisiert:** Stripe-Produktzuordnung und Monatslimits für neue/angepasste Booster-Produkte aktualisiert.

## [1.0.8] - 2026-03-29
- **Hotfix (News Editor):** Console-Warnung im Dialog-Rendering behoben.
    - **Dialog API-Kompatibilität:** Ungültiges Prop `onInteractOutside` aus News-Dialogen entfernt (Base-UI kompatibel).
    - **Stabiler Bild-Flow:** Schließen des Dialogs wird während Dateiauswahl/Zuschnitt weiterhin über `onOpenChange` kontrolliert, inklusive sauberem Reset bei abgebrochener Dateiauswahl.

## [1.0.7] - 2026-03-29
- **Hotfix (News Editor):** Bildauswahl im Erstellen/Bearbeiten-Dialog stabilisiert.
    - **Dialog-Stabilität:** Während Dateiauswahl und offenem Cropper wird das unbeabsichtigte Schließen des Dialogs unterbunden, damit Inhalte nicht verschwinden.
    - **Bild-Workflow:** Der Zuschnitt kann nun zuverlässig abgeschlossen und das Bild als Titelbild übernommen werden.

## [1.0.6] - 2026-03-29
- **Hotfix (News Editor):** React-Hook-Fehler beim Bearbeiten von News behoben.
    - **`useEffect` Stabilisierung:** Das Dependency-Array im Bearbeitungsdialog hat nun eine konstante Größe (`[open, news.id]`), wodurch der Console-Fehler "The final argument passed to useEffect changed size between renders" nicht mehr auftritt.

## [1.0.5] - 2026-03-29
- **Mobile Optimization (News Editor):** Verbesserte Bedienbarkeit des News-Editors auf Smartphones.
    - **Optimiertes Scrolling:** Zentralisierter Scroll-Bereich im Dialog verhindert doppelte Scrollbalken und verbessert die Touch-Bedienung.
    - **Responsives Design:** Der Editor nutzt nun die volle Bildschirmbreite auf Mobilgeräten und passt Textgrößen sowie Abstände dynamisch an.
    - **Verbesserte Bild-Vorschau:** Interaktive Bild-Overlays auf Mobile erleichtern das Ändern von Titelbildern.

## [1.0.4] - 2026-03-29
- **Performance & UX (News Editor):** Grundlegende Überarbeitung des News-Editors für bessere Performance und Benutzerführung.
    - **Tabbed Interface:** Einführung von "Editor", "Vorschau" und "Hilfe" Tabs in den Erstellungs- und Bearbeitungs-Dialogen.
    - **Live-Vorschau:** Echtzeit-Vorschau des Beitrags (inkl. Titelbild und Markdown) vor der Veröffentlichung.
    - **Performance-Boost:** Durch die Trennung von Editor und Vorschau wurde die Eingabeverzögerung (Input Lag) beim Tippen langer Texte eliminiert.
    - **Markdown-Guide:** Integrierte Schnellanleitung für die gängigsten Markdown-Befehle direkt im Editor.

## [1.0.3] - 2026-03-29
- **Feature (News):** Erweitertes Markdown-System für News-Beiträge.
    - **GFM-Support:** Unterstützung für Tabellen, Aufgabenlisten (Task Lists), Durchstreichen und Autolinks via `remark-gfm`.
    - **Code-Highlighting:** Einführung von stilisierten Inline-Code und Code-Blöcken für technische Updates.
    - **Layout-Verbesserungen:** Optimierte Darstellung von Blockquotes, Listen und Tabellen für bessere Lesbarkeit auf allen Geräten.
    - **Dashboard-Integration:** Auch News-Vorschauen auf dem Dashboard unterstützen nun einfache Markdown-Formatierung.

## [1.0.2] - 2026-03-29
- **Bug-Fix (Finanzplaner):** Korrektur der Zielsummen-Anzeige auf dem Dashboard.
    - **Dashboard-Priorisierung:** Das Finanzierungsziel wird nun korrekt aus den Systemeinstellungen (`funding_goal`) geladen, anstatt fälschlicherweise die Summe der Ausgaben als Ziel zu priorisieren.

## [1.0.1] - 2026-03-29
- **Performance-Optimierung (Sammelkarten):** Massive Verbesserung der Reaktionszeit beim Sortieren und Filtern im Lehrer-Album.
    - **Schwartzian Transform:** Einführung einer Vorberechnungs-Ebene (`teacherMetadata`) für Sortier-Gewichte, um teure Lookups während des Sortiervorgangs zu eliminieren (O(1) statt O(N log N)).
    - **Component Memoization:** Die `TeacherCard`-Komponente wurde memoisiert (`React.memo`), um unnötige Re-renders des gesamten Grids bei Positionsänderungen zu verhindern.
    - **Rendering-Effizienz:** `cardData` wird nun ebenfalls vorab berechnet, um Objekt-Instanziierungen während des Renderings zu minimieren.

## [1.0.0] - 2026-03-29
- **Production Readiness Milestone:** Offizieller Release der Version 1.0.0.
- **GoBD Compliance:** Einführung einer automatisierten Archivierung für Audit-Logs (`archiveAuditLogs`). Datensätze, die älter als 12 Monate sind, werden nun wöchentlich in eine Langzeit-Kollektion (`audit_archives`) überführt.
- **Database Hygiene:** Automatisierte Bereinigung der `danger_logs` nach 30 Tagen zur Optimierung des Speicherplatzes.
- **Final Security Audit:** Bestätigung aller kritischen Fixes (Server-side RNG, gehärtete Firestore Rules, Stripe Billing Address Pflicht).
- **Stability:** Alle Systeme (Kalender, Finanzen, Sammelkarten, Admin-Zentrale) wurden für den Live-Betrieb verifiziert.

## [0.37.27] - 2026-03-29
- **Sammelkarten Refinement (Sorting):** Präzisierung der Filter- und Sortierfunktionen im Lehrer-Album.
    - **Duale Sortierung:** Unterscheidung zwischen "Seltenheit" (Legendary > Mythic...) und "Variante" (BlackHolo > Shiny...).
    - **UI:** Hinzufügen einer dedizierten "Variante"-Option im Sortier-Menü.
    - **Priorisierung:** BlackHolos (Secret Rare) und Legendary Karten werden nun in ihren jeweiligen Sortier-Modi korrekt an oberster Stelle priorisiert.

## [0.37.26] - 2026-03-29
- **Hotfix (Groups Page):** Behebung eines `ReferenceError: cn is not defined` auf der Planungsgruppen-Seite, der durch einen fehlenden Import nach dem visuellen Update verursacht wurde.

## [0.37.25] - 2026-03-29
- **Referral Program Update (v2):** Umstellung des Empfehlungsprogramms auf ein monatlich progressives Belohnungsmodell.
    - **Referrer-Belohnungen:** Werber starten jeden Monat neu bei 4 Boostern für die erste Empfehlung. Die Belohnung steigert sich pro Monat progressiv (4, 5, 6, 7, 8 Booster), bis das monatliche Limit von 30 Boostern nach 5 Empfehlungen erreicht ist.
    - **Monatlicher Reset:** Die Belohnungsstufe wird am ersten Tag jedes Monats automatisch auf 4 Booster zurückgesetzt.
    - **UI:** Überarbeitung des Einladungs-Dashboards mit aktueller Belohnungsvorschau ("Dein nächster Freund bringt dir X Booster") basierend auf den monatlichen Erfolgen.
    - **Backend:** Optimierte Cloud Functions Logik für die monatliche Abrechnung und Validierung der progressiven Belohnungen.

## [0.37.25] - 2026-03-29
- **Groups Page Visual Overhaul:** Komplette optische Überarbeitung der Planungsgruppen-Seite für einen modernen "Premium-Look".
    - Einführung von 3D-Effekten, sanften Verläufen und abgerundeten Ecken (`rounded-[2.5rem]`).
    - **Alle Gruppen:** Dynamische Farbakzente pro Gruppe, verbesserte Statistiken mit Fortschrittsbalken und visuelle Header.
    - **Mein Team:** Veredelte Ansicht des eigenen Workspace mit atmosphärischen Hintergründen und optimierten Team-Karten.
    - **Shared Hub:** Modernisiertes Layout für die globale Kommunikation mit Live-Status-Indikatoren und verbesserten Richtlinien-Karten.
    - **UX:** Sanftere Animationen und verbesserte responsive Darstellung auf allen Endgeräten.

## [0.37.24] - 2026-03-29
- **Navbar UI Restore:** Die direkten Links zu den Gruppenbereichen ("Mein Team", "Alle Gruppen", "Shared Hub") wurden im Untermenü 'Planung' wiederhergestellt, um einen schnelleren Zugriff auf die verschiedenen Team-Workspaces zu ermöglichen.

## [0.37.23] - 2026-03-29
- **Database Index Fix:** Die Sortier-Reihenfolge des `referral_claims` Index wurde von `DESC` auf `ASC` korrigiert, um exakt den Anforderungen der Firestore-Abfrage zu entsprechen.

## [0.37.22] - 2026-03-29
- **Database Index Fix:** Fehlenden zusammengesetzten Index für die `referral_claims` Collection hinzugefügt. Dies behebt den `FAILED_PRECONDITION` Fehler, der die automatisierte Vergabe von Referral-Belohnungen blockiert hat.

## [0.37.21] - 2026-03-29
- **Referral Migration Härtung:** Präzisere Fehlermeldungen in der Migrations-Zusammenfassung hinzugefügt, um exakt zu bestimmen, warum bestimmte Werber-Codes nicht aufgelöst werden konnten.

## [0.37.20] - 2026-03-29
- **Referral Migration Diagnostic:** Die Migrations-Ergebnisse wurden um eine detaillierte Fehlerliste erweitert. Admins sehen nun direkt, welche Werber-Codes nicht aufgelöst werden konnten, was die Identifizierung von ungültigen oder veralteten Referral-Links in Nutzerprofilen erleichtert.

## [0.37.19] - 2026-03-29
- **Referral "Full-Scan" Migration:** Die Migrations-Logik wurde massiv erweitert. Anstatt nur die alte `referrals` Collection zu prüfen, scannt das System nun alle Nutzerprofile. Nutzer, die einen Werber-Code besitzen, aber bisher keine Belohnung erhalten haben, werden nun automatisch erkannt und vergütet. Dies korrigiert alle bisherigen Fehlerfälle gesammelt über die Admin-Oberfläche.

## [0.37.18] - 2026-03-29
- **Referral "Super-Search":** Die Werber-Erkennung wurde nochmals erweitert und nutzt nun auch eine Präfix-Suche auf die User-IDs. Dies stellt sicher, dass Referral-Links auch dann funktionieren, wenn das Feld `referral_code` im Werber-Profil noch nicht generiert wurde, die ID aber mit dem Code übereinstimmt.

## [0.37.17] - 2026-03-29
- **Bugfix (UI):** Bereinigung der JSX-Struktur im Referrer-Diagnose-Tool. Ein Klammerfehler wurde korrigiert, der in Version 0.37.16 zu einem Absturz der Admin-Seite führte.

## [0.37.16] - 2026-03-29
- **Bugfix (UI):** Behebung eines Syntaxfehlers im Diagnose-Tool der Migrationsseite, der den Seitenaufbau verhinderte.

## [0.37.15] - 2026-03-29
- **Diagnostic UX:** Das Referrer-Diagnose-Tool zeigt nun bei einer fehlgeschlagenen Suche Beispiel-Codes aus der Datenbank an. Dies hilft Admins zu erkennen, ob Codes ein falsches Format haben oder ob das `referral_code` Feld in der Datenbank generell fehlt.

## [0.37.14] - 2026-03-29
- **Build Fix (Functions):** Behebung eines TypeScript-Fehlers in der `referrals.ts` Cloud Function, der durch ein fehlendes Feld im lokalen `Profile` Interface den Deployment-Prozess verhinderte.

## [0.37.13] - 2026-03-29
- **Local Dev Fix (CORS):** CORS-Unterstützung für alle Referral-Cloud-Functions aktiviert. Dies ermöglicht den Aufruf der Funktionen von `localhost:3000` gegen das Produktiv-Backend, was die lokale Entwicklung und Diagnose erheblich erleichtert.

## [0.37.12] - 2026-03-29
- **Diagnostic Tooling:** Diagnose-Werkzeug ("Referrer-Check") auf der Migrationsseite hinzugefügt. Admins können nun gezielt prüfen, ob Werbe-Codes (UIDs oder Kurz-Codes) korrekt vom System aufgelöst werden können und ob Datenbank-Indizes korrekt funktionieren.

## [0.37.11] - 2026-03-29
- **Profile Card Update (Rarity Priority):** Die "Top 5"-Vorschau im Lehrer-Album auf Profilseiten zeigt nun die seltensten Karten basierend auf der Variante (Version) vor der Basis-Seltenheit an (z.B. Secret Rare > Legendary). Die Vorschau wurde zudem optisch entschlackt (Filter und Statistiken werden erst beim Ausklappen angezeigt), wobei der "Alle anzeigen"-Button erhalten bleibt.

## [0.37.12] - 2026-03-29
- **Build Fix (Finanzen):** Behebung eines kritischen TypeScript-Fehlers auf der Finanzseite, bei dem eine undefinierte Variable (`estimatedFundingGoal`) im `ClassRanking` Widget den Produktions-Build verhinderte.

## [0.37.11] - 2026-03-29
- **Referral Robustness Update:** Die Referrer-Suche wurde erheblich verbessert. Das System kann nun sowohl kurze 8-stellige Codes als auch vollständige User-IDs (UIDs) im Feld `referred_by` auflösen. Dies stellt sicher, dass Belohnungen auch dann korrekt zugeordnet werden, wenn historische Daten oder unterschiedliche Link-Formate verwendet wurden.

## [0.37.10] - 2026-03-29
- **Referral Diagnostic Update:** Erweitertes Logging sowohl im Frontend (`AuthContext`) als auch im Backend (`functions`) für das Empfehlungssystem hinzugefügt. Dies ermöglicht eine präzise Fehlerdiagnose, warum Belohnungen in bestimmten Fällen nicht gutgeschrieben werden.

## [0.37.9] - 2026-03-29
- **Bugfix (UI):** Korrektur eines React-Prop-Fehlers auf der Referral-Migrationsseite. Die `Button`-Komponente verwendet nun korrekt das `render`-Prop-Pattern anstelle von `asChild`, was die Konsolenausgabe bereinigt und die UI-Stabilität verbessert.

## [0.37.8] - 2026-03-29
- **Migration Utility:** Web-Interface für die Referral-Migration unter `/admin/migrate-referrals` hinzugefügt. Dies ermöglicht es Admins, die Datenüberführung sicher und bequem über die App auszulösen, ohne die Browser-Konsole nutzen zu müssen.

## [0.37.7] - 2026-03-29
- **Referral Migration:** Einführung einer Admin-Funktion (`adminMigrateReferrals`), um alle bestehenden Empfehlungsdaten sicher in das neue robuste V2-System zu überführen. Dies korrigiert die Statistiken (`total_referrals`) und stellt sicher, dass alle historischen Boni korrekt in der neuen `referral_claims` Collection erfasst sind.

## [0.37.6] - 2026-03-29
- **Logo Update:** Die Projektlogos wurden durch neu erstellte PNG-Grafiken in verschiedenen Größen (groß, mittel, klein) ersetzt, um die Bildqualität und das Branding systemweit zu verbessern.

## [0.37.5] - 2026-03-29
- **Robustes Referral-System:** Komplette Überarbeitung des Empfehlungsprogramms für maximale Zuverlässigkeit.
  - Einführung einer `referral_claims` Collection als "Source of Truth" zur Vermeidung von Doppel-Gutschriften.
  - Neue `claimReferral` Cloud Function (onCall), die bei jeder Anmeldung/Registrierung automatisch prüft, ob eine Belohnung aussteht.
  - Idempotente Verarbeitung: Belohnungen werden nur einmalig gewährt, auch bei mehrfachen Triggern.
  - Präzise Statistiken: Der Referrer erhält nun dauerhafte Zähler für `total_referrals` und `total_referral_boosters` in seinem Profil.
  - Abwärtskompatibilität zur bisherigen `referrals` Collection für das Dashboard bleibt bestehen.

## [0.37.4] - 2026-03-29
- **Visual Update:** Das problematische SVG-Logo wurde durch die PNG-Versionen ersetzt, um eine konsistente Darstellung über alle Endgeräte und Browser hinweg zu gewährleisten.

## [0.37.3] - 2026-03-29
- **Registration UX Fix:** Validierungsfehler (wie "Bitte überprüfe deine E-Mail...") erscheinen nun erst nach der ersten Interaktion/Absenden, nicht mehr direkt beim Laden der Seite.
- **Privacy & UX:** Parodie-Werbebanner und Cookie-Popups werden nun auf Auth-Seiten (Login, Register, Waiting) unterdrückt, um den Fokus auf die Kernfunktionen zu legen.
- **Logo Rendering Fix:** Das Logo (`logo.svg`) wurde von Text auf Pfade umgestellt, um eine konsistente Darstellung der Schriftart "LEDLIGHT" auf allen Geräten und Browsern zu garantieren (kein Font-Fallback mehr).
- **Referral System Härtung:** Expliziter Firestore-Index für `referral_code` in der `profiles` Collection hinzugefügt, um die Referrer-Suche in der Cloud Function zuverlässiger zu machen.

## [0.37.2] - 2026-03-29
- **Bugfix (Referral System):** Behebung eines Fehlers im Empfehlungsprogramm, der die Gutschrift von Bonus-Boostern verhinderte. Die Cloud Function `awardReferralBoosters` wurde auf die konsistente Verwendung von `FieldValue` aus dem modularen Firestore SDK (`firebase-admin/firestore`) umgestellt, um Transaktionsfehler zu vermeiden. Zusätzliche Logging-Punkte wurden für eine bessere Fehlerdiagnose im Backend integriert.

## [0.36.30] - 2026-03-29
- **Navbar UI Adjustment:** Der Projektschriftzug "ABI Planer" wurde neben dem Logo in der Navigation wiederhergestellt, wie vom Nutzer gewünscht. Das neue Logo (`ABI Planer Logo.svg`) wird nun harmonisch neben dem Text angezeigt.

## [0.36.29] - 2026-03-29
- **Navbar UI Refinement:** Redundante Text-Branding ("ABI Planer") neben dem Logo in der Navigation entfernt. Das neue Logo dient nun als alleiniges, cleanes Branding-Element in der Sidebar und im mobilen Header.
- **Visual Branding:** Logo-Größe in der Navigation für bessere Präsenz optimiert (56x56 in Sidebar, 48x48 im mobilen Header) und mittig ausgerichtet.

## [0.36.28] - 2026-03-29
- **Admin Focus (Settings):** Die Wahrscheinlichkeit für Werbe-Parodie-Banner ist nun in den globalen Einstellungen separat von der Cookie-Wahrscheinlichkeit einstellbar.
- **Performance Update (Stability):** Behebung eines Fehlers, der bei Hintergrund-Updates (z.B. Online-Status Heartbeat) ein unnötiges Neu-Initialisieren aller Datenbank-Listener auf dem Dashboard und in der System-Benachrichtigung auslöste. Die Seite ist nun deutlich ruhiger und flackert nicht mehr.

## [0.37.0] - 2026-03-29
- **Branding Update:** Das neue Logo (`ABI Planer Logo.svg`) wurde systemweit integriert und alle Assets (Favicons etc.) regeneriert.
- **Login Focus (UX):** Einführung eines "Passwort vergessen?" Links direkt auf der Anmeldeseite für eigenständige Passwort-Resets via Lernsax-Mail.
- **Bugfix (Hydration/DOM Nesting):** Behebung eines kritischen Hydration-Fehlers im `ForgotPasswordDialog` durch Korrektur des `DialogTrigger` Pattern (Umstellung von `asChild` auf `render`).
- **iPad Focus (Mobile UX):** Anhebung des Breakpoints für die Sidebar auf `lg` (1024px) und Optimierung des Dashboard-Grids (2 Spalten ab `md`) für Tablets.
- **Finance UX (Tablets):** Optimiertes Grid für Status-Karten (2x2) zur Vermeidung von Layout-Clipping auf iPads.
- **GDPR Härtung (Backend):** Erweiterung der Löschlogik um die Anonymisierung der `logs` Collection (Recht auf Vergessenwerden).
- **Legal Compliance:** Aktualisierung und Unifizierung aller Rechtstexte auf den Stand vom 29. März 2026.
- **Documentation:** Einführung der v1.0.0 Production Release-Checkliste.

## [0.36.27] - 2026-03-29
- **Mobile UI (Shop):** Checkout-Modal auf kleinen Displays kompakter gemacht (`max-h`, `overflow-y-auto`, kleinere Abstände/Typografie), damit Inhalte nicht abgeschnitten werden.
- **Mobile Layering:** Z-Index-Konflikt zwischen Shop-Header und mobilem Menü behoben (Drawer jetzt über App-Content).
- **Mobile UI (Finanzen):** Header-Actions umbrechbar gemacht, damit `Beitrag erfassen` und `Spenden & Hilfe` auf kleinen Screens nicht mehr abgeschnitten werden.
- **Cards Performance:** Externe Noise-Textur in Karten-Overlays entfernt und durch lokale CSS-Texturen ersetzt, damit der erste Booster schneller rendert.
- **Cards Visual Fix:** Overlay-Clipping auf `rounded-[inherit]` gesetzt, um sichtbare Mini-Ecken an Holo/Shiny-Artcards in der Detailansicht zu beseitigen.
- **403 Page Cleanup:** `/unauthorized` intern bereinigt (Reason-Mapping extrahiert, angefragter Pfad robust formatiert), ohne Verhaltensänderung der Seite.

## [0.36.26] - 2026-03-29
- **Shop Update (Spenden):** Kursauswahl bei Spenden ist jetzt optional (statt verpflichtend).
- **Spenden-Checkout:** Optionales Namensfeld ergänzt, damit Spendende ihren Namen freiwillig angeben können.
- **Backend Mapping:** Kurs- und Namensangaben werden nur bei Eingabe übernommen und in der Transaktion/Finanzbuchung gespeichert.

## [0.36.25] - 2026-03-29
- **Shop/Leaderboard:** Bei Spenden im Shop ist die Auswahl eines Kurses jetzt verpflichtend. Die Kurszuordnung wird an Stripe-Metadaten übergeben und fließt ins Kurs-Ranking ein.
- **Finance Automation:** Alle Stripe-Käufe (Spenden und Booster) werden nun automatisch als Einnahmen in `finances` erfasst.
- **Finance Attribution:** Finanz-Einträge aus Shop-Käufen speichern Kursbezug (`responsible_class`) und Zahler-Kontext (`responsible_user_name`) für transparente Auswertung.

## [0.36.24] - 2026-03-29
- **Shop Text Update:** Bei den drei Spendenartikeln im globalen Shop wurde das Präfix "Soli-" aus den Artikelnamen entfernt.

## [0.36.23] - 2026-03-29
- **Shop Update (Spenden):** Soli-Beiträge wurden auf drei feste Stufen erweitert: Klein (2,50 €), Mittel (10,00 €), Groß (25,00 €).
- **Stripe Mapping:** Die Spendenartikel sind jetzt direkt mit den bereitgestellten Stripe-Price-IDs verknüpft:
    - `soli-donation-small` -> `price_1TGGzZAnqErqKKxAn2UYcCxq`
    - `soli-donation-medium` -> `price_1TGGzsAnqErqKKxASTxTWqYj`
    - `soli-donation-large` -> `price_1TGH03AnqErqKKxABplUroCg`

## [0.36.22] - 2026-03-29
- **Shop Fix (Spendenartikel):** Die Soli-Beiträge im globalen Shop wurden aktiviert und sind nicht mehr als Platzhalter markiert.
- **Payments (Stripe Checkout):** `createStripeCheckoutSession` unterstützt Spendenartikel jetzt robust per `price_data` (EUR-Cents), auch ohne fest hinterlegte Stripe-Price-ID.
- **Legal Consistency:** Der Hinweis zum Widerrufsverzicht wird im Checkout nur noch für digitale App-Inhalte (Booster) angezeigt, nicht für Spendenartikel.

## [0.36.21] - 2026-03-29
- **Build Fix (App Hosting):** `useSearchParams()` auf der Seite `/unauthorized` in eine `Suspense`-Boundary gekapselt, damit Next.js 16 die Seite beim Prerendern korrekt bauen kann.

## [0.36.20] - 2026-03-29
- **Git Hygiene:** Root `.gitignore` erweitert, damit KI-Agenten-/Prompt-Konfigs (u.a. `.gemini`, `dotgemini`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) nicht mehr neu in Git aufgenommen werden.
- **Repository Cleanup:** Bereits getrackte Dateien unter `dotgemini/` wurden per `git rm --cached` aus dem Index entfernt, bleiben lokal aber erhalten.

## [0.36.19] - 2026-03-29
- **Hotfix (Runtime):** Behebung des React-Fehlers "Rendered fewer hooks than expected" auf der Sammelkarten-Seite.
- **Stability:** Die geschuetzte Gast-Ansicht wird nun im finalen Render-Zweig angezeigt (statt per fruehem Return vor spaeteren Hooks), wodurch die Hook-Reihenfolge stabil bleibt.

## [0.36.18] - 2026-03-29
- **Routing (403):** Neue Seite unter `/unauthorized` fuer klare Fehlermeldungen bei fehlenden Berechtigungen.
- **Admin Access UX:** Alle Admin-Routen leiten bei direktem URL-Zugriff ohne Rolle nicht mehr still auf `/` um, sondern auf die neue 403-Seite inklusive angefragtem Pfad.
- **Routing (404):** Globale `not-found` Seite hinzugefuegt, damit ungültige URLs eine saubere 404-Ansicht anzeigen.

## [0.36.17] - 2026-03-29
- **Fix (Sammelkarten-Semantik):** `booster_stats.count` wird im Backend wieder korrekt als Tages-Öffnungszähler verwendet (statt als Guthaben).
- **Backend Consistency:** `openBooster` berechnet verfügbare Packs nun aus Tageslimit (`daily_allowance`) plus `extra_available` und verarbeitet den Tageswechsel über `last_reset`/`reset_hour` konsistent.
- **UI Consistency:** Die Anzeige der verbleibenden Packs nutzt wieder das Modell `daily_allowance - count + extra_available` (inkl. begrenztem Carryover), damit Frontend und Cloud Function übereinstimmen.

## [0.36.16] - 2026-03-29
- **Fix (Sammelkarten/Booster):** `openBooster` berücksichtigt nun verfügbare Packs aus `booster_stats.count` und `booster_stats.extra_available` gemeinsam.
- **Consistency (Backend):** Beim Öffnen werden Packs jetzt konsistent zuerst aus `count` und danach aus `extra_available` abgezogen, damit Anzeige und Server-Prüfung nicht mehr auseinanderlaufen.

## [0.36.15] - 2026-03-28
- **UX Reversion:** Die Sortier-Logik und der Funktionsumfang des Dashboards für angemeldete Nutzer wurden vollständig auf den ursprünglichen Stand zurückgesetzt (inkl. Ranking/Leaderboard). Lediglich die Sammelkarten-Werbung bleibt für Konto-Inhaber ausgeblendet, um die Benutzeroberfläche sauber zu halten.
- **Guest Logic Stability:** Die optimierte "Promo-First" Ansicht für Gäste bleibt erhalten, ohne die Erfahrung für registrierte Nutzer zu beeinflussen.

## [0.36.14] - 2026-03-28
- **UX Update (First Impression):** Optimierung des Dashboards für neue Besucher. Die Sammelkarten-Promo wird für Gäste nun als allererstes Element angezeigt, um sofort ein visuelles Highlight zu setzen und das Interesse am Projekt zu wecken.
- **Contextual UI:** Die Sammelkarten-Werbung wird für bereits angemeldete Nutzer nun konsequent ausgeblendet, um Platz für deren eigentliche Planungsdaten zu schaffen.

## [0.36.13] - 2026-03-28
- **UX Refinement (Navbar):** Der Menüpunkt 'Umfragen' wird für Gäste nun ebenfalls in der Sidebar ausgeblendet. Damit sind alle interaktiven und geschützten Bereiche der App für nicht angemeldete Nutzer unsichtbar, was die Navigation auf die öffentlich zugänglichen Inhalte (Dashboard & News) fokussiert.

## [0.36.12] - 2026-03-28
- **UX Refinement (Navbar):** Die gesamte Menü-Kategorie 'Planung' (Kalender, Todos, Gruppen) wird für Gäste nun vollständig ausgeblendet, um die Navigation übersichtlicher zu gestalten.
- **Promo Page Update:** Die `/zugang` Seite wurde aktualisiert, um die aktuellen Berechtigungsunterschiede zwischen Gästen und registrierten Nutzern korrekt widerzuspiegeln. Sie dient nun als zentraler Info-Hub für die Vorteile eines Lernsax-Accounts.

## [0.36.11] - 2026-03-28
- **Shop Update:** Booster-Packs und andere kontoabhängige Artikel werden für Gäste nun vollständig ausgeblendet, statt nur gesperrt zu sein. Dies sorgt für eine übersichtlichere Shop-Ansicht, die nur aktuell kaufbare Artikel für den jeweiligen Nutzer anzeigt.
- **Dynamic Categories:** Shop-Kategorien werden nun dynamisch gefiltert. Kategorien, die für den aktuellen Nutzer keine verfügbaren Artikel enthalten (z.B. 'Sammelkarten' für Gäste), werden automatisch verborgen.

## [0.36.10] - 2026-03-28
- **Bugfix (Shop):** Behebung eines `ReferenceError`, bei dem das `Loader2` Icon im Shop nicht korrekt importiert war und zu einem Absturz der Seite führte.

## [0.36.9] - 2026-03-28
- **Shop Update (Guest Checkout):** Einführung von Gast-Bestellungen für app-unabhängige Artikel (z.B. Soli-Beiträge, Merch). Nicht angemeldete Nutzer können nun den Shop durchstöbern und ausgewählte Artikel direkt über Stripe erwerben.
- **Item-Level Security:** App-spezifische digitale Güter (wie Booster-Packs) bleiben weiterhin exklusiv für angemeldete Nutzer mit Lernsax-Konto reserviert. Die Benutzeroberfläche führt Gäste nun gezielt durch die unterschiedlichen Berechtigungsstufen pro Artikel.
- **Backend Fulfillment:** Die Cloud Functions wurden aktualisiert, um Zahlungen sowohl für registrierte Nutzer (automatisierte Booster-Gutschrift) als auch für Gäste (reine Transaktionserfassung) sicher abzuwickeln.

## [0.36.8] - 2026-03-28
- **Security & UX (Shop):** Der Shop wurde nun ebenfalls mit einem visuellen `ProtectedSystemGate` für nicht angemeldete Nutzer versehen. Dies stellt sicher, dass Käufe nur von authentifizierten Nutzern getätigt werden können, während Gäste weiterhin über die Vorteile des Shops informiert werden.

## [0.36.7] - 2026-03-28
- **UX Refinement (Dashboard):** Präzisierung der Dashboard-Sichtbarkeit. Das "Stufen-Ranking" (Leaderboard) und das uneingeschränkte Finanz-Widget sind nun ausschließlich für angemeldete Nutzer sichtbar.
- **Privacy Enforcement:** Für Gäste (Nutzer ohne Konto) bleibt das Ranking vollständig verborgen und das Finanz-Widget zeigt nur anonymisierte Fortschrittsdaten ohne exakte Beträge. Sobald ein Nutzer angemeldet ist, stehen alle Funktionen und Daten wie gewohnt uneingeschränkt zur Verfügung.

## [0.36.6] - 2026-03-28
- **Privacy Update (Dashboard):** Das "Stufen-Ranking" (Leaderboard) wurde vom Dashboard entfernt.
- **Financial Privacy:** Das Finanz-Widget auf dem Dashboard wurde für Gäste eingeschränkt. Ohne Anmeldung sind der exakte Kassenstand sowie die Ticketpreis-Kalkulation verborgen; es wird lediglich der Fortschritt zum Gesamtziel visualisiert.
- **News Engagement:** Liken und Kommentieren von News-Beiträgen ist nun technisch und visuell nur noch für angemeldete Nutzer möglich.
- **Stability Fix:** Behebung eines Fehlers bei der Initialisierung von Dashboard-Daten nach dem Login.

## [0.36.5] - 2026-03-28
- **UX & Privacy (Dashboard):** Termine und Todos werden für nicht angemeldete Nutzer nun vollständig vom Dashboard ausgeblendet. Zudem wurde das Dashboard für Gäste auf die wesentlichen öffentlichen Inhalte (News & Sammelkarten-Promo) reduziert, um eine saubere und einladende Oberfläche ohne leere Boxen zu gewährleisten.
- **Navigation Update:** Die Links zu 'Kalender' und 'Todos' werden in der Sidebar für Gäste nun ebenfalls verborgen, um die Privatsphäre der internen Planung zu wahren.
- **Frontend Performance:** Optimierung der Dashboard-Datenabfragen. Listener für geschützte Daten werden erst gestartet, wenn eine Authentifizierung vorliegt.

## [0.36.4] - 2026-03-28
- **UX Update (Dashboard):** Einführung einer interaktiven Werbe-Kachel für das Sammelkarten-System auf dem Dashboard. Auch nicht angemeldete Nutzer sehen nun die Vorteile des Sammelalbums (Shiny, Holo, Legendary Karten) und werden gezielt zur Registrierung eingeladen, um am Mini-Game teilzunehmen.

## [0.36.3] - 2026-03-28
- **Bugfix (UX):** Behebung eines kritischen Fehlers, bei dem nicht angemeldete Nutzer in einer permanenten Lade-Animation feststeckten. Die `ProtectedSystemGate` Sperr-Anzeige wird nun zuverlässig eingeblendet, wenn kein Profil gefunden wurde.
- **Hook Stability:** Bereinigung der `useEffect` Abhängigkeiten in allen Haupt-Modulen für stabilere Re-Renders.

## [0.36.2] - 2026-03-28
- **Bugfix (Console):** Behebung eines React-Fehlers in der `ProtectedSystemGate` Komponente. Die `asChild` Prop wurde durch das korrekte `render` Prop-Pattern für Buttons ersetzt.
- **Security (Firestore):** Härtung der Frontend-Listener. Datenbank-Abfragen für geschützte Bereiche (Kalender, Finanzen, etc.) werden nun erst nach erfolgreicher Anmeldung gestartet. Dies verhindert "Permission Denied" Fehler in der Browser-Konsole für nicht angemeldete Besucher.

## [0.36.1] - 2026-03-28
- **UX Update (Public Access):** Die News-Sektion ist nun wieder vollständig öffentlich einsehbar, auch ohne angemeldetes Konto. Dies ermöglicht es, wichtige Updates auch externen Personen oder noch nicht registrierten Schülern zugänglich zu machen.
- **Security & UX (Protected Gates):** Alle geschützten Bereiche (Kalender, Finanzen, Umfragen, Sammelkarten, Aufgaben, Gruppen) wurden mit einem visuellen "Login Required"-Gate versehen. Statt eines automatischen Redirects sehen nicht angemeldete Nutzer nun eine informative Sperr-Anzeige mit direktem Link zur Anmeldung.
- **Firestore Rules:** Wiederherstellung des öffentlichen Lesezugriffs für die `news` Collection in den Sicherheitsregeln. Härtung der `todos` Regeln (Lernsax-Pflicht für Lesezugriff).

## [0.36.0] - 2026-03-28
- **Critical Security (TCG Logic):** Die Booster-Generierung (RNG) wurde vollständig auf die Serverseite (`openBooster` Cloud Function) verschoben. Damit ist eine Manipulation der Karten-Drops durch Nutzer technisch ausgeschlossen.
- **Critical Security (Firestore):** Alle Kern-Module (`news`, `events`, `finances`, `polls`, `teachers`) wurden gegen unbefugten Lesezugriff aus dem Internet gesperrt. Zugriff erfordert nun zwingend eine Authentifizierung via Lernsax.
- **Critical Security (Data Integrity):** Nutzer-Schreibrechte auf die eigene Sammelkarten-Kollektion wurden entzogen. Aktualisierungen erfolgen nur noch autorisiert durch das Backend.
- **Compliance (GDPR/DSGVO):** Vervollständigung der Nutzerdaten-Löschung. Das System entfernt nun auch Referral-Daten und anonymisiert Finanz-Datensätze rechtskonform für die GoBD-Aufbewahrungspflicht.
- **Compliance (Stripe):** Die Erfassung der Rechnungsadresse im Checkout ist nun verpflichtend, um die EU-MOSS MwSt-Vorgaben für digitale Güter vollständig zu erfüllen.
- **Automation (Rarity Sync):** Implementierung eines 15-minütigen Cron-Jobs zur globalen Stabilisierung der Lehrer-Seltenheiten (Vermeidung von Seltenheits-Drift).

## [0.35.4] - 2026-03-28
- **Fix (Samsung Browser):** Behebung von Rendering-Problemen im Samsung Mobile Browser durch robustere CSS-Einheiten (%) und verbesserte 3D-Transform-Kompatibilität (`-webkit-` Prefixe, `translateZ` Optimierung).

## [0.35.3] - 2026-03-28
- **Hotfix (Hydration):** Behebung von DOM-Nesting-Fehlern (`<span> cannot be a child of <tbody>`) in der Benutzerverwaltung und in den Admin-Logs. `ContextMenuContent` wurde in ein `TableCell` verschoben, um die HTML-Validität der Tabellenstruktur zu wahren.

## [0.35.2] - 2026-03-28
- **Fix (Shop):** Der Link "Kaffee ausgeben" im Shop öffnet nun zuverlässig in einem neuen Tab (statt Browser-Popup) und ein Tippfehler wurde korrigiert.
- **Consistency (Spenden):** Umstellung des BuyMeACoffee-Links auf einen nativen Anchor-Tag für konsistentes Verhalten.

## [0.35.1] - 2026-03-28
- **UX (Navbar):** Die Untermenüs in der Sidebar sind nun exklusiv (nur eines gleichzeitig offen).
- **Animationen:** Hinzufügen von sanften Öffnungs- und Schließanimationen (framer-motion) für Untermenüs inklusive rotierendem Chevron-Icon.

## [0.35.0] - 2026-03-28

- **UX Update (Navbar):** Umstrukturierung der Navigationsleiste für bessere Übersichtlichkeit durch thematische Gruppierung.
    - **Übersicht:** Dashboard, News, Umfragen.
    - **Planung:** Kalender, Todos, Gruppen.
    - **Finanzen:** Kassenstand, Shop.
    - **Support:** Hilfe, Feedback, Einstellungen.
    - Die Gruppen werden bei aktiven Unterseiten automatisch hervorgehoben.

## [0.34.1] - 2026-03-28
- **Hotfix (Berechtigungen):** Behebung eines kritischen Fehlers, bei dem reguläre Nutzer keine Booster öffnen konnten, da die Firestore-Regeln das Aktualisieren der `booster_stats` auf dem eigenen Profil blockierten.

## [0.34.1] - 2026-03-28
- **Hotfix (Navbar):** Behebung eines `ReferenceError` ("ShoppingBag is not defined") durch Hinzufügen des fehlenden Icon-Imports in der Navigation.

## [0.34.0] - 2026-03-28
- **New Feature (Global Shop):** Einführung eines zentralen Shops unter `/shop`.
    - Der neue Shop bietet Kategorien für Sammelkarten, Stufen-Merch und Sonstiges.
    - Die Booster-Bundles wurden in den globalen Shop integriert.
    - Vorbereitung für weitere Artikel wie Soli-Beiträge und Merchandising.
    - Integration in die Hauptnavigation für bessere Sichtbarkeit.
- **UX Fix (Shop):** Alle Shop-Links führen nun konsistent zum neuen globalen Shop.

## [0.33.5] - 2026-03-28
- **UX Update (Shop):** Der Booster-Shop enthält nun im Footer einen Link zum "BuyMeACoffee"-Profil des Entwicklers für direkten Support.

## [0.33.4] - 2026-03-28
- **Hotfix (Hydration/DOM Nesting):** Behebung eines kritischen Hydration-Fehlers in `src/app/admin/logs/page.tsx`. Durch das Hinzufügen von `asChild` zum `ContextMenuTrigger` wird die Tabellenstruktur (`tr` als direktes Kind von `tbody`) nun korrekt eingehalten.

## [0.33.4] - 2026-03-28
- **UI Update (Sammelkarten):** Die Lehrer-Beschreibung auf der Spec-Karte wurde optisch hervorgehoben (größerer Text, kontrastreicherer Hintergrund), um die Lesbarkeit des "Flavor Texts" zu verbessern.

## [0.33.3] - 2026-03-28
- **Build Fix (Stripe Shop):** Implementierung einer `Suspense` Boundary für die Shop-Seite. Dies behebt den `useSearchParams()` CSR-Bailout Fehler und ermöglicht den erfolgreichen Next.js Build auf Firebase App Hosting.
- **Fix (React Keys):** Robustere Schlüssel-Generierung im Lehrer-Album zur Vermeidung von Dubletten-Warnungen.

## [0.32.1] - 2026-03-28

- **UI Fix (Sammelkarten):** Die Lehrer-Beschreibung wird nun exklusiv auf der Spec-Karte (technische Details) am unteren Rand angezeigt, während das Design der Art-Karte (Artwork) wieder minimalistischer gehalten ist.

## [0.33.2] - 2026-03-28
- **UI Update (Sammelkarten):** Die Lehrer-Beschreibung wird nun auf beiden Kartendesigns (Visual & Spec) am unteren Rand angezeigt, um ein einheitliches und authentisches TCG-Gefühl zu erzeugen.

## [0.33.1] - 2026-03-28
- **Fix (Lehrer-Detailansicht):** Behebung eines Bugs, bei dem sich die Karte beim Anklicken in der Detailansicht gleichzeitig drehte und den Typ wechselte. Die interne Dreh-Logik wurde für die Detailansicht deaktiviert.

## [0.33.0] - 2026-03-28
- **UI Redesign (Lehrer-Detailansicht):** Einführung eines neuen, interaktiven Kartendesigns für die Detailansicht.
    - **Spec Card:** Ein neues Pokémon-inspiriertes Kartendesign, das alle technischen Daten (HP, Angriffe, Beschreibungen) direkt auf einer Sammelkarte anzeigt. Format und Größe entsprechen exakt der Visual Card für einen nahtlosen Wechsel.
    - **Swipeable Carousel:** Nutzer können nun zwischen dem Artwork (Visual Card) und den technischen Details (Spec Card) hin- und herwischen/tappen.
    - **Animationen:** Weiche Übergänge mittels Framer Motion und verbesserte Pagination-Indikatoren.
- **Deduplizierung:** Lehrer-Pool wird nun beim Laden im Album automatisch bereinigt.

## [0.32.2] - 2026-03-28
- **Fix (React Keys):** Behebung eines "Duplicate Key"-Fehlers im Lehrer-Album (`herr-zeiler`). Die Lehrer-Liste wird nun beim Laden automatisch dedupliziert und die React-Keys wurden durch einen Index-Suffix robuster gestaltet.

## [0.32.1] - 2026-03-28
- **Fix (Lehrer-Album):** Behebung eines Fehlers, bei dem Lehrerdaten (HP, Angriffe, Beschreibungen) nicht in der Detailansicht angezeigt wurden. Der Album-View nutzt nun konsistent die neuen `settings/sammelkarten`-Daten als Primärquelle.
- **UI Fix (Profil-Album):** Korrektur der Album-Vorschau auf der Profilseite; es werden nun wie vorgesehen nur die Top 5 Karten angezeigt statt des gesamten Albums.

## [0.32.0] - 2026-03-28
- **Feature (Stripe Payment):** Vollständige Integration der Stripe-Zahlungsabwicklung für den Booster-Shop. Nutzer können nun echte Kartenpakete sicher erwerben.
- **Sicherheit (Webhook-Guard):** Implementierung eines hochsicheren Webhook-Systems (`stripeWebhook`) mit kryptografischer Signatur-Verifizierung und Idempotenz-Prüfung zur Vermeidung von Doppelbuchungen.
- **Rechtliche Absicherung:**
    - **Widerrufsverzicht:** Integration der gesetzlich vorgeschriebenen Checkbox/Hinweise zum Verzicht auf das Widerrufsrecht bei digitalen Inhalten (Booster-Packs) direkt im Checkout-Prozess.
    - **Stripe Tax:** Automatisierte Berechnung und Abführung der länderspezifischen Umsatzsteuer für digitale Güter.
    - **Dokumentations-Update:** Vollständige Überarbeitung der **AGB**, **Datenschutzerklärung**, **Sammelkarten-Infoseite** und der **Hilfe-FAQs** zur korrekten Abbildung des Kaufprozesses.
- **Wirtschaftssystem:** Transparente Ausweisung der **90% Spendenquote** für die jeweilige Abikasse pro Verkauf.
- **Backend-Stabilität:** Behebung von Typ-Konflikten (v1 zu v2) bei Cloud Functions im Referral-System (`awardReferralBoosters`, `onProfileDeleted`).

## [0.31.21] - 2026-03-28
- **Feature (Lehrer-Stats):** Lehrer-Sammelkarten haben jetzt HP, Beschreibungen und bis zu 3 Angriffe (sichtbar in der Detailansicht).
- **Admin Update (Sammelkarten):** Der Editor im Admin-Bereich unterstützt nun das Pflegen von HP, Beschreibungen und Angriffen pro Lehrer.
- **UI Cleanup (Spenden):** Die Spendenseite wurde bereinigt (Entfernen von "Am Max", Hinzufügen von BuyMeACoffee).
- **Hotfix (Hydration/DOM Nesting):** In [src/components/ui/context-menu.tsx](src/components/ui/context-menu.tsx) wurde `ContextMenuTrigger` um `asChild` erweitert; in [src/app/admin/page.tsx](src/app/admin/page.tsx) wird dies für Tabellenzeilen genutzt.
- **UI Fix (Admin-Rechtsklick):** Echtes Kontextmenü für Desktop-Benutzerzeilen in [src/app/admin/page.tsx](src/app/admin/page.tsx).
- **UI Fix (Empfänger-Rechtsklick):** Die Empfängerliste in [src/app/admin/send/page.tsx](src/app/admin/send/page.tsx) nutzt nun echte Zeilen für das Kontextmenü.
- **Feature (Empfänger-Kontextmenü):** Benutzerliste hat jetzt ein Kontextmenü pro Empfänger.
- **UI Update (Kommunikations-Zentrale):** Schnellvorlagen, Absender-Presets und Live-Vorschau-Verbesserungen in [src/app/admin/send/page.tsx](src/app/admin/send/page.tsx).
- **Runtime Update (Notification Routing):** Support für `Popup`, `Banner` und `Quickmessage` pro Nachricht.

## [Unreleased]

## [0.31.20] - 2026-03-27
- **Hotfix (Hydration/DOM Nesting):** In [src/components/ui/context-menu.tsx](src/components/ui/context-menu.tsx) wurde `ContextMenuTrigger` um `asChild` erweitert.
- **UX Update (Geschenk-Modal):** In [src/context/SystemMessageContext.tsx](src/context/SystemMessageContext.tsx) wird der Absender als Klarname angezeigt (statt UID), mit Fallback auf `System`.
- **UX Update (Geschenk-Popup):** In [src/context/SystemMessageContext.tsx](src/context/SystemMessageContext.tsx) zeigt das Geschenk-Modal jetzt mehr Informationen (Pack-Anzahl, Popup-Text, Absender) und mehrere Buttons (`CTA`, `Album öffnen`, `Später`).
- **UX/State Fix (Geschenk-Popup):** Geschenk-Benachrichtigungen werden beim Schließen/Aktion per `deleteDoc` aus `profiles/{uid}/unseen_gifts` entfernt, damit derselbe Dialog nicht erneut auftaucht.
- **Runtime Fix (Admin Send CORS):** In [functions/src/gifts.ts](functions/src/gifts.ts) wurden lokale Dev-Origins (`http://localhost:3000`, `http://127.0.0.1:3000`, inkl. `:3001`) für `giftBoosterPack` ergänzt. Dadurch werden Preflight-Requests aus der lokalen Next.js-Entwicklung nicht mehr durch CORS blockiert.
- **Config Fix (Firebase Hostname):** Falscher Hostname `firebaseapp.app` in [functions/src/gifts.ts](functions/src/gifts.ts) auf `firebaseapp.com` korrigiert.
- **Build Fix (Firebase Exports):** In [src/lib/firebase.ts](src/lib/firebase.ts) wurden rückwärtskompatible Named Exports (`app`, `auth`, `db`, `storage`, `functions`) wiederhergestellt, damit bestehende Imports in der App weiterhin funktionieren.
- **Build Fix (Auth Imports):** Die Komponenten [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx), [src/app/login/page.tsx](src/app/login/page.tsx) und [src/components/modals/ResetPasswordDialog.tsx](src/components/modals/ResetPasswordDialog.tsx) nutzen nun konsistent `getFirebaseAuth()`.
- **TypeScript Fix (Sammelkarten):** Unmöglicher State-Vergleich in [src/app/sammelkarten/page.tsx](src/app/sammelkarten/page.tsx) entfernt, um den Next.js-Build wieder durchlaufen zu lassen.
- **Runtime Fix (Danger Scheduler):** In [functions/src/cron.ts](functions/src/cron.ts) wurde die `executeDangerActions`-Abfrage index-unabhängig gemacht (Filter auf `executableAt` nun nach `status == pending` im Code), um `FAILED_PRECONDITION`/`internal`-Fehlerpfade zu vermeiden.
- **Functions Build Fix (Rarity Voting):** Tippfehler in [functions/src/rarity.ts](functions/src/rarity.ts) korrigiert (`awardedPack: awardPack`), sodass Functions-Deploys nicht mehr am TypeScript-Build scheitern.

## [0.31.20] - 2026-03-27
- **UI Fix (Sammelkarten):** Es wurde ein Flackern behoben, bei dem die "Keine Packs"-Anzeige kurzzeitig während der Öffnungs-Animation des letzten Boosters eingeblendet wurde. Das UI wartet nun ab, bis die Animation vollständig abgeschlossen ist, bevor der leere Zustand angezeigt wird.

## [0.31.19] - 2026-03-27
- **UI Design Fix (Sammelkarten):** Das Blitz-Icon (`Zap`) in der leeren Booster-Anzeige wurde auf `text-foreground` umgestellt und die Deckkraft leicht erhöht. Dies stellt sicher, dass das Icon auch im Light-Mode auf hellem Hintergrund gut erkennbar ist.

## [0.31.14] - 2026-03-27
- **UI Design Refinement (Sammelkarten):** Die gestrichelte Umrandung im leeren Booster-Fach wurde vollständig entfernt für einen noch minimalistischeren und saubereren Look.

## [0.31.13] - 2026-03-27
- **UI Design Fix (Sammelkarten):** Das leere Booster-Fach wurde farblich korrigiert und erscheint nun reinweiß. Der innere Schatten wurde an die Oberkante verlagert und ein störender grauer Verlauf über das gesamte Feld entfernt. Der Shop-Button wurde auf einen kontraststarken schwarzen Look umgestellt.

## [0.31.12] - 2026-03-27
- **UI Design (Sammelkarten):** Das leere Booster-Fach nutzt nun die Theme-Hintergrundfarbe (`bg-background`). Im Light-Mode wurde der äußere Rand entfernt, sodass die räumliche Tiefe ausschließlich durch den inneren Schatten definiert wird.

## [0.31.11] - 2026-03-27
- **UI Design Refinement (Sammelkarten):** Der Hintergrund des leeren Booster-Fachs wurde im Light-Mode auf Reinweiß gesetzt. Die räumliche Tiefe wird nun ausschließlich durch dunkle, nach innen gerichtete Schatten (`dark inner shadows`) erzeugt, ohne helle Akzentkanten.

## [0.31.10] - 2026-03-27
- **UI Design (Sammelkarten):** Der leere Booster-Platz wurde zu einem physischen "Fach" (`recessed slot`) weiterentwickelt. Durch den Einsatz von mehrschichtigen inneren Schatten, Lichtkanten und vertikalen Farbverläufen entsteht ein realistischer 3D-Effekt einer Aussparung.

## [0.31.09] - 2026-03-27
- **UI Fix (Sammelkarten):** Der gestrichelte Rahmen für leere Booster wurde durch dunklere Farben (`neutral-300`) und eine Hintergrund-Schattierung (`shadow-inner`) im Light-Mode sichtbar gemacht. Der Shop-Button wurde ebenfalls überarbeitet und nutzt nun dunklen Text (`neutral-900`) und einen Schatten, um auf weißem Grund deutlich erkennbar zu sein.

## [0.31.08] - 2026-03-27
- **UI Refinement (Sammelkarten):** Die gestrichelte Umrandung (`dashed border`) für den leeren Booster-Platz wurde wieder hinzugefügt, um die Form des fehlenden Packs anzudeuten. Zudem wurde die Sichtbarkeit des "Shop besuchen"-Buttons deutlich verbessert (höherer Kontrast), damit dieser auf hellem Hintergrund nicht mehr untergeht.

## [0.31.07] - 2026-03-27
- **UI Refinement (Sammelkarten):** Der obere Header-Bereich ("SAMMELKARTEN") ist nun auch im Wartezustand (`idle`) voll sichtbar und nicht mehr ausgegraut. Der leere Booster-Platz wurde minimalistischer gestaltet: Das Wort "Platzhalter" und die gestrichelte Umrandung wurden entfernt, stattdessen wird eine saubere Ansicht mit einem größeren Timer und einem deutlicheren Shop-Link präsentiert.

## [0.31.06] - 2026-03-27
- **UI Fix (Sammelkarten):** Sichtbarkeit des leeren Booster-Platzhalters im Light-Mode ("White Mode") behoben. Durch den Einsatz adaptiver Farben (`neutral-200/500`) sind Rahmen und Texte nun auch auf hellem Hintergrund lesbar.

## [0.31.05] - 2026-03-27
- **UI Refinement (Sammelkarten):** Die "Leer-Anzeige" wurde in einen physischen Platzhalter-Slot umgewandelt. Eine gestrichelte Umrandung (`dashed border`) deutet nun die Form des fehlenden Booster-Packs an, um den leeren Zustand intuitiver zu visualisieren.

## [0.31.04] - 2026-03-27
- **UI Logic Fix (Sammelkarten):** Die Booster-Grafik wird nun komplett ausgeblendet, wenn keine Packs mehr verfügbar sind. Statt einer Überlagerung des Pakets wird eine saubere, minimalistische "Leer-Anzeige" präsentiert.

## [0.31.03] - 2026-03-27
- **UI Refinement (Sammelkarten):** Die gesperrte Booster-Ansicht ("Limit erreicht") wurde auf ein minimalistischeres und ausgewogeneres Design umgestellt. Reduzierung visueller Effekte zugunsten einer klaren, ruhigeren Typografie und besseren Proportionen.

## [0.31.02] - 2026-03-27
- **UI Overhaul (Sammelkarten):** Redesign der gesperrten Booster-Ansicht ("Limit erreicht"). Die Ansicht wurde optisch aufgewertet (Premium-Look) mit verbesserten Blur-Effekten, einer atmosphärischen Timer-Darstellung und einem prominenteren Shop-CTA.

## [0.31.01] - 2026-03-27
- **UI Fix (Sammelkarten):** Kontrast der Debug-Überschriften ("Unpack Speed", "Probability") verbessert, indem die Farbe im Dark-Mode an den Body-Text angepasst wurde (`amber-500` statt `amber-200`).

## [0.31.00] - 2026-03-27
- **Unified System Message Engine:** Modularisierung und Vereinheitlichung des Benachrichtigungs- und Modalsystems.
- **Zentraler Provider:** Einführung des `SystemMessageProvider` (Context) und `useSystemMessage` Hooks als einzige Schnittstelle für alle Nachrichten (Toasts, Banner, Modals).
- **Rendering Engine:** Entwicklung des `SystemMessageHost` zur dynamischen Anzeige von Banners an der Oberseite und Modals in der Bildschirmmitte (basierend auf Radix UI Dialog).
- **Firestore-Integration:** Zentralisierung der Listeners für Systemwarnungen (`delayed_actions`), globale Popups (`settings/global`), Nutzer-Geschenke und Account-Sperren im Provider.
- **AppShell-Refactoring:** Massive Bereinigung der `AppShell.tsx` durch Entfernung von 5+ fragmentierten Banner-Systemen zugunsten der neuen Architektur.
- **Migration:** Umstellung der wichtigsten Seiten (`sammelkarten`, `admin`, `news`) auf die neue API sowie Migration des Cookie-Parodie-Banners in das neue System.

## [0.30.00] - 2026-03-27
- **Feedback Milestone Update:** Diese Version bündelt kritische Korrekturen und Funktionserweiterungen basierend auf Nutzerfeedback (März 2026).
- **Security & Visibility (Feedback):**
    - Feature: **Erweiterte Feedback-Einsicht**. Die Rollen 'Planner' und 'Viewer' können nun alle Feedback-Meldungen einsehen (vorher nur Admins).
    - Security: **Firestore-Regeln gehärtet**. Zugriffsberechtigungen für Feedback-Dokumente wurden für diese Rollen explizit freigeschaltet.
- **Sammelkarten & Lehrer-Voting:**
    - Feature: **Sicheres Lehrer-Rating**. Das Bewertungssystem für Lehrer wurde auf serverseitige Cloud Functions (`voteForTeacher`) umgestellt, um Manipulationen der Seltenheits-Berechnungen und Booster-Belohnungen zu verhindern.
    - Feature: **Lehrer-Beschreibungen**. Lehrer können nun zusätzliche Hintergrundinformationen besitzen, die direkt in der Abstimmungs-Zentrale angezeigt werden.
- **Kalender & Events:**
    - Performance & Guest Access: **Denormalisierung von Event-Erstellern**. Der Name des Erstellers wird nun direkt am Event gespeichert. Dadurch sehen nun auch Gäste (ohne Profil-Zugriff), wer einen Termin eingetragen hat.
    - Script: **Backfill-Prozess**. Alle bestehenden Termine wurden automatisch mit den Namen der Ersteller ergänzt.
    - Fix: **Apple Calendar (ICS) Optimierung**. Der Export von Kalenderdateien wurde für die Kompatibilität mit iOS/Safari-Geräten verbessert.
- **Finanzen & Transparenz:**
    - Feature: **Spendenseite & Abikasse**. Einführung einer neuen Informationsseite (`/finanzen/spenden`), die detailliert aufschlüsselt, wie die Einnahmen der App zur Finanzierung des Abiballs und des Infrastruktur-Unterhalts verwendet werden.
    - UI: **Ranking-Integration**. Direkte Verlinkung von der Finanzübersicht zur neuen Spendenseite für maximale finanzielle Transparenz.
- **Stabilität:**
    - Referrals: **Erweitertes Logging** für das Empfehlungssystem zur schnelleren Diagnose von Fehlern bei der Punktevergabe.
    - Cleanup: Optimierung des automatischen Bereinigungssystems ("Super Danger").
    - **Root-Flow:** `dashboard.` und `app.`-Hosts überspringen die Erstbesucher-Umleitung zur Startseite.
    - **Setup-Hinweis:** Das Subdomain-Routing ist dokumentiert; DNS und Custom Domain müssen zusätzlich beim Hosting-Anbieter eingerichtet werden.
- Fix: **Z-Index Problem behoben**. Der sticky Header im Shop überdeckt nun nicht mehr das globale Navigationsmenü auf Mobilgeräten.

    - **Root-Flow:** Die Startseite prüft beim ersten anonymen Besuch ein lokales Flag und leitet dann auf [src/app/zugang/page.tsx](src/app/zugang/page.tsx) um.
    - **Landing-Erlebnis:** Die Promo-Seite ist jetzt eine echte Startseite mit Hero, Feature-Überblick und klaren Einstiegspunkten.
    - **Navigation:** Login- und Registrieren-Seiten führen jetzt zurück zur Startseite statt direkt ins Dashboard.
## [0.26.62] - 2026-03-27
- UI: **Rabatt-Badge neu platziert**. Die Prozent-Ersparnis wurde vom Kauf-Button entfernt und stattdessen als pulsierendes Badge in der oberen linken Ecke der Booster-Pakete platziert, um sie prominenter hervorzuheben.
    - **Persistenz:** Angepinnte Eintraege bleiben in der gespeicherten Reihenfolge erhalten; entfernte Eintraege werden nicht direkt wieder in die Liste gezogen.
    - **UI:** Die Schnellzugriffe haben eine farbigere Darstellung und zeigen den Pin-Status direkt an.
- UI: **Rabatt-Eckbanner optimiert**. Die Sichtbarkeit und Positionierung des diagonalen Prozent-Banners auf dem Kauf-Button wurde verbessert und mit einem Backdrop-Blur versehen.

    - **Verwendung:** Dashboard, Finanzseite und Funding-Widget nutzen die Brandfarbe jetzt fuer Hervorhebungen, Karten und Statusanzeige.
- UI: **Eck-Banner für Rabatte**. Die Prozent-Ersparnis wird nun als diagonales Banner in der oberen rechten Ecke des Kauf-Buttons angezeigt.

    - **UI-Schutz:** Das Eingabefeld wird nur noch fuer Rollen mit Schreibrechten angezeigt; ansonsten erscheint ein Read-only-Wert.
    - **Logik:** Das Update-Handling bleibt auf berechtigte Rollen begrenzt, damit kein schreibender Fallback mehr greift.

## [0.26.58] - 2026-03-27
    - **Datenabfragen:** Firestore-Listener und Countdown-Logik wurden nach [src/app/sammelkarten/_modules/hooks/useSammelkartenConfig.ts](src/app/sammelkarten/_modules/hooks/useSammelkartenConfig.ts) verschoben.
    - **State-Management:** Pack-Flow, Tastatursteuerung und Reveal-State liegen jetzt in [src/app/sammelkarten/_modules/hooks/useSammelkartenGame.ts](src/app/sammelkarten/_modules/hooks/useSammelkartenGame.ts).
    - **Berechnungen/Utils:** Wahrscheinlichkeiten, Card-Mapping und Ergebnisaufbereitung wurden in dedizierte Utility-Dateien ausgelagert.
    - **UI-Bausteine:** Header, Pack-Stage und Reveal-Bereiche wurden in fokussierte Komponenten extrahiert, ohne Verhaltensaenderung.

## [0.26.56] - 2026-03-27
    - **Fix:** Tab-Buttons erlauben mobil Zeilenumbruch statt gequetschter Einzeilen-Texte, dadurch ueberlagern sich Labels nicht mehr.

## [0.26.55] - 2026-03-27
    - **Nachladung:** Bereits gespeicherte Quick-Actions werden beim Laden aufgeloest, damit alte UID-Eintraege automatisch ersetzt werden.

## [0.26.54] - 2026-03-27
    - **Root Cause:** Die bisherige Carryover-Logik addierte bei `openBooster` zusaetzliche Tagespacks und erlaubte dadurch >2 kostenlose Packs pro Tag.
    - **Konsistenz:** Frontend-Anzeige und Backend-Validierung verwenden jetzt dieselbe strikte Berechnung (Tageskontingent + explizite `extra_available`-Packs).

## [0.26.53] - 2026-03-27

- UI: **Booster Shop UI optimiert**. Der Preis der Booster-Packs wird nun direkt auf dem Kauf-Button angezeigt anstatt in einem separaten Info-Feld, um die Benutzeroberfläche übersichtlicher und moderner zu gestalten.

    - **Client-Sicherheit:** Der fruehere Firestore-Fallback im Browser wurde entfernt, damit der Trade-Start nicht mehr an gesperrten Direktwrites auf `card_trades` und `notifications` scheitert.
    - **Root Cause:** Die serverseitige Validierung bleibt erhalten, waehrend der Client keinen ungeschuetzten Schreibpfad mehr nutzt.
- Fix: **Kritischer Firebase-Fehler im Booster Shop behoben**. Ein `internal`-Error beim Kauf von Boostern wurde durch Korrektur des Datenbank-Zugriffs in den Cloud Functions (`getFirestore` statt fehlerhaftem `admin.firestore`) behoben.
- Fix: **Fehlende Seltenheits-Synchronisierung korrigiert**. Die automatische Seltenheitsberechnung (`calculateTeacherRarity`) wurde ebenfalls auf den korrekten Datenbank-Zugriff umgestellt, um Dateninkonsistenzen zu vermeiden.

- Robustheit: **Zusätzliche Validierung im Backend**. Der Kauf-Prozess prüft nun explizit auf gültige `amount`-Werte und schützt vor `NaN`-Fehlern in der Datenbank.
    - **Hierarchische Gruppen:** `scripts/migrate_to_hierarchical_groups.ts` schreibt und liest nicht mehr gegen die Default-Datenbank.
    - **Card Settings:** `scripts/migrate_card_settings.ts` wurde auf dieselbe Datenbank-Instanz ausgerichtet, damit Admin-Migrationen konsistent laufen.
    - **Projektkontext:** Beide Skripte setzen jetzt auch die Firebase-Projekt-ID explizit, damit `ts-node` nicht an fehlenden lokalen ADC-Metadaten scheitert.

## [0.26.50] - 2026-03-27
- Hotfix: **Endgültige Behebung des mapToCardData ReferenceErrors**. Durch Umstellung auf Funktionsdeklarationen (Hoisting) und Eindeutige Funktionsnamen (`mapTeacherToCardData`) wurde ein Problem in Next.js/Turbopack-Chunks behoben, bei dem die Hilfsfunktion sporadisch nicht im Scope gefunden wurde.

## [0.26.49] - 2026-03-27
- Hotfix: **Fehlende Sammelkarten-Konstanten wiederhergestellt**. Ein `ReferenceError: mapToCardData is not defined` sowie fehlende `DEFAULT`-Konstanten in der Sammelkarten-Logik wurden behoben.

## [0.26.48] - 2026-03-27
- Feature: **Booster Shop & Wirtschaftssystem**. Einführung eines (vorerst simulierten) Shops zum Erwerb zusätzlicher Booster-Packs.
    - **Drei Pakete**: Starter Pack (1), Booster Bundle (5) und Elite Box (12) mit ansprechenden 3D-Visualisierungen.
    - **Monatliche Limits**: Zur Wahrung des Spielgleichgewichts und zum Jugendschutz wurden Limits eingeführt (10/5/2 Käufe pro Monat).
    - **Sichere Transaktionen**: Der Kaufprozess wurde vollständig in eine Cloud Function ausgelagert, um Manipulationen zu verhindern.
- Feature: **Transparenz-Zentrale für Wahrscheinlichkeiten**. Neue Info-Seite (`/sammelkarten/info`) mit exakten Drop-Rates für alle Seltenheiten und Varianten.
- Hotfix: **Fehlendes Icon-Import korrigiert**. Ein `ReferenceError` wurde behoben, der durch einen versehentlich entfernten Import von `MoreVertical` in der Admin-Zentrale verursacht wurde.
- Security: **Firestore-Härtung**. Das Feld `booster_stats` wurde in den Sicherheitsregeln gegen direkte Client-Schreibzugriffe gesperrt.
- UI: **Veredeltes Shop-Design**. Hochwertige CSS-basierte Visualisierungen für Booster-Packs und Kartenstapel sowie ein neues Erfolgs-Overlay nach dem Kauf.
- Fix: **Cloud Function Datenbank-Routing**. Fehler behoben, bei dem Funktionen fälschlicherweise auf die Default-Datenbank statt auf `abi-data` zugreifen wollten.

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
- Feature: **Admin-Logs System**. Einführung eines detaillierten Logging-Systems für administrative Aktionen (Rollenänderungen, Löschungen, Timeouts).
- Feature: **Öffentlicher Bug-Tracker**. Nutzer können nun Feedback und Fehlerberichte einreichen, die für Admins zentral verwaltet werden.
- UI: **Responsive Admin-Zentrale**. Überarbeitung der Admin-Oberfläche für bessere Nutzbarkeit auf mobilen Endgeräten.
