# Modular Card System

The Modular Card System is a set-based framework designed for scalability, allowing the easy addition of new card types, sets, and booster pack configurations. It migrates away from hardcoded lists to a central, registry-backed architecture.

## 1. Set-Based Framework Overview

The system organizes cards into **Sets**. Each set has a unique ID, a display name, a prefix for card numbering, and a default theme color.

- **Registry**: `src/constants/cardRegistry.ts` is the central source of truth.
- **Sets**: Individual set definitions live in `src/constants/sets/`.
- **Types**: Card structures are defined in `src/types/registry.ts`.

## 2. How to Add a New Set

To add a new set (e.g., "Expansion Pack 2026"):

1.  **Create the Set File**: Create `src/constants/sets/expansion_2026.ts`.
    ```typescript
    import { TeacherCardConfig, SupportCardConfig } from '@/types/registry';

    export const EXPANSION_2026: (TeacherCardConfig | SupportCardConfig)[] = [
      {
        id: 'new-teacher',
        name: 'Prof. New',
        rarity: 'rare',
        type: 'teacher',
        hp: 70,
        attacks: [{ name: 'Lecture', damage: 30 }]
      }
    ];
    ```

2.  **Register the Set**: In `src/constants/cardRegistry.ts`, import your set and add it to the `CARD_SETS` object.
    ```typescript
    import { EXPANSION_2026 } from './sets/expansion_2026';

    export const CARD_SETS: Record<string, SetDefinition> = {
      // ... existing sets
      'expansion_2026': {
        id: 'expansion_2026',
        name: 'Expansion 2026',
        prefix: 'E26',
        color: '#f59e0b', // amber-500
        cards: EXPANSION_2026
      }
    };
    ```

## 3. How to Add a New Card

Cards are added to the `cards` array within their respective set files.

### Teacher Cards
Teachers are the primary combat units.
- **Required fields**: `hp` (number), `attacks` (array of `TeacherAttack`).
- **Example**:
  ```typescript
  {
    id: 'max-mustermann',
    name: 'Max Mustermann',
    rarity: 'common',
    type: 'teacher',
    hp: 60,
    attacks: [{ name: 'Klausur', damage: 20 }]
  }
  ```

### Support Cards
Support cards provide utility or special effects during combat.
- **Required fields**: `effect` (string description), `effectId` (string for logic mapping).
- **Optional fields**: `baseMultiplier`, `incrementPerLevel`.
- **Example**:
  ```typescript
  {
    id: 'noten-wuerfeln',
    name: 'Noten würfeln',
    rarity: 'common',
    type: 'support',
    effect: 'Wirf einen Würfel...',
    effectId: 'dice_roll_damage',
    baseMultiplier: 10
  }
  ```

## 4. The 'setId:cardId' Format

The system uses a composite ID format to ensure global uniqueness across all sets:
`fullId = "setId:cardId"` (e.g., `teachers_v1:max-mustermann`).

- **Internal Lookup**: The `cardRegistry` builds an O(1) index of all cards using this `fullId`.
- **Card Numbers**: Automatically generated as `prefix-cardId` (e.g., `T1-max-mustermann`).
- **Legacy Support**: `getCard(id)` defaults to the `teachers_v1` set if no colon is present.

## 5. How to Add a New Booster Pack

Booster packs are configured to draw from one or more sets with specific weights.

### Backend Configuration
In `functions/src/shop.ts`, update the `PACK_CONFIGS` object:
```typescript
const PACK_CONFIGS = {
  "mixed_pack_v1": {
    id: "mixed_pack_v1",
    name: "Mixed Booster v1",
    lootPools: [
      { setId: "teachers_v1", weight: 70 },
      { setId: "support_v1", weight: 30 },
    ],
  },
};
```

### Frontend Integration
In `src/app/shop/page.tsx`, add a new bundle definition to `BUNDLE_DEFS` or `ALL_ITEMS`. When calling `openBooster` via the `useUserTeachers` hook, pass the `packId`:
```typescript
const { collectBooster } = useUserTeachers();
// ...
await collectBooster({ packId: 'mixed_pack_v1' });
```

## 6. How to Implement New Combat Effects

Support cards rely on `effectId` to trigger specific logic in the combat engine.

1.  **Define the ID**: Add a unique `effectId` to the card in the registry (e.g., `heal_all`).
2.  **Implement Logic**:
    - For visual effects (like dice rolling), update `src/components/combat/DiceRoller.tsx` or create a new effect component.
    - For mechanical logic, hook into the combat state manager (typically where `useCombat` or similar hooks process actions).
3.  **Mapping**: Ensure the `CardRenderer` or combat overlay recognizes the `effectId` to display the correct icons or animations.

---
*Note: All RNG and card generation logic is handled server-side in the `openBooster` Cloud Function for security.*
