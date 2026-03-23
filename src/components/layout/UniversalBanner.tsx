'use client'

import { ReactNode, TouchEvent, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type BannerTone = 'primary' | 'success' | 'info' | 'danger'
type BannerLayout = 'inline' | 'floating'

const toneStyles: Record<BannerTone, { container: string; iconWrap: string; title: string; message: string }> = {
  primary: {
    container: 'border-primary/25 bg-primary/5',
    iconWrap: 'bg-primary/10 text-primary',
    title: 'text-foreground',
    message: 'text-muted-foreground',
  },
  success: {
    container: 'border-emerald-400/40 bg-emerald-500/10',
    iconWrap: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    title: 'text-emerald-700 dark:text-emerald-300',
    message: 'text-foreground/90',
  },
  info: {
    container: 'border-border bg-card/95',
    iconWrap: 'bg-primary/10 text-primary',
    title: 'text-foreground',
    message: 'text-muted-foreground',
  },
  danger: {
    container: 'border-destructive/40 bg-destructive/10',
    iconWrap: 'bg-destructive/15 text-destructive',
    title: 'text-destructive',
    message: 'text-foreground/90',
  },
}

interface UniversalBannerProps {
  title: ReactNode
  message: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  onClose?: () => void
  tone?: BannerTone
  layout?: BannerLayout
  className?: string
}

export function UniversalBanner({
  title,
  message,
  icon,
  actions,
  onClose,
  tone = 'info',
  layout = 'inline',
  className,
}: UniversalBannerProps) {
  const styles = toneStyles[tone]
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (layout !== 'floating' || !onClose) return
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
    touchStartY.current = event.changedTouches[0]?.clientY ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (layout !== 'floating' || !onClose) return
    if (touchStartX.current === null || touchStartY.current === null) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current
    const deltaX = endX - touchStartX.current
    const deltaY = Math.abs(endY - touchStartY.current)

    touchStartX.current = null
    touchStartY.current = null

    // Horizontal swipe to the right closes popup notifications.
    if (deltaX > 70 && deltaY < 60) {
      onClose()
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'rounded-xl border p-4',
        styles.container,
        layout === 'floating' && 'backdrop-blur-sm shadow-2xl animate-in slide-in-from-bottom-6 duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn('mt-0.5 rounded-full p-2 shrink-0', styles.iconWrap)}>
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn('text-sm font-bold', styles.title)}>{title}</h4>
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1 opacity-70 hover:opacity-100"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className={cn('text-sm leading-relaxed', styles.message)}>{message}</div>

          {actions && <div className="pt-1.5">{actions}</div>}
        </div>
      </div>
    </div>
  )
}