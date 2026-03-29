'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'

const TICKET_SALES_SAVE_DEBOUNCE_MS = 500

interface FundingStatusProps {
  current: number
  goal: number
  initialTicketSales?: number
  onTicketSalesChange?: (value: number) => void
  isAuthenticated: boolean
  loading?: boolean
}

export function FundingStatus({
  current,
  goal,
  initialTicketSales = 150,
  onTicketSalesChange,
  isAuthenticated,
  loading
}: FundingStatusProps) {
  const [mounted, setHydrated] = useState(false)
  const [ticketSalesInput, setTicketSalesInput] = useState(String(initialTicketSales))
  
  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    setTicketSalesInput(String(initialTicketSales))
  }, [initialTicketSales])

  useEffect(() => {
    if (!onTicketSalesChange) return
    if (ticketSalesInput === '') return

    // Don't call onTicketSalesChange if the value hasn't changed from the initial prop value
    // This avoids redundant logAction calls on mount
    if (Number(ticketSalesInput) === initialTicketSales) return

    const timeoutId = window.setTimeout(() => {
      onTicketSalesChange(Number(ticketSalesInput))
    }, TICKET_SALES_SAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [ticketSalesInput, onTicketSalesChange, initialTicketSales])

  const ticketSales = ticketSalesInput === '' ? 0 : Number(ticketSalesInput)

  if (loading) {
    return (
      <Card className="w-full h-full border-none shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-8" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-20 mb-1" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="text-right flex flex-col items-end">
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-4/5" />
              </div>
            </div>
            
            <Skeleton className="h-3 w-48 mx-auto" />
          </div>
        </CardContent>
      </Card>
    )
  }

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
    <Card className="w-full h-full border-none shadow-card">
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
                {isAuthenticated ? formatCurrency(current) : '???,?? €'}
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

          {isAuthenticated ? (
            <div className="pt-4 border-t space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="tickets" className="text-xs text-muted-foreground">Erwartete Ticketverkäufe</Label>
                  <Input 
                    id="tickets"
                    type="number"
                    value={ticketSalesInput}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^\d*$/.test(value)) {
                        setTicketSalesInput(value)
                      }
                    }}
                    className="w-24 h-8 text-sm"
                    min="0"
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
                Der Ticketpreis berechnet sich aus dem noch offenen Betrag ({formatCurrency(remaining)}), um das Ziel von {formatCurrency(goal)} zu erreichen, geteilt durch die Anzahl der erwarteten Verkäufe.
              </p>
            </div>
          ) : (
            <div className="pt-4 border-t space-y-2 text-center">
              <p className="text-xs text-muted-foreground font-medium">
                Melde dich an, um den aktuellen Kassenstand und Details zur Finanzierung zu sehen.
              </p>
            </div>
          )}
          
          <p className="text-[10px] md:text-xs text-muted-foreground text-center italic opacity-70">
            Das Ziel bildet euer angestrebtes Budget ab. Einnahmen bilden den aktuellen Stand.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
