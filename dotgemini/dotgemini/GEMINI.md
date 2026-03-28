# Projektanweisungen

> REPLACE: Passe diese Datei für dein Projekt an. Lösche nicht benötigte Abschnitte – jede Zeile kostet Tokens. Code-Style steht in .gemini/rules/code-quality.md. Starte `/setupdotgemini` für Auto-Anpassung oder editiere manuell und entferne alle `> REPLACE:`-Blöcke.

## Kommandos

```bash
# Build
npm run build            # oder: cargo build, go build ./..., make build

# Test
npm test                 # gesamte Suite
npm test -- path/to/file # einzelne Testdatei

# Lint & Format
npm run lint             # Style-Check
npm run lint:fix         # Style auto-fix
npm run typecheck        # Typprüfung

# Dev
npm run dev              # Dev-Server starten
```

## Architektur

> REPLACE: Beschreibe nicht-offensichtliche Architekturentscheidungen. Keine Dateilisten – Gemini kann explorieren.

- `src/` – Anwendungscode
- `src/api/` – REST-Endpunkte (versioniert: `/v1/`)
- `src/services/` – Business-Logik (keine DB-Logik in Controllern)
- `src/models/` – Datenmodelle und Typen

## Wichtige Entscheidungen

> REPLACE: Notiere WARUM nicht-offensichtliche Entscheidungen getroffen wurden. Beispiele: "Auth-Tokens in httpOnly-Cookies wegen XSS-Risiko", "Billing als separates Modul für Audit-Unabhängigkeit".

## Domainwissen

> REPLACE: Begriffe, Abkürzungen, Konzepte, die nicht aus dem Code klar werden. Beispiel: "SKU" = Stock Keeping Unit, eindeutige Produkt-ID aus dem Lager.

## Workflow

- Nach mehreren Code-Änderungen: typecheck ausführen
- Immer Root-Cause fixen, keine Workarounds
- Bei Unsicherheit: Plan-Modus (`Shift+Tab`) nutzen

## Don'ts

- Keine Änderungen an generierten Dateien (`*.gen.ts`, `*.generated.*`)
