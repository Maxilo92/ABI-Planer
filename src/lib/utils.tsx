import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { getRarityColor, getRarityLabel } from '@/modules/shared/rarity'
import { toDate } from '@/modules/shared/date'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { getRarityColor, getRarityLabel, toDate }

/**
 * Returns the online status and a formatted label for the user.
 * Implements a 5-minute stale session fallback.
 */
export function getOnlineStatus(isOnline: boolean, lastOnline: any): { isOnline: boolean; label: string } {
  const lastOnlineDate = toDate(lastOnline)
  const now = new Date()
  const diffInMinutes = (now.getTime() - lastOnlineDate.getTime()) / (1000 * 60)
  
  // Stale session fallback: if isOnline is true but lastOnline is more than 5 minutes old
  const effectiveOnline = isOnline && diffInMinutes < 5

  if (effectiveOnline) {
    return { isOnline: true, label: 'Online' }
  }

  const relativeTime = formatDistanceToNow(lastOnlineDate, { addSuffix: true, locale: de })
  return { isOnline: false, label: `Zuletzt online: ${relativeTime}` }
}

/**
 * Normalizes special characters (ä, ö, ü, ß) to their non-special counterparts.
 * This can be used for searching or when special characters are not supported.
 */
export function normalizeChars(str: string): string {
  if (typeof str !== 'string') return ''
  const charMap: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
    'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue'
  }
  return str.replace(/[äöüßÄÖÜ]/g, match => charMap[match])
}

/**
 * Restores common ASCII umlaut transliterations for user-facing German text.
 * Keeps technical IDs/slugs out of scope by only applying this where explicitly used.
 */
export function restoreGermanUmlauts(str: string): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/AE/g, 'Ä')
    .replace(/OE/g, 'Ö')
    .replace(/UE/g, 'Ü')
    .replace(/Ae/g, 'Ä')
    .replace(/Oe/g, 'Ö')
    .replace(/Ue/g, 'Ü')
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü')
}
