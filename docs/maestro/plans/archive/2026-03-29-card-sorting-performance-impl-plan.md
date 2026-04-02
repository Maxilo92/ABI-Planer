# Implementation Plan: Card Sorting Performance Optimization

Optimize the performance of the Teacher Album by refining sorting logic and memoizing heavy UI components.

## Phase 1: UI Component Optimization

### Objective
Memoize the `TeacherCard` component to prevent unnecessary re-renders of the entire card grid.

### Agent Assignment
- **Primary Agent**: `coder`
- **Rationale**: Direct modification of a UI component.

### Files to Modify
- **File**: `src/components/cards/TeacherCard.tsx`
  - Wrap the `TeacherCard` component export in `React.memo`.

### Validation Criteria
- Run `npm run lint` and `npx tsc --noEmit`.

---

## Phase 2: Sorting Logic Refactoring

### Objective
Optimize the `filteredTeachers` `useMemo` in `TeacherAlbum.tsx` by pre-calculating sort weights and using O(1) weight lookups.

### Agent Assignment
- **Primary Agent**: `coder`
- **Rationale**: Refactoring internal component logic for performance.

### Files to Modify
- **File**: `src/components/dashboard/TeacherAlbum.tsx`
  - **Change 1**: Create `RARITY_MAP` and `VARIANT_MAP` constants for O(1) lookup:
    ```typescript
    const RARITY_MAP = Object.fromEntries(RARITY_ORDER.map((r, i) => [r, i]));
    const VARIANT_MAP = Object.fromEntries(VARIANT_ORDER.map((v, i) => [v, i]));
    ```
  - **Change 2**: Split the `filteredTeachers` logic into two steps:
    1. Pre-calculate sorting metadata (weights, ownership, best variant) for all `globalTeachers`.
    2. Sort and filter using these pre-calculated values to minimize overhead in the sort loop.
  - **Change 3**: Stabilize the `cardData` object passed to `TeacherCard` by memoizing it inside the `.map()` if necessary or using a more stable structure.

### Validation Criteria
- Run `npm run lint` and `npx tsc --noEmit`.
- **Manual Verification**: Confirm that sorting by Rarity, Variant, Name, and Level works as before but significantly faster.

---

## File Inventory
| Phase | Action | Path | Purpose |
|-------|--------|------|---------|
| 1 | Modify | `src/components/cards/TeacherCard.tsx` | UI component memoization. |
| 2 | Modify | `src/components/dashboard/TeacherAlbum.tsx` | Performance optimization for filtering and sorting. |

---

## Risk Classification
| Phase | Risk | Rationale |
|-------|------|-----------|
| 1 | LOW | Standard React optimization. |
| 2 | MEDIUM | Refactoring core sorting logic could introduce regressions if weights are mapped incorrectly. |

## Execution Profile
- **Total phases**: 2
- **Parallelizable phases**: 0 (sequential is better to verify UI first)
- **Sequential-only phases**: 2
- **Estimated wall time**: 15 minutes
