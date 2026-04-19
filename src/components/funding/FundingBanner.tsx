'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, DollarSign, Sparkles } from 'lucide-react'
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
    <Card id={bannerId} className={cn('border-brand/15 bg-card/95 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur-md overflow-hidden', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3 sm:space-y-4">
            {title && (
              <div className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                {title}
              </div>
            )}

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground" suppressHydrationWarning>
                {formatMoney(current)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium" suppressHydrationWarning>
                von {formatMoney(goal)}
              </div>
              <div className="ml-auto sm:ml-0 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand">
                {progress}%
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-2.5 sm:h-3 overflow-hidden rounded-full bg-muted shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand via-emerald-400 to-emerald-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className={cn('text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground transition-all duration-300', collapsed && 'hidden')}>
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 lg:justify-end">
            <Button asChild className="flex-1 sm:flex-none h-10 sm:h-11 rounded-xl px-4 sm:px-6 font-bold shadow-lg shadow-brand/20 active:scale-95 transition-transform">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 border-brand/20 hover:bg-brand/5"
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
          className={cn('border-t border-border/60 pt-4 mt-4 animate-in slide-in-from-top-2 duration-300', collapsed && 'hidden')}
        >
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
            Dieser Pool ist strikt von eurer Abikasse getrennt. Während eure Beiträge hier die technische Infrastruktur (Server, Hosting, Domain) sichern, fließen alle regulären Einnahmen und direkten Spenden zu 100% in euer Budget für Abiball und Events.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}