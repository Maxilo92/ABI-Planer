---
type: note
status: active
tags:
  - systems
  - architecture
---

# System Atlas Overview

Use this note as the first stop for cross-cutting questions.

## Major layers

- Routing and surfaces: which host or route exposes a view
- Data and rules: which Firestore collections, rules, and schema fields matter
- Functions and async jobs: which server-side processes mutate state or send side effects
- Security and identity: how approval, roles, and access boundaries work
- Product flows: how users move through planning, teaching, collecting, and maintenance scenarios

## Canonical questions

- where does this behavior start
- which file owns the truth
- what must stay server-side
- what breaks if the rules or schema change

## Reading path

- [[Systems/Routing-and-Surfaces]]
- [[Systems/Data-and-Rules]]
- [[Systems/Functions-and-Async-Jobs]]
- [[Systems/Security-and-Identity]]
- [[Systems/Product-Flows]]
