# Agent Context Index

Purpose: Help future coding agents load only the minimum relevant context.

## Fast Start (Default)

1. Read root project orientation:
   - README.md
   - INSTALL.md
   - GEMINI.md
2. Read domain overview:
   - docs/PROJECT_KNOWLEDGE.md
3. Read recent product change history:
   - CHANGELOG.md (latest sections only)

## Context Budget Rules

- Start with filenames only. Read full content only when a file is directly relevant.
- Prefer active docs over archived docs.
- Skip archive paths by default unless investigating historical behavior:
  - docs/archive/**
  - docs/maestro/**/archive/**
  - .gemini/**/archive/**
- Treat changelogs as append-only references; read newest entries first.

## Priority Map

- P0 (Always first): README.md, INSTALL.md, GEMINI.md, docs/PROJECT_KNOWLEDGE.md
- P1 (Task planning): docs/maestro/plans/*.md, docs/maestro/audit-reports/*.md
- P2 (History lookup): CHANGELOG.md, docs/maestro/state/*.md
- P3 (Archive, skip by default): any path containing /archive/

## Task-to-File Routing

- Product behavior or user-facing flow:
  - README.md
  - docs/PROJECT_KNOWLEDGE.md
  - CHANGELOG.md
- Implementation planning process:
  - docs/maestro/plans/*.md (non-archive first)
- Historical regressions and prior attempts:
  - docs/maestro/state/*.md (archive only if needed)
- Agent operating conventions:
  - .gemini/rules/*.md
  - .gemini/skills/*/SKILL.md

## Decision Tree

- Need current truth? Use non-archive docs first.
- Need why something changed? Open latest CHANGELOG entries.
- Need old context? Search archive last.
- Need to save context window? Stop reading after confirming the target module and exact impacted files.

## Maintenance

When adding new markdown docs:

- Add clear scope in the first section.
- Mark if active or archive.
- Link to neighboring docs only when it reduces lookup time.
- For parallel or async agent work, preserve the current working tree before any push attempt, verify the remote state first, and never resolve a failed push by deleting half-finished local changes.
- If multiple agents touched overlapping files, prefer merge/rebase with explicit conflict review over blanket resets or reverts.
