import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { SystemAnalytics, SystemAnalyticsActionStat, SystemAnalyticsOnlineUser, SystemAnalyticsRecentAction, SystemAnalyticsSectionStat, SystemAnalyticsTimelinePoint } from '@/types/system'

type LocalAnalyticsError = Error & { status?: number }

const ANALYTICS_WINDOW_DAYS = 7
const ONLINE_STALE_MINUTES = 5
const MAX_SESSION_MINUTES = 12 * 60

function toLocalError(message: string, status: number): LocalAnalyticsError {
  const error = new Error(message) as LocalAnalyticsError
  error.status = status
  return error
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

function getTimestampDate(value: unknown): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number }
    if (typeof candidate.toDate === 'function') {
      const date = candidate.toDate()
      return isNaN(date.getTime()) ? null : date
    }
    if (typeof candidate.seconds === 'number') {
      const date = new Date(candidate.seconds * 1000)
      return isNaN(date.getTime()) ? null : date
    }
  }

  return null
}

function toIsoDay(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function formatDetails(details: unknown): string {
  if (!details) return '-'
  if (typeof details === 'string') return details

  try {
    return JSON.stringify(details)
  } catch {
    return 'Details nicht lesbar'
  }
}

function getMostRecentVisitedSection(lastVisited: Record<string, string> | null | undefined): string | null {
  if (!lastVisited) return null

  const entries = Object.entries(lastVisited)
    .map(([section, timestamp]) => ({ section, timestamp: new Date(timestamp) }))
    .filter(({ timestamp }) => !Number.isNaN(timestamp.getTime()))
    .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())

  const latest = entries[0]
  if (!latest) return null

  const normalized = latest.section.toLowerCase()
  if (normalized.includes('dashboard')) return 'Dashboard'
  if (normalized.includes('news')) return 'News'
  if (normalized.includes('todo')) return 'Todos'
  if (normalized.includes('kalender') || normalized.includes('event')) return 'Kalender'
  if (normalized.includes('umfragen') || normalized.includes('poll')) return 'Umfragen'
  if (normalized.includes('gruppen') || normalized.includes('group')) return 'Gruppen'
  if (normalized.includes('finanz')) return 'Finanzen'
  if (normalized.includes('profil')) return 'Profil'
  if (normalized.includes('sammelkarten') || normalized.includes('cards')) return 'Sammelkarten'
  return latest.section
}

function isProfileEffectivelyOnline(profile: Record<string, unknown>, now: Date): boolean {
  if (!profile?.isOnline) return false

  const lastOnline = getTimestampDate(profile.lastOnline)
  if (!lastOnline) return true

  return (now.getTime() - lastOnline.getTime()) <= ONLINE_STALE_MINUTES * 60 * 1000
}

function getSessionDurationMinutes(profile: Record<string, unknown>, now: Date): number {
  const sanitizeDuration = (minutes: number): number => {
    if (!Number.isFinite(minutes) || minutes <= 0) return 0
    if (minutes > MAX_SESSION_MINUTES) return 0
    return minutes
  }

  if (isProfileEffectivelyOnline(profile, now)) {
    const onlineSince = getTimestampDate(profile.onlineSince)
    const fallbackLastOnline = getTimestampDate(profile.lastOnline)
    const start = onlineSince || fallbackLastOnline
    const onlineMinutes = start ? Math.max(0, (now.getTime() - start.getTime()) / 60000) : 0
    return sanitizeDuration(onlineMinutes)
  }

  const storedDuration = Number(profile?.lastSessionDurationSeconds)
  if (Number.isFinite(storedDuration) && storedDuration > 0) {
    return sanitizeDuration(storedDuration / 60)
  }

  return 0
}

function computeAverageSessionMinutes(profiles: Array<Record<string, unknown>>, now: Date): number {
  const liveDurations = profiles
    .filter((profile) => isProfileEffectivelyOnline(profile, now))
    .map((profile) => getSessionDurationMinutes(profile, now))
    .filter((value) => value > 0)

  if (liveDurations.length > 0) {
    const totalLive = liveDurations.reduce((sum, value) => sum + value, 0)
    return totalLive / liveDurations.length
  }

  const storedDurations = profiles
    .map((profile) => getSessionDurationMinutes(profile, now))
    .filter((value) => value > 0)

  if (storedDurations.length === 0) return 0

  const totalStored = storedDurations.reduce((sum, value) => sum + value, 0)
  return totalStored / storedDurations.length
}

function getSectionFromAction(action: string, details: Record<string, unknown> | null | undefined): string {
  const actionMap: Record<string, string> = {
    ACCOUNT_CREATED: 'Registrierung',
    PROFILE_UPDATED: 'Profil',
    PROFILE_DELETED: 'Profil',
    FEEDBACK_CREATED: 'Feedback',
    FEEDBACK_SUBMIT: 'Feedback',
    FEEDBACK_UPDATED: 'Feedback',
    FEEDBACK_DELETED: 'Feedback',
    VOTE_CAST: 'Umfragen',
    POLL_CREATED: 'Umfragen',
    POLL_EDITED: 'Umfragen',
    POLL_DELETED: 'Umfragen',
    FINANCE_ADDED: 'Finanzen',
    FINANCE_EDITED: 'Finanzen',
    FINANCE_DELETED: 'Finanzen',
    TODO_CREATED: 'Todos',
    SUBTODO_CREATED: 'Todos',
    TODO_EDITED: 'Todos',
    TODO_COMPLETED: 'Todos',
    TODO_DELETED: 'Todos',
    EVENT_CREATED: 'Kalender',
    EVENT_EDITED: 'Kalender',
    EVENT_DELETED: 'Kalender',
    NEWS_CREATED: 'News',
    NEWS_EDITED: 'News',
    NEWS_DELETED: 'News',
    FAQ_CREATED: 'Support',
    FAQ_EDITED: 'Support',
    FAQ_DELETED: 'Support',
    ABI_BOT_HELP_REQUESTED: 'Support',
    ABI_BOT_HELP_RESPONDED: 'Support',
    NEWS_REACTION: 'News',
    NEWS_COMMENT: 'News',
    GROUP_MEMBER_ADDED: 'Gruppen',
    GROUP_MEMBER_REMOVED: 'Gruppen',
    GROUP_LEADER_ASSIGNED: 'Gruppen',
    GROUP_MESSAGE_CREATED: 'Gruppen',
    GROUP_MESSAGE_DELETED: 'Gruppen',
    GROUP_MESSAGE_PINNED: 'Gruppen',
    LOOT_TEACHER: 'Sammelkarten',
    LOOT_BOOSTER: 'Sammelkarten',
    LOOT_MASS_BOOSTER: 'Sammelkarten',
    TEACHER_VOTE: 'Sammelkarten',
    SETTINGS_UPDATED: 'Einstellungen',
    GLOBAL_SETTINGS_UPDATED: 'Einstellungen',
    DANGER_ACTION_QUEUED: 'Danger',
    DANGER_ACTION_CANCELLED: 'Danger',
    DANGER_ACTION_EXECUTED: 'Danger',
    DANGER_ACTION_FAILED: 'Danger',
  }

  if (actionMap[action]) return actionMap[action]

  const inferredSection = details?.section || details?.page || details?.module || details?.source || details?.route
  if (typeof inferredSection === 'string' && inferredSection.trim()) {
    const normalized = inferredSection.trim().toLowerCase()
    if (normalized.includes('dashboard')) return 'Dashboard'
    if (normalized.includes('news')) return 'News'
    if (normalized.includes('todo')) return 'Todos'
    if (normalized.includes('kalender') || normalized.includes('event')) return 'Kalender'
    if (normalized.includes('poll') || normalized.includes('umfrage')) return 'Umfragen'
    if (normalized.includes('gruppe') || normalized.includes('group')) return 'Gruppen'
    if (normalized.includes('finance') || normalized.includes('finanz')) return 'Finanzen'
    if (normalized.includes('profil') || normalized.includes('profile')) return 'Profil'
    if (normalized.includes('card') || normalized.includes('karte')) return 'Sammelkarten'
    if (normalized.includes('settings') || normalized.includes('einstellung')) return 'Einstellungen'
  }

  return 'Sonstiges'
}

async function verifyAdminFromHeader(authHeader: string): Promise<void> {
  const app = getAdminApp()
  const auth = getAuth(app)
  const db = getFirestore('abi-data')

  if (!authHeader.startsWith('Bearer ')) {
    throw toLocalError('Missing bearer token', 401)
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    throw toLocalError('Missing bearer token', 401)
  }

  let decoded: { uid: string }
  try {
    decoded = await auth.verifyIdToken(idToken)
  } catch {
    throw toLocalError('Invalid authentication token', 401)
  }

  const profileSnap = await db.collection('profiles').doc(decoded.uid).get()
  const role = profileSnap.data()?.role
  if (role !== 'admin' && role !== 'admin_main' && role !== 'admin_co') {
    throw toLocalError('Admin permission required', 403)
  }
}

export async function buildAnalyticsFromPastLogs(authHeader: string, windowDays: number = 7): Promise<SystemAnalytics> {
  await verifyAdminFromHeader(authHeader)

  const db = getFirestore('abi-data')
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

  const [profilesSnap, logsSnap] = await Promise.all([
    db.collection('profiles').get(),
    db.collection('logs').orderBy('timestamp', 'desc').limit(2500).get(),
  ])

  const profiles = profilesSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<Record<string, unknown> & { id: string }>

  const logs = logsSnap.docs
    .map((item): Record<string, unknown> & { id: string } => ({
      id: item.id,
      ...(item.data() as Record<string, unknown>),
    }))
    .filter((entry) => {
      const timestamp = getTimestampDate(entry.timestamp)
      return !!timestamp && timestamp >= windowStart
    }) as Array<Record<string, unknown> & { id: string; action: string; user_id: string }>

  const currentOnlineUsers = profiles
    .filter((profile) => isProfileEffectivelyOnline(profile, now))
    .map((profile) => {
      const onlineSince = getTimestampDate(profile.onlineSince)
      const lastOnline = getTimestampDate(profile.lastOnline)
      const currentSection = getMostRecentVisitedSection((profile.last_visited || null) as Record<string, string> | null)
      const onlineMinutes = getSessionDurationMinutes(profile, now)

      return {
        id: profile.id,
        full_name: (profile.full_name as string) || null,
        email: (profile.email as string) || null,
        current_section: currentSection,
        online_since: onlineSince ? onlineSince.toISOString() : null,
        last_online: lastOnline ? lastOnline.toISOString() : null,
        online_minutes: Math.round(onlineMinutes * 10) / 10,
        last_action: null,
        last_action_at: null,
      } as SystemAnalyticsOnlineUser
    })
    .sort((left, right) => right.online_minutes - left.online_minutes)

  const latestActionByUser = new Map<string, { action: string; timestamp: string }>()
  const activityByDay = new Map<string, { date: string; label: string; actions: number; uniqueUsers: Set<string> }>()
  const sectionUsage = new Map<string, number>()
  const actionUsage = new Map<string, number>()
  const activityByHour = new Map<number, { hour: number; actions: number; users: Set<string> }>()
  const userActionCounts = new Map<string, { id: string; name: string | null; count: number }>()

  logs.forEach((entry) => {
    const timestamp = getTimestampDate(entry.timestamp)
    if (!timestamp) return

    const details = (entry.details || null) as Record<string, unknown> | null
    const action = (entry.action as string) || 'UNKNOWN_ACTION'
    const section = getSectionFromAction(action, details)

    const dayKey = toIsoDay(timestamp)
    const existingDay = activityByDay.get(dayKey) || {
      date: dayKey,
      label: timestamp.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      actions: 0,
      uniqueUsers: new Set<string>(),
    }

    existingDay.actions += 1
    if (entry.user_id) existingDay.uniqueUsers.add(entry.user_id)
    activityByDay.set(dayKey, existingDay)

    const hour = timestamp.getHours()
    const existingHour = activityByHour.get(hour) || { hour, actions: 0, users: new Set<string>() }
    existingHour.actions += 1
    if (entry.user_id) existingHour.users.add(entry.user_id)
    activityByHour.set(hour, existingHour)

    if (entry.user_id) {
      const existingUser = userActionCounts.get(entry.user_id) || { id: entry.user_id, name: (entry.user_name as string) || null, count: 0 }
      existingUser.count += 1
      if (entry.user_name && !existingUser.name) existingUser.name = entry.user_name as string
      userActionCounts.set(entry.user_id, existingUser)

      const previous = latestActionByUser.get(entry.user_id)
      const currentTimestamp = timestamp.toISOString()
      if (!previous || previous.timestamp < currentTimestamp) {
        latestActionByUser.set(entry.user_id, { action, timestamp: currentTimestamp })
      }
    }

    sectionUsage.set(section, (sectionUsage.get(section) || 0) + 1)
    actionUsage.set(action, (actionUsage.get(action) || 0) + 1)
  })

  const currentOnlineUsersWithActivity = currentOnlineUsers.map((user) => {
    const latestAction = latestActionByUser.get(user.id)
    return {
      ...user,
      last_action: latestAction?.action || null,
      last_action_at: latestAction?.timestamp || null,
    }
  })

  const activityTimeline: SystemAnalyticsTimelinePoint[] = Array.from(activityByDay.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry) => ({
      date: entry.date,
      label: entry.label,
      active_users: entry.uniqueUsers.size,
      unique_users: entry.uniqueUsers.size,
      actions: entry.actions,
    }))

  const activityByHourList = Array.from({ length: 24 }, (_, i) => {
    const data = activityByHour.get(i) || { hour: i, actions: 0, users: new Set<string>() }
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

  const durationBuckets: Record<string, number> = {
    '< 5 min': 0,
    '5 - 15 min': 0,
    '15 - 30 min': 0,
    '30 - 60 min': 0,
    '> 60 min': 0,
  }

  profiles.forEach((profile) => {
    const minutes = getSessionDurationMinutes(profile, now)
    if (minutes <= 0) return

    if (minutes < 5) durationBuckets['< 5 min']++
    else if (minutes < 15) durationBuckets['5 - 15 min']++
    else if (minutes < 30) durationBuckets['15 - 30 min']++
    else if (minutes < 60) durationBuckets['30 - 60 min']++
    else durationBuckets['> 60 min']++
  })

  const sessionDurationDistribution = Object.entries(durationBuckets).map(([range, count]) => ({
    range,
    count,
  }))

  const topActions: SystemAnalyticsActionStat[] = Array.from(actionUsage.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 12)

  const sectionStats: SystemAnalyticsSectionStat[] = Array.from(sectionUsage.entries())
    .map(([section, count]) => ({ section, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10)

  const profileMap = new Map<string, any>()
  profiles.forEach(p => profileMap.set(p.id, p))

  const recentActions: SystemAnalyticsRecentAction[] = [...logs]
    .sort((left, right) => {
      const leftTime = getTimestampDate(left.timestamp)?.getTime() || 0
      const rightTime = getTimestampDate(right.timestamp)?.getTime() || 0
      return rightTime - leftTime
    })
    .slice(0, 12)
    .map((entry) => {
      const timestamp = getTimestampDate(entry.timestamp)
      const details = (entry.details || null) as Record<string, unknown> | null
      const profile = entry.user_id ? profileMap.get(entry.user_id) : null

      return {
        id: entry.id,
        timestamp: timestamp ? timestamp.toISOString() : now.toISOString(),
        action: (entry.action as string) || 'UNKNOWN_ACTION',
        user_id: (entry.user_id as string) || 'unknown',
        user_name: (entry.user_name as string) || (profile?.full_name as string) || null,
        user_role: (entry.user_role as string) || (profile?.role as string) || 'user',
        section: getSectionFromAction((entry.action as string) || 'UNKNOWN_ACTION', details),
        details: formatDetails(details),
      }
    })

  const registrationTimelineMap = new Map<string, number>()
  profiles.forEach(p => {
    const createdAt = getTimestampDate(p.created_at || p.timestamp)
    if (createdAt) {
      const dayKey = toIsoDay(createdAt)
      registrationTimelineMap.set(dayKey, (registrationTimelineMap.get(dayKey) || 0) + 1)
    }
  })

  // Sort all registration days to calculate cumulative growth
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
    return d >= windowStart
  })

  return {
    window_days: windowDays,
    generated_at: now.toISOString(),
    total_log_entries: logs.length,
    current_online_users_count: currentOnlineUsersWithActivity.length,
    current_online_users: currentOnlineUsersWithActivity,
    activity_timeline: activityTimeline,
    registration_timeline: registrationTimeline,
    activity_by_hour: activityByHourList,
    top_active_users: topActiveUsers,
    session_duration_distribution: sessionDurationDistribution,
    top_actions: topActions,
    section_usage: sectionStats,
    recent_actions: recentActions,
    average_session_minutes: Math.round(computeAverageSessionMinutes(profiles, now) * 10) / 10,
  }
}
