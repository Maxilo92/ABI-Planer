'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState, useEffect } from 'react'
import { AlertCircle, Info, TrendingUp, User as UserIcon } from 'lucide-react'
import { Profile, Settings } from '@/types/database'
import { calculateTicketPenalty } from '@/lib/finance-utils'

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
  breakdown?: {
    label: string
    amount: number
    color: string
  }[]
  profile?: Profile | null
  settings?: Settings | null
}

export function FundingStatus({
  current,
  goal,
  checksum,
  initialTicketSales = 150,
  onTicketSalesChange,
  canEditTicketSales,
  isAuthenticated,
  loading,
  breakdown,
  profile,
  settings
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
  
  // 1. Calculated needed price to reach goal exactly
  const neededPrice = ticketSales > 0 ? remaining / ticketSales : 0
  
  // 1.1 Participation Penalty Calculation
  const { currentPenalty } = calculateTicketPenalty(profile || null, settings || null)
  const individualPrice = neededPrice + currentPenalty

  // 2. Projected outcome with planned price
  const projectedTicketIncome = ticketSales * neededPrice
  const projectedFinalBalance = displayCurrent + projectedTicketIncome
  const projectedDiff = projectedFinalBalance - goal

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

  // Calculate segments for the progress bar
  const segments = breakdown && breakdown.length > 0 ? breakdown.map(item => ({
    ...item,
    width: (item.amount / safeGoal) * 100
  })) : []

  // If checksum is higher than sum of breakdown, add an "unallocated" segment
  const sumBreakdown = breakdown ? breakdown.reduce((acc, item) => acc + item.amount, 0) : 0
  if (checksum && checksum > sumBreakdown) {
    segments.push({
      label: 'Sonstiges/Prüfsumme',
      amount: checksum - sumBreakdown,
      color: 'bg-muted-foreground/30',
      width: ((checksum - sumBreakdown) / safeGoal) * 100
    })
  } else if (current > sumBreakdown) {
    segments.push({
      label: 'Unzugeordnet',
      amount: current - sumBreakdown,
      color: 'bg-muted-foreground/30',
      width: ((current - sumBreakdown) / safeGoal) * 100
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
            {segments.length > 0 ? (
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex" aria-label="Finanzierungsfortschritt">
                {segments.map((segment, idx) => (
                  <div 
                    key={idx}
                    className={`h-full ${segment.color} transition-all duration-500`}
                    style={{ width: `${segment.width}%` }}
                    title={`${segment.label}: ${formatCurrency(segment.amount)}`}
                  />
                ))}
              </div>
            ) : (
              <Progress
                value={percentage}
                className="h-3"
                aria-valuetext={`${percentage}%`}
              />
            )}
            {segments.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {segments.filter(s => s.width > 1).map((segment, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${segment.color}`} />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {segment.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="pt-3 border-t space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tickets" className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Tickets (Erw.)</Label>
                  {ticketSalesEditable ? (
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
                      className="w-full h-8 text-[13px] border-brand/30 focus-visible:ring-brand/40"
                      min="0"
                    />
                  ) : (
                    <p className="text-sm font-bold text-foreground">{ticketSales.toLocaleString('de-DE')}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="price" className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">UVP Preis</Label>
                  <div className="h-8 flex items-center">
                    <p className="text-sm font-bold text-foreground" suppressHydrationWarning>{formatCurrency(neededPrice, 2)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {profile && (
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col justify-center">
                    <p className="text-[9px] uppercase font-bold text-primary tracking-wider mb-0.5">Dein Ticketpreis</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-sm font-black text-foreground" suppressHydrationWarning>
                        {formatCurrency(individualPrice, 2)}
                      </p>
                      {currentPenalty > 0 && (
                        <p className="text-[9px] text-destructive font-bold truncate">
                          (+{formatCurrency(currentPenalty, 0)})
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-brand/5 border border-brand/20 flex flex-col justify-center">
                  <p className="text-[9px] uppercase font-bold text-brand tracking-wider mb-0.5">Ziel-Budget</p>
                  <p className="text-sm font-black text-foreground" suppressHydrationWarning>
                    {formatCurrency(projectedFinalBalance, 2)}
                  </p>
                </div>
              </div>

              {projectedDiff !== 0 && (
                <div className={`p-2.5 rounded-xl border ${projectedDiff >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Prognose Diff.</p>
                    <p className={`text-[11px] font-black ${projectedDiff >= 0 ? 'text-success' : 'text-destructive'}`} suppressHydrationWarning>
                      {projectedDiff > 0 ? '+' : ''}{formatCurrency(projectedDiff, 2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-4 border-t space-y-2 text-center">
              <p className="text-xs text-muted-foreground font-medium">
                Melde dich an, um den aktuellen Kassenstand und Details zur Finanzierung zu sehen.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
