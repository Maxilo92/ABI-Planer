'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, updateDoc, where, getDoc, orderBy, writeBatch } from 'firebase/firestore'
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
  Calendar as CalendarIcon,
  LayoutDashboard
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { logAction } from '@/lib/logging'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from 'next/navigation'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { GroupWall } from '@/components/groups/GroupWall'
import { GroupCard } from '@/components/groups/GroupCard'
import { MemberItem } from '@/components/groups/MemberItem'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { cn } from '@/lib/utils'

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
      
      const updateData: any = {
        planning_group: groupName
      }

      // Fix #1: Reset is_group_leader to false when removed from group
      if (groupName === null) {
        updateData.is_group_leader = false
      }
      
      await updateDoc(profileRef, updateData)

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

        // Fix #2: Use writeBatch for atomic updates
        const batch = writeBatch(db)
        
        batch.update(settingsRef, {
          planning_groups: updatedGroups
        })

        // Unset old leader
        if (previousLeaderId && previousLeaderId !== leaderUserId) {
          batch.update(doc(db, 'profiles', previousLeaderId), {
            is_group_leader: false
          })
        }

        // Also update the is_group_leader flag on the profile
        if (leaderUserId) {
          batch.update(doc(db, 'profiles', leaderUserId), {
            is_group_leader: true
          })
        }

        await batch.commit()

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
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full bg-muted/50 animate-pulse rounded-md" />
            ))}
          </aside>
          
          <div className="flex-1 space-y-8">
            <div className="h-32 w-full bg-muted/50 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-[600px] bg-muted/30 animate-pulse rounded-xl" />
              <div className="lg:col-span-4 space-y-6">
                <div className="h-64 bg-muted/30 animate-pulse rounded-xl" />
                <div className="h-64 bg-muted/30 animate-pulse rounded-xl" />
              </div>
            </div>
          </div>
        </div>
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
  const myTeamMembers = profiles.filter(p => p.planning_group === profile?.planning_group)
  const myTeamLeader = planningGroups.find(g => g.name === profile?.planning_group)?.leader_user_id

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Planungsgruppen</h1>
        <p className="text-muted-foreground">Zentraler Workspace für Teams & Koordination.</p>
      </div>

      <div className="w-full flex flex-col gap-8">
        {safeMainTab === 'mein-team' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {profile?.planning_group ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-lg shadow-primary/20">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-primary">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  <div className="lg:col-span-7 2xl:col-span-8 min-w-0">
                    <GroupWall
                      groupName={profile.planning_group}
                      canManage={isGroupLeader || isPlanner}
                    />
                  </div>

                  <div className="lg:col-span-5 2xl:col-span-4 min-w-0 space-y-6">
                    <GroupCard className="border-primary/5 shadow-subtle">
                      <GroupCard.Header 
                        name="Team Mitglieder" 
                        memberCount={myTeamMembers.length}
                        actions={
                          canManageTeamMembers && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )
                        }
                      />
                      <GroupCard.MemberList 
                        emptyState={
                          <p className="text-sm text-muted-foreground italic text-center py-4">
                            Keine Mitglieder gefunden.
                          </p>
                        }
                      >
                        {myTeamMembers.map((member) => (
                          <MemberItem
                            key={member.id}
                            member={member}
                            isLeader={member.id === myTeamLeader || !!member.is_group_leader}
                            showActions={canManageTeamMembers}
                            onMakeLeader={isPlanner ? (id) => handleAssignLeader(profile.planning_group!, id) : undefined}
                            onRemove={(id) => handleUpdateMember(id, null)}
                          />
                        ))}
                      </GroupCard.MemberList>
                    </GroupCard>

                    <TodoList
                      todos={myTeamTodos}
                      canManage={isGroupLeader || isPlanner}
                      maxItems={8}
                    />

                    <CalendarEvents
                      events={events.slice(0, 5)}
                      canManage={isPlanner}
                      useScrollContainer={false}
                    />
                  </div>
                </div>

          </div>
        )}

        {safeMainTab === 'alle-gruppen' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                      <LayoutDashboard className="h-6 w-6 text-primary" /> Alle Planungsgruppen
                    </h2>
                    <p className="text-sm text-muted-foreground">Übersicht aller aktiven Teams und deren Mitglieder.</p>
                  </div>
                  {isPlanner && (
                    <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm" render={
                      <Link href="/einstellungen">
                        <PlusCircle className="h-4 w-4 text-primary" /> 
                        <span className="font-semibold">Gruppen verwalten</span>
                      </Link>
                    } />
                  )}
                </div>

                {planningGroups.length === 0 ? (
                  <Card className="border-dashed bg-muted/20">
                    <CardContent className="py-20 text-center">
                      <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-medium">Noch keine Planungsgruppen erstellt.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {planningGroups.map((group) => {
                      const members = profiles.filter((p) => p.planning_group === group.name)
                      const leader = profiles.find((p) => p.id === group.leader_user_id)

                      return (
                        <GroupCard key={group.name} className="border-primary/5 hover:border-primary/20 hover:shadow-md transition-all">
                          <GroupCard.Header 
                            name={group.name} 
                            memberCount={members.length}
                            actions={
                              leader && (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-50 gap-1 px-1.5 py-0.5">
                                  <Trophy className="h-3 w-3 text-amber-500 fill-amber-500" />
                                  <span className="text-[10px] font-bold uppercase">{leader.full_name?.split(' ')[0]}</span>
                                </Badge>
                              )
                            }
                          />
                          <GroupCard.MemberList 
                            emptyState={
                              <div className="py-8 text-center">
                                <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground italic">Keine Mitglieder</p>
                              </div>
                            }
                            className="max-h-[300px] overflow-y-auto scrollbar-thin"
                          >
                            {members.map((member) => (
                              <MemberItem
                                key={member.id}
                                member={member}
                                isLeader={member.id === group.leader_user_id || !!member.is_group_leader}
                                showActions={!!isPlanner || !!(isGroupLeader && group.name === profile?.planning_group)}
                                onMakeLeader={isPlanner ? (id) => handleAssignLeader(group.name, id) : undefined}
                                onRemove={(id) => handleUpdateMember(id, null)}
                              />
                            ))}
                          </GroupCard.MemberList>
                          {isPlanner && (
                            <GroupCard.Actions>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full h-8 text-[11px] font-bold uppercase tracking-wider"
                                onClick={() => {
                                  // For quick navigation to settings if needed
                                  router.push('/einstellungen')
                                }}
                              >
                                Team Konfigurieren
                              </Button>
                            </GroupCard.Actions>
                          )}
                        </GroupCard>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="border-primary/10 shadow-subtle overflow-hidden">
                  <div className="h-1.5 bg-primary" />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold">Gruppen-Statistik</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 transition-all hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <LayoutDashboard className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Gruppen gesamt</span>
                      </div>
                      <Badge variant="secondary" className="font-bold">{planningGroups.length}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 transition-all hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Zugeordnete Nutzer</span>
                      </div>
                      <Badge variant="secondary" className="font-bold">{profiles.filter((p) => p.planning_group).length}</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/50 transition-all hover:bg-red-50 dark:hover:bg-red-950/20 group">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg group-hover:scale-110 transition-transform">
                          <UserMinus className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">Ohne Gruppe</span>
                      </div>
                      <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold shadow-sm shadow-red-200">{unassignedProfiles.length}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-subtle border-l-4 border-l-primary">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-primary" /> Schnelle Zuordnung
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Nutzer direkt einem Team zuweisen.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Nutzer suchen..."
                        className="pl-10 h-10 bg-muted/20 border-border/50 focus:bg-background transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                      {unassignedProfiles.length === 0 ? (
                        <div className="py-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
                          <CheckCircle2 className="h-10 w-10 text-primary/20 mx-auto mb-3" />
                          <p className="text-xs text-muted-foreground italic font-medium">
                            Alle Nutzer sind versorgt!
                          </p>
                        </div>
                      ) : (
                        filteredUnassignedProfiles.map((p) => (
                          <div key={p.id} className="flex flex-col p-4 rounded-xl border bg-background hover:border-primary/30 transition-all gap-4 group/item">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border shadow-sm group-hover/item:scale-105 transition-transform">
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                  {p.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate group-hover/item:text-primary transition-colors">{p.full_name}</p>
                                <p className="text-[10px] text-muted-foreground font-medium truncate">{p.email}</p>
                              </div>
                            </div>

                            {(isPlanner || isGroupLeader) && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {isPlanner ? (
                                  planningGroups.slice(0, 4).map((group) => (
                                    <Button
                                      key={group.name}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                                      onClick={() => handleUpdateMember(p.id, group.name)}
                                    >
                                      + {group.name}
                                    </Button>
                                  ))
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-[10px] font-bold uppercase tracking-wider gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                                    onClick={() => handleUpdateMember(p.id, profile?.planning_group || null)}
                                  >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    In mein Team
                                  </Button>
                                )}
                                {isPlanner && planningGroups.length > 4 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold">
                                          Mehr...
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="end" className="w-48">
                                      {planningGroups.slice(4).map((group) => (
                                        <DropdownMenuItem 
                                          key={group.name}
                                          onClick={() => handleUpdateMember(p.id, group.name)}
                                          className="text-xs font-medium"
                                        >
                                          {group.name}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
          </div>
        )}

        {safeMainTab === 'shared-hub' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 rounded-3xl border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <MessageSquare className="h-32 w-32 rotate-12" />
              </div>
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl shadow-primary/30 scale-110">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-primary">Shared Hub</h2>
                  <p className="text-muted-foreground max-w-xl font-medium mt-1">
                    Zentrale Kommunikationsstelle für alle Planungsteams. Koordination, Austausch und Synergien nutzen.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex -space-x-3 overflow-hidden">
                  {profiles.filter(p => p.planning_group).slice(0, 5).map((p, i) => (
                    <Avatar key={i} className="inline-block h-9 w-9 rounded-full ring-2 ring-background border-2 border-primary/10">
                      <AvatarFallback className="bg-muted text-[10px] font-bold">{p.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted ring-2 ring-background text-[10px] font-bold">
                    +{profiles.filter(p => p.planning_group).length - 5}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 min-w-0">
                <GroupWall 
                  groupName="hub" 
                  type="hub"
                  canManage={isPlanner} 
                />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <Card className="bg-card border-primary/10 shadow-subtle relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-all group-hover:scale-110" />
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" /> Richtlinien
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-6 relative z-10">
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-xs">1</div>
                        <p className="text-muted-foreground leading-relaxed pt-1">Nutze den Hub für <strong>gruppenübergreifende</strong> Anfragen und wichtige Updates für alle.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-xs">2</div>
                        <p className="text-muted-foreground leading-relaxed pt-1">Sei präzise bei Anfragen an andere Teams – nutze die <strong>"An: Gruppe"</strong> Funktion.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-xs">3</div>
                        <p className="text-muted-foreground leading-relaxed pt-1">Wichtige Ankündigungen werden von den Planern oben <strong>angeheftet</strong>.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-xs text-primary font-bold italic text-center">
                        "Zusammenarbeit ist der Schlüssel zu einem unvergesslichen Abschluss!"
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/5 bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold">Aktivität</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-muted-foreground">Hub ist live & bereit für Input</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">
                      Nachrichten im Hub sind für alle Mitglieder sichtbar. Private Team-Details gehören in die Team-Pinnwand.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>    </div>
  )
}

