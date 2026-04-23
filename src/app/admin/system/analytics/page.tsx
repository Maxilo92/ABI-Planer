'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ArrowLeftRight, Sparkles, 
  MessageSquare, Clock, TrendingUp,
  LineChart as LineChartIcon, BarChart3,
  PieChart as PieChartIcon, Activity, Users, History,
  UserPlus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminSystem } from '@/components/admin/AdminSystemContext'
import { StatCard, ChartCard, formatDurationMinutes } from '@/components/admin/system/SystemComponents'

export default function AdminSystemAnalytics() {
  const { 
    stats, 
    analytics, 
    loadingData, 
    cardsByUser,
    loadingCardsByUser,
    analyticsWindowDays,
    setAnalyticsWindowDays
  } = useAdminSystem()

  const averageSessionLabel = useMemo(() => {
    if (!analytics || analytics.average_session_minutes <= 0) return 'Keine Daten'
    return formatDurationMinutes(analytics.average_session_minutes)
  }, [analytics])

  const rarityData = useMemo(() => {
    if (!stats?.rarity_distribution) return []
    return Object.entries(stats.rarity_distribution)
      .filter(([_, count]) => count > 0)
      .map(([rarity, count]) => ({
        label: rarity.toUpperCase(),
        value: count
      }))
      .sort((a, b) => (b.value as number) - (a.value as number))
  }, [stats?.rarity_distribution])

  const tradesData = useMemo(() => {
    if (!stats) return []
    return [
      { label: 'Aktiv', value: stats.active_trades_count || 0 },
      { label: 'Abgeschlossen', value: stats.completed_trades_count || 0 }
    ].filter(d => d.value > 0)
  }, [stats])

  const activityByWeekday = useMemo(() => {
    if (!analytics?.activity_timeline) return []
    
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    const weekdayCounts = new Array(7).fill(0).map((_, i) => ({ 
      label: weekdays[i], 
      actions: 0,
      users: new Set<string>() 
    }))

    analytics.activity_timeline.forEach(point => {
      const date = new Date(point.date)
      const day = date.getDay()
      weekdayCounts[day].actions += point.actions
    })

    // Reorder to start with Monday (standard in DE)
    const mondayFirst = [...weekdayCounts.slice(1), weekdayCounts[0]]
    return mondayFirst
  }, [analytics?.activity_timeline])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border-2 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            System-Analytics
          </h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Zeitraum: {analyticsWindowDays} Tage • {analytics?.total_log_entries || 0} Events erfasst
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { label: '24h', value: 1 },
            { label: '7d', value: 7 },
            { label: '30d', value: 30 },
            { label: '90d', value: 90 }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setAnalyticsWindowDays(period.value)}
              className={cn(
                "flex-1 sm:flex-none px-2 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                analyticsWindowDays === period.value ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Aktive Trades"
          value={stats?.active_trades_count || 0}
          subValue={`${stats?.completed_trades_count || 0} abgeschlossen`}
          icon={<ArrowLeftRight className="w-5 h-5 text-purple-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Karten"
          value={stats?.total_cards_count || 0}
          subValue="Im Umlauf"
          icon={<Sparkles className="w-5 h-5 text-blue-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Nutzer"
          value={stats?.total_users || 0}
          subValue={`${stats?.online_users_count || 0} online`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          loading={loadingData}
        />
        <StatCard
          title="News"
          value={stats?.news_count || 0}
          subValue="Einträge"
          icon={<MessageSquare className="w-5 h-5 text-blue-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Umfragen"
          value={stats?.polls_count || 0}
          subValue="Gesamt"
          icon={<PieChartIcon className="w-5 h-5 text-amber-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Ø Session"
          value={averageSessionLabel}
          subValue="Alle Nutzer"
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          loading={loadingData}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="App-Wachstum"
          description="Kumulierte Nutzerzahlen über den Zeitraum."
          icon={<UserPlus className="w-4 h-4 text-emerald-500" />}
          data={analytics?.registration_timeline || []}
          labelKey="label"
          valueKey="cumulative"
          datasetLabel="Gesamt-Nutzer"
          yLabel="Nutzeranzahl"
          colorScheme="emerald"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Nutzungs-Intensität"
          description="Aktionen über den gewählten Zeitraum."
          icon={<Activity className="w-4 h-4 text-blue-500" />}
          data={analytics?.activity_timeline || []}
          labelKey="label"
          valueKey="actions"
          datasetLabel="Events/Tag"
          yLabel="Anzahl Aktionen"
          colorScheme="blue"
        />

        <ChartCard
          title="Aktive Nutzer"
          description="Eindeutige Nutzer pro Tag."
          icon={<Users className="w-4 h-4 text-emerald-500" />}
          data={analytics?.activity_timeline || []}
          labelKey="label"
          valueKey="active_users"
          datasetLabel="Nutzer/Tag"
          yLabel="Nutzeranzahl"
          colorScheme="emerald"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Top-Aktionen"
          description="Häufigste Log-Events im System."
          icon={<TrendingUp className="w-4 h-4 text-violet-500" />}
          data={analytics?.top_actions || []}
          labelKey="action"
          valueKey="count"
          datasetLabel="Häufigkeit"
          yLabel="Vorkommen"
          colorScheme="violet"
          defaultType="bar"
        />

        <ChartCard
          title="Bereichs-Nutzung"
          description="Verteilung der Aktivitäten auf Module."
          icon={<PieChartIcon className="w-4 h-4 text-amber-500" />}
          data={analytics?.section_usage || []}
          labelKey="section"
          valueKey="count"
          datasetLabel="Aktionen"
          colorScheme="amber"
          defaultType="pie"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Aktivität nach Uhrzeit"
          description="Durchschnittliche Lastverteilung (Stunden)."
          icon={<Clock className="w-4 h-4 text-orange-500" />}
          data={(analytics?.activity_by_hour || []).map(h => ({ hour: `${h.hour}:00`, count: h.actions }))}
          labelKey="hour"
          valueKey="count"
          datasetLabel="Aktionen"
          yLabel="Anzahl Aktionen"
          colorScheme="orange"
          defaultType="bar"
        />

        <ChartCard
          title="Aktivität nach Wochentag"
          description="Verteilung über die Woche (kumuliert)."
          icon={<BarChart3 className="w-4 h-4 text-rose-500" />}
          data={activityByWeekday.map(w => ({ day: w.label, count: w.actions }))}
          labelKey="day"
          valueKey="count"
          datasetLabel="Aktionen"
          yLabel="Anzahl Aktionen"
          colorScheme="rose"
          defaultType="bar"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Karten-Raritäten"
          description="Verteilung aller Lehrer-Karten."
          icon={<Sparkles className="w-4 h-4 text-blue-500" />}
          data={rarityData}
          labelKey="label"
          valueKey="value"
          datasetLabel="Kartenanzahl"
          colorScheme="blue"
          defaultType="pie"
        />

        <ChartCard
          title="Session-Dauer"
          description="Verteilung der Nutzersitzungen."
          icon={<History className="w-4 h-4 text-emerald-500" />}
          data={(analytics?.session_duration_distribution || []).map(d => ({ range: d.range, count: d.count }))}
          labelKey="range"
          valueKey="count"
          datasetLabel="Anzahl Sessions"
          yLabel="Sitzungen"
          colorScheme="emerald"
          defaultType="pie"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Aktivste Nutzer"
          description="Top 10 Nutzer nach Log-Einträgen."
          icon={<Users className="w-4 h-4 text-purple-500" />}
          data={(analytics?.top_active_users || []).map(u => ({ name: u.name || u.user_id.slice(0, 8), count: u.action_count }))}
          labelKey="name"
          valueKey="count"
          datasetLabel="Aktionen"
          yLabel="Anzahl Aktionen"
          colorScheme="purple"
          defaultType="bar"
        />

        <ChartCard
          title="Top Sammler"
          description="Top 12 Nutzer nach Kartenanzahl."
          icon={<Sparkles className="w-4 h-4 text-amber-500" />}
          data={cardsByUser}
          labelKey="label"
          valueKey="value"
          datasetLabel="Karten"
          yLabel="Kartenanzahl"
          colorScheme="amber"
          defaultType="bar"
          emptyLabel={loadingCardsByUser ? 'Lade Sammler-Statistiken...' : 'Keine Sammler-Daten.'}
        />
      </div>
    </div>
  )
}
