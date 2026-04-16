'use client'

import React, { TouchEvent, useRef, useState } from 'react'
import { X, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SystemMessage, SystemMessagePriority, SystemMessageAction } from '@/types/systemMessages'

interface BannerMessageProps {
  message: SystemMessage
  onClose: () => void
}

const toneStyles: Record<SystemMessagePriority, { container: string; iconWrap: string; title: string; message: string }> = {
  critical: {
    container: 'border-destructive/40 bg-destructive/10 dark:bg-destructive/20',
    iconWrap: 'bg-destructive/15 text-destructive',
    title: 'text-destructive',
    message: 'text-foreground/90',
  },
  high: {
    container: 'border-orange-500/40 bg-orange-500/10 dark:bg-orange-500/20',
    iconWrap: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
    title: 'text-orange-700 dark:text-orange-300',
    message: 'text-foreground/90',
  },
  warning: {
    container: 'border-yellow-500/40 bg-yellow-500/10 dark:bg-yellow-500/20',
    iconWrap: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
    title: 'text-yellow-700 dark:text-yellow-300',
    message: 'text-foreground/90',
  },
  info: {
    container: 'border-border bg-card/95 backdrop-blur-md',
    iconWrap: 'bg-primary/10 text-primary',
    title: 'text-foreground',
    message: 'text-muted-foreground',
  },
}

const priorityIcons: Record<SystemMessagePriority, React.ReactNode> = {
  critical: <AlertCircle className="h-4 w-4" />,
  high: <AlertCircle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
}

export function BannerMessage({ message, onClose }: BannerMessageProps) {
  const styles = toneStyles[message.priority]
  const icon = priorityIcons[message.priority]
  const [pendingActionIndex, setPendingActionIndex] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (message.isDismissible === false) return
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
    touchStartY.current = event.changedTouches[0]?.clientY ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (message.isDismissible === false) return
    if (touchStartX.current === null || touchStartY.current === null) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current
    const deltaX = endX - touchStartX.current
    const deltaY = Math.abs(endY - touchStartY.current)

    touchStartX.current = null
    touchStartY.current = null

    // Swipe horizontal (more than 70px) and not too much vertical (less than 60px) closes the banner.
    if (Math.abs(deltaX) > 70 && deltaY < 60) {
      onClose()
    }
  }

  const runAction = async (action: SystemMessageAction, index: number) => {
    if (pendingActionIndex !== null || action.disabled) return

    setActionError(null)

    if (action.href) {
      if (action.closeOnClick !== false) {
        onClose()
      }
      window.location.href = action.href
      return
    }

    setPendingActionIndex(index)
    try {
      await action.onClick?.()
      if (action.closeOnClick !== false) {
        onClose()
      }
    } catch (error) {
      console.error('Banner action failed:', error)
      setActionError(error instanceof Error ? error.message : 'Aktion konnte nicht ausgeführt werden.')
    } finally {
      setPendingActionIndex(null)
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'rounded-2xl border p-4 shadow-lg transition-all animate-in slide-in-from-top-4 duration-500',
        'active:scale-[0.98] select-none',
        styles.container
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 rounded-full p-2.5 shrink-0 shadow-sm', styles.iconWrap)}>
          {icon}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('text-sm font-black uppercase tracking-tight', styles.title)}>{message.title}</h4>
            {message.isDismissible !== false && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="h-7 w-7 -mr-1.5 -mt-1.5 opacity-50 hover:opacity-100 bg-white/10 dark:bg-black/10 rounded-full"
                onClick={onClose}
                disabled={pendingActionIndex !== null}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Schließen</span>
              </Button>
            )}
          </div>

          <div className={cn('text-[13px] sm:text-sm leading-relaxed font-medium', styles.message)}>{message.content}</div>

          {message.actions && message.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.actions.map((action, idx) => (
                <ActionComponent
                  key={`${message.id}-action-${idx}`}
                  action={action}
                  priority={message.priority}
                  isPending={pendingActionIndex === idx}
                  hasPendingAction={pendingActionIndex !== null}
                  onRun={() => void runAction(action, idx)}
                />
              ))}
            </div>
          )}

          {actionError && (
            <p className="text-xs text-destructive font-medium pt-1">{actionError}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionComponent({
  action,
  priority,
  isPending,
  hasPendingAction,
  onRun,
}: {
  action: SystemMessageAction;
  priority: SystemMessagePriority;
  isPending: boolean;
  hasPendingAction: boolean;
  onRun: () => void;
}) {
  const defaultVariant = priority === 'critical' ? 'destructive' : 'outline'
  const variant = action.variant || defaultVariant

  return (
    <Button 
      variant={variant} 
      size="xs" 
      className="px-3 py-1 font-bold text-[11px] uppercase tracking-wider"
      onClick={onRun}
      disabled={action.disabled || hasPendingAction}
    >
      {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {action.label}
    </Button>
  )
}
