'use client'

import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinanceEntry, ShopEarning, Settings } from '@/types/database'
import { toDate } from '@/modules/shared/date'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  format, 
  subMonths, 
  startOfYear, 
  isAfter, 
  isBefore, 
  addDays, 
  differenceInDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  setYear, 
  setMonth,
  getYear,
  getMonth,
  addWeeks,
  addMonths as addMonthsDateFns,
  addYears,
  isSameDay
} from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, TrendingUp, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface FinanceChartProps {
  finances: FinanceEntry[]
  shopEarnings: ShopEarning[]
  settings: Settings | null
  loading?: boolean
}

type ViewMode = 'week' | 'month' | 'year'

export function FinanceChart({ finances, shopEarnings, settings, loading }: FinanceChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [referenceDate, setReferenceDate] = useState(new Date())

  const { startDate, endDate, predictionDays } = useMemo(() => {
    let start: Date
    let end: Date
    let pred: number

    switch (viewMode) {
      case 'week':
        start = startOfWeek(referenceDate, { weekStartsOn: 1 }) // Monday
        end = endOfWeek(referenceDate, { weekStartsOn: 1 }) // Sunday
        pred = 7
        break
      case 'month':
        start = startOfMonth(referenceDate)
        end = endOfMonth(referenceDate)
        pred = 30
        break
      case 'year':
        start = startOfYear(referenceDate)
        end = endOfMonth(setMonth(referenceDate, 11)) // Dec 31
        pred = 90
        break
    }
    return { startDate: start, endDate: end, predictionDays: pred }
  }, [viewMode, referenceDate])

  const navigate = (direction: number) => {
    switch (viewMode) {
      case 'week': setReferenceDate(prev => addWeeks(prev, direction)); break
      case 'month': setReferenceDate(prev => addMonthsDateFns(prev, direction)); break
      case 'year': setReferenceDate(prev => addYears(prev, direction)); break
    }
  }

  const chartData = useMemo(() => {
    if (loading || !finances) return null

    // 1. Combine all transactions
    const allTransactions = [
      ...finances.map(f => ({
        date: toDate(f.entry_date),
        amount: Number(f.amount)
      })),
      ...shopEarnings.map(s => ({
        date: toDate(s.processed_at || s.id.split('_')[0]),
        amount: Number(s.abi_share_eur)
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    if (allTransactions.length === 0) return null

    // 2. Calculate balance at startDate
    let runningTotal = allTransactions
      .filter(t => isBefore(t.date, startDate))
      .reduce((sum, t) => sum + t.amount, 0)

    // 3. Daily map for the visible range (only needed for day views, but we precalculate)
    const dailyData: Record<string, number> = {}
    allTransactions
      .filter(t => !isBefore(t.date, startDate) && !isAfter(t.date, endDate))
      .forEach(t => {
        const key = format(t.date, 'yyyy-MM-dd')
        dailyData[key] = (dailyData[key] || 0) + t.amount
      })

    // 4. Generate Timeline
    const labels: string[] = []
    const values: (number | null)[] = []
    const now = new Date()
    now.setHours(0,0,0,0)

    const ballDate = settings?.ball_date ? toDate(settings.ball_date) : addDays(now, 180)
    const lastVisible = new Date(endDate)
    lastVisible.setHours(0,0,0,0)

    if (viewMode === 'year') {
      let currentMonth = new Date(startDate)
      currentMonth.setDate(1)
      currentMonth.setHours(0,0,0,0)

      while (!isAfter(currentMonth, lastVisible)) {
        const mStart = new Date(currentMonth)
        const mEnd = endOfMonth(currentMonth)
        
        const monthSum = allTransactions
          .filter(t => !isBefore(t.date, mStart) && !isAfter(t.date, mEnd))
          .reduce((sum, t) => sum + t.amount, 0)
          
        runningTotal += monthSum

        const isCurrentMonth = getMonth(currentMonth) === getMonth(now) && getYear(currentMonth) === getYear(now)
        labels.push(isCurrentMonth ? 'HEUTE' : format(currentMonth, 'MMM', { locale: de }))
        
        if (isAfter(mStart, endOfMonth(now))) {
          values.push(null)
        } else {
          values.push(runningTotal)
        }
        
        currentMonth = addMonthsDateFns(currentMonth, 1)
      }
    } else {
      let current = new Date(startDate)
      current.setHours(0,0,0,0)
      
      while (!isAfter(current, lastVisible)) {
        const key = format(current, 'yyyy-MM-dd')
        runningTotal += (dailyData[key] || 0)

        const isToday = isSameDay(current, now)
        labels.push(isToday ? 'HEUTE' : format(current, 'dd.MM.', { locale: de }))
        
        if (!isAfter(current, now)) {
          values.push(runningTotal)
        } else {
          values.push(null)
        }

        current = addDays(current, 1)
      }
    }

    // 5. Smart Prediction logic
    // Calculate absolute current balance at 'now'
    const currentBalance = allTransactions.filter(t => !isAfter(t.date, now)).reduce((sum, t) => sum + t.amount, 0)

    const getSlope = (days: number) => {
      const cutoff = addDays(now, -days)
      const gained = allTransactions
        .filter(t => !isAfter(t.date, now) && !isBefore(t.date, cutoff))
        .reduce((sum, t) => sum + t.amount, 0)
      return gained / days
    }

    let blendedSlope = 0
    if (allTransactions.length > 0) {
      const firstTx = allTransactions[0].date
      // Use at least 7 days denominator to prevent extreme spikes from single-day first deposits
      const daysSinceFirst = Math.max(7, differenceInDays(now, firstTx))
      const allTimeSlope = currentBalance / daysSinceFirst

      if (daysSinceFirst < 30) {
        // Not enough history for short/long term blending, use smoothed all-time
        blendedSlope = allTimeSlope
      } else {
        const shortTermSlope = getSlope(30)
        const longTermSlope = getSlope(90)
        
        if (longTermSlope > 0) {
          // Weighted blend: 50% last month, 30% last 3 months, 20% all-time baseline
          blendedSlope = (shortTermSlope * 0.5) + (longTermSlope * 0.3) + (allTimeSlope * 0.2)
        } else {
          // Stagnant phase (no income in 90 days): conservative all-time projection
          blendedSlope = allTimeSlope * 0.3
        }
      }
    }
    
    // Ensure we don't predict negative growth towards an ABI goal
    blendedSlope = Math.max(0, blendedSlope)

    const predictionValues: (number | null)[] = new Array(labels.length).fill(null)
    
    let projectedDate: Date | null = null
    const fundingGoal = settings?.funding_goal || 10000

    // Absolute Target Date Calculation (independent of chart view)
    if (blendedSlope > 0) {
      const remaining = fundingGoal - currentBalance
      if (remaining > 0) {
        const daysNeeded = Math.ceil(remaining / blendedSlope)
        if (daysNeeded > 0 && daysNeeded < 3650) { // Max 10 years
          projectedDate = addDays(now, daysNeeded)
        }
      } else {
        projectedDate = now // Goal already reached
      }
    }

    // Chart Prediction Line Generation
    if (blendedSlope > 0 || currentBalance > 0) {
      if (viewMode === 'year') {
        let currentMonth = new Date(startDate)
        currentMonth.setDate(1)
        currentMonth.setHours(0,0,0,0)
        
        for (let i = 0; i < labels.length; i++) {
          const isPastOrCurrentMonth = !isAfter(currentMonth, endOfMonth(now))
          const isCurrentMonth = getMonth(currentMonth) === getMonth(now) && getYear(currentMonth) === getYear(now)
          
          if (isCurrentMonth) {
            // For HEUTE, connect exactly to the actual value
            predictionValues[i] = values[i] !== null ? values[i] : currentBalance
          } else if (!isPastOrCurrentMonth) {
            // Future months: predict continuously from today
            const daysFromNow = differenceInDays(currentMonth, now)
            predictionValues[i] = currentBalance + (blendedSlope * Math.max(0, daysFromNow))
          }
          currentMonth = addMonthsDateFns(currentMonth, 1)
        }
      } else {
        let current = new Date(startDate)
        current.setHours(0,0,0,0)

        for (let i = 0; i < labels.length; i++) {
          const isToday = isSameDay(current, now)
          const isPast = isBefore(current, now)
          
          if (isToday) {
            predictionValues[i] = values[i] !== null ? values[i] : currentBalance
          } else if (!isPast) {
            const daysFromNow = differenceInDays(current, now)
            predictionValues[i] = currentBalance + (blendedSlope * Math.max(0, daysFromNow))
          }
          current = addDays(current, 1)
        }
      }
    }

    return {
      labels,
      projectedDate,
      datasets: [
        {
          label: 'Kontostand',
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: viewMode === 'year' ? 0.3 : 0.2,
          pointRadius: viewMode === 'year' ? 4 : 0,
          pointHoverRadius: 6,
          borderWidth: 3,
          spanGaps: false
        },
        {
          label: 'Prognose',
          data: predictionValues,
          borderColor: '#3b82f6',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          fill: false,
          tension: viewMode === 'year' ? 0.3 : 0,
          pointRadius: viewMode === 'year' ? 4 : 0,
          pointHoverRadius: 0,
          borderWidth: 2,
        }
      ]
    }
  }, [finances, shopEarnings, startDate, endDate, viewMode, loading])

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#fff',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: any[]) => {
            const item = items[0]
            if (item.label === 'HEUTE') return `Heute (${format(new Date(), 'dd.MM.yyyy')})`
            return item.label
          },
          label: (context: any) => {
            const value = context.parsed.y as number | null
            if (value === null) return ''
            return ` ${context.dataset.label}: ${value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
          font: {
            size: 10,
            weight: (ctx: any) => ctx.tick?.label === 'HEUTE' ? 'bold' : 'normal'
          },
          color: (ctx: any) => ctx.tick?.label === 'HEUTE' ? '#3b82f6' : '#6b7280'
        }
      },
      y: {
        grace: '10%',
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          font: {
            size: 10
          },
          callback: (value) => {
            const val = Number(value)
            // If values are small, show more decimals to prevent repeated labels
            const decimals = val < 5 && val > -5 ? 2 : 0
            return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals, minimumFractionDigits: decimals })
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  return (
    <Card className="overflow-hidden border-none shadow-card">
      <CardHeader className="flex flex-col space-y-4 pb-4 sm:pb-7">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Entwicklung</span>
            </CardTitle>
            <p className="hidden sm:block text-xs text-muted-foreground">Historischer Verlauf und Prognose</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-fit">
              <TabsList className="h-7 sm:h-8 bg-muted/50 p-0.5 sm:p-1">
                <TabsTrigger value="week" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 h-6">Woche</TabsTrigger>
                <TabsTrigger value="month" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 h-6">Monat</TabsTrigger>
                <TabsTrigger value="year" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 h-6">Jahr</TabsTrigger>
              </TabsList>
            </Tabs>
            {chartData?.projectedDate && (
              <p className="text-[9px] sm:text-[10px] font-medium text-warning bg-warning/5 px-2 py-0.5 rounded-full border border-warning/10 whitespace-nowrap">
                Ziel-Erreichung: {format(chartData.projectedDate, 'dd.MM.yyyy', { locale: de })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 bg-muted/30 p-1 sm:p-1.5 rounded-xl border border-border/40">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1.5 px-1 sm:px-2 min-w-[80px] sm:min-w-[120px] justify-center">
              <CalendarIcon className="hidden xs:block h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
                {viewMode === 'week' && `KW ${format(startDate, 'w')}`}
                {viewMode === 'month' && format(startDate, 'MMM yy', { locale: de })}
                {viewMode === 'year' && format(startDate, 'yyyy')}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => navigate(1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 sm:h-8 text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-2 sm:px-3 text-primary hover:bg-primary/5"
            onClick={() => setReferenceDate(new Date())}
            disabled={isSameDay(referenceDate, new Date())}
          >
            Heute
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-1 sm:px-2">
        <div className="h-[280px] w-full">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/20" />
            </div>
          ) : chartData ? (
            <Line data={chartData as any} options={options} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground italic text-sm">
              Keine Daten für diesen Zeitraum vorhanden.
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-blue-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Verlauf</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-blue-500" />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Prognose</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
