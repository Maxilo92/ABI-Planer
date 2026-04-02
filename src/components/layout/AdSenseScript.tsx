'use client'

import { useEffect, useState } from 'react'

// Use a module-level variable to track injection globally across remounts
let scriptInjected = false

export function AdSenseScript() {
  const [hasInjected, setHasInjected] = useState(scriptInjected)

  useEffect(() => {
    const checkAndInject = () => {
      const consent = localStorage.getItem('cookie-consent-accepted')
      if (consent === 'true' && !scriptInjected) {
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940687842344229'
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
        scriptInjected = true
        setHasInjected(true)
      }
    }

    // Initial check
    checkAndInject()

    // Listen for changes
    window.addEventListener('cookie-consent-changed', checkAndInject)

    return () => {
      window.removeEventListener('cookie-consent-changed', checkAndInject)
    }
  }, [])

  return null
}
