'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Activity, Users, Sparkles, 
  Megaphone, AlertTriangle,
  RefreshCw, CheckCircle2, BarChart2,
  History, LayoutDashboard
} from 'lucide-react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAdminSystem } from '@/components/admin/AdminSystemContext'
import { StatCard, AnimatedWordFlow, formatDurationMinutes } from '@/components/admin/system/SystemComponents'

export default function AdminSystemOverview() {
  const { 
    stats, 
    analytics, 
    aiSummary, 
    aiSummaryLoading, 
    aiSummaryError, 
    aiSummaryMeta, 
    loadingData, 
    isMaintenanceActive,
    maintenance,
    loadData,
    generateAISummary
  } = useAdminSystem()

  const averageSessionLabel = useMemo(() => {
    if (!analytics || analytics.average_session_minutes <= 0) return 'Keine Daten'
    return formatDurationMinutes(analytics.average_session_minutes)
  }, [analytics])

  const summaryBlockVariants = {
    hidden: { opacity: 0, y: 5, filter: 'blur(2px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.35,
        ease: 'easeOut' as const,
        staggerChildren: 0.04,
        delayChildren: 0.03,
      },
    },
  }

  const summaryWordVariants = {
    hidden: { opacity: 0, y: 4, filter: 'blur(2px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.28, ease: 'easeOut' as const },
    },
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto lg:min-w-[26rem]">
          <Button variant="outline" onClick={loadData} disabled={loadingData} className="w-full font-bold uppercase tracking-tight h-12 text-xs sm:text-sm whitespace-nowrap">
            <RefreshCw className={cn("w-4 h-4 mr-2", loadingData && "animate-spin")} />
            Daten aktualisieren
          </Button>
          <Button onClick={generateAISummary} disabled={aiSummaryLoading || loadingData || !stats || !analytics} className="w-full font-bold uppercase tracking-tight h-12 text-xs sm:text-sm whitespace-nowrap">
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

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="uppercase tracking-tighter font-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            KI Lagebericht
          </CardTitle>
          <CardDescription>On-demand Analyse der aktuellen Dashboard-Daten. Die Antwort wird nicht gespeichert.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence mode="wait">
            {aiSummaryLoading ? (
              <motion.div
                key="ai-summary-loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground"
              >
                KI analysiert aktuelle Kennzahlen...
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
                className="rounded-2xl border-2 p-4 md:p-5 shadow-xl shadow-primary/5 bg-primary/5 border-primary/20 space-y-2"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.15,
                      },
                    },
                  }}
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-3 prose-p:my-2 prose-strong:font-extrabold prose-li:my-0.5"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <motion.h1 variants={summaryBlockVariants}>
                          <AnimatedWordFlow wordVariants={summaryWordVariants}>{children}</AnimatedWordFlow>
                        </motion.h1>
                      ),
                      h2: ({ children }) => (
                        <motion.h2 variants={summaryBlockVariants}>
                          <AnimatedWordFlow wordVariants={summaryWordVariants}>{children}</AnimatedWordFlow>
                        </motion.h2>
                      ),
                      h3: ({ children }) => (
                        <motion.h3 variants={summaryBlockVariants}>
                          <AnimatedWordFlow wordVariants={summaryWordVariants}>{children}</AnimatedWordFlow>
                        </motion.h3>
                      ),
                      p: ({ children }) => (
                        <motion.p variants={summaryBlockVariants}>
                          <AnimatedWordFlow wordVariants={summaryWordVariants}>{children}</AnimatedWordFlow>
                        </motion.p>
                      ),
                      ul: ({ children }) => <motion.ul variants={summaryBlockVariants}>{children}</motion.ul>,
                      ol: ({ children }) => <motion.ol variants={summaryBlockVariants}>{children}</motion.ol>,
                      li: ({ children }) => (
                        <motion.li variants={summaryBlockVariants}>
                          <AnimatedWordFlow wordVariants={summaryWordVariants}>{children}</AnimatedWordFlow>
                        </motion.li>
                      ),
                      blockquote: ({ children }) => (
                        <motion.blockquote variants={summaryBlockVariants}>
                          <AnimatedWordFlow wordVariants={summaryWordVariants}>{children}</AnimatedWordFlow>
                        </motion.blockquote>
                      ),
                      pre: ({ children }) => <motion.pre variants={summaryBlockVariants}>{children}</motion.pre>,
                    }}
                  >
                    {aiSummary}
                  </ReactMarkdown>
                </motion.div>
                {(aiSummaryMeta?.generatedAt || aiSummaryMeta?.model) && (
                  <p className="text-[11px] text-muted-foreground">
                    {aiSummaryMeta?.generatedAt ? `Erstellt: ${new Date(aiSummaryMeta.generatedAt).toLocaleString('de-DE')}` : ''}
                    {aiSummaryMeta?.generatedAt && aiSummaryMeta?.model ? ' · ' : ''}
                    {aiSummaryMeta?.model ? `Modell: ${aiSummaryMeta.model}` : ''}
                  </p>
                )}
              </motion.div>
            ) : aiSummaryError ? (
              <motion.div
                key="ai-summary-error"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {aiSummaryError}
              </motion.div>
            ) : (
              <motion.div
                key="ai-summary-empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground"
              >
                Noch keine KI-Zusammenfassung vorhanden. Nutze den Button oben.
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

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
