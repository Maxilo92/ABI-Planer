import { CardConfig, SetDefinition } from './cards';

export type ResolvedCard = CardConfig & {
  setId: string;
  fullId: string; // setId:cardId
  cardNumber: string; // e.g., "T1-001"
  color: string; // Resolved color (either card override or set default)
};

export { type CardConfig, type SetDefinition, type BaseCard, type TeacherCardConfig, type SupportCardConfig, type CardType } from './cards';
