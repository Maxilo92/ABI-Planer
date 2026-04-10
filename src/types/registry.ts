import { TeacherRarity, TeacherAttack } from './database';
import { CardStyle } from './cards';

export type CardType = 'teacher' | 'support' | 'event' | 'item';

export interface BaseCard {
  id: string; // The cardId within the set (e.g., "001")
  name: string;
  rarity: TeacherRarity;
  type: CardType;
  description?: string;
  style?: CardStyle;
  color?: string; // Optional override for set color
}

export interface TeacherCardConfig extends BaseCard {
  type: 'teacher';
  hp: number;
  attacks: TeacherAttack[];
}

export interface SupportCardConfig extends BaseCard {
  type: 'support';
  effect: string;
  effectId?: string; // The ID of the hardcoded effect handler
  baseMultiplier?: number;
  incrementPerLevel?: number;
  flavorText?: string;
}

export type CardConfig = TeacherCardConfig | SupportCardConfig;

export interface SetDefinition {
  id: string; // e.g., 'teachers_v1'
  name: string;
  prefix: string; // e.g., 'T1' for T1-001
  color: string; // Default color for cards in this set
  cards: CardConfig[];
}

export type ResolvedCard = CardConfig & {
  setId: string;
  fullId: string; // setId:cardId
  cardNumber: string; // e.g., "T1-001"
  color: string; // Resolved color (either card override or set default)
};
