import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDashboardBaseUrl } from '@/lib/dashboard-url'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const pathname = url.pathname

  // Local development or production domains
  const isDashboardSubdomain = hostname.startsWith('dashboard.') || hostname.startsWith('app.') || hostname.includes('dashboard.')
  
  const isLandingDomain = hostname === 'abi-planer-27.de' || hostname === 'www.abi-planer-27.de' || (hostname.endsWith('.localhost') && !hostname.startsWith('dashboard.'))
  
  // Routes categorization
  const landingOnlyRoutes = [
    '/agb',
    '/datenschutz',
    '/impressum',
    '/uber',
    '/vorteile',
  ]

  // Dashboard-specific routes (everything app-related)
  const dashboardOnlyRoutes = [
    '/abstimmungen',
    '/admin',
    '/battle-pass',
    '/einstellungen',
    '/feedback',
    '/finanzen',
    '/gruppen',
    '/hilfe',
    '/kalender',
    '/login',
    '/profil',
    '/r',
    '/register',
    '/sammelkarten',
    '/shop',
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

  if (isDashboardSubdomain) {
    // On dashboard subdomain, hide landing-only pages
    if (landingOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
      return new NextResponse(null, { status: 404 })
    }
  } else if (isLandingDomain) {
    // On main domain, hide dashboard-only pages and redirect
    if (dashboardOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
      const dashboardBaseUrl = getDashboardBaseUrl()
      const redirectUrl = new URL(pathname, dashboardBaseUrl)
      
      // Preserve query parameters
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      
      return NextResponse.redirect(redirectUrl, { status: 307 })
    }
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
