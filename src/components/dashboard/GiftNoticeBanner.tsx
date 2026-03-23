'use client'

import Link from 'next/link'
import { Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UniversalBanner } from '@/components/layout/UniversalBanner'

type GiftNoticeBannerProps = {
  totalGiftPacks: number
  titleText?: string
  bodyText?: string
  customMessage?: string
  ctaLabel?: string
  ctaUrl?: string
  dismissLabel?: string
  onDismiss?: () => void | Promise<void>
  className?: string
}

export function GiftNoticeBanner({
  totalGiftPacks,
  titleText,
  bodyText,
  customMessage,
  ctaLabel,
  ctaUrl,
  dismissLabel,
  onDismiss,
  className,
}: GiftNoticeBannerProps) {
  if (totalGiftPacks <= 0) return null

  const resolvedTitle = titleText?.trim() || 'Neue Pack-Schenkung'
  const resolvedBody = bodyText?.trim() || `Du hast insgesamt ${totalGiftPacks} zusätzliche Packs erhalten.`
  const resolvedCtaLabel = ctaLabel?.trim() || 'Zu den Packs'
  const resolvedCtaUrl = ctaUrl?.trim() || '/sammelkarten'
  const resolvedDismissLabel = dismissLabel?.trim() || 'Gelesen'

  return (
    <UniversalBanner
      tone="success"
      layout="floating"
      className={`fixed z-[95] right-4 bottom-20 w-[min(24rem,calc(100vw-2rem))] ${className ?? ''}`}
      icon={<Gift className="h-4 w-4" />}
      title={resolvedTitle}
      message={
        <div className="space-y-1">
          <p>{resolvedBody}</p>
          {customMessage && <p className="text-xs italic">{customMessage}</p>}
          <Link href={resolvedCtaUrl} className="inline-flex text-xs font-semibold hover:underline">
            {resolvedCtaLabel}
          </Link>
        </div>
      }
      actions={
        onDismiss ? (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={onDismiss}>
              {resolvedDismissLabel}
            </Button>
          </div>
        ) : undefined
      }
    />
  )
}