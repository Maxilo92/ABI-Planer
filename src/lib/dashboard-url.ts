export const MAIN_DOMAIN = 'abi-planer-27.de'
export const DASHBOARD_DOMAIN = 'dashboard.abi-planer-27.de'
export const TCG_DOMAIN = 'tcg.abi-planer-27.de'

export type AppTarget = 'dashboard' | 'tcg'

export interface AccessTargetProfile {
  access_target?: AppTarget | null
  class_name?: string | null
}

export const ALLOWED_PLANNER_GRADES = new Set(['11'])

const DASHBOARD_FALLBACK_URL = `https://${DASHBOARD_DOMAIN}`
const TCG_FALLBACK_URL = `https://${TCG_DOMAIN}`
const MAIN_FALLBACK_URL = `https://${MAIN_DOMAIN}`

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const APP_HOSTS: Record<AppTarget, string> = {
  dashboard: DASHBOARD_DOMAIN,
  tcg: TCG_DOMAIN,
}

function normalizeBaseUrl(url: string): string {
  let normalized = url.trim()
  if (!normalized) return normalized

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`
  }

  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, '').replace(/^(dashboard|tcg|app)\./, '')
}

function buildLocalAppUrl(location: Location, target: AppTarget): string {
  const baseHost = normalizeHostname(location.hostname)
  const port = location.port ? `:${location.port}` : ''
  return `${location.protocol}//${target}.${baseHost}${port}`
}

export function extractGradeFromClassName(className?: string | null): string | null {
  const normalizedClassName = className?.trim().toLowerCase()
  if (!normalizedClassName) return null

  const gradeMatch = normalizedClassName.match(/\b(11|12)\b/)
  return gradeMatch?.[1] ?? null
}

export function getAccessTargetFromProfile(profile?: AccessTargetProfile | null): AppTarget {
  if (profile?.access_target === 'dashboard' || profile?.access_target === 'tcg') {
    return profile.access_target
  }

  const grade = extractGradeFromClassName(profile?.class_name)
  if (grade && ALLOWED_PLANNER_GRADES.has(grade)) {
    return 'dashboard'
  }

  return 'tcg'
}

export function getDashboardBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim()
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  return DASHBOARD_FALLBACK_URL
}

export function getTcgBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_TCG_URL?.trim()
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  return TCG_FALLBACK_URL
}

export function getMainBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_MAIN_URL?.trim()
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  return MAIN_FALLBACK_URL
}

export function getAppBaseUrl(target: AppTarget = 'dashboard'): string {
  if (target === 'tcg') {
    return getTcgBaseUrl()
  }

  return getDashboardBaseUrl()
}

export function getAppHomeUrl(location: Location, target: AppTarget = 'dashboard'): string {
  const baseUrl = getAppRedirectUrl(location, target)
  if (target === 'tcg') {
    return new URL('/home', baseUrl).toString()
  }

  return baseUrl
}

export function getAppRedirectUrl(location: Location, target: AppTarget = 'dashboard'): string {
  const host = location.hostname

  if (LOCAL_HOSTS.has(host) || host.endsWith('.localhost')) {
    return buildLocalAppUrl(location, target)
  }

  if (host === MAIN_DOMAIN || host === `www.${MAIN_DOMAIN}`) {
    return getAppBaseUrl(target)
  }

  if (host === APP_HOSTS.dashboard || host === APP_HOSTS.tcg || host.startsWith('dashboard.') || host.startsWith('tcg.')) {
    return getAppBaseUrl(target)
  }

  return target === 'tcg' ? getTcgBaseUrl() : getDashboardBaseUrl()
}

export function getDashboardRedirectUrl(location: Location, target: AppTarget = 'dashboard'): string {
  return getAppRedirectUrl(location, target)
}