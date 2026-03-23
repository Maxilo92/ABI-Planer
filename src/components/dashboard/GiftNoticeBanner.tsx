'use client'

import Link from 'next/link'
import { Gift, Info } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { UniversalBanner } from '@/components/layout/UniversalBanner'
import { cn } from '@/lib/utils'

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
  const isGift = totalGiftPacks > 0
  const resolvedTitle = titleText?.trim() || (isGift ? 'Neue Pack-Schenkung' : 'Neue Nachricht')
  const resolvedBody = bodyText?.trim() || (totalGiftPacks > 0
    ? `Du hast insgesamt ${totalGiftPacks} zusätzliche Packs erhalten.`
    : 'Du hast eine neue Nachricht erhalten.')
  const resolvedCtaLabel = ctaLabel?.trim() || 'Zu den Packs'
  const resolvedCtaUrl = ctaUrl?.trim() || '/sammelkarten'
  const resolvedDismissLabel = dismissLabel?.trim() || 'Gelesen'
  const handleCtaClick = () => {
    if (!onDismiss) return
    void onDismiss()
  }

  return (
    <UniversalBanner
      tone="success"
      layout="floating"
      className={`fixed z-[95] right-4 bottom-4 w-[min(24rem,calc(100vw-2rem))] ${className ?? ''}`}
      icon={isGift ? <Gift className="h-4 w-4" /> : <Info className="h-4 w-4" />}
      title={resolvedTitle}
      message={
        <div className="space-y-1">
          <p>{resolvedBody}</p>
          {customMessage && <p className="text-xs italic">{customMessage}</p>}
        </div>
      }
      actions={
        onDismiss ? (
          <div className="flex justify-end gap-2">
            <Link href={resolvedCtaUrl} onClick={handleCtaClick} className={cn(buttonVariants({ size: 'sm' }))}>
              {resolvedCtaLabel}
            </Link>
            <Button size="sm" variant="outline" onClick={onDismiss}>
              {resolvedDismissLabel}
            </Button>
          </div>
        ) : undefined
      }
    />
  )
}