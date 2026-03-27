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
import { useState, useEffect } from 'react'
import { AlertTriangle, Lock, LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AppShellProps {
  children: React.ReactNode
}

const authRoutes = new Set(['/login', '/register', '/waiting'])

function WarningBanner({ reason, onDismiss }: { reason: string, onDismiss: () => void }) {
  return (
    <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between gap-4 shadow-lg animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Wichtiger Hinweis der Administration</p>
          <p className="text-sm font-medium">"{reason}"</p>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-white hover:bg-white/20 shrink-0"
        onClick={onDismiss}
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  )
}

function TimeoutOverlay({ reason, until }: { reason?: string | null, until: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(until).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Sperre abgelaufen. Bitte lade die Seite neu.')
        return
      }

      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s verbleibend`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [until])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md px-4">
      <div className="max-w-md w-full bg-card border-2 border-destructive/50 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <Lock className="h-10 w-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Account gesperrt</h2>
          <p className="text-muted-foreground">Dein Zugriff wurde vorübergehend eingeschränkt.</p>
        </div>

        {reason && (
          <div className="bg-muted p-4 rounded-xl border-l-4 border-destructive text-left">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Grund der Sperre
            </p>
            <p className="text-sm italic">"{reason}"</p>
          </div>
        )}

        <div className="py-2">
          <p className="text-lg font-mono font-bold text-primary">{timeLeft}</p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => signOut(auth)}
          >
            <LogOut className="h-4 w-4" /> Abmelden
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Falls du glaubst, dass dies ein Fehler ist, kontaktiere bitte die Administration.
          </p>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const { giftNotices, totalGiftPacks, dismissGiftNotices } = useGiftNotices(user?.uid)
  const [showWarning, setShowWarning] = useState(false)
  const isAuthRoute = authRoutes.has(pathname)

  const isTimedOut = profile?.timeout_until && new Date(profile.timeout_until).getTime() > Date.now()
  const hasWarning = profile?.timeout_until && new Date(profile.timeout_until).getTime() <= Date.now() && profile?.timeout_reason

  useEffect(() => {
    if (hasWarning) {
      const dismissed = sessionStorage.getItem(`warning_dismissed_${profile?.timeout_until}_${profile?.timeout_reason}`)
      if (!dismissed) {
        setShowWarning(true)
      }
    } else {
      setShowWarning(false)
    }
  }, [hasWarning, profile?.timeout_until, profile?.timeout_reason])

  const dismissWarning = () => {
    setShowWarning(false)
    sessionStorage.setItem(`warning_dismissed_${profile?.timeout_until}_${profile?.timeout_reason}`, 'true')
  }

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
        {showWarning && <WarningBanner reason={profile!.timeout_reason!} onDismiss={dismissWarning} />}
        <DangerAlertBanner />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {isTimedOut ? (
              <TimeoutOverlay 
                reason={profile.timeout_reason} 
                until={profile.timeout_until!} 
              />
            ) : children}
          </div>
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
