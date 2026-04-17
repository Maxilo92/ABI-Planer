import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAppBaseUrl, getMainBaseUrl } from '@/lib/dashboard-url'

function normalizeRequestHost(hostHeader: string): string {
  // Strip port and convert to lowercase
  return hostHeader.split(':')[0].toLowerCase()
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')
}

function splitHostSegments(hostname: string): string[] {
  return hostname.toLowerCase().split('.').filter(Boolean)
}

function getAppSegmentIndex(segments: string[]): number {
  return segments.findIndex((segment) =>
    segment === 'dashboard' || segment === 'app' || segment === 'tcg' || segment === 'www'
  )
}

function buildTargetHost(currentHost: string, target: 'dashboard' | 'tcg' | 'main'): string | null {
  const segments = splitHostSegments(currentHost)
  if (segments.length === 0) return null

  const appSegmentIndex = getAppSegmentIndex(segments)
  const targetSegment = target === 'main' ? null : target

  if (appSegmentIndex >= 0) {
    const prefix = segments.slice(0, appSegmentIndex)
    const suffix = segments.slice(appSegmentIndex + 1)
    const rebuilt = targetSegment ? [...prefix, targetSegment, ...suffix] : [...prefix, ...suffix]
    return rebuilt.join('.')
  }

  if (target === 'main') {
    return currentHost.replace(/^www\./, '')
  }

  return `${target}.${currentHost.replace(/^www\./, '')}`
}

function isDashboardHost(hostname: string): boolean {
  return /(^|\.)dashboard\./.test(hostname) || /(^|\.)app\./.test(hostname)
}

function isTcgHost(hostname: string): boolean {
  return /(^|\.)tcg\./.test(hostname)
}

function safeRedirect(request: NextRequest, targetUrl: URL) {
  const current = request.nextUrl
  const currentHost = normalizeRequestHost(current.host)
  const targetHost = normalizeRequestHost(targetUrl.host)

  // Guard against redirect loops (e.g. misconfigured target domains/env vars).
  if (
    currentHost === targetHost &&
    current.pathname === targetUrl.pathname &&
    current.search === targetUrl.search
  ) {
    return NextResponse.next()
  }

  return NextResponse.redirect(targetUrl, { status: 307 })
}

function getRequestBaseUrl(request: NextRequest, target: 'dashboard' | 'tcg' | 'main'): string {
  const currentUrl = request.nextUrl
  const hostname = normalizeRequestHost(currentUrl.hostname)
  const isLocal = isLocalHost(hostname)
  
  if (isLocal) {
    const protocol = currentUrl.protocol || 'http:'
    const port = currentUrl.port ? `:${currentUrl.port}` : ''
    const baseHost = buildTargetHost(hostname, 'main') || hostname.replace(/^(dashboard|tcg|app)\./, '')
    
    if (target === 'main') return `${protocol}//${baseHost}${port}`
    return `${protocol}//${target}.${baseHost}${port}`
  }

  const protocol = currentUrl.protocol || 'https:'
  const targetHost = buildTargetHost(hostname, target)
  if (targetHost) {
    return `${protocol}//${targetHost}`
  }

  if (target === 'tcg') return getAppBaseUrl('tcg')
  if (target === 'main') return getMainBaseUrl()
  return getAppBaseUrl('dashboard')
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = normalizeRequestHost(url.hostname)
  const pathname = url.pathname

  // Local development or production domains
  const isDashboardSubdomain = isDashboardHost(hostname)
  const isTcgSubdomain = isTcgHost(hostname)
  const isLandingDomain = !isDashboardSubdomain && !isTcgSubdomain
  
  // Routes categorization
  const landingOnlyRoutes = [
    '/uber',
    '/vorteile',
    '/agb',
    '/datenschutz',
    '/impressum'
  ]

  const cardRoutes = [
    '/sammelkarten',
    '/shop',
    '/battle-pass'
  ]

  // Dashboard-specific routes (everything planner-related)
  const plannerOnlyRoutes = [
    '/lehrer',
    '/abstimmungen',
    '/admin',
    '/aufgaben',
    '/einstellungen',
    '/feedback',
    '/finanzen',
    '/gruppen',
    '/hilfe',
    '/kalender',
    '/r',
    '/todos',
    '/unauthorized',
    '/zugang',
    '/maintenance'
  ]

  // API and static files should always be accessible
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.includes('.') || 
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // 1. Check Card Routes -> Redirect to TCG
  if (cardRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (!isTcgSubdomain) {
      const tcgBaseUrl = getRequestBaseUrl(request, 'tcg')
      const redirectUrl = new URL(pathname, tcgBaseUrl)

      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })

      return safeRedirect(request, redirectUrl)
    }

    return NextResponse.next()
  }

  // 2. Check Planner Routes -> Redirect to Dashboard
  if (plannerOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (!isDashboardSubdomain) {
      const dashboardBaseUrl = getRequestBaseUrl(request, 'dashboard')
      const redirectUrl = new URL(pathname, dashboardBaseUrl)
      
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      
      return safeRedirect(request, redirectUrl)
    }

    return NextResponse.next()
  }

  // 3. Check Landing Routes -> Redirect to Main Domain
  if (landingOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (!isLandingDomain) {
      const mainBaseUrl = getRequestBaseUrl(request, 'main')
      const redirectUrl = new URL(pathname, mainBaseUrl)
      
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      
      return safeRedirect(request, redirectUrl)
    }

    return NextResponse.next()
  }

  // 4. Special case: Root Path `/` on TCG subdomain
  if (isTcgSubdomain && pathname === '/') {
    const tcgBaseUrl = getRequestBaseUrl(request, 'tcg')
    return safeRedirect(request, new URL('/sammelkarten', tcgBaseUrl))
  }

  return NextResponse.next()
}

// Ensure middleware runs on all relevant routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
