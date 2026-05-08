'use client'

import { useState, useEffect, use } from 'react'
import { db, getFirebaseFunctions } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Profile, Settings } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { usePopupManager } from '@/modules/popup/usePopupManager'
import { logAction } from '@/lib/logging'
import { useRouter, usePathname } from 'next/navigation'
import { 
  ArrowLeft, 
  Shield, 
  User, 
  Users, 
  Trash2, 
  Clock3, 
  ShieldAlert, 
  History, 
  Save, 
  Loader2, 
  Mail, 
  Calendar, 
  Settings as SettingsIcon,
  CreditCard,
  Gift,
  Trophy,
  Activity,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { DiscountHistoryDialog } from '@/components/modals/DiscountHistoryDialog'
import { SetTimeoutDialog } from '@/components/modals/SetTimeoutDialog'
import { ResetPasswordDialog } from '@/components/modals/ResetPasswordDialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export default function UserDetailView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile: adminProfile, loading: authLoading } = useAuth()
  const { pushMessage } = useSystemMessage()
  const { confirm } = usePopupManager()
  const router = useRouter()
  const pathname = usePathname()
  const functions = getFirebaseFunctions()

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<string[]>([])
  const [planningGroups, setPlanningGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Dialog states
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = useState(false)

  const canManageUsers =
    adminProfile?.role === 'admin' ||
    adminProfile?.role === 'admin_main' ||
    adminProfile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!adminProfile || !canManageUsers)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [adminProfile, authLoading, canManageUsers, router, pathname])

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const docRef = doc(db, 'profiles', id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setTargetProfile({ id: docSnap.id, ...docSnap.data() } as Profile)
        }

        // Listen to settings for courses/groups
        const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data()
            setCourses(data.courses || [])
            setPlanningGroups((data.planning_groups || []).map((g: any) => typeof g === 'string' ? g : g.name))
          }
        })

        return () => unsubSettings()
      } catch (err) {
        console.error('Error fetching user data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (canManageUsers) {
      fetchInitial()
    }
  }, [id, canManageUsers])

  const handleUpdate = async (updates: any) => {
    if (!targetProfile) return
    setUpdating(true)
    try {
      const docRef = doc(db, 'profiles', id)
      await updateDoc(docRef, updates)
      
      // Refresh local state (except for FieldValue updates which are hard to merge locally)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setTargetProfile({ id: docSnap.id, ...docSnap.data() } as Profile)
      }
      
      if (user) {
        await logAction('PROFILE_UPDATED', user.uid, adminProfile?.full_name, {
          target_user_id: id,
          target_user_name: targetProfile.full_name,
          updates,
        })
      }
      
      pushMessage({ type: 'toast', priority: 'info', title: 'Erfolg', content: 'Benutzerprofil aktualisiert.' })
    } catch (err) {
      console.error('Error updating user:', err)
      pushMessage({ type: 'toast', priority: 'critical', title: 'Fehler', content: 'Update fehlgeschlagen.' })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateDiscount = async (val: number) => {
    if (!targetProfile) return
    const oldValue = targetProfile.participation_manual_credit || 0
    if (val === oldValue) return
    
    const constrainedVal = Math.max(0, Math.min(30, val))
    
    try {
      await handleUpdate({ participation_manual_credit: constrainedVal })
      if (user) {
        await logAction('TICKET_DISCOUNT_ADJUSTED', user.uid, adminProfile?.full_name, {
          target_user_id: id,
          target_user_name: targetProfile.full_name,
          old_value: oldValue,
          new_value: constrainedVal,
        })
      }
    } catch (err) {
      console.error('Error updating discount:', err)
    }
  }

  const handleTimeoutConfirm = async (hours: number, reason: string) => {
    if (!targetProfile) return
    const timeoutUntil = hours > 0 
      ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      : null

    await handleUpdate({
      timeout_until: timeoutUntil,
      timeout_reason: reason,
    })
    setIsTimeoutDialogOpen(false)
  }

  const handleDeleteUser = async () => {
    if (!targetProfile) return
    const confirmed = await confirm({
      title: 'Nutzer unwiderruflich löschen?',
      content: `Bist du sicher, dass du ${targetProfile.full_name} löschen möchtest? Alle Profildaten werden entfernt.`,
      priority: 'high',
      confirmLabel: 'Löschen',
      confirmVariant: 'destructive'
    })

    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'profiles', id))
        if (user) {
          await logAction('PROFILE_DELETED', user.uid, adminProfile?.full_name, {
            target_user_id: id,
            target_user_name: targetProfile.full_name,
          })
        }
        pushMessage({ type: 'toast', priority: 'info', title: 'Gelöscht', content: 'Nutzer wurde erfolgreich gelöscht.' })
        router.push('/admin/user')
      } catch (err) {
        console.error('Error deleting user:', err)
      }
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Lade Benutzerdetails...</p>
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Nutzer nicht gefunden</h2>
        <Button onClick={() => router.push('/admin/user')}>Zurück zur Übersicht</Button>
      </div>
    )
  }

  const isMainAdminAccount = targetProfile.role === 'admin_main' || targetProfile.role === 'admin'
  const isSelf = targetProfile.id === adminProfile?.id
  const canManageCritical = !isMainAdminAccount && !isSelf

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => router.push('/admin/user')}>
          <ArrowLeft className="h-4 w-4" /> Benutzerverwaltung
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/profil/${id}`)} className="gap-2">
            <User className="h-4 w-4" /> Zum Profil
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/send?u=${id}`)} className="gap-2">
            <Gift className="h-4 w-4" /> Popup senden
          </Button>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight">{targetProfile.full_name || 'Unbekannter Nutzer'}</h1>
            <Badge variant={targetProfile.is_approved ? "success" : "warning"} className="h-6">
              {targetProfile.is_approved ? "Freigeschaltet" : "Ausstehend"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {targetProfile.email}</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Rolle: <span className="capitalize font-medium text-foreground">{targetProfile.role}</span></span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Registriert: {new Date(targetProfile.created_at).toLocaleDateString('de-DE')}</span>
          </div>
        </div>
        {targetProfile.timeout_until && new Date(targetProfile.timeout_until) > new Date() && (
          <Badge variant="destructive" className="h-10 px-4 text-sm font-bold gap-2 animate-pulse">
            <AlertTriangle className="h-4 w-4" /> Nutzer gesperrt bis {new Date(targetProfile.timeout_until).toLocaleString('de-DE')}
          </Badge>
        )}
      </header>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-fit mb-8">
          <TabsTrigger value="settings" className="gap-2"><SettingsIcon className="h-4 w-4" /> Einstellungen</TabsTrigger>
          <TabsTrigger value="stats" className="gap-2"><Activity className="h-4 w-4" /> Statistik</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><ShieldAlert className="h-4 w-4" /> Sicherheit</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zuweisung</CardTitle>
                <CardDescription>Kurs und Planungsgruppen verwalten.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kurs / Klasse</Label>
                  <select 
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={targetProfile.class_name || ''}
                    onChange={(e) => handleUpdate({ class_name: e.target.value || null })}
                  >
                    <option value="">Kein Kurs</option>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Planungsgruppen</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(targetProfile.planning_groups || []).map(group => (
                      <Badge key={group} variant="secondary" className="gap-1">
                        {group}
                        <button onClick={() => handleUpdate({ planning_groups: arrayRemove(group) } as any)} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                  <select 
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    onChange={(e) => {
                      if (e.target.value) handleUpdate({ planning_groups: arrayUnion(e.target.value) } as any)
                    }}
                    value=""
                  >
                    <option value="">Gruppe hinzufügen...</option>
                    {planningGroups.filter(g => !(targetProfile.planning_groups || []).includes(g)).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Finanzen & Tickets</CardTitle>
                <CardDescription>Ticket-Rabatt und manuelle Gutschriften.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Manueller Ticket-Rabatt (€)</Label>
                    <Button variant="ghost" size="sm" onClick={() => setIsHistoryDialogOpen(true)} className="h-7 text-xs gap-1">
                      <History className="h-3 w-3" /> Historie
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="number"
                      min="0"
                      max="30"
                      className="text-lg font-bold"
                      defaultValue={targetProfile.participation_manual_credit || 0}
                      onBlur={(e) => handleUpdateDiscount(parseInt(e.target.value) || 0)}
                    />
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
                      Zusätzlich zu den {targetProfile.task_stats?.total_penalty_reduction || 0}€ aus Aufgaben.
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Maximal 30€ Gesamtrabatt möglich.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rolle & Berechtigungen</CardTitle>
              <CardDescription>Systemzugriff und Verantwortlichkeiten.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant={targetProfile.role === 'admin' ? 'default' : 'outline'}
                  disabled={!canManageCritical}
                  onClick={() => handleUpdate({ role: 'admin' })}
                  className="h-20 flex-col gap-1"
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </Button>
                <Button 
                  variant={targetProfile.role === 'admin_co' ? 'default' : 'outline'}
                  disabled={!canManageCritical}
                  onClick={() => handleUpdate({ role: 'admin_co' })}
                  className="h-20 flex-col gap-1"
                >
                  <Shield className="h-5 w-5 opacity-50" />
                  <span>Co-Admin</span>
                </Button>
                <Button 
                  variant={targetProfile.role === 'planner' ? 'default' : 'outline'}
                  disabled={!canManageCritical}
                  onClick={() => handleUpdate({ role: 'planner' })}
                  className="h-20 flex-col gap-1"
                >
                  <Users className="h-5 w-5" />
                  <span>Planer (Standard)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Trophy className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">Aufgaben</span></div>
                <div className="text-2xl font-black">{targetProfile.task_stats?.completed_count || 0}</div>
                <div className="flex flex-col">
                  <div className="text-[10px] text-success font-medium">-{targetProfile.task_stats?.total_penalty_reduction || 0}€ Ticket-Rabatt</div>
                  {(targetProfile.task_stats?.ehrenpunkte ?? 0) > 0 && (
                    <div className="text-[10px] text-yellow-500 font-bold flex items-center gap-1">
                      <Star className="h-2 w-2 fill-current" /> {targetProfile.task_stats?.ehrenpunkte} Ehrenpunkte
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Activity className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">Karten geöffnet</span></div>
                <div className="text-2xl font-black">{targetProfile.booster_stats?.total_opened || 0}</div>
                <div className="text-[10px] text-muted-foreground">{targetProfile.booster_stats?.total_cards || 0} Karten gesamt</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><CreditCard className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">NP-Kontostand</span></div>
                <div className="text-2xl font-black text-brand">{targetProfile.currencies?.notepunkte || 0}</div>
                <div className="text-[10px] text-muted-foreground">In-App Währung</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Users className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">Referrals</span></div>
                <div className="text-2xl font-black">{targetProfile.total_referrals || 0}</div>
                <div className="text-[10px] text-muted-foreground">Code: {targetProfile.referral_code}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Letzte Aktivität</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Online Status</span>
                <Badge variant={targetProfile.isOnline ? "success" : "secondary"}>{targetProfile.isOnline ? "Online" : "Offline"}</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Zuletzt online</span>
                <span>{targetProfile.lastOnline ? new Date((targetProfile.lastOnline as any).seconds * 1000).toLocaleString('de-DE') : 'Unbekannt'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Letzte Sitzung</span>
                <span>{targetProfile.lastSessionDurationSeconds ? `${Math.round(targetProfile.lastSessionDurationSeconds / 60)} min` : '-'}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-warning/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Clock3 className="h-5 w-5 text-warning" /> Sperren & Moderation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  disabled={!canManageCritical} 
                  onClick={() => setIsTimeoutDialogOpen(true)}
                  className="w-full justify-start gap-2 h-12"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive" /> 
                  {targetProfile.timeout_until ? 'Sperre anpassen' : 'Nutzer warnen / sperren'}
                </Button>
                {targetProfile.timeout_until && (
                  <Button 
                    variant="ghost" 
                    onClick={() => handleUpdate({ timeout_until: null, timeout_reason: null })}
                    className="w-full text-destructive text-xs"
                  >
                    Sperre sofort aufheben
                  </Button>
                )}
                <Separator />
                <div className="space-y-2">
                  <Label>Account-Freigabe</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={targetProfile.is_approved ? "ghost" : "default"}
                      size="sm"
                      onClick={() => handleUpdate({ is_approved: true })}
                      disabled={targetProfile.is_approved || !canManageCritical}
                      className="flex-1 gap-2"
                    >
                      <UserCheck className="h-4 w-4" /> Freischalten
                    </Button>
                    <Button 
                      variant={!targetProfile.is_approved ? "ghost" : "outline"}
                      size="sm"
                      onClick={() => handleUpdate({ is_approved: false })}
                      disabled={!targetProfile.is_approved || !canManageCritical}
                      className="flex-1 gap-2"
                    >
                      <UserMinus className="h-4 w-4" /> Sperren
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Gefahrenzone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResetPasswordDialog userEmail={targetProfile.email} userName={targetProfile.full_name || 'User'} />
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Das Löschen eines Nutzers ist permanent und entfernt alle zugehörigen Daten, Inventare und Statistiken.
                </p>
                <Button 
                  variant="destructive" 
                  disabled={!canManageCritical} 
                  onClick={handleDeleteUser}
                  className="w-full gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Account löschen
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <DiscountHistoryDialog 
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        userId={id}
        userName={targetProfile.full_name || 'Nutzer'}
      />

      <SetTimeoutDialog 
        isOpen={isTimeoutDialogOpen}
        onOpenChange={setIsTimeoutDialogOpen}
        onConfirm={handleTimeoutConfirm}
        userName={targetProfile.full_name || 'Nutzer'}
      />
    </div>
  )
}
