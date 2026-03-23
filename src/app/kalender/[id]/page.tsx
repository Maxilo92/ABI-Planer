'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { doc, onSnapshot } from 'firebase/firestore'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { ArrowLeft, Calendar as CalendarIcon, Clock, FileText, Loader2, MapPin } from 'lucide-react'
import { db } from '@/lib/firebase'
import { toDate } from '@/lib/utils'
import { Event } from '@/types/database'
import { Button } from '@/components/ui/button'
import { ShareResourceButton } from '@/components/ui/share-resource-button'

export default function CalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const eventRef = doc(db, 'events', id)
    const unsubscribe = onSnapshot(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        setEvent({ id: snapshot.id, ...snapshot.data() } as Event)
      } else {
        setEvent(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Termin nicht gefunden.</h2>
        <Button
          variant="link"
          className="mt-4"
          render={<Link href="/kalender">Zurück zum Kalender</Link>}
        />
      </div>
    )
  }

  const startDate = toDate(event.start_date)
  const endDate = toDate(event.end_date)
  const isSameDay = startDate.toDateString() === endDate.toDateString()

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 space-y-6">
      <div className="px-2 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          render={
            <Link href="/kalender">
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Link>
          }
        />
        <ShareResourceButton
          resourcePath={`/kalender/${event.id}`}
          title={event.title}
          text="Schau dir diesen Termin im ABI Planer an."
          variant="outline"
          size="sm"
          className="gap-2"
        />
      </div>

      <article className="rounded-2xl border bg-card/65 p-5 md:p-8 space-y-6">
        <header className="space-y-3">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Termin
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{event.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary/70" />
            <span>
              {isSameDay
                ? `${format(startDate, 'EEEE, dd. MMMM yyyy', { locale: de })} ${format(startDate, 'HH:mm', { locale: de })} - ${format(endDate, 'HH:mm', { locale: de })} Uhr`
                : `${format(startDate, 'dd.MM. HH:mm', { locale: de })} - ${format(endDate, 'dd.MM. HH:mm', { locale: de })} Uhr`}
            </span>
          </div>
        </header>

        <div className="h-px bg-border/50" />

        <section className="space-y-4">
          {event.location && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Ort
              </div>
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                {event.location}
              </p>
            </div>
          )}

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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Start</p>
                <p className="text-sm font-semibold">{format(startDate, 'dd.MM.yyyy HH:mm', { locale: de })} Uhr</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-primary/10 p-2 rounded-full">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Ende</p>
                <p className="text-sm font-semibold">{format(endDate, 'dd.MM.yyyy HH:mm', { locale: de })} Uhr</p>
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  )
}
