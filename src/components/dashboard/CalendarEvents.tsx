'use client'

import { Event } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EditEventDialog } from '@/components/modals/EditEventDialog'
import { CalendarEventDetailsDialog } from '@/components/modals/CalendarEventDetailsDialog'
import { db } from '@/lib/firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { toast } from 'sonner'

interface CalendarEventsProps {
  events: Event[]
  canManage?: boolean
}

export function CalendarEvents({ events, canManage = false }: CalendarEventsProps) {
  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du diesen Termin wirklich löschen?')) return

    try {
      await deleteDoc(doc(db, 'events', id))
      toast.success('Termin gelöscht.')
    } catch (err) {
      console.error('Error deleting event:', err)
      toast.error('Fehler beim Löschen.')
    }
  }

  const now = new Date().getTime()
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = toDate(a.event_date).getTime()
    const dateB = toDate(b.event_date).getTime()

    const isPastA = dateA < now
    const isPastB = dateB < now

    // Both upcoming: ascending by date (sooner first)
    if (!isPastA && !isPastB) {
      return dateA - dateB
    }
    // Both past: descending by date (most recent first)
    if (isPastA && isPastB) {
      return dateB - dateA
    }
    // One upcoming, one past: upcoming first
    return isPastA ? 1 : -1
  })

  return (
    <Card className="h-full border-border/40 shadow-subtle flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-border bg-muted/10 shrink-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Nächste Termine
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden bg-card">
        <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          {sortedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Keine anstehenden Termine.
            </p>
          ) : (
            sortedEvents.map((event) => {
              const eventDate = toDate(event.event_date)
              return (
                <div key={event.id} className="group flex items-center justify-between gap-4 pb-3 border-b last:border-0">
                  <CalendarEventDetailsDialog event={event}>
                    <div className="flex gap-4 cursor-pointer hover:opacity-80 transition-all flex-1">
                      <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg p-2 min-w-[50px] h-[50px]">
                        <span className="text-xs uppercase font-medium">{format(eventDate, 'MMM', { locale: de })}</span>
                        <span className="text-xl font-bold leading-none">{format(eventDate, 'dd')}</span>
                      </div>
                      <div className="flex flex-col justify-center space-y-1">
                        <h4 className="text-sm font-semibold">{event.title}</h4>
                        <div className="flex items-center text-[10px] md:text-xs text-muted-foreground gap-1">
                          <Clock className="h-3 w-3" />
                          {format(eventDate, 'EEEE, HH:mm', { locale: de })} Uhr
                        </div>
                      </div>
                    </div>
                  </CalendarEventDetailsDialog>

                  {canManage && (
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <EditEventDialog event={event} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(event.id);
                        }}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
