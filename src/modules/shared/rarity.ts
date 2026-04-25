import { TeacherRarity } from '@/types/database'

const DEFAULT_RARITY: TeacherRarity = 'common'

const RARITY_TEXT_COLOR_MAP: Record<TeacherRarity, string> = {
  common: 'text-slate-500',
  rare: 'text-emerald-500',
  epic: 'text-purple-500',
  mythic: 'text-red-500',
  legendary: 'text-amber-500',
  iconic: 'text-indigo-950 dark:text-indigo-400 font-black',
}

const RARITY_LABEL_MAP: Record<TeacherRarity, string> = {
  common: 'Gewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  mythic: 'Mythisch',
  legendary: 'Legendär',
  iconic: 'IKONISCH',
}

const RARITY_BADGE_MAP: Record<TeacherRarity, string> = {
  common: 'bg-slate-500',
  rare: 'bg-emerald-500',
  epic: 'bg-purple-500',
  mythic: 'bg-red-500',
  legendary: 'bg-amber-500',
  iconic: 'bg-neutral-950 border border-amber-500/50 text-amber-500',
}

const RARITY_HEX_MAP: Record<TeacherRarity, string> = {
  common: '#cbd5e1',
  rare: '#059669',
  epic: '#7c3aed',
  mythic: '#dc2626',
  legendary: '#fbbf24',
  iconic: '#1e293b',
}

function asTeacherRarity(rarity: string | TeacherRarity): TeacherRarity {
  if (rarity in RARITY_TEXT_COLOR_MAP) {
    return rarity as TeacherRarity
  }
  return DEFAULT_RARITY
}

export function getRarityColor(rarity: TeacherRarity): string {
  return RARITY_TEXT_COLOR_MAP[asTeacherRarity(rarity)]
}

export function getRarityLabel(rarity: TeacherRarity): string {
  return RARITY_LABEL_MAP[asTeacherRarity(rarity)]
}

export function getRarityBadgeClass(rarity: string | TeacherRarity): string {
  return RARITY_BADGE_MAP[asTeacherRarity(rarity)]
}

export function getRarityHexColor(rarity: string | TeacherRarity): string {
  return RARITY_HEX_MAP[asTeacherRarity(rarity)]
}
