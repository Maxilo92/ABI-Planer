'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc, getDoc, updateDoc, writeBatch, runTransaction } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { UserTeacher, Profile } from '@/types/database'

export const calculateLevel = (count: number): number => {
  if (count <= 1) return 1
  // Level 1: 1 card
  // Level 2: 2 cards
  // Level 3: 4 cards
  // Level 4: 9 cards
  // Level 5: 16 cards
  return Math.floor(Math.sqrt(count - 1)) + 1
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
          
          const today = new Date().toISOString().split('T')[0]
          const currentProfile = profileDoc.data() as Profile
          const currentStats = currentProfile.booster_stats || { last_reset: today, count: 0 }
          
          let newCount = currentStats.count
          if (currentStats.last_reset !== today) {
            newCount = 1
          } else {
            newCount += 1
          }

          if (newCount > 2) {
            throw new Error('Tägliches Limit von 2 Kartenpacks erreicht!')
          }

          const teachersDoc = await transaction.get(userTeachersRef)
          const currentData = teachersDoc.exists() ? (teachersDoc.data() as UserTeacher) : {}
          
          // Track updates locally to handle duplicates in the pack
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

          // Prepare updates object
          const updates = teacherIds.reduce((acc, id) => {
            acc[id] = tempData[id]
            return acc
          }, {} as any)

          // Execute updates in transaction
          transaction.set(userTeachersRef, updates, { merge: true })
          transaction.update(profileRef, {
            booster_stats: {
              last_reset: today,
              count: newCount
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

          const today = new Date().toISOString().split('T')[0]
          const currentProfile = profileDoc.data() as Profile
          const currentStats = currentProfile.booster_stats || { last_reset: today, count: 0 }
          
          let newCount = currentStats.count
          if (currentStats.last_reset !== today) {
            newCount = 1
          } else {
            newCount += 1
          }

          if (newCount > 2) {
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
              last_reset: today,
              count: newCount
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

  const getRemainingBoosters = useCallback(() => {
    if (!profile) return 0
    const today = new Date().toISOString().split('T')[0]
    const stats = profile.booster_stats
    if (!stats || stats.last_reset !== today) return 2
    return Math.max(0, 2 - stats.count)
  }, [profile])

  return {
    teachers,
    loading,
    error,
    collectTeacher,
    collectBooster,
    getRemainingBoosters,
  }
}


  const getRemainingBoosters = useCallback(() => {
    if (!profile) return 0
    const today = new Date().toISOString().split('T')[0]
    const stats = profile.booster_stats
    if (!stats || stats.last_reset !== today) return 2
    return Math.max(0, 2 - stats.count)
  }, [profile])

  return {
    teachers,
    loading,
    error,
    collectTeacher,
    collectBooster,
    getRemainingBoosters,
  }
}
