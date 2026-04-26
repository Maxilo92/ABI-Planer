'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { Suspense, useEffect } from 'react'
import PostHogPageView from './PostHogPageView'

if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  
  if (token) {
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
      person_profiles: 'always', // Track anonymous users as well
      capture_pageview: false, // Disable automatic pageview capture, as we use PostHogPageView
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      cookie_domain: cookieDomain,
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PostHog] Initialized on ${hostname} with host ${host}${cookieDomain ? ` (domain: ${cookieDomain})` : ''}`);
    }
  } else {
    console.warn('[PostHog] Project token missing. Analytics are disabled.');
  }
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
