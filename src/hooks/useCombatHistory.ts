'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { CombatHistoryMatch } from '@/types/combat'

interface CombatHistoryState {
  matches: CombatHistoryMatch[]
  loading: boolean
  error: Error | null
}

const toMillis = (value: CombatHistoryMatch['createdAt']): number => {
  if (!value) return 0

  if (value instanceof Date) return value.getTime()

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().getTime()
  }

  return 0
}

export const useCombatHistory = (): CombatHistoryState => {
  const { user } = useAuth()
  const [playerAMatches, setPlayerAMatches] = useState<CombatHistoryMatch[] | null>(null)
  const [playerBMatches, setPlayerBMatches] = useState<CombatHistoryMatch[] | null>(null)
  const [loadedForUid, setLoadedForUid] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) return

    const playerAQuery = query(
      collection(db, 'matches'),
      where('playerA_uid', '==', user.uid),
      where('status', '==', 'finished')
    )

    const playerBQuery = query(
      collection(db, 'matches'),
      where('playerB_uid', '==', user.uid),
      where('status', '==', 'finished')
    )

    const unsubscribePlayerA = onSnapshot(
      playerAQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as CombatHistoryMatch[]
        setPlayerAMatches(docs)
        setLoadedForUid(user.uid)
        setError(null)
      },
      (snapshotError) => {
        console.error('useCombatHistory: Error loading playerA matches:', snapshotError)
        setError(snapshotError)
      }
    )

    const unsubscribePlayerB = onSnapshot(
      playerBQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as CombatHistoryMatch[]
        setPlayerBMatches(docs)
        setLoadedForUid(user.uid)
        setError(null)
      },
      (snapshotError) => {
        console.error('useCombatHistory: Error loading playerB matches:', snapshotError)
        setError(snapshotError)
      }
    )

    return () => {
      unsubscribePlayerA()
      unsubscribePlayerB()
    }
  }, [user])

  const matches = useMemo(() => {
    const byId = new Map<string, CombatHistoryMatch>()

    for (const match of [...(playerAMatches || []), ...(playerBMatches || [])]) {
      byId.set(match.id, match)
    }

    return Array.from(byId.values()).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
  }, [playerAMatches, playerBMatches])

  const isLoadedForCurrentUser = Boolean(user?.uid && loadedForUid === user.uid)
  const loading = Boolean(user) && (!isLoadedForCurrentUser || playerAMatches === null || playerBMatches === null)

  return {
    matches: user ? matches : [],
    loading,
    error,
  }
}
