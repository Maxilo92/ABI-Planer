'use client'

import { useEffect, useState, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { AddEventDialog } from '@/components/modals/AddEventDialog'
import { Event } from '@/types/database'
import { Search, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { Calendar } from '@/components/ui/calendar'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { 
  ContextMenu, 
  ContextMenuTrigger, 
  ContextMenuContent, 
  ContextMenuItem 
} from '@/components/ui/context-menu'

export default function CalendarPage() {
  const { profile, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  useEffect(() => {
    if (authLoading) return

    if (!profile) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'events'), orderBy('start_date', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)))
      setLoading(false)
    }, (error) => {
      console.error('Error listening to events:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [authLoading, profile])

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

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_co' || profile?.role === 'admin_main' || profile?.role === 'admin') && profile?.is_approved

  const filteredEvents = useMemo(() => events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [events, searchQuery])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return filteredEvents
      .filter(e => toDate(e.start_date) >= now)
      .slice(0, 5)
  }, [filteredEvents])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    return filteredEvents.filter(e => {
      const start = toDate(e.start_date)
      const end = e.end_date ? toDate(e.end_date) : start
      return isSameDay(selectedDay, start) || isSameDay(selectedDay, end) || (selectedDay > start && selectedDay < end)
    })
  }, [filteredEvents, selectedDay])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-full md:w-64 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Kalender gesperrt" 
          description="Um die Terminplanung und Details zu Events zu sehen, musst du mit deinem Lernsax-Konto angemeldet sein."
          icon={<CalendarIcon className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terminkalender</h1>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-card p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-muted rounded"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-muted rounded"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => <div key={d} className="text-center text-xs font-bold text-muted-foreground">{d}</div>)}
            {calendarDays.map((day) => {
              const dayEvents = filteredEvents.filter(e => {
                const start = toDate(e.start_date)
                const end = e.end_date ? toDate(e.end_date) : start
                return isSameDay(day, start) || isSameDay(day, end) || (day > start && day < end)
              })
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const dayButton = (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    "aspect-square flex flex-col items-center p-1 rounded-lg hover:bg-muted transition-colors relative h-full w-full",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground",
                    isSelected && "bg-primary/10 ring-1 ring-primary"
                  )}
                >
                  <span className="text-sm font-semibold">{format(day, 'd')}</span>
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((e) => <div key={e.id} className="h-1.5 w-1.5 rounded-full bg-primary" />)}
                  </div>
                </button>
              )

              return (
                <ContextMenu key={day.toString()}>
                  <ContextMenuTrigger asChild>
                    {dayButton}
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => setSelectedDay(day)}>Tag auswählen</ContextMenuItem>
                    {isPlanner && (
                      <AddEventDialog defaultDate={day} defaultGroup={profile?.planning_groups?.[0]}>
                        <ContextMenuItem onSelect={(e: any) => e.preventDefault()}>Termin hinzufügen</ContextMenuItem>
                      </AddEventDialog>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {selectedDay ? format(selectedDay, 'dd. MMM', { locale: de }) : 'Alle Termine'}
            </h3>
            {selectedDay && isPlanner && (
              <AddEventDialog defaultDate={selectedDay} defaultGroup={profile?.planning_groups?.[0]} />
            )}
          </div>
          {(selectedDay ? selectedDayEvents : upcomingEvents).map((event: Event) => (
              <div key={event.id} className="bg-card p-4 rounded-xl border shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                    event.assigned_to_group ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-muted text-muted-foreground"
                  )}>
                    {event.assigned_to_group || 'Allgemein'}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {format(toDate(event.start_date), 'HH:mm')}
                  </span>
                </div>
                <p className="text-sm font-bold leading-tight">{event.title}</p>
                <p className="text-[10px] text-muted-foreground">{format(toDate(event.start_date), 'dd. MMMM yyyy', { locale: de })}</p>
              </div>
            ))
          }
          {(selectedDay ? selectedDayEvents : upcomingEvents).length === 0 && (
            <div className="text-center py-8 bg-muted/50 rounded-xl border border-dashed">
              <p className="text-xs text-muted-foreground">Keine Termine {selectedDay ? 'an diesem Tag' : 'anstehend'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
