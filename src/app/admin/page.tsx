'use client'

import { Profile, UserRole, PlanningGroup, Settings as AppSettings } from '@/types/database'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, ChevronDown, Check, Shield, User, Trash2, Crown, Users, Settings as SettingsIcon } from 'lucide-react'
import { ResetPasswordDialog } from '@/components/modals/ResetPasswordDialog'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function AdminPage() {
  const { profile: currentUser, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const isMainAdmin = currentUser?.role === 'admin_main' || currentUser?.role === 'admin'
  const isCoAdmin = currentUser?.role === 'admin_co'
  const isAdmin = isMainAdmin || isCoAdmin

  useEffect(() => {
    if (!authLoading && currentUser && !isAdmin) {
      router.push('/')
    }
  }, [currentUser, authLoading, router, isAdmin])

  useEffect(() => {
    // 1. Listen to Profiles
    const q = query(collection(db, 'profiles'), orderBy('created_at', 'desc'))
    const unsubscribeProfiles = onSnapshot(q, (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
    })

    // 2. Listen to Settings
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setAppSettings({ id: 1, ...doc.data() } as AppSettings)
      }
      setLoading(false)
    })

    return () => {
      unsubscribeProfiles()
      unsubscribeSettings()
    }
  }, [])

  const handleUpdateProfile = async (id: string, updates: Partial<Profile>, targetRole?: UserRole) => {
    // Safety check: Cannot modify Main Admin unless you are the system (or we ignore it here and let Firestore rules handle it)
    const target = profiles.find(p => p.id === id)
    if (!target) return

    // Restriction: Cannot change Main Admin's role
    if ((target.role === 'admin_main' || target.role === 'admin') && updates.role && updates.role !== target.role) {
      toast.error('Der Haupt-Admin kann nicht degradiert werden!')
      return
    }

    // Restriction: Co-Admin cannot change roles of others (only approve)
    if (isCoAdmin && updates.role) {
      toast.error('Co-Admins dürfen keine Rollen vergeben.')
      return
    }

    // Restriction: Cannot change own role
    if (id === currentUser?.id && updates.role) {
      toast.error('Du kannst deine eigene Rolle nicht ändern!')
      return
    }

    try {
      const docRef = doc(db, 'profiles', id)
      await updateDoc(docRef, updates)
      toast.success('Profil erfolgreich aktualisiert.')
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Fehler beim Aktualisieren des Profils.')
    }
  }

  const handleDeleteProfile = async (id: string) => {
    const target = profiles.find(p => p.id === id)
    if (target?.role === 'admin_main' || target?.role === 'admin') {
      toast.error('Der Haupt-Admin kann nicht gelöscht werden!')
      return
    }

    if (window.confirm('Bist du sicher, dass du diesen Nutzer löschen möchtest?')) {
      try {
        await deleteDoc(doc(db, 'profiles', id))
        toast.success('Nutzer erfolgreich gelöscht.')
      } catch (err) {
        console.error('Error deleting profile:', err)
        toast.error('Fehler beim Löschen des Nutzers.')
      }
    }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Admin Dashboard...</div>
  }

  if (!isAdmin) return null

  const planningGroups: PlanningGroup[] = [
    'Finanzen',
    'Location & Catering',
    'Programm & DJ',
    'Deko & Motto',
    'IT & Kommunikation'
  ]

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'admin_main': return <Badge className="bg-amber-500 hover:bg-amber-600 border-none"><Crown className="h-3 w-3 mr-1" /> Main Admin</Badge>
      case 'admin_co': return <Badge className="bg-blue-500 hover:bg-blue-600 border-none"><Shield className="h-3 w-3 mr-1" /> Co-Admin</Badge>
      case 'planner': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200"><Users className="h-3 w-3 mr-1" /> Planer</Badge>
      default: return <Badge variant="outline" className="text-muted-foreground"><User className="h-3 w-3 mr-1" /> Zuschauer</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-muted-foreground text-sm">
            {isMainAdmin ? 'Vollzugriff: Rollen, Gruppen & Freischaltung' : 'Eingeschränkt: Nur Freischaltung'}
          </p>
        </div>
        {isAdmin && (
          <EditSettingsDialog 
            currentDate={appSettings?.ball_date} 
            currentGoal={appSettings?.funding_goal} 
            currentCourses={appSettings?.courses}
          />
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Alle Mitglieder</CardTitle>
          <CardDescription>
            Verwalte Berechtigungen, Kurse und Planungsgruppen für den Jahrgang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Name / E-Mail</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rolle & Gruppe</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const isSelf = p.id === currentUser?.id
                  const isTargetMainAdmin = p.role === 'admin_main' || p.role === 'admin'
                  const canEdit = isMainAdmin ? !isSelf : (!isSelf && !isTargetMainAdmin && p.role !== 'admin_co')

                  return (
                    <TableRow key={p.id} className={isSelf ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{p.full_name || 'Unbekannt'} {isSelf && '(Du)'}</span>
                          <span className="text-[10px] text-muted-foreground">{p.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={!canEdit}
                            render={
                              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold px-2">
                                {p.class_name || '?'} <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Kurs wechseln</DropdownMenuLabel>
                            {(appSettings?.courses || ['12A', '12B', '12C', '12D']).map((course) => (
                              <DropdownMenuItem key={course} onClick={() => handleUpdateProfile(p.id, { class_name: course })}>
                                {course} {p.class_name === course && <Check className="ml-auto h-3 w-3" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_approved ? 'secondary' : 'destructive'} className="text-[10px]">
                          {p.is_approved ? 'Freigeschaltet' : 'Wartend'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getRoleBadge(p.role)}
                          {p.role === 'planner' && p.planning_group && (
                            <Badge variant="outline" className="text-[9px] bg-muted/50">
                              {p.planning_group}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Aktionen</DropdownMenuLabel>
                            
                            {!p.is_approved && (
                              <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { is_approved: true })}>
                                <Check className="mr-2 h-4 w-4 text-emerald-500" /> Freischalten
                              </DropdownMenuItem>
                            )}

                            {isMainAdmin && !isSelf && !isTargetMainAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Rolle zuweisen</DropdownMenuLabel>
                                
                                <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'admin_co' })}>
                                  <Shield className="mr-2 h-4 w-4 text-blue-500" /> Zum Co-Admin ernennen
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'planner' })}>
                                  <Users className="mr-2 h-4 w-4 text-emerald-500" /> Zum Planer machen
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateProfile(p.id, { role: 'viewer' })}>
                                  <User className="mr-2 h-4 w-4 text-slate-500" /> Zum Zuschauer machen
                                </DropdownMenuItem>

                                {p.role === 'planner' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Gruppe zuweisen</DropdownMenuLabel>
                                    {planningGroups.map(group => (
                                      <DropdownMenuItem key={group} onClick={() => handleUpdateProfile(p.id, { planning_group: group })}>
                                        <SettingsIcon className="mr-2 h-3 w-3" /> {group}
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                )}
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            <ResetPasswordDialog userEmail={p.email} userName={p.full_name || 'User'} />
                            
                            {isMainAdmin && !isSelf && !isTargetMainAdmin && (
                              <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleDeleteProfile(p.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Nutzer löschen
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
