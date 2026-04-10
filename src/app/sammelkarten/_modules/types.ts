import { CardVariant, LootTeacher } from '@/types/database'

export type PackSource = 'random' | 'custom'

export type PackSelection = {
  packSource: PackSource
  customPackQueueId?: string | null
  packId?: string
}

export type AvailablePack = {
  id: string
  name: string
  count: number
  source: PackSource
  description?: string | null
  queueId?: string | null
  packId?: string
  isHighlighted?: boolean
}

export type CollectionResult = {
  isNew: boolean
  isLevelUp: boolean
  oldLevel?: number
  newLevel: number
  count: number
  variant: CardVariant
}

export type MaybeCollectionResult = CollectionResult | null

export type MassPackReveal = {
  teachers: LootTeacher[]
  isGodpack: boolean
}

export type UserTeacherState = {
  count: number
  level: number
  variants?: Record<string, number>
}

export type UserTeacherMap = Record<string, UserTeacherState>
