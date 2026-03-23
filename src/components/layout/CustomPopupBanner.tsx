'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { Button, buttonVariants } from '@/components/ui/button'
import { UniversalBanner } from '@/components/layout/UniversalBanner'
import { cn } from '@/lib/utils'

type CustomPopupMessage = {
  id: string
  title: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  dismissLabel?: string
  chance?: number
  enabled?: boolean
  routes?: string[]
}

type GlobalPopupSettings = {
  custom_popup_messages?: CustomPopupMessage[]
}

const DEFAULT_MESSAGES: CustomPopupMessage[] = []

function routeMatches(pathname: string, routes?: string[]) {
  if (!routes || routes.length === 0) return true
  return routes.some((entry) => {
    const route = entry.trim()
    if (!route) return false
    if (route === '*') return true
    return pathname === route || pathname.startsWith(`${route}/`)
  })
}

export function CustomPopupBanner() {
  const pathname = usePathname()
  const [messages, setMessages] = useState<CustomPopupMessage[]>(DEFAULT_MESSAGES)
  const [activeMessage, setActiveMessage] = useState<CustomPopupMessage | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (!snapshot.exists()) {
        setMessages(DEFAULT_MESSAGES)
        return
      }

      const data = snapshot.data() as GlobalPopupSettings
      const loadedMessages = Array.isArray(data.custom_popup_messages)
        ? data.custom_popup_messages
        : DEFAULT_MESSAGES
      setMessages(loadedMessages)
    })

    return () => unsubscribe()
  }, [])

  const matchingCandidates = useMemo(() => {
    return messages.filter((message) => {
      if (!message?.id || !message?.title || !message?.body) return false
      if (message.enabled === false) return false
      if (!routeMatches(pathname, message.routes)) return false
      return true
    })
  }, [messages, pathname])

  useEffect(() => {
    setActiveMessage(null)
    if (matchingCandidates.length === 0) return

    const visibleCandidates = matchingCandidates.filter((message) => {
      const chance = typeof message.chance === 'number' ? message.chance : 0.35
      if (chance <= 0) return false
      return Math.random() < Math.min(1, Math.max(0, chance))
    })

    if (visibleCandidates.length === 0) return

    const undiscarded = visibleCandidates.filter((message) => {
      const key = `custom_popup_dismissed_${message.id}`
      return sessionStorage.getItem(key) !== '1'
    })

    if (undiscarded.length === 0) return

    const chosen = undiscarded[Math.floor(Math.random() * undiscarded.length)]
    const timer = setTimeout(() => {
      setActiveMessage(chosen)
    }, 1800)

    return () => clearTimeout(timer)
  }, [matchingCandidates])

  const closePopup = () => {
    if (!activeMessage) return
    sessionStorage.setItem(`custom_popup_dismissed_${activeMessage.id}`, '1')
    setActiveMessage(null)
  }

  if (!activeMessage) return null

  const dismissLabel = activeMessage.dismissLabel?.trim() || 'Schließen'
  const ctaLabel = activeMessage.ctaLabel?.trim()
  const ctaUrl = activeMessage.ctaUrl?.trim()

  return (
    <UniversalBanner
      tone="info"
      layout="floating"
      className="fixed z-[94] right-4 bottom-44 w-[min(24rem,calc(100vw-2rem))]"
      onClose={closePopup}
      icon={<Info className="h-5 w-5" />}
      title={activeMessage.title}
      message={activeMessage.body}
      actions={
        <div className="flex items-center justify-end gap-2">
          {ctaLabel && ctaUrl && ctaUrl.startsWith('/') && (
            <Link href={ctaUrl} onClick={closePopup} className={cn(buttonVariants({ size: 'sm' }))}>
              {ctaLabel}
            </Link>
          )}
          <Button size="sm" variant="outline" onClick={closePopup}>
            {dismissLabel}
          </Button>
        </div>
      }
    />
  )
}