---
type: note
status: active
tags:
  - design
  - ui
---

# UI Guidelines

## Layout rules

- keep the app mobile-first and compact
- use persistent navigation only when the viewport supports it cleanly
- prefer clear spacing and readable line length over dense clutter
- keep the sidebar and modal patterns consistent across sections
- avoid making the interface look like a wall of Kacheln; use cards only when they improve scanning and hierarchy

## Interaction rules

- use obvious feedback for save, error, loading, and permission states
- do not rely on hidden interactions for important actions
- keep destructive actions separated and clearly labeled
- use motion sparingly and only when it helps orientation or state change

## Component guidance

- **Compact Toggles**: `TabsList` Komponenten sollten das Muster `w-fit` verwenden (statt `w-full`), um eine überdimensionierte Darstellung auf großen Viewports zu vermeiden und auf Mobile zentriert zu bleiben.
- **Dashboard Loading**: Verwendung eines resilienten Musters mit 3-Sekunden Timeout. Granulare Skeletons (Pulse-Style) verhindern "unendliche" Ladezustände bei langsamen Verbindungen.
- build reusable section headers and empty states
- keep tables and lists scannable
- avoid making every panel look equally important
- let the most important control win visually

## Review checklist

- does the screen still work on a phone
- can a new user see the primary action immediately
- does the visual style feel intentional rather than generic
- do the states make the app feel trustworthy
- if the screen has user-facing labels or helper text, are Umlaute used where appropriate
