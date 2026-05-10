---
type: note
status: active
tags:
  - systems
  - functions
---

# Functions and Async Jobs

This note tracks the server-side work that happens after a user action.

## What it covers

- Cloud Functions that mutate data or send notifications
- scheduled or background jobs
- event-driven side effects like pushes or imports
- server-only logic that should never move into the client

## Common checks

- is the action idempotent enough for retries
- does the client need an optimistic state while the server finishes
- does the function need documentation in the API handbook

## Canonical sources

- [functions/src/index.ts](../../functions/src/index.ts)
- [docs/CLOUD_FUNCTIONS_API.md](../../docs/CLOUD_FUNCTIONS_API.md)
- [docs/PUSH_NOTIFICATIONS_SETUP.md](../../docs/PUSH_NOTIFICATIONS_SETUP.md)
