# Testing Guide Index

**Status:** Aktiv gepflegt
**Datum:** 22. April 2026
**Version:** 1.30.1.03

---

## Zweck
Dieses Dokument ist der Einstiegspunkt fuer Tests und QA-Ablauf.
Die konkreten Checklisten und Prozesse sind in den verlinkten Dokumenten.

---
<!-- AGENT_NAV_METADATA -->
<!-- path: testing/README_TESTING_PHASE.md -->
<!-- role: secondary -->
<!-- read_mode: read-on-demand -->
<!-- token_hint: summary-first -->
<!-- default_action: read sections that match current task -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->


## Dokumentation

### **Für Tester & User:**
- **[USER_GUIDE.md](./USER_GUIDE.md)** — Wie man die App benutzt (Feature-Übersicht)
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** — Wie man gründlich testet
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** — Konkrete Test-Cases (41 Tests)
- **[TEST_ENVIRONMENT_SETUP.md](./TEST_ENVIRONMENT_SETUP.md)** — Lokal starten zum Testen

### **Für Admin & Developer:**
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** — Production Deployment auf Firebase App Hosting
- **[INSTALL.md](../INSTALL.md)** — Setup fuer Management/Admin
- **[PROJECT_KNOWLEDGE.md](../docs/PROJECT_KNOWLEDGE.md)** — Technische Architektur
- **[SECURITY_GUIDE.md](../docs/SECURITY_GUIDE.md)** — Sicherheits- und Rollenmodell
- **[LEGAL_COMPLIANCE.md](../docs/LEGAL_COMPLIANCE.md)** — DSGVO/AGB/Datenschutz-Checkliste
- **[CI-CD.md](../docs/CI-CD.md)** — Qualitaets-Gates und Pipeline

---

## Mindeststandard fuer Testlaeufe
1. Lokale oder Live-Umgebung steht.
2. Relevante Checklistenpunkte sind ausgefuehrt.
3. Bugs sind reproduzierbar dokumentiert.
4. Sicherheits- oder Compliance-Auswirkungen sind markiert.

---

## Empfohlener Ablauf
1. Setup ueber `TEST_ENVIRONMENT_SETUP.md` oder Live-URL.
2. Tests ueber `TESTING_CHECKLIST.md` durchfuehren.
3. Bug-Beschreibung nach `TESTING_GUIDE.md` erfassen.
4. Bei Security/Legal-Bezug zusaetzlich `docs/SECURITY_GUIDE.md` und `docs/LEGAL_COMPLIANCE.md` referenzieren.

---

## Kurzfassung
1. Setup oder Live-Zugang sicherstellen.
2. Checkliste ausfuehren.
3. Reproduzierbares Feedback liefern.
4. Bei kritischen Findings direkt eskalieren.

---

**Welcome to Testing! **

Danke, dass du ABI Planer testest und damit hilfst, eine großartige App zu bauen.

Viel Erfolg! 
