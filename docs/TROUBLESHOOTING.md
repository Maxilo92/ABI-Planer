# Troubleshooting

Hauefige Probleme und kurze Diagnosepfade fuer Entwickler.

## 1. Build oder TypeScript schlagen fehl
Symptom:
- `npm run check` faellt in `npx tsc --noEmit` oder Build.

Pruefen:
1. Typen in `src/types/database.ts` gegen reale Firestore-Felder abgleichen.
2. Alte Build-Artefakte entfernen: `npm run build:clean`.
3. Bei Functions-Aenderungen separat: `cd functions && npm run build`.

## 2. Lint-Themen
Symptom:
- Lint-Warnungen/Fehler blockieren Review.

Pruefen:
1. Lint-Befehl ist `npm run lint` (ESLint CLI).
2. Kein `npm run typecheck` verwenden (nicht definiert).

## 3. Firebase/Firestore Permission Denied
Symptom:
- `permission-denied` im Client oder in Logs.

Pruefen:
1. Ist der Nutzer authentifiziert?
2. Hat das Profil `is_approved: true`?
3. Passt die Rolle fuer den Vorgang?
4. Entspricht die Operation den Rules in `firestore.rules`?

## 4. CORS-Probleme auf `*.localhost`
Symptom:
- Callable/HTTP Functions werden im Browser geblockt.

Pruefen:
1. Local Proxy-Route nutzen (same-origin) statt direktem browserseitigen Cloud Functions Call.
2. Emulator-Flag und lokale Domain-Konstellation pruefen.

## 5. App zeigt alte Version
Symptom:
- UI passt nicht zum aktuellen Code.

Pruefen:
1. Build-Artefakte bereinigen: `rm -rf .next && npm run build`.
2. Dev-Server neu starten.

## 6. Neue API-Route liefert lokal 404
Symptom:
- Frisch angelegte `app/api` Route ist lokal nicht erreichbar.

Pruefen:
1. Dev-Server neu starten.
2. Falls noetig `.next` bereinigen.
3. Bei lokaler Subdomain-Entwicklung Fallback-Route verwenden.

## 7. Environment-Variablen greifen nicht
Symptom:
- Firebase oder externe Services initialisieren nicht korrekt.

Pruefen:
1. Variablen in `.env.local` vollstaendig?
2. Nach Aenderung Server neu gestartet?
3. In Produktion Variablen in App Hosting gesetzt?
4. Siehe `docs/.env-reference.md`.
