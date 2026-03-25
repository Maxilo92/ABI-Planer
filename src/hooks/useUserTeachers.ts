'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, runTransaction } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { UserTeacher, Profile, CardVariant } from '@/types/database'

export const calculateLevel = (count: number): number => {
  if (count <= 1) return 1
  return Math.floor(Math.sqrt(count - 1)) + 1
}

const BERLIN_TIMEZONE = 'Europe/Berlin'
const DEFAULT_DAILY_PACK_ALLOWANCE = 2

const DEFAULT_VARIANTS_PROBABILITIES = {
  shiny: 0.05,
  holo: 0.15,
  black_shiny_holo: 0.005
}

const getDailyAllowance = (config: any) => {
  return config?.global_limits?.daily_allowance ?? DEFAULT_DAILY_PACK_ALLOWANCE
}

const getRandomVariant = (teacherId: string, isGodpack: boolean, config: any): CardVariant => {
  const rand = Math.random()
  const probs = config?.variant_probabilities || DEFAULT_VARIANTS_PROBABILITIES

  if (isGodpack) {
    // Godpacks have significantly boosted variant rates
    if (rand < 0.1) return 'black_shiny_holo'
    if (rand < 0.4) return 'shiny'
    if (rand < 0.8) return 'holo'
    return 'normal'
  }
  
  if (rand < (probs.black_shiny_holo ?? 0.005)) return 'black_shiny_holo'
  if (rand < (probs.shiny ?? 0.05)) return 'shiny'
  if (rand < (probs.holo ?? 0.15)) return 'holo'
  return 'normal'
}

type BoosterStats = {
  last_reset?: string
  count?: number
  extra_available?: number
  extra_boosters_claimed?: boolean
  total_opened?: number
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

const fromDayStringToUtcMs = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)

  return Number.isNaN(timestamp) ? null : timestamp
}

const addDaysToDayString = (value: string, delta: number): string => {
  const base = fromDayStringToUtcMs(value)
  if (base === null) return value

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

const calculateCarryoverExtras = (lastReset: string, today: string, dailyAllowance: number): number => {
  const daysMissed = daysBetween(lastReset, today)
  if (daysMissed <= 0) return 0
  // Maximal 1 Tag nachholen (z.B. 2 Packs), egal wie viele Tage verpasst wurden
  return Math.min(daysMissed, 1) * dailyAllowance
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

const daysBetween = (from: string, to: string): number => {
  const fromMs = fromDayStringToUtcMs(from)
  const toMs = fromDayStringToUtcMs(to)
  if (fromMs === null || toMs === null) return 0

  const msInDay = 24 * 60 * 60 * 1000
  const diff = toMs - fromMs
  return Math.max(0, Math.floor(diff / msInDay))
}

export const useUserTeachers = (userId?: string) => {
  const { user: currentUser, profile: currentProfile } = useAuth()
  const activeUserId = userId || currentUser?.uid
  const isOwnProfile = !userId || userId === currentUser?.uid
  
  const [teachers, setTeachers] = useState<UserTeacher | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data())
      }
    })
    return () => unsubscribe()
  }, [])

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
    async (packs: Array<{ teacherIds: string[], isGodpack: boolean }>) => {
      if (!isOwnProfile || !currentUser) throw new Error('Action not allowed')
      if (packs.length === 0) throw new Error('Keine Packs zum Öffnen angegeben.')

      packs.forEach(p => {
        if (p.teacherIds.length !== 3) {
          throw new Error('Jedes Kartenpack muss genau 3 Karten enthalten.')
        }
      })

      const userTeachersRef = doc(db, 'user_teachers', currentUser.uid)
      const profileRef = doc(db, 'profiles', currentUser.uid)
      const dailyPackAllowance = getDailyAllowance(config)

      try {
        const results = await runTransaction(db, async (transaction) => {
          const profileDoc = await transaction.get(profileRef)
          if (!profileDoc.exists()) throw new Error('User profile not found')

          const today = getCurrentBoosterDay(config)
          const currentProfileData = profileDoc.data() as Profile
          const currentStats = sanitizeBoosterStats(currentProfileData.booster_stats, today)

          let dailyCount = currentStats.count
          let extraAvailable = currentStats.extra_available || 0

          if (currentStats.last_reset !== today) {
            extraAvailable += calculateCarryoverExtras(currentStats.last_reset, today, dailyPackAllowance)
            dailyCount = 0
          }

          // Check if we have enough allowance for ALL packs
          const packsToOpen = packs.length
          let newDailyCount = dailyCount
          let newExtraAvailable = extraAvailable

          for (let i = 0; i < packsToOpen; i++) {
            if (newDailyCount < dailyPackAllowance) {
              newDailyCount += 1
            } else if (newExtraAvailable > 0) {
              newExtraAvailable -= 1
            } else {
              if (i === 0) {
                throw new Error(`Limit erreicht! Du kannst keine Packs mehr öffnen.`)
              } else {
                // If they tried to open 10 but only had 4 left, we could theoretically 
                // stop here, but the user wants to open 10 specifically. 
                // So let's just fail if they don't have enough.
                throw new Error(`Nicht genügend Booster verfügbar für ${packsToOpen} Packs (noch ${packsToOpen - i} nötig).`)
              }
            }
          }

          const teachersDoc = await transaction.get(userTeachersRef)
          const currentData = teachersDoc.exists() ? (teachersDoc.data() as UserTeacher) : {}

          const tempData = { ...currentData }
          const allPacksResults = packs.map(pack => {
            return pack.teacherIds.map(teacherId => {
              const variant = getRandomVariant(teacherId, pack.isGodpack, config)
              const teacherData = tempData[teacherId] || { count: 0, level: 1, variants: {} }
              const tCount = teacherData.count + 1
              const tLevel = calculateLevel(tCount)

              const variants = teacherData.variants || {}
              const vCount = (variants[variant] || 0) + 1

              tempData[teacherId] = {
                count: tCount,
                level: tLevel,
                variants: {
                  ...variants,
                  [variant]: vCount
                }
              }

              return { teacherId, count: tCount, level: tLevel, variant }
            })
          })

          const allTeacherIds = packs.flatMap(p => p.teacherIds)
          const updates = allTeacherIds.reduce((acc, id) => {
            acc[id] = tempData[id]
            return acc
          }, {} as any)

          transaction.set(userTeachersRef, updates, { merge: true })
          transaction.update(profileRef, {
            booster_stats: {
              ...currentStats,
              last_reset: today,
              count: newDailyCount,
              extra_available: newExtraAvailable,
              total_opened: (currentStats.total_opened || 0) + packsToOpen
            }
          })

          return allPacksResults
        })

        return results
      } catch (err) {
        console.error('Error collecting mass boosters:', err)
        throw err
      }
    },
    [currentUser, isOwnProfile, config]
  )

  const collectBooster = useCallback(
    async (teacherIds: string[], options?: { isGodpack?: boolean }) => {
      const result = await collectMassBoosters([{ teacherIds, isGodpack: !!options?.isGodpack }])
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

  const getRemainingBoosters = useCallback(() => {
    if (!isOwnProfile || !currentProfile) return 0
    const today = getCurrentBoosterDay(config)
    const stats = currentProfile.booster_stats
    const dailyLimit = getDailyAllowance(config)
    
    if (!stats) return dailyLimit
    
    const normalizedStats = sanitizeBoosterStats(stats, today)
    let extra = normalizedStats.extra_available || 0

    if (normalizedStats.last_reset !== today) {
      extra += calculateCarryoverExtras(normalizedStats.last_reset, today, dailyLimit)
    }

    if (normalizedStats.last_reset !== today) {
      return dailyLimit + extra
    }
    
    return Math.max(0, dailyLimit - normalizedStats.count) + extra
  }, [currentProfile, isOwnProfile, config])

  return {
    teachers,
    loading,
    error,
    collectBooster,
    collectMassBoosters,
    getRemainingBoosters,
    claimExtraBoosters,
  }
}
