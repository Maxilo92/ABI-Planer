'use client'

import { useEffect, useState, Suspense } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, updateDoc, getDoc, orderBy, writeBatch } from 'firebase/firestore'
import { cn } from '@/lib/utils'
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
  LayoutDashboard,
  BarChart,
  PieChart,
  Info,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { logAction } from '@/lib/logging'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { GroupWall } from '@/components/groups/GroupWall'
import { GroupCard } from '@/components/groups/GroupCard'
import { MemberItem } from '@/components/groups/MemberItem'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'

type GroupsMainTab = 'mein-team' | 'alle-gruppen' | 'shared-hub'

function GroupsPageContent() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [planningGroups, setPlanningGroups] = useState<PlanningGroup[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin') && profile?.is_approved
  const isGroupLeader = profile?.is_group_leader

  useEffect(() => {
    if (authLoading) return

    if (!profile?.id) {
      if (!authLoading) setLoading(false)
      return
    }

    // 1. Listen to Profiles
    const profilesRef = collection(db, 'profiles')
    const qProfiles = query(profilesRef)
    const unsubscribeProfiles = onSnapshot(qProfiles, (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))
    }, (error) => {
      console.error('Error listening to profiles:', error)
    })

    // 2. Listen to Settings (for Planning Groups)
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings
        setPlanningGroups(data.planning_groups || [])
      }
    }, (error) => {
      console.error('Error listening to settings:', error)
    })

    // 3. Listen to Todos
    const qTodos = query(collection(db, 'todos'), orderBy('created_at', 'desc'))
    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo)))
    }, (error) => {
      console.error('Error listening to todos:', error)
    })

    // 4. Listen to Events
    const qEvents = query(collection(db, 'events'), orderBy('start_date', 'asc'))
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)))
      setLoading(false)
    }, (error) => {
      console.error('Error listening to events:', error)
      setLoading(false)
    })

    return () => {
      unsubscribeProfiles()
      unsubscribeSettings()
      unsubscribeTodos()
      unsubscribeEvents()
    }
  }, [authLoading, profile?.id])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Arbeitsgruppen gesperrt" 
          description="Die internen Planungsgruppen und deren Kommunikation sind privat. Bitte melde dich an, um mitzuplanen."
          icon={<Users className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

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

        const batch = writeBatch(db)
        
        batch.update(settingsRef, {
          planning_groups: updatedGroups
        })

        if (previousLeaderId && previousLeaderId !== leaderUserId) {
          batch.update(doc(db, 'profiles', previousLeaderId), {
            is_group_leader: false
          })
        }

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
  const myTeamMembers = profiles.filter(p => p.planning_group === profile?.planning_group)
  const myTeamLeader = planningGroups.find(g => g.name === profile?.planning_group)?.leader_user_id

  const defaultMainTab: GroupsMainTab = profile?.planning_group ? 'mein-team' : 'alle-gruppen'
  const requestedMainTab = searchParams.get('bereich')
  const mainTab: GroupsMainTab =
    requestedMainTab === 'mein-team' || requestedMainTab === 'alle-gruppen' || requestedMainTab === 'shared-hub'
      ? requestedMainTab
      : defaultMainTab
  const safeMainTab: GroupsMainTab = mainTab === 'mein-team' && !profile?.planning_group ? 'alle-gruppen' : mainTab

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Users className="h-3 w-3" />
            Collaboration Workspace
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Planungsgruppen
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-2xl">
            Zentraler Workspace für Teams & Koordination. Gemeinsam zum perfekten Abitur.
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-8">
        {safeMainTab === 'mein-team' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {profile?.planning_group ? (
              <div className="space-y-10">
                <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 rounded-[2.5rem] border border-primary/10 shadow-2xl shadow-primary/5 group">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-1000" />
                  
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-primary text-primary-foreground p-4 rounded-3xl shadow-2xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tight text-primary drop-shadow-sm">{profile.planning_group}</h2>
                        {isGroupLeader && (
                          <Badge variant="secondary" className="bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50 backdrop-blur-sm px-3 py-1 rounded-xl flex items-center gap-2 animate-pulse">
                            <ShieldCheck className="h-3.5 w-3.5 fill-amber-500/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Team-Leader</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground font-semibold mt-1">Dein exklusiver Team-Workspace</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <AddTodoDialog defaultGroup={profile.planning_group} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 2xl:col-span-8 min-w-0">
                    <GroupWall
                      groupName={profile.planning_group}
                      canManage={isGroupLeader || isPlanner}
                    />
                  </div>

                  <div className="lg:col-span-5 2xl:col-span-4 min-w-0 space-y-8">
                    <GroupCard className="border-primary/5 shadow-2xl rounded-[2rem] overflow-hidden border-t-8 border-t-primary">
                      <GroupCard.Header 
                        name="Team Mitglieder" 
                        memberCount={myTeamMembers.length}
                        className="border-none pt-8 pb-2"
                        actions={
                          canManageTeamMembers && (
                            <div className="p-2 bg-primary/5 rounded-full">
                              <UserPlus className="h-5 w-5 text-primary opacity-40" />
                            </div>
                          )
                        }
                      />
                      <GroupCard.MemberList 
                        emptyState={
                          <div className="py-12 text-center bg-muted/20 rounded-3xl border border-dashed m-4">
                            <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-bold italic">
                              Team ist noch leer.
                            </p>
                          </div>
                        }
                        className="px-4 pb-8"
                      >
                        <div className="space-y-2 mt-4">
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
                        </div>
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

                {canManageTeamMembers && (
                  <Card className="border-primary/10 bg-muted/30 rounded-[2.5rem] border-dashed overflow-hidden relative group/assign">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover/assign:scale-110 transition-transform duration-700">
                      <UserPlus className="h-48 w-48" />
                    </div>
                    <CardHeader className="pb-6 pt-8 px-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-black flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                              <UserPlus className="h-5 w-5" />
                            </div>
                            Verfügbare Nutzer
                          </CardTitle>
                          <CardDescription className="text-sm font-medium">
                            Füge Personen direkt deinem Team hinzu.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit h-8 px-4 rounded-full font-bold border-primary/20 bg-primary/5 text-primary">
                          {unassignedProfiles.length} Personen verfügbar
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                          placeholder="Nutzer suchen..."
                          className="pl-12 h-14 bg-background border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-base font-medium shadow-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                        {unassignedProfiles.length === 0 ? (
                          <div className="col-span-full py-20 text-center bg-background/50 rounded-[2rem] border-2 border-dashed border-border/50">
                            <Users className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                            <p className="text-lg font-bold text-muted-foreground italic">
                              Aktuell sind alle angemeldeten Nutzer bereits in Teams.
                            </p>
                          </div>
                        ) : (
                          filteredUnassignedProfiles.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl border bg-background hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all group/item">
                              <div className="flex items-center gap-4 min-w-0">
                                <Avatar className="h-12 w-12 border-2 border-background ring-1 ring-muted">
                                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-black">
                                    {p.full_name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-black truncate group-hover/item:text-primary transition-colors">{p.full_name}</p>
                                  <p className="text-[10px] text-muted-foreground font-bold truncate tracking-wider uppercase">{p.email.split('@')[0]}</p>
                                </div>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                {isPlanner ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-9 px-3 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl shadow-sm"
                                        >
                                          <PlusCircle className="h-3.5 w-3.5" />
                                          Wählen
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl">
                                      {planningGroups.map((group) => (
                                        <DropdownMenuItem 
                                          key={group.name}
                                          onClick={() => handleUpdateMember(p.id, group.name)}
                                          className="rounded-xl p-3 font-bold"
                                        >
                                          <ArrowRight className="h-4 w-4 mr-2 opacity-30" />
                                          {group.name}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-4 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-md active:scale-95"
                                    onClick={() => handleUpdateMember(p.id, profile?.planning_group || null)}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    Hinzufügen
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
              <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-2xl border border-dashed p-8">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-bold">Kein Team zugewiesen</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                  Du bist aktuell noch keiner Planungsgruppe zugeordnet.
                </p>
                <Button variant="outline" size="sm" className="mt-6" render={<Link href="/einstellungen" />}>
                  Profil vervollständigen
                </Button>
              </div>
            )}
          </div>
        )}

        {safeMainTab === 'alle-gruppen' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-primary/5 border border-primary/10 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                  <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="space-y-1 relative z-10">
                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                      <div className="p-2.5 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                        <Users className="h-6 w-6" />
                      </div>
                      Alle Planungsgruppen
                    </h2>
                    <p className="text-muted-foreground max-w-md font-medium">
                      Übersicht aller aktiven Teams und deren Mitglieder. Hier werden Visionen zu Plänen.
                    </p>
                  </div>

                  {isPlanner && (
                    <Button size="lg" className="h-12 px-6 gap-2 shadow-xl shadow-primary/10 relative z-10" render={
                      <Link href="/einstellungen">
                        <PlusCircle className="h-5 w-5" /> 
                        <span>Gruppen verwalten</span>
                      </Link>
                    } />
                  )}
                </div>

                {planningGroups.length === 0 ? (
                  <Card className="border-dashed bg-muted/20 rounded-3xl">
                    <CardContent className="py-24 text-center">
                      <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Users className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Noch keine Teams</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">Es wurden noch keine Planungsgruppen erstellt. Starte ein neues Projekt!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {planningGroups.map((group, idx) => {
                      const members = profiles.filter((p) => p.planning_group === group.name)
                      const leader = profiles.find((p) => p.id === group.leader_user_id)
                      const colors = ['border-blue-500', 'border-purple-500', 'border-amber-500', 'border-emerald-500', 'border-rose-500', 'border-indigo-500']
                      const colorClass = colors[idx % colors.length]

                      return (
                        <GroupCard key={group.name} className={cn(
                          "border-primary/5 hover:border-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden border-t-4",
                          colorClass.replace('border-', 'border-t-')
                        )}>
                          <GroupCard.Header 
                            name={group.name} 
                            memberCount={members.length}
                            className="bg-muted/10 border-none pb-2 pt-6"
                            actions={
                              leader && (
                                <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-foreground border-border/50 backdrop-blur-sm gap-1.5 px-2 py-1 shadow-sm">
                                  <Trophy className="h-3 w-3 text-amber-500" />
                                  <span className="text-[10px] font-bold uppercase tracking-tight">{leader.full_name?.split(' ')[0]}</span>
                                </Badge>
                              )
                            }
                          />
                          <GroupCard.MemberList 
                            emptyState={
                              <div className="py-12 text-center bg-muted/5 rounded-2xl border border-dashed mx-4 my-2">
                                <Users className="h-8 w-8 text-muted-foreground/10 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground italic">Noch keine Mitglieder</p>
                              </div>
                            }
                            className="max-h-[350px] overflow-y-auto scrollbar-thin px-4"
                          >
                            <div className="space-y-1 mt-2">
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
                            </div>
                          </GroupCard.MemberList>
                          {isPlanner && (
                            <GroupCard.Actions className="bg-transparent border-none pb-6 px-4 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full h-10 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary hover:text-primary-foreground transition-all group/btn"
                                onClick={() => router.push('/einstellungen')}
                              >
                                <span>Team Konfigurieren</span>
                                <ArrowRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </GroupCard.Actions>
                          )}
                        </GroupCard>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-8">
                {/* Stats Card */}
                <Card className="border-primary/10 shadow-xl rounded-3xl overflow-hidden border-t-0">
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-primary" />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" /> Gruppen-Statistik
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                            <LayoutDashboard className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold">Gruppen</span>
                        </div>
                        <span className="text-xl font-black">{planningGroups.length}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                          <span>Team-Zuweisung</span>
                          <span>{Math.round((profiles.filter((p) => p.planning_group).length / profiles.length) * 100 || 0)}%</span>
                        </div>
                        <Progress 
                          value={(profiles.filter((p) => p.planning_group).length / profiles.length) * 100 || 0} 
                          className="h-2 bg-muted rounded-full"
                        />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium pt-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>{profiles.filter((p) => p.planning_group).length} im Team</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                            <span>{unassignedProfiles.length} frei</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg. Team</p>
                        <p className="text-xl font-bold">
                          {planningGroups.length > 0 ? Math.round(profiles.filter(p => p.planning_group).length / planningGroups.length) : 0}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Planer</p>
                        <p className="text-xl font-bold">
                          {profiles.filter(p => p.role === 'planner' || p.role?.startsWith('admin')).length}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 group transition-all hover:shadow-md hover:shadow-red-500/5">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                          <UserMinus className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-red-700 dark:text-red-400 block leading-none">Kein Team</span>
                          <span className="text-[10px] text-red-600/60 dark:text-red-400/60 font-medium">Sofort handeln</span>
                        </div>
                      </div>
                      <Badge className="bg-red-600 hover:bg-red-700 font-black px-3 py-1 text-xs shadow-lg shadow-red-500/20">{unassignedProfiles.length}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Assign Card */}
                <Card className="border-primary/10 shadow-xl rounded-3xl border-l-8 border-l-primary overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                    <UserPlus className="h-32 w-32" />
                  </div>
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-primary" /> Schnelle Zuordnung
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">
                          Füge unentschlossene Nutzer direkt hinzu.
                        </CardDescription>
                      </div>
                      <div className="p-2 bg-primary/5 rounded-full">
                        <Info className="h-4 w-4 text-primary opacity-40" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary group-focus-within:scale-110 transition-all" />
                      <Input
                        placeholder="Nutzer suchen..."
                        className="pl-10 h-12 bg-muted/20 border-border/50 focus:bg-background rounded-2xl transition-all shadow-inner border-none focus:ring-2 focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                      {unassignedProfiles.length === 0 ? (
                        <div className="py-16 text-center bg-primary/5 rounded-[2rem] border border-dashed border-primary/20">
                          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <CheckCircle2 className="h-8 w-8 text-primary/40" />
                          </div>
                          <p className="text-sm font-bold text-primary/60 italic px-6">
                            Alle Nutzer sind versorgt! Keine unzugeordneten Profile.
                          </p>
                        </div>
                      ) : (
                        filteredUnassignedProfiles.map((p) => (
                          <div key={p.id} className="flex flex-col p-5 rounded-3xl border border-border/40 bg-background hover:border-primary/30 hover:shadow-lg transition-all gap-4 group/item">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 shadow-sm border-2 border-background ring-1 ring-muted">
                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-black text-base">
                                  {p.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold truncate group-hover/item:text-primary transition-colors">{p.full_name}</p>
                                <p className="text-[11px] text-muted-foreground font-semibold truncate flex items-center gap-1.5">
                                  <TrendingUp className="h-3 w-3 opacity-30" />
                                  {p.email}
                                </p>
                              </div>
                            </div>

                            {(isPlanner || isGroupLeader) && (
                              <div className="flex flex-wrap gap-2 pt-1 border-t border-muted/50 mt-1 pt-4">
                                {isPlanner ? (
                                  planningGroups.slice(0, 4).map((group) => (
                                    <Button
                                      key={group.name}
                                      variant="secondary"
                                      size="sm"
                                      className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                      onClick={() => handleUpdateMember(p.id, group.name)}
                                    >
                                      + {group.name}
                                    </Button>
                                  ))
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-10 text-[10px] font-bold uppercase tracking-widest gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all rounded-xl shadow-sm"
                                    onClick={() => handleUpdateMember(p.id, profile?.planning_group || null)}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    In mein Team
                                  </Button>
                                )}
                                {isPlanner && planningGroups.length > 4 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black tracking-tighter opacity-50 hover:opacity-100">
                                          MEHR...
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl">
                                      {planningGroups.slice(4).map((group) => (
                                        <DropdownMenuItem 
                                          key={group.name}
                                          onClick={() => handleUpdateMember(p.id, group.name)}
                                          className="text-xs font-bold rounded-xl p-2.5"
                                        >
                                          <ArrowRight className="h-3.5 w-3.5 mr-2 opacity-30" />
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
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-10 rounded-[3rem] border border-primary/10 relative overflow-hidden shadow-2xl shadow-primary/5 group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-1000">
                <MessageSquare className="h-48 w-48" />
              </div>
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="flex items-center gap-8 relative z-10">
                <div className="bg-primary text-primary-foreground p-5 rounded-[2rem] shadow-2xl shadow-primary/30 rotate-6 group-hover:rotate-0 transition-all duration-500 scale-110">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tight text-primary drop-shadow-sm">Shared Hub</h2>
                  <p className="text-muted-foreground max-w-xl font-semibold text-lg leading-relaxed">
                    Zentrale Kommunikationsstelle für alle Planungsteams. Koordination, Austausch und Synergien nutzen.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 relative z-10 bg-white/50 dark:bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-border/50">
                <div className="flex -space-x-4 overflow-hidden">
                  {profiles.filter(p => p.planning_group).slice(0, 5).map((p, i) => (
                    <Avatar key={i} className="h-10 w-10 border-2 border-background ring-1 ring-muted">
                      <AvatarFallback className="bg-muted text-[10px] font-black">{p.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground ring-2 ring-background text-[10px] font-black shadow-lg">
                    +{profiles.filter(p => p.planning_group).length - 5}
                  </div>
                </div>
                <div className="pr-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Active Now</p>
                  <p className="text-xs font-bold text-muted-foreground leading-none">Involved Teams</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 min-w-0">
                <GroupWall 
                  groupName="hub" 
                  type="hub"
                  canManage={isPlanner} 
                />
              </div>
              <div className="lg:col-span-4 space-y-8">
                <Card className="bg-card border-primary/10 shadow-2xl rounded-[2.5rem] relative overflow-hidden group/guidelines border-b-8 border-b-primary">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] transition-all group-hover/guidelines:scale-110 duration-700" />
                  <CardHeader className="pt-10 px-8">
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      Hub-Richtlinien
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-8 relative z-10 px-8 pb-12">
                    <div className="space-y-6">
                      <div className="flex gap-5">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-sm shadow-inner italic">1</div>
                        <p className="text-muted-foreground font-medium leading-relaxed pt-1">Nutze den Hub für <strong>gruppenübergreifende</strong> Anfragen und wichtige Updates für alle.</p>
                      </div>
                      <div className="flex gap-5">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-sm shadow-inner italic">2</div>
                        <p className="text-muted-foreground font-medium leading-relaxed pt-1">Sei präzise bei Anfragen an andere Teams – nutze die <strong>"An: Gruppe"</strong> Funktion.</p>
                      </div>
                      <div className="flex gap-5">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-sm shadow-inner italic">3</div>
                        <p className="text-muted-foreground font-medium leading-relaxed pt-1">Wichtige Ankündigungen werden von den Planern oben <strong>angeheftet</strong>.</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-inner">
                      <p className="text-sm text-primary font-black italic text-center leading-relaxed">
                        "Zusammenarbeit ist der Schlüssel zu einem unvergesslichen Abschluss!"
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/5 bg-muted/20 rounded-[2rem] border-dashed">
                  <CardHeader className="pb-4 pt-8 px-8">
                    <CardTitle className="text-xl font-black flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500" /> Live Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 px-8 pb-8">
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-2xl border border-border/50">
                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                      <span className="text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-400">Hub ist aktiv</span>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                      <Info className="h-5 w-5 text-primary opacity-40 shrink-0" />
                      <p className="text-xs text-muted-foreground font-bold italic leading-relaxed">
                        Nachrichten im Hub sind für alle Mitglieder sichtbar. Private Team-Details gehören in die Team-Pinnwand.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>    </div>
  )
}

export default function GroupsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <GroupsPageContent />
    </Suspense>
  )
}
