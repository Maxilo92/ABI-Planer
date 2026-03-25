'use client'

import { useAuth } from '@/context/AuthContext'
import Script from 'next/script'

export function GoogleAdSense() {
  const { user, loading } = useAuth()

  // Only show ads if user is NOT logged in and loading is finished
  if (loading || user) {
    return null
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940687842344229"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
