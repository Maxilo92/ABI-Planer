'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { Trophy, Gift, Swords, ArrowLeftRight, ShoppingBag, Sparkles, ChevronRight, Star, History, Play } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTcgBaseUrl } from '@/lib/dashboard-url'
import { useSammelkartenConfig } from '../hooks/useSammelkartenConfig'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function TcgDashboard() {
  const { user, profile } = useAuth()
  const { getRemainingBoosters, getRemainingSupportBoosters, teachers: userTeachers } = useUserTeachers()
  const { config, isTradingEnabled, isCombatEnabled, timeLeft } = useSammelkartenConfig()
  
  const totalBoosters = getRemainingBoosters() + getRemainingSupportBoosters()
  const teacherCount = userTeachers ? Object.keys(userTeachers).length : 0
  
  // Calculate completion percentage
  const totalAvailableTeachers = config?.loot_teachers?.length || 0
  const completionRate = totalAvailableTeachers > 0 
    ? Math.round((teacherCount / totalAvailableTeachers) * 100) 
    : 0

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      
      {/* HERO HERO SECTION - Immersive Booster opening focus */}
      <section className="relative min-h-[450px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-950 flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-slate-950 to-secondary/20" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/30 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
          
          {/* Moving Sparkles Overlay */}
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
        </div>

        <div className="relative z-10 w-full px-8 md:px-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Sammelkarten Modul</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
                Dein <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Lehrer</span> Album.
              </h1>
              <p className="mt-6 text-lg text-slate-300 max-w-lg leading-relaxed font-medium">
                Öffne tägliche Booster, vervollständige deine Sammlung und bereite dein Deck für die kommenden Duelle vor.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Link href="/booster" className="group">
                <Button size="lg" className="h-16 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 font-black text-lg gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-all">
                  <Play className="h-6 w-6 fill-current" />
                  Booster öffnen
                  {totalBoosters > 0 && (
                    <Badge className="ml-2 bg-primary text-white border-none h-6 w-6 flex items-center justify-center p-0 rounded-full animate-bounce">
                      {totalBoosters}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Link href="/shop?category=sammelkarten">
                <Button size="lg" variant="outline" className="h-16 px-8 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black text-lg gap-3 backdrop-blur-md">
                  <ShoppingBag className="h-5 w-5" />
                  Karten-Shop
                </Button>
              </Link>
            </motion.div>
            
            {totalBoosters === 0 && (
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
                Nächste Gratis-Packs in <span className="text-primary">{timeLeft}</span>
              </p>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="hidden lg:flex justify-center items-center relative"
          >
            {/* Visual card fan or booster pack */}
            <div className="relative w-[300px] h-[420px]">
              <div className="absolute top-0 left-0 w-full h-full bg-primary/20 rounded-[2rem] blur-3xl animate-pulse" />
              <div className="relative z-10 w-full h-full rounded-[2.5rem] border-4 border-white/10 overflow-hidden shadow-2xl rotate-[-6deg] translate-x-[-20px] bg-slate-900 flex items-center justify-center">
                 <Trophy className="h-32 w-32 text-primary opacity-20" />
              </div>
              <div className="absolute top-4 left-4 w-full h-full rounded-[2.5rem] border-4 border-white/20 overflow-hidden shadow-2xl rotate-[6deg] translate-x-[20px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                 <Sparkles className="h-32 w-32 text-white animate-pulse" />
                 <div className="absolute bottom-8 left-0 right-0 text-center">
                    <span className="text-white font-black text-2xl tracking-tighter uppercase italic">Legendary Pack</span>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK STATUS BAR - Minimal and clean */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
        {[
          { label: 'Sammlung', value: `${completionRate}%`, sub: `${teacherCount}/${totalAvailableTeachers} Karten`, icon: Trophy, color: 'text-amber-400' },
          { label: 'Booster', value: totalBoosters, sub: 'Verfügbar', icon: Gift, color: 'text-primary' },
          { label: 'Trades', value: isTradingEnabled ? 'Aktiv' : 'Bald', sub: 'Trading Hub', icon: ArrowLeftRight, color: 'text-emerald-400' },
          { label: 'Kämpfe', value: isCombatEnabled ? 'Bereit' : 'Warteschlange', sub: 'Decks testen', icon: Swords, color: 'text-destructive' },
        ].map((stat, i) => (
          <div key={i} className="group p-6 rounded-[2rem] bg-card border border-border/40 hover:border-primary/30 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-3 rounded-2xl bg-secondary/50", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-black tracking-tight">{stat.value}</p>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              <span className="text-xs text-muted-foreground/60">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT ACTIVITY & ALBUM PREVIEW SECTION */}
      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* Left Side: Progress & Shortcuts */}
        <div className="lg:col-span-1 space-y-10 px-4">
          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Star className="h-6 w-6 text-primary" />
              Quick Access
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Mein Lehrer-Album', href: '/album', icon: Trophy, desc: 'Alle Karten im Überblick' },
                { label: 'Deck Editor', href: '/sammelkarten?view=decks', icon: Swords, desc: 'Stelle dein Team zusammen' },
                { label: 'Trading Hub', href: '/sammelkarten/tausch', icon: ArrowLeftRight, desc: 'Karten mit Freunden tauschen', disabled: !isTradingEnabled },
                { label: 'Battle Pass', href: '/battle-pass', icon: History, desc: 'Deine Season-Fortschritte' },
              ].map((link, i) => (
                <Link 
                  key={i} 
                  href={link.disabled ? '#' : link.href}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border transition-all",
                    link.disabled 
                      ? "opacity-50 grayscale cursor-not-allowed border-border/20 bg-muted/20" 
                      : "bg-card border-border/40 hover:border-primary/40 hover:translate-x-2 shadow-sm hover:shadow-md"
                  )}
                >
                  <div className="p-3 rounded-xl bg-secondary/50 text-primary">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <Card className="rounded-[2rem] border-primary/20 bg-primary/5 overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <h3 className="font-black uppercase tracking-widest text-primary text-xs">Season Challenge</h3>
              <p className="text-lg font-bold leading-snug">Vervollständige die "Krieger der Kreide" Serie für ein exklusives Shiny-Pack!</p>
              <div className="w-full bg-primary/10 rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-primary h-full w-[45%]" />
              </div>
              <p className="text-xs font-bold text-muted-foreground text-right">45% Abgeschlossen</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Large Album Preview */}
        <div className="lg:col-span-2 space-y-6 px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <History className="h-6 w-6 text-primary" />
              Deine Sammlung
            </h2>
            <Link href="/album">
              <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest hover:bg-primary/10 hover:text-primary">Ganzes Album ansehen →</Button>
            </Link>
          </div>
          
          <div className="rounded-[2.5rem] border border-border/40 bg-card/50 backdrop-blur-sm shadow-inner p-2 overflow-hidden h-[600px]">
             {/* Integrating the actual album but contained */}
             <div className="w-full h-full overflow-y-auto scrollbar-hide px-4 py-6">
                <TeacherAlbum initialLimit={18} />
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
