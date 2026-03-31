'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SystemMessageHost } from '@/components/layout/SystemMessageHost'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { EmailVerificationBanner } from '@/components/layout/EmailVerificationBanner'
import { MaintenanceBanner } from '@/components/layout/MaintenanceBanner'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { TwoFactorGate } from '@/components/auth/TwoFactorGate'

interface AppShellProps {
  children: React.ReactNode
}

const authRoutes = new Set(['/login', '/register', '/waiting', '/unauthorized'])

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { maintenance } = useSystemMessage()
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(null)
  
  const isAuthRoute = authRoutes.has(pathname)
  const isMaintenancePage = pathname === '/maintenance'
  const isNewsDetail = pathname?.startsWith('/news/')

  const showMaintenanceBanner = maintenance?.start && 
    new Date(maintenance.start) > new Date() && 
    !maintenance.active && 
    !isMaintenancePage && 
    dismissedBanner !== maintenance.start

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
