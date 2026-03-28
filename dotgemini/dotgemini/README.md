# dotgemini

Die standardisierte `.gemini/`-Ordnerstruktur für die tägliche Entwicklung.

## Warum das existiert

Plugins verbrauchen viele Tokens pro Turn und sind für spezielle Workflows wie das Scaffolding ganzer Projekte gedacht. Im Alltag geht es aber um Bugfixes, Features, Reviews und Tests – nicht um Produkt-Scaffolding.

Dieses Repo liefert eine schlanke, token-effiziente `.gemini/`-Konfiguration, optimiert für **Daily Development Work**. Kopiere, was du brauchst, lösche, was du nicht brauchst.

## Getting Started

### 1. Alles ins Projekt kopieren

```bash
git clone https://github.com/poshan0126/dotgemini.git /tmp/dotgemini

cd your-project
mkdir -p .gemini

# Konfigurationsdateien kopieren
cp /tmp/dotgemini/settings.json .gemini/
cp -r /tmp/dotgemini/{rules,skills,agents,hooks} .gemini/
cp /tmp/dotgemini/.gitignore .gemini/
cp /tmp/dotgemini/GEMINI.md ./
cp /tmp/dotgemini/GEMINI.local.md.example ./

chmod +x .gemini/hooks/*.sh
rm -rf /tmp/dotgemini

echo "GEMINI.local.md" >> .gitignore
```

### 2. Gemini Code neu laden

Wenn du bereits eine Gemini Code Session offen hast, **beende und starte sie neu**. Skills, Agents und Rules werden beim Start geladen.

### 3. `/setupdotgemini` ausführen

```
/setupdotgemini
```

Das erledigt:
- Entfernt README-Dateien, die Tokens verschwenden
- Scannt den Code (Tech-Stack, Test-Framework, Linter, Struktur)
- Passt `GEMINI.md` mit echten Build-/Test-/Lint-Kommandos an
- Aktualisiert `settings.json`-Berechtigungen
- Passt Rule-Pfade an echte Verzeichnisse an
- Aktiviert automatisch das Projekt-Formatter-Tool
- Entfernt nicht benötigte Configs
- Führt einen finalen Review durch

Jede Änderung wird bestätigt.

> Wenn du `/setupdotgemini` überspringst, lösche die README.md-Dateien in `.gemini/`-Unterordnern – sie verschwenden Tokens.

### Troubleshooting

| Problem | Lösung |
|---------|--------|
| Skills/Agents fehlen | **Gemini Code neu starten** |
| Hooks laufen nicht | `chmod +x .gemini/hooks/*.sh` und prüfe, ob `jq` installiert ist |
| "jq not found" blockiert alles | Installiere jq: `brew install jq` (macOS) oder `apt install jq` (Linux) |
| format-on-save funktioniert nicht | Formatter-Binary und Config im Projektroot prüfen |
| Berechtigungen verweigert | Glob-Syntax in `settings.json` prüfen |
| `/setupdotgemini` fragt nach Bestätigung | Das ist normal – `protect-files.sh` fragt nach, wenn `settings.json` geändert wird |

### 4. Mach es zu deinem

`/setupdotgemini` erledigt 90%. Für den Feinschliff:

- **`rules/code-quality.md`** – Passe Namenskonventionen an dein Team an
- **`rules/frontend.md`** – Wähle dein Design-Prinzip
- **`rules/security.md`** – Ergänze projektspezifische Pfade
- **`GEMINI.md`** – Architekturentscheidungen, Domainwissen, Workflow-Details
- **`GEMINI.local.md`** – Persönliche Präferenzen (wird gitignoriert)
- **`hooks/format-on-save.sh`** – Formatter-Sektion ggf. manuell anpassen

Die Defaults sind solide. Deine Anpassungen machen Gemini wirklich effektiv für *dein* Projekt.

## Skills (Slash Commands)

Skills werden mit `/name` aufgerufen. Alle Skills außer `/test-writer` sind manuell.

| Command | Arguments | Beschreibung |
|---------|-----------|--------------|
| `/setupdotgemini` | `[Fokus]` | Scannt den Code und passt alle `.gemini/`-Konfigs an. |
| `/debug-fix` | `[Issue #, Fehler, Beschreibung]` | Findet und behebt Bugs. |
| `/ship` | `[Commit-Message oder PR-Titel]` | Kompletter Shipping-Workflow. |
| `/hotfix` | `[Issue #, Fehler, Beschreibung]` | Notfallfix für Produktion. |
| `/pr-review` | `[PR #, staged, Pfad, oder leer]` | Review durch Spezialisten. |
| `/tdd` | `[Feature-Beschreibung]` | Strikter TDD-Loop. |
| `/explain` | `[Datei, Funktion, Konzept]` | Erklärt Code mit Diagramm und Details. |
| `/refactor` | `[Ziel]` | Sicheres Refactoring mit Tests. |
| `/test-writer` | *(auto)* | Schreibt umfassende Tests für neue Features. |

## Agents (Subagents)

Agents sind spezialisierte Gemini-Instanzen, die im isolierten Kontext laufen. Sie werden automatisch delegiert oder können mit `@agent-name` explizit aufgerufen werden.

| Agent | Wann | Was |
|-------|------|-----|
| `@code-reviewer` | Automatisch bei `/pr-review` | Code-Review auf Korrektheit und Wartbarkeit |
| `@security-reviewer` | Automatisch bei sicherheitsrelevantem Code | Security-Review |
| `@performance-reviewer` | Automatisch bei Performance-Code | Performance-Review |
| `@frontend-designer` | Automatisch bei UI | UI-Design |
| `@doc-reviewer` | Automatisch bei Doku-Änderungen | Doku-Review |

### Agents direkt nutzen

```
@security-reviewer Prüfe die Auth-Middleware in src/middleware/auth.ts
```

```
@frontend-designer Baue ein Dashboard für das Analytics-Modul
```

```
@code-reviewer Prüfe meine staged changes vor dem Commit
```

Agents laufen isoliert, haben aber Zugriff auf den gesamten Code.

## Customization Guide

| Wunsch | Aktion |
|--------|--------|
| Projektspezifische Rules | `.gemini/rules/your-rule.md` |
| Rules auf Pfade beschränken | `paths:` Frontmatter |
| Team-Workflow hinzufügen | `.gemini/skills/your-skill/SKILL.md` |
| Spezial-Reviewer hinzufügen | `.gemini/agents/your-agent.md` |
| Verhalten deterministisch erzwingen | Hook in `settings.json` |
| Lokale Overrides | Kopiere `settings.local.json.example` → `.gemini/settings.local.json` |
| Persönliche Overrides | Kopiere `GEMINI.local.md.example` → `GEMINI.local.md` |

## Was NICHT in .gemini/

- **Plugins für Daily Work** – zu teuer in Tokens
- **Alles, was Gemini aus Code lesen kann** – keine Dateistruktur beschreiben
- **Standardkonventionen** – Gemini kennt PEP 8, ESLint, Go-Formatierung
- **Verbose Erklärungen** – jede Zeile kostet Tokens
- **Volatile Infos** – in Code-Kommentare, nicht in GEMINI.md

**Token-Regel:** `alwaysApply: true`-Rules kosten immer Tokens. Path-Scoped nur bei passenden Dateien. Skills/Agents nur bei Aufruf.

## Credits

Basierend auf:
- [Official Claude Code Documentation](https://code.claude.com/docs/en)
- Community Best Practices
