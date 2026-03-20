'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, updateDoc, where, getDoc, orderBy } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Profile, PlanningGroup, Settings, Todo, Event } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  ShieldCheck, 
  Loader2, 
  Search,
  PlusCircle,
  Trophy,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { logAction } from '@/lib/logging'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter } from 'next/navigation'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { GroupWall } from '@/components/groups/GroupWall'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'

type GroupsMainTab = 'mein-team' | 'alle-gruppen' | 'shared-hub'

export default function GroupsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [currentSearch, setCurrentSearch] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [planningGroups, setPlanningGroups] = useState<PlanningGroup[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin') && profile?.is_approved
  const isGroupLeader = profile?.is_group_leader

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncSearch = () => setCurrentSearch(window.location.search)
    syncSearch()

    window.addEventListener('popstate', syncSearch)
    return () => window.removeEventListener('popstate', syncSearch)
  }, [pathname])

  useEffect(() => {
    // 1. Listen to Profiles
    const profilesRef = collection(db, 'profiles')
    const qProfiles = query(profilesRef)
    const unsubscribeProfiles = onSnapshot(qProfiles, (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
    })

    // 2. Listen to Settings (for Planning Groups)
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings
        setPlanningGroups(data.planning_groups || [])
      }
    })

    // 3. Listen to Todos
    const qTodos = query(collection(db, 'todos'), orderBy('created_at', 'desc'))
    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo)))
    })

    // 4. Listen to Events
    const qEvents = query(collection(db, 'events'), orderBy('event_date', 'asc'))
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)))
      setLoading(false)
    })

    return () => {
      unsubscribeProfiles()
      unsubscribeSettings()
      unsubscribeTodos()
      unsubscribeEvents()
    }
  }, [])

  const handleUpdateMember = async (userId: string, groupName: string | null) => {
    const targetProfile = profiles.find(p => p.id === userId)
    const isTargetingOwnGroup = groupName === profile?.planning_group || 
                                (groupName === null && targetProfile?.planning_group === profile?.planning_group)

    if (!isPlanner && !(isGroupLeader && isTargetingOwnGroup)) return
    
    try {
      const profileRef = doc(db, 'profiles', userId)
      
      await updateDoc(profileRef, {
        planning_group: groupName
      })

      if (groupName) {
        toast.success(`${targetProfile?.full_name || 'Nutzer'} zur Gruppe "${groupName}" hinzugefügt.`)
        await logAction('GROUP_MEMBER_ADDED', user!.uid, profile?.full_name, { 
          target_user_id: userId, 
          target_user_name: targetProfile?.full_name,
          group_name: groupName 
        })
      } else {
        toast.success(`Nutzer aus der Gruppe entfernt.`)
        await logAction('GROUP_MEMBER_REMOVED', user!.uid, profile?.full_name, { 
          target_user_id: userId, 
          target_user_name: targetProfile?.full_name,
          previous_group: targetProfile?.planning_group
        })
      }
    } catch (error) {
      console.error('Error updating group member:', error)
      toast.error('Fehler beim Aktualisieren des Mitglieds.')
    }
  }

  const handleAssignLeader = async (groupName: string, leaderUserId: string | null) => {
    if (!isPlanner) return

    try {
      const settingsRef = doc(db, 'settings', 'config')
      const settingsSnap = await getDoc(settingsRef)
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as Settings
        const currentGroups = data.planning_groups || []
        
        const leaderProfile = leaderUserId ? profiles.find(p => p.id === leaderUserId) : null

        const updatedGroups = currentGroups.map(g => {
          if (g.name === groupName) {
            return {
              ...g,
              leader_user_id: leaderUserId,
              leader_name: leaderProfile?.full_name || null
            }
          }
          return g
        })

        const previousLeaderId = currentGroups.find(g => g.name === groupName)?.leader_user_id

        await updateDoc(settingsRef, {
          planning_groups: updatedGroups
        })

        // Unset old leader
        if (previousLeaderId && previousLeaderId !== leaderUserId) {
          await updateDoc(doc(db, 'profiles', previousLeaderId), {
            is_group_leader: false
          })
        }

        // Also update the is_group_leader flag on the profile
        if (leaderUserId) {
          await updateDoc(doc(db, 'profiles', leaderUserId), {
            is_group_leader: true
          })
        }

        toast.success(`Gruppenleiter für "${groupName}" aktualisiert.`)
        await logAction('GROUP_LEADER_ASSIGNED', user!.uid, profile?.full_name, {
          group_name: groupName,
          leader_user_id: leaderUserId,
          leader_name: leaderProfile?.full_name
        })
      }
    } catch (error) {
      console.error('Error assigning leader:', error)
      toast.error('Fehler beim Zuweisen des Leiters.')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const unassignedProfiles = profiles.filter(p => !p.planning_group && p.is_approved)
  const filteredUnassignedProfiles = unassignedProfiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const canManageTeamMembers = isGroupLeader || isPlanner
  const myTeamTodos = todos.filter(t => t.assigned_to_group === profile?.planning_group)
  const activeParams = new URLSearchParams(currentSearch)

  const defaultMainTab: GroupsMainTab = profile?.planning_group ? 'mein-team' : 'alle-gruppen'
  const requestedMainTab = activeParams.get('bereich')
  const mainTab: GroupsMainTab =
    requestedMainTab === 'mein-team' || requestedMainTab === 'alle-gruppen' || requestedMainTab === 'shared-hub'
      ? requestedMainTab
      : defaultMainTab
  const safeMainTab: GroupsMainTab = mainTab === 'mein-team' && !profile?.planning_group ? 'alle-gruppen' : mainTab

  const updateTabsQuery = (next: Partial<Record<'bereich' | 'teamTab' | 'gruppenTab', string | null>>) => {
    const params = new URLSearchParams(currentSearch)

    Object.entries(next).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
        return
      }

      params.set(key, value)
    })

    const query = params.toString()
    setCurrentSearch(query ? `?${query}` : '')
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const handleMainTabChange = (value: string) => {
    if (value !== 'mein-team' && value !== 'alle-gruppen' && value !== 'shared-hub') return
    updateTabsQuery({ bereich: value, teamTab: null, gruppenTab: null })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Planungsgruppen</h1>
          <Badge variant="secondary" className="px-1.5 py-0 text-[9px] uppercase tracking-wide">Beta</Badge>
        </div>
        <p className="text-muted-foreground">Teams für die ABI-Vorbereitung.</p>
      </div>

      <Tabs value={safeMainTab} onValueChange={handleMainTabChange} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-3 auto-rows-[2.5rem]">
          <TabsTrigger value="mein-team" className="h-10 text-xs sm:text-sm">Mein Team</TabsTrigger>
          <TabsTrigger value="alle-gruppen" className="h-10 text-xs sm:text-sm">Alle Gruppen</TabsTrigger>
          <TabsTrigger value="shared-hub" className="h-10 text-xs sm:text-sm">Shared Hub</TabsTrigger>
        </TabsList>

        <TabsContent value="mein-team" className="space-y-8">
          {profile?.planning_group ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{profile.planning_group}</h2>
                      {isGroupLeader && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Gruppenleiter-Modus
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Dein Team-Workspace</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AddTodoDialog defaultGroup={profile.planning_group} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <div className="lg:col-span-8 2xl:col-span-7 min-w-0">
                  <GroupWall
                    groupName={profile.planning_group}
                    canManage={isGroupLeader || isPlanner}
                  />
                </div>

                <div className="lg:col-span-4 2xl:col-span-5 min-w-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Team-Aufgaben
                      </h3>
                      <Badge variant="outline">{myTeamTodos.length}</Badge>
                    </div>
                    <TodoList
                      todos={myTeamTodos}
                      canManage={isGroupLeader || isPlanner}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" /> Nächste Termine
                      </h3>
                    </div>
                    <CalendarEvents
                      events={events.slice(0, 5)}
                      canManage={isPlanner}
                    />
                  </div>
                </div>
              </div>

              {canManageTeamMembers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" /> Mitglieder hinzufügen
                    </CardTitle>
                    <CardDescription>
                      Wähle Nutzer aus, die noch keiner Gruppe zugeordnet sind.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nutzer suchen..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {unassignedProfiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                          Alle aktiven Nutzer sind bereits in Gruppen.
                        </p>
                      ) : (
                        filteredUnassignedProfiles.map((p) => (
                          <div key={p.id} className="flex flex-col p-3 rounded-lg border bg-muted/30 gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>{p.full_name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{p.full_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {isPlanner ? (
                                planningGroups.map((group) => (
                                  <Button
                                    key={group.name}
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-3 text-xs sm:h-7 sm:px-2 sm:text-[10px]"
                                    onClick={() => handleUpdateMember(p.id, group.name)}
                                  >
                                    + {group.name}
                                  </Button>
                                ))
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-10 px-3 text-xs sm:h-7 sm:px-2 sm:text-[10px]"
                                  onClick={() => handleUpdateMember(p.id, profile?.planning_group || null)}
                                  title="Zu deinem Team hinzufügen"
                                >
                                  + Mein Team
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">Du bist noch in keinem Team</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Wende dich an die Planer, um einer Planungsgruppe zugewiesen zu werden und deinen Team-Workspace zu aktivieren.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alle-gruppen" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Alle Planungsgruppen</h2>
                {isPlanner && (
                  <Button variant="outline" size="sm" render={
                    <Link href="/einstellungen">
                      <PlusCircle className="mr-2 h-4 w-4" /> Gruppen verwalten
                    </Link>
                  } />
                )}
              </div>

              {planningGroups.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground italic">Noch keine Planungsgruppen erstellt.</p>
                  </CardContent>
                </Card>
              ) : (
                planningGroups.map((group) => {
                  const members = profiles.filter((p) => p.planning_group === group.name)
                  const leader = profiles.find((p) => p.id === group.leader_user_id)

                  return (
                    <Card key={group.name} className="overflow-hidden">
                      <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-xl">{group.name}</CardTitle>
                            <CardDescription>{members.length} Mitglieder</CardDescription>
                          </div>
                          {leader && (
                            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/20">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span className="text-xs font-semibold">{leader.full_name}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {members.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-4">
                              Noch keine Mitglieder in dieser Gruppe.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>{member.full_name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{member.full_name}</p>
                                      {(member.id === group.leader_user_id || member.is_group_leader) && (
                                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Leiter</span>
                                      )}
                                    </div>
                                  </div>
                                  {(isPlanner || (isGroupLeader && group.name === profile?.planning_group)) && (
                                    <div className="flex items-center gap-1">
                                      {isPlanner && member.id !== group.leader_user_id && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 sm:h-7 sm:w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                          onClick={() => handleAssignLeader(group.name, member.id)}
                                          title="Zum Leiter machen"
                                        >
                                          <ShieldCheck className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 sm:h-7 sm:w-7 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleUpdateMember(member.id, null)}
                                        title={isPlanner ? 'Aus Gruppe entfernen' : 'Aus meinem Team entfernen'}
                                      >
                                        <UserMinus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistik</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gruppen gesamt:</span>
                    <span className="font-bold">{planningGroups.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Zugeordnete Nutzer:</span>
                    <span className="font-bold">{profiles.filter((p) => p.planning_group).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ohne Gruppe:</span>
                    <span className="font-bold">{unassignedProfiles.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" /> Mitgliederzuordnung
                  </CardTitle>
                  <CardDescription>
                    Ordne unzugeordnete Nutzer zentral direkt den Teams zu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nutzer suchen..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {unassignedProfiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">
                        Alle aktiven Nutzer sind bereits in Gruppen.
                      </p>
                    ) : (
                      filteredUnassignedProfiles.map((p) => (
                        <div key={p.id} className="flex flex-col p-3 rounded-lg border bg-muted/30 gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{p.full_name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{p.full_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                            </div>
                          </div>

                          {(isPlanner || isGroupLeader) && (
                            <div className="flex flex-wrap gap-1">
                              {isPlanner ? (
                                planningGroups.map((group) => (
                                  <Button
                                    key={group.name}
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-3 text-xs sm:h-7 sm:px-2 sm:text-[10px]"
                                    onClick={() => handleUpdateMember(p.id, group.name)}
                                  >
                                    + {group.name}
                                  </Button>
                                ))
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-10 px-3 text-xs sm:h-7 sm:px-2 sm:text-[10px]"
                                  onClick={() => handleUpdateMember(p.id, profile?.planning_group || null)}
                                  title="Zu deinem Team hinzufügen"
                                >
                                  + Mein Team
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shared-hub" className="space-y-6">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Shared Hub</h2>
                <p className="text-sm text-muted-foreground">Gruppenübergreifender Austausch & Koordination. Ideal für Anfragen an andere Teams oder allgemeine Infos.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <GroupWall 
                groupName="hub" 
                type="hub"
                canManage={isPlanner} 
              />
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Was ist der Hub?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                  <p>
                    Der <strong>Shared Hub</strong> ist die zentrale Kommunikationsstelle für alle Planungsteams.
                  </p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>Stelle Fragen an andere Gruppen</li>
                    <li>Teile wichtige Updates für alle</li>
                    <li>Koordiniere Termine gruppenübergreifend</li>
                    <li>Suche Unterstützung für Aufgaben</li>
                  </ul>
                  <p className="italic pt-2">
                    Deine Nachrichten im Hub sind für alle Nutzer sichtbar, die einer Planungsgruppe angehören.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
