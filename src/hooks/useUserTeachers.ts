'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { UserTeacher, Profile } from '@/types/database'

export const calculateLevel = (count: number): number => {
  if (count <= 0) return 1
  return Math.floor(Math.sqrt(count)) + 1
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

  const collectTeacher = useCallback(
    async (teacherId: string) => {
      if (!user) throw new Error('User must be authenticated to collect teachers')

      const userTeachersRef = doc(db, 'user_teachers', user.uid)
      const profileRef = doc(db, 'profiles', user.uid)
      
      try {
        const today = new Date().toISOString().split('T')[0]
        const currentStats = profile?.booster_stats || { last_reset: today, count: 0 }
        
        let newCount = currentStats.count
        if (currentStats.last_reset !== today) {
          newCount = 1
        } else {
          newCount += 1
        }

        if (newCount > 3) {
          throw new Error('Tägliches Limit von 3 Boostern erreicht!')
        }

        const docSnap = await getDoc(userTeachersRef)
        const currentData = docSnap.exists() ? (docSnap.data() as UserTeacher) : {}
        
        const teacherData = currentData[teacherId] || { count: 0, level: 1 }
        const tCount = teacherData.count + 1
        const tLevel = calculateLevel(tCount)

        // Update profile stats and teachers in parallel/transactional
        await setDoc(userTeachersRef, {
          [teacherId]: {
            count: tCount,
            level: tLevel,
          }
        }, { merge: true })

        await updateDoc(profileRef, {
          booster_stats: {
            last_reset: today,
            count: newCount
          }
        })
        
        return { count: tCount, level: tLevel }
      } catch (err) {
        console.error('Error collecting teacher:', err)
        throw err
      }
    },
    [user, profile]
  )

  const getRemainingBoosters = useCallback(() => {
    if (!profile) return 0
    const today = new Date().toISOString().split('T')[0]
    const stats = profile.booster_stats
    if (!stats || stats.last_reset !== today) return 3
    return Math.max(0, 3 - stats.count)
  }, [profile])

  return {
    teachers,
    loading,
    error,
    collectTeacher,
    getRemainingBoosters,
  }
}
