# Design: Performance Optimization for Collectible Card Sorting

## Problem Statement
Users report a significant lag when sorting cards in the `TeacherAlbum`. This is likely caused by:
1. **Inefficient Sorting**: The `sort` function inside `useMemo` performs multiple object lookups (`userTeachers?.[id]`) and array searches (`indexOf`) for every comparison (O(N log N * search_cost)).
2. **Heavy Re-renders**: The `TeacherCard` component, which includes 3D animations and Framer Motion effects, is not memoized. When the sorted list changes, the entire grid re-renders, putting high pressure on the main thread.

## Proposed Solution

### 1. Optimize Sorting Logic (Schwartzian Transform)
Instead of calculating weights during the sort comparison, we will:
- Pre-calculate a "sort score" for each card once before sorting.
- Use `RARITY_MAP` and `VARIANT_MAP` (O(1) lookups) instead of `indexOf`.
- Perform the sort on these pre-calculated scores.

### 2. Component Memoization
- Wrap `TeacherCard` in `React.memo` to prevent re-renders unless the `data`, `isLocked`, or `upgradeInfo` props change.
- Ensure the `cardData` object passed to `TeacherCard` is stable or that `React.memo` uses a custom comparison.

### 3. Refine `useMemo` Dependencies
Ensure that the `filteredTeachers` `useMemo` in `TeacherAlbum.tsx` only recalculates when absolutely necessary.

## Implementation Details

#### TeacherAlbum.tsx
- Create `RARITY_WEIGHTS` and `VARIANT_WEIGHTS` maps.
- Optimize the `filteredTeachers` logic:
  ```typescript
  const teachersWithWeights = useMemo(() => {
    return globalTeachers.map(t => {
      const userData = userTeachers?.[t.id] || userTeachers?.[t.name];
      const variant = getBestVariant(userData?.variants);
      return {
        teacher: t,
        userData,
        isOwned: !!userData,
        rarityWeight: RARITY_WEIGHTS[t.rarity] ?? 99,
        variantWeight: VARIANT_WEIGHTS[variant] ?? 99,
        level: userData?.level || 0,
        name: t.name
      };
    });
  }, [globalTeachers, userTeachers]);

  const filteredAndSorted = useMemo(() => {
    // filter teachersWithWeights...
    // sort using the pre-calculated weights...
  }, [teachersWithWeights, filters, sortKey, sortOrder]);
  ```

#### TeacherCard.tsx
- Wrap the export in `React.memo`.

## Risk Assessment
- **Memory Usage**: Pre-calculating weights adds a small memory overhead for the mapped array, but for < 1000 items, this is negligible compared to the rendering cost.
- **Complexity**: The sorting logic becomes slightly more multi-staged but significantly faster.

## Success Criteria
- Sorting feels instantaneous (no visible lag after clicking).
- `TeacherCard` components do not re-render when the order changes (if they are already in the DOM and data hasn't changed).
