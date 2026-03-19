'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, updateDoc, where, getDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Profile, PlanningGroup, Settings } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  ShieldCheck, 
  Loader2, 
  Search,
  PlusCircle,
  Trophy
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { logAction } from '@/lib/logging'

export default function GroupsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [planningGroups, setPlanningGroups] = useState<PlanningGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin') && profile?.is_approved

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
      setLoading(false)
    })

    return () => {
      unsubscribeProfiles()
      unsubscribeSettings()
    }
  }, [])

  const handleUpdateMember = async (userId: string, groupName: string | null) => {
    if (!isPlanner) return
    
    try {
      const profileRef = doc(db, 'profiles', userId)
      const targetProfile = profiles.find(p => p.id === userId)
      
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

        await updateDoc(settingsRef, {
          planning_groups: updatedGroups
        })

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

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unassignedProfiles = profiles.filter(p => !p.planning_group && p.is_approved)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planungsgruppen</h1>
          <p className="text-muted-foreground">Teams für die ABI-Vorbereitung.</p>
        </div>
        {isPlanner && (
          <Button variant="outline" render={
            <Link href="/einstellungen">
              <PlusCircle className="mr-2 h-4 w-4" /> Gruppen verwalten
            </Link>
          } />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Groups List */}
        <div className="lg:col-span-2 space-y-6">
          {planningGroups.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground italic">Noch keine Planungsgruppen erstellt.</p>
                {isPlanner && (
                  <Button variant="link" render={
                    <Link href="/einstellungen">Jetzt in den Einstellungen erstellen</Link>
                  } className="mt-2" />
                )}
              </CardContent>
            </Card>
          ) : (
            planningGroups.map((group) => {
              const members = profiles.filter(p => p.planning_group === group.name)
              const leader = profiles.find(p => p.id === group.leader_user_id)

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
                                  {member.id === group.leader_user_id && (
                                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Leiter</span>
                                  )}
                                </div>
                              </div>
                              {isPlanner && (
                                <div className="flex items-center gap-1">
                                  {member.id !== group.leader_user_id && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => handleAssignLeader(group.name, member.id)}
                                      title="Zum Leiter machen"
                                    >
                                      <ShieldCheck className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUpdateMember(member.id, null)}
                                    title="Aus Gruppe entfernen"
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

        {/* Sidebar: Add Members & Unassigned */}
        <div className="space-y-6">
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

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {unassignedProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Alle aktiven Nutzer sind bereits in Gruppen.
                  </p>
                ) : (
                  unassignedProfiles
                    .filter(p => 
                      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
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
                      
                      {isPlanner && (
                        <div className="flex flex-wrap gap-1">
                          {planningGroups.map(group => (
                            <Button
                              key={group.name}
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-7 px-2"
                              onClick={() => handleUpdateMember(p.id, group.name)}
                            >
                              + {group.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

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
                <span className="font-bold">{profiles.filter(p => p.planning_group).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ohne Gruppe:</span>
                <span className="font-bold">{unassignedProfiles.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
