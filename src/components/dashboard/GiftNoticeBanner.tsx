'use client'

import Link from 'next/link'
import { Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UniversalBanner } from '@/components/layout/UniversalBanner'

type GiftNoticeBannerProps = {
  totalGiftPacks: number
  customMessage?: string
  onDismiss?: () => void | Promise<void>
  className?: string
}

export function GiftNoticeBanner({
  totalGiftPacks,
  customMessage,
  onDismiss,
  className,
}: GiftNoticeBannerProps) {
  if (totalGiftPacks <= 0) return null

  return (
    <UniversalBanner
      tone="success"
      layout="floating"
      className={`fixed z-[95] left-4 right-4 bottom-20 md:left-auto md:right-6 md:top-20 md:bottom-auto md:max-w-md ${className ?? ''}`}
      icon={<Gift className="h-4 w-4" />}
      title="Neue Pack-Schenkung"
      message={
        <div className="space-y-1">
          <p>Du hast insgesamt {totalGiftPacks} zusätzliche Packs erhalten.</p>
          {customMessage && <p className="text-xs italic">{customMessage}</p>}
          <Link href="/sammelkarten" className="inline-flex text-xs font-semibold hover:underline">
            Zu den Packs
          </Link>
        </div>
      }
      actions={
        onDismiss ? (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={onDismiss}>
              Gelesen
            </Button>
          </div>
        ) : undefined
      }
    />
  )
}