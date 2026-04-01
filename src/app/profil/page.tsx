'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Mail, Shield, Calendar, Users, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { toDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth, db } from '@/lib/firebase'
import { deleteUser, sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { doc, deleteDoc, setDoc, updateDoc, getDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { TOTPSetup } from '@/components/admin/TOTPSetup'
import { useFriendSystem } from '@/hooks/useFriendSystem'

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const { friendships, incomingRequests, outgoingRequests } = useFriendSystem()
  const [fullName, setFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [courses, setCourses] = useState<string[]>(['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7'])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [savingCourse, setSavingCourse] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        const configuredCourses = settingsSnap.exists() ? settingsSnap.data().courses : undefined
        if (Array.isArray(configuredCourses) && configuredCourses.length > 0) {
          const normalizedCourses = configuredCourses.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          if (normalizedCourses.length > 0) {
            setCourses(normalizedCourses)
          }
        }
      } catch (loadError) {
        console.error('Error loading courses:', loadError)
      }
    }

    loadCourses()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [user, loading, router])

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setSelectedCourse(profile?.class_name || '')
  }, [profile?.full_name, profile?.class_name])

  if (loading) {
    return (
      <div className="space-y-12 pb-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b pb-6">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 py-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const userInitial = profile.full_name?.substring(0, 1).toUpperCase() || 'U'
  const userCourse = profile.class_name
  const plannerGroup = profile.planning_groups?.join(', ')

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedName = fullName.trim()

    if (normalizedName.length < 2) {
      toast.error('Bitte gib einen gültigen Namen ein.')
      return
    }

    try {
      setSavingName(true)
      await updateProfile(user, { displayName: normalizedName })
      await updateDoc(doc(db, 'profiles', user.uid), { full_name: normalizedName })

      await logAction('PROFILE_UPDATED', user.uid, profile.full_name, {
        field: 'full_name',
        value: normalizedName,
      })

      toast.success('Name aktualisiert.')
      router.refresh()
    } catch (error) {
      console.error('Error updating full name:', error)
      toast.error('Name konnte nicht aktualisiert werden.')
    } finally {
      setSavingName(false)
    }
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCourse) {
      toast.error('Bitte wähle einen Kurs aus.')
      return
    }

    try {
      setSavingCourse(true)
      await updateDoc(doc(db, 'profiles', user.uid), { class_name: selectedCourse })

      await logAction('PROFILE_UPDATED', user.uid, profile.full_name, {
        field: 'class_name',
        value: selectedCourse,
      })

      toast.success('Kurs aktualisiert.')
      router.refresh()
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('Kurs konnte nicht aktualisiert werden.')
    } finally {
      setSavingCourse(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user.email) {
      toast.error('Keine E-Mail-Adresse gefunden.')
      return
    }

    try {
      setSendingReset(true)
      await sendPasswordResetEmail(auth, user.email)
      toast.success('E-Mail zum Ändern des Passworts wurde gesendet.')
    } catch (error) {
      console.error('Error sending password reset email:', error)
      toast.error('Passwort-E-Mail konnte nicht gesendet werden.')
    } finally {
      setSendingReset(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (profile.role === 'admin_main' || profile.role === 'admin') {
      toast.error('Main Admins können ihr Konto nicht löschen. Übertrage die Rolle zuerst auf einen anderen Nutzer.')
      return
    }

    const confirmation = window.prompt('Zum Bestätigen bitte KONTO LOESCHEN eingeben:')
    if (confirmation !== 'KONTO LOESCHEN') {
      toast.error('Kontolöschung abgebrochen.')
      return
    }

    const profileRef = doc(db, 'profiles', user.uid)
    const { id: _profileId, ...profileData } = profile

    try {
      setDeletingAccount(true)
      await deleteDoc(profileRef)

      try {
        await deleteUser(user)
      } catch (deleteAuthError: any) {
        await setDoc(profileRef, profileData)
        throw deleteAuthError
      }

      await logAction('PROFILE_DELETED', user.uid, profile.full_name, {
        self_delete: true,
      })

      toast.success('Konto wurde gelöscht.')
      router.push('/register')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      if (error?.code === 'auth/requires-recent-login') {
        toast.error('Bitte melde dich neu an und versuche das Löschen erneut.')
      } else {
        toast.error('Konto konnte nicht gelöscht werden.')
      }
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mein Konto</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b pb-6">
            <Avatar size="lg" className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <Badge variant={profile.role.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px]">
                  {getRoleLabel(profile.role)}
                </Badge>
                {userCourse && (
                  <Badge variant="outline" className="uppercase text-[10px] font-bold">
                    Kurs {userCourse}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 py-6">
            <div className="flex items-center gap-4">
              <div className="bg-muted p-2 rounded-full">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Vollständiger Name</p>
                <p className="text-sm text-muted-foreground mt-1">{profile.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-muted p-2 rounded-full">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">E-Mail Adresse</p>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-muted p-2 rounded-full">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Verifizierungs-Status</p>
                <div className="mt-1">
                  {user.emailVerified ? (
                    <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verifiziertes Mitglied
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Wartet auf Verifizierung
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {profile.role === 'planner' && (
              <div className="flex items-center gap-4 border-t pt-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">Planungsgruppe</p>
                  <p className="text-sm text-primary font-bold mt-1">
                    {plannerGroup || 'Noch keiner Gruppe zugewiesen'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 border-t pt-4">
              <div className="bg-muted p-2 rounded-full">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Mitglied seit</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.created_at ? format(toDate(profile.created_at), 'PPP', { locale: de }) : 'Unbekannt'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Freundesystem</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Freunde</p>
                <p className="font-semibold">{friendships.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Eingang</p>
                <p className="font-semibold">{incomingRequests.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ausgang</p>
                <p className="font-semibold">{outgoingRequests.length}</p>
              </div>
            </div>
            <Button variant="outline" className="sm:w-auto" render={<Link href="/profil/freunde">Freunde verwalten</Link>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontoverwaltung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleUpdateName} className="space-y-3">
              <Label htmlFor="profile-full-name">Name ändern</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="profile-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dein vollständiger Name"
                  required
                />
                <Button type="submit" disabled={savingName}>
                  {savingName ? 'Speichere...' : 'Name speichern'}
                </Button>
              </div>
            </form>

            <form onSubmit={handleUpdateCourse} className="space-y-3 border-t pt-4">
              <Label htmlFor="profile-course">Kurs ändern</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  id="profile-course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={savingCourse}>
                  {savingCourse ? 'Speichere...' : 'Kurs speichern'}
                </Button>
              </div>
            </form>

            <div className="space-y-3 border-t pt-4">
              <Label>Passwort ändern</Label>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handlePasswordReset} disabled={sendingReset}>
                {sendingReset ? 'Sende E-Mail...' : 'Passwort ändern'}
              </Button>
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label>Zwei-Faktor-Authentisierung (2FA)</Label>
              <div className="w-full sm:w-auto">
                <TOTPSetup profile={profile} />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label className="text-destructive">Konto löschen</Label>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deletingAccount}>
                {deletingAccount ? 'Lösche Konto...' : 'Konto löschen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <TeacherAlbum initialLimit={5} />
      </div>
    </div>
  )
}
