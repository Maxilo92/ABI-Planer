'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { AddEventDialog } from '@/components/modals/AddEventDialog'
import { Event } from '@/types/database'
import { Loader2, Search } from 'lucide-react'
import { toDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CalendarPage() {
  const { profile, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('start_date', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)))
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

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const now = new Date().getTime()
  const upcomingEvents = filteredEvents.filter(e => toDate(e.start_date).getTime() >= now)
  const pastEvents = filteredEvents.filter(e => toDate(e.start_date).getTime() < now).sort((a, b) => toDate(b.start_date).getTime() - toDate(a.start_date).getTime())

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground">Alle wichtigen Termine im Überblick.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isPlanner && <AddEventDialog />}
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="upcoming" className="px-4">Anstehend ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="past" className="px-4">Vergangen ({pastEvents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <CalendarEvents events={upcomingEvents} canManage={isPlanner} useScrollContainer={false} showShareButton />
        </TabsContent>
        <TabsContent value="past">
          <CalendarEvents events={pastEvents} canManage={isPlanner} useScrollContainer={false} showShareButton />
        </TabsContent>
      </Tabs>
    </div>
  )
}
