import { LootTeacher, TeacherRarity, TeacherAttack } from './database';

export type Rarity = TeacherRarity;

export type CardVariant = 
  | 'normal' 
  | 'holo' 
  | 'shiny' 
  | 'black_shiny_holo';

export type CardStyle = 'soft-glass' | 'modern-flat' | 'playful-pattern' | 'modern-premium' | 'holographic-edge';

export type CardType = 'teacher' | 'support' | 'event' | 'item';

export interface BaseCard {
  id: string; // The cardId within the set (e.g., "001")
  name: string;
  rarity: TeacherRarity;
  type: CardType;
  description?: string;
  style?: CardStyle;
  color?: string; // Optional override for set color
  imageUrl?: string;
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

export interface CardData {
  id: string; // The cardId within the set (e.g., "001")
  setId?: string; // The set ID (e.g., "teachers_v1")
  fullId?: string; // The combined ID (e.g., "teachers_v1:001")
  cardNumber: string; // e.g., "T1-001"
  name: string;
  rarity: Rarity;
  variant: CardVariant;
  color: string;
  type?: CardType;
  style?: CardStyle;
  description?: string;
  hp?: number;
  attacks?: TeacherAttack[];
  level?: number;
  count?: number;
  imageUrl?: string;
}

export interface RarityWeights {
  common: number;
  rare: number;
  epic: number;
  mythic: number;
  legendary: number;
  iconic: number;
}

export interface VariantProbabilities {
  shiny: number;
  holo: number;
  black_shiny_holo: number;
}

export interface GlobalCardLimits {
  daily_allowance: number;
  reset_hour: number;
  godpack_chance: number; // e.g., 0.005 for 1/200
  rarity_limits?: Record<string, number>;
}

export interface CustomPackSlotDefinition {
  slotIndex: number;
  cardId: string; // setId:cardId or legacy teacherId
  variant?: CardVariant;
}

export interface CustomPackPreset {
  id: string;
  name: string;
  allowRandomFill?: boolean;
  slots: CustomPackSlotDefinition[];
}

export interface CardSet {
  id: string;
  name: string;
  prefix: string;
  color: string;
  cards: CardConfig[];
}

export interface SetDefinition {
  id: string; // e.g., 'teachers_v1'
  name: string;
  prefix: string; // e.g., 'T1' for T1-001
  color: string; // Default color for cards in this set
  cards: CardConfig[];
}

export interface SammelkartenConfig {
  sets?: Record<string, CardSet>;
  loot_teachers?: LootTeacher[]; // Legacy, wird migriert
  rarity_weights: RarityWeights[]; // Array für 3 Slots
  godpack_weights: RarityWeights[]; // Array für 3 Slots
  variant_probabilities: VariantProbabilities;
  global_limits: GlobalCardLimits;
  custom_pack_presets?: CustomPackPreset[];
  is_trading_enabled?: boolean;
  updated_at?: any;
}
