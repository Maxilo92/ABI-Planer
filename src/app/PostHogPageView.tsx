'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import posthog from 'posthog-js'

export default function PostHogPageView(): null {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track pageviews
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture(
        '$pageview',
        {
          '$current_url': url,
        }
      )
    }
  }, [pathname, searchParams])

  return null
}
