# Testing Checklist – ABI Planer v1.0.0

Konkrete Test-Cases für systematisches Testen aller Features.

**Benutzer-Rolle für Tests:** Admin (für Vollzugriff)  
**Test-Browser:** Chrome, Firefox, Safari (mind. 2)  
**Datum:** ___________  
**Tester:** ___________

---

## 🔐 AUTHENTIFIZIERUNG & ZUGANG

### Registrierung
- [ ] **Test 1.1:** Mit gültiger @hgr-web.lernsax.de E-Mail registrieren → Konto erstellt
- [ ] **Test 1.2:** Mit ungültiger E-Mail registrieren (z.B. @gmail.com) → Fehler-Meldung
- [ ] **Test 1.3:** Mit zu kurzem Passwort (< 6 Zeichen) → Validierungs-Fehler
- [ ] **Test 1.4:** Passwort-Bestätigung falsch → Fehler
- [ ] **Test 1.5:** Mit bereits existier E-Mail registrieren → "Konto bereits vorhanden"

### Login & Logout
- [ ] **Test 2.1:** Mit richtigen Credentials anmelden → Dashboard wird angezeigt
- [ ] **Test 2.2:** Mit falscher E-Mail anmelden → Fehler "Konto nicht gefunden"
- [ ] **Test 2.3:** Mit falschen Passwort anmelden → Fehler "Passwort falsch"
- [ ] **Test 2.4:** Logout klicken → Zur Login-Page redirect
- [ ] **Test 2.5:** Nach Logout: Direkt /dashboard aufrufen → Wird zu /login redirect

### Passwort-Reset
- [ ] **Test 3.1:** "Passwort vergessen" klicken → E-Mail wird gesendet (Check Spam!)
- [ ] **Test 3.2:** Link aus E-Mail folgen → Reset-Page wird geladen
- [ ] **Test 3.3:** Neues Passwort setzen → Mit neuem Passwort anmelden funktioniert

### Session-Management
- [ ] **Test 4.1:** Nach 30 Min Inaktivität → Logout (wenn Session aktiviert)
- [ ] **Test 4.2:** Doppel-Anmeldung in 2 Browsern → Beide Session sind aktiv
- [ ] **Test 4.3:** Browser-Tab schließen → Nicht automatisch abmelden
- [ ] **Test 4.4:** Systemzeit ändern während angemeldet → Keine unerwarteten Logouts

---

## 📊 DASHBOARD

### Layout & Komponenten
- [ ] **Test 5.1:** Countdown wird angezeigt (richtige Tage bis zum Datum)
- [ ] **Test 5.2:** Finanzstatus-Widget zeigt Balken (0%-100%)
- [ ] **Test 5.3:** Aufgaben-Übersicht (nur deine Aufgaben)
- [ ] **Test 5.4:** News-Karten mit Bildern laden
- [ ] **Test 5.5:** Umfragen-Widget zeigt aktive Umfragen
- [ ] **Test 5.6:** Scoring/Leaderboard ist sortiert

### Interaktionen
- [ ] **Test 6.1:** Auf News-Karte klicken → Detail-Page wird geladen
- [ ] **Test 6.2:** Auf "Alle Aufgaben" klicken → Zur Aufgaben-Page
- [ ] **Test 6.3:** Auf "Kalender" klicken → Zur Kalender-Page
- [ ] **Test 6.4:** Dark Mode Toggle klicken → Theme wechselt (und persistiert)

---

## 📅 KALENDER & EVENTS

### Events Ansehen
- [ ] **Test 7.1:** Kalender-Page laden → Alle Events werden angezeigt
- [ ] **Test 7.2:** Auf ein Event klicken → Detail-Dialog öffnet
- [ ] **Test 7.3:** Event-Details zeigen: Datum, Zeit, Ort, Beschreibung
- [ ] **Test 7.4:** Nach links/rechts wischen (Mobile) → Monat ändert sich

### Event Erstellen (Admin/Planner)
- [ ] **Test 8.1:** "Neuer Event" Button klicken → Add-Dialog öffnet
- [ ] **Test 8.2:** Alle Felder ausfüllen (Titel, Zeit, Ort, Beschreibung) → Speichern
- [ ] **Test 8.3:** Neuer Event erscheint sofort im Kalender
- [ ] **Test 8.4:** Mit leeren Titel speichern → Validierungs-Fehler
- [ ] **Test 8.5:** Mit ungültiger Zeit (z.B. 25:00) → Fehler

### Event Bearbeiten
- [ ] **Test 9.1:** Auf Edit-Button klicken → Edit-Dialog öffnet
- [ ] **Test 9.2:** Etwas ändern (z.B. Uhrzeit) → Speichern
- [ ] **Test 9.3:** Änderung ist sofort sichtbar
- [ ] **Test 9.4:** Andere User sehen die Änderung live

### Event Löschen
- [ ] **Test 10.1:** Auf Delete-Button klicken → Warning-Dialog
- [ ] **Test 10.2:** "OK" im Dialog → Event ist weg
- [ ] **Test 10.3:** "Abbrechen" → Event bleibt

---

## ✅ AUFGABEN (TODO-LIST)

### Aufgaben Ansehen
- [ ] **Test 11.1:** Aufgaben-Page laden → Alle offenen/in-progress Aufgaben
- [ ] **Test 11.2:** Filter nach Status (Offen, In Bearbeitung, Erledigt)
- [ ] **Test 11.3:** Suchleiste funktioniert (nach Titel suchen)
- [ ] **Test 11.4:** Auf Aufgabe klicken → Detail-Dialog

### Aufgabe Erstellen
- [ ] **Test 12.1:** "Neue Aufgabe" klicken → Add-Dialog
- [ ] **Test 12.2:** Titel + Beschreibung + Status → Speichern
- [ ] **Test 12.3:** Neue Aufgabe ist sofort sichtbar
- [ ] **Test 12.4:** Zuständigkeit zuweisen → Andere User sehen sie auch
- [ ] **Test 12.5:** Mit leeren Titel → Validierungs-Fehler

### Aufgabe Updaten
- [ ] **Test 13.1:** Status von "Offen" zu "In Bearbeitung" ändern
- [ ] **Test 13.2:** Status zu "Erledigt" → Haken-Icon
- [ ] **Test 13.3:** Priority ändern → Sorting passt sich an
- [ ] **Test 13.4:** Zuständignkeit ändern → Personen-Icon updated

### Aufgabe Löschen
- [ ] **Test 14.1:** Delete-Button klicken → Warning
- [ ] **Test 14.2:** OK → Aufgabe gelöscht
- [ ] **Test 14.3:** Andere User können gelöschte Aufgabe nicht mehr sehen

---

## 💰 FINANZEN

### Finanzen Übersicht
- [ ] **Test 15.1:** Finanzen-Page laden → Einnahmen, Ausgaben, Kontostand sichtbar
- [ ] **Test 15.2:** Finanzierungsziel wird visualisiert (z.B. 5000€ / 10000€)
- [ ] **Test 15.3:** Transaktions-Liste zeigt alle Einträge chronologisch
- [ ] **Test 15.4:** Kontostand berechnet sich richtig (Einnahmen - Ausgaben)

### Transaktion Hinzufügen
- [ ] **Test 16.1:** "Neue Transaktion" klicken → Dialog
- [ ] **Test 16.2:** Einnahme eintragen (z.B. +500€ Cake Sale) → Speichern
- [ ] **Test 16.3:** Ausgabe eintragen (z.B. -200€ DJ) → Speichern
- [ ] **Test 16.4:** Kontostand updated sofort
- [ ] **Test 16.5:** Mit 0€ oder negativem Wert → Validierungs-Fehler
- [ ] **Test 16.6:** Mit Text statt Zahl → Validierungs-Fehler

### Transaktion Bearbeiten & Löschen
- [ ] **Test 17.1:** Edit-Button → Wert ändern → Speichern
- [ ] **Test 17.2:** Kontostand updated nach Edit
- [ ] **Test 17.3:** Delete-Button → Warning → OK → Weg
- [ ] **Test 17.4:** Kontostand passt sich nach Löschung an

---

## 📰 NEWS

### News Lesen
- [ ] **Test 18.1:** News-Page laden → Alle News chronologisch (neueste oben)
- [ ] **Test 18.2:** News mit Bild laden → Bild wird angezeigt
- [ ] **Test 18.3:** News mit Links klicken → Link öffnet in neuem Tab
- [ ] **Test 18.4:** Auf News klicken → Detail-Page

### News Erstellen (Admin/Planner)
- [ ] **Test 19.1:** "Neue News" Button → Add-Dialog
- [ ] **Test 19.2:** Titel + Text eingeben → Speichern
- [ ] **Test 19.3:** Mit Bild hochladen → Bild wird angezeigt
- [ ] **Test 19.4:** Mit Link einfügen → Link funktioniert
- [ ] **Test 19.5:** Mit leeren Titel → Validierungs-Fehler
- [ ] **Test 19.6:** Neue News ist sofort sichtbar

### News Bearbeiten & Löschen
- [ ] **Test 20.1:** Edit-Button → Text ändern → Speichern
- [ ] **Test 20.2:** Bild austauschen → Neues Bild wird angezeigt
- [ ] **Test 20.3:** Delete-Button → Warning → OK → Weg

---

## 🗳️ UMFRAGEN (ABSTIMMUNGEN)

### Umfragen Ansehen
- [ ] **Test 21.1:** Abstimmungen-Page laden → Aktive Umfragen
- [ ] **Test 21.2:** Auf Umfrage klicken → Detail mit allen Optionen
- [ ] **Test 21.3:** Ergebnisse werden live aktualisiert (wenn andere abstimmen)

### Abstimmen
- [ ] **Test 22.1:** Eine Option wählen → Button wird aktiv
- [ ] **Test 22.2:** "Abstimmen" Button klicken → Abstimmung wird eingereicht
- [ ] **Test 22.3:** Eigene Abstimmung sichtbar (z.B. Häkchen bei deiner Option)
- [ ] **Test 22.4:** Abstimmung nochmal ändern → Neue Wahl wird registriert

### Umfrage Erstellen (Admin/Planner)
- [ ] **Test 23.1:** "Neue Umfrage" → Dialog mit Frage + min. 2 Optionen
- [ ] **Test 23.2:** Alle Felder ausfüllen → Speichern
- [ ] **Test 23.3:** Neue Umfrage ist für andere Nutzer sichtbar
- [ ] **Test 23.4:** Mit nur 1 Option → Validierungs-Fehler
- [ ] **Test 23.5:** Mit leerer Frage → Validierungs-Fehler

### Umfrage Abschließen (Admin)
- [ ] **Test 24.1:** "Umfrage abschließen" Button → Weitere Abstimmungen blockiert
- [ ] **Test 24.2:** Ergebnisse sind final

---

## 👥 GRUPPEN

### Gruppen Ansehen
- [ ] **Test 25.1:** Gruppen-Page laden → Alle Gruppen mit Kartendesign
- [ ] **Test 25.2:** Auf Gruppe klicken → Mitglieder werden angezeigt
- [ ] **Test 25.3:** Gruppenwand mit Posts/Nachrichten sehen
- [ ] **Test 25.4:** Aufgaben pro Gruppe filtern

---

## ⚙️ EINSTELLUNGEN

### Theme & Anzeigeoptionen
- [ ] **Test 26.1:** Dark Mode Toggle → Theme ändert sich
- [ ] **Test 26.2:** Theme persistiert (nach Refresh noch dunkel)
- [ ] **Test 26.3:** Auf Mobile: Hamburger-Menü funktioniert

### Kurse & Gruppen (Admin)
- [ ] **Test 27.1:** Kurs hinzufügen → Neue Reihe
- [ ] **Test 27.2:** Kurs bearbeiten → Name ändert sich
- [ ] **Test 27.3:** Kurs löschen → Weg
- [ ] **Test 27.4:** Planungs-Gruppe hinzufügen → Neue Gruppe
- [ ] **Test 27.5:** Leiter zuweisen → Dropdown funktioniert

---

## 🔐 BERECHTIGUNGEN & ROLLEN

### Viewer (Standard)
- [ ] **Test 28.1:** Kann alle Daten sehen (readonly)
- [ ] **Test 28.2:** Kann NICHT erstellen/editieren
- [ ] **Test 28.3:** Kann abstimmen
- [ ] **Test 28.4:** Kann Feedback geben

### Planner
- [ ] **Test 29.1:** Kann Events erstellen
- [ ] **Test 29.2:** Kann Aufgaben erstellen
- [ ] **Test 29.3:** Kann News scheiben
- [ ] **Test 29.4:** Kann NICHT Nutzer verwalten

### Admin
- [ ] **Test 30.1:** Admin Dashboard accessible (/admin)
- [ ] **Test 30.2:** Kann Rollen anderer User ändern
- [ ] **Test 30.3:** Kann Nutzer löschen
- [ ] **Test 30.4:** Kann globale Einstellungen ändern
- [ ] **Test 30.5:** Kann Feedback ansehen
- [ ] **Test 30.6:** Kann Logs sehen

---

## 📱 RESPONSIVE DESIGN & MOBILE

### Mobile View (Smartphone / 375px Breite)
- [ ] **Test 31.1:** Alle Text lesbar ohne Zoom
- [ ] **Test 31.2:** Buttons sind groß genug (min. 44px)
- [ ] **Test 31.3:** Kein horizontales Scrolling nötig
- [ ] **Test 31.4:** Sidebar responsive (Hamburger-Menü)
- [ ] **Test 31.5:** Inputs funktionieren mit Keyboard

### Tablet View (768px Breite)
- [ ] **Test 32.1:** Layout optimiert für Tablet-Breite
- [ ] **Test 32.2:** Keine Double-Content

### Desktop
- [ ] **Test 33.1:** Sidebar permanent sichtbar
- [ ] **Test 33.2:** Alle Inhalte sinnvoll angeordnet

---

## ⚡ PERFORMANCE

### Ladezeiten
- [ ] **Test 34.1:** Dashboard lädt in < 2 Sekunden
- [ ] **Test 34.2:** Seite wechsel < 1 Sekunde
- [ ] **Test 34.3:** Bilder laden schnell
- [ ] **Test 34.4:** Kein Flickering oder Layout-Shift

### Netzwerk (DevTools → Network Throttle)
- [ ] **Test 35.1:** 4G Langsam → App noch brauchbar
- [ ] **Test 35.2:** Offline → Aussagekräftige Fehlermeldung (nicht Crash)
- [ ] **Test 35.3:** Wieder Online → Auto-Reconnect

---

## 🐛 FEHLERBEHANDLUNG

### Validierung
- [ ] **Test 36.1:** Leere erforderliche Felder → Fehler
- [ ] **Test 36.2:** Ungültige E-Mail Format → Fehler
- [ ] **Test 36.3:** Passwort < 6 Zeichen → Fehler
- [ ] **Test 36.4:** Negative Zahlen bei Geld → Fehler
- [ ] **Test 36.5:** Sehr lange Texte (> 5000 Zeichen) → Warnung oder Limit

### Server-Fehler
- [ ] **Test 37.1:** Bei Server-Fehler → "Etwas ist schief gelaufen" Meldung
- [ ] **Test 37.2:** Retry-Button funktioniert
- [ ] **Test 37.3:** Keine 500er Fehler in Console

### Netzwerk-Fehler
- [ ] **Test 38.1:** Wenn Netzwerk weg → Offline-Banner
- [ ] **Test 38.2:** Wenn Netzwerk zurück → Auto-Sync
- [ ] **Test 38.3:** Keine Datenverlust bei Disconnect

---

## 🎨 UI/UX & DESIGN

### Visuelles Design
- [ ] **Test 39.1:** Farbschema ist konsistent
- [ ] **Test 39.2:** Icons sind erkennbar und aussagekräftig
- [ ] **Test 39.3:** Schriftgrößen sind lesbar (min. 14px)
- [ ] **Test 39.4:** Spacing ist konsistent (keine Gaps)

### Benutzerfreundlichkeit
- [ ] **Test 40.1:** Nutzungsfluss ist intuitiv
- [ ] **Test 40.2:** Labels auf Buttons sind klar (z.B. "Speichern", nicht "OK")
- [ ] **Test 40.3:** Error-Messages sind hilfreich (nicht kryptisch)
- [ ] **Test 40.4:** Success-Messages bestätigen Aktionen

### Accessibility
- [ ] **Test 41.1:** Tab-Navigation funktioniert (Keyboard-only)
- [ ] **Test 41.2:** Kontrast ist ausreichend (Text vs. Background)
- [ ] **Test 41.3:** Keine flackernden Elemente
- [ ] **Test 41.4:** Bilder haben alt-Text (für Screen Reader)

---

## 📊 FINAL CHECKLIST

### Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (optional)

### Devices
- [ ] Desktop (1920x1080)
- [ ] Tablet (iPad, 768x1024)
- [ ] Mobile (iPhone/Android, 375x667)

### Zeichen
- [ ] German Umlaute (ä, ö, ü, ß) korrekt
- [ ] Emoji in Comments funktionieren

### Browser-Features
- [ ] LocalStorage (Settings speichern)
- [ ] Worker/ServiceWorker (falls genutzt)
- [ ] WebP Images (oder Fallback)

---

## 🏆 TEST-SUMMARY

**Insgesamt Tests:** 41  
**Bestanden:** ____  
**Fehlgeschlagen:** ____  
**Kritische Bugs:** ____  
**Normale Bugs:** ____  
**Minor Issues:** ____  

### Urteil
- [ ] **Release ready (Go!)** — Alle kritischen Tests bestanden
- [ ] **Mit kleinen Fixes OK** — Nur Minor Issues
- [ ] **Verzögerung nötig** — Normale/Kritische Bugs müssen gefixt werden

---

**Danke für dein gründliches Testing! 🙏**
