'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Loader2 } from 'lucide-react'
import { SystemMessageHost } from '@/components/layout/SystemMessageHost'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { EmailVerificationBanner } from '@/components/layout/EmailVerificationBanner'
import { MaintenanceBanner } from '@/components/layout/MaintenanceBanner'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { TwoFactorGate } from '@/components/auth/TwoFactorGate'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeSync } from '@/components/layout/ThemeSync'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { getTcgBaseUrl, extractGradeFromClassName, ALLOWED_PLANNER_GRADES } from '@/lib/dashboard-url'

import { SupportHeader } from '@/components/support/SupportHeader'

interface AppShellProps {
  children: React.ReactNode
}

const authRoutes = new Set(['/login', '/register'])
const noMenuRoutes = new Set(['/lehrer/erstellen'])

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { maintenance } = useSystemMessage()
  const { profile, user, loading: authLoading } = useAuth()
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(null)
  const [hostname, setHostname] = useState<string | null>(null)
  const isBoneyardBuild = typeof window !== 'undefined' && Boolean((window as any).__BONEYARD_BUILD)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname)
    }
  }, [])

  const domainInfo = useMemo(() => {
    if (isBoneyardBuild || hostname === null) return { isDashboard: false, isTcg: false, isShop: false, isSupport: false, isAnySubdomain: false }
    
    const isDashboard = hostname.startsWith('dashboard.') || hostname.startsWith('app.') || hostname.includes('.dashboard.')
    const isTcg = hostname.startsWith('tcg.') || hostname.includes('.tcg.')
    const isShop = hostname.startsWith('shop.') || hostname.includes('.shop.')
    const isSupport = hostname.startsWith('support.') || hostname.includes('.support.')
    
    return {
      isDashboard,
      isTcg,
      isShop,
      isSupport,
      isAnySubdomain: isDashboard || isTcg || isShop || isSupport
    }
  }, [hostname, isBoneyardBuild])

  const isDashboardSubdomain = domainInfo.isAnySubdomain

  const isNoMenuRoute = useMemo(() => {
    if (!pathname) return false
    return noMenuRoutes.has(pathname) || pathname.startsWith('/lehrer/erstellen/')
  }, [pathname])

  const isAuthRoute = authRoutes.has(pathname) || 
    pathname?.startsWith('/lehrer/erstellen/')
  const isPublicLandingRoute = isDashboardSubdomain === false && !isAuthRoute && pathname !== '/maintenance'
  const isSupportRoute = domainInfo.isSupport
  const isMaintenancePage = pathname === '/maintenance'
  const isNewsDetail = pathname?.startsWith('/news/')
  const isAdmin = ['admin_main', 'admin', 'admin_co'].includes(profile?.role || '')
  const isMaintenanceActive = Boolean(
    isDashboardSubdomain && 
    maintenance && (
      maintenance.active || (
        maintenance.start && new Date(maintenance.start) <= new Date() && 
        (!maintenance.end || new Date(maintenance.end) > new Date())
      )
    )
  )

  const showMaintenanceBanner = maintenance?.start && 
    new Date(maintenance.start) > new Date() && 
    !maintenance.active && 
    !isMaintenancePage && 
    dismissedBanner !== maintenance.start

  const showAdminMaintenanceActiveBanner = isAdmin && isMaintenanceActive && !isMaintenancePage

  useEffect(() => {
    if (isBoneyardBuild) return
    if (isDashboardSubdomain !== true) return
    if (authLoading) return
    if (isAuthRoute) return
    if (isSupportRoute) return // Support is public
    
    // Auth protection: Dashboard and TCG require login. Shop is public.
    if (!user && !domainInfo.isShop) {
      const targetPath = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : pathname || '/'
      const redirectTarget = targetPath.startsWith('/') ? targetPath : '/'
      router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`)
      return
    }

    // Role protection for Dashboard subdomain
    if (user && profile && domainInfo.isDashboard) {
      const grade = extractGradeFromClassName(profile.class_name)
      const isPlanner = ['admin_main', 'admin', 'admin_co', 'planner'].includes(profile.role || '')
      const isGraduationClass = grade && ALLOWED_PLANNER_GRADES.has(grade)
      
      if (!isPlanner && !isGraduationClass) {
        console.warn('[AppShell] User not authorized for dashboard, redirecting to TCG.')
        window.location.href = `${getTcgBaseUrl()}/home`
      }
    }
  }, [authLoading, isBoneyardBuild, isDashboardSubdomain, domainInfo.isShop, domainInfo.isDashboard, isAuthRoute, isSupportRoute, pathname, router, user, profile])

  // While hostname is not determined, show a minimal loading state to prevent flash
  // This return MUST be after all hooks have been declared
  if (hostname === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    )
  }

  if (isSupportRoute) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SupportHeader />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieConsent />
      </div>
    )
  }

  if (isPublicLandingRoute) {
    return (
      <div className="min-h-screen bg-background">
        <LandingHeader isAuthenticated={!!user} />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </div>
    )
  }

  if (!isBoneyardBuild && isDashboardSubdomain === true && !isAuthRoute && (authLoading || (!user && !domainInfo.isShop))) {
    return (
      <div className="min-h-screen bg-background lg:flex">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:flex w-64 flex-col border-r border-border p-4 space-y-4">
          <Skeleton className="h-10 w-32 mb-8" />
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isMaintenancePage || (maintenance?.active && isNewsDetail)) {
    return (
      <div className="min-h-screen bg-background pb-safe">
        <main>{children}</main>
      </div>
    )
  }

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background pb-safe">
        {showMaintenanceBanner && maintenance?.start && (
          <MaintenanceBanner 
            startTime={maintenance.start} 
            onDismiss={() => setDismissedBanner(maintenance.start)} 
          />
        )}
        {showAdminMaintenanceActiveBanner && (
          <div className="w-full bg-amber-600 px-4 py-2 text-center text-xs font-bold tracking-wide text-white">
            Wartungspause aktiv: Du bist als Admin weiterhin im System.
          </div>
        )}
        <SystemMessageHost />
        <main className="min-h-screen">{children}</main>
        <CookieConsent />
      </div>
    )
  }

  return (
    <TwoFactorGate>
      <ThemeSync />
      <div className="min-h-[100dvh] bg-background lg:flex pb-safe">
        <Navbar />
        <div className="flex-1 flex flex-col min-h-[100dvh] min-w-0">
          {showMaintenanceBanner && maintenance?.start && (
            <MaintenanceBanner 
              startTime={maintenance.start} 
              onDismiss={() => setDismissedBanner(maintenance.start)} 
            />
          )}
          {showAdminMaintenanceActiveBanner && (
            <div className="w-full bg-amber-600 px-4 py-2 text-center text-xs font-bold tracking-wide text-white">
              Wartungspause aktiv: Du bist als Admin weiterhin im System.
            </div>
          )}
          <EmailVerificationBanner />
          <SystemMessageHost />
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 min-w-0">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
          <Footer />
        </div>
        <CookieConsent />
      </div>
    </TwoFactorGate>
  )
}
