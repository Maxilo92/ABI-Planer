'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'

interface FundingStatusProps {
  current: number
  goal: number
}

export function FundingStatus({ current, goal }: FundingStatusProps) {
  const [mounted, setHydrated] = useState(false)
  const [ticketSales, setTicketSales] = useState(150)
  
  useEffect(() => {
    setHydrated(true)
  }, [])

  const safeGoal = Math.max(goal, 1)
  const percentage = Math.min(Math.round((current / safeGoal) * 100), 100)
  const remaining = Math.max(0, goal - current)
  const estimatedPrice = ticketSales > 0 ? remaining / ticketSales : 0
  
  // Safe formatting that won't cause hydration mismatch
  const formatCurrency = (val: number, decimals: number = 0) => {
    if (!mounted) return `${val.toFixed(decimals)} €` // Fallback for server
    return val.toLocaleString('de-DE', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    })
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
        <div className="space-y-6">
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
          </div>

          <div className="pt-4 border-t space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="tickets" className="text-xs text-muted-foreground">Erwartete Ticketverkäufe</Label>
                <Input 
                  id="tickets"
                  type="number"
                  value={ticketSales}
                  onChange={(e) => setTicketSales(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 h-8 text-sm"
                  min="1"
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Geschätzter Ticketpreis</p>
                <p className="text-xl font-bold text-primary" suppressHydrationWarning>
                  {formatCurrency(estimatedPrice, 2)}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic leading-tight">
              Der Ticketpreis berechnet sich aus dem restlichen Finanzierungsziel ({formatCurrency(remaining)}) geteilt durch die Anzahl der erwarteten Verkäufe.
            </p>
          </div>
          
          <p className="text-[10px] md:text-xs text-muted-foreground text-center italic opacity-70">
            Das Ziel bildet eure geplanten Ausgaben ab. Einnahmen reduzieren den noch offenen Betrag.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
