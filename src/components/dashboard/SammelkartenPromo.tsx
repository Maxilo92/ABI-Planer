'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Trophy, Zap, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

export function SammelkartenPromo({ 
  isAuthenticated, 
  loading = false 
}: { 
  isAuthenticated: boolean,
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="overflow-hidden border-none shadow-xl h-[340px] bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
        <CardHeader className="relative z-10 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-6 w-24 bg-white/20" />
          </div>
          <Skeleton className="h-8 w-48 bg-white/20" />
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
          <Skeleton className="h-4 w-56 bg-white/20" />
          <Skeleton className="h-4 w-40 bg-white/20" />
          <div className="flex flex-wrap gap-2 py-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full bg-white/20" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-xl bg-white/20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white group relative">
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12">
        <Trophy className="h-32 w-32" />
      </div>
      
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
      
      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md border border-white/30">
            <Sparkles className="h-4 w-4 text-yellow-300" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">ABI Planer TCG</span>
        </div>
        <CardTitle className="text-2xl font-black tracking-tight leading-tight">
          Sammle deine <span className="text-yellow-300">Lehrer!</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <p className="text-sm text-white/90 font-medium leading-relaxed max-w-[240px]">
          Öffne tägliche Booster, entdecke seltene Varianten und vervollständige dein Album.
        </p>

        <div className="flex flex-wrap gap-2 py-1">
          {[
            { icon: Star, label: 'Shiny', color: 'text-blue-200' },
            { icon: Zap, label: 'Holo', color: 'text-yellow-200' },
            { icon: Trophy, label: 'Legendary', color: 'text-pink-200' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/20 px-2 py-1 rounded-full">
              <item.icon className={`h-3 w-3 ${item.color}`} />
              <span className="text-[9px] font-bold uppercase">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          {isAuthenticated ? (
            <Button render={<Link href="/sammelkarten" />} className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl gap-2 shadow-lg group/btn">
              Jetzt sammeln <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <div className="space-y-3">
              <Button render={<Link href="/register" />} className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl gap-2 shadow-lg group/btn">
                Konto erstellen <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <p className="text-[10px] text-center text-white/60 font-medium">
                Anmeldung erforderlich, um Karten zu erhalten.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
