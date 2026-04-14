'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, where, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { PollList } from '@/components/dashboard/PollList'
import { ClassRanking } from '@/components/dashboard/ClassRanking'
import { SammelkartenPromo } from '@/components/dashboard/SammelkartenPromo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSorting } from '@/hooks/useDashboardSorting'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, toDate } from '@/lib/utils'
import { Footer } from '@/components/layout/Footer'
import { DashboardComponentKey, Poll, PollOption, PollVote, FinanceEntry, ShopEarning } from '@/types/database'
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
  Sword
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { motion, useScroll, useSpring } from 'framer-motion'
import { logAction } from '@/lib/logging'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getDashboardBaseUrl, getDashboardRedirectUrl } from '@/lib/dashboard-url'

function MainDomainLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [landingNews, setLandingNews] = useState<any[]>([])
  const [landingNewsLoading, setLandingNewsLoading] = useState(true)
  const dashboardBaseUrl = getDashboardBaseUrl()
  const [landingStats, setLandingStats] = useState({
    totalUsers: null as number | null,
    dailyActiveUsers: null as number | null,
    totalCards: null as number | null,
    newsCount: null as number | null,
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
      } | undefined

      const hasStats = typeof data?.total_users === 'number' || typeof data?.daily_active_users === 'number' || typeof data?.total_cards_count === 'number' || typeof data?.news_count === 'number'

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
      })
      setLandingStatsLoading(false)
    }, (error) => {
      setLandingStats({
        totalUsers: null,
        dailyActiveUsers: null,
        totalCards: null,
        newsCount: null,
      })
      setLandingStatsLoading(false)
      if (!landingStatsSeedRequestedRef.current) {
        landingStatsSeedRequestedRef.current = true
        void fetch('/api/landing-stats/rebuild', {
          method: 'POST',
        }).catch((seedError) => {
          console.error('Error seeding public landing stats after listener failure:', seedError)
        })
      }
    })

    return () => {
      unsub()
    }
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

  const formatMetric = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('de-DE').format(value)

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

      <LandingHeader isAuthenticated={isAuthenticated} />

      <main className="relative z-10">
        {/* Hero Section - Redesigned for Students */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto text-center space-y-12"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand shadow-sm">
              <Zap className="h-4 w-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Alles für euren Jahrgang</span>
            </motion.div>
            
            <div className="max-w-5xl mx-auto space-y-8 relative">
              <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] uppercase italic">
                Macht euer Abi <br />
                <span className="text-brand drop-shadow-[0_0_30px_rgba(125,210,0,0.3)]">
                  Legendär.
                </span>
              </motion.h1>
              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
                Die ultimative Plattform für euren Jahrgang. Planen, Sammeln, Kämpfen – alles an einem Ort, sicher und nur für euch.
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

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <Button size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/30 group">
                <a href={`${dashboardBaseUrl}/register`}>
                  Jahrgang joinen
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl border-2 border-brand/20 hover:bg-brand/5 backdrop-blur-sm">
                <a href={`${dashboardBaseUrl}/vorteile`}>Features checken</a>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Dual Focus Section - Choose your side */}
        <section className="px-6 py-20 relative">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
             {/* Planner Side */}
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="relative group overflow-hidden rounded-[3rem] border border-border/50 bg-card/50 backdrop-blur-sm p-10 h-full flex flex-col justify-between"
             >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Target className="h-40 w-40 text-brand" />
                </div>
                <div className="space-y-6 relative z-10">
                   <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                      <Target className="h-7 w-7" />
                   </div>
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter">Der Planer.</h2>
                   <p className="text-muted-foreground text-lg leading-relaxed">
                      Behalte das Budget im Griff, erstelle Abstimmungen und koordiniere Teams. Alles, was ihr für einen perfekten Abiball braucht.
                   </p>
                   <ul className="space-y-3">
                      {['Finanzen & Prognosen', 'Aufgaben & Deadlines', 'Echtzeit-Abstimmungen'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold">
                           <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                           {item}
                        </li>
                      ))}
                   </ul>
                </div>
                <div className="pt-10">
                   <Button asChild variant="secondary" className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8">
                      <a href={`${dashboardBaseUrl}/vorteile/finanzen`}>Planung entdecken</a>
                   </Button>
                </div>
             </motion.div>

             {/* Collector Side */}
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="relative group overflow-hidden rounded-[3rem] border border-brand/20 bg-brand text-brand-foreground p-10 h-full flex flex-col justify-between shadow-2xl shadow-brand/20"
             >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Gamepad2 className="h-40 w-40 text-white" />
                </div>
                <div className="space-y-6 relative z-10">
                   <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                      <Sword className="h-7 w-7" />
                   </div>
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter">Der Sammler.</h2>
                   <p className="text-brand-foreground/90 text-lg leading-relaxed">
                      Sammle Lehrer und Mitschüler, tausche Karten mit deinem Jahrgang und miss dich in epischen Stats-Battles.
                   </p>
                   <ul className="space-y-3">
                      {['Tägliche Booster-Packs', 'Echtzeit-Tauschbörse', 'Raritäten & Rankings'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold">
                           <div className="h-1.5 w-1.5 rounded-full bg-white" />
                           {item}
                        </li>
                      ))}
                   </ul>
                </div>
                <div className="pt-10">
                   <Button asChild className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 bg-white text-brand hover:bg-white/90">
                      <a href={`${dashboardBaseUrl}/vorteile/sammelkarten`}>Karten-Action</a>
                   </Button>
                </div>
             </motion.div>
          </div>
        </section>

        {/* Public Stats - Compact & Stylish */}
        <section className="px-6 pb-24 md:pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Am Start',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.totalUsers),
                  icon: Users,
                },
                {
                  label: 'Aktiv (24h)',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.dailyActiveUsers),
                  icon: Clock3,
                },
                {
                  label: 'Karten-Drops',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.totalCards),
                  icon: Layers3,
                },
                {
                  label: 'Updates',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.newsCount),
                  icon: Sparkles,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <item.icon className="h-4 w-4 text-brand" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="text-3xl md:text-4xl font-black tracking-tight italic uppercase leading-none text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial Section - Why the platform exists */}
        <section className="px-6 pb-20 md:pb-28">
          <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <div className="rounded-[3rem] border border-border/60 bg-card/70 p-8 md:p-12 shadow-sm backdrop-blur-sm space-y-6">
              <p className="text-brand font-black uppercase tracking-[0.4em] text-[10px]">Worum es wirklich geht</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight italic uppercase leading-[0.9] max-w-3xl">
                Ein Jahrgang braucht mehr als Chat-Chaos und lose Notizen.
              </h2>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground max-w-3xl">
                <p>
                  ABI Planer bündelt die Dinge, die sonst in einzelnen Gruppen, Tabellen und Nachrichten
                  verschwinden: Budget, Aufgaben, Termine, Abstimmungen, Rollen und die kleinen
                  Entscheidungen, die am Ende den Unterschied machen.
                </p>
                <p>
                  Dadurch entsteht nicht nur ein Werkzeug für die Organisation, sondern ein nachvollziehbarer
                  Ort für euren Jahrgang. Wer später nachschauen will, was beschlossen wurde oder wer was
                  übernimmt, findet die Antwort an einer zentralen Stelle statt in verstreuten Chats.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  title: 'Planung mit Überblick',
                  text: 'Ihr seht Finanzen, Aufgaben und Deadlines zusammen und müsst nicht mehr zwischen mehreren Tools springen.',
                },
                {
                  title: 'Mitbestimmung statt Durcheinander',
                  text: 'Abstimmungen und News geben jedem Jahrgang eine klare, dokumentierte Grundlage für Entscheidungen.',
                },
                {
                  title: 'Motivation für den Alltag',
                  text: 'Sammelkarten, Rankings und kleine Fortschrittsanzeigen sorgen dafür, dass die Plattform nicht nur praktisch, sondern auch nutzbar bleibt.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[2rem] border border-border/60 bg-background/80 p-6 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-foreground">{item.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Grid - Student Copy */}
        <section id="features" className="py-32 bg-secondary/10 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 space-y-4">
              <p className="text-brand font-black uppercase tracking-[0.4em] text-[10px]">Alles was ihr braucht</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight italic uppercase">Volle Kontrolle.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1: Finances */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="md:col-span-2 bg-card border border-border/50 p-10 rounded-[3rem] flex flex-col justify-between group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <DollarSign className="h-40 w-40 text-brand -mr-10 -mt-10" />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight italic">Cash im Griff</h3>
                  <p className="text-muted-foreground text-lg max-w-md">Behaltet Einnahmen und Ausgaben transparent im Blick. Automatische Kalkulationen helfen euch, das Sparziel für den Abiball sicher zu erreichen.</p>
                </div>
                <div className="pt-8 relative z-10">
                   <a href={`${dashboardBaseUrl}/vorteile/finanzen`} className="inline-flex items-center text-brand font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                      Details ansehen <ArrowRight className="h-4 w-4" />
                   </a>
                </div>
              </motion.div>

              {/* Feature 2: Groups */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-brand text-brand-foreground p-10 rounded-[3rem] space-y-8 shadow-2xl shadow-brand/20"
              >
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Euer Team</h3>
                  <p className="text-brand-foreground/80 font-medium">Koordiniert Aufgaben in Teams wie Abizeitung oder Merch. Behaltet Deadlines im Griff und arbeitet effizient zusammen.</p>
                </div>
                <div className="pt-2">
                   <a href={`${dashboardBaseUrl}/vorteile/gruppen`} className="inline-flex items-center text-brand-foreground font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                      Details ansehen <ArrowRight className="h-4 w-4" />
                   </a>
                </div>
              </motion.div>

              {/* Feature 3: Polls */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-card border border-border/50 p-10 rounded-[3rem] space-y-8"
              >
                <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Eure Stimme</h3>
                  <p className="text-muted-foreground font-medium">Trefft wichtige Entscheidungen schnell und für alle nachvollziehbar. Schluss mit dem Chaos in Messenger-Gruppen.</p>
                </div>
                <div className="pt-2">
                   <a href={`${dashboardBaseUrl}/vorteile/abstimmungen`} className="inline-flex items-center text-brand font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                      Details ansehen <ArrowRight className="h-4 w-4" />
                   </a>
                </div>
              </motion.div>

              {/* Feature 4: Calendar */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="md:col-span-2 bg-card border border-border/50 p-10 rounded-[3rem] flex flex-col md:flex-row gap-10 items-center overflow-hidden relative group"
              >
                <div className="space-y-4 flex-1">
                  <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight italic">Alle Termine</h3>
                  <p className="text-muted-foreground text-lg">Alle Termine an einem Ort – von der ersten Party bis zur Zeugnisvergabe. Synchronisiert für den gesamten Jahrgang.</p>
                  <div className="pt-2">
                    <a href={`${dashboardBaseUrl}/vorteile/kalender`} className="inline-flex items-center text-brand font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                        Details ansehen <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <div className="w-full md:w-64 aspect-square bg-muted/30 rounded-2xl flex items-center justify-center border border-border/50 group-hover:border-brand/30 transition-colors">
                   <Clock3 className="h-20 w-20 text-brand/20 group-hover:text-brand/40 transition-colors" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Sammelkarten Feature Section (Redesigned) */}
        <section
          id="tcg"
          className={isDarkTheme
            ? 'py-32 px-6 relative overflow-hidden bg-zinc-950 text-white'
            : 'py-32 px-6 relative overflow-hidden bg-background text-foreground'}
        >
          {/* Immersive Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={isDarkTheme
                ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(125,210,0,0.15),transparent_70%)]'
                : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(125,210,0,0.10),transparent_72%)]'}
            />
            <div className={isDarkTheme ? "absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03] invert" : "absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.04]"} />
            
            {/* Floating Particles/Glows */}
            <motion.div 
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.2, 0.4, 0.2] 
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className={isDarkTheme ? 'absolute top-1/4 left-1/4 w-64 h-64 bg-brand/20 rounded-full blur-[100px]' : 'absolute top-1/4 left-1/4 w-64 h-64 bg-brand/10 rounded-full blur-[110px]'} 
            />
            <motion.div 
              animate={{ 
                y: [0, 20, 0],
                opacity: [0.1, 0.3, 0.1] 
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className={isDarkTheme ? 'absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]' : 'absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]'} 
            />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
             <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-24 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-10"
                >
                   <div className="space-y-6">
                      <div className={isDarkTheme ? 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 border border-brand/30 text-brand-foreground text-[10px] font-black uppercase tracking-[0.3em]' : 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-[0.3em]'}>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Karten-Action für euch</span>
                      </div>
                      <h2 className={isDarkTheme ? 'text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.9]' : 'text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.9] text-foreground'}>
                        Sammeln. <br />
                        <span className="text-brand">Tauschen. Kämpfen.</span>
                      </h2>
                      <p className={isDarkTheme ? 'text-zinc-400 text-xl leading-relaxed max-w-xl' : 'text-muted-foreground text-xl leading-relaxed max-w-xl'}>
                        Holt euch eure Lehrer und Mitschüler als digitale Karten. Mit individuellen Werten, Seltenheitsstufen und epischen Battles direkt in der App.
                      </p>
                   </div>

                   <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { title: 'Tägliche Booster', desc: 'Jeden Tag neue Karten-Pakete for free abstauben.', icon: Zap },
                        { title: 'Legendäre Drops', desc: 'Holos, Gold-Editions und extrem seltene Iconic-Karten.', icon: Sparkles },
                        { title: 'Tauschbörse', desc: 'Tausche Karten live mit deinen Freunden.', icon: Workflow },
                        { title: 'Stats Battle', desc: 'Miss deine Karten mit anderen im Stufen-Ranking.', icon: Trophy },
                      ].map((item, i) => (
                        <div key={i} className={isDarkTheme ? 'p-6 bg-white/5 border border-white/10 rounded-3xl group hover:bg-brand/5 hover:border-brand/20 transition-all' : 'p-6 bg-card border border-border/60 rounded-3xl group hover:bg-brand/5 hover:border-brand/20 transition-all shadow-sm'}>
                          <div className={isDarkTheme ? 'h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-4 group-hover:scale-110 transition-transform' : 'h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-4 group-hover:scale-110 transition-transform'}>
                              <item.icon className="h-5 w-5" />
                           </div>
                          <p className={isDarkTheme ? 'font-bold text-zinc-100' : 'font-bold text-foreground'}>{item.title}</p>
                          <p className={isDarkTheme ? 'text-xs text-zinc-500 mt-1 leading-relaxed' : 'text-xs text-muted-foreground mt-1 leading-relaxed'}>{item.desc}</p>
                        </div>
                      ))}
                   </div>

                   <div className="flex flex-wrap gap-4 pt-4">
                      <Button size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/40">
                        <a href={`${dashboardBaseUrl}/register`}>Account erstellen</a>
                      </Button>
                      <Button variant="ghost" asChild className={isDarkTheme ? 'h-16 px-8 text-xs font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white' : 'h-16 px-8 text-xs font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-muted/70 text-muted-foreground hover:text-foreground'}>
                        <a href={`${dashboardBaseUrl}/vorteile/sammelkarten`}>Wie es funktioniert</a>
                      </Button>
                   </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  className="relative flex justify-center overflow-hidden w-full"
                >
                   {/* Decorative Rings around the carousel */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className={cn(
                         "w-[120%] aspect-square border rounded-full animate-[spin_20s_linear_infinite] will-change-transform opacity-30",
                         isDarkTheme ? "border-brand/20" : "border-brand/10"
                       )} />
                       <div className={cn(
                         "w-[140%] aspect-square border rounded-full animate-[spin_30s_linear_infinite_reverse] will-change-transform opacity-20",
                         isDarkTheme ? "border-white/10" : "border-border/60"
                       )} />
                   </div>
                   
                   <div className="relative z-10 py-20">
                      <SammelkartenPromo isAuthenticated={isAuthenticated} mode="minimal" />
                      
                      {/* Floating Labels */}
                      <motion.div 
                        animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className={isDarkTheme ? 'absolute -top-4 -right-10 bg-brand text-brand-foreground px-4 py-2 rounded-2xl shadow-2xl rotate-12 font-black text-[10px] uppercase tracking-widest hidden md:block' : 'absolute -top-4 -right-10 bg-brand text-brand-foreground px-4 py-2 rounded-2xl shadow-xl rotate-12 font-black text-[10px] uppercase tracking-widest hidden md:block'}
                      >
                        Legendär
                      </motion.div>
                      <motion.div 
                        animate={{ x: [0, -8, 0], y: [0, 12, 0] }}
                        transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                        className={isDarkTheme ? 'absolute -bottom-6 -left-12 bg-zinc-800 text-white border border-white/10 px-4 py-2 rounded-2xl shadow-2xl -rotate-6 font-black text-[10px] uppercase tracking-widest hidden md:block' : 'absolute -bottom-6 -left-12 bg-card text-foreground border border-border/60 px-4 py-2 rounded-2xl shadow-xl -rotate-6 font-black text-[10px] uppercase tracking-widest hidden md:block'}
                      >
                        Iconic
                      </motion.div>
                   </div>
                </motion.div>
             </div>
          </div>
        </section>

        {/* Social / News Stream (Interactive Hover) */}
        <section className="py-32 bg-secondary/10 px-6">
          <div className="max-w-7xl mx-auto space-y-16">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                   <p className="text-brand font-black uppercase tracking-[0.4em] text-[10px]">News & Infos</p>
                   <h2 className="text-4xl md:text-6xl font-black tracking-tight italic uppercase leading-none">
                      Jahrgangs <br />
                      Updates.
                   </h2>
                </div>
                <Button variant="outline" asChild className="h-14 px-8 border-2 border-brand/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand/5">
                   <Link href="/news">Alle News lesen <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
                <Skeleton
                  name="landing-news"
                  loading={landingNewsLoading}
                  className="md:col-span-3 grid md:grid-cols-3 gap-8"
                  fixture={
                    <div className="md:col-span-3 grid md:grid-cols-3 gap-8">
                      {[1, 2, 3].map((i) => (
                        <article key={i} className="bg-card border border-border/50 h-full p-8 rounded-[2.5rem] space-y-6 flex flex-col">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand">
                            <Skeleton className="bg-brand/10 px-3 py-1 rounded-full w-20 h-4" />
                            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Update</span>
                          </div>
                          <div className="space-y-3 flex-1">
                            <Skeleton className="h-8 w-5/6 rounded-xl bg-muted/60" />
                            <Skeleton className="h-4 w-full rounded bg-muted/50" />
                            <Skeleton className="h-4 w-4/5 rounded bg-muted/50" />
                          </div>
                          <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mehr erfahren</span>
                            <Skeleton className="h-4 w-4 rounded-full bg-brand/70" />
                          </div>
                        </article>
                      ))}
                    </div>
                  }                >
                {landingNewsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />
                  ))
                ) : landingNews.length > 0 ? (
                  landingNews.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link href={`/news/${item.id}`} className="group block h-full">
                        <article className="bg-card border border-border/50 h-full p-8 rounded-[2.5rem] space-y-6 hover:border-brand/50 hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500 flex flex-col">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand">
                              <span className="bg-brand/10 px-3 py-1 rounded-full">{item.created_at ? toDate(item.created_at).toLocaleDateString('de-DE') : 'Neu'}</span>
                              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Update</span>
                           </div>
                           <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-brand transition-colors flex-1">{item.title}</h3>
                           <p className="text-muted-foreground text-sm line-clamp-2 font-medium">
                              {String(item.content || '').replace(/[#*_`>\[\]\(\)]/g, '')}
                           </p>
                           <div className="pt-4 border-t border-border/50 flex items-center justify-between group-hover:border-brand/20 transition-colors">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mehr erfahren</span>
                              <ChevronRight className="h-4 w-4 text-brand opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                           </div>
                        </article>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="md:col-span-3 p-20 text-center border-2 border-dashed border-border rounded-[3rem]">
                     <p className="text-muted-foreground italic text-lg">Keine aktuellen Updates verfügbar.</p>
                  </div>
                )}
                </Skeleton>
             </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-40 px-6 relative overflow-hidden text-center">
          <div className="max-w-4xl mx-auto space-y-12 relative z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-[0.85]">
                Bereit für <br />
                <span className="text-brand drop-shadow-[0_0_20px_rgba(125,210,0,0.4)]">das Finale?</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium">
                Schließt euch eurem Jahrgang an und macht euer Abi legendär. Kostenlos für alle Schüler.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
            >
               <Button size="lg" asChild className="h-20 px-12 text-sm font-black uppercase tracking-[0.3em] rounded-3xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/40 group">
                  <a href={`${dashboardBaseUrl}/register`}>
                    Jetzt joinen
                    <Rocket className="ml-3 h-6 w-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </a>
               </Button>
               <Button variant="ghost" asChild className="h-20 px-10 text-sm font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-brand/5">
                  <a href={`${dashboardBaseUrl}/login`}>Einloggen</a>
               </Button>
            </motion.div>
          </div>
          
          {/* Large Abstract Shape */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand/5 blur-[150px] -z-10 rounded-full animate-pulse" />
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [rootMode, setRootMode] = useState<'unknown' | 'landing' | 'dashboard'>('unknown')
  const isBoneyardBuild = typeof window !== 'undefined' && Boolean((window as any).__BONEYARD_BUILD)
  const { user, profile, loading: authLoading } = useAuth()
  const [features, setFeatures] = useState<SystemFeatures | null>(null)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        setFeatures(snap.data() as SystemFeatures)
      }
    })
    return () => unsub()
  }, [])
  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [allFinances, setAllFinances] = useState<FinanceEntry[]>([])
  const [allShopEarnings, setAllShopEarnings] = useState<ShopEarning[]>([])
  const [currentFunding, setCurrentFunding] = useState(0)
  const [expenseGoal, setExpenseGoal] = useState(0)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [initialLoadState, setInitialLoadState] = useState({
    settings: false,
    todos: false,
    events: false,
    finances: false,
    shopEarnings: false,
    news: false,
    polls: false,
  })

  const markLoaded = (key: keyof typeof initialLoadState) => {
    setInitialLoadState((previous) => (previous[key] ? previous : { ...previous, [key]: true }))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = window.location.hostname
    const isDashboardHost = host.startsWith('dashboard.') || host.startsWith('app.')
    setRootMode(isDashboardHost ? 'dashboard' : 'landing')
  }, [])

  useEffect(() => {
    if (rootMode === 'landing' && user && !authLoading) {
      window.location.href = getDashboardRedirectUrl(window.location)
    }
  }, [rootMode, user, authLoading])

  useEffect(() => {
    if (isBoneyardBuild) return
    if (rootMode !== 'dashboard') return
    if (authLoading) return
    if (!user) {
      router.replace('/login')
    }
  }, [authLoading, isBoneyardBuild, rootMode, router, user])

  useEffect(() => {
    if (rootMode !== 'dashboard') return
    const timer = setTimeout(() => {
      setTimeoutReached(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [rootMode])

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
      markLoaded('shopEarnings')
      markLoaded('polls')
    }

    return () => {
      unsubscribeSettings()
      unsubscribeTodos()
      unsubscribeEvents()
      unsubscribeFinances()
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
    leaderboard: '/finanzen',
    cards: '/sammelkarten'
  }

  const resolvedRootMode =
    rootMode === 'unknown' && isBoneyardBuild && typeof window !== 'undefined'
      ? (window.location.hostname.startsWith('dashboard.') || window.location.hostname.startsWith('app.') ? 'dashboard' : 'landing')
      : rootMode

  if (resolvedRootMode === 'unknown') {
    return <div className="min-h-screen bg-background" />
  }

  if (resolvedRootMode === 'landing') {
    return <MainDomainLanding isAuthenticated={!!user} />
  }

  if (!isBoneyardBuild && (authLoading || !user)) {
    return <div className="min-h-screen bg-background" />
  }

  const NewsPreview = ({ items, loading }: { items: any[], loading?: boolean }) => (
    <Card className="flex flex-col border-border/40 shadow-card overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border bg-muted/10 shrink-0">
        <CardTitle className="text-lg font-bold">Letzte Updates</CardTitle>
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
                        {item.created_at ? toDate(item.created_at).toLocaleDateString('de-DE') : 'Neu'}
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
                    <div className="mt-2 flex items-center justify-end text-[10px] font-medium text-brand">
                      <span className="inline-flex items-center gap-1">
                        Zum Beitrag <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">Noch keine Neuigkeiten vorhanden.</p>
          )}
          <Link href="/news" onClick={(e) => e.stopPropagation()} className="block py-4 text-xs font-semibold text-center hover:underline text-muted-foreground">
            Alle News ansehen
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  const renderComponent = (key: DashboardComponentKey) => {
    const ComponentContent = () => {
      switch (key) {
        case 'funding':
          return (
            <div className="flex flex-col">
              <Skeleton
                name="dashboard-funding"
                loading={!initialLoadState.settings || !initialLoadState.finances}
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
                goal={settings?.funding_goal ?? 10000}
                initialTicketSales={settings?.expected_ticket_sales ?? 150}
                onTicketSalesChange={canEditTicketSales ? handleTicketSalesChange : undefined}
                canEditTicketSales={canEditTicketSales}
                isAuthenticated={!!user}
                loading={!initialLoadState.settings || !initialLoadState.finances}
              />
              </Skeleton>
            </div>
          )
        case 'news':
          return (
            <div className="flex flex-col">
              <Skeleton
                name="dashboard-news"
                loading={!initialLoadState.news}
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
                <NewsPreview key="news" items={news.slice(0, 2)} loading={!initialLoadState.news} />
              </Skeleton>
            </div>
          )
        case 'todos':
          return (
            <div className="flex flex-col">
              <Skeleton
                name="dashboard-todos"
                loading={!initialLoadState.todos}
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
                  loading={!initialLoadState.todos}
                />
              </Skeleton>
            </div>
          )
        case 'events':
          return (
            <div className="flex flex-col">
              <Skeleton
                name="dashboard-events"
                loading={!initialLoadState.events}
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
                  loading={!initialLoadState.events}
                />
              </Skeleton>
            </div>
          )
        case 'polls':
          return null
        case 'leaderboard':
          return (
            <div className="flex flex-col">
              <Skeleton
                name="dashboard-leaderboard"
                loading={!initialLoadState.finances}
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
                  loading={!initialLoadState.finances || !initialLoadState.shopEarnings}
                />
              </Skeleton>
            </div>
          )
        case 'cards':
          return (
            <div className="flex flex-col">
              <Skeleton
                name="dashboard-cards"
                loading={authLoading}
                fixture={
                  <div className="overflow-hidden border border-border/40 rounded-2xl bg-card shadow-subtle h-[340px] flex flex-col">
                    <div className="pb-2 p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <Skeleton className="h-6 w-24 bg-muted/60" />
                      </div>
                      <Skeleton className="h-8 w-48 bg-muted/60" />
                    </div>
                    <div className="p-4 space-y-4">
                      <Skeleton className="h-4 w-56 bg-muted/60" />
                      <Skeleton className="h-4 w-40 bg-muted/40" />
                      <div className="flex flex-wrap gap-2 py-1">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-6 w-16 rounded-full bg-muted/60" />
                        ))}
                      </div>
                      <Skeleton className="h-10 w-full rounded-xl bg-muted/60" />
                    </div>
                  </div>
                }
              >
                <SammelkartenPromo isAuthenticated={!!user} loading={authLoading} />
              </Skeleton>
            </div>
          )
        default:
          return null
      }
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
          <ComponentContent />
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
              loading={!initialLoadState.polls}
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
                canVote={!!currentUserId}
                canManage={canManage}
                useScrollContainer={false}
                loading={!initialLoadState.polls}
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
    if (key === 'news' && !isFeatureEnabled('news_status', 'is_news_enabled')) return items
    if (key === 'cards' && !isFeatureEnabled('sammelkarten_status', 'is_sammelkarten_enabled')) return items

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
            />
          )}
        </div>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Willkommen zurück!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          {dashboardItems
            .filter((_, i) => i % 2 === 0)
            .map((item) => (item.type === 'poll' ? renderPollComponent(item.poll) : renderComponent(item.key)))}
        </div>
        <div className="flex flex-col gap-6">
          {dashboardItems
            .filter((_, i) => i % 2 !== 0)
            .map((item) => (item.type === 'poll' ? renderPollComponent(item.poll) : renderComponent(item.key)))}
        </div>
      </div>
    </div>
  )
}
