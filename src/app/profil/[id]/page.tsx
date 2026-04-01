'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Profile, UserRole } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Shield, Calendar, Users, User, UserPlus, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate, getOnlineStatus, cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { useAuth } from '@/context/AuthContext'
import { useFriendSystem } from '@/hooks/useFriendSystem'
import { toast } from 'sonner'

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile: currentProfile } = useAuth()
  const {
    getRelationshipState,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriendSystem()
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profiles', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setTargetProfile({ ...(docSnap.data() as Omit<Profile, 'id'>), id: docSnap.id } as Profile)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Profil nicht gefunden.</h2>
        <Button
          variant="link"
          className="mt-4"
          render={<Link href="/news">Zurück zur Übersicht</Link>}
        />
      </div>
    )
  }

  const userInitial = targetProfile.full_name?.substring(0, 1).toUpperCase() || 'U'
  const userCourse = targetProfile.class_name
  const plannerGroup = targetProfile.planning_groups?.join(', ')
  const { isOnline, label: onlineLabel } = getOnlineStatus(targetProfile.isOnline, targetProfile.lastOnline)
  const relationshipState = currentProfile?.is_approved ? getRelationshipState(id) : 'none'
  const canManageFriendship = !!user && !!currentProfile?.is_approved && id !== user.uid
  const canOpenFriendDashboard = !!user && !!currentProfile?.is_approved

  const getRoleLabel = (role: UserRole) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role === 'planner' ? 'Planer' : 'Zuschauer'
  }

  const handleFriendAction = async (accepted?: boolean) => {
    try {
      if (relationshipState === 'none') {
        await sendFriendRequest(id)
        toast.success('Freundschaftsanfrage gesendet.')
        return
      }

      if (relationshipState === 'pending_outgoing') {
        await cancelFriendRequest(`${user?.uid}_${id}`)
        toast.success('Freundschaftsanfrage zurückgezogen.')
        return
      }

      if (relationshipState === 'pending_incoming') {
        if (accepted) {
          await respondToFriendRequest(`${id}_${user?.uid}`, true)
          toast.success('Freundschaft bestätigt.')
        } else {
          await respondToFriendRequest(`${id}_${user?.uid}`, false)
          toast.success('Freundschaftsanfrage abgelehnt.')
        }
        return
      }

      if (relationshipState === 'friends') {
        await removeFriend(id)
        toast.success('Freundschaft entfernt.')
      }
    } catch (error: any) {
      console.error('[PublicProfile] Friend action failed:', error)
      toast.error(error?.message || 'Aktion konnte nicht ausgeführt werden.')
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground"
          render={
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Link>
          }
        />

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b pb-6">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div 
                className={cn(
                  "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
                  isOnline ? "bg-green-500" : "bg-muted-foreground"
                )}
                title={onlineLabel}
              />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-2xl flex items-center gap-2">
                {targetProfile.full_name}
              </CardTitle>
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant={targetProfile.role.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px]">
                    {getRoleLabel(targetProfile.role)}
                  </Badge>
                  {userCourse && (
                    <Badge variant="outline" className="uppercase text-[10px] font-bold">
                      Kurs {userCourse}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {onlineLabel}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 py-6">
            <div className="flex items-center gap-4">
              <div className="bg-muted p-2 rounded-full">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Vollständiger Name</p>
                <p className="text-sm text-muted-foreground mt-1">{targetProfile.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-muted p-2 rounded-full">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Mitglied-Status</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {targetProfile.is_approved ? 'Verifiziertes Mitglied' : 'Wartet auf Freischaltung'}
                </p>
              </div>
            </div>

            {targetProfile.role === 'planner' && (
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
                  {targetProfile.created_at ? format(toDate(targetProfile.created_at), 'PPP', { locale: de }) : 'Unbekannt'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Freunde
            </CardTitle>
            <CardDescription>
              Freundschaften bilden später die Basis für Kartentausch und gemeinsame Kontakte.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              {canManageFriendship ? (
                <>
                  <p>
                    Status: {relationshipState === 'friends' ? 'Befreundet' : relationshipState === 'pending_outgoing' ? 'Anfrage offen' : relationshipState === 'pending_incoming' ? 'Anfrage erhalten' : 'Noch kein Kontakt'}
                  </p>
                  <p>Du kannst die Beziehung direkt hier verwalten oder im eigenen Freundebereich organisieren.</p>
                </>
              ) : (
                <p>Öffne deinen Freundebereich, um Kontakte zu verwalten.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {canManageFriendship ? (
                <>
                  <Button variant={relationshipState === 'friends' ? 'outline' : 'default'} onClick={() => handleFriendAction(true)}>
                    {relationshipState === 'friends' ? <UserX className="h-4 w-4" /> : relationshipState === 'pending_incoming' ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {relationshipState === 'friends' ? 'Freundschaft entfernen' : relationshipState === 'pending_outgoing' ? 'Anfrage zurückziehen' : relationshipState === 'pending_incoming' ? 'Anfrage annehmen' : 'Freundschaft anfragen'}
                  </Button>
                  {relationshipState === 'pending_incoming' && (
                    <Button variant="outline" onClick={() => handleFriendAction(false)}>
                      Ablehnen
                    </Button>
                  )}
                  <Button variant="outline" render={<Link href="/profil/freunde">Freunde öffnen</Link>} />
                </>
              ) : canOpenFriendDashboard ? (
                <Button variant="outline" render={<Link href="/profil/freunde">Freunde öffnen</Link>} />
              ) : (
                <span className="text-sm text-muted-foreground">Melde dich an, um Freundschaften zu verwalten.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <TeacherAlbum userId={id} targetProfile={targetProfile} initialLimit={5} />
      </div>
    </div>
  )
}
