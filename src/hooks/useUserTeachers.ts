'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, functions } from '@/lib/firebase'
import { doc, onSnapshot, runTransaction } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { UserTeacher, Profile, CardVariant } from '@/types/database'
import { rebuildRegistryIndex } from '@/constants/cardRegistry'

export const calculateLevel = (count: number): number => {
  if (count <= 1) return 1
  return Math.floor(Math.sqrt(count - 1)) + 1
}

const BERLIN_TIMEZONE = 'Europe/Berlin'
const DEFAULT_DAILY_PACK_ALLOWANCE = 2

const getDailyAllowance = (config: any) => {
  return config?.global_limits?.daily_allowance ?? DEFAULT_DAILY_PACK_ALLOWANCE
}

type BoosterStats = {
  last_reset?: string
  count?: number
  extra_available?: number
  support_extra_available?: number
  extra_boosters_claimed?: boolean
  total_opened?: number
}

type OpenBoosterOptions = {
  packSource?: 'random' | 'custom'
  customPackQueueId?: string | null
  packId?: string
}

const toBerlinParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: BERLIN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const map = new Map(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(map.get('year')),
    month: Number(map.get('month')),
    day: Number(map.get('day')),
    hour: Number(map.get('hour')),
  }
}

const formatDatePart = (value: number) => value.toString().padStart(2, '0')

const addDaysToDayString = (value: string, delta: number): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value

  const baseYear = Number(match[1])
  const baseMonth = Number(match[2])
  const baseDay = Number(match[3])
  const base = Date.UTC(baseYear, baseMonth - 1, baseDay)

  const next = new Date(base + delta * 24 * 60 * 60 * 1000)
  const year = next.getUTCFullYear()
  const month = formatDatePart(next.getUTCMonth() + 1)
  const day = formatDatePart(next.getUTCDate())
  return `${year}-${month}-${day}`
}

const sanitizeBoosterStats = (stats: BoosterStats | null | undefined, today: string) => {
  const count = typeof stats?.count === 'number' && Number.isFinite(stats.count)
    ? Math.max(0, Math.floor(stats.count))
    : 0

  const extraAvailable = typeof stats?.extra_available === 'number' && Number.isFinite(stats.extra_available)
    ? Math.max(0, Math.floor(stats.extra_available))
    : 0

  const totalOpened = typeof stats?.total_opened === 'number' && Number.isFinite(stats.total_opened)
    ? Math.max(0, Math.floor(stats.total_opened))
    : 0

  const lastReset = typeof stats?.last_reset === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stats.last_reset)
    ? stats.last_reset
    : today

  return {
    ...stats,
    last_reset: lastReset,
    count,
    extra_available: extraAvailable,
    total_opened: totalOpened,
  }
}

/**
 * Calculates the current "booster day" identifier.
 * A new day starts at 09:00:00 Europe/Berlin time.
 */
export const getCurrentBoosterDay = (config?: any): string => {
  const resetHour = config?.global_limits?.reset_hour ?? 9
  const now = new Date()
  const berlin = toBerlinParts(now)
  const baseDay = `${berlin.year}-${formatDatePart(berlin.month)}-${formatDatePart(berlin.day)}`

  // If it's before the reset hour in Berlin, it still belongs to the previous booster day.
  if (berlin.hour < resetHour) {
    return addDaysToDayString(baseDay, -1)
  }

  return baseDay
}

export const useUserTeachers = (userId?: string) => {
  const { user: currentUser, profile: currentProfile } = useAuth()
  const activeUserId = userId || currentUser?.uid
  const isOwnProfile = !userId || userId === currentUser?.uid
  const canAccessSammelkartenConfig = currentProfile?.role === 'viewer' || !!currentProfile?.is_approved
  
  const [teachers, setTeachers] = useState<UserTeacher | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!canAccessSammelkartenConfig) return

    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setConfig(data)
        // Dynamisches Registry-Update bei Set-Änderungen (merges with static CARD_SETS)
        rebuildRegistryIndex(data.sets)
      }
    }, (error) => {
      console.error('useUserTeachers: Error listening to sammelkarten settings:', error)
    })
    return () => unsubscribe()
  }, [canAccessSammelkartenConfig])

  useEffect(() => {
    if (!activeUserId) {
      setTeachers(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const docRef = doc(db, 'user_teachers', activeUserId)

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTeachers(docSnap.data() as UserTeacher)
        } else {
          setTeachers({})
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching user teachers:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [activeUserId])

  const collectMassBoosters = useCallback(
    async (count: number, options?: OpenBoosterOptions) => {
      if (!isOwnProfile || !currentUser) throw new Error('Action not allowed')
      if (count <= 0) throw new Error('Keine Packs zum Öffnen angegeben.')

      try {
        const openBoosterFn = httpsCallable<{ 
          count: number, 
          packSource?: 'random' | 'custom', 
          customPackQueueId?: string | null,
          packId?: string
        }, { packs: Array<{ cards: Array<{ id: string, name: string, rarity: string, variant: CardVariant, level: number, count: number }> }> }>(
          functions,
          'openBooster'
        )

        const result = await openBoosterFn({
          count,
          packSource: options?.packSource || undefined,
          customPackQueueId: options?.customPackQueueId || undefined,
          packId: options?.packId || undefined,
        })
        
        // Transform server response to match expected frontend format
        // The frontend expects: Array<Array<{ teacherId, count, level, variant }>>
        return result.data.packs.map(pack => 
          pack.cards.map(card => ({
            teacherId: card.id,
            count: card.count,
            level: card.level,
            variant: card.variant
          }))
        )
      } catch (err: any) {
        console.error('Error collecting mass boosters (Cloud Function):', err)
        throw new Error(err.message || 'Fehler beim Öffnen der Booster im Backend.')
      }
    },
    [currentUser, isOwnProfile]
  )

  const collectBooster = useCallback(
    async (options?: OpenBoosterOptions) => {
      const result = await collectMassBoosters(1, options)
      return result[0]
    },
    [collectMassBoosters]
  )


  const claimExtraBoosters = useCallback(async () => {
    if (!isOwnProfile || !currentUser) throw new Error('Action not allowed')

    const profileRef = doc(db, 'profiles', currentUser.uid)
    
    try {
      await runTransaction(db, async (transaction) => {
        const profileDoc = await transaction.get(profileRef)
        if (!profileDoc.exists()) throw new Error('User profile not found')

        const currentProfileData = profileDoc.data() as Profile
        const today = getCurrentBoosterDay(config)
        
        // Handle null or missing stats
        const currentStats = sanitizeBoosterStats(currentProfileData.booster_stats, today)
        
        if (currentStats.extra_boosters_claimed) {
          throw new Error('Belohnung bereits abgeholt!')
        }

        const newStats = {
          ...currentStats,
          extra_available: (currentStats.extra_available || 0) + 5,
          extra_boosters_claimed: true
        }

        transaction.update(profileRef, {
          booster_stats: newStats
        })
      })
    } catch (err) {
      console.error('Error claiming extra boosters:', err)
      throw err
    }
  }, [currentUser, isOwnProfile, config])

  const purchaseBoosters = useCallback(async (amount: number, itemId: string) => {
    if (!isOwnProfile || !currentUser) throw new Error('Nicht angemeldet oder keine Berechtigung')

    try {
      const purchaseBoostersFn = httpsCallable<{ amount: number, itemId: string }, { success: boolean }>(
        functions, 
        'purchaseBoosters'
      );
      
      const result = await purchaseBoostersFn({ amount, itemId });
      return result.data;
    } catch (err: any) {
      console.error('Fehler beim Kauf von Boostern (Cloud Function):', err)
      throw new Error(err.message || 'Die Transaktion konnte nicht im Backend verarbeitet werden.')
    }
  }, [currentUser, isOwnProfile])

  const getRemainingBoosters = useCallback(() => {
    if (!isOwnProfile || !currentProfile) return 0
    const today = getCurrentBoosterDay(config)
    const stats = currentProfile.booster_stats
    const dailyLimit = getDailyAllowance(config)

    if (!stats) return dailyLimit

    const normalizedStats = sanitizeBoosterStats(stats, today)
    // Combine legacy and new inventory for Standard Boosters
    const extra = (normalizedStats.extra_available || 0) + (stats?.inventory?.teacher_vol1 || 0) + (stats?.inventory?.teachers_v1 || 0)

    if (normalizedStats.last_reset !== today) {
      return dailyLimit + extra
    }

    return Math.max(0, dailyLimit - normalizedStats.count) + extra
  }, [currentProfile, isOwnProfile, config])

  const getRemainingSupportBoosters = useCallback(() => {
    if (!isOwnProfile || !currentProfile) return 0
    const stats = currentProfile.booster_stats
    // Combine legacy and new inventory for Support Boosters
    const legacyVal = stats?.support_extra_available || 0
    const inventoryVal = stats?.inventory?.support_vol_1 || 0
    
    return Math.max(0, Math.floor(legacyVal)) + Math.max(0, Math.floor(inventoryVal))
  }, [currentProfile, isOwnProfile])

  return {
    teachers,
    loading,
    error,
    collectBooster,
    collectMassBoosters,
    getRemainingBoosters,
    getRemainingSupportBoosters,
    claimExtraBoosters,
    purchaseBoosters,
  }
}
