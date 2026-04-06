const DASHBOARD_FALLBACK_URL = 'https://dashboard.abi-planer-27'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

function normalizeDashboardBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function getDashboardBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim()
  if (configuredUrl) {
    return normalizeDashboardBaseUrl(configuredUrl)
  }

  return DASHBOARD_FALLBACK_URL
}

export function getDashboardRedirectUrl(location: Location): string {
  const host = location.hostname

  if (LOCAL_HOSTS.has(host) || host.endsWith('.localhost')) {
    const baseHost = host.startsWith('www.') ? host.slice(4) : host
    const localHost = baseHost.startsWith('dashboard.') ? baseHost : `dashboard.${baseHost}`
    const port = location.port ? `:${location.port}` : ''
    return `${location.protocol}//${localHost}${port}`
  }

  return getDashboardBaseUrl()
}