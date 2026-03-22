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

/**
 * Calculates the current "booster day" identifier.
 * A new day starts at 09:00:00 Europe/Berlin time.
 */
export const getCurrentBoosterDay = (): string => {
  const now = new Date()
  
  // Convert current time to Europe/Berlin
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(now)
  const map = new Map(parts.map(p => [p.type, p.value]))
  
  const year = parseInt(map.get('year')!)
  const month = parseInt(map.get('month')!) - 1
  const day = parseInt(map.get('day')!)
  const hour = parseInt(map.get('hour')!)
  
  // If it's before 9:00 AM in Berlin, it's still the "previous" booster day
  const boosterDate = new Date(year, month, day)
  if (hour < 9) {
    boosterDate.setDate(boosterDate.getDate() - 1)
  }
  
  return boosterDate.toISOString().split('T')[0]
}

export const useUserTeachers = () => {
  const { user, profile } = useAuth()
  const [teachers, setTeachers] = useState<UserTeacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setTeachers(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const docRef = doc(db, 'user_teachers', user.uid)

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
  }, [user])

  const collectBooster = useCallback(
    async (teacherIds: string[]) => {
      if (!user) throw new Error('User must be authenticated to collect teachers')
      if (teacherIds.length !== 3) {
        throw new Error('Ein Kartenpack muss genau 3 Karten enthalten.')
      }

      const userTeachersRef = doc(db, 'user_teachers', user.uid)
      const profileRef = doc(db, 'profiles', user.uid)
      
      try {
        const results = await runTransaction(db, async (transaction) => {
          const profileDoc = await transaction.get(profileRef)
          if (!profileDoc.exists()) throw new Error('User profile not found')
          
          const today = getCurrentBoosterDay()
          const currentProfile = profileDoc.data() as Profile
          const currentStats = currentProfile.booster_stats || { last_reset: today, count: 0 }
          
          let dailyCount = currentStats.count
          let extraAvailable = currentStats.extra_available || 0
          
          if (currentStats.last_reset !== today) {
            dailyCount = 0
          }

          if (dailyCount < 2) {
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
            const teacherData = tempData[teacherId] || { count: 0, level: 1 }
            const tCount = teacherData.count + 1
            const tLevel = calculateLevel(tCount)
            
            tempData[teacherId] = {
              count: tCount,
              level: tLevel
            }
            
            return { teacherId, count: tCount, level: tLevel }
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
    [user]
  )

  const collectTeacher = useCallback(
    async (teacherId: string) => {
      if (!user) throw new Error('User must be authenticated to collect teachers')

      const userTeachersRef = doc(db, 'user_teachers', user.uid)
      const profileRef = doc(db, 'profiles', user.uid)
      
      try {
        const result = await runTransaction(db, async (transaction) => {
          const profileDoc = await transaction.get(profileRef)
          if (!profileDoc.exists()) throw new Error('User profile not found')

          const today = getCurrentBoosterDay()
          const currentProfile = profileDoc.data() as Profile
          const currentStats = currentProfile.booster_stats || { last_reset: today, count: 0 }
          
          let dailyCount = currentStats.count
          let extraAvailable = currentStats.extra_available || 0
          
          if (currentStats.last_reset !== today) {
            dailyCount = 0
          }

          if (dailyCount < 2) {
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
              extra_available: extraAvailable
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
    [user]
  )

  const claimExtraBoosters = useCallback(async () => {
    if (!user) throw new Error('User must be authenticated to claim boosters')

    const profileRef = doc(db, 'profiles', user.uid)
    
    try {
      await runTransaction(db, async (transaction) => {
        const profileDoc = await transaction.get(profileRef)
        if (!profileDoc.exists()) throw new Error('User profile not found')

        const currentProfile = profileDoc.data() as Profile
        const today = getCurrentBoosterDay()
        
        // Handle null or missing stats
        const currentStats = currentProfile.booster_stats || { last_reset: today, count: 0 }
        
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
  }, [user])

  const getRemainingBoosters = useCallback(() => {
    if (!profile) return 0
    const today = getCurrentBoosterDay()
    const stats = profile.booster_stats
    const dailyLimit = 2
    
    if (!stats) return dailyLimit
    
    const extra = stats.extra_available || 0
    if (stats.last_reset !== today) return dailyLimit + extra
    
    return Math.max(0, dailyLimit - stats.count) + extra
  }, [profile])

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
