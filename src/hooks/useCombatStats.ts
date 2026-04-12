'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { CombatStats } from '@/types/combat'

export const useCombatStats = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<CombatStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setStats(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const statsRef = doc(db, 'combat_stats', user.uid)

    const unsubscribe = onSnapshot(
      statsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setStats(snapshot.data() as CombatStats)
        } else {
          // Default stats for new players
          setStats({
            userId: user.uid,
            elo: 1000,
            wins: 0,
            losses: 0,
            draws: 0,
            totalMatches: 0,
            placementMatchesDone: 0,
            isRanked: false,
            updatedAt: new Date()
          })
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching combat stats:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  return {
    stats,
    loading,
    error,
  }
}
