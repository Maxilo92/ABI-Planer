import { SetDefinition, ResolvedCard } from '../types/registry';
import { TEACHERS_V1 } from './sets/teachers_v1';
import { SUPPORT_V1 } from './sets/support_v1';

const CANONICAL_TEACHER_SET_ID = 'teacher_vol1';
const LEGACY_TEACHER_SET_ID = 'teachers_v1';

/**
 * Central registry for all card sets in the system.
 * This is the source of truth for static card metadata.
 */
export const CARD_SETS: Record<string, SetDefinition> = {
  [CANONICAL_TEACHER_SET_ID]: {
    id: CANONICAL_TEACHER_SET_ID,
    name: 'Lehrer Set v1',
    prefix: 'T1',
    color: '#3b82f6', // blue-500
    cards: TEACHERS_V1
  },
  'support_v1': {
    id: 'support_v1',
    name: 'Support Set v1',
    prefix: 'S1',
    color: '#10b981', // emerald-500
    cards: SUPPORT_V1
  }
};

// Index for O(1) lookups: "setId:cardId" -> ResolvedCard
export const cardRegistry: Record<string, ResolvedCard> = {};

/**
 * Rebuilds the registry index from CARD_SETS and optional dynamic sets.
 * Should be called if dynamic sets are loaded from Firestore.
 */
export function rebuildRegistryIndex(dynamicSets?: Record<string, SetDefinition>) {
  // Clear existing index
  Object.keys(cardRegistry).forEach(key => delete cardRegistry[key]);

  const allSets = { ...CARD_SETS, ...(dynamicSets || {}) };

  Object.values(allSets).forEach((set) => {
    set.cards.forEach((card) => {
      const fullId = `${set.id}:${card.id}`;
      const resolvedCard = {
        ...card,
        setId: set.id,
        fullId,
        cardNumber: `${set.prefix}-${card.id}`,
        color: card.color || set.color,
      } as ResolvedCard;

      cardRegistry[fullId] = resolvedCard;

      // Backward compatibility for old teacher set IDs.
      if (set.id === CANONICAL_TEACHER_SET_ID) {
        const legacyFullId = `${LEGACY_TEACHER_SET_ID}:${card.id}`;
        cardRegistry[legacyFullId] = {
          ...resolvedCard,
          setId: CANONICAL_TEACHER_SET_ID,
          fullId,
        };
      }
    });
  });
}

// Initial build
rebuildRegistryIndex();

/**
 * Retrieves a card by its full ID (setId:cardId) or legacy ID.
 * If no setId is provided, it defaults to 'teacher_vol1' for backward compatibility.
 */
export function getCard(id: string): ResolvedCard | undefined {
  if (!id) return undefined;
  
  let fullId = id;
  if (!id.includes(':')) {
    fullId = `${CANONICAL_TEACHER_SET_ID}:${id}`;
  }

  const directMatch = cardRegistry[fullId];
  if (directMatch) return directMatch;

  if (fullId.startsWith(`${LEGACY_TEACHER_SET_ID}:`)) {
    const cardId = fullId.slice(`${LEGACY_TEACHER_SET_ID}:`.length);
    return cardRegistry[`${CANONICAL_TEACHER_SET_ID}:${cardId}`];
  }
  
  return undefined;
}

/**
 * Returns all registered cards as a flat array.
 */
export function getAllCards(): ResolvedCard[] {
  const unique = new Map<string, ResolvedCard>();
  Object.values(cardRegistry).forEach((card) => {
    if (!unique.has(card.fullId)) unique.set(card.fullId, card);
  });
  return Array.from(unique.values());
}

/**
 * Returns all cards belonging to a specific set.
 */
export function getCardsBySet(setId: string): ResolvedCard[] {
  return getAllCards().filter(card => card.setId === setId);
}
