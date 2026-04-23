'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState, useEffect } from 'react'
import { AlertCircle, Info } from 'lucide-react'

const TICKET_SALES_SAVE_DEBOUNCE_MS = 500

interface FundingStatusProps {
  current: number
  goal: number
  checksum?: number | null
  initialTicketSales?: number
  onTicketSalesChange?: (value: number) => void
  canEditTicketSales?: boolean
  isAuthenticated: boolean
  loading?: boolean
}

export function FundingStatus({
  current,
  goal,
  checksum,
  initialTicketSales = 150,
  onTicketSalesChange,
  canEditTicketSales,
  isAuthenticated,
  loading
}: FundingStatusProps) {
  const [mounted, setHydrated] = useState(false)
  const [ticketSalesInput, setTicketSalesInput] = useState(String(initialTicketSales))
  const ticketSalesEditable = canEditTicketSales ?? !!onTicketSalesChange
  
  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    setTicketSalesInput(String(initialTicketSales))
  }, [initialTicketSales])

  useEffect(() => {
    if (!ticketSalesEditable || !onTicketSalesChange) return
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
  }, [ticketSalesInput, onTicketSalesChange, initialTicketSales, ticketSalesEditable])

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

  const displayCurrent = Math.max(current, checksum || 0)
  const safeGoal = Math.max(goal, 1)
  const percentage = Math.min(Math.round((displayCurrent / safeGoal) * 100), 100)
  const remaining = Math.max(0, goal - displayCurrent)
  const estimatedPrice = ticketSales > 0 ? remaining / ticketSales : 0
  
  const hasChecksum = checksum !== undefined && checksum !== null
  const isDiffSignificant = hasChecksum && Math.abs(current - checksum!) > 0.01

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
              <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-bold" suppressHydrationWarning>
                  {isAuthenticated ? formatCurrency(displayCurrent) : '???,?? €'}
                </span>
                {isAuthenticated && isDiffSignificant && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-warning hover:text-warning/80 transition-colors">
                        <AlertCircle className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          Abweichung festgestellt
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Der physisch gezählte Kassenbestand ({formatCurrency(checksum!)}) weicht vom rein virtuellen Kontostand ({formatCurrency(current)}) ab.
                        </p>
                        <p className="text-[10px] bg-warning/10 p-2 rounded border border-warning/20 text-warning-foreground italic">
                          Es wird sicherheitshalber der jeweils höhere Betrag für die Zielberechnung verwendet. Bitte prüfe den Finanzverlauf.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
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
              {ticketSalesEditable ? (
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
                      className="w-28 h-8 text-sm border-brand/30 focus-visible:ring-brand/40"
                      min="0"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Geschätzter Ticketpreis</p>
                    <p className="text-xl font-bold text-foreground" suppressHydrationWarning>
                      {formatCurrency(estimatedPrice, 2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Erwartete Ticketverkäufe</p>
                    <p className="text-lg font-bold text-foreground" suppressHydrationWarning>
                      {ticketSales.toLocaleString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Geschätzter Ticketpreis</p>
                    <p className="text-xl font-bold text-foreground" suppressHydrationWarning>
                      {formatCurrency(estimatedPrice, 2)}
                    </p>
                  </div>
                </div>
              )}
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
