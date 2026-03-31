# Changelog

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
- **Neu (Kreativ-Labor):** Einführung eines Formulars für eigene Kartenvorschläge in der Umfragen-Sektion.
    - **Mitgestaltung:** Nutzer können nun für jeden Lehrer Vorschläge für Lebenspunkte (HP), Beschreibungen und bis zu 3 Angriffe (Name, Schaden, Effekt) einreichen.
    - **Belohnungssystem:** Einreichungen, die vom Admin für das offizielle Album übernommen werden, werden mit **2 Booster-Packs** pro Karte belohnt.
    - **Strukturierte Erfassung:** Vorschläge werden in einer neuen Datenbank-Collection (`card_proposals`) gespeichert und dem Admin zur Inspiration vorgelegt.
    - **UI-Update:** Die Umfragen-Seite wurde auf ein Tab-Layout umgestellt, um zwischen regulären Abstimmungen und dem Kreativ-Labor wechseln zu können.

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
    - **Konvertierung:** Ein neuer Link "Warum ein Konto?" wurde direkt unter den Login-Buttons in der Sidebar (Navbar) und der Sammelkarten-Promo auf dem Dashboard platziert. Er führt zur Info-Seite `/promo`.

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
