import { LootTeacher, TeacherRarity } from './database';

export type Rarity = TeacherRarity;

export type CardVariant = 
  | 'normal' 
  | 'holo' 
  | 'shiny-v2' 
  | 'blckshiny';

export type CardStyle = 'soft-glass' | 'modern-flat' | 'playful-pattern' | 'modern-premium' | 'holographic-edge';

export interface CardData {
  id: string;
  cardNumber: string; // e.g., "001"
  name: string;
  rarity: Rarity;
  variant: CardVariant;
  color: string;
  style?: CardStyle;
}

export interface RarityWeights {
  common: number;
  rare: number;
  epic: number;
  mythic: number;
  legendary: number;
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
}

export interface SammelkartenConfig {
  loot_teachers: LootTeacher[];
  rarity_weights: RarityWeights[]; // Array for 3 slots
  godpack_weights: RarityWeights[]; // Array for 3 slots
  variant_probabilities: VariantProbabilities;
  global_limits: GlobalCardLimits;
  updated_at?: any;
}
