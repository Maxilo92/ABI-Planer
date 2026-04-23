'use client'

import { Children, cloneElement, isValidElement, type ReactNode, useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { motion, type Variants } from 'framer-motion'
import { 
  LineChart as LineChartIcon, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Users,
  Clock,
  ArrowLeftRight,
  MessageSquare,
  Sparkles,
  TrendingUp,
  History
} from 'lucide-react'
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

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut'

interface UniversalChartProps {
  data: any[]
  labelKey: string
  valueKey: string
  datasetLabel?: string
  xLabel?: string
  yLabel?: string
  type?: ChartType
  title?: string
  height?: number
  emptyLabel?: string
  colorScheme?: 'blue' | 'emerald' | 'purple' | 'amber' | 'violet' | 'orange' | 'rose'
  showLegend?: boolean
  showGrid?: boolean
  indexAxis?: 'x' | 'y'
}

export function UniversalChart({
  data,
  labelKey,
  valueKey,
  datasetLabel = 'Wert',
  xLabel,
  yLabel,
  type = 'line',
  height = 240,
  emptyLabel = 'Keine Daten vorhanden.',
  colorScheme = 'blue',
  showLegend = true,
  showGrid = true,
  indexAxis = 'x'
}: UniversalChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 px-4 text-center">
        <div className="bg-muted p-3 rounded-full mb-3">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{emptyLabel}</p>
      </div>
    )
  }

  const labels = data.map(d => String(d[labelKey] || ''))
  const values = data.map(d => Number(d[valueKey]) || 0)

  const colors = {
    blue: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', multi: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'] },
    emerald: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', multi: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'] },
    purple: { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', multi: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'] },
    amber: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', multi: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'] },
    violet: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', multi: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'] },
    orange: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', multi: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'] },
    rose: { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', multi: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#fff1f2'] },
  }

  const selectedColor = colors[colorScheme]

  const chartData = {
    labels,
    datasets: [{
      label: datasetLabel,
      data: values,
      borderColor: selectedColor.border,
      backgroundColor: (type === 'pie' || type === 'doughnut') ? 
        [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(100, 116, 139, 0.8)',
        ] : selectedColor.bg,
      borderWidth: type === 'line' ? 3 : 0,
      borderRadius: type === 'bar' ? 6 : 0,
      tension: 0.4,
      fill: type === 'line',
      pointRadius: type === 'line' ? 4 : 0,
      pointHoverRadius: 6,
      pointBackgroundColor: selectedColor.border,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  }

  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          color: '#64748b',
          font: { size: 10, weight: 700 },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: type === 'pie' || type === 'doughnut',
      }
    },
    scales: (type === 'pie' || type === 'doughnut') ? {} : {
      x: {
        beginAtZero: indexAxis === 'y',
        title: {
          display: !!xLabel,
          text: xLabel,
          color: '#64748b',
          font: { size: 10, weight: 800 },
          padding: { top: 10 }
        },
        grid: { 
          display: indexAxis === 'y' ? showGrid : false,
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10, weight: 600 },
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          callback: (value: any) => indexAxis === 'y' && typeof value === 'number' ? (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value) : value
        }
      },
      y: {
        beginAtZero: indexAxis === 'x',
        title: {
          display: !!yLabel,
          text: yLabel,
          color: '#64748b',
          font: { size: 10, weight: 800 },
          padding: { bottom: 10 }
        },
        grid: {
          display: indexAxis === 'x' ? showGrid : false,
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10, weight: 600 },
          callback: (value: any) => indexAxis === 'x' && typeof value === 'number' ? (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value) : value
        }
      }
    }
  }

  return (
    <div style={{ height: `${height}px` }} className="w-full">
      {type === 'line' && <Line data={chartData} options={options} />}
      {type === 'bar' && <Bar data={chartData} options={options} />}
      {type === 'pie' && <Pie data={chartData} options={options} />}
      {type === 'doughnut' && <Pie data={chartData} options={{...options, cutout: '65%'}} />}
    </div>
  )
}

export function ChartCard({
  title,
  description,
  icon,
  data,
  labelKey,
  valueKey,
  datasetLabel,
  xLabel,
  yLabel,
  defaultType = 'line',
  colorScheme = 'blue',
  emptyLabel,
  allowTypeSwitch = true,
  height = 300,
  className
}: {
  title: string
  description: string
  icon?: ReactNode
  data: any[]
  labelKey: string
  valueKey: string
  datasetLabel?: string
  xLabel?: string
  yLabel?: string
  defaultType?: ChartType
  colorScheme?: 'blue' | 'emerald' | 'purple' | 'amber' | 'violet' | 'orange' | 'rose'
  emptyLabel?: string
  allowTypeSwitch?: boolean
  height?: number
  className?: string
}) {
  const [type, setType] = useState<ChartType>(defaultType)

  const stats = useMemo(() => {
    if (!data.length) return null
    const values = data.map(d => Number(d[valueKey]) || 0)
    return {
      peak: Math.max(...values),
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      entries: data.length
    }
  }, [data, valueKey])

  return (
    <Card className={cn("border-2 shadow-sm overflow-hidden flex flex-col", className)}>
      <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && <div className="p-1.5 bg-muted rounded-lg shrink-0">{icon}</div>}
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-tight truncate">{title}</p>
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium line-clamp-1">{description}</p>
        </div>
        
        {allowTypeSwitch && (
          <div className="flex bg-muted p-0.5 sm:p-1 rounded-lg shrink-0 w-fit sm:scale-90 sm:origin-right">
            {(['line', 'bar', 'pie'] as ChartType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "p-1 sm:p-1.5 rounded-md transition-all",
                  type === t ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === 'line' && <LineChartIcon className="w-3.5 h-3.5" />}
                {t === 'bar' && <BarChart3 className="w-3.5 h-3.5" />}
                {t === 'pie' && <PieChartIcon className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex-1">
        <UniversalChart
          data={data}
          labelKey={labelKey}
          valueKey={valueKey}
          datasetLabel={datasetLabel}
          xLabel={xLabel}
          yLabel={yLabel}
          type={type}
          height={height}
          colorScheme={colorScheme}
          emptyLabel={emptyLabel}
        />
      </div>

      {stats && (
        <div className="p-3 bg-muted/30 border-t grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Eintraege</p>
            <p className="text-xs font-bold">{stats.entries}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Summe</p>
            <p className="text-xs font-bold">{Math.round(stats.sum * 10) / 10}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Peak</p>
            <p className="text-xs font-bold">{Math.round(stats.peak * 10) / 10}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

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

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function ProgressBar({ progress, color = 'bg-primary' }: { progress: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn("h-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      />
    </div>
  )
}

export function MarkdownTypewriter({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('')
  
  useEffect(() => {
    if (!text) return
    setDisplayedText('')
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        // Dynamic increment: faster for longer texts
        const increment = text.length > 1000 ? 15 : (text.length > 300 ? 8 : 3)
        setDisplayedText(text.slice(0, i + increment))
        i += increment
      } else {
        setDisplayedText(text)
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {displayedText}
    </ReactMarkdown>
  )
}

export function StatCard({ title, value, subValue, icon, loading, statusMode = false }: any) {
  return (
    <Card className="border-2 shadow-sm overflow-hidden h-full group hover:border-primary/30 transition-colors">
      <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 h-full">
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-widest truncate" title={title}>{title}</p>
          {loading ? (
            <div className="h-6 sm:h-7 w-16 sm:w-20 bg-muted animate-pulse rounded" />
          ) : (
            <p className={cn(
              "text-base sm:text-lg lg:text-xl font-black uppercase tracking-tighter break-words leading-none sm:leading-tight", 
              statusMode && value === 'Wartung' ? 'text-red-700' : ''
            )}>
              {value}
            </p>
          )}
          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate opacity-80" title={subValue}>{subValue}</p>
        </div>
        <div className="p-1.5 sm:p-2.5 bg-muted/50 rounded-lg sm:rounded-xl border shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
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
