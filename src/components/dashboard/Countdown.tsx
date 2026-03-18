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
    <Card className="w-full">
      <CardHeader className="pb-2">
        {editButton && (
          <div className="flex justify-end mb-1">
            {editButton}
          </div>
        )}
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Countdown zum Ball
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col p-2 bg-secondary rounded-lg">
            <span className="text-2xl md:text-3xl font-bold">{days}</span>
            <span className="text-[10px] md:text-xs uppercase text-muted-foreground">Tage</span>
          </div>
          <div className="flex flex-col p-2 bg-secondary rounded-lg">
            <span className="text-2xl md:text-3xl font-bold">{hours}</span>
            <span className="text-[10px] md:text-xs uppercase text-muted-foreground">Std</span>
          </div>
          <div className="flex flex-col p-2 bg-secondary rounded-lg">
            <span className="text-2xl md:text-3xl font-bold">{minutes}</span>
            <span className="text-[10px] md:text-xs uppercase text-muted-foreground">Min</span>
          </div>
          <div className="flex flex-col p-2 bg-secondary rounded-lg">
            <span className="text-2xl md:text-3xl font-bold">{seconds}</span>
            <span className="text-[10px] md:text-xs uppercase text-muted-foreground">Sek</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 pt-2 border-t text-muted-foreground min-h-[20px]">
          {mounted ? (
            <>
              <Calendar className="h-3 w-3" />
              <span className="text-[10px] md:text-xs font-medium italic">
                {formattedDate}
              </span>
            </>
          ) : (
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
