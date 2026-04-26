'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { Suspense, useEffect } from 'react'
import PostHogPageView from './PostHogPageView'

if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
  
  if (token) {
    posthog.init(token, {
      api_host: host,
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      capture_pageview: false, // Disable automatic pageview capture, as we use PostHogPageView
      capture_pageleave: true,
    })
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
