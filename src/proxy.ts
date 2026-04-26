import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAppBaseUrl, getMainBaseUrl, getShopBaseUrl } from '@/lib/dashboard-url'

function normalizeRequestHost(hostHeader: string): string {
  // Strip port and convert to lowercase
  return hostHeader.split(':')[0].toLowerCase()
}

function getEffectiveRequestHost(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const hostHeader = request.headers.get('host')
  const rawHost = forwardedHost || hostHeader || request.nextUrl.hostname
  return normalizeRequestHost(rawHost)
}

function getDefaultPort(protocol: string): string {
  return protocol === 'https:' ? '443' : '80'
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')
}

function splitHostSegments(hostname: string): string[] {
  return hostname.toLowerCase().split('.').filter(Boolean)
}

function getKnownSubdomainIndex(segments: string[]): number {
  return segments.findIndex((segment) =>
    segment === 'dashboard' || segment === 'app' || segment === 'tcg' || segment === 'shop' || segment === 'support' || segment === 'www'
  )
}

function buildTargetHost(currentHost: string, target: 'dashboard' | 'tcg' | 'shop' | 'support' | 'main'): string | null {
  const segments = splitHostSegments(currentHost)
  if (segments.length === 0) return null

  const hostWithoutWww = currentHost.replace(/^www\./, '')
  const knownSubdomainIndex = getKnownSubdomainIndex(segments)
  const targetSegment = target === 'main' ? null : target

  if (knownSubdomainIndex >= 0) {
    const prefix = segments.slice(0, knownSubdomainIndex)
    const suffix = segments.slice(knownSubdomainIndex + 1)
    const rebuilt = targetSegment ? [...prefix, targetSegment, ...suffix] : [...prefix, ...suffix]
    return rebuilt.join('.')
  }

  if (!isLocalHost(currentHost)) {
    const rootSegments = splitHostSegments(hostWithoutWww)
    const rootHost = rootSegments.length > 2 ? rootSegments.slice(1).join('.') : hostWithoutWww
    if (target === 'main') return rootHost
    return `${target}.${rootHost}`
  }

  if (target === 'main') {
    return hostWithoutWww
  }

  return `${target}.${hostWithoutWww}`
}

function isDashboardHost(hostname: string): boolean {
  return /(^|\.)dashboard\./.test(hostname) || /(^|\.)app\./.test(hostname)
}

function isTcgHost(hostname: string): boolean {
  return /(^|\.)tcg\./.test(hostname)
}

function isShopHost(hostname: string): boolean {
  return /(^|\.)shop\./.test(hostname)
}

function isSupportHost(hostname: string): boolean {
  return /(^|\.)support\./.test(hostname)
}

function safeRedirect(request: NextRequest, targetUrl: URL) {
  const current = request.nextUrl
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const currentProtocol = forwardedProto ? `${forwardedProto}:` : (current.protocol || targetUrl.protocol || 'https:')
  const targetProtocol = targetUrl.protocol || 'https:'
  const currentHost = getEffectiveRequestHost(request)
  const targetHost = normalizeRequestHost(targetUrl.hostname)
  const currentPort = current.port || getDefaultPort(currentProtocol)
  const targetPort = targetUrl.port || getDefaultPort(targetProtocol)

  // Guard against redirect loops (e.g. misconfigured target domains/env vars).
  if (
    currentProtocol === targetProtocol &&
    currentHost === targetHost &&
    currentPort === targetPort &&
    current.pathname === targetUrl.pathname &&
    current.search === targetUrl.search
  ) {
    return NextResponse.next()
  }

  return NextResponse.redirect(targetUrl, { status: 307 })
}

function getRequestBaseUrl(request: NextRequest, target: 'dashboard' | 'tcg' | 'shop' | 'support' | 'main'): string {
  const currentUrl = request.nextUrl
  const hostname = getEffectiveRequestHost(request)
  const isLocal = isLocalHost(hostname)
  
  if (isLocal) {
    const protocol = currentUrl.protocol || 'http:'
    const port = currentUrl.port ? `:${currentUrl.port}` : ''
    
    // If we're already on the correct subdomain (or main domain for target 'main'),
    // return the current host to avoid double prepending (e.g., dashboard.dashboard.localhost)
    if (target === 'main') {
      const isLanding = !isDashboardHost(hostname) && !isTcgHost(hostname) && !isShopHost(hostname) && !isSupportHost(hostname)
      if (isLanding) return `${protocol}//${hostname}${port}`
      const baseHost = buildTargetHost(hostname, 'main') || hostname
      return `${protocol}//${baseHost}${port}`
    }
    
    const targetCheck = target === 'dashboard' ? isDashboardHost(hostname) :
                       target === 'tcg' ? isTcgHost(hostname) :
                       target === 'shop' ? isShopHost(hostname) :
                       target === 'support' ? isSupportHost(hostname) : false
                       
    if (targetCheck) {
      return `${protocol}//${hostname}${port}`
    }

    const baseHost = buildTargetHost(hostname, 'main') || hostname
    return `${protocol}//${target}.${baseHost}${port}`
  }

  const protocol = currentUrl.protocol || 'https:'
  const targetHost = buildTargetHost(hostname, target)
  if (targetHost) {
    return `${protocol}//${targetHost}`
  }

  if (target === 'tcg') return getAppBaseUrl('tcg')
  if (target === 'shop') return getShopBaseUrl()
  if (target === 'main') return getMainBaseUrl()
  return getAppBaseUrl('dashboard')
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = getEffectiveRequestHost(request)
  const pathname = url.pathname

  // Local development or production domains
  const isDashboardSubdomain = isDashboardHost(hostname)
  const isTcgSubdomain = isTcgHost(hostname)
  const isShopSubdomain = isShopHost(hostname)
  const isSupportSubdomain = isSupportHost(hostname)
  const isLandingDomain = !isDashboardSubdomain && !isTcgSubdomain && !isShopSubdomain && !isSupportSubdomain

  // Support logic: Rewrite subdomain calls to /support route with locale
  if (isSupportSubdomain) {
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0]
    const hasLocale = firstSegment === 'de' || firstSegment === 'en'
    
    // If no locale, redirect to /de/[path]
    if (!hasLocale) {
      const supportBaseUrl = getRequestBaseUrl(request, 'support')
      const redirectUrl = new URL(`/de${pathname}`, supportBaseUrl)
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      return safeRedirect(request, redirectUrl)
    }

    // Handle legacy path rewrites on support subdomain (a -> artikel, c -> kategorie)
    let finalPath = pathname
    if (segments[1] === 'a') {
      finalPath = pathname.replace(`/${firstSegment}/a/`, `/${firstSegment}/artikel/`)
    } else if (segments[1] === 'c') {
      finalPath = pathname.replace(`/${firstSegment}/c/`, `/${firstSegment}/kategorie/`)
    }

    // If user tries to access /support directly on the support subdomain, strip it to avoid /support/support
    if (finalPath.startsWith('/support')) {
      const strippedPath = finalPath.replace(/^\/support/, '') || '/'
      const supportBaseUrl = getRequestBaseUrl(request, 'support')
      return NextResponse.redirect(new URL(strippedPath, supportBaseUrl))
    }
    
    // Rewrite internal URL to /support/[locale]/[path]
    return NextResponse.rewrite(new URL(`/support${finalPath}`, request.url))
  }
  
  // Routes categorization
  const landingOnlyRoutes = [
    '/uber',
    '/vorteile',
    '/legal/agb',
    '/legal/datenschutz',
    '/legal/impressum',
    '/lehrer-anmeldung'
  ]

  const shopRoutes = [
    '/shop'
  ]

  const cardRoutes = [
    '/sammelkarten',
    '/battle-pass',
    '/home',
    '/booster'
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
    '/kalender',
    '/r',
    '/todos',
    '/unauthorized',
    '/zugang',
    '/maintenance',
    '/sammelkarten-manager'
  ]

  // API and static files should always be accessible
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.includes('.') || 
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Redirect old /hilfe to the support subdomain (now with /de/ prefix)
  if (pathname === '/hilfe' || pathname.startsWith('/hilfe/')) {
    const supportBaseUrl = getRequestBaseUrl(request, 'support')
    let strippedPath = pathname.replace(/^\/hilfe/, '') || '/'
    
    // Rewrite old article/category shortcuts to new long names
    if (strippedPath.startsWith('/a/')) strippedPath = strippedPath.replace('/a/', '/artikel/')
    if (strippedPath.startsWith('/c/')) strippedPath = strippedPath.replace('/c/', '/kategorie/')
    
    const redirectUrl = new URL(`/de${strippedPath}`, supportBaseUrl)
    
    url.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    
    return safeRedirect(request, redirectUrl)
  }

  // Legacy Redirects for Legal Pages
  const legacyLegalRedirects: Record<string, string> = {
    '/agb': '/legal/agb',
    '/datenschutz': '/legal/datenschutz',
    '/impressum': '/legal/impressum',
  }

  if (legacyLegalRedirects[pathname]) {
    const mainBaseUrl = getRequestBaseUrl(request, 'main')
    return safeRedirect(request, new URL(legacyLegalRedirects[pathname], mainBaseUrl))
  }

  // 1. Check Shop Routes -> Redirect to Shop subdomain
  if (shopRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (!isShopSubdomain) {
      const shopBaseUrl = getRequestBaseUrl(request, 'shop')
      const redirectUrl = new URL(pathname, shopBaseUrl)

      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })

      return safeRedirect(request, redirectUrl)
    }

    return NextResponse.next()
  }

  // 2. Check Card Routes -> Redirect to TCG
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

  // 3. Check Planner Routes -> Redirect to Dashboard
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

  // 4. Check Landing Routes -> Redirect to Main Domain
  if (landingOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    // Legal routes should ONLY be accessible on the landing domain.
    // On subdomains, we show a 404 instead of redirecting to avoid loops and enforce isolation.
    if (pathname.startsWith('/legal/') && !isLandingDomain) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }

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

  // 5. Special case: Root Path `/` on TCG subdomain
  if (isTcgSubdomain && pathname === '/') {
    const tcgBaseUrl = getRequestBaseUrl(request, 'tcg')
    return safeRedirect(request, new URL('/home', tcgBaseUrl))
  }

  // 6. Special case: Root Path `/` on Shop subdomain -> show /shop
  if (isShopSubdomain && pathname === '/') {
    const shopBaseUrl = getRequestBaseUrl(request, 'shop')
    return safeRedirect(request, new URL('/shop', shopBaseUrl))
  }

  return NextResponse.next()
}

export default proxy

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
