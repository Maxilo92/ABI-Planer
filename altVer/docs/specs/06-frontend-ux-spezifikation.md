# Abi-Planer Frontend UX-Spezifikation

## 1. Design-Philosophie
Die Benutzeroberfläche von Abi-Planer folgt dem Prinzip der **funktionalen Klarheit**. Da das System von Schülern zur Organisation kritischer Ressourcen (Finanzen, Termine) genutzt wird, steht die Informationsdichte und Bedienbarkeit vor dekorativen Elementen.

### Kernprinzipien
- **Mobile First**: Alle Funktionen müssen auf dem Smartphone vollumfänglich bedienbar sein.
- **Kontext-Bewusstsein**: Der Nutzer muss jederzeit wissen, in welcher Schule und welchem Jahrgang er sich befindet.
- **Transparenz**: Status-Änderungen (Read-Only, Tier-Limits) werden proaktiv und unmissverständlich kommuniziert.

---

## 2. Responsive Layout-Regeln

### 2.1 Breakpoints
| Viewport | Range | Navigation Pattern | Layout-Verhalten |
|----------|-------|--------------------|------------------|
| **Mobile** | < 768px | Bottom Navigation Bar | Single Column, Full-width Modals |
| **Tablet** | 768px - 1024px | Collapsible Sidebar | 2-Column Grids, Drawer-Overlays |
| **Desktop** | > 1024px | Permanent Sidebar | Multi-Column, Dashboard-Widgets |

### 2.2 Mobile-Spezifische UX
- **Bottom Nav**: Schneller Zugriff auf die Kernmodule (Finanzen, Kalender, Todos).
- **Action Button (FAB)**: Ein zentraler "+" Button für kontextsensitive Aktionen (neue Ausgabe, neuer Termin).
- **Listen-Optimierung**: Swipe-Gesten für Statusänderungen (z.B. Todo erledigt).

### 2.3 Desktop-Spezifische UX
- **Sidebar**: Enthält Navigation, Jahrgangs-Switcher und User-Profil.
- **Keyboard Shortcuts**: `CMD+K` für globale Suche/Navigation, `N` für neue Einträge.
- **Drag & Drop**: In der Todo-Board-Ansicht und für Datei-Uploads.

---

## 3. Kontext-Management & Switching

### 3.1 Hierarchie-Visualisierung
Die Navigation folgt der Struktur: `Subdomain (Schule) > Jahrgang > Modul`.
- **Breadcrumbs**: Werden auf Desktop/Tablet permanent unter dem Header angezeigt.
- **Header-Titel**: Zeigt primär den Namen des aktiven Jahrgangs (z.B. "Abi 2026").

### 3.2 Jahrgangs-Switcher
Ein zentrales UI-Element (meist oben in der Sidebar oder im Header), das den Wechsel zwischen Jahrgängen ermöglicht.
- **Visualisierung**: Dropdown mit Status-Indikatoren (Aktiv, Archiviert, Read-Only).
- **UX-Flow**: Beim Wechsel wird der gesamte App-State (Zustand der Module) auf den neuen Jahrgang synchronisiert.

### 3.3 Multi-School Support
Da Schulen über Subdomains getrennt sind (`hgr.abi-planer.io`), erfolgt der Wechsel zwischen Schulen primär über die URL.
- **Dashboard-Zentrale**: Auf der Hauptdomain (`www.abi-planer.io`) sieht ein eingeloggter User eine Liste aller Schulen, bei denen er Mitglied ist, mit direkten Links zu den Subdomains.

---

## 4. Tier-Gating & Pro-Features

### 4.1 Visual Gating Patterns
Features, die im aktuellen Tier (Free) nicht enthalten sind, werden nicht versteckt, sondern als "verfügbar durch Upgrade" markiert.
- **Locked State**: Icons/Menüpunkte erhalten ein dezentes Schloss-Symbol.
- **Feature-Preview**: Beim Klick auf ein Pro-Modul (z.B. Kalender) erscheint ein "Empty State" mit einer kurzen Erklärung des Nutzens und einem "Upgrade auf Pro" Button.
- **In-App Upsells**: Dezente Banner in der Sidebar, wenn Limits (z.B. Jahrgangs-Anzahl) fast erreicht sind.

### 4.2 Stripe Checkout UX
- **Seamless Transition**: Der Upgrade-Button führt direkt zum Stripe Customer Portal oder einem Stripe Checkout.
- **Success State**: Nach erfolgreicher Zahlung erfolgt ein automatischer Redirect zurück zur App mit einer "Willkommen bei Pro" Konfetti-Animation und sofortiger Freischaltung der Module.

---

## 5. Lifecycle & Read-Only UX (Phase 7)

### 5.1 Der "Retention Banner"
Sobald ein Jahrgang in Phase 7 (Read-Only) eintritt, wird ein permanenter, nicht schließbarer Banner am oberen Bildschirmrand angezeigt.
- **Farbe**: Warn-Gelb oder Neutral-Grau.
- **Inhalt**: "Dieser Jahrgang ist im Read-Only Modus. Datenlöschung erfolgt am [Datum]."
- **Aktion**: Link zu den Export-Funktionen.

### 5.2 UI-Restriktionen
Im Read-Only Modus werden alle schreibenden UI-Elemente global deaktiviert:
- **Buttons**: "Hinzufügen", "Speichern", "Löschen" werden ausgeblendet oder disabled.
- **Inputs**: Formularfelder werden auf `readOnly` gesetzt.
- **Feedback**: Tooltips erklären beim Hovern über deaktivierte Elemente: "In diesem Status können keine Änderungen vorgenommen werden."

---

## 6. Rollenbasierte UI-Sichtbarkeit
Das UI passt sich dynamisch an die Rolle des angemeldeten Nutzers an.

### 6.1 School Admin (Lehrer)
- **Billing-Dashboard**: Voller Zugriff auf Stripe-Einstellungen und Rechnungen.
- **Schul-Einstellungen**: Verwaltung der Subdomain und globalen Schul-Metadaten.
- **Jahrgangs-Erstellung**: Button zum Anlegen neuer Kohorten.

### 6.2 Year Group Admin (Schüler)
- **Mitglieder-Verwaltung**: Einladen neuer Nutzer, Zuweisen von Rollen (Planer, Viewer).
- **Jahrgangs-Einstellungen**: Konfiguration von Modulen und Abschlussdaten.
- **Planungs-Zugriff**: Voller Schreibzugriff auf alle aktivierten Module.

### 6.3 Planer
- **Modul-Interaktion**: Kann neue Einträge (Finanzen, Termine, Todos) erstellen, bearbeiten und löschen.
- **Eingeschränkte Sicht**: Sieht keine Jahrgangs- oder Schul-Einstellungen.

### 6.4 Viewer
- **Read-Only Zugriff**: Sieht alle Planungsdaten, aber alle Interaktions-Elemente (Buttons, Inputs) sind deaktiviert oder ausgeblendet (analog zum Read-Only Status in Phase 7).

---

## 7. Feedback & System-Status
- **Optimistic UI**: Änderungen (z.B. Todo abhaken) werden sofort im UI reflektiert, während der Sync im Hintergrund läuft.
- **Loading Skeletons**: Anstelle von Spinnern werden Skeleton-Screens verwendet, um die wahrgenommene Ladezeit zu reduzieren.
- **Toasts**: Kurze Bestätigungen für erfolgreiche Aktionen (unten rechts auf Desktop, oben auf Mobile).


