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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ArrowUpDown, Filter, FilterX, Search, Sparkles, UserCheck, UserPlus, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { toast } from 'sonner'

type FriendSection = 'friends' | 'suggested' | 'search' | 'invites'
type SuggestionReason = 'same_course' | 'same_group' | 'friend_network'

function normalizeText(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

function getDisplayName(profile: Profile) {
  return profile.full_name?.trim() || profile.email?.trim() || 'Unbekannt'
}

function getRoleLabel(role: string | undefined) {
  return role || 'viewer'
}

function getReasonLabel(reason: SuggestionReason) {
  if (reason === 'same_course') return 'Kurs'
  if (reason === 'same_group') return 'Gruppe'
  return 'Netzwerk'
}

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
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<FriendSection>('friends')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [friendSearchTerm, setFriendSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [sortBy, setSortBy] = useState('name_asc')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const isFilterActive = friendSearchTerm.trim() !== '' || selectedClass !== 'all'

  const clearFilters = () => {
    setFriendSearchTerm('')
    setSelectedClass('all')
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadDirectory = async () => {
      try {
        setDirectoryLoading(true)
        const profilesSnap = await getDocs(collection(db, 'profiles'))
        const profiles = profilesSnap.docs
          .map((snapshotDoc) => ({ ...snapshotDoc.data(), id: snapshotDoc.id } as Profile))
          .filter((entry) => entry.id !== user?.uid)
          .sort((left, right) => getDisplayName(left).localeCompare(getDisplayName(right), 'de'))

        setDirectoryProfiles(profiles)
      } catch (error) {
        console.error('[FriendsPage] Failed to load profile directory:', error)
        toast.error('Verzeichnis konnte nicht geladen werden.')
      } finally {
        setDirectoryLoading(false)
      }
    }

    loadDirectory()
  }, [user?.uid])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 1000)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const currentUserId = user?.uid || ''
  const currentCourse = normalizeText(profile?.class_name)
  const currentGroups = useMemo(() => {
    if (!profile?.planning_groups || !Array.isArray(profile.planning_groups)) return []
    return profile.planning_groups.filter((group) => typeof group === 'string' && group.trim().length > 0)
  }, [profile?.planning_groups])

  const connectedUserIds = useMemo(() => {
    const ids = new Set<string>([currentUserId])

    for (const friendship of friendships) {
      for (const memberId of friendship.members) {
        ids.add(memberId)
      }
    }

    for (const request of outgoingRequests) {
      ids.add(request.toUserId)
    }

    for (const request of incomingRequests) {
      ids.add(request.fromUserId)
    }

    return ids
  }, [currentUserId, friendships, outgoingRequests, incomingRequests])

  const directFriendProfiles = useMemo(() => {
    return friendships
      .flatMap((friendship) => friendship.members.filter((memberId) => memberId !== currentUserId))
      .map((friendId) => relatedProfiles[friendId])
      .filter((friendProfile): friendProfile is Profile => Boolean(friendProfile))
  }, [friendships, relatedProfiles, currentUserId])

  const availableClasses = useMemo(() => {
    const classes = new Set<string>()
    for (const friend of directFriendProfiles) {
      if (friend.class_name) {
        classes.add(friend.class_name)
      }
    }
    return Array.from(classes).sort()
  }, [directFriendProfiles])

  const filteredFriendships = useMemo(() => {
    return friendships
      .filter((friendship) => {
        const friendId = friendship.members.find((id) => id !== currentUserId)
        const friendProfile = friendId ? relatedProfiles[friendId] : undefined
        if (!friendProfile) return false

        const matchesSearch = !friendSearchTerm.trim() ||
          [friendProfile.full_name, friendProfile.email, friendProfile.class_name]
            .filter(Boolean)
            .some((val) => val?.toLowerCase().includes(friendSearchTerm.toLowerCase()))

        const matchesClass = selectedClass === 'all' || friendProfile.class_name === selectedClass
        return matchesSearch && matchesClass
      })
      .sort((a, b) => {
        const profileA = relatedProfiles[a.members.find((id) => id !== currentUserId) || '']
        const profileB = relatedProfiles[b.members.find((id) => id !== currentUserId) || '']

        if (sortBy.startsWith('name')) {
          const comp = getDisplayName(profileA || ({} as Profile)).localeCompare(getDisplayName(profileB || ({} as Profile)), 'de')
          return sortBy === 'name_asc' ? comp : -comp
        }

        const dateA = toDate(a.created_at).getTime()
        const dateB = toDate(b.created_at).getTime()
        return sortBy === 'date_asc' ? dateA - dateB : dateB - dateA
      })
  }, [friendships, relatedProfiles, currentUserId, friendSearchTerm, selectedClass, sortBy])

  const friendUserIds = useMemo(() => {
    return new Set(friendships.flatMap((f) => f.members).filter((id) => id !== currentUserId))
  }, [friendships, currentUserId])

  const suggestionCandidates = useMemo(() => {
    const friendCourses = new Set(directFriendProfiles.map((p) => normalizeText(p.class_name)).filter(Boolean))
    const friendGroups = new Set(directFriendProfiles.flatMap((p) => Array.isArray(p.planning_groups) ? p.planning_groups : []).map(normalizeText).filter(Boolean))

    return directoryProfiles
      .map((entry) => {
        const reasons: SuggestionReason[] = []
        if (connectedUserIds.has(entry.id)) return { profile: entry, reasons }

        const entryCourse = normalizeText(entry.class_name)
        const entryGroups = (Array.isArray(entry.planning_groups) ? entry.planning_groups : []).map(normalizeText).filter(Boolean)

        if (currentCourse && entryCourse === currentCourse) reasons.push('same_course')
        if (currentGroups.some((g) => entryGroups.includes(normalizeText(g)))) reasons.push('same_group')
        if (friendCourses.has(entryCourse) || entryGroups.some((g) => friendGroups.has(g))) reasons.push('friend_network')

        return { profile: entry, reasons }
      })
      .filter((e) => e.reasons.length > 0)
      .sort((a, b) => {
        const score = (r: SuggestionReason[]) => r.includes('same_course') ? 3 : r.includes('same_group') ? 2 : 1
        return (score(b.reasons) - score(a.reasons)) || getDisplayName(a.profile).localeCompare(getDisplayName(b.profile), 'de')
      })
      .slice(0, 12)
  }, [directoryProfiles, directFriendProfiles, connectedUserIds, currentCourse, currentGroups])

  const searchResults = useMemo(() => {
    const search = debouncedSearchTerm.trim().toLowerCase()
    if (!search) return []

    return directoryProfiles
      .filter((entry) => !connectedUserIds.has(entry.id) || friendUserIds.has(entry.id))
      .filter((entry) => {
        const haystack = [entry.full_name, entry.email, entry.class_name, ...(Array.isArray(entry.planning_groups) ? entry.planning_groups : []), entry.role]
          .filter((v): v is string => typeof v === 'string')
          .join(' ').toLowerCase()
        return haystack.includes(search)
      })
      .sort((a, b) => (Number(friendUserIds.has(b.id)) - Number(friendUserIds.has(a.id))) || getDisplayName(a).localeCompare(getDisplayName(b), 'de'))
      .slice(0, 20)
  }, [directoryProfiles, debouncedSearchTerm, connectedUserIds, friendUserIds])

  const handleDirectoryAction = async (targetUserId: string, relationshipState: ReturnType<typeof getRelationshipState>) => {
    if (!currentUserId) return
    setSubmittingUserId(targetUserId)
    try {
      if (relationshipState === 'none') {
        await sendFriendRequest(targetUserId)
        toast.success('Freundschaftsanfrage gesendet.')
      } else if (relationshipState === 'pending_outgoing') {
        const req = outgoingRequests.find((r) => r.toUserId === targetUserId)
        if (req) await cancelFriendRequest(req.id)
        toast.success('Freundschaftsanfrage zurückgezogen.')
      } else if (relationshipState === 'pending_incoming') {
        const req = incomingRequests.find((r) => r.fromUserId === targetUserId)
        if (req) await respondToFriendRequest(req.id, true)
        toast.success('Freundschaft bestätigt.')
      } else if (relationshipState === 'friends') {
        await removeFriend(targetUserId)
        toast.success('Freundschaft entfernt.')
      }
    } catch (error) {
      console.error('[FriendsPage] Friend action failed:', error)
      toast.error(error instanceof Error ? error.message : 'Aktion konnte nicht ausgeführt werden.')
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

  const openAddFriendModal = () => {
    setActiveSection('search')
    requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
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

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6 pb-20 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground"
            render={<Link href="/profil"><ArrowLeft className="h-4 w-4" /> Zurück zum Profil</Link>}
          />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Freunde</h1>
        </div>

        <div className="flex w-full items-center justify-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm sm:w-auto sm:justify-start">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-semibold">{friendships.length} Freunde</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border bg-card p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:w-auto">
          <Button
            variant={activeSection === 'friends' ? 'default' : 'ghost'}
            className="h-auto min-h-10 rounded-2xl px-2 py-2 text-center text-[11px] leading-tight whitespace-normal sm:h-10 sm:px-4 sm:py-0 sm:text-sm sm:whitespace-nowrap"
            onClick={() => setActiveSection('friends')}
          >
            Freunde
          </Button>
          <Button
            variant={activeSection === 'suggested' ? 'default' : 'ghost'}
            className="h-auto min-h-10 rounded-2xl px-2 py-2 text-center text-[11px] leading-tight whitespace-normal sm:h-10 sm:px-4 sm:py-0 sm:text-sm sm:whitespace-nowrap"
            onClick={() => setActiveSection('suggested')}
          >
            Vorgeschlagen
          </Button>
          <Button
            variant={activeSection === 'search' ? 'default' : 'ghost'}
            className="h-auto min-h-10 rounded-2xl px-2 py-2 text-center text-[11px] leading-tight whitespace-normal sm:h-10 sm:px-4 sm:py-0 sm:text-sm sm:whitespace-nowrap"
            onClick={() => setActiveSection('search')}
          >
            Suchen
          </Button>
          <Button
            variant={activeSection === 'invites' ? 'default' : 'ghost'}
            className="h-auto min-h-10 rounded-2xl px-2 py-2 text-center text-[11px] leading-tight whitespace-normal sm:h-10 sm:px-4 sm:py-0 sm:text-sm sm:whitespace-nowrap"
            onClick={() => setActiveSection('invites')}
          >
            Einladungen
          </Button>
        </div>

        <Button className="w-full sm:w-auto rounded-2xl gap-2" onClick={openAddFriendModal}>
          <UserPlus className="h-4 w-4" />
          Freunde hinzufügen
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-3 border-b pb-4 sm:pb-6">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              {activeSection === 'suggested' ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </div>
            <CardTitle>
              {activeSection === 'friends' ? 'Freunde' : activeSection === 'suggested' ? 'Vorgeschlagen' : activeSection === 'search' ? 'Suchen' : 'Einladungen'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 py-4 sm:py-6">
          {activeSection === 'friends' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={friendSearchTerm}
                    onChange={(e) => setFriendSearchTerm(e.target.value)}
                    placeholder="Freunde nach Name, E-Mail oder Kurs suchen..."
                    className="pl-9 rounded-2xl h-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'name_asc')}>
                    <SelectTrigger className="w-full sm:w-[160px] rounded-2xl h-10">
                      <ArrowUpDown className="mr-1 h-4 w-4" />
                      <SelectValue placeholder="Sortieren" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                      <SelectItem value="date_desc">Zuletzt hinzugefügt</SelectItem>
                      <SelectItem value="date_asc">Älteste Freunde</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val || 'all')}>
                    <SelectTrigger className="w-full sm:w-[180px] rounded-2xl h-10">
                      <Filter className="mr-1 h-4 w-4" />
                      <SelectValue placeholder="Kurs filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Kurse</SelectItem>
                      {availableClasses.map((className) => (
                        <SelectItem key={className} value={className}>
                          Kurs {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {isFilterActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearFilters}
                      className="h-10 w-10 shrink-0 rounded-2xl hover:bg-destructive/10 hover:text-destructive"
                      title="Filter zurücksetzen"
                    >
                      <FilterX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {filteredFriendships.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
                    {friendships.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Du hast noch keine Freunde hinzugefügt.</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-full bg-muted p-4 mx-auto w-fit">
                          <FilterX className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-semibold">Keine Freunde gefunden</p>
                          <p className="text-sm text-muted-foreground">Keine Freunde entsprechen deinen Filterkriterien.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={clearFilters}
                          className="rounded-2xl gap-2"
                        >
                          <FilterX className="h-4 w-4" />
                          Filter zurücksetzen
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredFriendships.map((friendship) => {
                  const friendId = friendship.members.find((id) => id !== currentUserId) || friendship.members[0]
                  const friendProfile = relatedProfiles[friendId]

                  return (
                    <div key={friendship.id} className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {getDisplayName(friendProfile || { id: friendId } as Profile).slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{getDisplayName(friendProfile || { id: friendId } as Profile)}</p>
                          <p className="text-xs text-muted-foreground">
                            Seit {format(toDate(friendship.created_at), 'PPP', { locale: de })}
                          </p>
                        </div>
                      </div>
                      <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => removeFriend(friendId)}>
                        Entfernen
                      </Button>
                    </div>
                  )
                })
              )}
              </div>
            </div>
          )}

          {activeSection === 'suggested' && (
            <div className="space-y-3">
              {directoryLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : suggestionCandidates.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Keine Vorschläge vorhanden. Nutze den Button oben, um gezielt zu suchen.
                </div>
              ) : (
                suggestionCandidates.map(({ profile: entry, reasons }) => {
                  const relationshipState = getRelationshipState(entry.id)
                  const displayName = getDisplayName(entry)
                  const roleLabel = getRoleLabel(typeof entry.role === 'string' ? entry.role : undefined)
                  const className = entry.class_name?.trim()
                  const planningGroups = Array.isArray(entry.planning_groups)
                    ? entry.planning_groups.filter((group) => typeof group === 'string' && group.trim().length > 0)
                    : []

                  return (
                    <div key={entry.id} className="flex flex-col gap-3 border-b py-4 last:border-b-0 md:flex-row md:items-center">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {displayName.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold leading-none">{displayName}</p>
                            <Badge variant={roleLabel.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px]">
                              {roleLabel}
                            </Badge>
                            {reasons.filter((reason) => reason !== 'friend_network').map((reason) => (
                              <Badge key={reason} variant="outline" className="text-[10px] uppercase">
                                {getReasonLabel(reason)}
                              </Badge>
                            ))}
                          </div>
                          {entry.full_name ? (
                            <p className="truncate text-sm text-muted-foreground">{entry.email}</p>
                          ) : null}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {className && <span className="rounded-full bg-muted px-2 py-1">Kurs {className}</span>}
                            {planningGroups.length > 0 && <span className="rounded-full bg-muted px-2 py-1">{planningGroups.slice(0, 2).join(', ')}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end md:ml-auto md:w-auto">
                        <Button className="w-full sm:w-auto" variant="outline" size="sm" render={<Link href={`/profil/${entry.id}`}>Profil öffnen</Link>} />
                        <Button
                          className="w-full sm:w-auto"
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
            </div>
          )}

          {activeSection === 'search' && (
            <div className="space-y-4">
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, Kurs, Gruppe oder E-Mail suchen..."
              />

              {!searchTerm.trim() ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Gib einen Suchbegriff ein, um Ergebnisse zu sehen.
                </div>
              ) : directoryLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Keine passenden Personen gefunden.
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((entry) => {
                    const relationshipState = getRelationshipState(entry.id)
                    const isAlreadyFriend = relationshipState === 'friends'
                    const displayName = getDisplayName(entry)
                    const roleLabel = getRoleLabel(typeof entry.role === 'string' ? entry.role : undefined)
                    const className = entry.class_name?.trim()
                    const planningGroups = Array.isArray(entry.planning_groups)
                      ? entry.planning_groups.filter((group) => typeof group === 'string' && group.trim().length > 0)
                      : []

                    return (
                      <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {displayName.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium">{displayName}</p>
                              <Badge variant={roleLabel.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                {roleLabel}
                              </Badge>
                              {isAlreadyFriend && (
                                <Badge variant="outline" className="text-[10px] uppercase">
                                  Schon befreundet
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{entry.email}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {className && <span className="rounded-full bg-muted px-2 py-1">Kurs {className}</span>}
                              {planningGroups.length > 0 && <span className="rounded-full bg-muted px-2 py-1">{planningGroups.slice(0, 2).join(', ')}</span>}
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full sm:w-auto"
                          size="sm"
                          variant={isAlreadyFriend ? 'outline' : 'default'}
                          onClick={() => handleDirectoryAction(entry.id, relationshipState)}
                          disabled={submittingUserId === entry.id || isAlreadyFriend}
                        >
                          {isAlreadyFriend ? 'Schon befreundet' : (
                            <>
                              {getDirectoryButtonIcon(relationshipState)}
                              {getDirectoryButtonLabel(relationshipState)}
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection === 'invites' && (
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
                      const displayName = requester ? getDisplayName(requester) : 'Unbekannt'

                      return (
                        <div key={request.id} className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {displayName.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{displayName}</p>
                              <p className="text-xs text-muted-foreground">Hat dir eine Anfrage gesendet</p>
                            </div>
                          </div>
                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                              className="w-full sm:w-auto"
                              size="sm"
                              onClick={() =>
                                respondToFriendRequest(request.id, true)
                                  .then(() => toast.success('Freundschaft bestätigt.'))
                                  .catch((error) => {
                                    const msg = error instanceof Error ? error.message : 'Aktion fehlgeschlagen.'
                                    toast.error(msg)
                                  })
                              }
                            >
                              Annehmen
                            </Button>
                            <Button
                              className="w-full sm:w-auto"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                respondToFriendRequest(request.id, false)
                                  .then(() => toast.success('Freundschaftsanfrage abgelehnt.'))
                                  .catch((error) => {
                                    const msg = error instanceof Error ? error.message : 'Aktion fehlgeschlagen.'
                                    toast.error(msg)
                                  })
                              }
                            >
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
                  <CardTitle className="text-lg">Ausgehende Anfragen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 py-4">
                  {outgoingRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Keine ausgehenden Anfragen offen.</p>
                  ) : (
                    outgoingRequests.map((request) => {
                      const targetProfile = relatedProfiles[request.toUserId]
                      const displayName = targetProfile ? getDisplayName(targetProfile) : 'Unbekannt'

                      return (
                        <div key={request.id} className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {displayName.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{displayName}</p>
                              <p className="text-xs text-muted-foreground">Anfrage wartet auf Antwort</p>
                            </div>
                          </div>
                          <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => cancelFriendRequest(request.id)}>
                            Zurückziehen
                          </Button>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
