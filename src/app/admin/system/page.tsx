'use client'

import { useEffect, useMemo, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, setDoc, collection, getCountFromServer, query, where, Timestamp, getDocs, orderBy, limit, getDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  ShieldAlert, Activity, Users, Sparkles, 
  ArrowLeftRight, ShoppingBag, Megaphone, 
  Calendar, CheckSquare, AlertTriangle,
  RefreshCw, Lock, Server, TrendingUp,
  Clock, CheckCircle2, LineChart as LineChartIcon, MessageSquare, FolderOpen, BarChart3,
  DollarSign, Settings, BarChart2, MessageSquareHeart
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { GlobalStats, SystemAnalytics, SystemAnalyticsActionStat, SystemAnalyticsTimelinePoint, SystemFeatures } from '@/types/system'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend)

const adminLinks = [
  { href: '/admin', label: 'Benutzer', description: 'Nutzerkonten verwalten & Aktionen', icon: Users },
  { href: '/admin/sammelkarten', label: 'Sammelkarten Manager', description: 'Lehrer-Karten & Konfiguration', icon: Sparkles },
  { href: '/admin/trades', label: 'Trade Moderation', description: 'Tauschanfragen moderieren', icon: ArrowLeftRight },
  { href: '/admin/global-settings', label: 'Globale Einstellungen', description: 'Popups, Banner, Wartungsmodus', icon: Settings },
  { href: '/admin/shop-earnings', label: 'Shop Einnahmen', description: 'Transaktionen & Einnahmen', icon: DollarSign },
  { href: '/admin/logs', label: 'Logs', description: 'Aktivitäts- & Danger-Logs', icon: BarChart2 },
  { href: '/admin/feedback', label: 'Feedback Admin', description: 'Nutzerfeedback einsehen', icon: MessageSquareHeart },
  { href: '/admin/danger', label: 'Danger Zone', description: 'Kritische System-Operationen', icon: AlertTriangle, dangerOnly: true },
]

export default function AdminSystemDashboard() {
  const { profile, user, loading: authLoading } = useAuth()
  const [features, setFeatures] = useState<SystemFeatures | null>(null)
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [cardsByUser, setCardsByUser] = useState<Array<{ label: string; value: number }>>([])
  const [loadingCardsByUser, setLoadingCardsByUser] = useState(false)
  const router = useRouter()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  const parseProxyOrDirectPayload = (payload: any) => {
    if (payload && typeof payload === 'object' && 'ok' in payload) {
      return {
        ok: Boolean(payload.ok),
        data: payload.data,
      }
    }

    // Direct Cloud Function HTTP fallback returns plain JSON payload.
    return {
      ok: true,
      data: payload,
    }
  }

  const postWithLocalFallback = async (paths: string[], headers: Record<string, string>) => {
    let lastResponse: Response | null = null

    for (const path of paths) {
      const response = await fetch(path, { method: 'POST', headers })
      lastResponse = response

      // Retry only for routing misses; keep all other statuses for caller handling.
      if (response.status !== 404) {
        return response
      }
    }

    return lastResponse
  }

  const postWithResilientFallback = async (localPaths: string[], headers: Record<string, string>) => {
    const localResponse = await postWithLocalFallback(localPaths, headers)
    return localResponse
  }

  const buildFallbackAnalytics = (): SystemAnalytics => ({
    window_days: 7,
    generated_at: new Date().toISOString(),
    total_log_entries: 0,
    current_online_users_count: 0,
    current_online_users: [],
    activity_timeline: [],
    top_actions: [],
    section_usage: [],
    recent_actions: [],
    average_session_minutes: 0,
  })

  const countRecentLogsFromFirestore = async (windowDays: number) => {
    const safeWindowDays = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 7
    const since = new Date(Date.now() - safeWindowDays * 24 * 60 * 60 * 1000)

    const logsQuery = query(
      collection(db, 'logs'),
      where('timestamp', '>=', Timestamp.fromDate(since))
    )

    const countSnapshot = await getCountFromServer(logsQuery)
    return countSnapshot.data().count
  }

  const inferSectionFromAction = (action: string) => {
    const normalized = action.toUpperCase()
    if (normalized.includes('TODO')) return 'Todos'
    if (normalized.includes('EVENT')) return 'Kalender'
    if (normalized.includes('NEWS')) return 'News'
    if (normalized.includes('POLL') || normalized.includes('VOTE')) return 'Umfragen'
    if (normalized.includes('GROUP')) return 'Gruppen'
    if (normalized.includes('FINANCE')) return 'Finanzen'
    if (normalized.includes('PROFILE') || normalized.includes('ACCOUNT')) return 'Profil'
    if (normalized.includes('CARD') || normalized.includes('TEACHER') || normalized.includes('BOOSTER') || normalized.includes('LOOT')) return 'Sammelkarten'
    if (normalized.includes('SETTINGS')) return 'Einstellungen'
    if (normalized.includes('DANGER')) return 'Danger'
    return 'Sonstiges'
  }

  const buildClientAnalyticsFromFirestoreLogs = async (windowDays: number, currentAnalytics: SystemAnalytics) => {
    const safeWindowDays = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 7
    const now = new Date()
    const since = new Date(now.getTime() - safeWindowDays * 24 * 60 * 60 * 1000)

    const logsQuery = query(
      collection(db, 'logs'),
      where('timestamp', '>=', Timestamp.fromDate(since)),
      orderBy('timestamp', 'desc'),
      limit(2500)
    )

    const logsSnap = await getDocs(logsQuery)

    type ClientLog = {
      id: string
      action: string
      user_id: string
      user_name: string | null
      timestamp: Date
      details: Record<string, unknown> | null
    }

    const logs = logsSnap.docs
      .map((item): ClientLog | null => {
        const data = item.data() as Record<string, unknown>
        const timestampValue = data.timestamp as Timestamp | undefined
        const timestamp = timestampValue?.toDate?.()
        if (!timestamp || Number.isNaN(timestamp.getTime())) return null

        return {
          id: item.id,
          action: typeof data.action === 'string' ? data.action : 'UNKNOWN_ACTION',
          user_id: typeof data.user_id === 'string' ? data.user_id : 'unknown',
          user_name: typeof data.user_name === 'string' ? data.user_name : null,
          timestamp,
          details: (data.details as Record<string, unknown>) ?? null,
        }
      })
      .filter((item): item is ClientLog => item !== null)

    const actionUsage = new Map<string, number>()
    const sectionUsage = new Map<string, number>()
    const dayUsage = new Map<string, { label: string; actions: number; users: Set<string> }>()

    logs.forEach((log) => {
      actionUsage.set(log.action, (actionUsage.get(log.action) || 0) + 1)

      const section = inferSectionFromAction(log.action)
      sectionUsage.set(section, (sectionUsage.get(section) || 0) + 1)

      const dayKey = log.timestamp.toISOString().slice(0, 10)
      const existing = dayUsage.get(dayKey) || {
        label: log.timestamp.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        actions: 0,
        users: new Set<string>(),
      }
      existing.actions += 1
      if (log.user_id) existing.users.add(log.user_id)
      dayUsage.set(dayKey, existing)
    })

    const topActions = Array.from(actionUsage.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12)

    const sectionStats = Array.from(sectionUsage.entries())
      .map(([section, count]) => ({ section, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10)

    const activityTimeline = Array.from(dayUsage.entries())
      .sort(([leftDay], [rightDay]) => leftDay.localeCompare(rightDay))
      .map(([date, value]) => ({
        date,
        label: value.label,
        actions: value.actions,
        active_users: value.users.size,
        unique_users: value.users.size,
      }))

    const recentActions = logs
      .slice(0, 12)
      .map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        action: log.action,
        user_id: log.user_id,
        user_name: log.user_name,
        section: inferSectionFromAction(log.action),
        details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {}),
      }))

    return {
      ...currentAnalytics,
      window_days: safeWindowDays,
      generated_at: now.toISOString(),
      total_log_entries: logs.length,
      top_actions: topActions,
      section_usage: sectionStats,
      activity_timeline: activityTimeline,
      recent_actions: recentActions,
    }
  }

  const enrichAnalyticsFromFirestoreInBackground = async (baseAnalytics: SystemAnalytics) => {
    try {
      const rebuiltAnalytics = await buildClientAnalyticsFromFirestoreLogs(baseAnalytics?.window_days || 7, baseAnalytics)
      if (rebuiltAnalytics.total_log_entries > 0) {
        setAnalytics(rebuiltAnalytics)
      }
    } catch {
      // Keep base analytics silently if enrichment fails.
    }
  }

  const countCardsInInventoryDoc = (inventory: Record<string, unknown>) => {
    let total = 0

    Object.values(inventory).forEach((entry) => {
      if (!entry || typeof entry !== 'object') return
      const cardEntry = entry as Record<string, unknown>

      const directCount = Number(cardEntry.count)
      if (Number.isFinite(directCount) && directCount > 0) {
        total += directCount
        return
      }

      const variants = cardEntry.variants
      if (variants && typeof variants === 'object') {
        total += Object.values(variants as Record<string, unknown>)
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
          .reduce((sum, value) => sum + value, 0)
      }
    })

    return total
  }

  const loadCardsByUserInBackground = async () => {
    setLoadingCardsByUser(true)
    try {
      const inventoriesSnap = await getDocs(collection(db, 'user_teachers'))
      const totals = inventoriesSnap.docs
        .map((item) => {
          const totalCards = countCardsInInventoryDoc(item.data() as Record<string, unknown>)
          return {
            userId: item.id,
            totalCards,
          }
        })
        .filter((entry) => entry.totalCards > 0)
        .sort((left, right) => right.totalCards - left.totalCards)
        .slice(0, 12)

      const profileEntries = await Promise.all(
        totals.map(async (entry) => {
          const profileSnap = await getDoc(doc(db, 'profiles', entry.userId))
          const profileData = profileSnap.exists() ? (profileSnap.data() as Record<string, unknown>) : null
          const fullName = typeof profileData?.full_name === 'string' ? profileData.full_name : null
          const email = typeof profileData?.email === 'string' ? profileData.email : null
          return {
            label: fullName || email || entry.userId,
            value: entry.totalCards,
          }
        })
      )

      setCardsByUser(profileEntries)
    } catch {
      setCardsByUser([])
    } finally {
      setLoadingCardsByUser(false)
    }
  }

  // 1. Feature Toggles laden
  useEffect(() => {
    if (!isAdmin) return
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        setFeatures(snap.data() as SystemFeatures)
      } else {
        // Initialisierung falls nicht vorhanden
        const initial: SystemFeatures = {
          is_trading_enabled: false,
          is_shop_enabled: true,
          is_news_enabled: true,
          is_calendar_enabled: true,
          is_todos_enabled: true,
          is_polls_enabled: true,
          is_sammelkarten_enabled: true,
          maintenance_mode: false
        }
        setDoc(doc(db, 'settings', 'features'), initial)
        setFeatures(initial)
      }
    })
    return () => unsub()
  }, [isAdmin])

  // 2. Statistiken laden
  const loadData = async () => {
    setLoadingData(true)
    try {
      if (!user) {
        throw new Error('Nicht angemeldet.')
      }

      const idToken = await user.getIdToken()
      const headers = {
        Authorization: `Bearer ${idToken}`,
      }

      const [statsResponse, analyticsResponse] = await Promise.all([
        postWithResilientFallback(
          ['/api/admin/system/global-stats', '/admin/api/system/global-stats'],
          headers
        ),
        postWithResilientFallback(
          ['/api/admin/system/analytics', '/admin/api/system/analytics'],
          headers
        ),
      ])

      if (!statsResponse || !analyticsResponse) {
        throw new Error('System-API nicht erreichbar.')
      }

      const [statsRawPayload, analyticsRawPayload] = await Promise.all([
        statsResponse.json(),
        analyticsResponse.json(),
      ])

      const statsPayload = parseProxyOrDirectPayload(statsRawPayload)
      const analyticsPayload = parseProxyOrDirectPayload(analyticsRawPayload)

      const httpStatsOk = statsResponse.ok && statsPayload?.ok
      const httpAnalyticsOk = analyticsResponse.ok && analyticsPayload?.ok

      if (!httpStatsOk) {
        throw new Error('System-API liefert keine verwertbaren Stats-Daten.')
      }

      setStats(statsPayload.data as GlobalStats)
      void loadCardsByUserInBackground()

      if (httpAnalyticsOk) {
        const analyticsData = analyticsPayload.data as SystemAnalytics
        let resolvedAnalytics = analyticsData

        if ((analyticsData?.total_log_entries || 0) === 0 || (analyticsData?.top_actions?.length || 0) === 0) {
          try {
            const fallbackCount = await countRecentLogsFromFirestore(analyticsData?.window_days || 7)
            if (fallbackCount > 0) {
              resolvedAnalytics = {
                ...analyticsData,
                total_log_entries: fallbackCount,
              }
            }
          } catch {
            // Keep API payload if Firestore count is not available.
          }

          setAnalytics(resolvedAnalytics)
          void enrichAnalyticsFromFirestoreInBackground(resolvedAnalytics)
        } else {
          setAnalytics(resolvedAnalytics)
        }
      } else {
        let fallbackAnalytics = buildFallbackAnalytics()

        try {
          const fallbackCount = await countRecentLogsFromFirestore(fallbackAnalytics.window_days)
          if (fallbackCount > 0) {
            fallbackAnalytics = {
              ...fallbackAnalytics,
              total_log_entries: fallbackCount,
            }
          }
        } catch {
          // Keep minimal fallback if Firestore count is not available.
        }

        setAnalytics(fallbackAnalytics)
        void enrichAnalyticsFromFirestoreInBackground(fallbackAnalytics)
        toast.warning('Analytics aktuell nicht verfuegbar. Basisdaten werden trotzdem angezeigt.')
      }

      return
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Systemdaten konnten nicht geladen werden.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin, user?.uid])

  const toggleFeature = async (key: keyof SystemFeatures) => {
    if (!features) return
    const newValue = !features[key]
    
    try {
      await updateDoc(doc(db, 'settings', 'features'), {
        [key]: newValue,
        updated_at: new Date().toISOString()
      })
      toast.success(`${key} wurde ${newValue ? 'aktiviert' : 'deaktiviert'}`)
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Features.')
    }
  }

  const averageSessionLabel = useMemo(() => {
    if (!analytics || analytics.average_session_minutes <= 0) return 'Keine Daten'
    return formatDurationMinutes(analytics.average_session_minutes)
  }, [analytics])

  const onlineUsersChartData = useMemo(() => {
    return (analytics?.current_online_users || [])
      .map((user) => ({
        action: user.full_name || user.email || user.id,
        count: Math.max(0, Math.round((user.online_minutes || 0) * 10) / 10),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12)
  }, [analytics])

  const sectionUsageChartData = useMemo(() => {
    return (analytics?.section_usage || [])
      .map((item) => ({
        action: item.section,
        count: item.count,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12)
  }, [analytics])

  const isMainAdmin = profile?.role === 'admin_main'
  const visibleLinks = adminLinks.filter((link) => !link.dangerOnly || isMainAdmin)

  if (authLoading) return <div className="p-8 text-center">Prüfe Berechtigung...</div>
  if (!isAdmin) {
    router.replace('/unauthorized')
    return null
  }

  return (
    <div className="container mx-auto px-3 py-6 sm:px-6 sm:py-8 space-y-8 pb-24">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Server className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            System Control Center
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Zentrale Steuerung, Live-Status und Nutzungsanalyse der gesamten ABI Planer Infrastruktur.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loadingData} className="w-full md:w-auto font-bold uppercase tracking-tight h-12">
          <RefreshCw className={cn("w-4 h-4 mr-2", loadingData && "animate-spin")} />
          Daten aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="Aktuell online"
          value={analytics?.current_online_users_count || 0}
          subValue={`Ø ${averageSessionLabel} Session-Länge`}
          icon={<Activity className="w-5 h-5 text-emerald-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Ø Session"
          value={averageSessionLabel}
          subValue="Aus Presence-Daten berechnet"
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Log-Einträge"
          value={analytics?.total_log_entries || 0}
          subValue={`Letzte ${analytics?.window_days || 7} Tage`}
          icon={<MessageSquare className="w-5 h-5 text-blue-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Aktive Trades"
          value={stats?.active_trades_count || 0}
          subValue={`${stats?.completed_trades_count || 0} abgeschlossen`}
          icon={<ArrowLeftRight className="w-5 h-5 text-purple-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Karten im Umlauf"
          value={stats?.total_cards_count || 0}
          subValue="Gesamte Sammlung aller User"
          icon={<Sparkles className="w-5 h-5 text-blue-500" />}
          loading={loadingData}
        />
        <StatCard
          title="System Status"
          value={features?.maintenance_mode ? 'Wartung' : 'Online'}
          subValue="Infrastruktur-Zustand"
          icon={features?.maintenance_mode ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          loading={!features}
          statusMode
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="uppercase tracking-tighter font-black">Admin-Bereiche</CardTitle>
          <CardDescription>Schnellzugriff auf alle Admin-Seiten.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/70 p-4 transition-colors hover:bg-accent/10 hover:border-border"
                >
                  <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold leading-none uppercase tracking-tight">{link.label}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{link.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Emergency Feature Toggles
            </CardTitle>
            <CardDescription>Hier können einzelne Module der App im Notfall sofort abgeschaltet werden.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ToggleRow
              label="Sammelkarten System"
              description="Globaler Zugriff auf Karten & Album"
              icon={<Sparkles className="w-4 h-4" />}
              enabled={features?.is_sammelkarten_enabled}
              onToggle={() => toggleFeature('is_sammelkarten_enabled')}
            />
            <ToggleRow
              label="Trading Feature"
              description="Karten-Tausch zwischen Freunden"
              icon={<ArrowLeftRight className="w-4 h-4" />}
              enabled={features?.is_trading_enabled}
              onToggle={() => toggleFeature('is_trading_enabled')}
            />
            <ToggleRow
              label="Shop & Stripe"
              description="Kauf von Boostern & Spenden"
              icon={<ShoppingBag className="w-4 h-4" />}
              enabled={features?.is_shop_enabled}
              onToggle={() => toggleFeature('is_shop_enabled')}
            />
            <ToggleRow
              label="News & Ankündigungen"
              description="News-Feed und Push-Benachrichtigungen"
              icon={<Megaphone className="w-4 h-4" />}
              enabled={features?.is_news_enabled}
              onToggle={() => toggleFeature('is_news_enabled')}
            />
            <ToggleRow
              label="Kalender & Events"
              description="Event-Planung und Termine"
              icon={<Calendar className="w-4 h-4" />}
              enabled={features?.is_calendar_enabled}
              onToggle={() => toggleFeature('is_calendar_enabled')}
            />
            <ToggleRow
              label="Todos & Aufgaben"
              description="Aufgabenverwaltung der Gruppen"
              icon={<CheckSquare className="w-4 h-4" />}
              enabled={features?.is_todos_enabled}
              onToggle={() => toggleFeature('is_todos_enabled')}
            />
            <div className="md:col-span-2 pt-4 border-t">
              <ToggleRow
                label="Wartungsmodus"
                description="Sperrt den Zugriff für alle Nicht-Admins"
                icon={<Lock className="w-4 h-4" />}
                enabled={features?.maintenance_mode}
                onToggle={() => toggleFeature('maintenance_mode')}
                critical
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-tight">Admin Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative z-10">
            <Button variant="outline" className="w-full justify-start text-xs font-bold uppercase border-white/10 hover:bg-white/5" onClick={() => router.push('/admin/logs')}>
              <Activity className="w-3 h-3 mr-2" /> System-Logs einsehen
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs font-bold uppercase border-white/10 hover:bg-white/5" onClick={() => router.push('/admin/feedback')}>
              <AlertTriangle className="w-3 h-3 mr-2" /> Bug Reports prüfen
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <LineChartIcon className="w-5 h-5 text-blue-500" />
              Aktive Nutzung der letzten 7 Tage
            </CardTitle>
            <CardDescription>Log-Aktivität pro Tag, kombiniert mit den jeweils aktiven Nutzern.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={analytics?.activity_timeline || []} valueKey="actions" labelKey="label" emptyLabel="Noch keine Aktivität erfasst." />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Top-Aktionen aus den Logs
            </CardTitle>
            <CardDescription>Welche Aktionen in den letzten 7 Tagen am häufigsten vorkamen.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={analytics?.top_actions || []} valueKey="count" labelKey="action" emptyLabel="Noch keine Logs vorhanden." />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <Users className="w-5 h-5 text-cyan-500" />
              Online-Session Dauer
            </CardTitle>
            <CardDescription>Top 12 aktuell online Nutzer nach Session-Minuten.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={onlineUsersChartData} valueKey="count" labelKey="action" emptyLabel="Aktuell ist niemand online." />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <FolderOpen className="w-5 h-5 text-violet-500" />
              Bereichsnutzung
            </CardTitle>
            <CardDescription>Welche Bereiche in den Logs den meisten Traffic erzeugen.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={sectionUsageChartData} valueKey="count" labelKey="action" emptyLabel="Noch keine Bereichsdaten vorhanden." />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Karten pro Nutzer
            </CardTitle>
            <CardDescription>Top 12 Nutzer mit den meisten Sammelkarten im Inventar.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={cardsByUser.map((entry) => ({ action: entry.label, count: entry.value }))}
              valueKey="count"
              labelKey="action"
              emptyLabel={loadingCardsByUser ? 'Lade Kartenstatistik...' : 'Keine Kartenstatistik verfuegbar.'}
            />
          </CardContent>
        </Card>

        <Card className="border-2 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-tight">Live Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span>Server Response</span>
                <span className="text-emerald-400 text-[10px]">Optimal</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '18%' }} className="h-full bg-emerald-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span>DB Read Load</span>
                <span className="text-cyan-400 text-[10px]">Normal</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, subValue, icon, loading, statusMode = false }: any) {
  return (
    <Card className="border-2 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className={cn("text-xl sm:text-2xl font-black uppercase tracking-tighter break-words", statusMode && value === 'Wartung' ? 'text-red-700' : '')}>
              {value}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground font-medium break-words">{subValue}</p>
        </div>
        <div className="p-2.5 sm:p-3 bg-muted/50 rounded-2xl border shrink-0">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

type ChartPoint = SystemAnalyticsTimelinePoint | SystemAnalyticsActionStat

function LineChart({ data, valueKey, labelKey, emptyLabel }: { data: ChartPoint[], valueKey: 'actions' | 'count', labelKey: 'label' | 'action', emptyLabel: string }) {
  if (!data.length) {
    return <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>
  }

  const points = data.map((entry) => {
    const record = entry as unknown as Record<string, unknown>
    return {
      label: String(record[labelKey] ?? ''),
      value: Number(record[valueKey]) || 0,
    }
  })

  const maxValue = Math.max(...points.map((entry) => entry.value), 1)
  const total = points.reduce((sum, point) => sum + point.value, 0)

  const chartData = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: 'Wert',
        data: points.map((point) => point.value),
        borderColor: '#0f172a',
        backgroundColor: 'rgba(15, 23, 42, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
      },
    ],
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 116, 139, 0.15)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="h-44">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Eintraege</p>
          <p className="font-black text-base">{points.length}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Summe</p>
          <p className="font-black text-base">{Math.round(total * 10) / 10}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Peak</p>
          <p className="font-black text-base">{Math.round(maxValue * 10) / 10}</p>
        </div>
      </div>

      <div className="space-y-2">
        {points.slice(0, 6).map((point) => (
          <div key={`${point.label}-${point.value}`} className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-tighter">
            <span className="truncate">{point.label}</span>
            <span className="text-muted-foreground">{Math.round(point.value * 10) / 10}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ data, valueKey, labelKey, emptyLabel }: { data: ChartPoint[], valueKey: 'actions' | 'count', labelKey: 'label' | 'action', emptyLabel: string }) {
  if (!data.length) {
    return <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>
  }

  const points = data.map((entry) => {
    const record = entry as unknown as Record<string, unknown>
    return {
      label: String(record[labelKey] ?? ''),
      value: Number(record[valueKey]) || 0,
    }
  })

  const maxValue = Math.max(...points.map((entry) => entry.value), 1)
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const chartHeight = Math.max(240, points.length * 28)

  const chartData = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: 'Wert',
        data: points.map((point) => point.value),
        borderRadius: 6,
        borderSkipped: false,
        minBarLength: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        hoverBackgroundColor: 'rgba(15, 23, 42, 1)',
      },
    ],
  }

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        displayColors: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 116, 139, 0.15)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          autoSkip: false,
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-3">
        <div style={{ height: `${chartHeight}px` }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Eintraege</p>
          <p className="font-black text-base">{points.length}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Summe</p>
          <p className="font-black text-base">{Math.round(total * 10) / 10}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Peak</p>
          <p className="font-black text-base">{Math.round(maxValue * 10) / 10}</p>
        </div>
      </div>

      <div className="space-y-2">
        {points.slice(0, 6).map((point) => (
          <div key={`${point.label}-${point.value}`} className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-tighter">
            <span className="truncate">{point.label}</span>
            <span className="text-muted-foreground">{Math.round(point.value * 10) / 10}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDurationMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m'

  const rounded = Math.round(minutes)
  const hours = Math.floor(rounded / 60)
  const remainder = rounded % 60

  if (hours <= 0) return `${remainder}m`
  if (remainder <= 0) return `${hours}h`
  return `${hours}h ${remainder}m`
}

function ToggleRow({ label, description, icon, enabled, onToggle, critical = false }: any) {
  const isEnabled = Boolean(enabled)

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
      isEnabled ? "bg-card border-muted" : "bg-muted/20 border-dashed border-red-200 opacity-80",
      critical && !isEnabled ? "bg-red-50 border-red-500 ring-4 ring-red-500/10" : ""
    )}>
      <div className="flex gap-3 items-start min-w-0">
        <div className={cn("p-2 rounded-lg mt-0.5", isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn("text-sm font-black uppercase tracking-tight truncate", critical && !isEnabled ? "text-red-900" : "")}>{label}</p>
          <p className={cn("text-[10px] line-clamp-1", critical && !isEnabled ? "text-red-800/80 font-medium" : "text-muted-foreground")}>{description}</p>
        </div>
      </div>
      <Switch 
        checked={isEnabled}
        onCheckedChange={onToggle}
        className={cn(critical && "data-[state=checked]:bg-red-600")}
      />
    </div>
  )
}
