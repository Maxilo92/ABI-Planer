'use client'

import { Event } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EditEventDialog } from '@/components/modals/EditEventDialog'
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Nächste Termine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Keine Termine geplant.</p>
          ) : (
            events.map((event) => {
              const eventDate = toDate(event.event_date)
              return (
                <div key={event.id} className="group flex items-center justify-between gap-4 pb-3 border-b last:border-0">
                  <div className="flex gap-4">
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

                  {canManage && (
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <EditEventDialog event={event} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(event.id)}
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
