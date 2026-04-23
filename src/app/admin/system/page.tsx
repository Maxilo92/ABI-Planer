'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Activity, Users, Sparkles, 
  Megaphone, AlertTriangle,
  RefreshCw, CheckCircle2, BarChart2,
  History, LayoutDashboard,
  Copy, Download, Check
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAdminSystem } from '@/components/admin/AdminSystemContext'
import { StatCard, AnimatedWordFlow, formatDurationMinutes, ProgressBar, MarkdownTypewriter } from '@/components/admin/system/SystemComponents'
import { toast } from 'sonner'

export default function AdminSystemOverview() {
  const { 
    stats, 
    analytics, 
    aiSummary, 
    aiSummaryLoading, 
    aiSummaryError, 
    aiSummaryMeta, 
    aiProgress,
    aiStep,
    dailyBriefing,
    dailyBriefingLoading,
    dailyBriefingError,
    dailyBriefingMeta,
    loadingData, 
    isMaintenanceActive,
    maintenance,
    loadData,
    generateAISummary
  } = useAdminSystem()

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!aiSummary) return
    try {
      await navigator.clipboard.writeText(aiSummary)
      setCopied(true)
      toast.success('Bericht in Zwischenablage kopiert')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Fehler beim Kopieren')
    }
  }

  const handleDownload = () => {
    if (!aiSummary) return
    const blob = new Blob([aiSummary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ABI-Planer-Lagebericht-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Download gestartet')
  }

  const averageSessionLabel = useMemo(() => {
    if (!analytics || analytics.average_session_minutes <= 0) return 'Keine Daten'
    return formatDurationMinutes(analytics.average_session_minutes)
  }, [analytics])

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {(dailyBriefing || dailyBriefingLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative"
          >
            <div className={cn(
              "p-4 rounded-2xl border-2 shadow-lg transition-all",
              dailyBriefingLoading ? "bg-muted animate-pulse" : "bg-gradient-to-br from-primary/10 via-background to-background border-primary/20"
            )}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-xl text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black uppercase tracking-tighter leading-none">KI Wachwaechter-Briefing</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Tagesaktuelle System-Analyse</p>
                  </div>
                </div>

                {!dailyBriefingLoading && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full hover:bg-primary/10 text-muted-foreground"
                    onClick={() => generateAISummary('briefing', true)}
                    title="Briefing aktualisieren"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {dailyBriefingLoading ? (
                <div className="py-2 space-y-2">
                  <div className="h-3 w-3/4 bg-primary/10 rounded" />
                  <div className="h-3 w-1/2 bg-primary/10 rounded" />
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold leading-relaxed text-foreground/90 prose-p:my-1 prose-headings:text-sm prose-headings:font-black prose-headings:uppercase prose-headings:mt-3 prose-headings:mb-1">
                    <MarkdownTypewriter text={dailyBriefing || ''} speed={10} />
                  </div>
                  
                  {dailyBriefingMeta && (
                    <div className="mt-3 pt-2 border-t border-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] uppercase font-black py-0 h-4 px-1.5 opacity-60">
                          {dailyBriefingMeta.model}
                        </Badge>
                        {dailyBriefingMeta.isCached && (
                          <Badge variant="secondary" className="text-[8px] uppercase font-black py-0 h-4 px-1.5 opacity-60 bg-muted/50">
                            Gespeichert
                          </Badge>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">
                        {dailyBriefingMeta.generatedAt ? new Date(dailyBriefingMeta.generatedAt).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto lg:min-w-[26rem]">
          <Button variant="outline" onClick={() => loadData()} disabled={loadingData} className="w-full font-bold uppercase tracking-tight h-12 text-xs sm:text-sm whitespace-nowrap">
            <RefreshCw className={cn("w-4 h-4 mr-2", loadingData && "animate-spin")} />
            Daten aktualisieren
          </Button>
          <Button onClick={() => generateAISummary('full')} disabled={aiSummaryLoading || loadingData || !stats || !analytics} className="w-full font-bold uppercase tracking-tight h-12 text-xs sm:text-sm whitespace-nowrap">
            <Sparkles className={cn('w-4 h-4 mr-2', aiSummaryLoading && 'animate-pulse')} />
            KI-Bericht
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          title="Aktuell online"
          value={analytics?.current_online_users_count || 0}
          subValue={`Ø ${averageSessionLabel} Session`}
          icon={<Activity className="w-5 h-5 text-emerald-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Benutzer gesamt"
          value={stats?.total_users || 0}
          subValue="Registrierte Profile"
          icon={<Users className="w-5 h-5 text-blue-500" />}
          loading={loadingData}
        />
        <StatCard
          title="News / Posts"
          value={stats?.news_count || 0}
          subValue="Alle Ankündigungen"
          icon={<Megaphone className="w-5 h-5 text-amber-500" />}
          loading={loadingData}
        />
        <StatCard
          title="Umfragen"
          value={stats?.polls_count || 0}
          subValue="Gesamtanzahl"
          icon={<BarChart2 className="w-5 h-5 text-violet-500" />}
          loading={loadingData}
        />
        <StatCard
          title="System Status"
          value={isMaintenanceActive ? 'Wartung' : 'Online'}
          subValue="Zustand"
          icon={isMaintenanceActive ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          loading={loadingData || !maintenance}
          statusMode
        />
      </div>

      <AnimatePresence>
        {(aiSummaryLoading || aiSummary || aiSummaryError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-2 mb-8 bg-primary/5 border-primary/20 shadow-xl shadow-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="uppercase tracking-tighter font-black flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    KI Lagebericht
                  </CardTitle>
                  <CardDescription>Strategische Analyse der aktuellen Dashboard-Kennzahlen.</CardDescription>
                </div>
                
                <div className="flex items-center gap-1">
                  {aiSummary && !aiSummaryLoading && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground"
                        onClick={handleCopy}
                        title="Kopieren"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground"
                        onClick={handleDownload}
                        title="Download als .txt"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground"
                    onClick={() => generateAISummary('full')}
                    title="Neu generieren"
                  >
                    <RefreshCw className={cn("w-4 h-4", aiSummaryLoading && "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <AnimatePresence mode="wait">
                  {aiSummaryLoading ? (
                    <motion.div
                      key="ai-summary-loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-lg border border-dashed border-primary/30 py-10 px-6 text-center space-y-4"
                    >
                      <div className="relative inline-block">
                        <Sparkles className="w-10 h-10 text-primary/40 mx-auto animate-pulse" />
                        <motion.div 
                          className="absolute -top-1 -right-1"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <div className="w-3 h-3 bg-primary rounded-full blur-[2px]" />
                        </motion.div>
                      </div>
                      
                      <div className="space-y-2 max-w-xs mx-auto">
                        <ProgressBar progress={aiProgress} />
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary/60">
                          <p className="truncate mr-2">{aiStep}</p>
                          <p>{aiProgress}%</p>
                        </div>
                      </div>
                      
                      <p className="text-xs font-bold text-muted-foreground">
                        KI analysiert Kennzahlen und Trends...
                      </p>
                    </motion.div>
                  ) : aiSummary ? (
                    <motion.div
                      key={aiSummaryMeta?.generatedAt || aiSummary}
                      initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(4px)' }}
                      transition={{
                        type: 'spring',
                        damping: 15,
                        stiffness: 100,
                        mass: 0.8,
                        opacity: { duration: 0.4 },
                      }}
                      className="space-y-4"
                    >
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-2 prose-strong:font-extrabold prose-li:my-0.5 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h1:font-black prose-h1:uppercase prose-h1:tracking-tighter"
                      >
                        <MarkdownTypewriter text={aiSummary || ''} speed={15} />
                      </div>
                      {(aiSummaryMeta?.generatedAt || aiSummaryMeta?.model) && (
                        <div className="flex items-center gap-2 pt-4 border-t border-primary/10">
                          <Badge variant="outline" className="text-[9px] uppercase font-black py-0 bg-background/50">
                            {aiSummaryMeta?.model || 'AI Analysis'}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                            {aiSummaryMeta?.generatedAt ? `Generiert: ${new Date(aiSummaryMeta.generatedAt).toLocaleString('de-DE')}` : ''}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : aiSummaryError ? (
                    <motion.div
                      key="ai-summary-error"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold uppercase tracking-tight text-xs mb-1">Fehler bei der Analyse</p>
                        <p className="opacity-90">{aiSummaryError}</p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
            <History className="w-5 h-5 text-primary" />
            Letzte Aktivitäten
          </CardTitle>
          <CardDescription>Echtzeit-Ansicht der aktuellsten Log-Einträge.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b uppercase font-black tracking-widest text-muted-foreground">
                  <th className="px-2 py-3">Zeitpunkt</th>
                  <th className="px-2 py-3">Nutzer</th>
                  <th className="px-2 py-3">Aktion</th>
                  <th className="px-2 py-3">Bereich</th>
                  <th className="px-2 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(analytics?.recent_actions || []).map((action) => (
                  <tr key={action.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(action.timestamp).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-2 py-3 font-bold truncate max-w-[120px]" title={action.user_name || action.user_id}>
                      {action.user_name || 'System'}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="outline" className="text-[9px] uppercase font-black py-0">
                        {action.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="secondary" className="text-[9px] uppercase font-black py-0">
                        {action.section}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground truncate max-w-[200px]" title={action.details}>
                      {action.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
