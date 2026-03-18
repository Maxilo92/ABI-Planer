'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { User, MoonStar, MessageSquarePlus, LogOut, Users, Save, Plus, Trash2 } from 'lucide-react'
import { collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AddFeedbackDialog } from '@/components/modals/AddFeedbackDialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface CourseRow {
  id: string
  before: string
  after: string
}

export default function SettingsPage() {
  const { profile, loading } = useAuth()
  const [courseRows, setCourseRows] = useState<CourseRow[]>([])
  const [savingCourses, setSavingCourses] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
  }, [loading, profile, router])

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (settingsDoc) => {
      const courses = settingsDoc.exists() ? settingsDoc.data().courses : undefined
      const normalizedCourses = Array.isArray(courses) && courses.length > 0 ? courses : ['12A', '12B', '12C', '12D']

      setCourseRows(
        normalizedCourses.map((course: string, index: number) => ({
          id: `course-${index}`,
          before: course,
          after: course,
        }))
      )
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
      { collectionName: 'profiles', field: 'planning_group' },
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
    </div>
  )
}
