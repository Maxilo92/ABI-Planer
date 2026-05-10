'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'
import { Suspense, useEffect } from 'react'
import PostHogPageView from './PostHogPageView'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://t.abi-planer-27.de';
    
    if (token && typeof window !== 'undefined') {
      // Determine the cookie domain for subdomains (e.g. .abi-planer-27.de)
      let cookieDomain = undefined;
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.endsWith('.localhost')) {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
          cookieDomain = '.' + parts.slice(-2).join('.');
        }
      }

      posthog.init(token, {
        api_host: host,
        ui_host: 'https://us.posthog.com',
        person_profiles: 'always', // Track anonymous users as well
        capture_pageview: false, // Disable automatic pageview capture, as we use PostHogPageView
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
        cross_subdomain_cookie: true,
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PostHog] Initialized on ${hostname} with host ${host}${cookieDomain ? ` (domain: ${cookieDomain})` : ''}`);
      }
    } else if (!token) {
      console.warn('[PostHog] Project token missing. Analytics are disabled.');
    }
  }, [])

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
