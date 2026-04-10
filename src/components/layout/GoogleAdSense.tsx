'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isAdSenseAllowedRoute } from './adsenseRoutes'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export function GoogleAdSense() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [hasConsent, setHasConsent] = useState<boolean>(false)
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim()
  const shouldRender = Boolean(adSlot) && hasConsent && !user && isAdSenseAllowedRoute(pathname)

  useEffect(() => {
    const checkConsent = () => {
      setHasConsent(localStorage.getItem('cookie-consent-accepted') === 'true')
    }

    checkConsent()
    window.addEventListener('cookie-consent-changed', checkConsent)
    return () => window.removeEventListener('cookie-consent-changed', checkConsent)
  }, [])

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    window.adsbygoogle = window.adsbygoogle || []

    try {
      window.adsbygoogle.push({})
    } catch (error) {
      console.error('Failed to render AdSense unit:', error)
    }
  }, [shouldRender])

  if (!shouldRender) {
    return null
  }

  return (
    <aside className="my-8 px-4" aria-label="Anzeige">
      <div className="mx-auto w-full max-w-7xl rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground opacity-70">
          Anzeige
        </p>
        <ins
          className="adsbygoogle block min-h-[100px] w-full"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-8940687842344229"
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  )
}
