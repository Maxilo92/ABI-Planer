---
type: note
status: active
tags:
  - agents
  - workflow
---

# Agent Roles

The vault should support a small set of clear roles instead of a generic "assistant" bucket.

## Core roles

| Role | Responsibility | Output |
| --- | --- | --- |
| Repo Steward | Keeps the handbook and repo conventions aligned. | Updated MOCs, links, and scope decisions. |
| Product Architect | Shapes product boundaries and feature plans. | Product notes, feature maps, decision logs. |
| UI and Design Lead | Defines visual direction and interaction rules. | Design guidelines, do and do-not notes. |
| Security and Compliance Lead | Guards privacy, auth, and legal constraints. | Compliance notes, risk checks, review flags. |
| QA Lead | Validates changes and catches regressions. | Test strategy, verification notes, release gates. |
| Release Operator | Coordinates versioning and delivery. | Release notes, deployment checklist, change log updates. |

## Expectations

- Every role should link to the source of truth it depends on.
- Every role should leave a short note behind when it changes a decision.
- Every role should know when to escalate instead of guessing.
