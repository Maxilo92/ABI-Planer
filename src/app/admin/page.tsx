'use client'

import { Profile } from '@/types/database'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Shield, User, Trash2, Clock3, Undo2 } from 'lucide-react'
import { ResetPasswordDialog } from '@/components/modals/ResetPasswordDialog'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
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
    const q = query(collection(db, 'profiles'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
      setLoading(false)
    })

    return () => unsubscribe()
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

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Admin Dashboard...</div>
  }

  if (!profile || !canManageUsers) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Nutzerverwaltung und Rechtevergabe</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benutzerkonten</CardTitle>
          <CardDescription>
            Hier kannst du Rollen, Kurse und Gruppen verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 lg:hidden">
            {profiles.map((p) => {
              const isMainAdminAccount = p.role === 'admin_main' || p.role === 'admin'
              const isSelf = p.id === profile.id
              const canManageRoleActions = !isMainAdminAccount && !isSelf

              return (
                <div key={p.id} className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/profil/${p.id}`} className="font-semibold hover:underline break-words">
                        {p.full_name || 'Unbekannt'}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1 break-all">{p.email}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" disabled={!canManageRoleActions} title={!canManageRoleActions ? 'Rollenaktionen für diesen Account gesperrt' : undefined}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'admin' })}>
                          <Shield className="mr-2 h-4 w-4" /> Zum Admin machen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'admin_co' })}>
                          <Shield className="mr-2 h-4 w-4" /> Zum Co-Admin machen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'planner' })}>
                          <Shield className="mr-2 h-4 w-4" /> Zum Planer machen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'viewer' })}>
                          <User className="mr-2 h-4 w-4" /> Zum Zuschauer machen
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
                          <Trash2 className="mr-2 h-4 w-4" /> Fuer immer loeschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {p.role}
                    </Badge>
                    {(p.role === 'admin_main' || p.role === 'admin') && (
                      <Badge variant="secondary">Unantastbar</Badge>
                    )}
                    {p.timeout_until && new Date(p.timeout_until).getTime() > Date.now() && (
                      <Badge variant="destructive">
                        Timeout bis {new Date(p.timeout_until).toLocaleDateString('de-DE')}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Kurs</label>
                      <select
                        className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                        value={p.class_name || ''}
                        onChange={(e) => handleUpdateProfile(p.id, { class_name: e.target.value || null })}
                        disabled={!canManageUsers}
                      >
                        <option value="">Kein Kurs</option>
                        {courses.map((course) => (
                          <option key={course} value={course}>
                            {course}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Gruppe</label>
                      <select
                        className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                        value={p.planning_group || ''}
                        onChange={(e) => handleUpdateProfile(p.id, { planning_group: e.target.value || null })}
                        disabled={!canManageUsers}
                      >
                        <option value="">Keine Gruppe</option>
                        {planningGroups.map((groupName) => (
                          <option key={groupName} value={groupName}>
                            {groupName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead>Gruppe</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/profil/${p.id}`} className="hover:underline focus-visible:underline">
                        {p.full_name || 'Unbekannt'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {p.role}
                      </Badge>
                      {p.timeout_until && new Date(p.timeout_until).getTime() > Date.now() && (
                        <Badge variant="destructive" className="ml-2">
                          Timeout bis {new Date(p.timeout_until).toLocaleDateString('de-DE')}
                        </Badge>
                      )}
                      {(p.role === 'admin_main' || p.role === 'admin') && (
                        <Badge variant="secondary" className="ml-2">
                          Unantastbar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const canEditAssignments = canManageUsers

                        return (
                          <select
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            value={p.class_name || ''}
                            onChange={(e) => handleUpdateProfile(p.id, { class_name: e.target.value || null })}
                            disabled={!canEditAssignments}
                          >
                            <option value="">Kein Kurs</option>
                            {courses.map((course) => (
                              <option key={course} value={course}>
                                {course}
                              </option>
                            ))}
                          </select>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const canEditAssignments = canManageUsers

                        return (
                          <select
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            value={p.planning_group || ''}
                            onChange={(e) => handleUpdateProfile(p.id, { planning_group: e.target.value || null })}
                            disabled={!canEditAssignments}
                          >
                            <option value="">Keine Gruppe</option>
                            {planningGroups.map((groupName) => (
                              <option key={groupName} value={groupName}>
                                {groupName}
                              </option>
                            ))}
                          </select>
                        )
                      })()}
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
                            <Button variant="ghost" size="icon" disabled={!canManageRoleActions} title={!canManageRoleActions ? 'Rollenaktionen für diesen Account gesperrt' : undefined}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'admin' })}>
                            <Shield className="mr-2 h-4 w-4" /> Zum Admin machen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'admin_co' })}>
                            <Shield className="mr-2 h-4 w-4" /> Zum Co-Admin machen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'planner' })}>
                            <Shield className="mr-2 h-4 w-4" /> Zum Planer machen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'viewer' })}>
                            <User className="mr-2 h-4 w-4" /> Zum Zuschauer machen
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
                            <Trash2 className="mr-2 h-4 w-4" /> Fuer immer loeschen
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
        </CardContent>
      </Card>
    </div>
  )
}
