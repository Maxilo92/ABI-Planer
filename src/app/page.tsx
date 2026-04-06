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
import { DashboardComponentKey, Poll, PollOption, PollVote, FinanceEntry } from '@/types/database'
import Link from 'next/link'
import { 
  ArrowRight, 
  Calendar, 
  CheckSquare, 
  Clock3, 
  DollarSign, 
  Layers3, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Workflow, 
  Rocket,
  ChevronRight,
  Target,
  Zap,
  Trophy
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { motion, useScroll, useSpring } from 'framer-motion'
import { logAction } from '@/lib/logging'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MainDomainLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [landingNews, setLandingNews] = useState<any[]>([])
  const [landingNewsLoading, setLandingNewsLoading] = useState(true)
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
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-52 md:pb-40 px-6">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto text-center space-y-12"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand shadow-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Zentrale Plattform für euren Jahrgang</span>
            </motion.div>
            
            <div className="max-w-5xl mx-auto space-y-8">
              <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] uppercase italic">
                Euer Abschluss. <br />
                <span className="text-brand drop-shadow-[0_0_30px_rgba(125,210,0,0.3)]">
                  Organisiert.
                </span>
              </motion.h1>
              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
                Vom Budget-Tracker bis zum digitalen Sammelalbum: Der ABI Planer ist das strukturierte Zuhause für eure gesamte Stufe – sicher, funktional und übersichtlich.
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 pb-20">
              <Button size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/30 group">
                <Link href="/register">
                  Jetzt starten
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl border-2 border-brand/20 hover:bg-brand/5">
                <Link href="/vorteile">Funktionen prüfen</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Public Stats */}
        <section className="px-6 pb-24 md:pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <p className="text-brand font-black uppercase tracking-[0.4em] text-[10px]">Kennzahlen</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight italic uppercase leading-none">
                  Was im Jahrgang passiert.
                </h2>
              </div>
              <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-medium">
                Die wichtigsten öffentlichen Werte auf einen Blick: Nutzeraktivität, Kartenbestand und aktuelle Updates.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Nutzer gesamt',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.totalUsers),
                  hint: 'Registrierte Accounts im System',
                  icon: Users,
                },
                {
                  label: 'Täglich aktiv',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.dailyActiveUsers),
                  hint: 'Besuche innerhalb der letzten 24 Stunden',
                  icon: Clock3,
                },
                {
                  label: 'Karten im Inventar',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.totalCards),
                  hint: 'Gesamte Karten im Umlauf',
                  icon: Layers3,
                },
                {
                  label: 'News-Beiträge',
                  value: landingStatsLoading ? '...' : formatMetric(landingStats.newsCount),
                  hint: 'Aktuelle Beiträge und Updates',
                  icon: Sparkles,
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -6 }}
                  className="group rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-10 flex items-start justify-between gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">{item.label}</p>
                    <p className="text-4xl md:text-5xl font-black tracking-tight italic uppercase leading-none text-foreground">
                      {item.value}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">{item.hint}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-32 bg-secondary/20 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 space-y-4">
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-brand font-black uppercase tracking-[0.4em] text-[10px]"
              >
                Die Plattform
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black tracking-tight italic uppercase"
              >
                Alles unter Kontrolle.
              </motion.h2>
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
                  <h3 className="text-3xl font-black uppercase tracking-tight italic">Finanzplanung & Prognosen</h3>
                  <p className="text-muted-foreground text-lg max-w-md">Behaltet Einnahmen und Ausgaben transparent im Blick. Automatische Kalkulationen helfen euch, das Sparziel für den Abiball sicher zu erreichen.</p>
                </div>
                <div className="pt-8 relative z-10">
                   <Link href="/vorteile/finanzen" className="inline-flex items-center text-brand font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                      Details ansehen <ArrowRight className="h-4 w-4" />
                   </Link>
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
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Projekt-Teams</h3>
                  <p className="text-brand-foreground/80 font-medium">Koordiniert Aufgaben in Teams wie Abizeitung oder Merch. Behaltet Deadlines im Griff und arbeitet effizient zusammen.</p>
                </div>
                <div className="pt-2">
                   <Link href="/vorteile/gruppen" className="inline-flex items-center text-brand-foreground font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                      Details ansehen <ArrowRight className="h-4 w-4" />
                   </Link>
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
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Demokratische Votings</h3>
                  <p className="text-muted-foreground font-medium">Trefft wichtige Entscheidungen schnell und für alle nachvollziehbar. Schluss mit dem Chaos in Messenger-Gruppen.</p>
                </div>
                <div className="pt-2">
                   <Link href="/vorteile/abstimmungen" className="inline-flex items-center text-brand font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                      Details ansehen <ArrowRight className="h-4 w-4" />
                   </Link>
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
                  <h3 className="text-3xl font-black uppercase tracking-tight italic">Zentraler Terminkalender</h3>
                  <p className="text-muted-foreground text-lg">Alle Termine an einem Ort – von der ersten Party bis zur Zeugnisvergabe. Synchronisiert für den gesamten Jahrgang.</p>
                  <div className="pt-2">
                    <Link href="/vorteile/kalender" className="inline-flex items-center text-brand font-black uppercase tracking-widest text-[10px] gap-2 hover:gap-3 transition-all">
                        Details ansehen <ArrowRight className="h-4 w-4" />
                    </Link>
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
                        <span>Das Jahrgangs-Highlight</span>
                      </div>
                      <h2 className={isDarkTheme ? 'text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.9]' : 'text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.9] text-foreground'}>
                        Das digitale <br />
                        <span className="text-brand">Sammelalbum.</span>
                      </h2>
                      <p className={isDarkTheme ? 'text-zinc-400 text-xl leading-relaxed max-w-xl' : 'text-muted-foreground text-xl leading-relaxed max-w-xl'}>
                        Erinnerungen für die Ewigkeit. Sammelt Lehrer und Mitschüler als digitale Karten mit individuellen Werten, Seltenheitsstufen und integrierter Tauschfunktion.
                      </p>
                   </div>

                   <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { title: 'Karten-Pakete', desc: 'Täglich neue Karten für alle aktiven Planer.', icon: Zap },
                        { title: 'Seltene Editionen', desc: 'Holos, Gold-Editions und extrem seltene Iconic-Drops.', icon: Sparkles },
                        { title: 'Tauschbörse', desc: 'Tausche Karten in Echtzeit mit deinem Jahrgang.', icon: Workflow },
                        { title: 'Album-System', desc: 'Inklusive Album-System und Stufen-Ranking.', icon: Trophy },
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
                        <Link href="/register">Account erstellen</Link>
                      </Button>
                      <Button variant="ghost" asChild className={isDarkTheme ? 'h-16 px-8 text-xs font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white' : 'h-16 px-8 text-xs font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-muted/70 text-muted-foreground hover:text-foreground'}>
                        <Link href="/vorteile/sammelkarten">Wie es funktioniert</Link>
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
                        Selten
                      </motion.div>
                   </div>
                </motion.div>
             </div>
          </div>
        </section>

        {/* Social / News Stream (Interactive Hover) */}
        <section className="py-32 bg-secondary/20 px-6">
          <div className="max-w-7xl mx-auto space-y-16">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                   <p className="text-brand font-black uppercase tracking-[0.4em] text-[10px]">Bleibt dran</p>
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
                Schließt euch eurem Jahrgang an und bringt Struktur in das Chaos. Kostenlos für alle Schüler.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
            >
               <Button size="lg" asChild className="h-20 px-12 text-sm font-black uppercase tracking-[0.3em] rounded-3xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/40 group">
                  <Link href="/register">
                    Account erstellen
                    <Rocket className="ml-3 h-6 w-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </Link>
               </Button>
               <Button variant="ghost" asChild className="h-20 px-10 text-sm font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-brand/5">
                  <Link href="/login">Einloggen</Link>
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
  const { user, profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [allFinances, setAllFinances] = useState<FinanceEntry[]>([])
  const [currentFunding, setCurrentFunding] = useState(0)
  const [expenseGoal, setExpenseGoal] = useState(0)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [initialLoadState, setInitialLoadState] = useState({
    settings: false,
    todos: false,
    events: false,
    finances: false,
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
    if (rootMode !== 'dashboard') return
    if (authLoading) return
    if (!user) {
      router.replace('/login')
    }
  }, [authLoading, rootMode, router, user])

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
      markLoaded('polls')
    }

    return () => {
      unsubscribeSettings()
      unsubscribeTodos()
      unsubscribeEvents()
      unsubscribeFinances()
      unsubscribeNews()
      unsubscribePolls()
    }
  }, [user?.uid, profile?.id, profile?.class_name, profile?.planning_groups, authLoading, rootMode])

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

  if (rootMode === 'unknown') {
    return <div className="min-h-screen bg-background" />
  }

  if (rootMode === 'landing') {
    return <MainDomainLanding isAuthenticated={!!user} />
  }

  if (authLoading || !user) {
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
            </div>
          )
        case 'news':
          return <div className="flex flex-col"><NewsPreview key="news" items={news.slice(0, 2)} loading={!initialLoadState.news} /></div>
        case 'todos':
          return (
            <div className="flex flex-col">
              <TodoList
                key="todos"
                todos={todos || []}
                canManage={canManage}
                maxItems={5}
                useScrollContainer={false}
                loading={!initialLoadState.todos}
              />
            </div>
          )
        case 'events':
          return (
            <div className="flex flex-col">
              <CalendarEvents
                key="events"
                events={events || []}
                maxItems={3}
                useScrollContainer={false}
                loading={!initialLoadState.events}
              />
            </div>
          )
        case 'polls':
          return null
        case 'leaderboard':
          return (
            <div className="flex flex-col">
              <ClassRanking
                key="leaderboard"
                finances={allFinances}
                goal={settings?.funding_goal ?? 10000}
                maxRows={4}
                useScrollContainer={false}
                loading={!initialLoadState.finances}
              />
            </div>
          )
        case 'cards':
          return (
            <div className="flex flex-col">
              <SammelkartenPromo isAuthenticated={!!user} loading={authLoading} />
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
            <PollList
              polls={[poll]}
              userId={currentUserId}
              canVote={!!currentUserId}
              canManage={canManage}
              useScrollContainer={false}
              loading={!initialLoadState.polls}
            />
          </div>
        </div>
      </div>
    )
  }

  type DashboardItem =
    | { type: 'poll'; poll: Poll }
    | { type: 'component'; key: Exclude<DashboardComponentKey, 'polls'> }

  const sortedComponentKeys = sortedComponents.map((key) => key)

  const dashboardItems = sortedComponentKeys.reduce<DashboardItem[]>((items, key) => {
    if (key === 'polls') {
      return [...items, ...unvotedPolls.map((poll) => ({ type: 'poll' as const, poll }))]
    }

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
