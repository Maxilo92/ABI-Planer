'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { CombatEvent } from '@/types/combat'
import { useAuth } from '@/context/AuthContext'

export const useCombatEvents = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<CombatEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setEvents([])
      setLoading(false)
      return
    }

    const eventsQuery = query(
      collection(db, 'combat_events'),
      where('isActive', '==', true)
    )

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CombatEvent[]
      setEvents(eventData)
      setLoading(false)
    }, (error) => {
      console.error('useCombatEvents: Error listening to combat events:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { events, loading }
}
