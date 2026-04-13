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

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const [courseRows, setCourseRows] = useState<CourseRow[]>([])
  const [originalCourses, setOriginalCourses] = useState<string[]>([])
  const [savingCourses, setSavingCourses] = useState(false)
  const [isGuardOpen, setIsGuardOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)
  const router = useRouter()

  // Check for unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const currentCourses = courseRows.map(r => r.after.trim()).filter(Boolean)
    return JSON.stringify(currentCourses) !== JSON.stringify(originalCourses)
  }, [courseRows, originalCourses])

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
  }, [courseRows, originalCourses, hasUnsavedChanges])

  const handleConfirmNavigation = () => {
    setIsGuardOpen(false)
    if (nextPath) {
      router.push(nextPath)
    }
  }

  const handleSaveAll = async () => {
    setSavingCourses(true)
    try {
      await handleSaveCourses()
      toast.success('Alles gespeichert.')
      if (nextPath) {
        router.push(nextPath)
      }
    } catch (error) {
      console.error('Error saving all:', error)
    } finally {
      setSavingCourses(false)
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
      const normalizedCourses = Array.isArray(courses) && courses.length > 0 ? courses : ['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7']

      setOriginalCourses(normalizedCourses)
      setCourseRows(
        normalizedCourses.map((course: string, index: number) => ({
          id: `course-${index}`,
          before: course,
          after: course,
        }))
      )
    }, (error) => {
      console.error('SettingsPage: Error listening to settings config:', error)
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
  }, [courseRows, originalCourses, hasUnsavedChanges])

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
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Schnellzugriff</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex flex-wrap gap-2">
          <a href="#profil" className="inline-flex"><Button variant="outline" size="sm">Profil</Button></a>
          <a href="#darstellung" className="inline-flex"><Button variant="outline" size="sm">Darstellung</Button></a>
          <a href="#feedback" className="inline-flex"><Button variant="outline" size="sm">Feedback</Button></a>
          <a href="#boni" className="inline-flex"><Button variant="outline" size="sm">Boni</Button></a>
          <a href="#konto" className="inline-flex"><Button variant="outline" size="sm">Konto</Button></a>
          {canManageCourses && (
            <a href="#kurssystem" className="inline-flex"><Button variant="outline" size="sm">Kurssystem</Button></a>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3" id="profil">
        <h2 className="text-lg font-bold tracking-tight">Persönlich</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" /> Profil
            </CardTitle>
            <CardDescription>Dein öffentliches Profil ansehen und bearbeiten.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              render={
                <Link href="/profil">
                  Profil öffnen
                </Link>
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3" id="darstellung">
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
      </section>

      <section className="space-y-3" id="feedback">
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
      </section>

      <section className="space-y-3" id="boni">
        <h2 className="text-lg font-bold tracking-tight">Boni</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" /> Freunde einladen
            </CardTitle>
            <CardDescription>Sammle Bonus-Booster für dich und deine Freunde.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto gap-2"
              render={
                <Link href="/einstellungen/referrals">
                  <Users className="h-4 w-4" /> Einladungs-Dashboard öffnen
                </Link>
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3" id="konto">
        <h2 className="text-lg font-bold tracking-tight">Konto</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <LogOut className="h-5 w-5 text-destructive" /> Abmelden
            </CardTitle>
            <CardDescription>Beende deine aktuelle Sitzung auf diesem Gerät.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto gap-2">
              <LogOut className="h-4 w-4" /> Abmelden
            </Button>
          </CardContent>
        </Card>
      </section>

      {canManageCourses && (
        <section className="space-y-6" id="verwaltung">
          <h2 className="text-lg font-bold tracking-tight">Verwaltung</h2>
          <Card id="kurssystem">
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
                      placeholder="z.B. Kurs 1"
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

        </section>
      )}

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
            <Button className="w-full" onClick={handleSaveAll} disabled={savingCourses}>
              Speichern & Fortfahren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
