'use client'

import { Event } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface CalendarEventsProps {
  events: Event[]
}

export function CalendarEvents({ events }: CalendarEventsProps) {
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
            events.map((event) => (
              <div key={event.id} className="flex gap-4 pb-3 border-b last:border-0">
                <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg p-2 min-w-[50px] h-[50px]">
                  <span className="text-xs uppercase font-medium">{format(new Date(event.event_date), 'MMM', { locale: de })}</span>
                  <span className="text-xl font-bold leading-none">{format(new Date(event.event_date), 'dd')}</span>
                </div>
                <div className="flex flex-col justify-center space-y-1">
                  <h4 className="text-sm font-semibold">{event.title}</h4>
                  <div className="flex items-center text-[10px] md:text-xs text-muted-foreground gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.event_date), 'EEEE, HH:mm', { locale: de })} Uhr
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
