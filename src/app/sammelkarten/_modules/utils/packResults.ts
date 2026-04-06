import { LootTeacher } from '@/types/database'
import { DEFAULT_TEACHERS } from '../constants'
import { CollectionResult, MassPackReveal, MaybeCollectionResult, UserTeacherMap } from '../types'

type BoosterResult = {
  teacherId: string
  variant: 'normal' | 'holo' | 'shiny' | 'black_shiny_holo'
  count: number
  level: number
}

export function mapResultsToTeachers(results: BoosterResult[], teachers: LootTeacher[]): LootTeacher[] {
  return results.map((result) => {
    return teachers.find((t) => (t.id || t.name) === result.teacherId) || DEFAULT_TEACHERS[0]
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
    const isNew = !initialTeachers[result.teacherId]
    const oldLevel = initialTeachers[result.teacherId]?.level || 1
    const isLevelUp = !isNew && result.level > oldLevel

    initialTeachers[result.teacherId] = {
      count: result.count,
      level: result.level,
      variants: {
        ...initialTeachers[result.teacherId]?.variants,
        [result.variant]: (initialTeachers[result.teacherId]?.variants?.[result.variant] || 0) + 1
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
      const isNew = !initialTeachers[result.teacherId]
      const oldLevel = initialTeachers[result.teacherId]?.level || 1
      const isLevelUp = !isNew && result.level > oldLevel

      initialTeachers[result.teacherId] = {
        count: result.count,
        level: result.level,
        variants: {
          ...initialTeachers[result.teacherId]?.variants,
          [result.variant]: (initialTeachers[result.teacherId]?.variants?.[result.variant] || 0) + 1
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
