---
type: note
status: active
tags:
  - systems
  - data
  - security
---

# Data and Rules

This note explains where data lives and how access is guarded.

## What it covers

- Firestore collections and schema shape
- rules as the real security boundary
- storage access and file uploads
- profile fields that affect access or presentation

## Common checks

- does the data change belong in the client or the server
- does the field need a rule update as well as a schema update
- does the change affect the abi-data database only

## Canonical sources

- [docs/FIRESTORE_SCHEMA.md](../../docs/FIRESTORE_SCHEMA.md)
- [firestore.rules](../../firestore.rules)
- [storage.rules](../../storage.rules)
