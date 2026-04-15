import { LootTeacher } from '@/types/database'
import { CollectionResult, MassPackReveal, MaybeCollectionResult, UserTeacherMap } from '../types'
import { getCard } from '@/constants/cardRegistry'

type BoosterResult = {
  teacherId: string
  variant: 'normal' | 'holo' | 'shiny' | 'black_shiny_holo'
  count: number
  level: number
}

const CANONICAL_TEACHER_SET_ID = 'teacher_vol1'
const LEGACY_TEACHER_SET_ID = 'teachers_v1'

function stripTeacherPrefix(teacherId: string): string {
  if (!teacherId) return teacherId
  if (teacherId.startsWith(`${CANONICAL_TEACHER_SET_ID}:`)) return teacherId.slice(`${CANONICAL_TEACHER_SET_ID}:`.length)
  if (teacherId.startsWith(`${LEGACY_TEACHER_SET_ID}:`)) return teacherId.slice(`${LEGACY_TEACHER_SET_ID}:`.length)
  return teacherId
}

function getExistingUserEntry(userTeachers: UserTeacherMap, teacherId: string) {
  const baseId = stripTeacherPrefix(teacherId)
  return (
    userTeachers[teacherId] ||
    userTeachers[`${CANONICAL_TEACHER_SET_ID}:${baseId}`] ||
    userTeachers[`${LEGACY_TEACHER_SET_ID}:${baseId}`] ||
    userTeachers[baseId]
  )
}

function resolveTeacherMeta(resultTeacherId: string, teachers: LootTeacher[]): LootTeacher {
  const baseId = stripTeacherPrefix(resultTeacherId)

  const resolved = getCard(resultTeacherId) || getCard(baseId)
  if (resolved) {
    const teacherMeta = resolved.type === 'teacher'
      ? {
          hp: resolved.hp,
          attacks: resolved.attacks,
        }
      : {}

    return {
      id: resolved.id,
      name: resolved.name,
      rarity: resolved.rarity as any,
      type: 'teacher',
      hp: (resolved as any).hp || 100,
      attacks: (resolved as any).attacks || [],
      description: resolved.description,
    } as LootTeacher
  }

  return (
    teachers.find((t) => {
      const id = t.id || t.name
      return id === resultTeacherId || id === baseId
    }) ||
    ({ id: baseId, name: 'Unbekannte Karte', rarity: 'common', type: 'teacher', hp: 100, attacks: [] } as LootTeacher)
  )
}

export function mapResultsToTeachers(results: BoosterResult[], teachers: LootTeacher[]): LootTeacher[] {
  return results.map((result) => {
    return resolveTeacherMeta(result.teacherId, teachers)
  })
}

export function isGodpackResult(results: BoosterResult[]) {
  return results.every((result) => result.variant !== 'normal')
}

export function processCollectionResults(
  results: BoosterResult[],
  userTeachers: UserTeacherMap
): CollectionResult[] {
  const initialTeachers = { ...userTeachers }

  return results.map((result) => {
    const existingEntry = getExistingUserEntry(initialTeachers, result.teacherId)
    const isNew = !existingEntry
    const oldLevel = existingEntry?.level || 1
    const isLevelUp = !isNew && result.level > oldLevel

    initialTeachers[result.teacherId] = {
      count: result.count,
      level: result.level,
      variants: {
        ...existingEntry?.variants,
        [result.variant]: (existingEntry?.variants?.[result.variant] || 0) + 1
      }
    }

    return {
      isNew,
      isLevelUp,
      oldLevel,
      newLevel: result.level,
      count: result.count,
      variant: result.variant
    }
  })
}

export function processMassCollectionResults(
  allResults: BoosterResult[][],
  userTeachers: UserTeacherMap
): MaybeCollectionResult[][] {
  const initialTeachers = { ...userTeachers }

  return allResults.map((packResults) => {
    return packResults.map((result) => {
      const existingEntry = getExistingUserEntry(initialTeachers, result.teacherId)
      const isNew = !existingEntry
      const oldLevel = existingEntry?.level || 1
      const isLevelUp = !isNew && result.level > oldLevel

      initialTeachers[result.teacherId] = {
        count: result.count,
        level: result.level,
        variants: {
          ...existingEntry?.variants,
          [result.variant]: (existingEntry?.variants?.[result.variant] || 0) + 1
        }
      }

      return {
        isNew,
        isLevelUp,
        oldLevel,
        newLevel: result.level,
        count: result.count,
        variant: result.variant
      }
    })
  })
}

export function buildMassPackReveal(allResults: BoosterResult[][], teachers: LootTeacher[]): MassPackReveal[] {
  return allResults.map((packResults) => ({
    teachers: mapResultsToTeachers(packResults, teachers),
    isGodpack: isGodpackResult(packResults)
  }))
}
