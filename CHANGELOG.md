# Changelog

## [0.21.25] - 2026-03-22
- Fix: **Anzeige der Lehrer-Sammlung auf Profilen korrigiert**. Ein Filterfehler verhinderte, dass Karten in der Profil-Vorschau angezeigt wurden. Der Standard-Filter wurde für Profile auf "Nur Entdeckte" angepasst, um die eigene Sammlung korrekt darzustellen.

## [0.21.24] - 2026-03-22
- UI: **Design der Karten-Rückseiten verbessert**. Die Rückseiten der Lehrer-Sammelkarten haben nun deutlich mehr Kontrast, einen subtilen Leuchteffekt im Zentrum und eine besser lesbare Beschriftung, um die Benutzerfreundlichkeit auf mobilen Geräten zu erhöhen.

## [0.21.23] - 2026-03-22
- Feature: **Lehrer-Album Vorschau-Modus**. Auf Profilseiten wird nun standardmäßig nur eine Vorschau der 5 besten Karten (nach Level/Seltenheit) angezeigt. Ein "Mehr anzeigen"-Button ermöglicht das vollständige Ausklappen der Sammlung, um die Übersichtlichkeit der Profilseiten zu verbessern.

## [0.21.22] - 2026-03-22
- Fix: **Layout der Profilseiten optimiert**. Das Lehrer-Album wird auf Profilseiten nun nicht mehr horizontal gequetscht, sondern nutzt die volle verfügbare Breite (max-w-6xl), während die Profil-Informationen weiterhin kompakt (max-w-2xl) dargestellt werden.

## [0.21.21] - 2026-03-22
- Fix: **TypeScript Build-Fehler behoben**. Fehlender Import des `Profile`-Typs in `TeacherAlbum.tsx` hinzugefügt, der den Produktions-Build verhinderte.

## [0.21.20] - 2026-03-22
- Fix: **Versionsanzeige synchronisiert**. Die Version in der Fußzeile (Footer) liest nun direkt aus der `VERSION`-Datei. Zudem wurden alle Vorkommen in `package.json` und der Hilfe-Seite auf den neuesten Stand (v0.21.20) gebracht.

## [0.21.19] - 2026-03-22
- UI: **Hilfe-Seite Updates**. Manuelle Aktualisierungen an den FAQ-Kategorien und Vorbereitung für die neue App-Version.

## [0.21.18] - 2026-03-22
- UI: **Album auf Profilseite integriert**. Das Lehrer-Album ist nun sowohl auf der eigenen Profilseite als auch auf den öffentlichen Profilen anderer Nutzer einsehbar.
- Refactor: `useUserTeachers` Hook und `TeacherAlbum` Komponente unterstützen nun die Anzeige von Sammlungen anderer Nutzer.
- Feature: **Lehrer-Lootpool Vereinheitlichung**. Das Teacher-Rarity-Voting nutzt nun direkt den Lehrer-Pool aus den globalen Einstellungen als Datenbasis.
- Admin: **Sofortiges Voting**. Neu hinzugefügte Lehrer in den globalen Einstellungen werden nun automatisch im Voting-Pool initialisiert und sind sofort für Abstimmungen verfügbar.
- UI: **Hilfe-Seite aktualisiert**. Neue Kategorie "Sammelkarten & Lehrer" im FAQ-Bereich hinzugefügt.
- Logic: **Admin-Initialisierung**. Beim Hinzufügen oder Importieren von Lehrern im Admin-Bereich wird nun direkt ein korrespondierender Eintrag in der Voting-Datenbank (`teachers` Collection) erstellt.

## [0.21.17] - 2026-03-22
- UI: **Album-Statistiken hinzugefügt**. Das Lehrer-Album zeigt nun oben Statistiken über die Anzahl der entdeckten Lehrer, die insgesamt geöffneten Packs und die Gesamtzahl der gesammelten Karten an.
- Logic: **Tracker für geöffnete Packs**. Ein neuer `total_opened` Counter wurde in die `booster_stats` integriert, um die Langzeit-Statistik zu ermöglichen.
- Fix: **Build-Fehler behoben (Typen)**. Ein technischer Fehler in der `src/types/database.ts` wurde behoben, durch den die `total_opened` Eigenschaft in den `booster_stats` fehlte.

## [0.21.16] - 2026-03-22
- UI: **Verbleibende Booster-Anzeige verbessert**. Der Button "Noch einmal versuchen" zeigt nun die Anzahl der verbleibenden Packs in Klammern an. Zusätzlich wird der Status-Badge nun auch nach dem Öffnen eines Packs eingeblendet und die Darstellung von mehr als 2 verfügbaren Boostern (Bonus-Packs) wurde korrigiert.

## [0.21.15] - 2026-03-22
- Fix: **Wahrscheinlichkeiten für Mythische Karten korrigiert**. Ein Fehler in der Ziehungs-Logik wurde behoben, durch den mythische Karten eine Wahrscheinlichkeit von 0% hatten. Sie können nun wieder korrekt aus Boostern gezogen werden.
- UI: **Standard-Lehrer-Pool erweitert**. Die `DEFAULT_TEACHERS` enthalten nun auch ein Beispiel für die Seltenheit "Mythisch".

## [0.21.14] - 2026-03-22
- UI: **Intelligente Umfragen-Sortierung**. Unbeantwortete Umfragen werden nun automatisch am Anfang der Liste angezeigt.
- UI: **Dynamische Lehrer-Umfrage**. Wenn alle Lehrer bewertet wurden, rückt die Seltenheits-Umfrage ans Ende der Seite. Im Landscape-Modus entspricht sie nun exakt der Breite der Standard-Umfragen.
