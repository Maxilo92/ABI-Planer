import { TeacherCatalogEntry } from '@/lib/cardCatalog'
import { CardData, CardVariant } from '@/types/cards'
import { getRarityHexColor } from '@/modules/shared/rarity'

type UserCardState = {
  variants?: Record<string, number>
  count?: number
}

type CatalogIndexSource = TeacherCatalogEntry[] | Map<string, number> | number

export function getBestVariant(variants: Record<string, number> | undefined): CardVariant {
  if (!variants) return 'normal'
  if (variants.black_shiny_holo) return 'black_shiny_holo'
  if (variants.selten) return 'selten'
  if (variants.shiny) return 'shiny'
  if (variants.holo) return 'holo'
  return 'normal'
}

export function calculateTeacherLevel(count: number): number {
  if (count <= 1) return 1
  return Math.floor(Math.sqrt(count - 1)) + 1
}

export function resolveCatalogIndex(
  teacher: TeacherCatalogEntry,
  source: CatalogIndexSource | undefined,
): number {
  if (typeof source === 'number') return source
  if (source instanceof Map) return source.get(teacher.fullId) ?? -1
  if (Array.isArray(source)) {
    return source.findIndex((entry) => entry.fullId === teacher.fullId)
  }
  return -1
}

export function mapTeacherCatalogToCardData(
  teacher: TeacherCatalogEntry,
  userData?: UserCardState,
  indexSource?: CatalogIndexSource,
  forcedVariant?: CardVariant,
): CardData {
  const level = calculateTeacherLevel(userData?.count || 0)
  const globalIndex = resolveCatalogIndex(teacher, indexSource)

  return {
    id: teacher.fullId,
    setId: teacher.setId,
    fullId: teacher.fullId,
    name: teacher.name,
    rarity: teacher.rarity,
    type: (teacher.type as any) || 'teacher',
    variant: forcedVariant || getBestVariant(userData?.variants),
    color: getRarityHexColor(teacher.rarity),
    cardNumber: globalIndex >= 0 ? (globalIndex + 1).toString().padStart(3, '0') : '???',
    description: teacher.description,
    hp: teacher.hp,
    attacks: teacher.attacks,
    obtainMessage: teacher.obtainMessage,
    level,
  }
}
