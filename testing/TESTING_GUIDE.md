<!-- AGENT_NAV_METADATA -->
<!-- path: testing/TESTING_GUIDE.md -->
<!-- role: secondary -->
<!-- read_mode: read-on-demand -->
<!-- token_hint: summary-first -->
<!-- default_action: read sections that match current task -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# Testing Guide – ABI Planer v1.0.0

**Willkommen zur Test-Phase!** Dieses Guide hilft dir, alle Features gründlich zu testen.

---

## 🎯 Überblick

**Ziel:** Sicherstellen, dass alle Features funktionieren und benutzerfreundlich sind.

**Test-Dauer:** ~2-3 Stunden pro Person  
**Test-Umgebung:** [Link wird von Admin bereitgestellt]  
**Browser:** Chrome, Firefox, Safari (mind. 2 testen)

---

## 📋 Test-Setup

### 1. **Dein Test-Konto erstellen**
- Gehe auf die **Startseite**
- Klick **"Registrieren"**
- Nutze dein **@hgr-web.lernsax.de Konto** (Admin stellt Test-Adressen bereit)
- Wähle ein Passwort und registriere dich

### 2. **Browser-Konsole öffnen** (für Bug-Reports)
```
Mac: Cmd + Option + J
Windows: F12 → Console Tab
```

→ Wenn du Fehler siehst (rot), schreib diese ins Feedback!

### 3. **Screenshots/Videos** (Optional aber hilfreich)
- Nutze Screesnshot-Tool bei Problemen
- Bei kritischen Bugs: kurzes Video machen

---

## ✅ Test-Szenarien

Folge die **TESTING_CHECKLIST.md** für konkrete Test-Cases.

---

## 🛑 Severity Triage & Release Decision (Mobile Release Gate)

Um eine hohe Qualität auf mobilen Geräten zu gewährleisten, nutzen wir folgendes Modell für die Bewertung von Fehlern. **Jeder Test-Befund muss einer dieser Kategorien zugeordnet werden.**

### 1. CRITICAL (Blocker / NO-GO)
- **Definition:** Applikations-Crash, Datenverlust oder Kern-Funktionen sind vollständig blockiert.
- **Beispiele:** Login schlägt auf Mobile fehl, Finanz-Transaktionen können nicht gespeichert werden, Admin-Dashboard lädt nicht.
- **Folge:** Release wird sofort gestoppt.

### 2. HIGH (Blocker / NO-GO)
- **Definition:** Massive Layout-Fehler oder Bedienungs-Einschränkungen.
- **Beispiele:** Horizontaler Scroll auf Hauptseiten (Overflow), Primäre Buttons sind nicht tippbar (Target < 44px), Modals lassen sich auf kleinen Screens (iPhone SE) nicht schließen.
- **Folge:** Release wird gestoppt, bis der Fix verifiziert ist.

### 3. MEDIUM (Kein Blocker)
- **Definition:** Kleinere UI-Glitches oder Inkonsistenzen, die die Nutzung nicht verhindern.
- **Beispiele:** Text leicht verschoben, Icons nicht perfekt zentriert, falscher Farbton in einem Untermenü.
- **Folge:** Fehler wird dokumentiert und im nächsten regulären Update gefixt.

### 4. LOW (Kein Blocker)
- **Definition:** Kosmetische Details oder Typos.
- **Beispiele:** Rechtschreibfehler in einer Beschreibung, minimaler Padding-Fehler in einer Fußzeile.
- **Folge:** Wird gesammelt und bei Gelegenheit korrigiert.

**Wichtig:** Ein Release erfolgt nur, wenn **keine** offenen "CRITICAL" oder "HIGH" Befunde vorliegen.
