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
    <Card className="w-full relative overflow-hidden bg-gray-50 border-gray-200">
      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">
              Nächster Meilenstein
            </p>
            <CardTitle className="text-lg md:text-xl font-extrabold tracking-tight text-gray-900">
              Countdown zum ABI-Ball
            </CardTitle>
          </div>
          {editButton && <div className="shrink-0">{editButton}</div>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <div className="grid grid-cols-4 gap-2 md:gap-3 text-center">
          {/* Base Flip-Clock Box Style - Light Theme */}
          <div className="bg-gray-200 rounded-lg shadow-inner p-0.5">
            <div className="relative h-full w-full bg-white rounded-[inherit] py-3 md:py-4">
              <span className="block text-3xl md:text-4xl font-black text-gray-800 tracking-tighter tabular-nums">{days}</span>
              <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-gray-500">Tage</span>
              {/* Removed divider line */}
            </div>
          </div>

          <div className="bg-gray-200 rounded-lg shadow-inner p-0.5">
            <div className="relative h-full w-full bg-white rounded-[inherit] py-3 md:py-4">
              <span className="block text-3xl md:text-4xl font-black text-gray-800 tracking-tighter tabular-nums">{hours}</span>
              <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-gray-500">Std</span>
              {/* Removed divider line */}
            </div>
          </div>

          <div className="bg-gray-200 rounded-lg shadow-inner p-0.5">
            <div className="relative h-full w-full bg-white rounded-[inherit] py-3 md:py-4">
              <span className="block text-3xl md:text-4xl font-black text-gray-800 tracking-tighter tabular-nums">{minutes}</span>
              <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-gray-500">Min</span>
              {/* Removed divider line */}
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg shadow-inner p-0.5">
            <div className="relative h-full w-full bg-white rounded-[inherit] py-3 md:py-4">
              <span className="block text-3xl md:text-4xl font-black text-primary tracking-tighter tabular-nums">{seconds}</span>
              <span className="block mt-1 text-[10px] md:text-xs uppercase tracking-[0.14em] text-primary/80">Sek</span>
              {/* Removed divider line */}
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-100/80 px-3 py-2.5 text-gray-600 min-h-[36px]">
          {mounted ? (
            <>
              <Calendar className="h-4 w-4" />
              <span className="text-xs md:text-sm font-semibold text-center">
                {formattedDate}
              </span>
            </>
          ) : (
            <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
