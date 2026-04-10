import { LootTeacher } from '@/types/database'

export const DEFAULT_RARITY_WEIGHTS = [
  { common: 0.8, rare: 0.15, epic: 0.04, mythic: 0.008, legendary: 0.002, iconic: 0 },
  { common: 0.6, rare: 0.25, epic: 0.11, mythic: 0.03, legendary: 0.01, iconic: 0 },
  { common: 0.4, rare: 0.35, epic: 0.17, mythic: 0.06, legendary: 0.02, iconic: 0 }
]

export const DEFAULT_GODPACK_WEIGHTS = [
  { common: 0, rare: 0.4, epic: 0.35, mythic: 0.15, legendary: 0.10, iconic: 0 },
  { common: 0, rare: 0.2, epic: 0.4, mythic: 0.25, legendary: 0.15, iconic: 0.05 },
  { common: 0, rare: 0, epic: 0.4, mythic: 0.4, legendary: 0.2, iconic: 0.1 }
]

export const DEFAULT_VARIANTS_PROBABILITIES = {
  shiny: 0.05,
  holo: 0.15,
  black_shiny_holo: 0.005
}
