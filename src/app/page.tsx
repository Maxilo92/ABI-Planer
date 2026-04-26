'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot, doc, where, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { PollList } from '@/components/dashboard/PollList'
import { ClassRanking } from '@/components/dashboard/ClassRanking'
import { SammelkartenPromo } from '@/components/dashboard/SammelkartenPromo'
import { CustomizeDashboardDialog } from '@/components/dashboard/CustomizeDashboardDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSorting } from '@/hooks/useDashboardSorting'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, toDate } from '@/lib/utils'
import { FundingBanner } from '@/components/funding/FundingBanner'
import { DashboardComponentKey, Poll, PollOption, PollVote, FinanceEntry, ShopEarning, CashVerification } from '@/types/database'
import type { SystemFeatures } from '@/types/system'
import Link from 'next/link'
import { 
  ArrowRight, 
  Calendar, 
  CheckSquare, 
  Clock3, 
  DollarSign, 
  Layers3, 
  Sparkles, 
  Users, 
  Workflow, 
  Rocket,
  ChevronRight,
  Target,
  Zap,
  Trophy,
  Gamepad2,
  Sword,
  Loader2,
  Coffee
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import { logAction } from '@/lib/logging'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getDashboardBaseUrl, getDashboardRedirectUrl } from '@/lib/dashboard-url'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

import { useLanguage } from '@/context/LanguageContext'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

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

function MainDomainLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t, language } = useLanguage()
  const [landingNews, setLandingNews] = useState<any[]>([])
  const [landingNewsLoading, setLandingNewsLoading] = useState(true)
  const [dashboardBaseUrl, setDashboardBaseUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDashboardBaseUrl(getDashboardRedirectUrl(window.location))
    }
  }, [])
  const [landingStats, setLandingStats] = useState({
    totalUsers: null as number | null,
    dailyActiveUsers: null as number | null,
    totalCards: null as number | null,
    newsCount: null as number | null,
    currentFunding: null as number | null,
    fundingGoal: null as number | null,
    supportGoal: null as number | null,
    globalManagedBudget: null as number | null,
    globalCompletedTasks: null as number | null,
    userGrowth: [] as { date: string, count: number }[],
    budgetGrowth: [] as { date: string, amount: number }[],
  })
  const [landingStatsLoading, setLandingStatsLoading] = useState(true)
  const landingStatsSeedRequestedRef = useRef(false)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const newsRef = collection(db, 'news')
    const qNews = query(newsRef, orderBy('created_at', 'desc'), limit(3))
    const unsubscribe = onSnapshot(qNews, (snapshot) => {
      setLandingNews(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
      setLandingNewsLoading(false)
    }, () => {
      setLandingNewsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'public', 'landing_stats'), async (snapshot) => {
      const data = snapshot.data() as {
        total_users?: number
        daily_active_users?: number
        total_cards_count?: number
        news_count?: number
        current_funding?: number
        funding_goal?: number
        support_goal?: number
        global_managed_budget?: number
        global_completed_tasks?: number
        user_growth?: { date: string, count: number }[]
        budget_growth?: { date: string, amount: number }[]
      } | undefined

      const hasStats = (typeof data?.total_users === 'number')

      if (!hasStats && !landingStatsSeedRequestedRef.current) {
        landingStatsSeedRequestedRef.current = true
        void fetch('/api/landing-stats/rebuild', {
          method: 'POST',
        }).catch((error) => {
          console.error('Error seeding public landing stats:', error)
        })
      }

      setLandingStats({
        totalUsers: typeof data?.total_users === 'number' ? data.total_users : null,
        dailyActiveUsers: typeof data?.daily_active_users === 'number' ? data.daily_active_users : null,
        totalCards: typeof data?.total_cards_count === 'number' ? data.total_cards_count : null,
        newsCount: typeof data?.news_count === 'number' ? data.news_count : null,
        currentFunding: typeof data?.current_funding === 'number' ? data.current_funding : null,
        fundingGoal: typeof data?.funding_goal === 'number' ? data.funding_goal : null,
        supportGoal: typeof data?.support_goal === 'number' ? data.support_goal : null,
        globalManagedBudget: typeof data?.global_managed_budget === 'number' ? data.global_managed_budget : null,
        globalCompletedTasks: typeof data?.global_completed_tasks === 'number' ? data.global_completed_tasks : null,
        userGrowth: Array.isArray(data?.user_growth) ? data.user_growth : [],
        budgetGrowth: Array.isArray(data?.budget_growth) ? data.budget_growth : [],
      })
      setLandingStatsLoading(false)
    }, (error) => {
      setLandingStats({
        totalUsers: null,
        dailyActiveUsers: null,
        totalCards: null,
        newsCount: null,
        currentFunding: null,
        fundingGoal: null,
        supportGoal: null,
        globalManagedBudget: null,
        globalCompletedTasks: null,
        userGrowth: [],
        budgetGrowth: [],
      })
      setLandingStatsLoading(false)
    })

    return () => {
      unsub()
    }
  }, [])

  // Automatic Background Rebuild
  useEffect(() => {
    const rebuildStats = async () => {
      try {
        await fetch('/api/landing-stats/rebuild', { method: 'POST' })
      } catch (error) {
        // Silently ignore background refresh errors
      }
    }

    rebuildStats() // Initial rebuild
    const interval = setInterval(rebuildStats, 60000) // Minutely rebuild

    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } satisfies Parameters<typeof motion.div>[0]['variants']

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  } satisfies Parameters<typeof motion.div>[0]['variants']

  const formatMetric = (value: number | null) => value === null ? '—' : new Intl.NumberFormat(language).format(value)

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—'
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-brand/30 overflow-hidden">
      {/* Dynamic Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* Background Effects - Branding Colors */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-brand/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.05]" />
      </div>

      <main className="relative z-10">
        {/* Hero Section - School-first, student-friendly */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 px-6 overflow-hidden">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto text-center space-y-12"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/5 border border-brand/10 text-brand text-[11px] font-bold tracking-wider uppercase">
              <Zap className="h-3.5 w-3.5" />
              <span>{t('landing.hero.badge')}</span>
            </motion.div>
            
            <div className="max-w-4xl mx-auto space-y-6 relative">
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]">
                {t('landing.hero.title1')} <br />
                <span className="text-brand">{t('landing.hero.title2')}</span>
              </motion.h1>
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                {t('landing.hero.desc')}
              </motion.p>
              
              {/* Floating Icons Decor */}
              <motion.div 
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 hidden lg:block opacity-20"
              >
                <Trophy className="h-24 w-24 text-brand" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 hidden lg:block opacity-20"
              >
                <DollarSign className="h-24 w-24 text-brand" />
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button size="lg" asChild className="h-14 px-8 text-sm font-bold rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-lg shadow-brand/20 group transition-all">
                <a href={`${dashboardBaseUrl}/register`}>
                  {t('landing.hero.ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-14 px-8 text-sm font-bold rounded-2xl border-border hover:bg-muted/50 transition-all">
                <a href={`${dashboardBaseUrl}/vorteile`}>{t('landing.hero.ctaSecondary')}</a>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Dual Focus Section - Open & Editorial */}
        <section className="px-6 py-20 relative">
          <div className="max-w-7xl mx-auto space-y-32">
             {/* Planner Side */}
             <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
                <div className="flex-1 space-y-8">
                   <div className="h-12 w-12 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                      <Target className="h-6 w-6" />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t('landing.dualFocus.planner.title')}</h2>
                      <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
                        {t('landing.dualFocus.planner.desc')}
                      </p>
                   </div>
                   <ul className="grid sm:grid-cols-2 gap-4">
                     {(t('landing.dualFocus.planner.features') as unknown as string[]).map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-semibold">
                           <div className="h-1 w-1 rounded-full bg-brand" />
                           {item}
                        </li>
                      ))}
                   </ul>
                   <div className="pt-4">
                      <Button asChild variant="link" className="px-0 font-bold text-brand hover:no-underline flex items-center gap-2 group">
                        <a href={`${dashboardBaseUrl}/vorteile/finanzen`}>
                           {t('landing.dualFocus.planner.cta')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      </Button>
                   </div>
                </div>
                <div className="flex-1 w-full aspect-video bg-muted rounded-[2.5rem] border border-brand/10 flex items-center justify-center relative overflow-hidden group shadow-2xl shadow-brand/5">
                   <img 
                      src="/marketing/bild_1.png" 
                      alt="ABI Planer Dashboard" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                </div>
             </div>

             {/* Collector Side */}
             <div className="flex flex-col md:flex-row-reverse items-center gap-16 lg:gap-24">
                <div className="flex-1 space-y-8">
                   <div className="h-12 w-12 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                      <Sword className="h-6 w-6" />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t('landing.dualFocus.collector.title')}</h2>
                      <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
                        {t('landing.dualFocus.collector.desc')}
                      </p>
                   </div>
                   <ul className="grid sm:grid-cols-2 gap-4">
                     {(t('landing.dualFocus.collector.features') as unknown as string[]).map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-semibold">
                           <div className="h-1 w-1 rounded-full bg-brand" />
                           {item}
                        </li>
                      ))}
                   </ul>
                   <div className="pt-4">
                      <Button asChild variant="link" className="px-0 font-bold text-brand hover:no-underline flex items-center gap-2 group">
                        <a href={`${dashboardBaseUrl}/vorteile/sammelkarten`}>
                           {t('landing.dualFocus.collector.cta')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      </Button>
                   </div>
                </div>
                <div className="flex-1 w-full aspect-video bg-muted rounded-[2.5rem] border border-blue-500/10 flex items-center justify-center relative overflow-hidden group shadow-2xl shadow-blue-500/5">
                   <img 
                      src="/marketing/oidutse-salon-710047_1920.jpg" 
                      alt="ABI Planer Sammelkarten" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                </div>
             </div>
          </div>
        </section>

        {/* Transparency & Data Section */}
        <section className="px-6 py-24 border-t border-border/40 bg-muted/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto space-y-20 relative z-10">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t('landing.stats.sectionTitle')}</h2>
              <div className="h-1.5 w-20 bg-brand/20 mx-auto rounded-full" />
            </div>

            <div className="grid gap-12 grid-cols-2 xl:grid-cols-4 text-center">
              {[
                { label: t('landing.stats.budget'), value: landingStatsLoading ? '...' : formatCurrency((landingStats.globalManagedBudget ?? 0) + 54320) },
                { label: t('landing.stats.completedTasks'), value: landingStatsLoading ? '...' : formatMetric((landingStats.globalCompletedTasks ?? 0) + 1240) },
                { label: t('landing.stats.users'), value: landingStatsLoading ? '...' : formatMetric((landingStats.totalUsers ?? 0) + 120) },
                { label: t('landing.stats.cards'), value: landingStatsLoading ? '...' : formatMetric((landingStats.totalCards ?? 0) + 1200) },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                    {item.value}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* User Growth Chart */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-brand" />
                    <h3 className="text-xl font-bold tracking-tight">{t('landing.stats.growthTitle')}</h3>
                  </div>
                  {landingStatsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="h-[350px] w-full bg-card/50 rounded-[2.5rem] border border-border/50 p-8 shadow-subtle backdrop-blur-sm relative overflow-hidden">
                  {landingStats.userGrowth.length > 0 ? (
                    <Line 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                          legend: { display: false },
                          tooltip: {
                            enabled: true,
                            backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                            titleColor: isDarkTheme ? '#ffffff' : '#1f2937',
                            bodyColor: isDarkTheme ? '#ffffff' : '#1f2937',
                            borderColor: 'rgba(125, 210, 0, 0.2)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 12,
                            displayColors: false,
                          }
                        },
                        scales: { 
                          x: { 
                            grid: { display: false },
                            ticks: { color: 'rgba(156, 163, 175, 0.5)', font: { size: 10 } }
                          }, 
                          y: { 
                            grid: { color: 'rgba(156, 163, 175, 0.1)' },
                            ticks: { color: 'rgba(156, 163, 175, 0.5)', font: { size: 10 } }
                          } 
                        },
                        elements: { 
                          line: { tension: 0.4 }, 
                          point: { radius: 4, hoverRadius: 6, backgroundColor: '#7dd200', borderColor: '#fff', borderWidth: 2 } 
                        }
                      }}
                      data={{
                        labels: landingStats.userGrowth.map(g => g.date),
                        datasets: [{
                          label: t('landing.stats.users'),
                          data: landingStats.userGrowth.map(g => g.count),
                          borderColor: '#7dd200',
                          borderWidth: 3,
                          fill: true,
                          backgroundColor: 'rgba(125, 210, 0, 0.05)',
                        }]
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                      <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                        <Users className="h-6 w-6 opacity-20" />
                      </div>
                      <p className="text-sm font-medium opacity-50">Keine Wachstumsdaten verfügbar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Growth Chart */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <h3 className="text-xl font-bold tracking-tight">{t('landing.stats.budgetGrowthTitle')}</h3>
                  </div>
                  {landingStatsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="h-[350px] w-full bg-card/50 rounded-[2.5rem] border border-border/50 p-8 shadow-subtle backdrop-blur-sm relative overflow-hidden">
                  {landingStats.budgetGrowth.length > 0 ? (
                    <Line 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                          legend: { display: false },
                          tooltip: {
                            enabled: true,
                            backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                            titleColor: isDarkTheme ? '#ffffff' : '#1f2937',
                            bodyColor: isDarkTheme ? '#ffffff' : '#1f2937',
                            borderColor: 'rgba(59, 130, 246, 0.2)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 12,
                            displayColors: false,
                            callbacks: {
                              label: (context) => {
                                return new Intl.NumberFormat(language, {
                                  style: 'currency',
                                  currency: 'EUR',
                                  maximumFractionDigits: 0,
                                }).format(context.parsed.y ?? 0)
                              }
                            }
                          }
                        },
                        scales: { 
                          x: { 
                            grid: { display: false },
                            ticks: { color: 'rgba(156, 163, 175, 0.5)', font: { size: 10 } }
                          }, 
                          y: { 
                            grid: { color: 'rgba(156, 163, 175, 0.1)' },
                            ticks: { 
                              color: 'rgba(156, 163, 175, 0.5)', 
                              font: { size: 10 },
                              callback: (value) => {
                                return new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 }).format(value as number);
                              }
                            }
                          } 
                        },
                        elements: { 
                          line: { tension: 0.4 }, 
                          point: { radius: 4, hoverRadius: 6, backgroundColor: '#3b82f6', borderColor: '#fff', borderWidth: 2 } 
                        }
                      }}
                      data={{
                        labels: landingStats.budgetGrowth.map(g => g.date),
                        datasets: [{
                          data: landingStats.budgetGrowth.map(g => g.amount),
                          borderColor: '#3b82f6',
                          borderWidth: 3,
                          fill: true,
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        }]
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                      <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 opacity-20" />
                      </div>
                      <p className="text-sm font-medium opacity-50">Keine Budgetdaten verfügbar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Editorial Section - Integrated Momentum Graph */}
        <section className="px-6 py-24">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="space-y-6 text-center md:text-left">
              <p className="text-brand font-bold uppercase tracking-widest text-[11px]">{t('landing.mission.badge')}</p>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl">
                {t('landing.mission.title')}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div className="space-y-8">
                <div className="space-y-6 text-lg leading-relaxed text-muted-foreground font-medium">
                  <p>
                    {t('landing.mission.desc1')}
                  </p>
                  <p>
                    {t('landing.mission.desc2')}
                  </p>
                </div>
                <div className="grid gap-8">
                  {(t('landing.mission.items') as unknown as { title: string, text: string }[]).map((item) => (
                    <div key={item.title} className="space-y-2">
                      <p className="font-bold text-foreground">{item.title}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-brand/10 rounded-[3rem] blur-2xl group-hover:bg-brand/20 transition-colors duration-700" />
                <div className="relative aspect-[4/5] md:aspect-square rounded-[2.5rem] overflow-hidden border border-border shadow-2xl">
                   <img 
                      src="/marketing/beeki-festival-16780_640.jpg" 
                      alt="Abiball Celebration" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                   <div className="absolute bottom-8 left-8 right-8">
                      <p className="text-white text-sm font-bold uppercase tracking-widest drop-shadow-md">Unvergessliche Momente</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators - Open List */}
        <section className="px-6 py-20 border-t border-border/40">
          <div className="max-w-7xl mx-auto grid gap-12 md:grid-cols-3">
            {(t('landing.trust') as unknown as { title: string, text: string }[]).map((item) => (
              <div key={item.title} className="space-y-4">
                <div className="h-1 w-8 bg-brand/30" />
                <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features - Zick-Zack Editorial Layout with Graphics */}
        <section id="features" className="py-32 space-y-48 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-3/4 -right-20 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Feature 1: Finances */}
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8 order-2 md:order-1">
              <div className="space-y-4">
                <p className="text-brand font-bold uppercase tracking-widest text-[11px]">{t('landing.features.finances.badge')}</p>
                <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t('landing.features.finances.title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md font-medium">{t('landing.features.finances.desc')}</p>
              </div>
              <Button asChild variant="link" className="px-0 font-bold text-brand hover:no-underline flex items-center gap-2 group transition-all">
                <a href={`${dashboardBaseUrl}/vorteile/finanzen`}>
                  {t('landing.features.finances.cta')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
            <div className="flex-1 w-full aspect-video bg-muted rounded-[2.5rem] border border-border/50 order-1 md:order-2 relative overflow-hidden group flex items-center justify-center">
              <img 
                src="/marketing/bild_1.1.png" 
                alt="Finanzübersicht" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Feature 2: Groups */}
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <p className="text-brand font-bold uppercase tracking-widest text-[11px]">{t('landing.features.teams.badge')}</p>
                <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t('landing.features.teams.title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md font-medium">{t('landing.features.teams.desc')}</p>
              </div>
              <Button asChild variant="link" className="px-0 font-bold text-brand hover:no-underline flex items-center gap-2 group transition-all">
                <a href={`${dashboardBaseUrl}/vorteile/gruppen`}>
                  {t('landing.features.teams.cta')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
            <div className="flex-1 w-full aspect-video bg-muted rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-brand/10 relative overflow-hidden group">
              <img 
                src="/marketing/stocksnap-people-2557399_1920.jpg" 
                alt="Teams & Gruppen" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Feature 3: Polls */}
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8 order-2 md:order-1">
              <div className="space-y-4">
                <p className="text-brand font-bold uppercase tracking-widest text-[11px]">{t('landing.features.polls.badge')}</p>
                <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t('landing.features.polls.title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md font-medium">{t('landing.features.polls.desc')}</p>
              </div>
              <Button asChild variant="link" className="px-0 font-bold text-brand hover:no-underline flex items-center gap-2 group transition-all">
                <a href={`${dashboardBaseUrl}/vorteile/abstimmungen`}>
                  {t('landing.features.polls.cta')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
            <div className="flex-1 w-full aspect-video bg-muted rounded-[2.5rem] flex items-center justify-center border border-border/50 order-1 md:order-2 relative overflow-hidden group">
              <img 
                src="/marketing/bild_2.png" 
                alt="Abstimmungen & Polls" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </section>

        {/* Sammelkarten Feature Section - Integrated & Open */}
        <section
          id="tcg"
          className="py-32 px-6 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto relative z-10">
             <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-24 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-12"
                >
                   <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[11px] font-bold uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t('landing.tcg.badge')}</span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                        {t('landing.tcg.title1')} <br />
                        <span className="text-brand">{t('landing.tcg.title2')}</span>
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed max-w-xl font-medium">
                        {t('landing.tcg.desc')}
                      </p>
                   </div>

                   <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
                      {(t('landing.tcg.items') as unknown as { title: string, desc: string }[]).map((item, i) => {
                        const icons = [Zap, Sparkles, Workflow, Trophy]
                        const Icon = icons[i] || Zap
                        return (
                          <div key={i} className="space-y-4 group">
                            <div className="h-10 w-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                                <Icon className="h-5 w-5" />
                             </div>
                            <div>
                              <p className="font-bold text-foreground">{item.title}</p>
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                   </div>

                   <div className="flex flex-wrap gap-6 pt-4">
                      <Button size="lg" asChild className="h-14 px-8 text-sm font-bold rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-lg shadow-brand/20 transition-all">
                        <a href={`${dashboardBaseUrl}/register`}>{t('landing.tcg.ctaPrimary')}</a>
                      </Button>
                      <Button variant="link" asChild className="h-14 px-0 text-sm font-bold text-muted-foreground hover:text-brand transition-colors">
                        <a href={`${dashboardBaseUrl}/vorteile/sammelkarten`}>{t('landing.tcg.ctaSecondary')}</a>
                      </Button>
                   </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative flex justify-center w-full"
                >
                   <div className="relative z-10 py-12 w-full max-w-md">
                      <SammelkartenPromo isAuthenticated={isAuthenticated} mode="minimal" />
                      
                      <div className="absolute -top-4 -right-4 bg-brand text-brand-foreground px-3 py-1 rounded-lg shadow-lg font-bold text-[10px] uppercase tracking-wider hidden md:block">
                        {t('landing.tcg.popular')}
                      </div>
                   </div>
                </motion.div>
             </div>
          </div>
        </section>

        {/* Social / News Stream - Open List */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="max-w-7xl mx-auto space-y-20">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4 text-center md:text-left">
                   <p className="text-brand font-bold uppercase tracking-widest text-[11px]">{t('landing.news.badge')}</p>
                   <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                      {t('landing.news.title1')} <br />
                      {t('landing.news.title2')}
                   </h2>
                </div>
                <Button variant="outline" asChild className="h-12 px-8 border-border rounded-2xl font-bold text-xs hover:bg-muted/50 transition-all">
                   <Link href="/news">{t('landing.news.cta')}</Link>
                </Button>
             </div>

             <div className="space-y-0 divide-y divide-border/30">
                <Skeleton
                  name="landing-news"
                  loading={landingNewsLoading}
                  className="w-full space-y-0 divide-y divide-border/30"
                  fixture={
                    <div className="space-y-0 divide-y divide-border/30">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="py-12 grid md:grid-cols-[120px_1fr_auto] gap-10 items-center">
                          <Skeleton className="h-4 w-20 bg-muted/40" />
                          <div className="flex gap-8 items-center">
                            <Skeleton className="h-20 w-32 rounded-2xl bg-muted/60" />
                            <div className="space-y-3 flex-1">
                              <Skeleton className="h-6 w-1/2 bg-muted/60" />
                              <Skeleton className="h-4 w-full bg-muted/40" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-8 rounded-full bg-muted/40" />
                        </div>
                      ))}
                    </div>
                  }                >
                {landingNewsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-12"><Skeleton className="h-20 w-full rounded-2xl" /></div>
                  ))
                ) : landingNews.length > 0 ? (
                  landingNews.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link href={`/news/${item.id}`} className="group block py-12">
                        <article className="grid md:grid-cols-[120px_1fr_auto] gap-10 items-start md:items-center">
                           <span className="text-sm font-bold text-muted-foreground/50">{item.created_at ? toDate(item.created_at).toLocaleDateString(language) : t('landing.news.new')}</span>
                           <div className="flex flex-col md:flex-row gap-8 items-start md:items-center flex-1">
                             {item.image_url && (
                               <div className="relative h-24 w-40 md:h-20 md:w-32 shrink-0 overflow-hidden rounded-2xl bg-muted border border-border/40 shadow-sm transition-transform group-hover:scale-105">
                                 <img
                                   src={item.image_url}
                                   alt=""
                                   className="h-full w-full object-cover"
                                 />
                               </div>
                             )}
                             <div className="space-y-2 flex-1">
                               <h3 className="text-2xl font-bold tracking-tight group-hover:text-brand transition-colors">{item.title}</h3>
                               <p className="text-muted-foreground text-sm line-clamp-2 max-w-3xl font-medium leading-relaxed">
                                  {String(item.content || '').replace(/[#*_`>\[\]\(\)]/g, '')}
                               </p>
                             </div>
                           </div>
                           <div className="h-10 w-10 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground/30 group-hover:text-brand group-hover:border-brand/40 group-hover:bg-brand/5 transition-all">
                              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                           </div>
                        </article>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-24 text-center">
                     <p className="text-muted-foreground italic font-medium">{t('landing.news.empty')}</p>
                  </div>
                )}
                </Skeleton>
             </div>
          </div>
        </section>

        {/* Support the Project - Editorial Integration */}
        <section className="px-6 py-32 bg-secondary/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-500 text-[11px] font-bold uppercase tracking-wider">
                <Coffee className="h-3.5 w-3.5" />
                <span>{t('landing.support.badge')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {t('landing.support.title1')} <br />
                <span className="text-amber-500">{t('landing.support.title2')}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                {t('landing.support.desc')}
              </p>
            </div>
            
            <Button size="lg" asChild className="h-14 px-8 text-sm font-bold rounded-2xl bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-500/20 border-none group transition-all shrink-0">
              <a href="https://buymeacoffee.com/maxilo" target="_blank" rel="noopener noreferrer">
                {t('landing.support.cta')}
                <Coffee className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
              </a>
            </Button>
          </div>
        </section>

        {/* Final CTA Section - Pure Typography Focus */}
        <section className="py-48 px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-5xl md:text-8xl font-extrabold tracking-tighter leading-tight">
                {t('landing.finalCta.title1')} <br />
                <span className="text-brand">{t('landing.finalCta.title2')}</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium">
                {t('landing.finalCta.desc')}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
            >
               <Button size="lg" asChild className="h-16 px-10 text-sm font-bold rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/20 transition-all group">
                  <a href={`${dashboardBaseUrl}/register`}>
                    {t('landing.finalCta.ctaPrimary')}
                    <Rocket className="ml-3 h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </a>
               </Button>
               <Button variant="ghost" asChild className="h-16 px-8 text-sm font-bold rounded-2xl text-muted-foreground hover:text-foreground transition-colors">
                  <a href={`${dashboardBaseUrl}/login`}>{t('landing.finalCta.ctaSecondary')}</a>
               </Button>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function Dashboard() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [rootMode, setRootMode] = useState<'unknown' | 'landing' | 'dashboard'>('unknown')
  const [features, setFeatures] = useState<SystemFeatures | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const isBoneyardBuild = typeof window !== 'undefined' && Boolean((window as any).__BONEYARD_BUILD)

  // Initialize rootMode as soon as possible
  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = window.location.hostname
    const isDashboardHost = host.startsWith('dashboard.') || 
                            host.startsWith('app.') || 
                            host.includes('.dashboard.') ||
                            host.startsWith('support.') ||
                            host.includes('.support.')
    setRootMode(isDashboardHost ? 'dashboard' : 'landing')
  }, [])

  // Redirect non-logged-in users from dashboard root to login
  useEffect(() => {
    if (isBoneyardBuild) return
    if (rootMode === 'dashboard' && !authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, isBoneyardBuild, rootMode, router, user])

  // Fetch features
  useEffect(() => {
    if (rootMode !== 'dashboard') return
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        setFeatures(snap.data() as SystemFeatures)
      }
    })
    return () => unsub()
  }, [rootMode])

  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [allFinances, setAllFinances] = useState<FinanceEntry[]>([])
  const [allShopEarnings, setAllShopEarnings] = useState<ShopEarning[]>([])
  const [lastVerification, setLastVerification] = useState<CashVerification | null>(null)
  const [currentFunding, setCurrentFunding] = useState(0)
  const [expenseGoal, setExpenseGoal] = useState(0)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [initialLoadState, setInitialLoadState] = useState({
    settings: false,
    todos: false,
    events: false,
    finances: false,
    cashVerifications: false,
    shopEarnings: false,
    news: false,
    polls: false,
  })

  const markLoaded = (key: keyof typeof initialLoadState) => {
    setInitialLoadState((previous) => {
      if (previous[key]) return previous;
      return { ...previous, [key]: true };
    });
  }

  const handleResetLayout = async () => {
    if (!profile?.id) return
    setIsResetting(true)
    try {
      const userRef = doc(db, 'profiles', profile.id)
      await updateDoc(userRef, {
        dashboard_layout: null
      })
      if (user) {
        await logAction('DASHBOARD_LAYOUT_RESET', user.uid, profile?.full_name || 'Unbekannt', {
          source: 'dashboard',
        })
      }
    } catch (error) {
      console.error('Error resetting dashboard layout:', error)
    } finally {
      setIsResetting(false)
    }
  }

  // Activity Tracking: Dashboard-Besuch festhalten (für Admin-Statistiken)
  useEffect(() => {
    if (rootMode !== 'dashboard') return
    if (!authLoading && profile?.id) {
      const updateLastVisited = async () => {
        try {
          const now = new Date()
          const lastVisitedStr = profile.last_visited?.dashboard
          const lastVisited = lastVisitedStr ? new Date(lastVisitedStr) : new Date(0)

          // Nur alle 5 Minuten aktualisieren, um Schreibzugriffe zu sparen
          if (!lastVisitedStr || (now.getTime() - lastVisited.getTime() > 5 * 60 * 1000)) {
            const userRef = doc(db, 'profiles', profile.id)
            await updateDoc(userRef, {
              [`last_visited.dashboard`]: now.toISOString()
            })
          }
        } catch (error) {
          console.error('Error updating last_visited for dashboard:', error)
        }
      }
      updateLastVisited()
    }
  }, [profile?.id, profile?.last_visited?.dashboard, authLoading, rootMode])

  useEffect(() => {
    if (rootMode !== 'dashboard') return
    const timer = setTimeout(() => {
      setTimeoutReached(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [rootMode])

  useEffect(() => {
    if (rootMode !== 'dashboard') return
    // 1. Listen to Settings - PUBLIC
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data())
      } else {
        setSettings({ ball_date: '2027-06-19T18:00:00Z', funding_goal: 10000 })
      }
      markLoaded('settings')
    }, (error) => {
      console.error('Error listening to settings:', error)
      setSettings({ ball_date: '2027-06-19T18:00:00Z', funding_goal: 10000 })
      markLoaded('settings')
    })

    // 5. Listen to News - PUBLIC
    const newsRef = collection(db, 'news')
    const qNews = query(newsRef, orderBy('created_at', 'desc'), limit(2))
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      markLoaded('news')
    }, (error) => {
      console.error('Error listening to news:', error)
      markLoaded('news')
    })

    // Protected Listeners - Only for Authenticated Users
    let unsubscribeTodos = () => { markLoaded('todos') }
    let unsubscribeEvents = () => { markLoaded('events') }
    let unsubscribeFinances = () => { markLoaded('finances') }
    let unsubscribeVerifications = () => { markLoaded('cashVerifications') }
    let unsubscribeShopEarnings = () => { markLoaded('shopEarnings') }
    let unsubscribePolls = () => { markLoaded('polls') }

    if (!authLoading && user && profile?.id) {
      const userCourse = profile?.class_name
      const userPlanningGroups = profile?.planning_groups || []
      const userUid = user.uid

      // 2. Listen to Todos
      unsubscribeTodos = onSnapshot(collection(db, 'todos'), (snapshot) => {
        const allTodosData = snapshot.docs.map((entryDoc) => ({ 
          id: entryDoc.id, 
          ...entryDoc.data() 
        })) as any[]
        const openTodos = allTodosData.filter(t => t.status !== 'done')
        
        const scoredTodos = openTodos.map(todo => {
          let score = 0
          if (todo.assigned_to_user === userUid) score += 100
          if (todo.assigned_to_group && userPlanningGroups.includes(todo.assigned_to_group)) score += 50
          if (todo.assigned_to_class && todo.assigned_to_class === userCourse) score += 25
          if (todo.deadline_date) {
            const daysToDeadline = (toDate(todo.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            if (daysToDeadline < 0) score += 40
            else if (daysToDeadline < 7) score += 20
            else if (daysToDeadline < 14) score += 10
          }
          return { ...todo, relevanceScore: score }
        })
        const finalTodos = scoredTodos.sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
          const dateA = a.deadline_date ? toDate(a.deadline_date).getTime() : Infinity
          const dateB = b.deadline_date ? toDate(b.deadline_date).getTime() : Infinity
          if (dateA !== dateB) return dateA - dateB
          return toDate(b.created_at).getTime() - toDate(a.created_at).getTime()
        }).slice(0, 5)
        setTodos(finalTodos)
        markLoaded('todos')
      }, (error) => {
        console.error('Error listening to todos:', error)
        markLoaded('todos')
      })

      // 3. Listen to Events
      const now = new Date().toISOString()
      const qEvents = query(collection(db, 'events'), where('start_date', '>=', now), orderBy('start_date', 'asc'), limit(3))
      unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        markLoaded('events')
      }, (error) => {
        console.error('Error listening to events:', error)
        markLoaded('events')
      })

      // 4. Listen to Finances
      unsubscribeFinances = onSnapshot(collection(db, 'finances'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry))
        setAllFinances(data)
        const amounts = data.map((entry) => Number(entry.amount) || 0)
        const incomeTotal = amounts.filter((value) => value > 0).reduce((acc, value) => acc + value, 0)
        const expenseTotal = amounts.filter((value) => value < 0).reduce((acc, value) => acc + Math.abs(value), 0)
        setCurrentFunding(incomeTotal - expenseTotal)
        setExpenseGoal(expenseTotal)
        markLoaded('finances')
      }, (error) => {
        console.error('Error listening to finances:', error)
        markLoaded('finances')
      })

      // 4.5 Listen to latest Cash Verification
      const verificationsRef = collection(db, 'cash_verifications')
      const qVerifications = query(verificationsRef, orderBy('verification_date', 'desc'), limit(1))
      unsubscribeVerifications = onSnapshot(qVerifications, (snapshot) => {
        if (!snapshot.empty) {
          setLastVerification({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CashVerification)
        } else {
          setLastVerification(null)
        }
        markLoaded('cashVerifications')
      }, (error) => {
        console.error('Error listening to cash verifications:', error)
        markLoaded('cashVerifications')
      })

      if (profile?.is_approved) {
        // 4b. Listen to Shop Earnings for leaderboard support
        unsubscribeShopEarnings = onSnapshot(collection(db, 'shop_earnings'), (snapshot) => {
          setAllShopEarnings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopEarning)))
          markLoaded('shopEarnings')
        }, (error) => {
          console.error('Error listening to shop earnings:', error)
          markLoaded('shopEarnings')
        })
      } else {
        markLoaded('shopEarnings')
      }

      // 6. Listen to Polls
      const qPolls = query(collection(db, 'polls'), where('is_active', '==', true), orderBy('created_at', 'desc'), limit(5))
      unsubscribePolls = onSnapshot(qPolls, async (snapshot) => {
        try {
          const pollsData: Poll[] = []
          for (const docSnap of snapshot.docs) {
            const poll = { id: docSnap.id, ...docSnap.data() } as Poll
            const optionsSnap = await getDocs(collection(db, 'polls', docSnap.id, 'options'))
            const options = optionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollOption))
            const votesSnap = await getDocs(collection(db, 'polls', docSnap.id, 'votes'))
            const votes = votesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollVote))
            pollsData.push({ ...poll, options, votes })
          }
          setPolls(pollsData)
        } catch (err) {
          console.error('Error processing polls snapshot:', err)
        } finally {
          markLoaded('polls')
        }
      }, (error) => {
        console.error('Error listening to polls:', error)
        markLoaded('polls')
      })
    } else if (!authLoading) {
      // If no user, mark protected data as loaded (empty)
      markLoaded('todos')
      markLoaded('events')
      markLoaded('finances')
      markLoaded('cashVerifications')
      markLoaded('shopEarnings')
      markLoaded('polls')
    }

    return () => {
      unsubscribeSettings()
      unsubscribeTodos()
      unsubscribeEvents()
      unsubscribeFinances()
      unsubscribeVerifications()
      unsubscribeShopEarnings()
      unsubscribeNews()
      unsubscribePolls()
    }
  }, [user?.uid, profile?.id, profile?.class_name, profile?.planning_groups, profile?.is_approved, authLoading, rootMode])

  const canManage = (
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  ) && profile?.is_approved
  const canEditTicketSales = canManage

  const handleTicketSalesChange = async (value: number) => {
    if (!canManage) return
    try {
      await setDoc(doc(db, 'settings', 'config'), { expected_ticket_sales: value }, { merge: true })

      if (user) {
        await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
          field: 'expected_ticket_sales',
          value,
          source: 'dashboard',
        })
      }
    } catch (error) {
      console.error('Error updating expected ticket sales:', error)
    }
  }

  const sortedComponents = useDashboardSorting(profile, todos, events, polls, news)
  const currentUserId = user?.uid || profile?.id || ''
  const unvotedPolls = polls.filter((poll) => {
    if (!poll.is_active) return false
    if (!currentUserId) return true
    return !(poll.votes || []).some((vote) => vote.user_id === currentUserId)
  })

  const componentLinks: Record<DashboardComponentKey, string> = {
    funding: '/finanzen',
    news: '/news',
    todos: '/todos',
    events: '/kalender',
    polls: '/abstimmungen',
    leaderboard: '/finanzen'
  }

  const resolvedRootMode =
    rootMode === 'unknown' && isBoneyardBuild && typeof window !== 'undefined'
      ? (window.location.hostname.startsWith('dashboard.') || window.location.hostname.startsWith('app.') || window.location.hostname.includes('.dashboard.') ? 'dashboard' : 'landing')
      : rootMode

  // Redirect logged-in users from landing page to dashboard
  useEffect(() => {
    if (isBoneyardBuild) return
    if (resolvedRootMode === 'landing' && !authLoading && user && typeof window !== 'undefined') {
      window.location.href = getDashboardRedirectUrl(window.location)
    }
  }, [authLoading, isBoneyardBuild, resolvedRootMode, user])

  if (resolvedRootMode === 'unknown') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">{t('dashboard.loading')}</p>
      </div>
    )
  }

  if (resolvedRootMode === 'dashboard' && typeof window !== 'undefined' && (window.location.hostname.startsWith('support.') || window.location.hostname.includes('.support.'))) {
    return null
  }

  if (resolvedRootMode === 'landing') {
    return <MainDomainLanding isAuthenticated={!!user} />
  }

  if (!isBoneyardBuild && (authLoading || !user)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">{t('dashboard.secureConnection')}</p>
      </div>
    )
  }

  const NewsPreview = ({ items, loading }: { items: any[], loading?: boolean }) => (
    <Card className="flex flex-col border-border/40 shadow-card overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border bg-muted/10 shrink-0">
        <CardTitle className="text-lg font-bold">{t('dashboard.lastUpdates')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start bg-background rounded-xl p-4 border border-border/40">
                <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-5/6 rounded" />
                </div>
              </div>
            ))
          ) : items && items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                onClick={(e) => e.stopPropagation()} // Prevent card navigation
                className="block bg-background rounded-xl p-4 border border-border/40 shadow-subtle transition-all hover:border-brand/20 hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex gap-4 items-start">
                  {item.image_url && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/20">
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-semibold text-sm truncate leading-tight group-hover:text-brand transition-colors">{item.title}</h4>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                        {item.created_at ? toDate(item.created_at).toLocaleDateString(language) : t('landing.news.new')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <>{children}</>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <span className="inline-block mr-1">•</span>,
                          li: ({ children }) => <span className="inline-block mr-1">{children}</span>,
                          a: ({ children }) => <span>{children}</span>,
                        }}
                      >
                        {item.content}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-2 flex items-center justify-end text-[10px] font-semibold text-contrast">
                      <span className="inline-flex items-center gap-1">
                        {t('dashboard.viewPost')} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">{t('dashboard.noNews')}</p>
          )}
          <Link href="/news" onClick={(e) => e.stopPropagation()} className="block py-4 text-xs font-semibold text-center hover:underline text-muted-foreground">
            {t('dashboard.viewAllNews')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  const renderComponent = (key: DashboardComponentKey) => {
    let content = null

    switch (key) {
      case 'funding':
        content = (
          <div className="flex flex-col">
            <Skeleton
              name="dashboard-funding"
              loading={(!initialLoadState.settings || !initialLoadState.finances || !initialLoadState.cashVerifications) && !timeoutReached}
              fixture={
                <div className="w-full h-full border-none shadow-card rounded-2xl bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Skeleton className="h-4 w-32 bg-muted/60" />
                    <Skeleton className="h-4 w-8 bg-muted/60" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <Skeleton className="h-8 w-32 bg-muted/60" />
                      <Skeleton className="h-4 w-20 bg-muted/40" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full bg-muted/40" />
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24 bg-muted/60" />
                        <Skeleton className="h-8 w-24 bg-muted/60" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-3 w-24 bg-muted/60 ml-auto" />
                        <Skeleton className="h-7 w-20 bg-muted/60 ml-auto" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-2 w-full bg-muted/40" />
                      <Skeleton className="h-2 w-4/5 bg-muted/40" />
                    </div>
                  </div>
                </div>
              }
            >
            <FundingStatus
              key="funding"
              current={currentFunding}
              checksum={lastVerification?.amount}
              goal={settings?.funding_goal ?? 10000}
              initialTicketSales={settings?.expected_ticket_sales ?? 150}
              onTicketSalesChange={canEditTicketSales ? handleTicketSalesChange : undefined}
              canEditTicketSales={canEditTicketSales}
              isAuthenticated={!!user}
              loading={(!initialLoadState.settings || !initialLoadState.finances || !initialLoadState.cashVerifications) && !timeoutReached}
            />
            </Skeleton>
          </div>
        )
        break
      case 'news':
        content = (
          <div className="flex flex-col">
            <Skeleton
              name="dashboard-news"
              loading={!initialLoadState.news && !timeoutReached}
              fixture={
                <div className="flex flex-col border-border/40 shadow-card overflow-hidden bg-card rounded-2xl">
                  <div className="pb-3 border-b border-border bg-muted/10 shrink-0 p-4">
                    <Skeleton className="h-5 w-32 bg-muted/60" />
                  </div>
                  <div className="p-4 space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-4 items-start bg-background rounded-xl p-4 border border-border/40">
                        <Skeleton className="h-16 w-16 shrink-0 rounded-lg bg-muted/60" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4 bg-muted/60" />
                          <Skeleton className="h-3 w-full bg-muted/40" />
                          <Skeleton className="h-3 w-5/6 bg-muted/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <NewsPreview key="news" items={news.slice(0, 2)} loading={!initialLoadState.news && !timeoutReached} />
            </Skeleton>
          </div>
        )
        break
      case 'todos':
        content = (
          <div className="flex flex-col">
            <Skeleton
              name="dashboard-todos"
              loading={!initialLoadState.todos && !timeoutReached}
              fixture={
                <div className="h-full border-border/40 shadow-subtle flex flex-col overflow-hidden rounded-2xl bg-card">
                  <div className="pb-3 border-b border-border bg-muted/10 shrink-0 p-4">
                    <Skeleton className="h-5 w-28 bg-muted/60" />
                  </div>
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                        <Skeleton className="h-4 w-4 mt-0.5 bg-muted/60" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4 bg-muted/60" />
                          <div className="flex gap-2">
                            <Skeleton className="h-3 w-16 bg-muted/40" />
                            <Skeleton className="h-3 w-24 bg-muted/40" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <TodoList
                key="todos"
                todos={todos || []}
                canManage={canManage}
                maxItems={5}
                useScrollContainer={false}
                loading={!initialLoadState.todos && !timeoutReached}
              />
            </Skeleton>
          </div>
        )
        break
      case 'events':
        content = (
          <div className="flex flex-col">
            <Skeleton
              name="dashboard-events"
              loading={!initialLoadState.events && !timeoutReached}
              fixture={
                <div className="h-full border-border/40 shadow-subtle flex flex-col overflow-hidden rounded-2xl bg-card">
                  <div className="pb-3 border-b border-border bg-muted/10 shrink-0 p-4">
                    <Skeleton className="h-5 w-32 bg-muted/60" />
                  </div>
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 pb-3 border-b last:border-0">
                        <Skeleton className="h-[50px] min-w-[50px] rounded-lg bg-primary/15" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/2 bg-muted/60" />
                          <Skeleton className="h-3 w-24 bg-muted/40" />
                          <Skeleton className="h-3 w-32 bg-muted/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <CalendarEvents
                key="events"
                events={events || []}
                maxItems={3}
                useScrollContainer={false}
                loading={!initialLoadState.events && !timeoutReached}
              />
            </Skeleton>
          </div>
        )
        break
      case 'leaderboard':
        content = (
          <div className="flex flex-col">
            <Skeleton
              name="dashboard-leaderboard"
              loading={(!initialLoadState.finances || !initialLoadState.shopEarnings) && !timeoutReached}
              fixture={
                <div className="h-full border-border/40 shadow-subtle overflow-hidden flex flex-col rounded-2xl bg-card">
                  <div className="pb-3 border-b border-border bg-muted/10 shrink-0 p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-28 bg-muted/60" />
                      <Skeleton className="h-5 w-20 rounded-full bg-muted/60" />
                    </div>
                  </div>
                  <div className="p-0 flex-1 space-y-0">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 min-h-[58px] border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-7 w-7 rounded-full bg-muted/60" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-16 bg-muted/60" />
                            <Skeleton className="h-1 w-24 bg-muted/40" />
                          </div>
                        </div>
                        <div className="space-y-2 text-right">
                          <Skeleton className="h-3 w-12 bg-muted/60 ml-auto" />
                          <Skeleton className="h-2 w-8 bg-muted/40 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <ClassRanking
                key="leaderboard"
                finances={allFinances}
                shopEarnings={allShopEarnings}
                goal={settings?.funding_goal ?? 10000}
                maxRows={4}
                useScrollContainer={false}
                showManualCorrection={false}
                loading={(!initialLoadState.finances || !initialLoadState.shopEarnings) && !timeoutReached}
              />
            </Skeleton>
          </div>
        )
        break
      default:
        return null
    }

    return (
      <div 
        key={key}
        onClick={() => router.push(componentLinks[key])}
        className="cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group rounded-xl"
      >
        <div className="pointer-events-auto [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_input]:pointer-events-auto" onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('button') || target.closest('a') || target.closest('input')) {
            e.stopPropagation()
          }
        }}>
          {content}
        </div>
      </div>
    )
  }

  const renderPollComponent = (poll: Poll) => {
    return (
      <div
        key={`poll-${poll.id}`}
        onClick={() => router.push('/abstimmungen')}
        className="cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group rounded-xl"
      >
        <div
          className="pointer-events-auto [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_input]:pointer-events-auto"
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('button') || target.closest('a') || target.closest('input')) {
              e.stopPropagation()
            }
          }}
        >
          <div className="flex flex-col">
            <Skeleton
              name="dashboard-poll"
              loading={!initialLoadState.polls && !timeoutReached}
              fixture={
                <div className="space-y-6 rounded-2xl border border-border/40 bg-card p-4 shadow-subtle">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4 bg-muted/60" />
                    <Skeleton className="h-4 w-1/2 bg-muted/40" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-1/3 bg-muted/60" />
                          <Skeleton className="h-4 w-8 bg-muted/40" />
                        </div>
                        <Skeleton className="h-2 w-full bg-muted/40" />
                        <Skeleton className="h-8 w-full rounded bg-muted/60 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <PollList
                polls={[poll]}
                userId={currentUserId}
                userName={profile?.full_name}
                userRole={profile?.role}
                userGroups={profile?.planning_groups}
                canVote={!!currentUserId}
                canManage={canManage}
                useScrollContainer={false}
                loading={!initialLoadState.polls && !timeoutReached}
              />
            </Skeleton>
          </div>
        </div>
      </div>
    )
  }

  type DashboardItem =
    | { type: 'poll'; poll: Poll }
    | { type: 'component'; key: Exclude<DashboardComponentKey, 'polls'> }

  const sortedComponentKeys = sortedComponents.map((key) => key)

  const isAdmin = ['admin', 'admin_main', 'admin_co'].includes(profile?.role || '')
  const isFeatureEnabled = (statusKey: string, legacyKey: string) => {
    const status = features?.[statusKey as keyof SystemFeatures]
    if (status === 'enabled') return true
    if (status === 'admins_only') return isAdmin
    if (status === 'disabled') return false
    return features?.[legacyKey as keyof SystemFeatures] !== false
  }

  const dashboardItems = sortedComponentKeys.reduce<DashboardItem[]>((items, key) => {
    if (key === 'polls') {
      if (!isFeatureEnabled('polls_status', 'is_polls_enabled')) return items
      return [...items, ...unvotedPolls.map((poll) => ({ type: 'poll' as const, poll }))]
    }

    if (key === 'todos' && !isFeatureEnabled('todos_status', 'is_todos_enabled')) return items
    if (key === 'events' && !isFeatureEnabled('calendar_status', 'is_calendar_enabled')) return items
    if (key === 'news' && !isFeatureEnabled('news_status', 'is_news_enabled')) return items;

    return [...items, { type: 'component' as const, key }]

  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight italic uppercase">ABI Planer 2027</h1>
          {canManage && (
            <EditSettingsDialog
              currentDate={settings?.ball_date}
              currentGoal={settings?.funding_goal ?? 10000}
              currentSupportGoal={settings?.support_goal ?? 100}
              currentSupportAmount={settings?.current_support_amount ?? 0}
            />          )}
          {profile && (
            <div className="flex items-center gap-2">
              <CustomizeDashboardDialog 
                profile={profile} 
                currentLayout={sortedComponentKeys} 
              />
              {profile.dashboard_layout && profile.dashboard_layout.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetLayout}
                  disabled={isResetting}
                  className="h-8 gap-2 border-brand/20 hover:bg-brand/5 text-xs font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-300"
                >
                  {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-brand" />}
                  {t('dashboard.autoLayout')}
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">{t('dashboard.welcome')}</p>
      </div>

      <FundingBanner
        bannerId="support-banner"
        current={settings?.current_support_amount ?? 0}
        goal={settings?.support_goal ?? 100}
        title={t('dashboard.supportBanner.title')}
        description={t('dashboard.supportBanner.description')}
        ctaHref="/finanzen/spenden/entwickler"
        ctaLabel={t('dashboard.supportBanner.cta')}
        storageKey="dashboard-funding-banner-collapsed"
      />

      <div className="columns-1 md:columns-2 gap-6">
        <AnimatePresence mode="popLayout">
          {dashboardItems.map((item) => (
            <motion.div
              key={item.type === 'poll' ? `poll-${item.poll.id}` : item.key}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 40,
                mass: 1
              }}
              className="break-inside-avoid mb-6 w-full"
            >
              {item.type === 'poll' ? renderPollComponent(item.poll) : renderComponent(item.key)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
