# Design: Refined Collectible Card Sorting & Filtering

## Problem Statement
The current filtering and sorting logic for collectible cards in the `TeacherAlbum` component is not precise enough. Users cannot easily distinguish between a card's "Variant" (e.g., BlackHolo, Shiny) and its "Actual Rarity" (e.g., Legendary, Mythic). Currently, "Rarity" sorting combines both, which can be confusing. Users want separate sorting options to prioritize BlackHolos (Variants) and Legendary cards (Rarities) respectively.

## Approach
We will introduce a distinct "Sort by Variant" option to the existing sorting system.

### Selected Approach: Distinct Sorting Keys
- **Sort by Rarity (Existing/Updated)**: Prioritizes `TeacherRarity` (Legendary > Mythic > Epic > Rare > Common). Card variant will be the secondary sort criteria.
- **Sort by Variant (New)**: Prioritizes `CardVariant` (BlackHolo/Secret Rare > Shiny > Holo > Normal). Actual rarity will be the secondary sort criteria.
- **UI Update**: The sorting dropdown in `TeacherAlbum.tsx` will be updated to include both "Seltenheit" (Rarity) and "Variante" (Version) as separate options.

### Implementation Details
1. **Types**: Update `SortKey` in `TeacherAlbum.tsx` to include `'variant'`.
2. **Sorting Logic**:
   - Refine `RARITY_ORDER` and `VARIANT_ORDER` usage in the `filteredTeachers` `useMemo`.
   - Implement the `variant` sort logic: `black_shiny_holo` > `shiny` > `holo` > `normal`.
   - Implement the `rarity` sort logic: `legendary` > `mythic` > `epic` > `rare` > `common`.
3. **UI**: Add the "Variante" option to the `DropdownMenu` in `TeacherAlbum.tsx`.

## Risk Assessment
- **Sorting Performance**: Sorting happens on the frontend using `useMemo`. With a large number of cards, this could theoretically impact performance, but the current collection size is manageable.
- **UI Space**: Adding more items to the dropdown might make it slightly more crowded on smaller mobile screens, but the impact is minimal for one additional entry.

## Success Criteria
- Users can toggle between "Sort by Rarity" and "Sort by Variant".
- "Sort by Rarity" puts all Legendary cards at the top.
- "Sort by Variant" puts all BlackHolo cards at the top.
- The UI clearly labels these two distinct sorting methods.
