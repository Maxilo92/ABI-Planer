'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { AddEventDialog } from '@/components/modals/AddEventDialog'
import { Event } from '@/types/database'
import { Loader2 } from 'lucide-react'

export default function CalendarPage() {
  const { profile, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('event_date', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_co' || profile?.role === 'admin_main' || profile?.role === 'admin') && profile?.is_approved

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground">Alle wichtigen Termine im Überblick.</p>
        </div>
        {isPlanner && <AddEventDialog />}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CalendarEvents events={events || []} canManage={isPlanner} />
      </div>
    </div>
  )
}
