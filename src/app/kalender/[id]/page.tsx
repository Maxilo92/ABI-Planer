'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { doc, onSnapshot } from 'firebase/firestore'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { ArrowLeft, Calendar as CalendarIcon, Clock, ExternalLink, FileText, Loader2, MapPin, User } from 'lucide-react'
import { db } from '@/lib/firebase'
import { toDate } from '@/lib/utils'
import { Event } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareResourceButton } from '@/components/ui/share-resource-button'
import { downloadICS } from '@/lib/icsGenerator'
import { Skeleton } from '@/components/ui/skeleton'

function toGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

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
    }, (error) => {
      console.error('CalendarDetailPage: Error listening to event:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [id])

  const openAppleCalendar = () => {
    if (!event) return

    downloadICS({
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start_date: event.start_date,
      end_date: event.end_date,
    })
  }

  const openGoogleCalendar = () => {
    if (!event) return

    const startDate = toDate(event.start_date)
    const endDate = toDate(event.end_date)
    const detailsText = event.description || ''

    const googleUrl = new URL('https://calendar.google.com/calendar/render')
    googleUrl.searchParams.set('action', 'TEMPLATE')
    googleUrl.searchParams.set('text', event.title)
    googleUrl.searchParams.set('dates', `${toGoogleDate(startDate)}/${toGoogleDate(endDate)}`)
    googleUrl.searchParams.set('details', detailsText)
    if (event.location) {
      googleUrl.searchParams.set('location', event.location)
    }

    window.open(googleUrl.toString(), '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-32 rounded-md" />
        <div className="rounded-2xl border bg-card/65 p-8 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-12 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="h-px bg-border/50" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>
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
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <User className="h-4 w-4 text-primary/70" />
            <span>Erstellt von: {event.created_by_name || 'Unbekannt'}</span>
          </div>
          {(event.assigned_to_group || (event.mentioned_groups && event.mentioned_groups.length > 0)) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {event.assigned_to_group && (
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">
                  Gruppe: {event.assigned_to_group}
                </Badge>
              )}
              {event.mentioned_groups
                ?.filter((group) => group !== event.assigned_to_group)
                .map((group) => (
                  <Badge key={group} variant="secondary">
                    Erwähnt: {group}
                  </Badge>
                ))}
            </div>
          )}
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

          <div className="pt-5 border-t border-border/50">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={openGoogleCalendar}>
                <ExternalLink className="h-4 w-4" /> In Google Kalender öffnen
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={openAppleCalendar}>
                <ExternalLink className="h-4 w-4" /> In Apple Kalender öffnen
              </Button>
            </div>
          </div>
        </section>
      </article>
    </div>
  )
}
