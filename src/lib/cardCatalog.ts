import { LootTeacher, UserTeacher } from '@/types/database'

const CANONICAL_TEACHER_SET_ID = 'teacher_vol1'
const LEGACY_TEACHER_SET_ID = 'teachers_v1'

type RawSet = {
  name?: string
  cards?: LootTeacher[]
}

export interface TeacherCatalogEntry extends LootTeacher {
  baseId: string
  fullId: string
  setId: string
  setName: string
}

function normalizeCardEntry(
  card: LootTeacher,
  setId: string,
  setName: string,
  forceLegacyId = false,
): TeacherCatalogEntry | null {
  const baseId = String(card.id || card.name || '').trim()
  if (!baseId) return null

  return {
    ...card,
    id: forceLegacyId ? baseId : (card.id || baseId),
    baseId,
    setId,
    setName,
    // Always use the prefixed ID for fullId to ensure consistency across the system
    fullId: `${setId}:${baseId}`,
  }
}

export function buildTeacherCatalogFromSettings(data: any): TeacherCatalogEntry[] {
  const result: TeacherCatalogEntry[] = []

  const dynamicSets = data?.sets as Record<string, RawSet> | undefined
  if (dynamicSets && typeof dynamicSets === 'object') {
    Object.entries(dynamicSets).forEach(([setId, setValue]) => {
      const cards = Array.isArray(setValue?.cards) ? setValue.cards : []
      if (cards.length === 0) return

      const setName = typeof setValue?.name === 'string' && setValue.name.trim().length > 0
        ? setValue.name
        : setId

      cards.forEach((card) => {
        const entry = normalizeCardEntry(card, setId, setName)
        if (entry) result.push(entry)
      })
    })
  }

  const legacyCards = Array.isArray(data?.loot_teachers) ? data.loot_teachers : []
  legacyCards.forEach((card: LootTeacher) => {
    const entry = normalizeCardEntry(card, CANONICAL_TEACHER_SET_ID, 'Lehrer Set v1', true)
    if (entry) result.push(entry)
  })

  const deduped = new Map<string, TeacherCatalogEntry>()
  result.forEach((entry) => {
    if (!deduped.has(entry.fullId)) {
      deduped.set(entry.fullId, entry)
    }
  })

  return Array.from(deduped.values())
}

export function findUserTeacherEntry(
  userTeachers: UserTeacher | null | undefined,
  entry: TeacherCatalogEntry,
) {
  if (!userTeachers) return undefined

  const candidates = [
    entry.fullId,
    `${CANONICAL_TEACHER_SET_ID}:${entry.baseId}`,
    `${LEGACY_TEACHER_SET_ID}:${entry.baseId}`,
    entry.baseId,
    entry.name,
  ]

  for (const key of candidates) {
    if (key && userTeachers[key]) {
      return userTeachers[key]
    }
  }

  return undefined
}
