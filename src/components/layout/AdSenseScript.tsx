'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isAdSenseAllowedRoute } from './adsenseRoutes'

// Use a module-level variable to track injection globally across remounts
let scriptInjected = false

export function AdSenseScript() {
  const pathname = usePathname()

  useEffect(() => {
    const checkAndInject = () => {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname
        if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
          return
        }
      }

      if (!isAdSenseAllowedRoute(pathname)) {
        return
      }

      const consent = localStorage.getItem('cookie-consent-accepted')
      if (consent === 'true' && !scriptInjected) {
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940687842344229'
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
        scriptInjected = true
      }
    }

    // Initial check
    checkAndInject()

    // Listen for changes
    window.addEventListener('cookie-consent-changed', checkAndInject)

    return () => {
      window.removeEventListener('cookie-consent-changed', checkAndInject)
    }
  }, [pathname])

  return null
}
