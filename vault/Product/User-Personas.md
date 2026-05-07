---
type: note
status: active
tags:
  - product
  - ux
---

# User Personas

Um die App und ihre Features tief zu verstehen, müssen wir wissen, für wen wir sie bauen. Der ABI Planer hat drei primäre Nutzergruppen.

## 1. Der Planer (The Coordinator)
*   **Wer**: Mitglieder des Abikomitees, Kassenwarte, Event-Organisatoren.
*   **Ziele**: Den Überblick behalten, Finanzen absichern, Termine koordinieren, Aufgaben delegieren.
*   **Pain Points**: Zersplitterte Kommunikation (WhatsApp-Chaos), unklare Budgetlage, fehlende Verbindlichkeit bei Aufgaben.
*   **Kern-Features**: Finanzen, Aufgaben (Todos), Kalender, Admin-Bereich.

## 2. Der Schüler (The Graduate)
*   **Wer**: Alle Schüler des Jahrgangs.
*   **Ziele**: Informiert bleiben, abstimmen, am sozialen Leben des Jahrgangs teilhaben, Lehrer-Karten sammeln (TCG).
*   **Pain Points**: Wichtige Infos gehen unter, keine Übersicht über anstehende Zahlungen oder Events.
*   **Kern-Features**: News-Feed, TCG (Sammelkarten), Events, Abstimmungen (Polls).

## 3. Der Lehrer (The Legend)
*   **Wer**: Lehrer der Schule (meist passiv als Motiv der Sammelkarten, teilweise aktiv als Betreuer).
*   **Ziele**: Den Jahrgang unterstützen, (passiv) Teil der TCG-Community sein.
*   **Rolle**: Lehrer sind im System primär als "Datenobjekte" (Sammelkarten) präsent, können aber als `viewer` oder `admin` (bei Tutoren) integriert sein.

## User Journey: "Vom Onboarding zum Pro-Nutzer"
1.  **Entry**: Registrierung mit Lernsax-Email -> Wartestatus (`is_approved: false`).
2.  **Activation**: Admin gibt Nutzer frei -> Zugriff auf Dashboard.
3.  **Engagement**: Nutzer öffnet ersten Booster, sieht nächste Events, reagiert auf News.
4.  **Action (nur Planer)**: Erfasst erste Einnahme, weist Aufgabe zu.

## Verwandte Quellen
- [[Product/Product-Vision]]
- [[Systems/Security-and-Identity]]
