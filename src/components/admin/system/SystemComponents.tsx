'use client'

import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { motion, type Variants } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import type { FeatureStatus, SystemAnalyticsTimelinePoint, SystemAnalyticsActionStat } from '@/types/system'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

export function FeatureStatusToggle({
  label,
  description,
  icon,
  status,
  onStatusChange,
}: {
  label: string
  description: string
  icon: ReactNode
  status: FeatureStatus | undefined
  onStatusChange: (status: FeatureStatus) => void
}) {
  const currentStatus = status || 'enabled'

  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-black uppercase tracking-tight truncate">{label}</p>
        </div>
        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-3">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'disabled', label: 'Gesperrt', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
            { id: 'admins_only', label: 'Nur Admins', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
            { id: 'enabled', label: 'Aktiv', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => onStatusChange(s.id as FeatureStatus)}
              className={cn(
                'px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all',
                currentStatus === s.id
                  ? s.color
                  : 'bg-secondary text-muted-foreground border-transparent hover:border-border'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function renderAnimatedWordNodes(
  node: ReactNode,
  wordVariants: Variants,
  keyPrefix: string = 'word'
): ReactNode {
  if (typeof node === 'string') {
    return node.split(/(\s+)/).map((token, index) => {
      if (!token) return null
      if (/^\s+$/.test(token)) return token

      return (
        <motion.span key={`${keyPrefix}-${index}`} variants={wordVariants} className="inline-block">
          {token}
        </motion.span>
      )
    })
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => renderAnimatedWordNodes(child, wordVariants, `${keyPrefix}-${index}`))
  }

  if (isValidElement(node)) {
    const element = node as React.ReactElement<any>
    const animatedChildren = renderAnimatedWordNodes(element.props?.children, wordVariants, `${keyPrefix}-child`)
    return cloneElement(element, { ...element.props }, animatedChildren)
  }

  return node
}

export function AnimatedWordFlow({
  children,
  wordVariants,
}: {
  children: ReactNode
  wordVariants: Variants
}) {
  return <>{renderAnimatedWordNodes(children, wordVariants)}</>
}

export function PieChart({ data, labelKey, valueKey }: { data: any[], labelKey: string, valueKey: string }) {
  const chartData = {
    labels: data.map(d => d[labelKey]),
    datasets: [{
      data: data.map(d => d[valueKey]),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(100, 116, 139, 0.8)',
      ],
      borderWidth: 0,
    }]
  }

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#64748b',
          font: { size: 10, weight: 600 },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    }
  }

  return (
    <div className="h-full w-full">
      <Pie data={chartData} options={options} />
    </div>
  )
}

export function StatCard({ title, value, subValue, icon, loading, statusMode = false }: any) {
  return (
    <Card className="border-2 shadow-sm overflow-hidden h-full">
      <CardContent className="p-4 flex items-center justify-between gap-3 h-full">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest truncate" title={title}>{title}</p>
          {loading ? (
            <div className="h-7 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <p className={cn("text-lg sm:text-xl font-black uppercase tracking-tighter break-words leading-tight", statusMode && value === 'Wartung' ? 'text-red-700' : '')}>
              {value}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground font-medium truncate" title={subValue}>{subValue}</p>
        </div>
        <div className="p-2 sm:p-2.5 bg-muted/50 rounded-xl border shrink-0">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

type ChartPoint = SystemAnalyticsTimelinePoint | SystemAnalyticsActionStat

export function LineChart({ data, valueKey, labelKey, emptyLabel }: { data: ChartPoint[], valueKey: 'actions' | 'count' | 'active_users', labelKey: 'label' | 'action', emptyLabel: string }) {
  if (!data.length) {
    return <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>
  }

  const points = data.map((entry) => {
    const record = entry as unknown as Record<string, unknown>
    return {
      label: String(record[labelKey] ?? ''),
      value: Number(record[valueKey]) || 0,
    }
  })

  const maxValue = Math.max(...points.map((entry) => entry.value), 1)
  const total = points.reduce((sum, point) => sum + point.value, 0)

  const chartData = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: 'Wert',
        data: points.map((point) => point.value),
        borderColor: '#0f172a',
        backgroundColor: 'rgba(15, 23, 42, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
      },
    ],
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 116, 139, 0.15)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="h-44">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Eintraege</p>
          <p className="font-black text-base">{points.length}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Summe</p>
          <p className="font-black text-base">{Math.round(total * 10) / 10}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Peak</p>
          <p className="font-black text-base">{Math.round(maxValue * 10) / 10}</p>
        </div>
      </div>

      <div className="space-y-2">
        {points.slice(0, 6).map((point) => (
          <div key={`${point.label}-${point.value}`} className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-tighter">
            <span className="truncate">{point.label}</span>
            <span className="text-muted-foreground">{Math.round(point.value * 10) / 10}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BarChart({ data, valueKey, labelKey, emptyLabel }: { data: ChartPoint[], valueKey: 'actions' | 'count', labelKey: 'label' | 'action', emptyLabel: string }) {
  if (!data.length) {
    return <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>
  }

  const points = data.map((entry) => {
    const record = entry as unknown as Record<string, unknown>
    return {
      label: String(record[labelKey] ?? ''),
      value: Number(record[valueKey]) || 0,
    }
  })

  const maxValue = Math.max(...points.map((entry) => entry.value), 1)
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const chartHeight = Math.max(240, points.length * 28)

  const chartData = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: 'Wert',
        data: points.map((point) => point.value),
        borderRadius: 6,
        borderSkipped: false,
        minBarLength: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        hoverBackgroundColor: 'rgba(15, 23, 42, 1)',
      },
    ],
  }

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        displayColors: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 116, 139, 0.15)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          autoSkip: false,
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-3">
        <div style={{ height: `${chartHeight}px` }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Eintraege</p>
          <p className="font-black text-base">{points.length}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Summe</p>
          <p className="font-black text-base">{Math.round(total * 10) / 10}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-muted-foreground uppercase tracking-tighter">Peak</p>
          <p className="font-black text-base">{Math.round(maxValue * 10) / 10}</p>
        </div>
      </div>

      <div className="space-y-2">
        {points.slice(0, 6).map((point) => (
          <div key={`${point.label}-${point.value}`} className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-tighter">
            <span className="truncate">{point.label}</span>
            <span className="text-muted-foreground">{Math.round(point.value * 10) / 10}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function formatDurationMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m'

  const rounded = Math.round(minutes)
  const hours = Math.floor(rounded / 60)
  const remainder = rounded % 60

  if (hours <= 0) return `${remainder}m`
  if (remainder <= 0) return `${hours}h`
  return `${hours}h ${remainder}m`
}

export function ToggleRow({ label, description, icon, enabled, onToggle, critical = false }: any) {
  const isEnabled = Boolean(enabled)

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-2xl border-2 transition-all gap-4",
      isEnabled ? "bg-card border-muted" : "bg-muted/20 border-dashed border-red-200 opacity-80",
      critical && !isEnabled ? "bg-red-50 border-red-500 ring-4 ring-red-500/10" : ""
    )}>
      <div className="flex gap-3 items-center min-w-0 flex-1">
        <div className={cn("p-2 rounded-lg shrink-0", isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-black uppercase tracking-tight truncate", critical && !isEnabled ? "text-red-900" : "")} title={label}>{label}</p>
          <p className={cn("text-[9px] line-clamp-1 text-muted-foreground", critical && !isEnabled ? "text-red-800/80 font-medium" : "")} title={description}>{description}</p>
        </div>
      </div>
      <div className="shrink-0">
        <Switch 
          checked={isEnabled}
          onCheckedChange={onToggle}
          className={cn(critical && "data-[state=checked]:bg-red-600")}
        />
      </div>
    </div>
  )
}
