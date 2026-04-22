'use client'

import { Profile } from '@/types/database'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { db, getFirebaseFunctions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, limit, getDocs, startAfter, getDoc, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { MoreVertical, Shield, User, Users, Trash2, Clock3, Undo2, Search, Gift, MessageSquare, AlertTriangle, ShieldOff, X, Plus, Loader2 } from 'lucide-react'
import { ResetPasswordDialog } from '@/components/modals/ResetPasswordDialog'
import { SetTimeoutDialog } from '@/components/modals/SetTimeoutDialog'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { logAction } from '@/lib/logging'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { usePopupManager } from '@/modules/popup/usePopupManager'

const USERS_PAGE_SIZE = 50

type BulkActionType =
  | 'approve'
  | 'unapprove'
  | 'verify_email'
  | 'unverify_email'
  | 'reset_2fa'
  | 'set_course'
  | 'set_group'
  | 'clear_group'
  | 'timeout_24h'
  | 'timeout_7d'
  | 'clear_timeout'

type SearchableValuePickerProps = {
  value: string
  options: string[]
  onSelect: (value: string | null) => void
  emptyLabel: string
  searchPlaceholder: string
  className?: string
  contentClassName?: string
  allowClear?: boolean
  clearLabel?: string
  iconTrigger?: boolean
}

function SearchableValuePicker({
  value,
  options,
  onSelect,
  emptyLabel,
  searchPlaceholder,
  className,
  contentClassName,
  allowClear = true,
  clearLabel = 'Zuruecksetzen',
  iconTrigger = false,
}: SearchableValuePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const normalizedSearch = search.trim().toLowerCase()
  const filteredOptions = useMemo(() => {
    if (!normalizedSearch) return options
    return options.filter((option) => option.toLowerCase().includes(normalizedSearch))
  }, [options, normalizedSearch])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setSearch('')
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={iconTrigger ? 'icon' : 'sm'}
            className={cn(
              iconTrigger ? 'h-5 w-5 rounded-md' : 'h-9 w-full justify-between gap-2 px-2 text-sm font-normal',
              className,
            )}
            title={value || emptyLabel}
          >
            {iconTrigger ? (
              <Plus className="h-3 w-3" />
            ) : (
              <span className="truncate text-left">{value || emptyLabel}</span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className={cn('w-[280px] p-2', contentClassName)}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8"
        />
        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border bg-background">
          {allowClear && (
            <button
              type="button"
              className="flex w-full items-center px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(null)
                setOpen(false)
              }}
            >
              {clearLabel}
            </button>
          )}
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              className="flex w-full items-center px-2 py-1.5 text-left text-sm hover:bg-muted"
              title={option}
              onClick={() => {
                onSelect(option)
                setOpen(false)
              }}
            >
              <span className="truncate">{option}</span>
            </button>
          ))}
          {filteredOptions.length === 0 && (
            <div className="px-2 py-2 text-xs text-muted-foreground">Keine Treffer</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type PlanningGroupsPopoverProps = {
  profileId: string
  groups: string[]
  availableGroups: string[]
  onAddGroup: (profileId: string, groupName: string) => void
  onRemoveGroup: (profileId: string, groupName: string) => void
}

function PlanningGroupsPopover({
  profileId,
  groups,
  availableGroups,
  onAddGroup,
  onRemoveGroup,
}: PlanningGroupsPopoverProps) {
  const normalizedGroups = useMemo(
    () => Array.from(new Set(groups.filter((group): group is string => typeof group === 'string' && group.trim().length > 0))).sort((left, right) => left.localeCompare(right, 'de')),
    [groups],
  )

  const availableOptions = useMemo(
    () => availableGroups.filter((groupName) => !normalizedGroups.includes(groupName)),
    [availableGroups, normalizedGroups],
  )

  const summaryLabel = normalizedGroups.length === 0
    ? 'Keine Gruppe'
    : normalizedGroups.length === 1
      ? normalizedGroups[0]
      : `${normalizedGroups[0]} +${normalizedGroups.length - 1}`

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full max-w-[240px] justify-start gap-2 rounded-md px-2 text-left font-normal"
            title={normalizedGroups.length > 0 ? normalizedGroups.join(', ') : 'Keine Gruppe zugewiesen'}
          >
            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{summaryLabel}</span>
            {normalizedGroups.length > 1 && (
              <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-[10px] font-semibold">
                +{normalizedGroups.length - 1}
              </Badge>
            )}
          </Button>
        }
      />

      <PopoverContent align="start" className="w-[340px] max-w-none">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-none">Planungsgruppen</p>
              <p className="text-xs text-muted-foreground">
                {normalizedGroups.length === 0
                  ? 'Noch keine Gruppe zugewiesen.'
                  : `${normalizedGroups.length} Gruppe${normalizedGroups.length === 1 ? '' : 'n'} zugewiesen.`}
              </p>
            </div>
            <Badge variant="outline" className="h-6 rounded-full px-2 text-[10px] uppercase tracking-[0.2em]">
              {normalizedGroups.length}
            </Badge>
          </div>

          {normalizedGroups.length > 0 ? (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border bg-muted/20 p-2">
              {normalizedGroups.map((groupName) => (
                <Badge
                  key={groupName}
                  variant="secondary"
                  className="h-6 max-w-full gap-1 rounded-full px-2 text-[10px] font-medium"
                  title={groupName}
                >
                  <span className="truncate">{groupName}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveGroup(profileId, groupName)}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Gruppe ${groupName} entfernen`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
              Die Gruppenanzeige ist aktuell leer.
            </div>
          )}

          <SearchableValuePicker
            value=""
            options={availableOptions}
            emptyLabel="Gruppe hinzufügen"
            searchPlaceholder="Gruppe suchen..."
            allowClear={false}
            iconTrigger
            contentClassName="w-[300px]"
            onSelect={(value) => {
              if (!value) return
              onAddGroup(profileId, value)
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function AdminUserPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { confirm } = usePopupManager()
  const { pushMessage } = useSystemMessage()
  const functions = getFirebaseFunctions()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [selectedGiftRecipients, setSelectedGiftRecipients] = useState<string[]>([])
  
  // Cross-page selection states
  const [allSelectedMode, setAllSelectedMode] = useState(false)
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const [totalUserCount, setTotalUserCount] = useState<number | null>(null)
  const [allUserIds, setAllUserIds] = useState<string[]>([])
  const [loadingAllIds, setLoadingAllIds] = useState(false)

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = useState(false)
  const [timeoutTarget, setTimeoutTarget] = useState<{ id: string, name: string } | null>(null)
  const [bulkAction, setBulkAction] = useState<BulkActionType>('approve')
  const [bulkCourse, setBulkCourse] = useState('')
  const [bulkGroup, setBulkGroup] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [courses, setCourses] = useState<string[]>([])
  const [planningGroups, setPlanningGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const canManageUsers =
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canManageUsers)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [profile, authLoading, canManageUsers, router, pathname])

  const fetchProfiles = useCallback(async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
    const qProfiles = cursor
      ? query(collection(db, 'profiles'), orderBy('created_at', 'desc'), startAfter(cursor), limit(USERS_PAGE_SIZE))
      : query(collection(db, 'profiles'), orderBy('created_at', 'desc'), limit(USERS_PAGE_SIZE))
    
    const snapshot = await getDocs(qProfiles)
    const newProfiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile))
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    
    return {
      newProfiles,
      lastDoc,
      hasNext: snapshot.docs.length === USERS_PAGE_SIZE
    }
  }, [])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const { newProfiles, lastDoc, hasNext } = await fetchProfiles(null)
      setProfiles(newProfiles)
      setLastVisible(lastDoc)
      setHasMore(hasNext)
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchProfiles])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastVisible) return
    setLoadingMore(true)
    try {
      const { newProfiles, lastDoc, hasNext } = await fetchProfiles(lastVisible)
      setProfiles(prev => {
        const seen = new Set(prev.map(p => p.id))
        const filtered = newProfiles.filter(p => !seen.has(p.id))
        return [...prev, ...filtered]
      })
      setLastVisible(lastDoc)
      setHasMore(hasNext)
    } catch (error) {
      console.error('Error loading more profiles:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [fetchProfiles, hasMore, lastVisible, loadingMore])

  useEffect(() => {
    if (!authLoading && canManageUsers) {
      loadInitial()
    }
  }, [authLoading, canManageUsers, loadInitial])

  useEffect(() => {
    if (loading || !hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, hasMore, loadingMore, loadMore])

  const fetchAllUserIds = async () => {
    if (allUserIds.length > 0 || loadingAllIds) return
    setLoadingAllIds(true)
    try {
      const q = query(collection(db, 'profiles'), orderBy('created_at', 'desc'))
      const snapshot = await getDocs(q)
      const ids = snapshot.docs.map(d => d.id)
      setAllUserIds(ids)
      setTotalUserCount(ids.length)
    } catch (error) {
      console.error("Failed to fetch all user IDs:", error)
    } finally {
      setLoadingAllIds(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (!snapshot.exists()) {
        setCourses([])
        setPlanningGroups([])
        return
      }

      const data = snapshot.data()
      const rawCourses = data.courses
      const rawGroups = data.planning_groups

      const normalizedCourses = Array.isArray(rawCourses)
        ? rawCourses
            .filter((course): course is string => typeof course === 'string' && course.trim().length > 0)
            .map((course) => course.trim())
        : []

      const normalizedGroups = Array.isArray(rawGroups)
        ? rawGroups
            .map((entry) => {
              if (typeof entry === 'string') return entry
              if (entry && typeof entry === 'object' && 'name' in entry && typeof entry.name === 'string') {
                return entry.name
              }
              return null
            })
            .filter((name): name is string => !!name && name.trim().length > 0)
            .map((name) => name.trim())
        : []

      setCourses(normalizedCourses)
      setPlanningGroups(normalizedGroups)
    }, (error) => {
      console.error('AdminUserPage: Error listening to settings config:', error)
    })

    return () => unsubscribe()
  }, [])

  const handleUpdateProfile = async (id: string, updates: any) => {
    const target = profiles.find((entry) => entry.id === id)
    if (!target) {
      try {
        const docRef = doc(db, 'profiles', id)
        await updateDoc(docRef, updates)
        if (user) {
          await logAction('PROFILE_UPDATED', user.uid, profile?.full_name, {
            target_user_id: id,
            updates,
          })
        }
      } catch (err) {
        console.error('Error updating profile (paginated):', err)
      }
      return
    }

    const updateKeys = Object.keys(updates)
    const isAssignmentOnlyUpdate = updateKeys.every((key) => key === 'class_name' || key === 'planning_groups')
    const targetIsMainAdmin = target.role === 'admin_main' || target.role === 'admin'
    if (targetIsMainAdmin && profile?.id !== id && !isAssignmentOnlyUpdate) {
      return
    }

    if (id === profile?.id && updates.role && updates.role !== target.role) {
      return
    }

    try {
      const docRef = doc(db, 'profiles', id)
      await updateDoc(docRef, updates)
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))

      if (user) {
        await logAction('PROFILE_UPDATED', user.uid, profile?.full_name, {
          target_user_id: id,
          target_user_name: target.full_name,
          updates,
        })
      }
    } catch (err) {
      console.error('Error updating profile:', err)
    }
  }

  const handleTimeoutConfirm = async (hours: number, reason: string) => {
    if (!timeoutTarget) return

    const timeoutUntil = hours > 0 
      ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() - 1000).toISOString()

    await handleUpdateProfile(timeoutTarget.id, {
      timeout_until: timeoutUntil,
      timeout_reason: reason,
    })

    pushMessage({
      type: 'toast',
      priority: 'info',
      title: 'Erfolg',
      content: hours > 0 ? `Nutzer ${timeoutTarget.name} wurde gesperrt.` : `Nutzer ${timeoutTarget.name} wurde verwarnt.`
    })
    setTimeoutTarget(null)
  }

  const handleClearTimeout = async (id: string) => {
    await handleUpdateProfile(id, {
      timeout_until: null,
      timeout_reason: null,
    })
    pushMessage({
      type: 'toast',
      priority: 'info',
      title: 'Erfolg',
      content: 'Timeout wurde aufgehoben.'
    })
  }

  const handleDeleteProfile = async (id: string) => {
    const target = profiles.find((entry) => entry.id === id)
    if (!target) return

    const targetIsMainAdmin = target.role === 'admin_main' || target.role === 'admin'
    if (targetIsMainAdmin || id === profile?.id) {
      return
    }

    const confirmed = await confirm({
      title: 'Nutzer löschen?',
      content: 'Bist du sicher, dass du diesen Nutzer löschen möchtest?',
      priority: 'high',
      confirmLabel: 'Nutzer löschen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return

    try {
      await deleteDoc(doc(db, 'profiles', id))
      setProfiles(prev => prev.filter(p => p.id !== id))
      if (allUserIds.includes(id)) {
        setAllUserIds(prev => prev.filter(uid => uid !== id))
        setTotalUserCount(prev => prev !== null ? prev - 1 : null)
      }

      if (user) {
        await logAction('PROFILE_DELETED', user.uid, profile?.full_name, {
          target_user_id: id,
          target_user_name: target.full_name,
        })
      }
    } catch (err) {
      console.error('Error deleting profile:', err)
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const isSelected = (id: string) => {
    if (allSelectedMode) {
      return !excludedIds.includes(id)
    }
    return selectedGiftRecipients.includes(id)
  }

  const toggleRecipient = (userId: string, checked: boolean) => {
    if (allSelectedMode) {
      if (checked) {
        setExcludedIds(prev => prev.filter(id => id !== userId))
      } else {
        setExcludedIds(prev => [...prev, userId])
      }
    } else {
      setSelectedGiftRecipients((prev) => {
        if (checked) {
          if (prev.includes(userId)) return prev
          return [...prev, userId]
        }
        return prev.filter((id) => id !== userId)
      })
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setAllSelectedMode(true)
      setExcludedIds([])
      setSelectedGiftRecipients([])
      fetchAllUserIds()
    } else {
      setAllSelectedMode(false)
      setExcludedIds([])
      setSelectedGiftRecipients([])
    }
  }

  const getEffectiveSelectedIds = async (): Promise<string[]> => {
    if (!allSelectedMode) return selectedGiftRecipients
    
    let ids = allUserIds
    if (ids.length === 0) {
      setLoadingAllIds(true)
      try {
        const q = query(collection(db, 'profiles'), orderBy('created_at', 'desc'))
        const snapshot = await getDocs(q)
        ids = snapshot.docs.map(d => d.id)
        setAllUserIds(ids)
        setTotalUserCount(ids.length)
      } catch (error) {
        console.error("Failed to fetch all IDs for bulk action:", error)
        return []
      } finally {
        setLoadingAllIds(false)
      }
    }
    
    return ids.filter(id => !excludedIds.includes(id))
  }

  const handleBulkAction = async () => {
    if (!user) return

    const targetIds = await getEffectiveSelectedIds()
    if (targetIds.length === 0) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Keine gültigen Nutzer ausgewählt.'
      })
      return
    }

    if (bulkAction === 'set_course' && !bulkCourse) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Bitte einen Kurs auswählen.'
      })
      return
    }

    if (bulkAction === 'set_group' && !bulkGroup) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Bitte eine Gruppe auswählen.'
      })
      return
    }

    setBulkProcessing(true)
    try {
      const isMainAdminActor = profile && (profile.role === 'admin' || profile.role === 'admin_main')
      const successIds: string[] = []
      const failedIds: string[] = []
      const skippedIds: string[] = []

      const toggleEmailVerif = httpsCallable(functions, 'toggleUserEmailVerification')

      const chunkArray = <T,>(arr: T[], size: number): T[][] => 
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))

      const chunks = chunkArray(targetIds, 15)

      for (const chunk of chunks) {
        const profileSnaps = await Promise.all(chunk.map(id => getDoc(doc(db, 'profiles', id))))
        
        for (const snap of profileSnaps) {
          if (!snap.exists()) continue
          const target = { id: snap.id, ...snap.data() } as Profile
          const targetIsMainAdmin = target.role === 'admin' || target.role === 'admin_main'
          const isAssignmentAction = bulkAction === 'set_course' || bulkAction === 'set_group' || bulkAction === 'clear_group'

          if (!isMainAdminActor && targetIsMainAdmin && !isAssignmentAction) {
            skippedIds.push(target.id)
            continue
          }

          const targetRef = doc(db, 'profiles', target.id)
          try {
            if (bulkAction === 'approve') {
              await updateDoc(targetRef, { is_approved: true })
            } else if (bulkAction === 'unapprove') {
              await updateDoc(targetRef, { is_approved: false })
            } else if (bulkAction === 'verify_email') {
              await toggleEmailVerif({ targetUid: target.id, emailVerified: true })
            } else if (bulkAction === 'unverify_email') {
              await toggleEmailVerif({ targetUid: target.id, emailVerified: false })
            } else if (bulkAction === 'reset_2fa') {
              await updateDoc(targetRef, { is_2fa_enabled: false, two_factor_secret_id: null })
            } else if (bulkAction === 'set_course') {
              await updateDoc(targetRef, { class_name: bulkCourse })
            } else if (bulkAction === 'set_group') {
              await updateDoc(targetRef, { planning_groups: arrayUnion(bulkGroup) })
            } else if (bulkAction === 'clear_group') {
              await updateDoc(targetRef, { planning_groups: [] })
            } else if (bulkAction === 'timeout_24h') {
              await updateDoc(targetRef, {
                timeout_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                timeout_reason: 'Admin-Timeout (24h)',
              })
            } else if (bulkAction === 'timeout_7d') {
              await updateDoc(targetRef, {
                timeout_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                timeout_reason: 'Admin-Timeout (7 Tage)',
              })
            } else if (bulkAction === 'clear_timeout') {
              await updateDoc(targetRef, {
                timeout_until: null,
                timeout_reason: null,
              })
            }
            successIds.push(target.id)
          } catch {
            failedIds.push(target.id)
          }
        }
      }

      await logAction('PROFILE_UPDATED', user.uid, profile?.full_name, {
        bulk_action: bulkAction,
        course: bulkCourse || null,
        group: bulkGroup || null,
        success_count: successIds.length,
        skipped_count: skippedIds.length,
        failed_count: failedIds.length,
      })

      if (successIds.length > 0) {
        pushMessage({
          type: 'toast',
          priority: 'info',
          title: 'Erfolg',
          content: `Massenaktion abgeschlossen: ${successIds.length} erfolgreich.`
        })
        loadInitial()
      }
      if (skippedIds.length > 0) {
        pushMessage({ type: 'toast', priority: 'warning', title: 'Warnung', content: `${skippedIds.length} Nutzer übersprungen.` })
      }
      if (failedIds.length > 0) {
        pushMessage({ type: 'toast', priority: 'critical', title: 'Fehler', content: `${failedIds.length} Nutzer fehlgeschlagen.` })
      }

      setIsBulkDialogOpen(false)
      setAllSelectedMode(false)
      setExcludedIds([])
      setSelectedGiftRecipients([])
    } finally {
      setBulkProcessing(false)
    }
  }

  const selectedCount = allSelectedMode 
    ? (totalUserCount !== null ? totalUserCount - excludedIds.length : 'Alle') 
    : selectedGiftRecipients.length

  const allVisibleSelected = filteredProfiles.length > 0 && filteredProfiles.every(p => isSelected(p.id))

  const handleSendPopupRedirect = async () => {
    const targetIds = await getEffectiveSelectedIds()
    if (targetIds.length === 0) return
    sessionStorage.setItem('admin_send_recipients', JSON.stringify(targetIds))
    router.push('/admin/send')
  }

  const copyUserValue = async (value: string | null | undefined, label: string) => {
    const normalized = (value || '').trim()
    if (!normalized) return
    try {
      await navigator.clipboard.writeText(normalized)
      pushMessage({ type: 'toast', priority: 'info', title: 'Kopiert', content: `${label} wurde kopiert.` })
    } catch {
      pushMessage({ type: 'toast', priority: 'critical', title: 'Fehler', content: `${label} nicht kopiert.` })
    }
  }

  if (authLoading || (loading && profiles.length === 0)) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Benutzerverwaltung...</div>
  }

  if (!profile || !canManageUsers) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Benutzerverwaltung</h1>
          <p className="text-muted-foreground text-sm">Verwalte Profile und Rollen ({profiles.length} geladen).</p>
        </div>
        <div className="relative w-full max-sm:max-w-none max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Geladene Nutzer suchen..."
            className="pl-9"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Massenaktionen
          </CardTitle>
          <CardDescription>
            Die Auswahl gilt für Schenkungen und Massenänderungen (auch seitenübergreifend).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Ausgewählt: <span className="font-semibold text-foreground">{selectedCount}</span>
            </p>
            {allSelectedMode && loadingAllIds && (
              <p className="text-[10px] text-primary animate-pulse">Lade alle Nutzer-IDs...</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                setAllSelectedMode(false)
                setExcludedIds([])
                setSelectedGiftRecipients([])
              }}
              disabled={selectedCount === 0}
              className="w-full"
            >
              Auswahl leeren
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBulkDialogOpen(true)}
              disabled={selectedCount === 0 || bulkProcessing}
              className="w-full"
            >
              Massenaktion
            </Button>
            <Button
              onClick={handleSendPopupRedirect}
              disabled={selectedCount === 0 || loadingAllIds}
              className="gap-2 w-full"
            >
              <Gift className="h-4 w-4" />
              Popup senden
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrierte Profile</CardTitle>
          <CardDescription>Kurs- und Gruppenzuweisungen sowie Systemrollen.</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="hidden xl:block overflow-x-auto w-full max-w-full">
            <Table className="min-w-[860px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelectedMode ? (excludedIds.length === 0) : (filteredProfiles.length > 0 && filteredProfiles.every(p => isSelected(p.id)))}
                      onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead>Gruppe</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((p) => {
                  const isMainAdminAccount = p.role === 'admin_main' || p.role === 'admin'
                  const isSelf = p.id === profile.id
                  const canManageRoleActions = !isMainAdminAccount && !isSelf
                  const selected = isSelected(p.id)

                  return (
                    <ContextMenu key={p.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow className={cn(selected && "bg-primary/5")}>
                          <TableCell>
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(checked) => toggleRecipient(p.id, checked === true)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <Link href={`/profil/${p.id}`} className="hover:underline focus-visible:underline">
                              {p.full_name || 'Unbekannt'}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground break-all">{p.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{p.role}</Badge>
                            {p.timeout_until && new Date(p.timeout_until).getTime() > Date.now() && (
                              <Badge variant="destructive" className="ml-2">Sperre</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <SearchableValuePicker
                              value={p.class_name || ''}
                              options={courses}
                              emptyLabel="Kein Kurs"
                              searchPlaceholder="Kurs suchen..."
                              onSelect={(value) => handleUpdateProfile(p.id, { class_name: value || null })}
                            />
                          </TableCell>
                          <TableCell>
                            <PlanningGroupsPopover
                              profileId={p.id}
                              groups={p.planning_groups || []}
                              availableGroups={planningGroups}
                              onAddGroup={(profileId, groupName) => handleUpdateProfile(profileId, { planning_groups: arrayUnion(groupName) })}
                              onRemoveGroup={(profileId, groupName) => handleUpdateProfile(profileId, { planning_groups: arrayRemove(groupName) })}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>} />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/admin/send?u=${p.id}`)}><MessageSquare className="mr-2 h-4 w-4" /> Popup senden</DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'admin' })}><Shield className="mr-2 h-4 w-4" /> Zum Admin</DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => handleUpdateProfile(p.id, { role: 'admin_co' })}><Shield className="mr-2 h-4 w-4" /> Zum Co-Admin</DropdownMenuItem>
                                <DropdownMenuItem disabled={!canManageRoleActions} onClick={() => {
                                  setTimeoutTarget({ id: p.id, name: p.full_name || p.email })
                                  setIsTimeoutDialogOpen(true)
                                }}><AlertTriangle className="mr-2 h-4 w-4 text-destructive" /> Warnen / Sperren</DropdownMenuItem>
                                <ResetPasswordDialog userEmail={p.email} userName={p.full_name || 'User'} />
                                <DropdownMenuItem className="text-destructive" disabled={!canManageRoleActions} onClick={() => handleDeleteProfile(p.id)}><Trash2 className="mr-2 h-4 w-4" /> Löschen</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-56">
                        <ContextMenuLabel>{p.full_name || p.email || p.id}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => router.push(`/profil/${p.id}`)}><User className="h-4 w-4 mr-2" /> Profil öffnen</ContextMenuItem>
                        <ContextMenuItem onClick={() => toggleRecipient(p.id, !selected)}><Gift className="h-4 w-4 mr-2" /> {selected ? 'Deselektieren' : 'Auswählen'}</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => copyUserValue(p.full_name, 'Name')}><User className="h-4 w-4 mr-2" /> Name kopieren</ContextMenuItem>
                        <ContextMenuItem onClick={() => copyUserValue(p.email, 'E-Mail')}><MessageSquare className="h-4 w-4 mr-2" /> E-Mail kopieren</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="xl:hidden space-y-4">
            {filteredProfiles.map((p) => {
              const selected = isSelected(p.id)
              return (
                <div key={p.id} className={cn("border rounded-xl p-4 space-y-4 transition-colors", selected ? "bg-primary/5 border-primary/20" : "bg-card/50")}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex items-start gap-3">
                      <Checkbox checked={selected} onCheckedChange={(checked) => toggleRecipient(p.id, checked === true)} />
                      <div>
                        <Link href={`/profil/${p.id}`} className="font-bold hover:underline truncate block text-foreground">{p.full_name || 'Unbekannt'}</Link>
                        <p className="text-xs text-muted-foreground break-all">{p.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{p.role}</Badge>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col items-center gap-4 py-8">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade weitere Nutzer...</div>
            ) : hasMore ? (
              <Button variant="outline" onClick={loadMore}>Mehr Nutzer laden</Button>
            ) : profiles.length > 0 ? (
              <p className="text-sm text-muted-foreground">Alle Nutzer geladen.</p>
            ) : null}
            <div ref={sentinelRef} className="h-1 w-full" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Massenaktion ausführen</DialogTitle>
            <DialogDescription>Diese Änderung wird für alle {selectedCount} ausgewählten Nutzer ausgeführt.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-action">Aktion</Label>
              <select id="bulk-action" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={bulkAction} onChange={(e) => setBulkAction(e.target.value as BulkActionType)}>
                <option value="approve">Accounts freischalten</option>
                <option value="unapprove">Freischaltung entfernen</option>
                <option value="verify_email">E-Mails verifizieren</option>
                <option value="reset_2fa">2FA zurücksetzen</option>
                <option value="set_course">Kurs setzen</option>
                <option value="set_group">Planungsgruppe setzen</option>
                <option value="clear_group">Planungsgruppe entfernen</option>
                <option value="timeout_24h">Timeout 24h setzen</option>
                <option value="clear_timeout">Timeout aufheben</option>
              </select>
            </div>
            {bulkAction === 'set_course' && (
              <SearchableValuePicker value={bulkCourse} options={courses} emptyLabel="Kurs auswaehlen" searchPlaceholder="Kurs suchen..." onSelect={(v) => setBulkCourse(v || '')} />
            )}
            {bulkAction === 'set_group' && (
              <SearchableValuePicker value={bulkGroup} options={planningGroups} emptyLabel="Gruppe auswaehlen" searchPlaceholder="Gruppe suchen..." onSelect={(v) => setBulkGroup(v || '')} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)} disabled={bulkProcessing}>Abbrechen</Button>
            <Button onClick={handleBulkAction} disabled={bulkProcessing}>{bulkProcessing ? 'Wird ausgeführt...' : 'Massenaktion starten'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SetTimeoutDialog 
        isOpen={isTimeoutDialogOpen}
        onOpenChange={setIsTimeoutDialogOpen}
        onConfirm={handleTimeoutConfirm}
        userName={timeoutTarget?.name || 'Nutzer'}
      />
    </div>
  )
}
