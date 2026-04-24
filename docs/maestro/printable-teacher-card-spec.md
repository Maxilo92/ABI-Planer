# Handoff Report: PrintableTeacherCard Specification

## 1. Übersicht
Die `PrintableTeacherCard` ist eine spezialisierte Version der `TeacherCard`, die für den Druck im Standard-TCG-Format (63mm x 88mm) optimiert ist und zusätzliche biografische Daten des Lehrers anzeigt. Sie verfügt über einen interaktiven 3D-Flip-Effekt für die Web-Galerie.

## 2. Layout-Spezifikation

### 2.1 Vorderseite (Front)
Die Vorderseite fokussiert sich auf das visuelle Branding des Lehrers mit einem modernen, "cleanen" Look.

*   **Hintergrund:** Ein subtiler linearer Farbverlauf (`bg-gradient-to-br`), der die Farbe der Seltenheit (Rarity) aufgreift (z.B. Slate für Common, Amber für Legendary), aber mit geringer Opazität (10-20%), um das Hauptbild nicht zu überlagern.
*   **Hauptbild:** Vollbild-PNG des Lehrers (`object-cover`). Das Bild sollte den gesamten Kartenbereich ausfüllen.
*   **Top-Left Info Block:**
    *   **Sammelnummer:** Text (z.B. "001"), um 90 Grad gegen den Uhrzeigersinn gedreht (`-rotate-90`). Schriftart: Monospace oder Bold Sans, Farbe: Weiß mit schwarzem Outline/Drop-Shadow.
    *   **Name:** "Herr/Frau [Nachname]" in einer markanten Serif- oder Sans-Serif-Schrift (z.B. `font-black`, `text-2xl`).
    *   **Fächer:** Kleinerer Text direkt unter dem Namen, kommagetrennt (z.B. "Mathe, Physik").
*   **Bottom Quote Block:**
    *   **Effekt:** Ein Gradient-Overlay am unteren Rand (`bg-gradient-to-t from-black/80 via-black/40 to-transparent`) kombiniert mit `backdrop-blur-md`.
    *   **Inhalt:** Ein prägnantes Zitat des Lehrers in Kursivschrift (`italic`), zentriert ausgerichtet.
    *   **Padding:** Ausreichend Abstand zum Rand (`p-4`).

### 2.2 Rückseite (Back)
Die Rückseite dient als "Datenblatt" im klassischen Sammelkarten-Stil.

*   **Hintergrund:** Reinweiß (`bg-white`).
*   **Header:**
    *   **Oben Links:** Voller Name (Vorname + Nachname) in Schwarz, fett.
    *   **Oben Rechts:** Schullogo (`CardMockUp/school_logo/logo-beispiel.svg`), skaliert auf ca. 15-20% der Kartenbreite.
*   **Daten-Liste (Stats):**
    *   Vertikale Liste mit Icons (Lucide-React) oder Labels.
    *   **Pünktlichkeit:** Textuelle Beschreibung oder Prozentwert.
    *   **Schwierigkeit der Arbeiten:** Visuelle Skala 1-10 (z.B. 10 kleine Quadrate/Sterne, wobei X gefüllt sind).
    *   **Fun Fact:** Mehrzeiliger Textblock.
    *   **Unbeliebtestes Fach:** Text.
    *   **Freizeit:** Text.
*   **Typografie:** Klare, serifenlose Schrift (z.B. Inter/Geist), Farbe: Dunkelgrau bis Schwarz (`text-neutral-900`).

## 3. Technische Spezifikation (Props)

Die Komponente sollte folgende Datenstruktur erwarten:

```typescript
interface PrintableTeacherCardProps {
  data: CardData; // Bestehende Struktur (Name, Rarity, CardNumber, ImageUrl)
  details: {
    firstName: string;
    lastName: string;
    subjects: string[];
    quote: string;
    stats: {
      punctuality: string;
      difficulty: number; // 1-10
      funFact: string;
      unpopularSubject: string;
      leisure: string;
    };
  };
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
}
```

## 4. Interaktion & Animation

*   **3D-Flip:** Implementierung mittels `framer-motion`. Bei Klick auf die Karte soll eine `rotateY: 180` Animation ausgelöst werden.
*   **Perspective:** Der Container benötigt `perspective: 1000px`.
*   **Hover-Effekt:** Ein leichter Tilt-Effekt (Neigung) in Richtung des Mauszeigers erhöht die Wertigkeit in der digitalen Galerie.
*   **Print-Optimierung:** Die Komponente sollte CSS-Klassen für `@media print` enthalten, um sicherzustellen, dass Hintergründe und Bilder korrekt gedruckt werden (`print-color-adjust: exact`).

## 5. Design-Tokens (Tailwind)

*   **Blur:** `backdrop-blur-md` (12px)
*   **Gradients:** 
    *   Front Bottom: `bg-gradient-to-t from-black/90 via-black/50 to-transparent`
    *   Front Rarity: `bg-opacity-10`
*   **Shadows:** `shadow-xl` für die digitale Ansicht, kein Schatten für den Druck.
*   **Border:** Subtiler grauer Rand (`border-neutral-200`) auf der Rückseite, um die Kartenkante beim Schneiden zu markieren.

## 6. Assets
*   **Lehrer-Bilder:** `CardMockUp/teacher_pictures/[filename].webp`
*   **Schullogo:** `CardMockUp/school_logo/logo-beispiel.svg`
