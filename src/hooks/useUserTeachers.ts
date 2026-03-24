'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, runTransaction } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { UserTeacher, Profile } from '@/types/database'

export const calculateLevel = (count: number): number => {
  if (count <= 1) return 1
  return Math.floor(Math.sqrt(count - 1)) + 1
}

type BoosterStats = {
  last_reset?: string
  count?: number
  extra_available?: number
  extra_boosters_claimed?: boolean
  total_opened?: number
}

const BERLIN_TIMEZONE = 'Europe/Berlin'
const DAILY_PACK_ALLOWANCE = 2

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
  // Maximal 1 Tag nachholen (2 Packs), egal wie viele Tage verpasst wurden
  return Math.min(daysMissed, 1) * dailyAllowance
}

/**
 * Calculates the current "booster day" identifier.
 * A new day starts at 09:00:00 Europe/Berlin time.
 */
export const getCurrentBoosterDay = (): string => {
  const now = new Date()
  const berlin = toBerlinParts(now)
  const baseDay = `${berlin.year}-${formatDatePart(berlin.month)}-${formatDatePart(berlin.day)}`

  // If it's before 9:00 AM in Berlin, it still belongs to the previous booster day.
  if (berlin.hour < 9) {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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

  const collectBooster = useCallback(
    async (teacherIds: string[]) => {
      if (!isOwnProfile || !currentUser) throw new Error('Action not allowed')
      if (teacherIds.length !== 3) {
        throw new Error('Ein Kartenpack muss genau 3 Karten enthalten.')
      }

      const userTeachersRef = doc(db, 'user_teachers', currentUser.uid)
      const profileRef = doc(db, 'profiles', currentUser.uid)
      const dailyPackAllowance = DAILY_PACK_ALLOWANCE
      
      try {
        const results = await runTransaction(db, async (transaction) => {
          const profileDoc = await transaction.get(profileRef)
          if (!profileDoc.exists()) throw new Error('User profile not found')
          
          const today = getCurrentBoosterDay()
          const currentProfileData = profileDoc.data() as Profile
          const currentStats = sanitizeBoosterStats(currentProfileData.booster_stats, today)
          
          let dailyCount = currentStats.count
          let extraAvailable = currentStats.extra_available || 0
          
          if (currentStats.last_reset !== today) {
            extraAvailable += calculateCarryoverExtras(currentStats.last_reset, today, dailyPackAllowance)
            dailyCount = 0
          }

          if (dailyCount < dailyPackAllowance) {
            dailyCount += 1
          } else if (extraAvailable > 0) {
            extraAvailable -= 1
          } else {
            throw new Error('Tägliches Limit von 2 Kartenpacks erreicht!')
          }

          const teachersDoc = await transaction.get(userTeachersRef)
          const currentData = teachersDoc.exists() ? (teachersDoc.data() as UserTeacher) : {}
          
          const tempData = { ...currentData }
          const packResults = teacherIds.map(teacherId => {
            const variant = getRandomVariant(teacherId, isGodpack)
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

          const updates = teacherIds.reduce((acc, id) => {
            acc[id] = tempData[id]
            return acc
          }, {} as any)

          transaction.set(userTeachersRef, updates, { merge: true })
          transaction.update(profileRef, {
            booster_stats: {
              ...currentStats,
              last_reset: today,
              count: dailyCount,
              extra_available: extraAvailable,
              total_opened: (currentStats.total_opened || 0) + 1
            }
          })

          return packResults
        })
        
        return results
      } catch (err) {
        console.error('Error collecting booster pack:', err)
        throw err
      }
    },
    [currentUser, isOwnProfile]
  )

  const collectBooster = useCallback(
    async (teacherIds: string[], options?: { isGodpack?: boolean }) => {
      if (!isOwnProfile || !currentUser) throw new Error('Action not allowed')

      const userTeachersRef = doc(db, 'user_teachers', currentUser.uid)
      const profileRef = doc(db, 'profiles', currentUser.uid)
      const dailyPackAllowance = DAILY_PACK_ALLOWANCE
      const isGodpack = !!options?.isGodpack
      
      try {
        const result = await runTransaction(db, async (transaction) => {
          const profileDoc = await transaction.get(profileRef)
          if (!profileDoc.exists()) throw new Error('User profile not found')

          const today = getCurrentBoosterDay()
          const currentProfileData = profileDoc.data() as Profile
          const currentStats = sanitizeBoosterStats(currentProfileData.booster_stats, today)
          
          let dailyCount = currentStats.count
          let extraAvailable = currentStats.extra_available || 0
          
          if (currentStats.last_reset !== today) {
            extraAvailable += calculateCarryoverExtras(currentStats.last_reset, today, dailyPackAllowance)
            dailyCount = 0
          }

          if (dailyCount < dailyPackAllowance) {
            dailyCount += 1
          } else if (extraAvailable > 0) {
            extraAvailable -= 1
          } else {
            throw new Error('Tägliches Limit von 2 Kartenpacks erreicht!')
          }

          const teachersDoc = await transaction.get(userTeachersRef)
          const currentData = teachersDoc.exists() ? (teachersDoc.data() as UserTeacher) : {}
          
          const teacherData = currentData[teacherId] || { count: 0, level: 1 }
          const tCount = teacherData.count + 1
          const tLevel = calculateLevel(tCount)

          transaction.set(userTeachersRef, {
            [teacherId]: {
              count: tCount,
              level: tLevel,
            }
          }, { merge: true })

          transaction.update(profileRef, {
            booster_stats: {
              ...currentStats,
              last_reset: today,
              count: dailyCount,
              extra_available: extraAvailable,
              total_opened: (currentStats.total_opened || 0) + 1
            }
          })

          return { count: tCount, level: tLevel }
        })
        
        return result
      } catch (err) {
        console.error('Error collecting teacher:', err)
        throw err
      }
    },
    [currentUser, isOwnProfile]
  )

  const claimExtraBoosters = useCallback(async () => {
    if (!isOwnProfile || !currentUser) throw new Error('Action not allowed')

    const profileRef = doc(db, 'profiles', currentUser.uid)
    
    try {
      await runTransaction(db, async (transaction) => {
        const profileDoc = await transaction.get(profileRef)
        if (!profileDoc.exists()) throw new Error('User profile not found')

        const currentProfileData = profileDoc.data() as Profile
        const today = getCurrentBoosterDay()
        
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
  }, [currentUser, isOwnProfile])

  const getRemainingBoosters = useCallback(() => {
    if (!isOwnProfile || !currentProfile) return 0
    const today = getCurrentBoosterDay()
    const stats = currentProfile.booster_stats
    const dailyLimit = DAILY_PACK_ALLOWANCE
    
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
  }, [currentProfile, isOwnProfile])

  return {
    teachers,
    loading,
    error,
    collectTeacher,
    collectBooster,
    getRemainingBoosters,
    claimExtraBoosters,
  }
}
