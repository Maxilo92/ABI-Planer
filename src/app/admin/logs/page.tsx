'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs, limit, orderBy, query, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'
import { Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toDate } from '@/lib/utils'
import type { LogActionType, LogEntry } from '@/lib/logging'

type AdminLog = LogEntry & { id: string }
const LOGS_PAGE_SIZE = 40

export default function AdminLogsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [selectedAction, setSelectedAction] = useState<LogActionType | 'all'>('all')
  const [selectedWindow, setSelectedWindow] = useState<'all' | '24h' | '7d'>('all')
  const [userFilter, setUserFilter] = useState('')
  const [detailsFilter, setDetailsFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  const canManageUsers =
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canManageUsers)) {
      router.push('/')
    }
  }, [profile, authLoading, canManageUsers, router])

  const fetchLogsChunk = useCallback(async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
    const constraints = [orderBy('timestamp', 'desc'), limit(LOGS_PAGE_SIZE)]
    const logsQuery = cursor
      ? query(collection(db, 'logs'), ...constraints, startAfter(cursor))
      : query(collection(db, 'logs'), ...constraints)

    const snapshot = await getDocs(logsQuery)
    const chunk = snapshot.docs.map((entryDoc) => ({ id: entryDoc.id, ...entryDoc.data() } as AdminLog))
    const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : cursor

    return {
      chunk,
      nextCursor,
      hasNext: snapshot.docs.length === LOGS_PAGE_SIZE,
    }
  }, [])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    setLogs([])
    setLastVisible(null)
    setHasMore(true)

    try {
      const { chunk, nextCursor, hasNext } = await fetchLogsChunk(null)
      setLogs(chunk)
      setLastVisible(nextCursor)
      setHasMore(hasNext)
    } catch (error) {
      console.error('Error loading admin logs:', error)
      setLoadError('Logs konnten nicht geladen werden. Prüfe bitte die Firestore-Berechtigungen.')
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [fetchLogsChunk])

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !lastVisible) return

    setLoadingMore(true)
    setLoadError(null)

    try {
      const { chunk, nextCursor, hasNext } = await fetchLogsChunk(lastVisible)
      setLogs((previous) => {
        const seen = new Set(previous.map((entry) => entry.id))
        const merged = [...previous]
        chunk.forEach((entry) => {
          if (!seen.has(entry.id)) {
            merged.push(entry)
          }
        })
        return merged
      })
      setLastVisible(nextCursor)
      setHasMore(hasNext)
    } catch (error) {
      console.error('Error loading more admin logs:', error)
      setLoadError('Weitere Logs konnten nicht geladen werden.')
    } finally {
      setLoadingMore(false)
    }
  }, [fetchLogsChunk, hasMore, lastVisible, loading, loadingMore])

  useEffect(() => {
    if (authLoading) return

    if (!profile || !canManageUsers) {
      setLoading(false)
      return
    }

    void loadInitial()
  }, [authLoading, profile, canManageUsers, loadInitial])

  useEffect(() => {
    if (authLoading || !profile || !canManageUsers || !hasMore || loading) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadMore()
        }
      },
      {
        root: null,
        rootMargin: '240px 0px',
        threshold: 0,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [authLoading, profile, canManageUsers, hasMore, loading, loadMore])

  const availableActions = useMemo(() => {
    return Array.from(new Set(logs.map((entry) => entry.action))).sort()
  }, [logs])

  const filteredLogs = useMemo(() => {
    const queryUser = userFilter.trim().toLowerCase()
    const queryDetails = detailsFilter.trim().toLowerCase()
    const now = Date.now()

    return logs.filter((entry) => {
      if (selectedAction !== 'all' && entry.action !== selectedAction) {
        return false
      }

      if (selectedWindow !== 'all') {
        const maxAgeMs = selectedWindow === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        const ageMs = now - toDate(entry.timestamp).getTime()
        if (ageMs > maxAgeMs) {
          return false
        }
      }

      if (queryUser) {
        const combinedUser = `${entry.user_name || ''} ${entry.user_id || ''}`.toLowerCase()
        if (!combinedUser.includes(queryUser)) {
          return false
        }
      }

      if (queryDetails) {
        const detailText = typeof entry.details === 'string'
          ? entry.details
          : entry.details
            ? JSON.stringify(entry.details)
            : ''

        const haystack = `${entry.action} ${detailText}`.toLowerCase()
        if (!haystack.includes(queryDetails)) {
          return false
        }
      }

      return true
    })
  }, [logs, selectedAction, selectedWindow, userFilter, detailsFilter])

  const formatDetails = (details: unknown): string => {
    if (!details) return '-'
    if (typeof details === 'string') return details

    try {
      return JSON.stringify(details)
    } catch {
      return 'Details nicht lesbar'
    }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Aktivitaets-Logs...</div>
  }

  if (!profile || !canManageUsers) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Admin Logs</h1>
          <Badge variant="secondary" className="uppercase tracking-wide text-[10px]">Beta</Badge>
        </div>
        <p className="text-muted-foreground text-sm">Nachvollziehbare Aktivitaeten fuer Moderation und Support</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Aktivitaets-Logs
          </CardTitle>
          <CardDescription>
            Filtere Aktionen nach Typ, Zeitraum, Nutzer oder Inhalt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as LogActionType | 'all')}
            >
              <option value="all">Alle Aktionen</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(e.target.value as 'all' | '24h' | '7d')}
            >
              <option value="all">Gesamter Zeitraum</option>
              <option value="24h">Letzte 24 Stunden</option>
              <option value="7d">Letzte 7 Tage</option>
            </select>

            <Input
              placeholder="Nutzername oder User-ID"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />

            <Input
              placeholder="In Aktion oder Details suchen"
              value={detailsFilter}
              onChange={(e) => setDetailsFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredLogs.length} Eintraege gefunden</span>
            {filteredLogs.length > 0 && <span>Neuester Eintrag zuerst</span>}
          </div>

          {loadError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          {filteredLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              Keine Logs mit den aktuellen Filtern gefunden.
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredLogs.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border/70 bg-card/70 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">{entry.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {toDate(entry.timestamp).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Nutzer:</span>{' '}
                      {entry.user_name || 'Unbekannt'} ({entry.user_id || 'n/a'})
                    </p>
                    <p className="text-xs text-muted-foreground break-words">{formatDetails(entry.details)}</p>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeitpunkt</TableHead>
                      <TableHead>Aktion</TableHead>
                      <TableHead>Nutzer</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {toDate(entry.timestamp).toLocaleString('de-DE')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{entry.user_name || 'Unbekannt'}</div>
                          <div className="text-xs text-muted-foreground">{entry.user_id || 'n/a'}</div>
                        </TableCell>
                        <TableCell className="max-w-[420px]">
                          <p className="text-xs text-muted-foreground break-words line-clamp-3">
                            {formatDetails(entry.details)}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-center gap-3 pt-2">
                {loadingMore && <p className="text-xs text-muted-foreground">Lade weitere Logs...</p>}
                {!loadingMore && hasMore && (
                  <Button variant="outline" size="sm" onClick={() => void loadMore()}>
                    Mehr laden
                  </Button>
                )}
                {!hasMore && <p className="text-xs text-muted-foreground">Ende der Logs erreicht.</p>}
                <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
