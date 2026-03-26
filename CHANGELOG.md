# Changelog

## [0.26.28] - 2026-03-26
- Fix: **Booster-Öffnungen werden nicht mehr geloggt**. Die Events für Einzel- und 10er-Pack-Opening wurden aus dem Aktivitäts-Log entfernt, damit die Logs nicht mit hochfrequenten Loot-Einträgen überflutet werden.
- Fix: **Kartenöffnung auf Mobile/iPad responsiv stabilisiert**. Das Reveal-Layout nutzt jetzt ein klares Grid: auf kleinen Geräten beginnen die Karten in einer zweiten Reihe statt sich zu stark zu verkleinern, und auf iPad wurde der Abstand/Max-Width so angepasst, dass Karten sich nicht mehr berühren.
- Fix: **Sammelkarten-Manager auf Mobile besser nutzbar**. Die großen Tabs/Toggles wurden auf feste Trigger-Größen gebracht, horizontal scrollbar gemacht und das Layout so angepasst, dass keine überdimensionierten Leerräume mehr entstehen.
- Fix: **Tabs im Sammelkarten-Manager korrekt über dem Inhalt positioniert**. Das Tabs-Layout wurde auf eine eindeutige vertikale Anordnung gesetzt, sodass die Toggle-Leiste direkt über den Kacheln liegt und links kein unnötiger Leerraum mehr entsteht.
- Fix: **Mobile Kartenöffnung gegen Mini- und Flip-Ausfall gehärtet**. Reveal-Karten erhalten auf kleinen Viewports eine feste Mindestbreite, damit verdeckte Karten nicht zu klein rendern. Zusätzlich wurden WebKit-kompatible 3D-/Backface-Regeln ergänzt, damit aufgedeckte Karten auf iOS/Safari beim Flip nicht verschwinden.

## [0.26.27] - 2026-03-25
- Fix: **Korrekte Varianten-Wahrscheinlichkeit im Debug-Modus**. Ein Logikfehler in der Berechnung der Wahrscheinlichkeiten für Karten-Varianten (Holo, Shiny etc.) wurde behoben. Der Debug-Modus zeigt nun die exakte, korrekte Drop-Chance für die gezogene Seltenheit *und* Variante an.

## [0.26.26] - 2026-03-25
- Fix: **Genaue Wahrscheinlichkeiten im Debug-Modus**. Die Wahrscheinlichkeitsberechnung für gezogene Karten wurde korrigiert und berücksichtigt nun auch die Chance für die jeweilige Variante (Normal, Holo, Shiny etc.), was zu einer präzisen Anzeige der tatsächlichen Drop-Chance führt.
- Fix: **Zuverlässiges Aufdecken der Karten**. Ein Bug wurde behoben, bei dem das Umdrehen einer Karte nicht korrekt an die Seite gemeldet wurde. Die Klick-Logik wurde zentralisiert, sodass das Aufdecken nun zuverlässig den Gesamtfortschritt aktualisiert und die Navigations-Buttons korrekt erscheinen.
- Fix: **Build-Fehler behoben**. Ein doppelter schließender Tag (`/>`) in der `sammelkarten`-Seite, der zu einem Parsing-Fehler im Build-Prozess führte, wurde entfernt.
- Fix: **Stabiles Karten-Reveal beim Booster-Opening**. Ein Fehler wurde behoben, durch den aufgedeckte Karten in der Booster-Ansicht wieder verdeckt werden konnten, was das Erscheinen der Navigations-Buttons verhinderte. Karten bleiben nun nach dem ersten Klick permanent aufgedeckt, was für einen zuverlässigen und klaren Ablauf sorgt.
- Fix: **Überlappende Sammelkarten auf dem iPad behoben**.
    - Stacking-Context optimiert: Booster-Pack `zIndex` erhöht, um Überlappungen während der Ripping-Animation zu vermeiden.
    - Layout-Anpassung: Kartenbreite auf Tablets (`sm:w-52`) reduziert, um unerwünschte Zeilenumbrüche im Hochformat zu verhindern.
    - Grid-Fix: `hover:z-10` und `active:z-10` im Album hinzugefügt, damit vergrößerte Karten bei Touch-Bedienung nicht hinter Nachbarn verschwinden.

## [0.26.21] - 2026-03-25
- Feature: **Debug-Modus für Kartenziehungen**.
    - Ein neuer Debug-Toggle (Stern-Icon) wurde hinzugefügt, um exakte Wahrscheinlichkeiten anzuzeigen.
    - Anzeige der individuellen Ziehungs-Chance für jede enthüllte Karte basierend auf den Slot-Gewichtungen.
    - Berechnung und Anzeige der Gesamt-Wahrscheinlichkeit des gesamten Packs (unter Berücksichtigung des Godpack-Faktors).

## [0.26.20] - 2026-03-25
- Fix: ** Upgrade-Animation gebändigt**. Ein Fehler in der Animations-Steuerung wurde behoben, durch den Karten bei einem Level-Up unkontrolliert mehrfach rotierten. Die Drehung wird nun präzise einmalig pro Upgrade ausgelöst und die Zustände für das Level-Badge stabiler synchronisiert.
- Fix: **Album-Interaktion veredelt**. Karten in der Album-Übersicht drehen sich beim Anklicken nicht mehr um. Ein Klick öffnet nun direkt die Detailansicht, was für eine flüssigere Nutzerführung sorgt. In der Detailansicht und beim Öffnen von Boostern bleiben die Karten wie gewohnt interaktiv drehbar.

## [0.26.19] - 2026-03-25
- Feature: **10er Pack-Opening für "Suchtis"**.
    - Nutzer mit mindestens 10 Boostern im Inventar können diese nun gleichzeitig mit einem Klick öffnen.
    - Neue Ergebnis-Ansicht: Eine scrollbare Liste zeigt alle 10 Packs untereinander (3 Karten + Pack-Visual pro Zeile).
    - Individuelle Godpack-Highlights innerhalb der Massen-Öffnung.
    - Atomare Transaktion im Backend: Das Budget für alle 10 Packs wird in einem einzigen Vorgang geprüft und abgezogen.

## [0.26.18] - 2026-03-25
- Fix: **Synchronisierte Karten-Drehung im Album**. Ein Fehler wurde behoben, durch den Karten im Album unerwünscht rotierten, wenn die Detailansicht geöffnet oder dort eine Karte umgedreht wurde. Die Animations-Logik wurde auf ein deklaratives Modell umgestellt, das stabiler gegenüber Parent-Re-renders ist und den manuellen Flip-Status besser beibehält.

## [0.26.17] - 2026-03-25
- Performance: **Optimierung der Upgrade-Animationen**.
    - Die Partikel-Effekte beim Level-Up wurden grundlegend optimiert: Statt komplexer SVGs werden nun einfache, Hardware-beschleunigte CSS-Shapes verwendet.
    - Die Anzahl der Partikel wurde halbiert (von 24 auf 12) und die Berechnungen stabilisiert (Memoization), um Ruckeln beim Öffnen mehrerer Packs zu verhindern.

## [0.26.16] - 2026-03-25
- UI: **Platzsparende Filter-Grids**. Die Filter für Seltenheit und Karten-Varianten im Album wurden in kompakte, quadratische Grids umgewandelt. Dies verhindert unerwünschtes Scaling bei unterschiedlichen Textlängen und macht das Menü deutlich übersichtlicher.

## [0.26.15] - 2026-03-25
- UI: **Veredelte Upgrade-Animationen & Responsive Fixes**.
    - Die Level-Up Animation wurde auf eine volle 360°-Horizontal-Rotation umgestellt.
    - Das schwebende Badge zeigt nun den präzisen Level-Übergang (z.B. "LVL 3 → 4") an.
    - **Responsive Layout**: Booster-Cards brechen auf kleinen Bildschirmen nun in zwei Zeilen um.
    - **Bugfix**: Die Karten-Drehung in der Detailansicht und im Album funktioniert wieder einwandfrei durch Konsolidierung der Animations-Logik.

## [0.26.15] - 2026-03-25
- UI: **Großes Shiny-Effekt Overhaul**.
    - Der Shiny-Effekt wurde komplett neu entworfen, um harte Kanten in den Reflektionen vollständig zu eliminieren.
    - Verwendung eines breiten Bell-Curve-Verlaufs für extrem weiche Übergänge.
    - Die Animationsgeschwindigkeit wurde weiter auf 12s verlangsamt für einen natürlicheren, metallischen Schimmer.
    - Zusätzliche subtile Licht-Layer für mehr Tiefe.

## [0.26.14] - 2026-03-25
- UI: **Karten-ID auf gesperrten Karten**. Auch gesperrte Lehrer-Karten zeigen nun ihre Sammlungs-Nummer (unten links) an, um die Orientierung im Album zu erleichtern.

## [0.26.13] - 2026-03-25
- UI: **Refined Shiny Effekt**. Weichere Gradienten und langsamere Animationen für einen hochwertigeren Look.

## [0.26.12] - 2026-03-25
- UI: **Komprimiertes Filter-Menü & Toggle-Sortierung**.
    - Das Filter-Menü im Album wurde komplett überarbeitet und für mehr Übersichtlichkeit komprimiert.
    - **Toggle-Sortierung**: Ein erneuter Klick auf den aktiven Sortier-Modus kehrt nun die Sortierreihenfolge um (Aufsteigend/Absteigend), visualisiert durch neue Icons.
    - Seltenheits- und Varianten-Filter wurden platzsparend als Button-Grids gruppiert.
    - Der Besitz-Status wird nun über einen kompakten Segmented-Control gesteuert.
