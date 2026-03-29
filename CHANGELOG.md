# Changelog

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
- **Promo Page Update:** Die `/promo` Seite wurde aktualisiert, um die aktuellen Berechtigungsunterschiede zwischen Gästen und registrierten Nutzern korrekt widerzuspiegeln. Sie dient nun als zentraler Info-Hub für die Vorteile eines Lernsax-Accounts.

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

## [0.26.64] - 2026-03-27
- Fix: **Z-Index Problem behoben**. Der sticky Header im Shop überdeckt nun nicht mehr das globale Navigationsmenü auf Mobilgeräten.

## [0.26.63] - 2026-03-27
- UI: **Layout-Korrekturen im Shop**. Die Booster-Bilder haben nun mehr Abstand zu den oberen Badges und sind besser zentriert. Die Animation des Rabatt-Badges wurde entfernt.

## [0.26.62] - 2026-03-27
- UI: **Rabatt-Badge neu platziert**. Die Prozent-Ersparnis wurde vom Kauf-Button entfernt und stattdessen als pulsierendes Badge in der oberen linken Ecke der Booster-Pakete platziert, um sie prominenter hervorzuheben.

## [0.26.61] - 2026-03-27
- UI: **Rabatt-Eckbanner optimiert**. Die Sichtbarkeit und Positionierung des diagonalen Prozent-Banners auf dem Kauf-Button wurde verbessert und mit einem Backdrop-Blur versehen.

## [0.26.60] - 2026-03-27
- UI: **Eck-Banner für Rabatte**. Die Prozent-Ersparnis wird nun als diagonales Banner in der oberen rechten Ecke des Kauf-Buttons angezeigt.

## [0.26.59] - 2026-03-27
- UI: **Kauf-Button Design verfeinert**. Der Streichpreis steht nun als schlichter Text links vom Hauptpreis, während die Prozent-Ersparnis in einem kleinen Label rechts hervorgehoben wird.

## [0.26.58] - 2026-03-27
- Fix: **Kauf-Button Layout korrigiert**. Die Rabatt-Informationen wurden nebeneinander statt übereinander platziert, um Clipping-Fehler zu vermeiden und die Lesbarkeit zu verbessern.

## [0.26.57] - 2026-03-27
- UI: **Streichpreise & Prozent-Badges**. Der Kauf-Button zeigt nun bei Bundles den durchgestrichenen Originalpreis sowie die prozentuale Ersparnis an, um den Mehrwert der Pakete besser zu verdeutlichen.

## [0.26.56] - 2026-03-27
- UI: **Rabatt-Anzeige für Bundles**. Im Shop wird nun explizit angezeigt, wie viel man bei den größeren Booster-Bundles im Vergleich zum Einzelpreis (0,99 €) spart.

## [0.26.55] - 2026-03-27
- Marketing: **Abikasse-Unterstützung hervorgehoben**. Im Shop wird nun prominent beworben, dass 90% der Einnahmen direkt an die jeweilige Abikasse der Stufe fließen, um den Abiball zu finanzieren. Die restlichen 10% dienen dem App-Unterhalt.

## [0.26.54] - 2026-03-27
- UI: **Demo-Kauf-Modal implementiert**. Beim Klick auf ein Booster-Paket öffnet sich nun ein Bestätigungs-Modal, das den Demo-Charakter der Transaktion verdeutlicht.
- UI: **Kauf-Button vereinfacht**. Das Kreditkarten-Icon wurde aus dem Kauf-Button entfernt, um ein minimalistischeres Design zu erzielen.

## [0.26.53] - 2026-03-27
- UI: **Booster Shop UI optimiert**. Der Preis der Booster-Packs wird nun direkt auf dem Kauf-Button angezeigt anstatt in einem separaten Info-Feld, um die Benutzeroberfläche übersichtlicher und moderner zu gestalten.

## [0.26.52] - 2026-03-27
- Fix: **Kritischer Firebase-Fehler im Booster Shop behoben**. Ein `internal`-Error beim Kauf von Boostern wurde durch Korrektur des Datenbank-Zugriffs in den Cloud Functions (`getFirestore` statt fehlerhaftem `admin.firestore`) behoben.
- Fix: **Fehlende Seltenheits-Synchronisierung korrigiert**. Die automatische Seltenheitsberechnung (`calculateTeacherRarity`) wurde ebenfalls auf den korrekten Datenbank-Zugriff umgestellt, um Dateninkonsistenzen zu vermeiden.
- Robustheit: **Zusätzliche Validierung im Backend**. Der Kauf-Prozess prüft nun explizit auf gültige `amount`-Werte und schützt vor `NaN`-Fehlern in der Datenbank.

## [0.26.51] - 2026-03-27
- Fix: **Build-Fehler im Booster Shop behoben**. Die Eigenschaft `shop_stats` wurde zum `Profile`-Interface hinzugefügt, um einen TypeScript-Fehler beim Build-Vorgang zu korrigieren.

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
