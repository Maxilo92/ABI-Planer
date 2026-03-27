'use client'

import Link from 'next/link'
import { Gift } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type GiftNoticeModalProps = {
  totalGiftPacks: number
  titleText?: string
  bodyText?: string
  customMessage?: string
  ctaLabel?: string
  ctaUrl?: string
  dismissLabel?: string
  onDismiss: () => void | Promise<void>
}

export function GiftNoticeModal({
  totalGiftPacks,
  titleText,
  bodyText,
  customMessage,
  ctaLabel,
  ctaUrl,
  dismissLabel,
  onDismiss,
}: GiftNoticeModalProps) {
  const isGift = totalGiftPacks > 0
  const resolvedTitle = titleText?.trim() || (isGift ? 'Überraschung!' : 'Neue Nachricht')
  const resolvedBody = bodyText?.trim() || (totalGiftPacks > 0
    ? `Du hast insgesamt ${totalGiftPacks} zusätzliche Packs erhalten.`
    : 'Du hast eine neue Nachricht erhalten.')
  const resolvedCtaLabel = ctaLabel?.trim() || 'Zu den Packs'
  const resolvedCtaUrl = ctaUrl?.trim() || '/sammelkarten'
  const resolvedDismissLabel = dismissLabel?.trim() || 'Gelesen'

  const handleCtaClick = () => {
    void onDismiss()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-full bg-primary/10 p-4 text-primary animate-bounce">
            <Gift className="size-10" />
          </div>
          <DialogHeader className="gap-1 items-center">
            <DialogTitle className="text-2xl font-bold">{resolvedTitle}</DialogTitle>
            <DialogDescription className="text-base">
              {resolvedBody}
            </DialogDescription>
          </DialogHeader>
          {customMessage && (
            <div className="rounded-lg bg-muted/50 p-3 italic text-sm text-muted-foreground w-full">
              &quot;{customMessage}&quot;
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Link
            href={resolvedCtaUrl}
            onClick={handleCtaClick}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
          >
            {resolvedCtaLabel}
          </Link>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onDismiss()}
            className="w-full sm:w-auto"
          >
            {resolvedDismissLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
