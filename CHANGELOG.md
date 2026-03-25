# Changelog

## [0.26.23] - 2026-03-25
- UI: **Expliziter "Pack öffnen"-Button**. Für eine klarere Nutzerführung gibt es nun einen eigenen Button zum Öffnen einzelner Packs, der immer sichtbar ist, solange Booster verfügbar sind. Der Button zum Öffnen von 10 Packs erscheint bei Bedarf zusätzlich.

## [0.26.22] - 2026-03-25
- Fix: **Build-Fehler behoben**. Ein doppelter schließender Tag (`/>`) in der `sammelkarten`-Seite, der zu einem Parsing-Fehler im Build-Prozess führte, wurde entfernt.

## [0.26.23] - 2026-03-25
- Fix: **Stabiles Karten-Reveal beim Booster-Opening**. Ein Fehler wurde behoben, durch den aufgedeckte Karten in der Booster-Ansicht wieder verdeckt werden konnten, was das Erscheinen der Navigations-Buttons verhinderte. Karten bleiben nun nach dem ersten Klick permanent aufgedeckt, was für einen zuverlässigen und klaren Ablauf sorgt.

## [0.26.22] - 2026-03-25
- Fix: **Dauerhaftes Karten-Reveal beim Booster-Opening**. Einmal aufgedeckte Karten in der Booster-Ansicht können nicht mehr versehentlich wieder verdeckt werden. Dies verhindert Verwirrung beim schnellen Durchklicken der Belohnungen. In der Detailansicht bleibt die Möglichkeit zum Umdrehen weiterhin bestehen.
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
