'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from 'next-themes'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { LootTeacher, CardVariant } from '@/types/database'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { CardData } from '@/types/cards'
import { getTcgBaseUrl, getDashboardBaseUrl } from '@/lib/dashboard-url'

const FALLBACK_TEACHERS: LootTeacher[] = [
  { 
    id: 'promo-herr-schmidt', 
    name: 'Herr Schmidt', 
    rarity: 'legendary', 
    type: 'teacher',
    description: 'Ein legendärer Lehrer mit unglaublicher Geduld.',
    hp: 120,
    attacks: [{ name: 'Klausur-Schreck', damage: 80 }]
  },
  { 
    id: 'promo-frau-mueller', 
    name: 'Frau Müller', 
    rarity: 'epic', 
    type: 'teacher',
    description: 'Kennt alle Tricks und Kniffe der Mathematik.',
    hp: 100,
    attacks: [{ name: 'Formel-Sturm', damage: 60 }]
  }
]

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',    // slate-400
  rare: '#10b981',      // emerald-500
  epic: '#a855f7',      // purple-500
  mythic: '#ef4444',    // red-500
  legendary: '#f59e0b', // amber-500
  iconic: '#000000',    // black
}

const RARITY_WEIGHTS: Record<string, number> = {
  common: 100,
  rare: 100,
  epic: 100,
  mythic: 100,
  legendary: 100,
  iconic: 100
}

const VARIANT_WEIGHTS: { variant: CardVariant; weight: number }[] = [
  { variant: 'normal', weight: 70 },
  { variant: 'holo', weight: 15 },
  { variant: 'shiny', weight: 10 },
  { variant: 'black_shiny_holo', weight: 5 }
]

export function SammelkartenPromo({ 
  isAuthenticated, 
  loading = false,
  mode = 'default'
}: { 
  isAuthenticated: boolean,
  loading?: boolean,
  mode?: 'default' | 'landing' | 'minimal'
}) {
  const [teachers, setTeachers] = useState<LootTeacher[]>(FALLBACK_TEACHERS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentVariant, setCurrentVariant] = useState<CardVariant>('normal')
  const [isConfigLoading, setIsConfigLoading] = useState(true)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'
  
  const tcgUrl = getTcgBaseUrl()
  const dashboardUrl = getDashboardBaseUrl()

  useEffect(() => {
    // We always try to fetch the settings, as we now allow public read
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        const pool = data.loot_teachers || []
        if (pool.length > 0) {
          setTeachers(pool)
        }
      }
      setIsConfigLoading(false)
    }, (error) => {
      console.error('SammelkartenPromo: Error listening to settings:', error)
      setIsConfigLoading(false)
      // Stay with fallback teachers if error occurs
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (teachers.length === 0) return

    const getRandomIndex = () => {
      const totalWeight = teachers.reduce((sum, t) => sum + (RARITY_WEIGHTS[t.rarity] || 50), 0)
      let random = Math.random() * totalWeight
      
      for (let i = 0; i < teachers.length; i++) {
        const weight = RARITY_WEIGHTS[teachers[i].rarity] || 50
        if (random < weight) return i
        random -= weight
      }
      return 0
    }

    const getRandomVariant = (): CardVariant => {
      const totalWeight = VARIANT_WEIGHTS.reduce((sum, v) => sum + v.weight, 0)
      let random = Math.random() * totalWeight
      
      for (const v of VARIANT_WEIGHTS) {
        if (random < v.weight) return v.variant
        random -= v.weight
      }
      return 'normal'
    }

    const interval = setInterval(() => {
      setCurrentIndex(getRandomIndex())
      setCurrentVariant(getRandomVariant())
    }, 5000)

    return () => clearInterval(interval)
  }, [teachers])

  if (loading || isConfigLoading) {
    if (mode === 'minimal') return <Skeleton className="h-[300px] w-[200px] rounded-2xl mx-auto" />
    
    return (
      <div className={mode === 'landing' ? 'border-y border-border/60 py-10' : ''}>
        <Card className="overflow-hidden border-border/40 shadow-subtle h-[340px] bg-card elevated-card">
          <CardHeader className="pb-2">
            <div className="mb-1 flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
            <div className="flex flex-wrap gap-2 py-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentTeacher = teachers[currentIndex]
  
  if (!currentTeacher) return null

  const cardData: CardData = {
    id: currentTeacher.id,
    cardNumber: (currentIndex + 1).toString().padStart(3, '0'),
    name: currentTeacher.name,
    rarity: currentTeacher.rarity,
    variant: currentVariant,
    color: RARITY_COLORS[currentTeacher.rarity] || '#6366f1',
    description: currentTeacher.description,
    hp: currentTeacher.hp,
    attacks: currentTeacher.attacks
  }

  if (mode === 'minimal') {
    return (
      <div className="mx-auto w-[180px] sm:w-[220px] perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentTeacher.id}-${currentVariant}`}
            initial={{ opacity: 0, scale: 0.8, rotateY: -30, x: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: -10, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 30, x: 30 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="w-full relative z-10"
          >
            <TeacherCard 
              data={cardData} 
              interactive={false} 
              isFlippedExternally={true} 
              className="w-full shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  if (mode === 'landing') {
    return (
      <section className="relative overflow-hidden border-y border-border/60 bg-background py-10">
        <div className={`pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full blur-3xl ${isDarkTheme ? 'bg-emerald-400/20' : 'bg-emerald-500/10'}`} />
        <div className={`pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full blur-3xl ${isDarkTheme ? 'bg-sky-400/20' : 'bg-sky-500/10'}`} />

        <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="mx-auto w-[160px] sm:w-[190px] lg:mx-0 perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentTeacher.id}-${currentVariant}`}
                initial={{ opacity: 0, scale: 0.9, rotateY: -20, y: 16 }}
                animate={{ opacity: 1, scale: 1, rotateY: -6, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: 18, y: -12 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <TeacherCard
                  data={cardData}
                  interactive={false}
                  isFlippedExternally={true}
                  className={isDarkTheme ? 'w-full shadow-[0_24px_60px_rgba(2,6,23,0.4)]' : 'w-full shadow-[0_24px_60px_rgba(15,23,42,0.16)]'}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-6 text-center lg:text-left">
            <div className="flex items-center justify-center gap-2 lg:justify-start">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">ABI Planer TCG</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tight sm:text-4xl">Sammle Lehrerkarten direkt im Dashboard.</h3>
              <p className="max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
                Tägliche Booster, seltene Varianten und ein Album-System als motivierender Layer für euren Jahrgang.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-primary" /> {teachers.length} Karten</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Varianten: Normal, Holo, Shiny</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              {isAuthenticated ? (
                <Button render={<a href={`${tcgUrl}/sammelkarten`} />} className="h-11 px-6 text-xs font-black uppercase tracking-[0.2em]">
                  Jetzt sammeln <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button render={<a href={`${dashboardUrl}/register`} />} className="h-11 px-6 text-xs font-black uppercase tracking-[0.2em]">
                  Konto erstellen <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" className="h-11 px-4 text-[10px] font-black uppercase tracking-[0.2em]" render={<a href={`${dashboardUrl}/zugang`}>Mehr dazu</a>} />
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <Card className={
      isDarkTheme
        ? 'overflow-hidden border-border/60 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white group relative min-h-[380px] flex flex-col'
        : 'overflow-hidden border-border/60 shadow-2xl bg-gradient-to-br from-background via-card to-primary/10 text-foreground group relative min-h-[380px] flex flex-col'
    }>
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 ${isDarkTheme ? 'bg-indigo-500' : 'bg-primary/20'}`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 ${isDarkTheme ? 'bg-purple-500' : 'bg-secondary/40'}`} />
      </div>

      <CardHeader className="relative z-20 pb-0 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={isDarkTheme ? 'bg-white/10 p-1.5 rounded-lg backdrop-blur-md border border-white/20' : 'bg-primary/10 p-1.5 rounded-lg backdrop-blur-md border border-primary/20'}>
              <Sparkles className={`h-4 w-4 ${isDarkTheme ? 'text-yellow-300' : 'text-primary'}`} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkTheme ? 'text-white/70' : 'text-muted-foreground'}`}>ABI Planer TCG</span>
          </div>
          <div className={isDarkTheme ? 'flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10' : 'flex items-center gap-1.5 bg-background/70 backdrop-blur-sm px-3 py-1 rounded-full border border-border/60'}>
             <Trophy className={`h-3 w-3 ${isDarkTheme ? 'text-yellow-500' : 'text-primary'}`} />
             <span className={`text-[10px] font-black ${isDarkTheme ? 'text-white/80' : 'text-foreground/80'}`}>{teachers.length} KARTEN</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-20 flex-1 flex flex-col justify-center py-6 px-6">
        <div className="flex flex-col sm:flex-row gap-8 items-center h-full">
          {/* Card Preview Area */}
          <div className="w-[160px] shrink-0 relative perspective-1000">
             <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentTeacher.id}-${currentVariant}`}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -30, x: -30 }}
                  animate={{ opacity: 1, scale: 1, rotateY: -10, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 30, x: 30 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full relative z-10"
                >
                  <TeacherCard 
                    data={cardData} 
                    interactive={false} 
                    isFlippedExternally={true} 
                    className={isDarkTheme ? 'w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'w-full shadow-[0_20px_50px_rgba(15,23,42,0.18)]'}
                  />
                </motion.div>
             </AnimatePresence>
             
             {/* Dynamic Glow behind card */}
             <div className={`absolute inset-0 rounded-full blur-3xl animate-pulse pointer-events-none ${isDarkTheme ? 'bg-indigo-500/20' : 'bg-primary/15'}`} />
          </div>

          {/* Info Area */}
          <div className="flex-1 space-y-5 text-center sm:text-left">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight leading-none">
                Sammle <span className={isDarkTheme ? 'text-yellow-300' : 'text-primary'}>deine</span> Lehrer!
              </CardTitle>
              <p className={`text-sm font-medium leading-relaxed max-w-[280px] mx-auto sm:mx-0 ${isDarkTheme ? 'text-white/70' : 'text-muted-foreground'}`}>
                Öffne tägliche Booster, entdecke seltene Varianten und vervollständige dein Album.
              </p>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {[
                { label: 'Shiny', color: isDarkTheme ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
                { label: 'Holo', color: isDarkTheme ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-yellow-500/10 text-amber-700 border-yellow-500/20' },
                { label: 'Legendary', color: isDarkTheme ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-pink-500/10 text-pink-700 border-pink-500/20' },
              ].map((item, i) => (
                <div key={i} className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${item.color} backdrop-blur-sm`}>
                  {item.label}
                </div>
              ))}
            </div>
            
            <div className="pt-2 w-full max-w-[240px] mx-auto sm:mx-0">
               {isAuthenticated ? (
                <Button render={<a href={`${tcgUrl}/sammelkarten`} />} className={isDarkTheme ? 'w-full bg-white text-indigo-950 hover:bg-white/90 font-black rounded-xl h-12 text-base gap-2 shadow-xl group/btn transition-all active:scale-95' : 'w-full bg-foreground text-background hover:bg-foreground/90 font-black rounded-xl h-12 text-base gap-2 shadow-xl group/btn transition-all active:scale-95'}>
                  Jetzt sammeln <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <div className="space-y-3 text-center">
                  <Button render={<a href={`${dashboardUrl}/register`} />} className={isDarkTheme ? 'w-full bg-white text-indigo-950 hover:bg-white/90 font-black rounded-xl h-12 text-base gap-2 shadow-xl group/btn transition-all active:scale-95' : 'w-full bg-foreground text-background hover:bg-foreground/90 font-black rounded-xl h-12 text-base gap-2 shadow-xl group/btn transition-all active:scale-95'}>
                    Konto erstellen <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <a 
                    href={`${dashboardUrl}/zugang`} 
                    className={isDarkTheme ? 'inline-block text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors' : 'inline-block text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors'}
                  >
                    Warum ein Konto?
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
