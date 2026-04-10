'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SystemMessageHost } from '@/components/layout/SystemMessageHost'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { EmailVerificationBanner } from '@/components/layout/EmailVerificationBanner'
import { MaintenanceBanner } from '@/components/layout/MaintenanceBanner'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { TwoFactorGate } from '@/components/auth/TwoFactorGate'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

interface AppShellProps {
  children: React.ReactNode
}

const authRoutes = new Set(['/login', '/register', '/waiting', '/unauthorized', '/zugang', '/vorteile'])

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { maintenance } = useSystemMessage()
  const { profile, user, loading: authLoading } = useAuth()
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(null)
  const [hostname, setHostname] = useState('')
  const isBoneyardBuild = typeof window !== 'undefined' && Boolean((window as any).__BONEYARD_BUILD)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname)
    }
  }, [])

  const isDashboardSubdomain = useMemo(() => {
    if (isBoneyardBuild) return false
    const isLocalDashboardHost = hostname === 'localhost' || hostname === '127.0.0.1'
    return isLocalDashboardHost || hostname.startsWith('dashboard.') || hostname.startsWith('app.')
  }, [hostname, isBoneyardBuild])

  const isPublicLandingRoute = !isDashboardSubdomain && !authRoutes.has(pathname) && pathname !== '/maintenance'
  
  const isAuthRoute = authRoutes.has(pathname) || 
    pathname?.startsWith('/vorteile/') || 
    (pathname === '/' && !isDashboardSubdomain)
  const isMaintenancePage = pathname === '/maintenance'
  const isNewsDetail = pathname?.startsWith('/news/')
  const isAdmin = ['admin_main', 'admin', 'admin_co'].includes(profile?.role || '')
  const isMaintenanceActive = Boolean(
    maintenance && (maintenance.active || (maintenance.start && new Date(maintenance.start) <= new Date()))
  )

  const showMaintenanceBanner = maintenance?.start && 
    new Date(maintenance.start) > new Date() && 
    !maintenance.active && 
    !isMaintenancePage && 
    dismissedBanner !== maintenance.start

  const showAdminMaintenanceActiveBanner = isAdmin && isMaintenanceActive && !isMaintenancePage

  useEffect(() => {
    if (isBoneyardBuild) return
    if (!isDashboardSubdomain) return
    if (authLoading) return
    if (authRoutes.has(pathname)) return
    if (!user) {
      router.replace('/login')
    }
  }, [authLoading, isBoneyardBuild, isDashboardSubdomain, pathname, router, user])

  if (isPublicLandingRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">{children}</main>
      </div>
    )
  }

  if (!isBoneyardBuild && isDashboardSubdomain && !isAuthRoute && (authLoading || !user)) {
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
      <div className="min-h-[100dvh] bg-background lg:flex pb-safe">
        <Navbar />
        <div className="flex-1 flex flex-col min-h-[100dvh]">
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
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
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
