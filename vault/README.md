---
type: vault-home
status: active
aliases:
  - ABI Planer Handbook
  - ABI Planer Vault
---

# ABI Planer Handbook

This vault is the primary handbook for the project. Use it to find the current understanding of the app, the architecture, the design direction, the working agreements for agents, and the operational rules that shape releases.

Every contributor should start here before making changes.

The vault is intentionally opinionated:

- **Inside & Outside**: Notes cover both technical implementation (Internal) and product/user value (External).
- **Domain Deep Dives**: Core features like Finances, TCG, and Events are documented in detail.
- **Linked Truth**: Use it to find the *why* and *how* behind the code in `src/` and `functions/`.

## Guidelines

- use German UI copy with Umlaute like ä, ö, ü when the note is describing interface text or on-screen wording
- avoid tile-heavy layouts unless a screen genuinely benefits from them
- prefer clear sections, strong hierarchy, and readable content over decorative dashboard grids
- keep design rules close to the top so they are the first thing contributors read

## Start here

- [[Design/Visual-Principles|Design principles and UI rules]]
- [[Product/README|Product and architecture]]
- [[Design/README|Design guidelines]]
- [[Agents/README|Agent roles and working rules]]
- [[Operations/README|Operations and release]]
- [[Testing/README|Testing and QA]]
- [[Compliance/README|Compliance and security]]
- [[Prompts/README|Prompts and examples]]
- [[Systems/README|System atlas]]
- [[Meta/README|Meta and note model]]
- [[Decisions/README|Decision register]]
- [[Templates/README|Templates]]
- [[Archive/README|Archive]]

## Canonical sources

- [README.md](../README.md)
- [CLAUDE.md](../CLAUDE.md)
- [docs/AGENT_CONTEXT_INDEX.md](../docs/AGENT_CONTEXT_INDEX.md)
- [docs/PROJECT_KNOWLEDGE.md](../docs/PROJECT_KNOWLEDGE.md)
- [docs/SECURITY_GUIDE.md](../docs/SECURITY_GUIDE.md)
- [docs/LEGAL_COMPLIANCE.md](../docs/LEGAL_COMPLIANCE.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [CHANGELOG.md](../CHANGELOG.md)

## How to extend

1. Start with the matching section MOC.
2. Copy the relevant template from [[Templates/README]].
3. Keep each note focused on one topic.
4. Add links back to the canonical source instead of duplicating long sections.
