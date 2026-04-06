'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X, Users, Shield, Group } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Profile, UserRole } from '@/types/database'
import { logAction } from '@/lib/logging'

const AVAILABLE_ROLES: { id: UserRole; label: string }[] = [
  { id: 'admin_main', label: 'Haupt-Admin' },
  { id: 'admin', label: 'Admin' },
  { id: 'admin_co', label: 'Co-Admin' },
  { id: 'planner', label: 'Planer' },
  { id: 'viewer', label: 'Zuschauer' },
]

interface AddEventDialogProps {
  defaultGroup?: string
  triggerLabel?: string
}

export function AddEventDialog({ defaultGroup, triggerLabel = 'Termin hinzufügen' }: AddEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [assignedGroup, setAssignedGroup] = useState(defaultGroup || '')
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const [mentionedRoles, setMentionedRoles] = useState<string[]>([])
  const [mentionedGroups, setMentionedGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [availableGroups, setAvailableGroups] = useState<string[]>([])
  const { user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!open) return
    setAssignedGroup(defaultGroup || '')
  }, [defaultGroup, open])

  useEffect(() => {
    if (!open || authLoading || !profile?.is_approved) return

    const profilesUnsubscribe = onSnapshot(
      query(collection(db, 'profiles'), orderBy('full_name')),
      (snapshot) => {
        setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
      }, (error) => {
        console.error('AddEventDialog: Error listening to profiles:', error)
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
    }, (error) => {
      console.error('AddEventDialog: Error listening to settings config:', error)
    })

    return () => {
      profilesUnsubscribe()
      settingsUnsubscribe()
    }
  }, [open, authLoading, profile?.is_approved])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const normalizedMentionedGroups = Array.from(new Set([
        ...mentionedGroups,
        ...(assignedGroup ? [assignedGroup] : []),
      ]))

      await addDoc(collection(db, 'events'), {
        title,
        description,
        location,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
        created_at: new Date().toISOString(),
        created_by: user.uid,
        created_by_name: profile?.full_name || user.displayName || user.email || 'Unbekannt',
        assigned_to_group: assignedGroup || null,
        mentioned_user_ids: mentionedUserIds,
        mentioned_roles: mentionedRoles,
        mentioned_groups: normalizedMentionedGroups,
      })

      await logAction('EVENT_CREATED', user.uid, null, {
        title,
        location,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
        assigned_to_group: assignedGroup || null,
        mentions_users_count: mentionedUserIds.length,
        mentions_roles_count: mentionedRoles.length,
        mentions_groups_count: normalizedMentionedGroups.length,
      })

      setOpen(false)
      setTitle('')
      setDescription('')
      setLocation('')
      setStartDate('')
      setEndDate('')
      setAssignedGroup(defaultGroup || '')
      setMentionedUserIds([])
      setMentionedRoles([])
      setMentionedGroups([])
    } catch (err) {
      console.error('Error adding event:', err)
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
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Termin hinzufügen</DialogTitle>
            <DialogDescription>
              Erstelle einen neuen Termin und ordne ihn bei Bedarf direkt einer Gruppe zu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Abiball" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Weitere Details..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Ort</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. Aula, Sportplatz..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Startdatum & Uhrzeit</Label>
                <Input id="start-date" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">Enddatum & Uhrzeit</Label>
                <Input id="end-date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assigned-group">Gruppenzuordnung</Label>
              <select
                id="assigned-group"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={assignedGroup}
                onChange={(e) => setAssignedGroup(e.target.value)}
              >
                <option value="">Keine feste Gruppe</option>
                {availableGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
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
              {loading ? 'Speichern...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
