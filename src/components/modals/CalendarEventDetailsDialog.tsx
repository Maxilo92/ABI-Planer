'use client'

import { useState, useEffect } from 'react'
import { Event, Profile, UserRole } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, User, FileText, Users, Shield, Group as GroupIcon, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { ShareResourceButton } from '@/components/ui/share-resource-button'

interface CalendarEventDetailsDialogProps {
  event: Event
  children: React.ReactElement
}

const ROLE_LABELS: Record<string, string> = {
  admin_main: 'Haupt-Admin',
  admin: 'Admin',
  admin_co: 'Co-Admin',
  planner: 'Planer',
  viewer: 'Zuschauer',
}

export function CalendarEventDetailsDialog({ event, children }: CalendarEventDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const startDate = toDate(event.start_date)
  const endDate = toDate(event.end_date)
  const isSameDay = startDate.toDateString() === endDate.toDateString()

  useEffect(() => {
    if (!open) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'profiles'), orderBy('full_name')),
      (snapshot) => {
        setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
      }
    )

    return () => unsubscribe()
  }, [open])

  const hasMentions = 
    (event.mentioned_user_ids?.length || 0) > 0 || 
    (event.mentioned_roles?.length || 0) > 0 || 
    (event.mentioned_groups?.length || 0) > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-primary">
              <CalendarIcon className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Termin-Details</span>
            </div>
            <ShareResourceButton
              resourcePath={`/kalender/${event.id}`}
              title={event.title}
              text="Schau dir diesen Termin im ABI Planer an."
              variant="outline"
              size="icon-sm"
            />
          </div>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-muted-foreground mt-1">
            <Clock className="h-4 w-4" />
            {isSameDay
              ? `${format(startDate, 'EEEE, dd. MMMM yyyy', { locale: de })} ${format(startDate, 'HH:mm', { locale: de })} - ${format(endDate, 'HH:mm', { locale: de })} Uhr`
              : `${format(startDate, 'dd.MM. HH:mm', { locale: de })} - ${format(endDate, 'dd.MM. HH:mm', { locale: de })} Uhr`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          {hasMentions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Users className="h-4 w-4" />
                Erwähnungen
              </div>
              <div className="flex flex-wrap gap-2">
                {event.mentioned_roles?.map(role => (
                  <Badge key={role} variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                    <Shield className="h-3 w-3" />
                    {ROLE_LABELS[role] || role}
                  </Badge>
                ))}
                {event.mentioned_groups?.map(group => (
                  <Badge key={group} variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none">
                    <GroupIcon className="h-3 w-3" />
                    {group}
                  </Badge>
                ))}
                {event.mentioned_user_ids?.map(userId => {
                  const p = profiles.find(p => p.id === userId)
                  return (
                    <Badge key={userId} variant="secondary" className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none">
                      <User className="h-3 w-3" />
                      {p?.full_name || 'Lädt...'}
                    </Badge>
                  )
                })}
              </div>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
