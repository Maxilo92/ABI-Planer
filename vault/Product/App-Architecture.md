---
type: note
status: active
tags:
  - architecture
---

# App Architecture

The current app is a Next.js frontend backed by Firebase services and Cloud Functions.

## Current shape

- Frontend: Next.js App Router, React, TypeScript, Tailwind
- Backend: Firebase Auth, Firestore, Storage
- Server logic: Firebase Cloud Functions
- Routing: hostname-based split between public pages and dashboard experience
- Security: rules-first, zero-trust enforcement in Firestore and Storage

## Important boundaries

- keep secret logic on the server
- keep role checks in the UI as presentation only
- keep data access aligned with the rules files
- keep the handbook aligned with the canonical docs when the architecture changes

## Source notes

- [docs/PROJECT_KNOWLEDGE.md](../../docs/PROJECT_KNOWLEDGE.md)
- [docs/FIRESTORE_SCHEMA.md](../../docs/FIRESTORE_SCHEMA.md)
- [docs/CLOUD_FUNCTIONS_API.md](../../docs/CLOUD_FUNCTIONS_API.md)
- [CLAUDE.md](../../CLAUDE.md)
