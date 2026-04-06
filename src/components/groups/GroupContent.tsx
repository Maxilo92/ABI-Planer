'use client'

import { Profile, PlanningGroup, Todo, Event } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  ShieldCheck, 
  Search,
  PlusCircle,
  Trophy,
  MessageSquare,
  CheckCircle2,
  LayoutDashboard,
  PieChart,
  Info,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { GroupWall } from '@/components/groups/GroupWall'
import { GroupCard } from '@/components/groups/GroupCard'
import { MemberItem } from '@/components/groups/MemberItem'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { AddEventDialog } from '@/components/modals/AddEventDialog'
import { GroupsMainTab } from './GroupNav'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useGroupJoin } from '@/hooks/useGroupJoin'

interface GroupContentProps {
  activeTab: GroupsMainTab
  profile: Profile | null
  profiles: Profile[]
  planningGroups: PlanningGroup[]
  todos: Todo[]
  events: Event[]
  activeTeamTab: string
  setActiveTeamTab: (tab: string) => void
  isPlanner: boolean
  isGroupLeader: boolean
  handleUpdateMember: (userId: string, groupToAdd: string | null, groupToRemoveOverride?: string | null) => Promise<void>
  handleAssignLeader: (groupName: string, leaderUserId: string | null) => Promise<void>
  searchQuery: string
  setSearchQuery: (query: string) => void
  router: any
}

export function GroupContent({
  activeTab,
  profile,
  profiles,
  planningGroups,
  todos,
  events,
  activeTeamTab,
  setActiveTeamTab,
  isPlanner,
  isGroupLeader,
  handleUpdateMember,
  handleAssignLeader,
  searchQuery,
  setSearchQuery,
  router
}: GroupContentProps) {
  
  const unassignedProfiles = profiles.filter(p => (!p.planning_groups || p.planning_groups.length === 0) && p.is_approved)
  const filteredUnassignedProfiles = unassignedProfiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const currentTeamName = activeTeamTab || profile?.planning_groups?.[0] || null
  const isCurrentTeamLeader = !!profile?.led_groups?.includes(currentTeamName || '')
  const canManageCurrentTeamMembers = !!(isCurrentTeamLeader || isPlanner)
  
  const myTeamTodos = todos.filter(t => t.assigned_to_group === currentTeamName)
  const myTeamEvents = events.filter((event) => {
    if (!currentTeamName) return false
    return event.assigned_to_group === currentTeamName || event.mentioned_groups?.includes(currentTeamName)
  })
  const myTeamMembers = profiles.filter(p => p.planning_groups?.includes(currentTeamName || ''))
  const currentTeamLeaderId = planningGroups.find(g => g.name === currentTeamName)?.leader_user_id

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {activeTab === 'mein-team' && (
          <MyTeamView 
            profile={profile}
            profiles={profiles}
            planningGroups={planningGroups}
            activeTeamTab={activeTeamTab}
            setActiveTeamTab={setActiveTeamTab}
            isPlanner={isPlanner}
            isCurrentTeamLeader={isCurrentTeamLeader}
            canManageCurrentTeamMembers={canManageCurrentTeamMembers}
            myTeamMembers={myTeamMembers}
            myTeamTodos={myTeamTodos}
            myTeamEvents={myTeamEvents}
            events={events}
            currentTeamName={currentTeamName || ''}
            currentTeamLeaderId={currentTeamLeaderId}
            unassignedProfiles={unassignedProfiles}
            filteredUnassignedProfiles={filteredUnassignedProfiles}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleUpdateMember={handleUpdateMember}
            handleAssignLeader={handleAssignLeader}
          />
        )}

        {activeTab === 'alle-gruppen' && (
          <DiscoveryView 
            profiles={profiles}
            planningGroups={planningGroups}
            isPlanner={isPlanner}
            isGroupLeader={isGroupLeader}
            profile={profile}
            router={router}
            handleUpdateMember={handleUpdateMember}
            handleAssignLeader={handleAssignLeader}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            unassignedProfiles={unassignedProfiles}
            filteredUnassignedProfiles={filteredUnassignedProfiles}
            currentTeamName={currentTeamName}
          />
        )}

        {activeTab === 'shared-hub' && (
          <SharedHubView 
            isPlanner={isPlanner}
            profiles={profiles}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

interface MyTeamViewProps {
  profile: Profile | null
  profiles: Profile[]
  planningGroups: PlanningGroup[]
  activeTeamTab: string
  setActiveTeamTab: (tab: string) => void
  isPlanner: boolean
  isCurrentTeamLeader: boolean
  canManageCurrentTeamMembers: boolean
  myTeamMembers: Profile[]
  myTeamTodos: Todo[]
  myTeamEvents: Event[]
  events: Event[]
  currentTeamName: string
  currentTeamLeaderId?: string | null
  unassignedProfiles: Profile[]
  filteredUnassignedProfiles: Profile[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleUpdateMember: (userId: string, groupToAdd: string | null, groupToRemoveOverride?: string | null) => Promise<void>
  handleAssignLeader: (groupName: string, leaderUserId: string | null) => Promise<void>
}

function MyTeamView({
  profile,
  profiles,
  planningGroups,
  activeTeamTab,
  setActiveTeamTab,
  isPlanner,
  isCurrentTeamLeader,
  canManageCurrentTeamMembers,
  myTeamMembers,
  myTeamTodos,
  myTeamEvents,
  events,
  currentTeamName,
  currentTeamLeaderId,
  unassignedProfiles,
  filteredUnassignedProfiles,
  searchQuery,
  setSearchQuery,
  handleUpdateMember,
  handleAssignLeader
}: MyTeamViewProps) {
  if (!profile?.planning_groups || profile.planning_groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center bg-card/40 backdrop-blur-[30px] rounded-[3rem] border border-primary/10 p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        
        <div className="p-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-[3rem] mb-10 relative shadow-2xl shadow-primary/10 group-hover:scale-110 transition-transform duration-700">
          <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Users className="h-24 w-24 text-primary relative z-10" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h3 className="text-4xl font-black tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Bereit für dein Team?</h3>
          <p className="text-muted-foreground max-w-md mx-auto font-bold text-xl leading-relaxed opacity-80">
            Du bist aktuell noch keiner Planungsgruppe zugeordnet. Starte deine Reise und gestalte den Abschluss mit!
          </p>
        </div>

        <Link href="/einstellungen" className="mt-12 relative z-10">
          <Button variant="default" size="lg" className="rounded-[2rem] shadow-2xl shadow-primary/30 px-12 h-20 font-black text-xl hover:scale-105 transition-all active:scale-95 bg-primary hover:bg-primary/90">
            <span>Profil vervollständigen</span>
            <ArrowRight className="h-6 w-6 ml-3" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Multi-Team Selector if in multiple groups */}
      {profile.planning_groups.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 p-3 bg-background/40 backdrop-blur-2xl rounded-[2.5rem] w-fit border border-primary/10 shadow-2xl">
          {profile.planning_groups.map((groupName: string) => (
            <button
              key={groupName}
              onClick={() => setActiveTeamTab(groupName)}
              className={cn(
                "px-8 py-4 rounded-[1.8rem] text-[12px] font-black transition-all duration-500 uppercase tracking-[0.2em] flex items-center gap-3",
                activeTeamTab === groupName 
                  ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 scale-105 ring-4 ring-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
              )}
            >
              {groupName}
              {profile.led_groups?.includes(groupName) && (
                <ShieldCheck className={cn("h-4.5 w-4.5", activeTeamTab === groupName ? "text-primary-foreground" : "text-primary")} />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-10 bg-gradient-to-br from-primary/25 via-primary/5 to-background/50 p-12 rounded-[3.5rem] border border-primary/20 shadow-[0_40px_80px_-20px_rgba(var(--primary),0.15)] group">
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary/15 rounded-full blur-[120px] group-hover:bg-primary/25 transition-all duration-1000" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] group-hover:bg-blue-500/20 transition-all duration-1000" />
        
        <div className="flex items-center gap-10 relative z-10">
          <div className="bg-primary text-primary-foreground p-7 rounded-[2.8rem] shadow-2xl shadow-primary/40 rotate-6 group-hover:rotate-0 transition-all duration-700 scale-110">
            <Users className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-5">
              <h2 className="text-5xl font-black tracking-tight text-primary drop-shadow-2xl">{currentTeamName}</h2>
              {isCurrentTeamLeader && (
                <Badge variant="secondary" className="bg-amber-100/90 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-2 border-amber-200/50 dark:border-amber-800/50 backdrop-blur-xl px-5 py-2 rounded-[1.5rem] flex items-center gap-2.5 shadow-2xl shadow-amber-500/20">
                  <ShieldCheck className="h-5 w-5 fill-amber-500/20" />
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">Team-Leader</span>
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-black text-xl mt-1 opacity-70 tracking-tight">Exklusiver Workspace • <span className="text-primary/60">{myTeamMembers.length} Mitglieder</span></p>
          </div>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          {currentTeamName && (
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-3 rounded-[2.5rem] border border-white/30 dark:border-white/10 shadow-2xl hover:scale-105 transition-transform duration-500">
              <AddTodoDialog defaultGroup={currentTeamName} />
            </div>
          )}
          {currentTeamName && (
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-3 rounded-[2.5rem] border border-white/30 dark:border-white/10 shadow-2xl hover:scale-105 transition-transform duration-500">
              <AddEventDialog defaultGroup={currentTeamName} triggerLabel="Termin für diese Gruppe" />
            </div>
          )}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 2xl:col-span-8 min-w-0">
          {currentTeamName && (
            <GroupWall
              groupName={currentTeamName}
              canManage={isCurrentTeamLeader || isPlanner}
            />
          )}
        </div>

        <div className="lg:col-span-5 2xl:col-span-4 min-w-0 space-y-8">
          <GroupCard className="border-primary/5 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary bg-card/50 backdrop-blur-xl">
            <GroupCard.Header 
              name="Team Mitglieder" 
              memberCount={myTeamMembers.length}
              className="border-none pt-10 pb-2 px-8"
              actions={
                canManageCurrentTeamMembers && (
                  <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                )
              }
            />
            <GroupCard.MemberList 
              emptyState={
                <div className="py-16 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted-foreground/10 m-6">
                  <div className="bg-muted/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Users className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-black italic">
                    Team ist noch leer.
                  </p>
                </div>
              }
              className="px-6 pb-10"
            >
              <div className="space-y-3 mt-6">
                {myTeamMembers.map((member: Profile) => (
                  <MemberItem
                    key={member.id}
                    member={member}
                    isLeader={member.id === currentTeamLeaderId || member.led_groups?.includes(currentTeamName || '')}
                    showActions={canManageCurrentTeamMembers}
                    onMakeLeader={isPlanner && currentTeamName ? (id: string) => handleAssignLeader(currentTeamName, id) : undefined}
                    onRemove={(id: string) => handleUpdateMember(id, null, currentTeamName)}
                    currentGroupName={currentTeamName || undefined}
                  />
                ))}
              </div>
            </GroupCard.MemberList>
          </GroupCard>

          <TodoList
            todos={myTeamTodos}
            canManage={isCurrentTeamLeader || isPlanner}
            maxItems={8}
          />

          <CalendarEvents
            events={myTeamEvents.slice(0, 5)}
            canManage={isPlanner}
            useScrollContainer={false}
          />
        </div>
      </div>

      {canManageCurrentTeamMembers && (
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
                filteredUnassignedProfiles.map((p: Profile) => (
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
                            {planningGroups.map((group: PlanningGroup) => (
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
                          onClick={() => handleUpdateMember(p.id, currentTeamName || null)}
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
  )
}

interface DiscoveryViewProps {
  profiles: Profile[]
  planningGroups: PlanningGroup[]
  isPlanner: boolean
  isGroupLeader: boolean
  profile: Profile | null
  router: any
  handleUpdateMember: (userId: string, groupToAdd: string | null, groupToRemoveOverride?: string | null) => Promise<void>
  handleAssignLeader: (groupName: string, leaderUserId: string | null) => Promise<void>
  searchQuery: string
  setSearchQuery: (query: string) => void
  unassignedProfiles: Profile[]
  filteredUnassignedProfiles: Profile[]
  currentTeamName: string | null
}

function DiscoveryView({
  profiles,
  planningGroups,
  isPlanner,
  isGroupLeader,
  profile,
  router,
  handleUpdateMember,
  handleAssignLeader,
  searchQuery,
  setSearchQuery,
  unassignedProfiles,
  filteredUnassignedProfiles,
  currentTeamName
}: DiscoveryViewProps) {
  // Hierarchical grouping for "Alle Gruppen"
  const parentGroups = planningGroups.filter((g: PlanningGroup) => g.is_parent)
  const subGroupsByParent = planningGroups.reduce((acc, group: PlanningGroup) => {
    if (group.parent_name) {
      if (!acc[group.parent_name]) acc[group.parent_name] = []
      acc[group.parent_name].push(group)
    }
    return acc
  }, {} as Record<string, PlanningGroup[]>)
  
  const standaloneGroups = planningGroups.filter((g: PlanningGroup) => !g.is_parent && !g.parent_name)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-12">
          {/* Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background border border-primary/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 group shadow-2xl shadow-primary/5">
            <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-1000" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            
            <div className="space-y-3 relative z-10">
              <h2 className="text-4xl font-black tracking-tight flex items-center gap-5">
                <div className="p-5 bg-primary text-primary-foreground rounded-[2rem] shadow-2xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-all duration-500 scale-110">
                  <Users className="h-8 w-8" />
                </div>
                Alle Teams
              </h2>
              <p className="text-muted-foreground max-w-lg font-bold text-xl opacity-80 leading-relaxed">
                Übersicht aller aktiven Planungsgruppen und deren Mitglieder. Hier werden Visionen zu Plänen.
              </p>
            </div>

            {isPlanner && (
              <Button 
                size="lg" 
                className="h-16 px-10 gap-3 shadow-2xl shadow-primary/20 rounded-2xl font-black text-base hover:scale-105 transition-all active:scale-95 relative z-10" 
                render={
                  <Link href="/einstellungen">
                    <PlusCircle className="h-6 w-6" /> 
                    <span>Gruppen verwalten</span>
                  </Link>
                }
              />
            )}
          </div>

          {planningGroups.length === 0 ? (
            <div className="py-32 text-center bg-card/50 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-muted-foreground/10 p-12 shadow-2xl shadow-black/5">
              <div className="bg-muted/20 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Users className="h-12 w-12 text-muted-foreground/30 relative z-10" />
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-4">Noch keine Teams</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-bold text-lg opacity-80 leading-relaxed">
                Es wurden noch keine Planungsgruppen erstellt. Starte ein neues Projekt in den Einstellungen!
              </p>
              {isPlanner && (
                <Link href="/einstellungen" className="mt-10 inline-block">
                  <Button variant="outline" size="lg" className="rounded-2xl px-10 h-14 font-black text-base border-2 hover:bg-primary hover:text-white transition-all">
                    Gruppe erstellen
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-16">
              {/* Render Hierarchical Sections */}
              {parentGroups.map((parent: PlanningGroup) => (
                <section key={parent.name} className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <h3 className="text-2xl font-black tracking-tight text-foreground/80">{parent.name}</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                    <Badge variant="outline" className="rounded-lg font-bold uppercase tracking-widest text-[10px]">Hauptgruppe</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(profiles.some((p: Profile) => p.planning_groups?.includes(parent.name)) || parent.leader_user_id) && (
                      <GroupGridItem 
                        group={parent} 
                        profiles={profiles} 
                        isPlanner={!!isPlanner} 
                        isGroupLeader={!!isGroupLeader} 
                        profile={profile}
                        router={router}
                        handleAssignLeader={handleAssignLeader}
                        handleUpdateMember={handleUpdateMember}
                      />
                    )}
                    
                    {subGroupsByParent[parent.name]?.map((sub: PlanningGroup) => (
                      <GroupGridItem 
                        key={sub.name}
                        group={sub} 
                        profiles={profiles} 
                        isPlanner={!!isPlanner} 
                        isGroupLeader={!!isGroupLeader} 
                        profile={profile}
                        router={router}
                        handleAssignLeader={handleAssignLeader}
                        handleUpdateMember={handleUpdateMember}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {/* Render Standalone Groups */}
              {standaloneGroups.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <h3 className="text-2xl font-black tracking-tight text-foreground/80">Weitere Teams</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {standaloneGroups.map((group: PlanningGroup) => (
                      <GroupGridItem 
                        key={group.name}
                        group={group} 
                        profiles={profiles} 
                        isPlanner={!!isPlanner} 
                        isGroupLeader={!!isGroupLeader} 
                        profile={profile}
                        router={router}
                        handleAssignLeader={handleAssignLeader}
                        handleUpdateMember={handleUpdateMember}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* Stats Card */}
          <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-0 bg-card/50 backdrop-blur-xl">
            <div className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-primary" />
            <CardHeader className="pb-4 pt-8 px-8">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-inner">
                  <PieChart className="h-6 w-6" /> 
                </div>
                Statistik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl shadow-sm">
                      <LayoutDashboard className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-base font-bold">Gruppen</span>
                  </div>
                  <span className="text-2xl font-black">{planningGroups.length}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-80">
                    <span>Team-Zuweisung</span>
                    <span>{Math.round((profiles.filter((p: Profile) => p.planning_groups && p.planning_groups.length > 0).length / (profiles.length || 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(profiles.filter((p: Profile) => p.planning_groups && p.planning_groups.length > 0).length / (profiles.length || 1)) * 100} 
                    className="h-3 bg-muted rounded-full shadow-inner"
                  />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                      <span>{profiles.filter((p: Profile) => p.planning_groups && p.planning_groups.length > 0).length} im Team</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                      <span>{unassignedProfiles.length} frei</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-5 rounded-[2rem] border border-border/50 text-center space-y-2 shadow-inner group/stat transition-all hover:bg-background/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Avg. Team</p>
                  <p className="text-2xl font-black text-primary group-hover:scale-110 transition-transform">
                    {planningGroups.length > 0 ? Math.round(profiles.filter((p: Profile) => p.planning_groups && p.planning_groups.length > 0).length / planningGroups.length) : 0}
                  </p>
                </div>
                <div className="bg-muted/30 p-5 rounded-[2rem] border border-border/50 text-center space-y-2 shadow-inner group/stat transition-all hover:bg-background/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Planer</p>
                  <p className="text-2xl font-black text-primary group-hover:scale-110 transition-transform">
                    {profiles.filter((p: Profile) => p.role === 'planner' || p.role?.startsWith('admin')).length}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-[2rem] bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/50 group/unassigned transition-all hover:shadow-2xl hover:shadow-red-500/10">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-2xl group-hover/unassigned:scale-110 transition-transform shadow-lg shadow-red-500/10">
                    <UserMinus className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <span className="text-base font-black text-red-700 dark:text-red-400 block leading-tight">Kein Team</span>
                    <span className="text-[11px] text-red-600/60 dark:text-red-400/60 font-bold uppercase tracking-widest">Sofort handeln</span>
                  </div>
                </div>
                <Badge className="bg-red-600 hover:bg-red-700 font-black px-4 py-1.5 text-sm shadow-xl shadow-red-500/30 rounded-xl">{unassignedProfiles.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Assign Card */}
          <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] border-l-8 border-l-primary overflow-hidden relative bg-card/50 backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
              <UserPlus className="h-40 w-40" />
            </div>
            <CardHeader className="pb-4 pt-8 px-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-inner">
                      <UserPlus className="h-6 w-6" /> 
                    </div>
                    Zuweisung
                  </CardTitle>
                  <CardDescription className="text-sm font-bold opacity-70">
                    Unzugeordnete Nutzer hinzufügen.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10 px-8 pb-10">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                <Input
                  placeholder="Nutzer suchen..."
                  className="pl-12 h-14 bg-background/50 border-border/50 focus:bg-background rounded-2xl transition-all shadow-inner border-none focus:ring-4 focus:ring-primary/10 font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-5 max-h-[500px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-primary/10">
                {unassignedProfiles.length === 0 ? (
                  <div className="py-20 text-center bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                    <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <CheckCircle2 className="h-10 w-10 text-primary/40" />
                    </div>
                    <p className="text-lg font-black text-primary/60 italic px-8">
                      Alle Nutzer sind versorgt!
                    </p>
                  </div>
                ) : (
                  filteredUnassignedProfiles.map((p: Profile) => (
                    <div key={p.id} className="flex flex-col p-6 rounded-[2rem] border border-border/40 bg-background/50 hover:border-primary/40 hover:bg-background hover:shadow-2xl hover:shadow-primary/5 transition-all gap-5 group/item">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 shadow-2xl border-4 border-background ring-1 ring-muted">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black text-xl">
                            {p.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-black truncate group-hover/item:text-primary transition-colors">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground font-bold truncate flex items-center gap-2 opacity-60">
                            <MessageSquare className="h-3 w-3" />
                            {p.email}
                          </p>
                        </div>
                      </div>

                      {(isPlanner || isGroupLeader) && (
                        <div className="flex flex-wrap gap-2 pt-5 border-t border-muted/50 mt-1">
                          {isPlanner ? (
                            planningGroups.slice(0, 4).map((group: PlanningGroup) => (
                              <Button
                                key={group.name}
                                variant="secondary"
                                size="sm"
                                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-black/5 active:scale-95"
                                onClick={() => handleUpdateMember(p.id, group.name)}
                              >
                                + {group.name}
                              </Button>
                            ))
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-12 text-[10px] font-black uppercase tracking-[0.15em] gap-3 bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all rounded-2xl shadow-xl shadow-primary/5"
                              onClick={() => handleUpdateMember(p.id, currentTeamName || null)}
                            >
                              <PlusCircle className="h-5 w-5" />
                              In mein Team
                            </Button>
                          )}
                          {isPlanner && planningGroups.length > 4 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="sm" className="h-9 px-4 text-[11px] font-black tracking-widest opacity-50 hover:opacity-100 uppercase">
                                    MEHR...
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 shadow-2xl border-primary/10 backdrop-blur-xl">
                                {planningGroups.slice(4).map((group: PlanningGroup) => (
                                  <DropdownMenuItem 
                                    key={group.name}
                                    onClick={() => handleUpdateMember(p.id, group.name)}
                                    className="text-xs font-black rounded-xl p-3.5"
                                  >
                                    <ArrowRight className="h-4 w-4 mr-3 opacity-30" />
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
  )
}

function SharedHubView({ isPlanner, profiles }: any) {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 bg-gradient-to-br from-primary/25 via-primary/5 to-background/50 p-12 rounded-[4rem] border border-primary/20 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(var(--primary),0.1)] group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12 group-hover:scale-125 transition-transform duration-1000">
          <MessageSquare className="h-64 w-64" />
        </div>
        <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-primary/10 rounded-full blur-[120px]" />
        
        <div className="flex items-center gap-10 relative z-10">
          <div className="bg-primary text-primary-foreground p-7 rounded-[3rem] shadow-2xl shadow-primary/40 rotate-6 group-hover:rotate-0 transition-all duration-700 scale-125">
            <MessageSquare className="h-12 w-12" />
          </div>
          <div className="space-y-3">
            <h2 className="text-5xl font-black tracking-tight text-primary drop-shadow-2xl">Shared Hub</h2>
            <p className="text-muted-foreground max-w-xl font-bold text-xl leading-relaxed opacity-80">
              Zentrale Kommunikation für alle Teams. Koordination, Austausch und Synergien für einen perfekten Abschluss.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 relative z-10 bg-white/40 dark:bg-black/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/30 dark:border-white/10 shadow-2xl">
          <div className="flex -space-x-5 overflow-hidden">
            {profiles.filter((p: Profile) => p.planning_groups && p.planning_groups.length > 0).slice(0, 5).map((p: Profile, i: number) => (
              <Avatar key={i} className="h-12 w-12 border-4 border-background ring-1 ring-muted shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50 text-[12px] font-black">{p.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground ring-4 ring-background text-[11px] font-black shadow-2xl z-10">
              +{Math.max(0, profiles.filter((p: Profile) => p.planning_groups && p.planning_groups.length > 0).length - 5)}
            </div>
          </div>
          <div className="pr-4 border-l border-primary/10 pl-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Live Now</p>
            <p className="text-sm font-black text-muted-foreground leading-none mt-1">Global Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 min-w-0">
          <GroupWall 
            groupName="hub" 
            type="hub"
            canManage={isPlanner} 
          />
        </div>
        <div className="lg:col-span-4 space-y-10">
          <Card className="bg-card/40 backdrop-blur-3xl border-primary/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] rounded-[3rem] relative overflow-hidden group/guidelines border-b-[12px] border-b-primary">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-[6rem] transition-all group-hover/guidelines:scale-110 duration-1000" />
            <CardHeader className="pt-12 px-10">
              <CardTitle className="text-3xl font-black flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                Hub-Richtlinien
              </CardTitle>
            </CardHeader>
            <CardContent className="text-base space-y-10 relative z-10 px-10 pb-16">
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="h-12 w-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-lg shadow-inner italic border border-primary/5">1</div>
                  <p className="text-muted-foreground font-black leading-relaxed pt-1.5 opacity-80">Nutze den Hub für <strong>gruppenübergreifende</strong> Anfragen und wichtige Updates.</p>
                </div>
                <div className="flex gap-6">
                  <div className="h-12 w-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-lg shadow-inner italic border border-primary/5">2</div>
                  <p className="text-muted-foreground font-black leading-relaxed pt-1.5 opacity-80">Sei präzise bei Anfragen – nutze die <strong>"An: Gruppe"</strong> Funktion im Chat.</p>
                </div>
                <div className="flex gap-6">
                  <div className="h-12 w-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-lg shadow-inner italic border border-primary/5">3</div>
                  <p className="text-muted-foreground font-black leading-relaxed pt-1.5 opacity-80">Wichtige Ankündigungen werden von den Planern oben <strong>fixiert</strong>.</p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/15 to-transparent border border-primary/10 shadow-inner group/quote">
                <p className="text-base text-primary font-black italic text-center leading-relaxed group-hover:scale-105 transition-transform duration-500">
                  "Echte Synergie entsteht, wenn Teams über ihre Grenzen hinaus zusammenarbeiten."
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-muted/30 backdrop-blur-2xl rounded-[2.5rem] border-dashed shadow-xl">
            <CardHeader className="pb-4 pt-10 px-10">
              <CardTitle className="text-2xl font-black flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" />
                Live Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 px-10 pb-10">
              <div className="flex items-center gap-5 p-5 bg-background/50 rounded-2xl border border-primary/10 shadow-inner">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-green-600 dark:text-green-400">System Nominal • Active</span>
              </div>
              <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex gap-4 shadow-sm">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-6 w-6 text-primary opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground font-black italic leading-relaxed opacity-70">
                  Transparenz ist unsere Stärke. Alle Nachrichten hier sind öffentlich für alle Planungsgruppen einsehbar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


function GroupGridItem({ 
  group, 
  profiles, 
  isPlanner, 
  isGroupLeader, 
  profile, 
  router,
  handleAssignLeader,
  handleUpdateMember
}: {
  group: PlanningGroup
  profiles: Profile[]
  isPlanner: boolean
  isGroupLeader: boolean
  profile: Profile | null
  router: any
  handleAssignLeader: (groupName: string, leaderUserId: string | null) => Promise<void>
  handleUpdateMember: (userId: string, groupToAdd: string | null, groupToRemoveOverride?: string | null) => Promise<void>
}) {
  const { joinGroup, isJoining } = useGroupJoin()
  const members = profiles.filter((p: Profile) => p.planning_groups?.includes(group.name))
  const leader = profiles.find((p: Profile) => p.id === group.leader_user_id)
  
  const isMember = profile?.planning_groups?.includes(group.name)
  const canJoin = !isMember && !group.leader_user_id

  return (
    <GroupCard className={cn(
      "border-primary/10 hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary bg-card/50 backdrop-blur-xl group/card"
    )}>
      <GroupCard.Header 
        name={group.name} 
        memberCount={members.length}
        className="bg-muted/10 border-none pb-4 pt-10 px-8"
        actions={
          leader && (
            <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-foreground border-border/50 backdrop-blur-md gap-2 px-3 py-1.5 shadow-lg rounded-xl">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-[11px] font-black uppercase tracking-widest">{leader.full_name?.split(' ')[0]}</span>
            </Badge>
          )
        }
      />
      <GroupCard.MemberList 
        emptyState={
          <div className="py-12 text-center bg-muted/5 rounded-[2rem] border-2 border-dashed border-muted-foreground/10 mx-8 my-4">
            <Users className="h-10 w-10 text-muted-foreground/10 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-black italic">Noch keine Mitglieder</p>
          </div>
        }
        className="max-h-[400px] overflow-y-auto scrollbar-thin px-8 pb-4"
      >
        <div className="space-y-2 mt-4">
          {members.map((member: Profile) => (
            <MemberItem
              key={member.id}
              member={member}
              isLeader={member.id === group.leader_user_id || member.led_groups?.includes(group.name)}
              showActions={!!isPlanner || !!(isGroupLeader && profile?.led_groups?.includes(group.name))}
              onMakeLeader={isPlanner ? (id: string) => handleAssignLeader(group.name, id) : undefined}
              onRemove={(id: string) => handleUpdateMember(id, null, group.name)}
              currentGroupName={group.name}
            />
          ))}
        </div>
      </GroupCard.MemberList>
      {(isPlanner || canJoin) && (
        <GroupCard.Actions className="bg-transparent border-none pb-10 px-8 pt-4">
          {canJoin && (
            <GroupCard.JoinButton 
              onClick={() => joinGroup(group.name)}
              isLoading={isJoining}
              className={cn("h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20", isPlanner ? "flex-1" : "w-full")}
            />
          )}
          {isPlanner && (
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("h-12 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all group/btn border-2 shadow-lg", canJoin ? "flex-1" : "w-full")}
              onClick={() => router.push('/einstellungen')}
            >
              <span>Konfigurieren</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          )}
        </GroupCard.Actions>
      )}
    </GroupCard>
  )
}
