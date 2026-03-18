'use client'

import { useCountdown } from '@/hooks/useCountdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import { toDate } from '@/lib/utils'

interface CountdownProps {
  targetDate: string
  editButton?: React.ReactNode
}

export function Countdown({ targetDate, editButton }: CountdownProps) {
  const [mounted, setMounted] = useState(false)
  const { days, hours, minutes, seconds } = useCountdown(targetDate)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const formattedDate = targetDate 
    ? format(toDate(targetDate), "EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de }) 
    : 'Noch kein Datum festgelegt'

  return (
    <Card className="w-full relative overflow-hidden border border-border/70">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -right-8 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">
              Naechster Meilenstein
            </p>
            <CardTitle className="text-lg md:text-xl font-extrabold tracking-tight">
              Countdown zum ABI-Ball
            </CardTitle>
          </div>
          {editButton && <div className="shrink-0">{editButton}</div>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3 text-center">
          <div className="rounded-xl border border-border/60 bg-secondary/70 px-2 py-3 md:py-4 shadow-sm">
            <span className="block text-3xl md:text-4xl font-black tracking-tight tabular-nums">{days}</span>
            <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-muted-foreground">Tage</span>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/70 px-2 py-3 md:py-4 shadow-sm">
            <span className="block text-3xl md:text-4xl font-black tracking-tight tabular-nums">{hours}</span>
            <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-muted-foreground">Std</span>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/70 px-2 py-3 md:py-4 shadow-sm">
            <span className="block text-3xl md:text-4xl font-black tracking-tight tabular-nums">{minutes}</span>
            <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-muted-foreground">Min</span>
          </div>

          <div className="relative rounded-xl border border-primary/30 bg-primary/10 px-2 py-3 md:py-4 shadow-sm">
            <span className="block text-3xl md:text-4xl font-black tracking-tight tabular-nums">{seconds}</span>
            <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-muted-foreground">Sek</span>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-muted-foreground min-h-[36px]">
          {mounted ? (
            <>
              <Calendar className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium italic text-center">
                {formattedDate}
              </span>
            </>
          ) : (
            <div className="h-4 w-40 bg-muted animate-pulse rounded" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
