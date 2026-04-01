'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { Profile } from '@/types/database'
import { useFriendSystem } from '@/hooks/useFriendSystem'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Search, Sparkles, UserCheck, UserPlus, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function FriendsPage() {
  const { user, profile, loading } = useAuth()
  const {
    outgoingRequests,
    incomingRequests,
    friendships,
    relatedProfiles,
    getRelationshipState,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriendSystem()
  const [directoryProfiles, setDirectoryProfiles] = useState<Profile[]>([])
  const [directoryLoading, setDirectoryLoading] = useState(true)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadDirectory = async () => {
      if (!profile?.is_approved) {
        setDirectoryProfiles([])
        setDirectoryLoading(false)
        return
      }

      try {
        setDirectoryLoading(true)
        const profilesSnap = await getDocs(collection(db, 'profiles'))
        const profiles = profilesSnap.docs
          .map((snapshotDoc) => ({ ...snapshotDoc.data(), id: snapshotDoc.id } as Profile))
          .filter((entry) => entry.id !== user?.uid && entry.is_approved)
          .sort((left, right) => {
            const leftName = (left.full_name || '').toLowerCase()
            const rightName = (right.full_name || '').toLowerCase()
            return leftName.localeCompare(rightName, 'de')
          })

        setDirectoryProfiles(profiles)
      } catch (error) {
        console.error('[FriendsPage] Failed to load profile directory:', error)
        toast.error('Verzeichnis konnte nicht geladen werden.')
      } finally {
        setDirectoryLoading(false)
      }
    }

    loadDirectory()
  }, [profile?.is_approved, user?.uid])

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = appliedSearchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return directoryProfiles
    }

    return directoryProfiles.filter((entry) => {
      const planningGroups = Array.isArray(entry.planning_groups) ? entry.planning_groups : []
      const haystack = [
        entry.full_name,
        entry.email,
        entry.class_name,
        planningGroups.join(' '),
        entry.role,
      ]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [directoryProfiles, appliedSearchTerm])

  const applySearch = (value?: string) => {
    const nextValue = typeof value === 'string' ? value : (searchInputRef.current?.value || '')
    setAppliedSearchTerm(nextValue)
  }

  const currentUserId = user?.uid || profile?.id || ''

  const handleDirectoryAction = async (targetUserId: string, relationshipState: ReturnType<typeof getRelationshipState>) => {
    if (!currentUserId) {
      return
    }

    try {
      setSubmittingUserId(targetUserId)

      if (relationshipState === 'none') {
        await sendFriendRequest(targetUserId)
        toast.success('Freundschaftsanfrage gesendet.')
      } else if (relationshipState === 'pending_outgoing') {
        const request = outgoingRequests.find((entry) => entry.toUserId === targetUserId)
        if (request) {
          await cancelFriendRequest(request.id)
          toast.success('Freundschaftsanfrage zurückgezogen.')
        }
      } else if (relationshipState === 'pending_incoming') {
        const request = incomingRequests.find((entry) => entry.fromUserId === targetUserId)
        if (request) {
          await respondToFriendRequest(request.id, true)
          toast.success('Freundschaft bestätigt.')
        }
      } else if (relationshipState === 'friends') {
        await removeFriend(targetUserId)
        toast.success('Freundschaft entfernt.')
      }
    } catch (error: any) {
      console.error('[FriendsPage] Friend action failed:', error)
      toast.error(error?.message || 'Aktion konnte nicht ausgeführt werden.')
    } finally {
      setSubmittingUserId(null)
    }
  }

  const getDirectoryButtonLabel = (relationshipState: ReturnType<typeof getRelationshipState>) => {
    if (relationshipState === 'friends') return 'Entfernen'
    if (relationshipState === 'pending_outgoing') return 'Zurückziehen'
    if (relationshipState === 'pending_incoming') return 'Annehmen'
    return 'Anfragen'
  }

  const getDirectoryButtonIcon = (relationshipState: ReturnType<typeof getRelationshipState>) => {
    if (relationshipState === 'friends') return <UserX className="h-4 w-4" />
    if (relationshipState === 'pending_incoming') return <UserCheck className="h-4 w-4" />
    return <UserPlus className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-20">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground"
            render={<Link href="/profil"><ArrowLeft className="h-4 w-4" /> Zurück zum Profil</Link>}
          />
          <h1 className="text-3xl font-bold tracking-tight">Freundesystem</h1>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Aktive Verbindungen</p>
            <p className="text-lg font-semibold">{friendships.length} Freunde</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Eingehende Anfragen</CardTitle>
            <CardTitle className="text-2xl">{incomingRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Ausgehende Anfragen</CardTitle>
            <CardTitle className="text-2xl">{outgoingRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Gespeicherte Freunde</CardTitle>
            <CardTitle className="text-2xl">{friendships.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-3 border-b pb-6">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Search className="h-4 w-4" />
              </div>
              <CardTitle>Mitglieder finden</CardTitle>
            </div>
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    applySearch(event.currentTarget.value)
                  }
                }}
                placeholder="Name, Kurs oder Gruppe suchen..."
              />
              <Button variant="outline" onClick={applySearch}>Suchen</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 py-6">
            {directoryLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Keine Mitglieder gefunden. Passe deine Suche an oder lade die Seite neu.
              </div>
            ) : (
              filteredProfiles.map((entry) => {
                const relationshipState = getRelationshipState(entry.id)
                const friendSinceProfile = relatedProfiles[entry.id]
                const planningGroups = Array.isArray(entry.planning_groups) ? entry.planning_groups : []

                return (
                  <div key={entry.id} className="flex flex-col gap-4 border-b py-4 last:border-b-0 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {(entry.full_name || entry.email || '?').slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold leading-none">{entry.full_name || 'Unbekannt'}</p>
                          <Badge variant={entry.role.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px]">
                            {entry.role}
                          </Badge>
                          {relationshipState === 'friends' && <Badge variant="secondary">Freund</Badge>}
                          {relationshipState === 'pending_incoming' && <Badge variant="outline">Anfrage erhalten</Badge>}
                          {relationshipState === 'pending_outgoing' && <Badge variant="outline">Anfrage offen</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.email}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {entry.class_name && <span className="rounded-full bg-muted px-2 py-1">Kurs {entry.class_name}</span>}
                          {planningGroups.length > 0 && <span className="rounded-full bg-muted px-2 py-1">{planningGroups.join(', ')}</span>}
                          {friendSinceProfile?.created_at && (
                            <span className="rounded-full bg-muted px-2 py-1">Mitglied seit {format(toDate(friendSinceProfile.created_at), 'PPP', { locale: de })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                      <Button variant="outline" size="sm" render={<Link href={`/profil/${entry.id}`}>Profil öffnen</Link>} />
                      <Button
                        size="sm"
                        variant={relationshipState === 'friends' ? 'outline' : 'default'}
                        onClick={() => handleDirectoryAction(entry.id, relationshipState)}
                        disabled={submittingUserId === entry.id}
                      >
                        {getDirectoryButtonIcon(relationshipState)}
                        {getDirectoryButtonLabel(relationshipState)}
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Eingehende Anfragen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-4">
              {incomingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aktuell keine offenen Anfragen.</p>
              ) : (
                incomingRequests.map((request) => {
                  const requester = relatedProfiles[request.fromUserId]
                  return (
                    <div key={request.id} className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
                      <div>
                        <p className="font-medium">{requester?.full_name || 'Unbekannt'}</p>
                        <p className="text-xs text-muted-foreground">Hat dir eine Anfrage gesendet</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => respondToFriendRequest(request.id, true).then(() => toast.success('Freundschaft bestätigt.')).catch((error: any) => toast.error(error?.message || 'Aktion fehlgeschlagen.'))}>
                          Annehmen
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => respondToFriendRequest(request.id, false).then(() => toast.success('Freundschaftsanfrage abgelehnt.')).catch((error: any) => toast.error(error?.message || 'Aktion fehlgeschlagen.'))}>
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Aktive Freundschaften</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-4">
              {friendships.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Freundschaften gespeichert.</p>
              ) : (
                friendships.map((friendship) => {
                  const friendId = friendship.members.find((memberId) => memberId !== currentUserId) || friendship.members[0]
                  const friendProfile = relatedProfiles[friendId]

                  return (
                    <div key={friendship.id} className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
                      <div>
                        <p className="font-medium">{friendProfile?.full_name || friendId}</p>
                        <p className="text-xs text-muted-foreground">Seit {format(toDate(friendship.created_at), 'PPP', { locale: de })}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeFriend(friendId)}>
                        Entfernen
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Ausgehende Anfragen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-4">
              {outgoingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine ausgehenden Anfragen offen.</p>
              ) : (
                outgoingRequests.map((request) => {
                  const targetProfile = relatedProfiles[request.toUserId]
                  return (
                    <div key={request.id} className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
                      <div>
                        <p className="font-medium">{targetProfile?.full_name || 'Unbekannt'}</p>
                        <p className="text-xs text-muted-foreground">Anfrage wartet auf Antwort</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => cancelFriendRequest(request.id)}>
                        Zurückziehen
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
