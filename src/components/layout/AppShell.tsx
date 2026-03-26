'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RandomCookieBanner } from '@/components/layout/RandomCookieBanner'
import { DangerAlertBanner } from '@/components/layout/DangerAlertBanner'
import { CustomPopupBanner } from '@/components/layout/CustomPopupBanner'
import { useAuth } from '@/context/AuthContext'
import { useGiftNotices } from '@/hooks/useGiftNotices'
import { GiftNoticeBanner } from '@/components/dashboard/GiftNoticeBanner'

interface AppShellProps {
  children: React.ReactNode
}

const authRoutes = new Set(['/login', '/register', '/waiting'])

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { giftNotices, totalGiftPacks, dismissGiftNotices } = useGiftNotices(user?.uid)
  const isAuthRoute = authRoutes.has(pathname)

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background pb-safe">
        <DangerAlertBanner />
        <main className="min-h-screen">{children}</main>
        <RandomCookieBanner />
        <CustomPopupBanner />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-background md:flex pb-safe">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        <DangerAlertBanner />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <Footer />
      </div>

      {giftNotices.length > 0 && (
        <GiftNoticeBanner
          totalGiftPacks={totalGiftPacks}
          titleText={giftNotices[0]?.popupTitle}
          bodyText={giftNotices[0]?.popupBody}
          customMessage={giftNotices[0]?.customMessage}
          ctaLabel={giftNotices[0]?.ctaLabel}
          ctaUrl={giftNotices[0]?.ctaUrl}
          dismissLabel={giftNotices[0]?.dismissLabel}
          onDismiss={dismissGiftNotices}
        />
      )}

      <RandomCookieBanner />
      <CustomPopupBanner />
    </div>
  )
}
