'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { 
  doc, onSnapshot, updateDoc, collection, getCountFromServer, 
  query, where, Timestamp, getDocs, orderBy, limit, getDoc, 
  writeBatch, documentId, startAfter, deleteField 
} from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { usePopupManager } from '@/modules/popup/usePopupManager'
import type { 
  GlobalStats, SystemAnalytics, SystemFeatures, 
  FeatureStatus
} from '@/types/system'

interface AdminSystemContextType {
  features: SystemFeatures | null
  maintenance: any | null
  stats: GlobalStats | null
  analytics: SystemAnalytics | null
  aiSummary: string | null
  aiSummaryLoading: boolean
  aiSummaryError: string | null
  aiSummaryMeta: { generatedAt?: string; model?: string; mode?: 'briefing' | 'full' } | null
  aiProgress: number
  aiStep: string
  dailyBriefing: string | null
  dailyBriefingLoading: boolean
  dailyBriefingError: string | null
  dailyBriefingMeta: { generatedAt?: string; model?: string; isCached?: boolean } | null
  loadingData: boolean
  savingMaintenance: boolean
  resettingSessionStats: boolean
  cardsByUser: Array<{ label: string; value: number }>
  loadingCardsByUser: boolean
  isMaintenanceActive: boolean
  isAdmin: boolean
  analyticsWindowDays: number
  setAnalyticsWindowDays: (days: number) => void
  loadData: () => Promise<void>
  generateAISummary: (mode?: 'briefing' | 'full', forceRefresh?: boolean) => Promise<void>
  setAiSummary: (value: string | null) => void
  updateFeatureStatus: (key: keyof SystemFeatures, status: FeatureStatus) => Promise<void>
  handleSaveMaintenance: (data: any) => Promise<void>
  resetSessionStatistics: () => Promise<void>
}

const AdminSystemContext = createContext<AdminSystemContextType | undefined>(undefined)

export function AdminSystemProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth()
  const { confirm } = usePopupManager()
  const [features, setFeatures] = useState<SystemFeatures | null>(null)
  const [maintenance, setMaintenance] = useState<any>(null)
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null)
  const [analyticsWindowDays, setAnalyticsWindowDays] = useState(7)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null)
  const [aiSummaryMeta, setAiSummaryMeta] = useState<{ generatedAt?: string; model?: string; mode?: 'briefing' | 'full' } | null>(null)
  const [aiProgress, setAiProgress] = useState(0)
  const [aiStep, setAiStep] = useState('')
  
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null)
  const [dailyBriefingLoading, setDailyBriefingLoading] = useState(false)
  const [dailyBriefingError, setDailyBriefingError] = useState<string | null>(null)
  const [dailyBriefingMeta, setDailyBriefingMeta] = useState<{ generatedAt?: string; model?: string; isCached?: boolean } | null>(null)
  const [hasTriggeredAutoBriefing, setHasTriggeredAutoBriefing] = useState(false)

  const [loadingData, setLoadingData] = useState(true)
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [resettingSessionStats, setResettingSessionStats] = useState(false)
  const [cardsByUser, setCardsByUser] = useState<Array<{ label: string; value: number }>>([])
  const [loadingCardsByUser, setLoadingCardsByUser] = useState(false)
  const [now, setNow] = useState(new Date())

  const isAdmin = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const isMaintenanceActive = maintenance?.active || (maintenance?.start && new Date(maintenance.start) <= now && (!maintenance.end || new Date(maintenance.end) > now))

  // Helper functions
  const parseProxyOrDirectPayload = useCallback((payload: any) => {
    if (payload && typeof payload === 'object' && 'ok' in payload) {
      return {
        ok: Boolean(payload.ok),
        data: payload.data,
      }
    }
    return {
      ok: true,
      data: payload,
    }
  }, [])

  const postWithLocalFallback = useCallback(async (
    paths: string[],
    headers: Record<string, string>,
    body?: Record<string, unknown>
  ) => {
    let lastResponse: Response | null = null
    for (const path of paths) {
      const response = await fetch(path, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      lastResponse = response
      if (response.status !== 404) {
        return response
      }
    }
    return lastResponse
  }, [])

  const postWithResilientFallback = useCallback(async (
    localPaths: string[],
    headers: Record<string, string>,
    body?: Record<string, unknown>
  ) => {
    return await postWithLocalFallback(localPaths, headers, body)
  }, [postWithLocalFallback])

  const buildSummaryPayload = useCallback(() => {
    const safeStats = {
      online_users_count: Number(stats?.online_users_count || 0),
      total_users: Number(stats?.total_users || 0),
      total_cards_count: Number(stats?.total_cards_count || 0),
      active_trades_count: Number(stats?.active_trades_count || 0),
      completed_trades_count: Number(stats?.completed_trades_count || 0),
    }

    const safeAnalytics = {
      window_days: Number(analytics?.window_days || 7),
      generated_at: analytics?.generated_at || new Date().toISOString(),
      total_log_entries: Number(analytics?.total_log_entries || 0),
      current_online_users_count: Number(analytics?.current_online_users_count || 0),
      average_session_minutes: Number(analytics?.average_session_minutes || 0),
      top_actions: (analytics?.top_actions || []).slice(0, 12).map((item) => ({
        action: String(item.action || ''),
        count: Number(item.count || 0),
      })),
      section_usage: (analytics?.section_usage || []).slice(0, 12).map((item) => ({
        section: String(item.section || ''),
        count: Number(item.count || 0),
      })),
      activity_timeline: (analytics?.activity_timeline || []).slice(0, 14).map((item) => ({
        date: String(item.date || ''),
        label: String(item.label || ''),
        actions: Number(item.actions || 0),
        active_users: Number(item.active_users || 0),
      })),
      registration_timeline: (analytics?.registration_timeline || []).slice(0, 14).map((item) => ({
        date: String(item.date || ''),
        label: String(item.label || ''),
        count: Number(item.count || 0),
        cumulative: Number(item.cumulative || 0),
      })),
      recent_actions: (analytics?.recent_actions || []).slice(0, 40).map((item) => ({
        timestamp: String(item.timestamp || ''),
        action: String(item.action || ''),
        user_id: String(item.user_id || ''),
        user_name: String(item.user_name || ''),
        user_role: String(item.user_role || 'user'),
        section: String(item.section || ''),
        details: String(item.details || '').slice(0, 300),
      })),
    }

    return {
      stats: safeStats,
      analytics: safeAnalytics,
      cardsByUser: cardsByUser.slice(0, 12).map((entry) => ({
        value: Number(entry.value || 0),
        label: String(entry.label || '')
      })),
    }
  }, [stats, analytics, cardsByUser])

  const countRecentLogsFromFirestore = useCallback(async (windowDays: number) => {
    const safeWindowDays = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 7
    const since = new Date(Date.now() - safeWindowDays * 24 * 60 * 60 * 1000)
    const logsQuery = query(
      collection(db, 'logs'),
      where('timestamp', '>=', Timestamp.fromDate(since))
    )
    const countSnapshot = await getCountFromServer(logsQuery)
    return countSnapshot.data().count
  }, [])

  const inferSectionFromAction = useCallback((action: string) => {
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
  }, [])

  const buildClientAnalyticsFromFirestoreLogs = useCallback(async (windowDays: number, currentAnalytics: SystemAnalytics) => {
    const safeWindowDays = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 7
    const now = new Date()
    const since = new Date(now.getTime() - safeWindowDays * 24 * 60 * 60 * 1000)

    const logsQuery = query(
      collection(db, 'logs'),
      where('timestamp', '>=', Timestamp.fromDate(since)),
      orderBy('timestamp', 'desc'),
      limit(2500)
    )

    const [logsSnap, profilesSnap] = await Promise.all([
      getDocs(logsQuery),
      getDocs(collection(db, 'profiles'))
    ])

    const profiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
    const registrationTimelineMap = new Map<string, number>()
    
    profiles.forEach(p => {
      const createdAtValue = p.created_at || p.timestamp
      let createdAt: Date | null = null

      if (createdAtValue instanceof Timestamp) {
        createdAt = createdAtValue.toDate()
      } else if (createdAtValue instanceof Date) {
        createdAt = createdAtValue
      } else if (typeof createdAtValue === 'string') {
        const d = new Date(createdAtValue)
        if (!isNaN(d.getTime())) createdAt = d
      } else if (createdAtValue && typeof createdAtValue === 'object' && 'seconds' in createdAtValue) {
        createdAt = new Date((createdAtValue as any).seconds * 1000)
      }
      
      if (createdAt && !isNaN(createdAt.getTime())) {
        const dayKey = createdAt.toISOString().slice(0, 10)
        registrationTimelineMap.set(dayKey, (registrationTimelineMap.get(dayKey) || 0) + 1)
      }
    })

    const allRegistrationDays = Array.from(registrationTimelineMap.keys()).sort()
    let cumulative = 0
    const registrationTimeline = allRegistrationDays.map(date => {
      const count = registrationTimelineMap.get(date) || 0
      cumulative += count
      const d = new Date(date)
      return {
        date,
        label: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        count,
        cumulative
      }
    }).filter(point => {
      const d = new Date(point.date)
      return d >= since
    })

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
    const hourUsage = new Map<number, { hour: number; actions: number; users: Set<string> }>()
    const userActionCounts = new Map<string, { id: string; name: string | null; count: number; role?: string }>()

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

      const hour = log.timestamp.getHours()
      const existingHour = hourUsage.get(hour) || { hour, actions: 0, users: new Set<string>() }
      existingHour.actions += 1
      if (log.user_id) existingHour.users.add(log.user_id)
      hourUsage.set(hour, existingHour)

      if (log.user_id) {
        const existingUser = userActionCounts.get(log.user_id) || { id: log.user_id, name: log.user_name, count: 0 }
        existingUser.count += 1
        if (log.user_name && !existingUser.name) existingUser.name = log.user_name
        
        // Find role from profiles
        const profile = profiles.find(p => p.id === log.user_id)
        if (profile?.role) existingUser.role = profile.role
        
        userActionCounts.set(log.user_id, existingUser)
      }
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

    const activityByHour = Array.from({ length: 24 }, (_, i) => {
      const data = hourUsage.get(i) || { hour: i, actions: 0, users: new Set<string>() }
      return {
        hour: i,
        actions: data.actions,
        users: data.users.size,
      }
    })

    const topActiveUsers = Array.from(userActionCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(u => ({
        user_id: u.id,
        name: u.name,
        action_count: u.count
      }))

    const recentActions = logs
      .slice(0, 40)
      .map((log) => {
        const role = userActionCounts.get(log.user_id)?.role || 'user'
        return {
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          action: log.action,
          user_id: log.user_id,
          user_name: log.user_name,
          user_role: role,
          section: inferSectionFromAction(log.action),
          details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {}),
        }
      })

    return {
      ...currentAnalytics,
      window_days: safeWindowDays,
      generated_at: now.toISOString(),
      total_log_entries: logs.length,
      top_actions: topActions,
      section_usage: sectionStats,
      activity_timeline: activityTimeline,
      registration_timeline: registrationTimeline,
      recent_actions: recentActions,
      activity_by_hour: activityByHour,
      top_active_users: topActiveUsers,
    }
  }, [inferSectionFromAction])

  const enrichAnalyticsFromFirestoreInBackground = useCallback(async (baseAnalytics: SystemAnalytics) => {
    try {
      const rebuiltAnalytics = await buildClientAnalyticsFromFirestoreLogs(baseAnalytics?.window_days || 7, baseAnalytics)
      if (rebuiltAnalytics.total_log_entries > 0 || (rebuiltAnalytics.registration_timeline && rebuiltAnalytics.registration_timeline.length > 0)) {
        setAnalytics(rebuiltAnalytics)
      }
    } catch {
      // Keep base analytics silently if enrichment fails.
    }
  }, [buildClientAnalyticsFromFirestoreLogs])

  const countCardsInInventoryDoc = useCallback((inventory: Record<string, unknown>) => {
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
  }, [])

  const enrichStatsFromFirestoreInBackground = useCallback(async (currentStats: GlobalStats | null) => {
    setLoadingCardsByUser(true)
    try {
      const [inventoriesSnap, sammelkartenSettingsSnap] = await Promise.all([
        getDocs(collection(db, 'user_teachers')),
        getDoc(doc(db, 'settings', 'sammelkarten'))
      ])

      const settings = sammelkartenSettingsSnap.data() || {}
      const lootTeachers = settings.loot_teachers || []
      const teacherRarityMap = new Map<string, string>(
        lootTeachers.map((t: any) => [t.id, t.rarity])
      )

      let totalCardsCount = 0
      const rarityDistribution: Record<string, number> = {
        common: 0, rare: 0, epic: 0, mythic: 0, legendary: 0, iconic: 0
      }

      const userTotals: Array<{ userId: string; totalCards: number }> = []

      inventoriesSnap.docs.forEach((doc) => {
        const inv = doc.data()
        let userTotal = 0
        Object.entries(inv).forEach(([teacherId, card]: [string, any]) => {
          if (!card || typeof card !== 'object' || teacherId === 'updated_at') return
          
          const count = Number(card.count || 0)
          if (count <= 0) return

          userTotal += count
          totalCardsCount += count

          const rarity = teacherRarityMap.get(teacherId) || card.rarity || 'unknown'
          if (rarity !== 'unknown') {
            const normalizedRarity = rarity.toLowerCase()
            rarityDistribution[normalizedRarity] = (rarityDistribution[normalizedRarity] || 0) + count
          }
        })

        if (userTotal > 0) {
          userTotals.push({ userId: doc.id, totalCards: userTotal })
        }
      })

      // Update Global Stats
      setStats(prev => {
        const base = prev || {
          online_users_count: 0,
          total_users: 0,
          total_cards_count: 0,
          active_trades_count: 0,
          completed_trades_count: 0,
        }
        return {
          ...base,
          total_cards_count: totalCardsCount,
          rarity_distribution: rarityDistribution
        }
      })

      // Update Top Collectors
      const topTotals = userTotals
        .sort((a, b) => b.totalCards - a.totalCards)
        .slice(0, 12)

      const profileEntries = await Promise.all(
        topTotals.map(async (entry) => {
          const profileSnap = await getDoc(doc(db, 'profiles', entry.userId))
          const profileData = profileSnap.exists() ? (profileSnap.data() as Record<string, unknown>) : null
          const fullName = typeof profileData?.full_name === 'string' ? profileData.full_name : null
          const email = typeof profileData?.email === 'string' ? profileData.email : null
          return {
            label: fullName || email || entry.userId.slice(0, 8),
            value: entry.totalCards,
          }
        })
      )
      setCardsByUser(profileEntries)
    } catch (error) {
      console.error('Error enriching stats from Firestore:', error)
    } finally {
      setLoadingCardsByUser(false)
    }
  }, [])

  const buildFallbackAnalytics = useCallback((): SystemAnalytics => ({
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
  }), [])

  const generateAISummary = async (mode: 'briefing' | 'full' = 'full', forceRefresh: boolean = false) => {
    if (!user) {
      toast.error('Nicht angemeldet.')
      return
    }
    if (!stats || !analytics) {
      toast.error('Bitte zuerst Systemdaten laden.')
      return
    }

    if (mode === 'briefing') {
      setDailyBriefingLoading(true)
      setDailyBriefingError(null)
    } else {
      setAiSummaryLoading(true)
      setAiSummaryError(null)
      setAiProgress(5)
      setAiStep('Initialisiere Analyse...')
    }

    // Progress simulation timer
    let progressTimer: any
    if (mode === 'full') {
      const steps = [
        { p: 15, s: 'Scanne Log-Einträge...' },
        { p: 30, s: 'Analysiere Nutzerwachstum...' },
        { p: 45, s: 'Berechne Engagement-Raten...' },
        { p: 60, s: 'Identifiziere Modul-Trends...' },
        { p: 80, s: 'Formuliere Empfehlungen...' },
        { p: 95, s: 'Finalisiere Bericht...' }
      ]
      let currentStep = 0
      progressTimer = setInterval(() => {
        if (currentStep < steps.length) {
          setAiProgress(steps[currentStep].p)
          setAiStep(steps[currentStep].s)
          currentStep++
        } else {
          clearInterval(progressTimer)
        }
      }, 1500)
    }

    try {
      const idToken = await user.getIdToken()
      const response = await postWithResilientFallback(
        ['/api/admin/system/ai-summary', '/api/admin/system/ai-summary'],
        {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        {
          ...buildSummaryPayload(),
          mode,
          forceRefresh
        }
      )
      if (!response) {
        throw new Error('KI-Zusammenfassung API nicht erreichbar.')
      }

      if (progressTimer) clearInterval(progressTimer)
      if (mode === 'full') setAiProgress(100)

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(
          typeof payload?.error === 'string' && payload.error
            ? payload.error
            : 'KI-Zusammenfassung konnte nicht erstellt werden.'
        )
      }
      const summaryText = typeof payload.summary === 'string' ? payload.summary.trim() : ''
      if (!summaryText) {
        throw new Error('Leere KI-Antwort erhalten.')
      }

      if (mode === 'briefing') {
        setDailyBriefing(summaryText)
        setDailyBriefingMeta({
          generatedAt: payload?.meta?.generatedAt,
          model: payload?.meta?.model,
          isCached: payload?.meta?.isCached
        })
      } else {
        setAiSummary(summaryText)
        setAiSummaryMeta({
          generatedAt: typeof payload?.meta?.generatedAt === 'string' ? payload.meta.generatedAt : undefined,
          model: typeof payload?.meta?.model === 'string' ? payload.meta.model : undefined,
          mode: payload?.meta?.mode || 'full'
        })
      }
      
      if (mode === 'full') toast.success('Strategische Analyse erstellt.')
    } catch (error) {
      if (progressTimer) clearInterval(progressTimer)
      const message = error instanceof Error ? error.message : 'KI-Zusammenfassung konnte nicht erstellt werden.'
      if (mode === 'briefing') {
        setDailyBriefingError(message)
      } else {
        setAiSummaryError(message)
        toast.error(message)
      }
    } finally {
      if (mode === 'briefing') {
        setDailyBriefingLoading(false)
      } else {
        setAiSummaryLoading(false)
      }
    }
  }

  const loadData = useCallback(async (windowDaysOverride?: number) => {
    setLoadingData(true)
    const windowDays = windowDaysOverride || analyticsWindowDays
    try {
      if (!user) {
        throw new Error('Nicht angemeldet.')
      }

      const idToken = await user.getIdToken()
      const headers = {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      }

      const [statsResponse, analyticsResponse] = await Promise.all([
        postWithResilientFallback(
          ['/api/admin/system/global-stats', '/api/admin/system/global-stats'],
          headers
        ),
        postWithResilientFallback(
          ['/api/admin/system/analytics', '/api/admin/system/analytics'],
          headers,
          { window_days: windowDays }
        ),
      ])

      if (!statsResponse || !analyticsResponse) {
        throw new Error('System-API nicht erreichbar.')
      }

      const [statsRawPayload, analyticsRawPayload] = await Promise.all([
        statsResponse.json(),
        analyticsResponse ? analyticsResponse.json() : null,
      ])

      const statsPayload = parseProxyOrDirectPayload(statsRawPayload)
      const analyticsPayload = parseProxyOrDirectPayload(analyticsRawPayload)

      const httpStatsOk = statsResponse.ok && statsPayload?.ok
      const httpAnalyticsOk = analyticsResponse.ok && analyticsPayload?.ok

      if (!httpStatsOk) {
        throw new Error('System-API liefert keine verwertbaren Stats-Daten.')
      }

      const statsData = statsPayload.data as GlobalStats
      setStats(statsData)
      void enrichStatsFromFirestoreInBackground(statsData)

      if (httpAnalyticsOk) {
        const analyticsData = analyticsPayload.data as SystemAnalytics
        let resolvedAnalytics = { ...analyticsData, window_days: windowDays }

        if (
          (analyticsData?.total_log_entries || 0) === 0 || 
          (analyticsData?.top_actions?.length || 0) === 0 || 
          analyticsData.window_days !== windowDays ||
          !analyticsData.registration_timeline ||
          analyticsData.registration_timeline.length === 0
        ) {
          try {
            const fallbackCount = await countRecentLogsFromFirestore(windowDays)
            if (fallbackCount > 0) {
              resolvedAnalytics = {
                ...resolvedAnalytics,
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
        let fallbackAnalytics = { ...buildFallbackAnalytics(), window_days: windowDays }
        try {
          const fallbackCount = await countRecentLogsFromFirestore(windowDays)
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
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Systemdaten konnten nicht geladen werden.')
    } finally {
      setLoadingData(false)
    }
  }, [user, analyticsWindowDays, postWithResilientFallback, parseProxyOrDirectPayload, enrichStatsFromFirestoreInBackground, countRecentLogsFromFirestore, enrichAnalyticsFromFirestoreInBackground, buildFallbackAnalytics])

  useEffect(() => {
    if (isAdmin && !hasTriggeredAutoBriefing && stats && analytics) {
      setHasTriggeredAutoBriefing(true)
      generateAISummary('briefing')
    }
  }, [isAdmin, hasTriggeredAutoBriefing, stats, analytics])

  const updateFeatureStatus = async (key: keyof SystemFeatures, status: FeatureStatus) => {
    if (!features) return
    try {
      const isEnabled = status === 'enabled'
      const legacyKey = key.replace('_status', '_enabled')
      const featureUpdate: any = {
        [key]: status,
        [legacyKey]: isEnabled,
        updated_at: new Date().toISOString()
      }
      await updateDoc(doc(db, 'settings', 'features'), featureUpdate)
      toast.success(`${key} wurde auf '${status}' gesetzt`)
    } catch (error) {
      console.error('Error updating feature status:', error)
      toast.error('Fehler beim Aktualisieren des Status.')
    }
  }

  const handleSaveMaintenance = async (data: any) => {
    if (!isAdmin) return
    setSavingMaintenance(true)
    try {
      const isActuallyActive = data.active || (data.start && new Date(data.start) <= new Date() && (!data.end || new Date(data.end) > new Date()))
      await updateDoc(doc(db, 'settings', 'global'), {
        maintenance: data
      })
      await updateDoc(doc(db, 'settings', 'features'), {
        maintenance_mode: isActuallyActive,
        updated_at: new Date().toISOString()
      })
      toast.success('Wartungseinstellungen gespeichert.')
    } catch (error) {
      console.error('Error saving maintenance:', error)
      toast.error('Fehler beim Speichern.')
    } finally {
      setSavingMaintenance(false)
    }
  }

  const resetSessionStatisticsClientSide = useCallback(async () => {
    const batchSize = 250
    let processedProfiles = 0
    let resetProfiles = 0
    let lastDocSnapshot: any = null

    while (true) {
      const profilesRef = collection(db, 'profiles')
      const profilesQuery = lastDocSnapshot
        ? query(profilesRef, orderBy(documentId()), startAfter(lastDocSnapshot), limit(batchSize))
        : query(profilesRef, orderBy(documentId()), limit(batchSize))

      const snap = await getDocs(profilesQuery)
      if (snap.empty) break

      const batch = writeBatch(db)
      snap.docs.forEach((profileDoc) => {
        processedProfiles += 1
        batch.update(profileDoc.ref, {
          isOnline: false,
          onlineSince: null,
          lastOnline: null,
          lastSessionDurationSeconds: deleteField(),
        })
        resetProfiles += 1
      })

      await batch.commit()
      lastDocSnapshot = snap.docs[snap.docs.length - 1]
      if (snap.size < batchSize) break
    }

    return {
      processed_profiles: processedProfiles,
      reset_profiles: resetProfiles,
    }
  }, [])

  const resetSessionStatistics = async () => {
    if (!user) {
      toast.error('Nicht angemeldet.')
      return
    }
    const confirmed = await confirm({
      title: 'Session-Statistiken zurücksetzen?',
      content: 'Session-Statistiken fuer ALLE Nutzer zuruecksetzen? Das entfernt gespeicherte Session-Dauern und setzt den Online-Status global zurueck.',
      priority: 'high',
      confirmLabel: 'Global zurücksetzen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return
    setResettingSessionStats(true)
    try {
      const idToken = await user.getIdToken()
      const response = await postWithResilientFallback(
        ['/api/admin/system/reset-session-stats', '/api/admin/system/reset-session-stats'],
        { Authorization: `Bearer ${idToken}` }
      )
      if (!response) {
        throw new Error('Session-Reset API nicht erreichbar.')
      }
      const rawPayload = await response.json()
      const parsedPayload = parseProxyOrDirectPayload(rawPayload)

      if (!response.ok || !parsedPayload?.ok) {
        const detailedError =
          (typeof rawPayload?.localError === 'string' && rawPayload.localError) ||
          (typeof rawPayload?.error === 'string' && rawPayload.error) ||
          (typeof rawPayload?.upstreamBody === 'string' && rawPayload.upstreamBody) ||
          (typeof rawPayload?.body === 'string' && rawPayload.body) ||
          'Session-Reset konnte nicht durchgefuehrt werden.'

        const shouldUseClientFallback = /default credentials|unable to resolve firestore database|proxy request failed and local fallback failed/i.test(detailedError)

        if (shouldUseClientFallback) {
          const fallbackResult = await resetSessionStatisticsClientSide()
          toast.success(`Session-Statistiken lokal zurueckgesetzt (${fallbackResult.reset_profiles} Profile).`)
          await loadData()
          return
        }
        throw new Error(detailedError)
      }
      const resetCount = Number(parsedPayload.data?.reset_profiles || 0)
      toast.success(`Session-Statistiken zurueckgesetzt (${resetCount} Profile).`)
      await loadData()
    } catch (error) {
      console.error('Error resetting session statistics:', error)
      toast.error(error instanceof Error ? error.message : 'Session-Statistiken konnten nicht zurueckgesetzt werden.')
    } finally {
      setResettingSessionStats(false)
    }
  }

  // Real-time listeners
  useEffect(() => {
    if (!isAdmin) return
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        setFeatures(snap.data() as SystemFeatures)
      }
    })
    const unsubM = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setMaintenance(snap.data().maintenance || {
          active: false,
          start: null,
          end: null,
          message: ''
        })
      }
    })
    return () => {
      unsub()
      unsubM()
    }
  }, [isAdmin])

  // Initial data load
  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin, user?.uid, analyticsWindowDays, loadData])

  const value = {
    features,
    maintenance,
    stats,
    analytics,
    aiSummary,
    aiSummaryLoading,
    aiSummaryError,
    aiSummaryMeta,
    aiProgress,
    aiStep,
    dailyBriefing,
    dailyBriefingLoading,
    dailyBriefingError,
    dailyBriefingMeta,
    loadingData,
    savingMaintenance,
    resettingSessionStats,
    cardsByUser,
    loadingCardsByUser,
    isMaintenanceActive,
    isAdmin,
    analyticsWindowDays,
    setAnalyticsWindowDays,
    loadData,
    generateAISummary,
    setAiSummary,
    updateFeatureStatus,
    handleSaveMaintenance,
    resetSessionStatistics
  }

  return (
    <AdminSystemContext.Provider value={value}>
      {children}
    </AdminSystemContext.Provider>
  )
}

export function useAdminSystem() {
  const context = useContext(AdminSystemContext)
  if (context === undefined) {
    throw new Error('useAdminSystem must be used within an AdminSystemProvider')
  }
  return context
}
