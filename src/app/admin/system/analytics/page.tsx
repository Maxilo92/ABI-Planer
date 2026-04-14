'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ArrowLeftRight, Sparkles, 
  MessageSquare, Clock, TrendingUp,
  LineChart as LineChartIcon, BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminSystem } from '@/components/admin/AdminSystemContext'
import { StatCard, LineChart, BarChart, PieChart, formatDurationMinutes } from '@/components/admin/system/SystemComponents'

export default function AdminSystemAnalytics() {
  const { 
    stats, 
    analytics, 
    loadingData, 
    cardsByUser,
    loadingCardsByUser
  } = useAdminSystem()

  const [activityChartMode, setActivityChartMode] = useState<'actions' | 'users'>('actions')

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
                <LineChartIcon className="w-5 h-5 text-blue-500" />
                Aktive Nutzung
              </CardTitle>
              <CardDescription>Aktivität der letzten 7 Tage.</CardDescription>
            </div>
            <div className="flex bg-muted p-1 rounded-lg shrink-0">
              <button
                onClick={() => setActivityChartMode('actions')}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                  activityChartMode === 'actions' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Aktionen
              </button>
              <button
                onClick={() => setActivityChartMode('users')}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                  activityChartMode === 'users' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Nutzer
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={analytics?.activity_timeline || []} 
              valueKey={activityChartMode === 'actions' ? 'actions' : 'active_users'} 
              labelKey="label" 
              emptyLabel="Noch keine Aktivität erfasst." 
            />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Top-Aktionen
            </CardTitle>
            <CardDescription>Häufigste Log-Events.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={analytics?.top_actions || []} valueKey="count" labelKey="action" emptyLabel="Noch keine Logs vorhanden." />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <Clock className="w-5 h-5 text-blue-500" />
              Aktivität nach Uhrzeit
            </CardTitle>
            <CardDescription>Durchschnittliche Lastverteilung.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={(analytics?.activity_by_hour || []).map(h => ({ action: `${h.hour}:00`, count: h.actions }))} 
              valueKey="count" 
              labelKey="action" 
              emptyLabel="Keine stündlichen Daten vorhanden." 
            />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Aktivität nach Wochentag
            </CardTitle>
            <CardDescription>Verteilung über die Woche.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={activityByWeekday.map(w => ({ action: w.label, count: w.actions }))} 
              valueKey="count" 
              labelKey="action" 
              emptyLabel="Keine Wochentags-Daten vorhanden." 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <PieChartIcon className="w-5 h-5 text-amber-500" />
              Karten-Raritäten
            </CardTitle>
            <CardDescription>Verteilung im gesamten System.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart data={rarityData} labelKey="label" valueKey="value" />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <ArrowLeftRight className="w-5 h-5 text-violet-500" />
              Tausch-Status
            </CardTitle>
            <CardDescription>Aktive vs. Abgeschlossene Trades.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart data={tradesData} labelKey="label" valueKey="value" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Aktivste Nutzer (Top 10)
            </CardTitle>
            <CardDescription>Nutzer mit den meisten Aktionen.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={(analytics?.top_active_users || []).map(u => ({ action: u.name || u.user_id.slice(0, 8), count: u.action_count }))} 
              valueKey="count" 
              labelKey="action" 
              emptyLabel="Keine Nutzerdaten vorhanden." 
            />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Karten pro Nutzer
            </CardTitle>
            <CardDescription>Top 12 Sammler.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={cardsByUser.map((entry) => ({ action: entry.label, count: entry.value }))}
              valueKey="count"
              labelKey="action"
              emptyLabel={loadingCardsByUser ? 'Lade Kartenstatistik...' : 'Keine Kartenstatistik verfuegbar.'}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <PieChartIcon className="w-5 h-5 text-violet-500" />
              Bereichsnutzung
            </CardTitle>
            <CardDescription>Verteilung der Aktivität.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart data={analytics?.section_usage || []} labelKey="section" valueKey="count" />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <Clock className="w-5 h-5 text-orange-500" />
              Session-Dauer Verteilung
            </CardTitle>
            <CardDescription>Dauer der Nutzersitzungen.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart 
              data={(analytics?.session_duration_distribution || []).map(d => ({ section: d.range, count: d.count }))} 
              labelKey="section" 
              valueKey="count" 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
