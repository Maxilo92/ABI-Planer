'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil, X, Users, Shield, Group, Plus, MapPin } from 'lucide-react'
import { Event, Profile, UserRole } from '@/types/database'
import { format } from 'date-fns'
import { toDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logging'

interface EditEventDialogProps {
  event: Event
}

const AVAILABLE_ROLES: { id: UserRole; label: string }[] = [
  { id: 'admin_main', label: 'Haupt-Admin' },
  { id: 'admin', label: 'Admin' },
  { id: 'admin_co', label: 'Co-Admin' },
  { id: 'planner', label: 'Planer' },
  { id: 'viewer', label: 'Zuschauer' },
]

export function EditEventDialog({ event }: EditEventDialogProps) {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description || '')
  const [location, setLocation] = useState(event.location || '')
    const [startDate, setStartDate] = useState(format(toDate(event.start_date), "yyyy-MM-dd'T'HH:mm"))
  const [endDate, setEndDate] = useState(
    event.end_date ? format(toDate(event.end_date), "yyyy-MM-dd'T'HH:mm") : format(toDate(event.start_date), "yyyy-MM-dd'T'HH:mm")
  )
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>(event.mentioned_user_ids || [])
  const [mentionedRoles, setMentionedRoles] = useState<string[]>(event.mentioned_roles || [])
  const [mentionedGroups, setMentionedGroups] = useState<string[]>(event.mentioned_groups || [])
  const [loading, setLoading] = useState(false)
  
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [availableGroups, setAvailableGroups] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!open) return

    const profilesUnsubscribe = onSnapshot(
      query(collection(db, 'profiles'), orderBy('full_name')),
      (snapshot) => {
        setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
      }
    )

    const settingsUnsubscribe = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const rawGroups = snapshot.data().planning_groups
        const normalizedGroups = Array.isArray(rawGroups)
          ? rawGroups
              .map((entry) => {
                if (typeof entry === 'string') return entry
                if (entry && typeof entry === 'object' && 'name' in entry) return entry.name
                return null
              })
              .filter((name): name is string => !!name)
          : []
        setAvailableGroups(normalizedGroups)
      }
    })

    return () => {
      profilesUnsubscribe()
      settingsUnsubscribe()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const docRef = doc(db, 'events', event.id)
      await updateDoc(docRef, {
        title,
        description,
        location,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
        mentioned_user_ids: mentionedUserIds,
        mentioned_roles: mentionedRoles,
        mentioned_groups: mentionedGroups,
      })

      if (user) {
        await logAction('EVENT_EDITED', user.uid, profile?.full_name, {
          event_id: event.id,
          title,
          location,
          start_date: new Date(startDate).toISOString(),
          end_date: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
          mentions_users_count: mentionedUserIds.length,
          mentions_roles_count: mentionedRoles.length,
          mentions_groups_count: mentionedGroups.length,
        })
      }

      toast.success('Termin aktualisiert.')
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Error updating event:', err)
      toast.error('Fehler beim Aktualisieren.')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    setMentionedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const toggleRole = (role: string) => {
    setMentionedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const toggleGroup = (group: string) => {
    setMentionedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Termin bearbeiten</DialogTitle>
            <DialogDescription>
              Passe die Details des Termins an.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Titel</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Ort</Label>
              <Input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. Aula, Sportplatz..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start-date">Startdatum & Uhrzeit</Label>
                <Input id="edit-start-date" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end-date">Enddatum & Uhrzeit</Label>
                <Input id="edit-end-date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Erwähnungen</Label>
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md border border-input bg-background/50">
                {mentionedRoles.map(role => (
                  <Badge key={role} variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {AVAILABLE_ROLES.find(r => r.id === role)?.label || role}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => toggleRole(role)} />
                  </Badge>
                ))}
                {mentionedGroups.map(group => (
                  <Badge key={group} variant="secondary" className="gap-1">
                    <Group className="h-3 w-3" />
                    {group}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => toggleGroup(group)} />
                  </Badge>
                ))}
                {mentionedUserIds.map(userId => {
                  const p = profiles.find(p => p.id === userId)
                  return (
                    <Badge key={userId} variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {p?.full_name || 'Unbekannt'}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => toggleUser(userId)} />
                    </Badge>
                  )
                })}
                
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                        <Plus className="h-3 w-3" /> Hinzufügen
                      </Button>
                    }
                  />
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Rollen</p>
                          <div className="space-y-1">
                            {AVAILABLE_ROLES.map(role => (
                              <label key={role.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors">
                                <Checkbox checked={mentionedRoles.includes(role.id)} onCheckedChange={() => toggleRole(role.id)} />
                                <span className="text-sm">{role.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {availableGroups.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Gruppen</p>
                            <div className="space-y-1">
                              {availableGroups.map(group => (
                                <label key={group} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors">
                                  <Checkbox checked={mentionedGroups.includes(group)} onCheckedChange={() => toggleGroup(group)} />
                                  <span className="text-sm">{group}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Personen</p>
                          <div className="space-y-1">
                            {profiles.map(p => (
                              <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors">
                                <Checkbox checked={mentionedUserIds.includes(p.id)} onCheckedChange={() => toggleUser(p.id)} />
                                <span className="text-sm">{p.full_name || p.email}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Aktualisieren'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
