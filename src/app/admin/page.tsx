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
import { MoreVertical, Check, Shield, User, Trash2 } from 'lucide-react'
import { ResetPasswordDialog } from '@/components/modals/ResetPasswordDialog'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth()
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

    const targetIsMainAdmin = target.role === 'admin_main' || target.role === 'admin'
    if (targetIsMainAdmin && profile?.id !== id) {
      return
    }

    if (id === profile?.id && updates.role && updates.role !== target.role) {
      return
    }

    try {
      const docRef = doc(db, 'profiles', id)
      await updateDoc(docRef, updates)
    } catch (err) {
      console.error('Error updating profile:', err)
    }
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
        <p className="text-muted-foreground text-sm">Nutzerverwaltung & Rechtevergabe</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benutzerkonten</CardTitle>
          <CardDescription>
            Hier kannst du neue Schüler freischalten und Rollen zuweisen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
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
                      <Badge variant={p.is_approved ? 'secondary' : 'destructive'}>
                        {p.is_approved ? 'Freigeschaltet' : 'Wartet'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {p.role}
                      </Badge>
                      {(p.role === 'admin_main' || p.role === 'admin') && (
                        <Badge variant="secondary" className="ml-2">
                          Unantastbar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isMainAdminAccount = p.role === 'admin_main' || p.role === 'admin'
                        const isSelf = p.id === profile.id
                        const canEditThisUser = !isMainAdminAccount && !isSelf

                        return (
                          <select
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            value={p.class_name || ''}
                            onChange={(e) => handleUpdateProfile(p.id, { class_name: e.target.value || null })}
                            disabled={!canEditThisUser}
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
                        const isMainAdminAccount = p.role === 'admin_main' || p.role === 'admin'
                        const isSelf = p.id === profile.id
                        const canEditThisUser = !isMainAdminAccount && !isSelf

                        return (
                          <select
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            value={p.planning_group || ''}
                            onChange={(e) => handleUpdateProfile(p.id, { planning_group: e.target.value || null })}
                            disabled={!canEditThisUser}
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
                        const canEditThisUser = !isMainAdminAccount && !isSelf

                        return (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" disabled={!canEditThisUser} title={!canEditThisUser ? 'Dieser Account kann nicht bearbeitet werden' : undefined}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          {!p.is_approved && (
                            <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { is_approved: true })}>
                              <Check className="mr-2 h-4 w-4" /> Freischalten
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'planner' })}>
                            <Shield className="mr-2 h-4 w-4" /> Zum Planer machen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'viewer' })}>
                            <User className="mr-2 h-4 w-4" /> Zum Zuschauer machen
                          </DropdownMenuItem>
                          
                          <ResetPasswordDialog userEmail={p.email} userName={p.full_name || 'User'} />
                          
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProfile(p.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Profil löschen
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
