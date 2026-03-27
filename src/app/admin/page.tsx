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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { MoreVertical, Shield, User, Trash2, Clock3, Undo2, Search, Gift, MessageSquare, AlertTriangle } from 'lucide-react'
import { ResetPasswordDialog } from '@/components/modals/ResetPasswordDialog'
import { SetTimeoutDialog } from '@/components/modals/SetTimeoutDialog'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { logAction } from '@/lib/logging'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type BulkActionType =
  | 'approve'
  | 'unapprove'
  | 'set_course'
  | 'set_group'
  | 'clear_group'
  | 'timeout_24h'
  | 'timeout_7d'
  | 'clear_timeout'

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { pushMessage } = useSystemMessage()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [selectedGiftRecipients, setSelectedGiftRecipients] = useState<string[]>([])
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = useState(false)
  const [timeoutTarget, setTimeoutTarget] = useState<{ id: string, name: string } | null>(null)
  const [bulkAction, setBulkAction] = useState<BulkActionType>('approve')
  const [bulkCourse, setBulkCourse] = useState('')
  const [bulkGroup, setBulkGroup] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)
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
      setLoading(false)
    })

    return () => {
      unsubscribeProfiles()
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

  const handleTimeoutConfirm = async (hours: number, reason: string) => {
    if (!timeoutTarget) return

    const timeoutUntil = hours > 0 
      ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() - 1000).toISOString() // Past date means warning only

    await handleUpdateProfile(timeoutTarget.id, {
      timeout_until: timeoutUntil,
      timeout_reason: reason,
    })

    if (hours > 0) {
      pushMessage({
        type: 'toast',
        priority: 'info',
        title: 'Erfolg',
        content: `Nutzer ${timeoutTarget.name} wurde für ${hours} Stunden gesperrt.`
      })
    } else {
      pushMessage({
        type: 'toast',
        priority: 'info',
        title: 'Erfolg',
        content: `Nutzer ${timeoutTarget.name} wurde verwarnt.`
      })
    }
    setTimeoutTarget(null)
  }

  const handleClearTimeout = async (id: string) => {
    await handleUpdateProfile(id, {
      timeout_until: null,
      timeout_reason: null,
    })
    pushMessage({
      type: 'toast',
      priority: 'info',
      title: 'Erfolg',
      content: 'Timeout wurde aufgehoben.'
    })
  }

  const handleDeleteProfile = async (id: string) => {
    const target = profiles.find((entry) => entry.id === id)
    if (!target) return

    const targetIsMainAdmin = target.role === 'admin_main' || target.role === 'admin'
    if (targetIsMainAdmin || id === profile?.id) {
      return
    }

    if (confirm('Bist du sicher, dass du diesen Nutzer löschen möchtest? (Löscht das Profil-Dokument, das Auth-Konto und alle zugehörigen Daten permanent)')) {
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

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const selectableProfiles = filteredProfiles
  const allVisibleSelected = selectableProfiles.length > 0 && selectableProfiles.every((entry) => selectedGiftRecipients.includes(entry.id))

  const toggleRecipient = (userId: string, checked: boolean) => {
    setSelectedGiftRecipients((prev) => {
      if (checked) {
        if (prev.includes(userId)) return prev
        return [...prev, userId]
      }
      return prev.filter((id) => id !== userId)
    })
  }

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedGiftRecipients((prev) => Array.from(new Set([...prev, ...selectableProfiles.map((entry) => entry.id)])))
      return
    }

    const visibleIds = new Set(selectableProfiles.map((entry) => entry.id))
    setSelectedGiftRecipients((prev) => prev.filter((id) => !visibleIds.has(id)))
  }

  const handleBulkAction = async () => {
    if (!user || selectedGiftRecipients.length === 0) return

    const selectedProfiles = profiles.filter((entry) => selectedGiftRecipients.includes(entry.id) && entry.id !== profile.id)
    if (selectedProfiles.length === 0) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Keine gültigen Nutzer ausgewählt.'
      })
      return
    }

    if (bulkAction === 'set_course' && !bulkCourse) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Bitte einen Kurs auswählen.'
      })
      return
    }

    if (bulkAction === 'set_group' && !bulkGroup) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Bitte eine Gruppe auswählen.'
      })
      return
    }

    setBulkProcessing(true)
    try {
      const isMainAdminActor = profile.role === 'admin' || profile.role === 'admin_main'
      const successIds: string[] = []
      const failedIds: string[] = []
      const skippedIds: string[] = []

      for (const target of selectedProfiles) {
        const targetIsMainAdmin = target.role === 'admin' || target.role === 'admin_main'
        const isAssignmentAction = bulkAction === 'set_course' || bulkAction === 'set_group' || bulkAction === 'clear_group'

        if (!isMainAdminActor && targetIsMainAdmin && !isAssignmentAction) {
          skippedIds.push(target.id)
          continue
        }

        const targetRef = doc(db, 'profiles', target.id)
        try {
          if (bulkAction === 'approve') {
            await updateDoc(targetRef, { is_approved: true })
          } else if (bulkAction === 'unapprove') {
            await updateDoc(targetRef, { is_approved: false })
          } else if (bulkAction === 'set_course') {
            await updateDoc(targetRef, { class_name: bulkCourse })
          } else if (bulkAction === 'set_group') {
            await updateDoc(targetRef, { planning_group: bulkGroup })
          } else if (bulkAction === 'clear_group') {
            await updateDoc(targetRef, { planning_group: null })
          } else if (bulkAction === 'timeout_24h') {
            await updateDoc(targetRef, {
              timeout_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              timeout_reason: 'Admin-Timeout (24h)',
            })
          } else if (bulkAction === 'timeout_7d') {
            await updateDoc(targetRef, {
              timeout_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              timeout_reason: 'Admin-Timeout (7 Tage)',
            })
          } else if (bulkAction === 'clear_timeout') {
            await updateDoc(targetRef, {
              timeout_until: null,
              timeout_reason: null,
            })
          }

          successIds.push(target.id)
        } catch {
          failedIds.push(target.id)
        }
      }

      await logAction('PROFILE_UPDATED', user.uid, profile?.full_name, {
        bulk_action: bulkAction,
        course: bulkCourse || null,
        group: bulkGroup || null,
        success_ids: successIds,
        skipped_ids: skippedIds,
        failed_ids: failedIds,
      })

      if (successIds.length > 0) {
        pushMessage({
          type: 'toast',
          priority: 'info',
          title: 'Erfolg',
          content: `Massenaktion abgeschlossen: ${successIds.length} erfolgreich.`
        })
      }
      if (skippedIds.length > 0) {
        pushMessage({
          type: 'toast',
          priority: 'warning',
          title: 'Warnung',
          content: `${skippedIds.length} Nutzer übersprungen (Berechtigungsschutz).`
        })
      }
      if (failedIds.length > 0) {
        pushMessage({
          type: 'toast',
          priority: 'critical',
          title: 'Fehler',
          content: `${failedIds.length} Nutzer konnten nicht aktualisiert werden.`
        })
      }

      setIsBulkDialogOpen(false)
    } finally {
      setBulkProcessing(false)
    }
  }

  const openSinglePopup = (userId: string) => {
    router.push("/admin/send?u=" + userId)
  }

  const copyUserValue = async (value: string | null | undefined, label: string) => {
    const normalized = (value || '').trim()
    if (!normalized) {
      pushMessage({
        type: 'toast',
        priority: 'warning',
        title: 'Hinweis',
        content: `${label} ist nicht vorhanden.`,
      })
      return
    }

    try {
      await navigator.clipboard.writeText(normalized)
      pushMessage({
        type: 'toast',
        priority: 'info',
        title: 'Kopiert',
        content: `${label} wurde kopiert.`,
      })
    } catch {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: `${label} konnte nicht kopiert werden.`,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-muted-foreground text-sm">Verwalte Profile, Rollen und Berechtigungen.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nutzer suchen..."
            className="pl-9"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Mehrfachauswahl & Massenaktionen
          </CardTitle>
          <CardDescription>
            Die Auswahl kann für Schenkungen und Massenänderungen genutzt werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Ausgewählt: <span className="font-semibold text-foreground">{selectedGiftRecipients.length}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setSelectedGiftRecipients([])}
              disabled={selectedGiftRecipients.length === 0}
              className="w-full"
            >
              Auswahl leeren
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBulkDialogOpen(true)}
              disabled={selectedGiftRecipients.length === 0}
              className="w-full"
            >
              Massenaktion
            </Button>
            <Button
              onClick={() => {
                sessionStorage.setItem('admin_send_recipients', JSON.stringify(selectedGiftRecipients))
                router.push('/admin/send')
              }}
              disabled={selectedGiftRecipients.length === 0}
              className="gap-2 w-full"
            >
              <Gift className="h-4 w-4" />
              Popup senden
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrierte Profile</CardTitle>
          <CardDescription>Kurs- und Gruppenzuweisungen sowie Systemrollen konfigurieren.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) => toggleSelectAllVisible(checked === true)}
                      aria-label="Alle sichtbaren Nutzer auswählen"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead>Gruppe</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((p) => {
                  const isMainAdminAccount = p.role === 'admin_main' || p.role === 'admin'
                  const isSelf = p.id === profile.id
                  const canManageRoleActions = !isMainAdminAccount && !isSelf
                  const isSelected = selectedGiftRecipients.includes(p.id)

                  return (
                    <ContextMenu key={p.id}>
                      <ContextMenuTrigger>
                        <TableRow>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => toggleRecipient(p.id, checked === true)}
                              aria-label={`Nutzer ${p.full_name || p.email} auswählen`}
                            />
                          </TableCell>
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
                              <Badge
                                variant="destructive"
                                className="ml-2"
                                title={p.timeout_reason || 'Kein Grund angegeben'}
                              >
                                Sperre
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
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openSinglePopup(p.id)}>
                                  <MessageSquare className="mr-2 h-4 w-4" /> Popup senden
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'admin' })}>
                                  <Shield className="mr-2 h-4 w-4" /> Zum Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'admin_co' })}>
                                  <Shield className="mr-2 h-4 w-4" /> Zum Co-Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'planner' })}>
                                  <Shield className="mr-2 h-4 w-4" /> Zum Planer
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'viewer' })}>
                                  <User className="mr-2 h-4 w-4" /> Zum Zuschauer
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => {
                                  setTimeoutTarget({ id: p.id, name: p.full_name || p.email })
                                  setIsTimeoutDialogOpen(true)
                                }}>
                                  <AlertTriangle className="mr-2 h-4 w-4 text-destructive" /> Warnen / Sperren
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleClearTimeout(p.id)}>
                                  <Undo2 className="mr-2 h-4 w-4" /> Timeout aufheben
                                </DropdownMenuItem>
                                <ResetPasswordDialog userEmail={p.email} userName={p.full_name || 'User'} />
                                <DropdownMenuItem className="text-destructive" disabled={!canManageRoleActions} onClick={() => handleDeleteProfile(p.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-56">
                        <ContextMenuLabel>{p.full_name || p.email || p.id}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => router.push(`/profil/${p.id}`)}>
                          <User className="h-4 w-4" /> Profil öffnen
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => openSinglePopup(p.id)}>
                          <MessageSquare className="h-4 w-4" /> Popup senden
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => toggleRecipient(p.id, !isSelected)}>
                          <Gift className="h-4 w-4" /> {isSelected ? 'Aus Auswahl entfernen' : 'Zur Auswahl hinzufügen'}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => copyUserValue(p.full_name, 'Name')}>
                          <User className="h-4 w-4" /> Name kopieren
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => copyUserValue(p.email, 'E-Mail')}>
                          <MessageSquare className="h-4 w-4" /> E-Mail kopieren
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => copyUserValue(p.id, 'User-ID')}>
                          <Shield className="h-4 w-4" /> User-ID kopieren
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List View (Functional) */}
          <div className="lg:hidden space-y-4">
            {filteredProfiles.map((p) => {
              const isMainAdminAccount = p.role === 'admin_main' || p.role === 'admin'
              const isSelf = p.id === profile.id
              const canManageRoleActions = !isMainAdminAccount && !isSelf

              return (
                <div key={p.id} className="border rounded-xl p-4 space-y-4 bg-card/50">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex items-start gap-3">
                      <Checkbox
                        checked={selectedGiftRecipients.includes(p.id)}
                        onCheckedChange={(checked) => toggleRecipient(p.id, checked === true)}
                        aria-label={`Nutzer ${p.full_name || p.email} auswählen`}
                        className="mt-1"
                      />
                      <div>
                      <Link href={`/profil/${p.id}`} className="font-bold hover:underline truncate block">
                        {p.full_name || 'Unbekannt'}
                      </Link>
                      <p className="text-xs text-muted-foreground break-all">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="capitalize">
                        {p.role}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSinglePopup(p.id)}>
                            <MessageSquare className="mr-2 h-4 w-4" /> Popup senden
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'admin' })}>
                            <Shield className="mr-2 h-4 w-4" /> Zum Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'admin_co' })}>
                            <Shield className="mr-2 h-4 w-4" /> Zum Co-Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'planner' })}>
                            <Shield className="mr-2 h-4 w-4" /> Zum Planer
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'viewer' })}>
                            <User className="mr-2 h-4 w-4" /> Zum Zuschauer
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => {
                            setTimeoutTarget({ id: p.id, name: p.full_name || p.email })
                            setIsTimeoutDialogOpen(true)
                          }}>
                            <AlertTriangle className="mr-2 h-4 w-4 text-destructive" /> Warnen / Sperren
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleClearTimeout(p.id)}>
                            <Undo2 className="mr-2 h-4 w-4" /> Timeout aufheben
                          </DropdownMenuItem>
                          <ResetPasswordDialog userEmail={p.email} userName={p.full_name || 'User'} />
                          <DropdownMenuItem className="text-destructive" disabled={!canManageRoleActions} onClick={() => handleDeleteProfile(p.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {p.timeout_until && new Date(p.timeout_until).getTime() > Date.now() && (
                    <div className="space-y-2">
                      <Badge variant="destructive" className="w-full justify-center py-1">
                        Nutzer ist gesperrt
                      </Badge>
                      {p.timeout_reason && (
                        <p className="text-[10px] text-center text-muted-foreground italic px-2">
                          Grund: {p.timeout_reason}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Kurs</label>
                      <select
                        className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                        value={p.class_name || ''}
                        onChange={(e) => handleUpdateProfile(p.id, { class_name: e.target.value || null })}
                      >
                        <option value="">Kein Kurs</option>
                        {courses.map((course) => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Gruppe</label>
                      <select
                        className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                        value={p.planning_group || ''}
                        onChange={(e) => handleUpdateProfile(p.id, { planning_group: e.target.value || null })}
                      >
                        <option value="">Keine Gruppe</option>
                        {planningGroups.map((groupName) => (
                          <option key={groupName} value={groupName}>{groupName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Massenaktion ausführen</DialogTitle>
            <DialogDescription>
              Führt dieselbe Änderung für alle ausgewählten Nutzer aus.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-action">Aktion</Label>
              <select
                id="bulk-action"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as BulkActionType)}
              >
                <option value="approve">Accounts freischalten</option>
                <option value="unapprove">Freischaltung entfernen</option>
                <option value="set_course">Kurs setzen</option>
                <option value="set_group">Planungsgruppe setzen</option>
                <option value="clear_group">Planungsgruppe entfernen</option>
                <option value="timeout_24h">Timeout 24h setzen</option>
                <option value="timeout_7d">Timeout 7 Tage setzen</option>
                <option value="clear_timeout">Timeout aufheben</option>
              </select>
            </div>

            {bulkAction === 'set_course' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-course">Kurs</Label>
                <select
                  id="bulk-course"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={bulkCourse}
                  onChange={(e) => setBulkCourse(e.target.value)}
                >
                  <option value="">Kurs auswählen</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            )}

            {bulkAction === 'set_group' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-group">Planungsgruppe</Label>
                <select
                  id="bulk-group"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={bulkGroup}
                  onChange={(e) => setBulkGroup(e.target.value)}
                >
                  <option value="">Gruppe auswählen</option>
                  {planningGroups.map((groupName) => (
                    <option key={groupName} value={groupName}>{groupName}</option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Betroffene Nutzer: {selectedGiftRecipients.length}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)} disabled={bulkProcessing}>
              Abbrechen
            </Button>
            <Button onClick={handleBulkAction} disabled={bulkProcessing || selectedGiftRecipients.length === 0}>
              {bulkProcessing ? 'Wird ausgeführt...' : 'Massenaktion starten'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SetTimeoutDialog 
        isOpen={isTimeoutDialogOpen}
        onOpenChange={setIsTimeoutDialogOpen}
        onConfirm={handleTimeoutConfirm}
        userName={timeoutTarget?.name || 'Nutzer'}
      />
    </div>
  )
}
