'use client'

import { Profile, Event, Todo } from '@/types/database'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Shield, User, Trash2, Clock3, Undo2, Calendar, MapPin, Search, CheckSquare, ListTodo } from 'lucide-react'
import { ResetPasswordDialog } from '@/components/modals/ResetPasswordDialog'
import { EditEventDialog } from '@/components/modals/EditEventDialog'
import { AddEventDialog } from '@/components/modals/AddEventDialog'
import { EditTodoDialog } from '@/components/modals/EditTodoDialog'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [todoSearch, setTodoSearch] = useState('')
  const [courses, setCourses] = useState<string[]>([])
  const [planningGroups, setPlanningGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const canManageUsers =
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canManageUsers)) {
      router.push('/')
    }
  }, [profile, authLoading, canManageUsers, router])

  useEffect(() => {
    const qProfiles = query(collection(db, 'profiles'), orderBy('created_at', 'desc'))
    const unsubscribeProfiles = onSnapshot(qProfiles, (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
    })

    const qEvents = query(collection(db, 'events'), orderBy('event_date', 'desc'))
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)))
    })

    const qTodos = query(collection(db, 'todos'), orderBy('created_at', 'desc'))
    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo)))
      setLoading(false)
    })

    return () => {
      unsubscribeProfiles()
      unsubscribeEvents()
      unsubscribeTodos()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (!snapshot.exists()) {
        setCourses([])
        setPlanningGroups([])
        return
      }

      const data = snapshot.data()
      const rawCourses = data.courses
      const rawGroups = data.planning_groups

      const normalizedCourses = Array.isArray(rawCourses)
        ? rawCourses
            .filter((course): course is string => typeof course === 'string' && course.trim().length > 0)
            .map((course) => course.trim())
        : []

      const normalizedGroups = Array.isArray(rawGroups)
        ? rawGroups
            .map((entry) => {
              if (typeof entry === 'string') return entry
              if (entry && typeof entry === 'object' && 'name' in entry && typeof entry.name === 'string') {
                return entry.name
              }
              return null
            })
            .filter((name): name is string => !!name && name.trim().length > 0)
            .map((name) => name.trim())
        : []

      setCourses(normalizedCourses)
      setPlanningGroups(normalizedGroups)
    })

    return () => unsubscribe()
  }, [])

  const handleUpdateProfile = async (id: string, updates: Partial<Profile>) => {
    const target = profiles.find((entry) => entry.id === id)
    if (!target) return

    const updateKeys = Object.keys(updates)
    const isAssignmentOnlyUpdate = updateKeys.every((key) => key === 'class_name' || key === 'planning_group')
    const targetIsMainAdmin = target.role === 'admin_main' || target.role === 'admin'
    if (targetIsMainAdmin && profile?.id !== id && !isAssignmentOnlyUpdate) {
      return
    }

    if (id === profile?.id && updates.role && updates.role !== target.role) {
      return
    }

    try {
      const docRef = doc(db, 'profiles', id)
      await updateDoc(docRef, updates)

      if (user) {
        await logAction('PROFILE_UPDATED', user.uid, profile?.full_name, {
          target_user_id: id,
          target_user_name: target.full_name,
          updates,
        })
      }
    } catch (err) {
      console.error('Error updating profile:', err)
    }
  }

  const handleSetTimeout = async (id: string, hours: number) => {
    const timeoutUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    await handleUpdateProfile(id, {
      timeout_until: timeoutUntil,
      timeout_reason: `Admin-Timeout (${hours}h)`,
    })
    toast.success(`Nutzer wurde fuer ${hours} Stunden getimeoutet.`)
  }

  const handleClearTimeout = async (id: string) => {
    await handleUpdateProfile(id, {
      timeout_until: null,
      timeout_reason: null,
    })
    toast.success('Timeout wurde aufgehoben.')
  }

  const handleDeleteProfile = async (id: string) => {
    const target = profiles.find((entry) => entry.id === id)
    if (!target) return

    const targetIsMainAdmin = target.role === 'admin_main' || target.role === 'admin'
    if (targetIsMainAdmin || id === profile?.id) {
      return
    }

    if (confirm('Bist du sicher, dass du diesen Nutzer löschen möchtest? (Löscht nur das Profil-Dokument, nicht das Auth-Konto)')) {
      try {
        await deleteDoc(doc(db, 'profiles', id))

        if (user) {
          await logAction('PROFILE_DELETED', user.uid, profile?.full_name, {
            target_user_id: id,
            target_user_name: target.full_name,
          })
        }
      } catch (err) {
        console.error('Error deleting profile:', err)
      }
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Diesen Termin wirklich löschen?')) return
    try {
      await deleteDoc(doc(db, 'events', id))
      toast.success('Termin gelöscht.')
    } catch (err) {
      toast.error('Fehler beim Löschen.')
    }
  }

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Diese Aufgabe wirklich löschen? Alle Unteraufgaben werden ebenfalls gelöscht.')) return
    try {
      // Find children
      const children = todos.filter(t => t.parentId === id)
      for (const child of children) {
        await deleteDoc(doc(db, 'todos', child.id))
      }
      await deleteDoc(doc(db, 'todos', id))
      toast.success('Aufgabe gelöscht.')
    } catch (err) {
      toast.error('Fehler beim Löschen.')
    }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Admin Dashboard...</div>
  }

  if (!profile || !canManageUsers) {
    return null
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    e.location?.toLowerCase().includes(eventSearch.toLowerCase())
  )

  const filteredTodos = todos.filter(t => 
    t.title.toLowerCase().includes(todoSearch.toLowerCase()) ||
    t.description?.toLowerCase().includes(todoSearch.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="secondary">Offen</Badge>
      case 'in_progress': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">In Arbeit</Badge>
      case 'done': return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Erledigt</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Zentrale Verwaltung der Plattform</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <User className="h-4 w-4" /> Benutzer
          </TabsTrigger>
          <TabsTrigger value="todos" className="gap-2">
            <CheckSquare className="h-4 w-4" /> Aufgaben
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" /> Termine
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Benutzerkonten</CardTitle>
                <CardDescription>Rollen, Kurse und Gruppen verwalten.</CardDescription>
              </div>
              <div className="relative w-full max-w-sm ml-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nutzer suchen..."
                  className="pl-9"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Kurs</TableHead>
                      <TableHead>Gruppe</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link href={`/profil/${p.id}`} className="hover:underline focus-visible:underline">
                            {p.full_name || 'Unbekannt'}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground break-all">
                          {p.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {p.role}
                          </Badge>
                          {p.timeout_until && new Date(p.timeout_until).getTime() > Date.now() && (
                            <Badge variant="destructive" className="ml-2">
                              Timeout
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            value={p.class_name || ''}
                            onChange={(e) => handleUpdateProfile(p.id, { class_name: e.target.value || null })}
                          >
                            <option value="">Kein Kurs</option>
                            {courses.map((course) => (
                              <option key={course} value={course}>{course}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            value={p.planning_group || ''}
                            onChange={(e) => handleUpdateProfile(p.id, { planning_group: e.target.value || null })}
                          >
                            <option value="">Keine Gruppe</option>
                            {planningGroups.map((groupName) => (
                              <option key={groupName} value={groupName}>{groupName}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const isMainAdminAccount = p.role === 'admin_main' || p.role === 'admin'
                            const isSelf = p.id === profile.id
                            const canManageRoleActions = !isMainAdminAccount && !isSelf

                            return (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button variant="ghost" size="icon" disabled={!canManageRoleActions}>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'admin' })}>
                                    <Shield className="mr-2 h-4 w-4" /> Zum Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'admin_co' })}>
                                    <Shield className="mr-2 h-4 w-4" /> Zum Co-Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'planner' })}>
                                    <Shield className="mr-2 h-4 w-4" /> Zum Planer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'viewer' })}>
                                    <User className="mr-2 h-4 w-4" /> Zum Zuschauer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSetTimeout(p.id, 24)}>
                                    <Clock3 className="mr-2 h-4 w-4" /> Timeout 24h
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSetTimeout(p.id, 24 * 7)}>
                                    <Clock3 className="mr-2 h-4 w-4" /> Timeout 7 Tage
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleClearTimeout(p.id)}>
                                    <Undo2 className="mr-2 h-4 w-4" /> Timeout aufheben
                                  </DropdownMenuItem>
                                  <ResetPasswordDialog userEmail={p.email} userName={p.full_name || 'User'} />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProfile(p.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Löschen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile List View (Simplified) */}
              <div className="lg:hidden space-y-4">
                {filteredProfiles.map(p => (
                  <div key={p.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/profil/${p.id}`} className="font-bold hover:underline">{p.full_name || 'Unbekannt'}</Link>
                        <p className="text-xs text-muted-foreground break-all">{p.email}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{p.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Plattform Aufgaben</CardTitle>
                <CardDescription>Hier kannst du alle To-Dos zentral verwalten.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Aufgaben suchen..."
                    className="pl-9"
                    value={todoSearch}
                    onChange={(e) => setTodoSearch(e.target.value)}
                  />
                </div>
                <AddTodoDialog />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Zuständig</TableHead>
                      <TableHead>Frist</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTodos.map((todo) => {
                      const deadline = todo.deadline_date ? toDate(todo.deadline_date) : null
                      const isSubtask = !!todo.parentId

                      return (
                        <TableRow key={todo.id}>
                          <TableCell className="font-medium max-w-[250px] truncate" title={todo.title}>
                            <div className="flex items-center gap-2">
                              {isSubtask && <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />}
                              {todo.title}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {todo.assigned_to_user_name || todo.assigned_to_group || todo.assigned_to_class || '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {deadline ? format(deadline, 'dd.MM.yy', { locale: de }) : '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(todo.status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {isSubtask ? 'Unteraufgabe' : 'Hauptaufgabe'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditTodoDialog todo={todo} />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteTodo(todo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Plattform Termine</CardTitle>
                <CardDescription>Hier kannst du alle Termine zentral verwalten.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Termine suchen..."
                    className="pl-9"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                  />
                </div>
                <AddEventDialog />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Titel</TableHead>
                      <TableHead>Ort</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => {
                      const eventDate = toDate(event.event_date)
                      const isPast = eventDate.getTime() < Date.now()

                      return (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap font-medium">
                            {format(eventDate, 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={event.title}>
                            {event.title}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground">
                            {event.location || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isPast ? 'secondary' : 'default'} className="text-[10px]">
                              {isPast ? 'Vergangen' : 'Bevorstehend'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditEventDialog event={event} />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
