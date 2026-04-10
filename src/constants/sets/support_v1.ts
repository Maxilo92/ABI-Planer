import { SupportCardConfig } from '@/types/registry';

export const SUPPORT_V1: SupportCardConfig[] = [
  {
    id: 'noten-wuerfeln',
    name: 'Noten würfeln',
    rarity: 'common',
    type: 'support',
    description: 'Wirf einen 6-seitigen Würfel. Der Gegner erleidet Schaden in Höhe der Augenzahl multipliziert mit 10.',
    effect: 'Wirf einen Würfel, der Gegner nimmt die Augenzahl multipliziert mit 10 Schaden.',
    effectId: 'dice_roll_damage',
    baseMultiplier: 10,
    incrementPerLevel: 1,
    style: 'modern-flat' // Using an existing style from CardStyle
  }
];
