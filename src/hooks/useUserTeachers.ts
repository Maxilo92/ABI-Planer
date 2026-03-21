'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { UserTeacher } from '@/types/database'

/**
 * Logarithmic leveling logic: Level = floor(sqrt(count)) + 1
 * 0 count -> Level 1
 * 1-3 counts -> Level 2
 * 4-8 counts -> Level 3
 * 9-15 counts -> Level 4
 * 16+ counts -> Level 5
 */
export const calculateLevel = (count: number): number => {
  if (count <= 0) return 1
  return Math.floor(Math.sqrt(count)) + 1
}

export const useUserTeachers = () => {
  const { user } = useAuth()
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

      const docRef = doc(db, 'user_teachers', user.uid)
      
      try {
        const docSnap = await getDoc(docRef)
        const currentData = docSnap.exists() ? (docSnap.data() as UserTeacher) : {}
        
        const teacherData = currentData[teacherId] || { count: 0, level: 1 }
        const newCount = teacherData.count + 1
        const newLevel = calculateLevel(newCount)

        await setDoc(docRef, {
          [teacherId]: {
            count: newCount,
            level: newLevel,
          }
        }, { merge: true })
        
        return { count: newCount, level: newLevel }
      } catch (err) {
        console.error('Error collecting teacher:', err)
        throw err
      }
    },
    [user]
  )

  return {
    teachers,
    loading,
    error,
    collectTeacher,
  }
}
