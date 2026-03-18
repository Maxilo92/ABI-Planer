'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { User, MoonStar, MessageSquarePlus, LogOut, Users, Save } from 'lucide-react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AddFeedbackDialog } from '@/components/modals/AddFeedbackDialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { profile, loading } = useAuth()
  const [coursesInput, setCoursesInput] = useState('')
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
      if (Array.isArray(courses) && courses.length > 0) {
        setCoursesInput(courses.join('\n'))
      } else {
        setCoursesInput('12A\n12B\n12C\n12D')
      }
    })

    return () => unsubscribe()
  }, [])

  const canManageCourses = !!profile?.is_approved && (
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  )

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const handleSaveCourses = async () => {
    if (!canManageCourses) return

    const courses = coursesInput
      .split('\n')
      .map((value) => value.trim())
      .filter((value, index, self) => value.length > 0 && self.indexOf(value) === index)

    if (courses.length === 0) {
      toast.error('Bitte mindestens einen Kurs eintragen.')
      return
    }

    try {
      setSavingCourses(true)
      await setDoc(doc(db, 'settings', 'config'), { courses }, { merge: true })
      toast.success('Kurssystem aktualisiert.')
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
            Kurse umbenennen, hinzufügen oder entfernen (eine Zeile pro Kurs).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={coursesInput}
            onChange={(e) => setCoursesInput(e.target.value)}
            rows={6}
            placeholder={'12A\n12B\n12C\n12D'}
            disabled={!canManageCourses}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {canManageCourses ? 'Änderungen wirken sofort in Registrierung, Todos und Finanzen.' : 'Nur Planer/Admins können das Kurssystem bearbeiten.'}
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
