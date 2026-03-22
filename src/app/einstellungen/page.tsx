'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { User, MoonStar, MessageSquarePlus, LogOut, Users, Save, Plus, Trash2, Sparkles, AlertTriangle } from 'lucide-react'
import { collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AddFeedbackDialog } from '@/components/modals/AddFeedbackDialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Profile } from '@/types/database'
import { logAction } from '@/lib/logging'

interface CourseRow {
  id: string
  before: string
  after: string
}

interface PlanningGroupRow {
  id: string
  before: string
  after: string
  leaderUserId: string
}

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const [courseRows, setCourseRows] = useState<CourseRow[]>([])
  const [originalCourses, setOriginalCourses] = useState<string[]>([])
  const [planningGroupRows, setPlanningGroupRows] = useState<PlanningGroupRow[]>([])
  const [originalGroups, setOriginalGroups] = useState<{name: string, leader_user_id: string | null}[]>([])
  const [planners, setPlanners] = useState<Profile[]>([])
  const [savingCourses, setSavingCourses] = useState(false)
  const [savingGroups, setSavingGroups] = useState(false)
  const [isGuardOpen, setIsGuardOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)
  const router = useRouter()

  // Check for unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    // Check courses
    const currentCourses = courseRows.map(r => r.after.trim()).filter(Boolean)
    const coursesChanged = JSON.stringify(currentCourses) !== JSON.stringify(originalCourses)
    
    // Check groups
    const currentGroups = planningGroupRows.map(r => ({ 
      name: r.after.trim(), 
      leader_user_id: r.leaderUserId || null 
    })).filter(g => g.name)
    const groupsChanged = JSON.stringify(currentGroups) !== JSON.stringify(originalGroups)
    
    return coursesChanged || groupsChanged
  }, [courseRows, planningGroupRows, originalCourses, originalGroups])

  // Handle internal navigation clicks
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (anchor && anchor.href && anchor.target !== '_blank') {
        const url = new URL(anchor.href)
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          if (hasUnsavedChanges()) {
            e.preventDefault()
            setNextPath(url.pathname + url.search)
            setIsGuardOpen(true)
          }
        }
      }
    }

    window.addEventListener('click', handleAnchorClick, true)
    return () => window.removeEventListener('click', handleAnchorClick, true)
  }, [courseRows, planningGroupRows, originalCourses, originalGroups, hasUnsavedChanges])

  const handleConfirmNavigation = () => {
    setIsGuardOpen(false)
    if (nextPath) {
      router.push(nextPath)
    }
  }

  const handleSaveAll = async () => {
    setSavingCourses(true)
    setSavingGroups(true)
    try {
      await Promise.all([handleSaveCourses(), handleSavePlanningGroups()])
      toast.success('Alles gespeichert.')
      if (nextPath) {
        router.push(nextPath)
      }
    } catch (error) {
      console.error('Error saving all:', error)
    } finally {
      setSavingCourses(false)
      setSavingGroups(false)
      setIsGuardOpen(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [loading, user, router])

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (settingsDoc) => {
      const courses = settingsDoc.exists() ? settingsDoc.data().courses : undefined
      const planningGroups = settingsDoc.exists() ? settingsDoc.data().planning_groups : undefined
      const normalizedCourses = Array.isArray(courses) && courses.length > 0 ? courses : ['12A', '12B', '12C', '12D']
      const normalizedGroups = Array.isArray(planningGroups) && planningGroups.length > 0
        ? planningGroups
        : [{ name: 'Ballplanung', leader_user_id: null }, { name: 'Gelder sammeln', leader_user_id: null }]

      setOriginalCourses(normalizedCourses)
      setCourseRows(
        normalizedCourses.map((course: string, index: number) => ({
          id: `course-${index}`,
          before: course,
          after: course,
        }))
      )

      setOriginalGroups(normalizedGroups.map((g: any) => ({ name: g.name, leader_user_id: g.leader_user_id || null })))
      setPlanningGroupRows(
        normalizedGroups
          .filter((entry: { name?: string }) => typeof entry?.name === 'string' && entry.name.trim().length > 0)
          .map((entry: { name: string; leader_user_id?: string | null }, index: number) => ({
            id: `group-${index}`,
            before: entry.name,
            after: entry.name,
            leaderUserId: entry.leader_user_id || '',
          }))
      )
    })

    return () => unsubscribe()
  }, [])

  // Warning for page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [courseRows, planningGroupRows, originalCourses, originalGroups, hasUnsavedChanges])

  useEffect(() => {
    const approvedProfilesRef = query(collection(db, 'profiles'), where('is_approved', '==', true))
    const unsubscribe = onSnapshot(approvedProfilesRef, (snapshot) => {
      const eligibleLeaders = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Profile))
        .filter((entry) => entry.role === 'planner' || entry.role.includes('admin'))

      setPlanners(eligibleLeaders)
    })

    return () => unsubscribe()
  }, [])

  const canManageCourses = !!profile?.is_approved && (
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  )

  const canMigrateCourses = !!profile?.is_approved && (
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  )

  const canMigrateGroups = canMigrateCourses

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const addCourseRow = () => {
    setCourseRows((prev) => [...prev, { id: `course-new-${Date.now()}`, before: '', after: '' }])
  }

  const removeCourseRow = (id: string) => {
    setCourseRows((prev) => prev.filter((row) => row.id !== id))
  }

  const updateCourseRow = (id: string, value: string) => {
    setCourseRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, after: value } : row))
    )
  }

  const migrateCourseName = async (from: string, to: string) => {
    const migrationTargets = [
      { collectionName: 'profiles', field: 'class_name' },
      { collectionName: 'todos', field: 'assigned_to_class' },
      { collectionName: 'finances', field: 'responsible_class' },
    ]

    for (const target of migrationTargets) {
      const docsToUpdate = await getDocs(query(collection(db, target.collectionName), where(target.field, '==', from)))
      if (docsToUpdate.empty) continue

      let batch = writeBatch(db)
      let operations = 0

      for (const docSnap of docsToUpdate.docs) {
        batch.update(doc(db, target.collectionName, docSnap.id), { [target.field]: to })
        operations += 1

        if (operations >= 400) {
          await batch.commit()
          batch = writeBatch(db)
          operations = 0
        }
      }

      if (operations > 0) {
        await batch.commit()
      }
    }
  }

  const addPlanningGroupRow = () => {
    setPlanningGroupRows((prev) => [
      ...prev,
      { id: `group-new-${Date.now()}`, before: '', after: '', leaderUserId: '' },
    ])
  }

  const removePlanningGroupRow = (id: string) => {
    setPlanningGroupRows((prev) => prev.filter((row) => row.id !== id))
  }

  const updatePlanningGroupName = (id: string, value: string) => {
    setPlanningGroupRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, after: value } : row))
    )
  }

  const updatePlanningGroupLeader = (id: string, leaderUserId: string) => {
    setPlanningGroupRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, leaderUserId } : row))
    )
  }

  const migratePlanningGroupName = async (from: string, to: string) => {
    const migrationTargets = [
      { collectionName: 'profiles', field: 'planning_group' },
      { collectionName: 'todos', field: 'assigned_to_group' },
    ]

    for (const target of migrationTargets) {
      const docsToUpdate = await getDocs(query(collection(db, target.collectionName), where(target.field, '==', from)))
      if (docsToUpdate.empty) continue

      let batch = writeBatch(db)
      let operations = 0

      for (const docSnap of docsToUpdate.docs) {
        batch.update(doc(db, target.collectionName, docSnap.id), { [target.field]: to })
        operations += 1

        if (operations >= 400) {
          await batch.commit()
          batch = writeBatch(db)
          operations = 0
        }
      }

      if (operations > 0) {
        await batch.commit()
      }
    }
  }

  const handleSaveCourses = async () => {
    if (!canManageCourses) return

    const normalizedRows = courseRows.map((row) => ({ ...row, after: row.after.trim() }))
    const courses = normalizedRows
      .map((row) => row.after)
      .filter((value, index, self) => value.length > 0 && self.indexOf(value) === index)

    const renamedCourses = normalizedRows.filter(
      (row) => row.before.trim().length > 0 && row.after.length > 0 && row.before !== row.after
    )

    if (courses.length === 0) {
      toast.error('Bitte mindestens einen Kurs eintragen.')
      return
    }

    try {
      setSavingCourses(true)
      await setDoc(doc(db, 'settings', 'config'), { courses }, { merge: true })

      if (renamedCourses.length > 0) {
        if (!canMigrateCourses) {
          toast.warning('Kursnamen wurden gespeichert. Datenmigration ist nur für Admins möglich.')
        } else {
          for (const row of renamedCourses) {
            await migrateCourseName(row.before, row.after)
          }
          toast.success('Kurse aktualisiert und bestehende Zuweisungen umbenannt.')
        }
      } else {
        toast.success('Kurssystem aktualisiert.')
      }

      if (user) {
        await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
          field: 'courses',
          total_courses: courses.length,
          renamed_courses: renamedCourses.map((row) => ({ before: row.before, after: row.after })),
        })
      }
    } catch (error) {
      console.error('Error saving courses:', error)
      toast.error('Kurse konnten nicht gespeichert werden.')
    } finally {
      setSavingCourses(false)
    }
  }

  const handleSavePlanningGroups = async () => {
    if (!canManageCourses) return

    const normalizedRows = planningGroupRows.map((row) => ({
      ...row,
      after: row.after.trim(),
      leaderUserId: row.leaderUserId.trim(),
    }))

    const seenGroupNames = new Set<string>()
    const planning_groups = normalizedRows
      .filter((row) => row.after.length > 0)
      .filter((row) => {
        if (seenGroupNames.has(row.after)) return false
        seenGroupNames.add(row.after)
        return true
      })
      .map((row) => {
        const leader = planners.find((entry) => entry.id === row.leaderUserId)
        return {
          name: row.after,
          leader_user_id: leader?.id || null,
          leader_name: leader?.full_name || null,
        }
      })

    const renamedGroups = normalizedRows.filter(
      (row) => row.before.trim().length > 0 && row.after.length > 0 && row.before !== row.after
    )

    if (planning_groups.length === 0) {
      toast.error('Bitte mindestens eine Planungsgruppe eintragen.')
      return
    }

    try {
      setSavingGroups(true)
      await setDoc(doc(db, 'settings', 'config'), { planning_groups }, { merge: true })

      if (renamedGroups.length > 0) {
        if (!canMigrateGroups) {
          toast.warning('Gruppen wurden gespeichert. Datenmigration ist nur für Admins möglich.')
        } else {
          for (const row of renamedGroups) {
            await migratePlanningGroupName(row.before, row.after)
          }
          toast.success('Planungsgruppen aktualisiert und bestehende Zuordnungen umbenannt.')
        }
      } else {
        toast.success('Planungsgruppen aktualisiert.')
      }

      if (user) {
        await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
          field: 'planning_groups',
          total_groups: planning_groups.length,
          renamed_groups: renamedGroups.map((row) => ({ before: row.before, after: row.after })),
        })
      }
    } catch (error) {
      console.error('Error saving planning groups:', error)
      toast.error('Planungsgruppen konnten nicht gespeichert werden.')
    } finally {
      setSavingGroups(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Lade Einstellungen...</div>
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Hier findest du persönliche Optionen, ohne den Header zu überladen.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5" /> Konto
          </CardTitle>
          <CardDescription>Profil ansehen und abmelden.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            render={
              <Link href="/profil" className="w-full sm:w-auto">
                Profil öffnen
              </Link>
            }
          />
          <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto gap-2">
            <LogOut className="h-4 w-4" /> Abmelden
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MoonStar className="h-5 w-5" /> Darstellung
          </CardTitle>
          <CardDescription>Hell, dunkel oder automatisch nach System.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>



      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquarePlus className="h-5 w-5" /> Feedback
          </CardTitle>
          <CardDescription>Teile Bugs, Ideen und Feature-Wünsche.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddFeedbackDialog />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5" /> Kurssystem
          </CardTitle>
          <CardDescription>
            Kurse umbenennen, hinzufügen oder entfernen. Umbenennungen werden auf bestehende Zuordnungen angewendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {courseRows.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <Input
                  value={row.after}
                  onChange={(e) => updateCourseRow(row.id, e.target.value)}
                  placeholder="z.B. 12A"
                  disabled={!canManageCourses}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCourseRow(row.id)}
                  disabled={!canManageCourses || courseRows.length <= 1}
                  title="Kurs entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addCourseRow} disabled={!canManageCourses} className="gap-2">
            <Plus className="h-4 w-4" /> Kurs hinzufügen
          </Button>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {canManageCourses
                ? canMigrateCourses
                  ? 'Als Admin werden Umbenennungen automatisch in Profilen, Todos und Finanzen übernommen.'
                  : 'Du kannst Kurse ändern, aber Datenmigration bei Umbenennungen erfordert Admin-Rechte.'
                : 'Nur Planer/Admins können das Kurssystem bearbeiten.'}
            </p>
            <Button onClick={handleSaveCourses} disabled={!canManageCourses || savingCourses} className="gap-2">
              <Save className="h-4 w-4" /> {savingCourses ? 'Speichern...' : 'Kurse speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5" /> Planungsgruppen
          </CardTitle>
          <CardDescription>
            Plane Teams wie Ballplanung oder Gelder sammeln. Jede Gruppe kann einen Gruppenleiter erhalten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {planningGroupRows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <Input
                  value={row.after}
                  onChange={(e) => updatePlanningGroupName(row.id, e.target.value)}
                  placeholder="z.B. Ballplanung"
                  disabled={!canManageCourses}
                />
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={row.leaderUserId}
                  onChange={(e) => updatePlanningGroupLeader(row.id, e.target.value)}
                  disabled={!canManageCourses}
                >
                  <option value="">Kein Gruppenleiter</option>
                  {planners.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.full_name || entry.email}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlanningGroupRow(row.id)}
                  disabled={!canManageCourses || planningGroupRows.length <= 1}
                  title="Planungsgruppe entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addPlanningGroupRow} disabled={!canManageCourses} className="gap-2">
            <Plus className="h-4 w-4" /> Planungsgruppe hinzufügen
          </Button>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {canManageCourses
                ? canMigrateGroups
                  ? 'Als Admin werden Umbenennungen automatisch in Profilen und Todos übernommen.'
                  : 'Du kannst Gruppen ändern, aber Datenmigration bei Umbenennungen erfordert Admin-Rechte.'
                : 'Nur Planer/Admins können Planungsgruppen bearbeiten.'}
            </p>
            <Button onClick={handleSavePlanningGroups} disabled={!canManageCourses || savingGroups} className="gap-2">
              <Save className="h-4 w-4" /> {savingGroups ? 'Speichern...' : 'Gruppen speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Guard Dialog */}
      <Dialog open={isGuardOpen} onOpenChange={setIsGuardOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Ungespeicherte Änderungen
            </DialogTitle>
            <DialogDescription>
              Du hast Änderungen vorgenommen, die noch nicht gespeichert wurden. Möchtest du diese jetzt speichern oder die Seite verlassen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button variant="ghost" className="w-full" onClick={handleConfirmNavigation}>
              Verwerfen & Verlassen
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsGuardOpen(false)}>
              Abbrechen
            </Button>
            <Button className="w-full" onClick={handleSaveAll} disabled={savingCourses || savingGroups}>
              Speichern & Fortfahren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
