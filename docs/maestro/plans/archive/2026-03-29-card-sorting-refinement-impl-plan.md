# Implementation Plan: Refined Collectible Card Sorting

Refine the filtering and sorting of collectible cards to distinguish between "Actual Rarity" (e.g., Legendary) and "Card Variant/Version" (e.g., BlackHolo), ensuring both can be prioritized.

## User-facing Changes
- **New Sort Option**: Adds "Variante" (Version) to the sorting dropdown in the Teacher Album.
- **Improved Rarity Sort**: "Seltenheit" now prioritizes actual rarity (Legendary, Mythic, etc.) as the primary criteria, with variant as secondary.
- **New Variant Sort**: "Variante" prioritizes the visual version (BlackHolo, Shiny, Holo, Normal) as the primary criteria, with rarity as secondary.

---

## Phase 1: Sorting Refinement (Implementation)

### Objective
Update `TeacherAlbum.tsx` to handle the new sorting key and refine the logic for rarity-based sorting.

### Agent Assignment
- **Primary Agent**: `coder`
- **Rationale**: This is a direct implementation task in a single component.

### Files to Modify
- **File**: `src/components/dashboard/TeacherAlbum.tsx`
  - **Change 1**: Update state type for `sortKey` to include `'variant'`.
  - **Change 2**: Update `handleSortChange` to accept `'variant'`.
  - **Change 3**: Refine `filteredTeachers` `useMemo` sorting logic:
    - Implement `sortKey === 'rarity'`: Primary = `RARITY_ORDER`, Secondary = `VARIANT_ORDER`.
    - Implement `sortKey === 'variant'`: Primary = `VARIANT_ORDER`, Secondary = `RARITY_ORDER`.
  - **Change 4**: Add a new `DropdownMenuItem` for "Variante" in the sorting section of the `DropdownMenu`.
  - **Change 5**: (Optional/Refinement) Update the preview sort (used for "Seltenste Karten" header) to match the new "Variant" logic (BlackHolo first).

### Validation Criteria
1. **Build**: Run `npm run build` or `npx tsc` to ensure no type errors.
2. **Lint**: Run `npm run lint`.
3. **Manual Verification**:
   - Open the Teacher Album.
   - Select "Sortieren: Seltenheit" (Rarity). Verify Legendary cards are at the top regardless of variant.
   - Select "Sortieren: Variante" (New). Verify BlackHolo (Secret Rare) cards are at the top regardless of rarity.
   - Verify the sorting order (asc/desc) still works correctly for both.

---

## File Inventory
| Phase | Action | Path | Purpose |
|-------|--------|------|---------|
| 1 | Modify | `src/components/dashboard/TeacherAlbum.tsx` | Central logic for card album filtering and sorting. |

---

## Risk Classification
| Phase | Risk | Rationale |
|-------|------|-----------|
| 1 | LOW | Frontend-only change with targeted logic updates. No database schema changes. |

## Execution Profile
- **Total phases**: 1
- **Parallelizable phases**: 0
- **Sequential-only phases**: 1
- **Estimated wall time**: 15 minutes
