'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FundingBannerProps = {
  current: number | null
  goal: number | null
  title: string
  description: string
  ctaHref: string
  ctaLabel: string
  storageKey: string
  bannerId?: string
  className?: string
}

export function FundingBanner({
  current,
  goal,
  title,
  description,
  ctaHref,
  ctaLabel,
  storageKey,
  bannerId,
  className,
}: FundingBannerProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored === '1') {
        setCollapsed(true)
      }
    } catch (error) {
      console.error('Error restoring funding banner state:', error)
    }
  }, [storageKey])

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous
      try {
        window.localStorage.setItem(storageKey, next ? '1' : '0')
      } catch (error) {
        console.error('Error storing funding banner state:', error)
      }
      return next
    })
  }

  const safeCurrent = Math.max(current ?? 0, 0)
  const safeGoal = Math.max(goal ?? 1, 1)
  const progress = Math.min(Math.round((safeCurrent / safeGoal) * 100), 100)

  const formatMoney = (value: number | null) => {
    if (value === null) return '—'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card id={bannerId} className={cn('border-brand/15 bg-card/95 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur-md', className)}>
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand">
              <DollarSign className="h-3.5 w-3.5" />
              {title}
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground" suppressHydrationWarning>
                {formatMoney(current)}
              </div>
              <div className="pb-1 text-sm text-muted-foreground" suppressHydrationWarning>
                von {formatMoney(goal)}
              </div>
              <div className="pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                {progress}% erreicht
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                <span>Fortschritt</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand via-emerald-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className={cn('max-w-3xl text-sm md:text-base leading-relaxed text-muted-foreground transition-all duration-300', collapsed && 'hidden md:block md:max-h-0 md:overflow-hidden')}>
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button asChild className="h-11 rounded-xl px-5 font-bold shadow-sm shadow-brand/20">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-controls={`${storageKey}-details`}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div
          id={`${storageKey}-details`}
          className={cn('border-t border-border/60 px-0 pt-4 mt-4', collapsed && 'hidden')}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Der aktuelle Stand wird regelmäßig aktualisiert. Direkte Überweisungen landen vollständig in der Abikasse.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}