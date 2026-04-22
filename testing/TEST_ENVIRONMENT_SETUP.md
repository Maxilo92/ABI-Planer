# Test Environment Setup

 **WICHTIG:** Die App läuft bereits **live** auf [https://abi-planer-27.de](https://abi-planer-27.de)!

Du kannst direkt dort testen. Diese Anleitung ist für lokales Development/Testing.

---

##  Quick Start für Tester

### Option A: Direkt auf der Live-URL testen (EMPFOHLEN)
1. Gehe zu [https://abi-planer-27.de](https://abi-planer-27.de)
2. Registriere dich mit deiner @hgr-web.lernsax.de Adresse
3. Fertig! → Folge [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

### Option B: Lokal entwickeln und testen

**Voraussetzungen:**
- [ ] Node.js 22 installiert (check: `node -v`)
- [ ] Git installiert (check: `git -v`)
- [ ] Firebase Konfiguration (vom Admin)

---
<!-- AGENT_NAV_METADATA -->
<!-- path: testing/TEST_ENVIRONMENT_SETUP.md -->
<!-- role: secondary -->
<!-- read_mode: read-on-demand -->
<!-- token_hint: summary-first -->
<!-- default_action: read sections that match current task -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->


## 1. Repository klonen (für lokales Entwickeln)

**Nur nötig wenn du lokal entwickeln willst. Zum Testen nutze [https://abi-planer-27.de](https://abi-planer-27.de).**

```bash
# Via HTTPS (laenger, aber kein SSH-Setup noetig)
git clone https://github.com/YOUR-ORG/abi-planer.git
cd abi-planer

# Oder via SSH (schneller, wenn SSH-Keys gesetzt sind)
git clone git@github.com:YOUR-ORG/abi-planer.git
cd abi-planer
```

---

## 2. Dependencies installieren

```bash
npm install
```

Dauert ~1-2 Minuten. Sollte mit `added XXX packages` enden ohne Fehler.

---

## 3. Umgebungsvariablen konfigurieren

```bash
# Falls vorhanden, kannst du ein Template kopieren
cp testing/.env.local.example .env.local

# Öffne .env.local in deinem Editor
code .env.local  # oder `vim .env.local`
```

**Admin wird dir Firebase-Keys bereitstellen.** Ersetze die Platzhalter:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...      # von Admin
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...         # von Admin
...
```

Die kanonische Liste und Sicherheitsregeln fuer Variablen stehen in `../docs/.env-reference.md`.

---

## 4. Test starten

### Option A: Development Server (für lokal Testen)
```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

Server läuft bis du `Ctrl+C` drückst.

### Option B: Production Build (fuer reales Testen)
```bash
npm run check      # Alle Checks (regressions + tsc + build)
npm run build      # Production Build
npm run start      # Startet Server (Port 3000)
```

---

## 5. Registrieren zum Testen

1. Gehe zu [http://localhost:3000](http://localhost:3000)
2. Klick **"Registrieren"**
3. Nutze deine **@hgr-web.lernsax.de Adresse** (oder Test-Email von Admin)
4. Setze ein Passwort
5. Fertig! Du wirst zum Dashboard weitergeleitet

---

##  Beim Testen

### Browser Development Tools öffnen
```
Mac: Cmd + Option + J
Windows: F12
```

**Im Console Tab:** Wenn es rote Fehler gibt → Screenshot und ins Feedback!

### Feature Testen
1. Folge [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
2. Probiere jedes Feature aus
3. Wenn was nicht funktioniert → [TESTING_GUIDE.md](./TESTING_GUIDE.md) für Bug-Report

### Performance Testen
```
DevTools > Network Tab → Throttle auf "Slow 4G"
Dann: Seiten laden und auf Ladezeiten achten
```

---

## Haeufige Befehle beim Entwickeln

```bash
# Code-Qualität prüfen
npm run lint

# Kritische Features testen
npm run test:regressions

# Alles zusammen (Lint + Test + Build)
npm run check

# Production Build erstellen
npm run build

# Server stoppen
Ctrl + C

# Neue Dependencies hinzufügen
npm install PACKAGE-NAME

# Dependencies aktualisieren
npm update
```

---

##  Troubleshooting

### `npm install` schlägt fehl
**Problem:** Permission Error oder Netzwerk aus  
**Lösung:**
```bash
# Cache leeren
npm cache clean --force
# Erneut versuchen
npm install
```

### `npm run dev` startet nicht
**Problem:** Port 3000 ist belegt  
**Lösung:**
```bash
# Auf anderen Port starten
npm run dev -- -p 3001
```

### `.env.local` nicht erkannt
**Problem:** Build funktioniert lokal aber nicht  
**Lösung:**
```bash
# Datei existiere und hat richtige Keys? Check:
cat .env.local

# Server neu starten:
# 1. Ctrl+C
# 2. npm run dev
```

### Firebase Connection Error
**Problem:** "Cannot connect to Firestore"  
**Lösung:**
1. Überprüfe `.env.local` — Keys korrekt?
2. Überprüfe Firestore in Firebase Console — Datenbank vorhanden?
3. Netzwerk OK? (z.B. nicht hinter Corporate Proxy)
4. Frag Admin um Hilfe

### Alte Abhängigkeiten im Cache
**Problem:** Feature funktioniert lokal nicht aber ist im Code  
**Lösung:**
```bash
# Kill node_modules (️ Warnung: dauert!)
rm -rf node_modules package-lock.json
npm install

# Server neu starten
npm run dev
```

---

##  Test-Metriken während Sessions

Öffne DevTools (`F12`) → **Performance Tab** zur Analyse:

```
Metrics zu tracken:
- First Contentful Paint (FCP): < 1.5s → gut
- Largest Contentful Paint (LCP): < 2.5s → gut
- Cumulative Layout Shift (CLS): < 0.1 → gut
```

---

##  Logs & Debugging

### Browser Console (wichtig!)
```
DevTools → Console Tab

Schau nach Warnungen (gelb) und Errors (rot)
Copy-Paste ins Feedback wenn > 5 Fehler
```

### Network Requests (optional)
```
DevTools → Network Tab

Schau nach Failed Requests (rot)
Wenn was 404 ist → Screenshot machen
```

### Datenbank Prüfen
```
Firebase Console → Firestore
Schau nach:
- Sind neue Docs entstanden beim Testen?
- Sind Daten korrekt gespeichert?
```

---

##  Nach dem Testen

### Feedback geben
1. Öffne **Feedback** im Menü (oder gib in App)
2. Schreib was funktioniert hat / nicht funktioniert
3. Screenshots/Links zum Problem
4. Sende!

## Weiterfuehrende Doku
- `../DEPLOYMENT.md`
- `../docs/CI-CD.md`
- `../docs/TROUBLESHOOTING.md`

### Test-Report ausfüllen
Der Admin teilt euch einen kurzen Fragebogen:
- Wie viele Bugs gefunden?
- Bedien-freundlichkeit?
- Performance OK?
- Würdest du die App nutzen?

---

##  Was am wichtigsten ist

1. **Authentifizierung:** Registrierung & Login müssen funktionieren
2. **Dashboard:** Muss laden ohne Fehler
3. **Daten-Persistenz:** Wenn ich etwas erstelle, bleibt es?
4. **Fehler-Meldungen:** Sind klar und hilfreich?
5. **Mobile:** Funktioniert auf dem Smartphone?

---

##  Wenn alles funktioniert

1. Teste mit dem Fragebogen alle Kriterien
2. Gib Feedback (über die App oder Email)
3. **Fertig!** Diese Runde Testing ist done

Next Schritte vorbereitet Admin.

---

**Happy Testing! **

Wenn Fragen: Frag einen Admin oder schreib Feedback in der App (direkt vom Menü).

Danke, dass du ABI Planer testest! 
