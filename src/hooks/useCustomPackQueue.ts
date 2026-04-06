'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { CustomPackQueueEntry } from '@/types/database'

const getEntryTimestamp = (value: CustomPackQueueEntry['createdAt']) => {
  if (!value) return 0
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime()
  }
  return 0
}

export function useCustomPackQueue() {
  const { user } = useAuth()
  const [queueEntries, setQueueEntries] = useState<CustomPackQueueEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setQueueEntries([])
      setLoading(false)
      return
    }

    setLoading(true)
    const queueRef = collection(db, 'profiles', user.uid, 'custom_pack_queue')

    const unsubscribe = onSnapshot(queueRef, (snapshot) => {
      const entries = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<CustomPackQueueEntry, 'id'>),
        }))
        .sort((left, right) => {
          const leftCreatedAt = getEntryTimestamp(left.createdAt)
          const rightCreatedAt = getEntryTimestamp(right.createdAt)

          if (leftCreatedAt !== rightCreatedAt) {
            return leftCreatedAt - rightCreatedAt
          }

          return left.id.localeCompare(right.id)
        })

      setQueueEntries(entries)
      setLoading(false)
    }, (error) => {
      console.error('useCustomPackQueue: Failed to listen to custom pack queue:', error)
      setQueueEntries([])
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const activeQueueEntries = useMemo(
    () => queueEntries.filter((entry) => (entry.remainingPacks || 0) > 0),
    [queueEntries]
  )

  return {
    queueEntries: activeQueueEntries,
    loading,
  }
}