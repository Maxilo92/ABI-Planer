import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAppBaseUrl, getMainBaseUrl } from '@/lib/dashboard-url'

function getRequestBaseUrl(request: NextRequest, target: 'dashboard' | 'tcg' | 'main'): string {
  const hostname = request.headers.get('host') || ''
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  
  if (isLocal) {
    const protocol = 'http:' // No SSL on localhost usually
    const port = hostname.includes(':') ? `:${hostname.split(':')[1]}` : ''
    const baseHost = hostname.split(':')[0].replace(/^(dashboard|tcg|app)\./, '')
    
    if (target === 'main') return `${protocol}//${baseHost}${port}`
    return `${protocol}//${target}.${baseHost}${port}`
  }

  if (target === 'tcg') return getAppBaseUrl('tcg')
  if (target === 'main') return getMainBaseUrl()
  return getAppBaseUrl('dashboard')
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const pathname = url.pathname

  // Local development or production domains
  const isDashboardSubdomain = hostname.startsWith('dashboard.') || hostname.startsWith('app.') || hostname.includes('dashboard.')
  const isTcgSubdomain = hostname.startsWith('tcg.') || hostname.includes('.tcg.')
  
  const isLandingDomain = hostname === 'abi-planer-27.de' || hostname === 'www.abi-planer-27.de' || (hostname.endsWith('.localhost') && !hostname.startsWith('dashboard.') && !hostname.startsWith('tcg.')) || (hostname === 'localhost')
  
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

      return NextResponse.redirect(redirectUrl, { status: 307 })
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
      
      return NextResponse.redirect(redirectUrl, { status: 307 })
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
      
      return NextResponse.redirect(redirectUrl, { status: 307 })
    }

    return NextResponse.next()
  }

  // 4. Special case: Root Path `/` on TCG subdomain
  if (isTcgSubdomain && pathname === '/') {
    const tcgBaseUrl = getRequestBaseUrl(request, 'tcg')
    return NextResponse.redirect(new URL('/sammelkarten', tcgBaseUrl), { status: 307 })
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
