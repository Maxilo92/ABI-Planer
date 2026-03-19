'use client'

import { Event } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar as CalendarIcon, Clock, MapPin, User, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'

interface CalendarEventDetailsDialogProps {
  event: Event
  children: React.ReactElement
}

export function CalendarEventDetailsDialog({ event, children }: CalendarEventDetailsDialogProps) {
  const eventDate = toDate(event.event_date)

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Termin-Details</span>
          </div>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-muted-foreground mt-1">
            <Clock className="h-4 w-4" />
            {format(eventDate, 'EEEE, dd. MMMM yyyy', { locale: de })} um {format(eventDate, 'HH:mm', { locale: de })} Uhr
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {event.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Beschreibung
              </div>
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-primary/10 p-2 rounded-full">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Datum</p>
                <p className="text-sm font-semibold">{format(eventDate, 'dd.MM.yyyy', { locale: de })}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-primary/10 p-2 rounded-full">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Uhrzeit</p>
                <p className="text-sm font-semibold">{format(eventDate, 'HH:mm', { locale: de })} Uhr</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
