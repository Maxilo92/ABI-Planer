'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteUser, sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth'
import { User, MoonStar, MessageSquarePlus, LogOut, Users, Save, Plus, Trash2, Sparkles, AlertTriangle, Globe, ShieldCheck, Bell, BellOff, Image as ImageIcon, Menu, X, ChevronRight } from 'lucide-react'
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where, writeBatch, deleteDoc } from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useFCM } from '@/hooks/useFCM'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AccentThemeSelector } from '@/components/layout/AccentThemeSelector'
import { AddFeedbackDialog } from '@/components/modals/AddFeedbackDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { TOTPSetup } from '@/components/admin/TOTPSetup'
import { usePopupManager } from '@/modules/popup/usePopupManager'

interface SettingsNavItem {
  id: string
  label: string
  icon: React.ReactNode
  disabled?: boolean
}

interface SettingsNavItem {
  id: string
  label: string
  icon: React.ReactNode
  disabled?: boolean
}

interface CourseRow {
  id: string
  before: string
  after: string
}

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const { permission, requestPermission, disableNotifications, isSupported } = useFCM()
  const { prompt } = usePopupManager()
  const [courseRows, setCourseRows] = useState<CourseRow[]>([])
  const [originalCourses, setOriginalCourses] = useState<string[]>([])
  const [savingCourses, setSavingCourses] = useState(false)
  const [isGuardOpen, setIsGuardOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)
  const router = useRouter()

  // Account management state
  const [fullName, setFullName] = useState('')
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [availableCourses, setAvailableCourses] = useState<string[]>(['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7'])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [savingCourse, setSavingCourse] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

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
      toast.success(t('settings.messages.saved'))
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

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        const configuredCourses = settingsSnap.exists() ? settingsSnap.data().courses : undefined
        if (Array.isArray(configuredCourses) && configuredCourses.length > 0) {
          const normalizedCourses = configuredCourses.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          if (normalizedCourses.length > 0) {
            setAvailableCourses(normalizedCourses)
          }
        }
      } catch (loadError) {
        console.error('Error loading courses:', loadError)
      }
    }

    loadCourses()
  }, [])

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setSelectedCourse(profile?.class_name || '')
    setCustomAvatarUrl(profile?.photo_url || '')
  }, [profile?.full_name, profile?.class_name, profile?.photo_url])

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
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
    if (!user || !profile) return

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
    if (!user?.email) {
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

  const handleSaveCustomAvatar = async () => {
    if (!user || !profile) return

    if (!profile.cosmetics?.custom_avatar) {
      toast.error('Custom User Icons sind ein kostenpflichtiges Cosmetic-Feature.')
      return
    }

    const normalizedUrl = customAvatarUrl.trim()

    try {
      setSavingAvatar(true)
      await updateDoc(doc(db, 'profiles', user.uid), {
        photo_url: normalizedUrl || null,
      })

      await logAction('PROFILE_UPDATED', user.uid, profile.full_name, {
        field: 'photo_url',
        value: normalizedUrl || null,
      })

      toast.success('Custom User Icon gespeichert.')
    } catch (error) {
      console.error('Error updating custom avatar:', error)
      toast.error('User Icon konnte nicht gespeichert werden.')
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || !profile) return

    if (profile.role === 'admin_main' || profile.role === 'admin') {
      toast.error('Main Admins können ihr Konto nicht löschen. Übertrage die Rolle zuerst auf einen anderen Nutzer.')
      return
    }

    const confirmation = await prompt({
      title: 'Konto unwiderruflich löschen?',
      content: 'Diese Aktion kann nicht rückgängig gemacht werden. Bitte gib KONTO LOESCHEN ein, um dein Konto endgültig zu löschen.',
      priority: 'high',
      inputLabel: 'Bestätigungstext',
      placeholder: 'KONTO LOESCHEN',
      requiredValue: 'KONTO LOESCHEN',
      validationMessage: 'Bitte gib den Text KONTO LOESCHEN exakt ein.',
      confirmLabel: 'Konto löschen',
      confirmVariant: 'destructive',
      cancelLabel: 'Abbrechen',
    })

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
      toast.error(t('settings.messages.minOneCourse'))
      return
    }

    try {
      setSavingCourses(true)
      await setDoc(doc(db, 'settings', 'config'), { courses }, { merge: true })

      if (renamedCourses.length > 0) {
        if (!canMigrateCourses) {
          toast.warning(t('settings.messages.migrationWarning'))
        } else {
          for (const row of renamedCourses) {
            await migrateCourseName(row.before, row.after)
          }
          toast.success(t('settings.messages.migrationAdmin'))
        }
      } else {
        toast.success(t('settings.messages.updated'))
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
      toast.error(t('settings.messages.error'))
    } finally {
      setSavingCourses(false)
    }
  }

  const [activeSection, setActiveSection] = useState<string>('personal')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Build navigation items
  const navItems: SettingsNavItem[] = [
    { id: 'personal', label: t('settings.sections.personal'), icon: <User className="h-4 w-4" /> },
    { id: 'appearance', label: t('settings.sections.appearance'), icon: <MoonStar className="h-4 w-4" /> },
    { id: 'language', label: t('settings.sections.language'), icon: <Globe className="h-4 w-4" /> },
    { id: 'notifications', label: 'Benachrichtigungen', icon: <Bell className="h-4 w-4" /> },
    { id: 'feedback', label: t('settings.sections.feedback'), icon: <MessageSquarePlus className="h-4 w-4" /> },
    { id: 'bonuses', label: t('settings.sections.bonuses'), icon: <Sparkles className="h-4 w-4" /> },
    { id: 'account', label: 'Kontoverwaltung', icon: <ShieldCheck className="h-4 w-4" /> },
    ...(canManageCourses ? [{ id: 'courses', label: t('settings.courseSystem.title'), icon: <Users className="h-4 w-4" /> }] : []),
  ]

  // Sync active section with hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) setActiveSection(hash)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Navigate to section
  const navigateToSection = (id: string) => {
    setActiveSection(id)
    window.location.hash = id
    setMobileMenuOpen(false)
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">{t('settings.messages.loading')}</div>
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{t('settings.title')}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">Verwalte deine Kontoeinstellungen und Präferenzen</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 flex-shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area - with top padding for fixed header */}
      <div className="mt-[72px] sm:mt-[84px]">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        <div className="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-4 sm:gap-8">
            {/* Sidebar Navigation */}
            <aside
              className={`${
                mobileMenuOpen
                  ? 'fixed left-0 top-[72px] sm:top-[84px] bottom-0 w-56 z-30 bg-background border-r border-border/40 overflow-y-auto'
                  : 'hidden'
              } md:static md:display md:z-auto md:w-auto md:top-auto md:bottom-auto md:border-r-0 md:bg-transparent md:overflow-visible`}
            >
              <nav className="md:sticky md:top-24 space-y-1 p-4 md:p-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateToSection(item.id)}
                  disabled={item.disabled}
                  className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 ${
                    activeSection === item.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {activeSection === item.id && <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </nav>
            
          </aside>

          {/* Main Content */}
          <main className="space-y-4 sm:space-y-6 pb-8">
            {/* Profile Section */}
            {activeSection === 'personal' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{t('settings.sections.personal')}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Verwalte deine persönlichen Daten</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="h-4 w-4 flex-shrink-0" /> {t('settings.profile.title')}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('settings.profile.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full sm:w-auto h-9 sm:h-10">
                      <Link href="/profil">
                        {t('settings.profile.button')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{t('settings.sections.appearance')}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Passe das Aussehen an deine Vorlieben an</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">{t('settings.appearance.title')}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('settings.appearance.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm font-semibold">Farbschema</Label>
                      <ThemeToggle />
                    </div>
                    <div className="border-t pt-4 sm:pt-6 space-y-2 sm:space-y-3">
                      <Label className="text-sm font-semibold">Akzentfarbe</Label>
                      <AccentThemeSelector />
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 flex-shrink-0" /> Custom User Icon
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profile.cosmetics?.custom_avatar
                              ? 'Freigeschaltet. Du kannst eine eigene Bild-URL speichern.'
                              : 'Premium-Cosmetic. Freischalten im Shop, danach hier nutzbar.'}
                          </p>
                        </div>
                        {!profile.cosmetics?.custom_avatar && (
                          <Button asChild variant="outline" size="sm" className="h-8 text-xs sm:text-sm flex-shrink-0">
                            <Link href="/shop?category=cosmetics">Im Shop freischalten</Link>
                          </Button>
                        )}
                      </div>

                      {profile.cosmetics?.custom_avatar ? (
                        <div className="space-y-3 pt-3 sm:pt-4 border-t">
                          <div className="space-y-2">
                            <Label htmlFor="custom-avatar-url" className="text-xs sm:text-sm">Bild-URL</Label>
                            <Input
                              id="custom-avatar-url"
                              value={customAvatarUrl}
                              onChange={(e) => setCustomAvatarUrl(e.target.value)}
                              placeholder="https://.../mein-icon.png"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Button onClick={handleSaveCustomAvatar} disabled={savingAvatar} size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                              {savingAvatar ? 'Speichere...' : 'User Icon speichern'}
                            </Button>
                            <Button variant="ghost" onClick={() => setCustomAvatarUrl(profile.photo_url || '')} disabled={savingAvatar} size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                              Zurücksetzen
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Language Section */}
            {activeSection === 'language' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{t('settings.sections.language')}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Wähle deine bevorzugte Sprache</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">{t('settings.language.title')}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('settings.language.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        variant={language === 'de-DE' ? 'default' : 'outline'}
                        onClick={() => setLanguage('de-DE')}
                        className="justify-start sm:justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        <span className="text-xs font-bold bg-muted px-1.5 rounded flex-shrink-0">DE</span>
                        <span className="hidden sm:inline">Deutsch</span>
                      </Button>
                      <Button
                        variant={language === 'en-US' ? 'default' : 'outline'}
                        onClick={() => setLanguage('en-US')}
                        className="justify-start sm:justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        <span className="text-xs font-bold bg-muted px-1.5 rounded flex-shrink-0">EN</span>
                        <span className="hidden sm:inline">English</span>
                      </Button>
                      <Button
                        variant={language === 'es-ES' ? 'default' : 'outline'}
                        onClick={() => setLanguage('es-ES')}
                        className="justify-start sm:justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        <span className="text-xs font-bold bg-muted px-1.5 rounded flex-shrink-0">ES</span>
                        <span className="hidden sm:inline">Español</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Benachrichtigungen</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Verwalte deine Benachrichtigungseinstellungen</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Push-Benachrichtigungen</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Erhalte Push-Benachrichtigungen bei neuen News, Todos oder DMs.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isSupported ? (
                      <p className="text-xs sm:text-sm text-muted-foreground italic">Push-Benachrichtigungen werden von deinem Browser leider nicht unterstützt.</p>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex flex-col space-y-1 min-w-0">
                          <Label htmlFor="push-notifications" className="text-xs sm:text-sm font-semibold">Native Push-Benachrichtigungen</Label>
                          <p className="text-xs text-muted-foreground">
                            {permission === 'granted'
                              ? 'Aktiviert. Du erhältst Benachrichtigungen direkt auf dein Gerät.'
                              : permission === 'denied'
                                ? 'Blockiert. Bitte aktiviere Benachrichtigungen in deinen Browser-Einstellungen.'
                                : 'Deaktiviert. Klicke zum Aktivieren.'}
                          </p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={permission === 'granted' && !!profile?.isPushEnabled}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              requestPermission().then(success => {
                                if (success) toast.success('Benachrichtigungen aktiviert!')
                                else toast.error('Aktivierung fehlgeschlagen.')
                              })
                            } else {
                              disableNotifications().then(() => toast.info('Benachrichtigungen deaktiviert.'))
                            }
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Feedback Section */}
            {activeSection === 'feedback' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{t('settings.sections.feedback')}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Teile dein Feedback und deine Ideen mit uns</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">{t('settings.feedback.title')}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('settings.feedback.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AddFeedbackDialog />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bonuses Section */}
            {activeSection === 'bonuses' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{t('settings.sections.bonuses')}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Verdiene Boni durch Einladungen</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Sparkles className="h-4 w-4 text-primary flex-shrink-0" /> {t('settings.bonuses.title')}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('settings.bonuses.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm gap-2">
                      <Link href="/einstellungen/referrals" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> {t('settings.bonuses.button')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account Management Section */}
            {activeSection === 'account' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Kontoverwaltung</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Verwalte deine Sicherheit und persönliche Daten</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Account-Einstellungen</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Verwalte deine persönlichen Daten und Sicherheitseinstellungen.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    {/* Name Settings */}
                    <form onSubmit={handleUpdateName} className="space-y-2 sm:space-y-3">
                      <Label htmlFor="profile-full-name" className="text-xs sm:text-sm">Name ändern</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="profile-full-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Dein vollständiger Name"
                          className="text-sm h-9 sm:h-10"
                          required
                        />
                        <Button type="submit" disabled={savingName} className="h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0">
                          {savingName ? 'Speichern...' : 'Speichern'}
                        </Button>
                      </div>
                    </form>

                    {/* Course Settings */}
                    <form onSubmit={handleUpdateCourse} className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
                      <Label htmlFor="profile-course" className="text-xs sm:text-sm">Kurs ändern</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          id="profile-course"
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          {availableCourses.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" disabled={savingCourse} className="h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0">
                          {savingCourse ? 'Speichern...' : 'Speichern'}
                        </Button>
                      </div>
                    </form>

                    {/* Password Reset */}
                    <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
                      <Label className="text-xs sm:text-sm">Passwort ändern</Label>
                      <Button variant="outline" className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm" onClick={handlePasswordReset} disabled={sendingReset}>
                        {sendingReset ? 'Sende E-Mail...' : 'Passwort ändern'}
                      </Button>
                    </div>

                    {/* 2FA */}
                    <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
                      <Label className="text-xs sm:text-sm">Zwei-Faktor-Authentisierung (2FA)</Label>
                      <div className="w-full sm:w-auto">
                        <TOTPSetup profile={profile} />
                      </div>
                    </div>

                    {/* Sign Out */}
                    <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
                      <Label className="text-xs sm:text-sm text-destructive">Abmelden</Label>
                      <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm gap-2">
                        <LogOut className="h-4 w-4" /> {t('settings.account.button')}
                      </Button>
                    </div>

                    {/* Delete Account */}
                    <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
                      <Label className="text-xs sm:text-sm text-destructive">Konto löschen</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        Dein Konto und alle damit verbundenen Daten werden unwiderruflich gelöscht.
                      </p>
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                        {deletingAccount ? 'Lösche Konto...' : 'Konto löschen'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Courses Management Section */}
            {activeSection === 'courses' && canManageCourses && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{t('settings.courseSystem.title')}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Verwalte die verfügbaren Kurse in deiner Klasse</p>
                </div>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">{t('settings.courseSystem.title')}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t('settings.courseSystem.desc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {courseRows.map((row) => (
                        <div key={row.id} className="flex items-center gap-2">
                          <Input
                            value={row.after}
                            onChange={(e) => updateCourseRow(row.id, e.target.value)}
                            placeholder={t('settings.courseSystem.placeholder')}
                            className="text-sm h-9 sm:h-10"
                            disabled={!canManageCourses}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                            onClick={() => removeCourseRow(row.id)}
                            disabled={!canManageCourses || courseRows.length <= 1}
                            title={t('settings.courseSystem.remove')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" onClick={addCourseRow} disabled={!canManageCourses} className="gap-2 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
                      <Plus className="h-4 w-4" /> {t('settings.courseSystem.add')}
                    </Button>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 sm:pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        {canManageCourses
                          ? canMigrateCourses
                            ? t('settings.courseSystem.adminHint')
                            : t('settings.courseSystem.plannerHint')
                          : t('settings.courseSystem.restrictedHint')}
                      </p>
                      <Button onClick={handleSaveCourses} disabled={!canManageCourses || savingCourses} className="gap-2 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
                        <Save className="h-4 w-4" /> {savingCourses ? t('settings.courseSystem.saving') : t('settings.courseSystem.save')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Navigation Guard Dialog */}
      <Dialog open={isGuardOpen} onOpenChange={setIsGuardOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> {t('settings.guard.title')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.guard.desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button variant="ghost" className="w-full" onClick={handleConfirmNavigation}>
              {t('settings.guard.discard')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsGuardOpen(false)}>
              {t('settings.guard.cancel')}
            </Button>
            <Button className="w-full" onClick={handleSaveAll} disabled={savingCourses}>
              {t('settings.guard.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}
