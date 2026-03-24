export type Rarity = 'common' | 'rare' | 'epic' | 'mythic' | 'legendary';

export type CardVariant = 
  | 'normal' 
  | 'holo' 
  | 'shiny-v2' 
  | 'blckshiny';

export type CardStyle = 'soft-glass' | 'modern-flat' | 'playful-pattern' | 'minimalist-premium' | 'holographic-edge';

export interface CardData {
  id: string;
  cardNumber: string; // e.g., "001"
  name: string;
  rarity: Rarity;
  variant: CardVariant;
  color: string;
  style?: CardStyle;
}
