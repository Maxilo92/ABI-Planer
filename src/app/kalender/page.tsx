'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { AddEventDialog } from '@/components/modals/AddEventDialog'
import { Event } from '@/types/database'
import { Loader2 } from 'lucide-react'
import { toDate } from '@/lib/utils'

export default function CalendarPage() {
  const { profile, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('event_date', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event))
      
      const now = new Date().getTime()
      // Sort: Upcoming (asc), Past (desc) at the bottom
      const sorted = [...fetchedEvents].sort((a, b) => {
        const dateA = toDate(a.event_date).getTime()
        const dateB = toDate(b.event_date).getTime()

        const isPastA = dateA < now
        const isPastB = dateB < now

        if (!isPastA && !isPastB) return dateA - dateB
        if (isPastA && isPastB) return dateB - dateA
        return isPastA ? 1 : -1
      })
      
      setEvents(sorted)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!authLoading && profile) {
      const updateLastVisited = async () => {
        try {
          const now = new Date()
          const lastVisitedStr = profile.last_visited?.kalender
          const lastVisited = lastVisitedStr ? new Date(lastVisitedStr) : new Date(0)
          
          // Only update if it's been more than an hour since last update
          // or if it hasn't been set yet
          if (!lastVisitedStr || (now.getTime() - lastVisited.getTime() > 60 * 60 * 1000)) {
            const userRef = doc(db, 'profiles', profile.id)
            await updateDoc(userRef, {
              [`last_visited.kalender`]: now.toISOString()
            })
          }
        } catch (error) {
          console.error('Error updating last_visited for kalender:', error)
        }
      }
      updateLastVisited()
    }
  }, [profile?.id, profile?.last_visited?.kalender, authLoading])

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
