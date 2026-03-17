'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useState, useEffect } from 'react'

interface FundingStatusProps {
  current: number
  goal: number
}

export function FundingStatus({ current, goal }: FundingStatusProps) {
  const [mounted, setHydrated] = useState(false)
  
  useEffect(() => {
    setHydrated(true)
  }, [])

  const percentage = Math.min(Math.round((current / goal) * 100), 100)
  
  // Safe formatting that won't cause hydration mismatch
  const formatCurrency = (val: number) => {
    if (!mounted) return `${val} €` // Fallback for server
    return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex justify-between">
          <span>Finanzierungsziel</span>
          <span>{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-2xl md:text-3xl font-bold" suppressHydrationWarning>
              {formatCurrency(current)}
            </span>
            <span className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>
              von {formatCurrency(goal)}
            </span>
          </div>
          {/* Explicitly set aria-valuetext to avoid hydration mismatch from auto-generated values */}
          <Progress 
            value={percentage} 
            className="h-3" 
            aria-valuetext={`${percentage}%`}
          />
          <p className="text-[10px] md:text-xs text-muted-foreground text-center italic">
            Zusammen schaffen wir das! Jede Einnahme zählt.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
