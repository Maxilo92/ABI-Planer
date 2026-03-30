'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { LootTeacher, CardVariant } from '@/types/database'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { CardData } from '@/types/cards'

const FALLBACK_TEACHERS: LootTeacher[] = [
  { 
    id: 'promo-herr-schmidt', 
    name: 'Herr Schmidt', 
    rarity: 'legendary', 
    description: 'Ein legendärer Lehrer mit unglaublicher Geduld.',
    hp: 120,
    attacks: [{ name: 'Klausur-Schreck', damage: 80 }]
  },
  { 
    id: 'promo-frau-mueller', 
    name: 'Frau Müller', 
    rarity: 'epic', 
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
}

const RARITY_WEIGHTS: Record<string, number> = {
  common: 100,
  rare: 100,
  epic: 100,
  mythic: 100,
  legendary: 100
}

const VARIANT_WEIGHTS: { variant: CardVariant; weight: number }[] = [
  { variant: 'normal', weight: 70 },
  { variant: 'holo', weight: 15 },
  { variant: 'shiny', weight: 10 },
  { variant: 'black_shiny_holo', weight: 5 }
]

export function SammelkartenPromo({ 
  isAuthenticated, 
  loading = false 
}: { 
  isAuthenticated: boolean,
  loading?: boolean
}) {
  const [teachers, setTeachers] = useState<LootTeacher[]>(FALLBACK_TEACHERS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentVariant, setCurrentVariant] = useState<CardVariant>('normal')
  const [isConfigLoading, setIsConfigLoading] = useState(true)

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
    return (
      <Card className="overflow-hidden border-border/40 shadow-subtle h-[340px] bg-card elevated-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
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

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 text-white group relative min-h-[380px] flex flex-col">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <CardHeader className="relative z-20 pb-0 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-md border border-white/20">
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">ABI Planer TCG</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
             <Trophy className="h-3 w-3 text-yellow-500" />
             <span className="text-[10px] font-black text-white/80">{teachers.length} KARTEN</span>
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
                    className="w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  />
                </motion.div>
             </AnimatePresence>
             
             {/* Dynamic Glow behind card */}
             <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
          </div>

          {/* Info Area */}
          <div className="flex-1 space-y-5 text-center sm:text-left">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight leading-none">
                Sammle <span className="text-yellow-300">deine</span> Lehrer!
              </CardTitle>
              <p className="text-sm text-white/70 font-medium leading-relaxed max-w-[280px] mx-auto sm:mx-0">
                Öffne tägliche Booster, entdecke seltene Varianten und vervollständige dein Album.
              </p>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {[
                { label: 'Shiny', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                { label: 'Holo', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
                { label: 'Legendary', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
              ].map((item, i) => (
                <div key={i} className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${item.color} backdrop-blur-sm`}>
                  {item.label}
                </div>
              ))}
            </div>
            
            <div className="pt-2 w-full max-w-[240px] mx-auto sm:mx-0">
               {isAuthenticated ? (
                <Button render={<Link href="/sammelkarten" />} className="w-full bg-white text-indigo-950 hover:bg-white/90 font-black rounded-xl h-12 text-base gap-2 shadow-xl group/btn transition-all active:scale-95">
                  Jetzt sammeln <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button render={<Link href="/register" />} className="w-full bg-white text-indigo-950 hover:bg-white/90 font-black rounded-xl h-12 text-base gap-2 shadow-xl group/btn">
                    Konto erstellen <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
