import { SupportCardConfig } from '@/types/registry';

export const SUPPORT_V1: SupportCardConfig[] = [
  {
    id: 'noten-wuerfeln',
    name: 'Noten würfeln',
    rarity: 'common',
    type: 'support',
    description: 'Ein riskanter Wurf, der alles entscheiden kann.',
    attack: {
      name: 'Glückswurf',
      damage: 30,
      description: 'Wirf einen 6-seitigen Würfel. Multipliziert den Schaden mit der Augenzahl.',
      effect: 'pierce'
    },
    baseMultiplier: 10,
    incrementPerLevel: 2,
    style: 'modern-premium',
    color: '#10b981', // Emerald
    obtainMessage: 'Bonus in Supportboostern.'
  },
  {
    id: 'kaffee-schub',
    name: 'Kaffee-Schub',
    rarity: 'rare',
    type: 'support',
    description: 'Kurzzeitige Energie für lange Nächte.',
    attack: {
      name: 'Koffein-Schock',
      damage: 45,
      description: 'Verursacht soliden Schaden und macht den Gegner schläfrig.',
      effect: 'sleep'
    },
    baseMultiplier: 12,
    incrementPerLevel: 3,
    style: 'modern-premium',
    color: '#8b4513', // SaddleBrown
    obtainMessage: 'Bonus in Supportboostern.'
  },
  {
    id: 'spickzettel',
    name: 'Spickzettel',
    rarity: 'epic',
    type: 'support',
    description: 'Wissen ist Macht, auch wenn es versteckt ist.',
    attack: {
      name: 'Präzisions-Wissen',
      damage: 60,
      description: 'Ignoriert gegnerische Verteidigung durch exakte Vorbereitung.',
      effect: 'pierce'
    },
    baseMultiplier: 15,
    incrementPerLevel: 4,
    style: 'modern-premium',
    color: '#6366f1', // Indigo
    obtainMessage: 'Bonus in Supportboostern.'
  },
  {
    id: 'klassenkasse',
    name: 'Klassenkasse',
    rarity: 'mythic',
    type: 'support',
    description: 'Geld regiert die Welt – und den Schulhof.',
    attack: {
      name: 'Budget-Explosion',
      damage: 80,
      description: 'Ein massiver Angriff, finanziert durch jahrelanges Sparen.',
      effect: 'none'
    },
    baseMultiplier: 20,
    incrementPerLevel: 5,
    style: 'modern-premium',
    color: '#f59e0b', // Amber
    obtainMessage: 'Extrem selten in Supportboostern.'
  },
  {
    id: 'abi-zeitung',
    name: 'ABI Zeitung',
    rarity: 'legendary',
    type: 'support',
    description: 'Die Wahrheit kommt ans Licht.',
    attack: {
      name: 'Enthüllungs-Story',
      damage: 100,
      description: 'Schockiert den Gegner mit peinlichen Fakten und verursacht massiven Schaden.',
      effect: 'stun'
    },
    baseMultiplier: 25,
    incrementPerLevel: 6,
    style: 'modern-premium',
    color: '#ef4444', // Red
    obtainMessage: 'Legendärer Support-Drop.'
  }
];
