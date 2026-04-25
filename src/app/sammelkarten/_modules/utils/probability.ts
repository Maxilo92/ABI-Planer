import { SammelkartenConfig } from '@/types/cards'
import { CardVariant, LootTeacher } from '@/types/database'
import {
  DEFAULT_GODPACK_WEIGHTS,
  DEFAULT_RARITY_WEIGHTS,
  DEFAULT_VARIANTS_PROBABILITIES
} from '../constants'
import { MaybeCollectionResult } from '../types'

export function getVariantProbability(
  variant: CardVariant,
  isGodpack: boolean,
  config: SammelkartenConfig | null
) {
  const probs = config?.variant_probabilities || DEFAULT_VARIANTS_PROBABILITIES

  if (isGodpack) {
    switch (variant) {
      case 'black_shiny_holo': return 0.1
      case 'shiny': return 0.3
      case 'holo': return 0.4
      default: return 0.2
    }
  }

  const pBSH = probs.black_shiny_holo ?? 0.005
  const pHolo = probs.holo ?? 0.05
  const pShiny = probs.shiny ?? 0.15

  switch (variant) {
    case 'black_shiny_holo': return pBSH
    case 'holo': return pHolo - pBSH
    case 'shiny': return pShiny - pHolo
    default: return 1.0 - pShiny
  }
}

export function getPackProbabilities(input: {
  revealedTeachers: LootTeacher[] | null
  collectionResults: MaybeCollectionResult[] | null
  config: SammelkartenConfig | null
  isGodpack: boolean
}) {
  const { revealedTeachers, collectionResults, config, isGodpack } = input
  if (!revealedTeachers || !collectionResults || !config) return null

  const godpackChance = config.global_limits?.godpack_chance ?? 0.005
  const weights = isGodpack
    ? (config.godpack_weights || DEFAULT_GODPACK_WEIGHTS)
    : (config.rarity_weights || DEFAULT_RARITY_WEIGHTS)

  const cardChances = revealedTeachers.map((teacher, i) => {
    const slotWeights = weights[i] as unknown as Record<string, number>
    const rarityChance = slotWeights[teacher.rarity] || 0

    const result = collectionResults[i]
    if (!result) return 0

    const variantChance = getVariantProbability(result.variant, isGodpack, config)
    return rarityChance * variantChance
  })

  const combinedCardChance = cardChances.reduce((acc, curr) => acc * curr, 1)
  const wholePackChance = (isGodpack ? godpackChance : (1 - godpackChance)) * combinedCardChance

  return {
    cardChances,
    wholePackChance
  }
}

export function getMassPackCardChances(input: {
  teachers: LootTeacher[]
  collectionResults: MaybeCollectionResult[] | undefined
  isGodpack: boolean
  config: SammelkartenConfig | null
}) {
  const { teachers, collectionResults, isGodpack, config } = input

  const weights = isGodpack
    ? (config?.godpack_weights || DEFAULT_GODPACK_WEIGHTS)
    : (config?.rarity_weights || DEFAULT_RARITY_WEIGHTS)

  return teachers.map((teacher, index) => {
    const slotWeights = weights[index] as unknown as Record<string, number>
    const rarityChance = slotWeights[teacher.rarity] || 0
    const result = collectionResults?.[index]
    if (!result) return 0
    const variantChance = getVariantProbability(result.variant, isGodpack, config)
    return rarityChance * variantChance
  })
}
