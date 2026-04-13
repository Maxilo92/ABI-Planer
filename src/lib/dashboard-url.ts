export const MAIN_DOMAIN = 'abi-planer-27.de'
export const DASHBOARD_DOMAIN = 'dashboard.abi-planer-27.de'

const DASHBOARD_FALLBACK_URL = `https://${DASHBOARD_DOMAIN}`
const MAIN_FALLBACK_URL = `https://${MAIN_DOMAIN}`

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function getDashboardBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim()
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  return DASHBOARD_FALLBACK_URL
}

export function getMainBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_MAIN_URL?.trim()
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  return MAIN_FALLBACK_URL
}

export function getDashboardRedirectUrl(location: Location): string {
  const host = location.hostname

  if (LOCAL_HOSTS.has(host) || host.endsWith('.localhost')) {
    const baseHost = host.startsWith('www.') ? host.slice(4) : host
    const localHost = baseHost.startsWith('dashboard.') ? baseHost : `dashboard.${baseHost}`
    const port = location.port ? `:${location.port}` : ''
    return `${location.protocol}//${localHost}${port}`
  }

  // Fallback for production: If we are on the main domain (e.g. abi-planer-27.de), 
  // we want to go to the dashboard subdomain on the SAME domain.
  if (host === MAIN_DOMAIN || host === `www.${MAIN_DOMAIN}`) {
    return `https://${DASHBOARD_DOMAIN}`
  }

  return getDashboardBaseUrl()
}