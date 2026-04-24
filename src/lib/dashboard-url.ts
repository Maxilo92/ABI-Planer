export const MAIN_DOMAIN = 'abi-planer-27.de'
export const DASHBOARD_DOMAIN = 'dashboard.abi-planer-27.de'
export const TCG_DOMAIN = 'tcg.abi-planer-27.de'
export const SHOP_DOMAIN = 'shop.abi-planer-27.de'
export const SUPPORT_DOMAIN = 'support.abi-planer-27.de'

export type AppTarget = 'dashboard' | 'tcg' | 'shop' | 'support'

export interface AccessTargetProfile {
  access_target?: AppTarget | null
  class_name?: string | null
}

export const ALLOWED_PLANNER_GRADES = new Set(['11'])

const DASHBOARD_FALLBACK_URL = `https://${DASHBOARD_DOMAIN}`
const TCG_FALLBACK_URL = `https://${TCG_DOMAIN}`
const SHOP_FALLBACK_URL = `https://${SHOP_DOMAIN}`
const SUPPORT_FALLBACK_URL = `https://${SUPPORT_DOMAIN}`
const MAIN_FALLBACK_URL = `https://${MAIN_DOMAIN}`

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const APP_HOSTS: Record<Exclude<AppTarget, 'support'>, string> = {
  dashboard: DASHBOARD_DOMAIN,
  tcg: TCG_DOMAIN,
  shop: SHOP_DOMAIN,
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
  return hostname.replace(/^www\./, '').replace(/^(dashboard|tcg|shop|app)\./, '')
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

export function getShopBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SHOP_URL?.trim()
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  return SHOP_FALLBACK_URL
}

export function getSupportBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPPORT_URL?.trim()
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  return SUPPORT_FALLBACK_URL
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
  if (target === 'shop') {
    return getShopBaseUrl()
  }
  if (target === 'support') {
    return getSupportBaseUrl()
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

  if (host === APP_HOSTS.dashboard || host === APP_HOSTS.tcg || host === APP_HOSTS.shop || host.startsWith('dashboard.') || host.startsWith('tcg.') || host.startsWith('shop.')) {
    return getAppBaseUrl(target)
  }

  if (target === 'shop') return getShopBaseUrl()
  return target === 'tcg' ? getTcgBaseUrl() : getDashboardBaseUrl()
}

export function getDashboardRedirectUrl(location: Location, target: AppTarget = 'dashboard'): string {
  return getAppRedirectUrl(location, target)
}

/**
 * Checks if the current hostname corresponds to the TCG subdomain.
 */
export function isTcgHost(hostname: string): boolean {
  return hostname.startsWith('tcg.') || hostname.includes('.tcg.')
}

/**
 * Checks if the current hostname corresponds to the Dashboard subdomain.
 */
export function isDashboardHost(hostname: string): boolean {
  return hostname.startsWith('dashboard.') || hostname.startsWith('app.') || hostname.includes('.dashboard.')
}

/**
 * Checks if the current hostname corresponds to the Shop subdomain.
 */
export function isShopHost(hostname: string): boolean {
  return hostname.startsWith('shop.') || hostname.includes('.shop.')
}

/**
 * Checks if the current hostname corresponds to the Support subdomain.
 */
export function isSupportHost(hostname: string): boolean {
  return hostname.startsWith('support.') || hostname.includes('.support.')
}