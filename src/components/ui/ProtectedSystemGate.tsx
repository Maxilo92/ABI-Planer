'use client'

import React from 'react'
import { Lock, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ProtectedSystemGateProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function ProtectedSystemGate({ title, description, icon }: ProtectedSystemGateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 rounded-3xl border-2 border-dashed bg-muted/30 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="mb-6 relative">
        <div className="h-20 w-20 rounded-2xl bg-background flex items-center justify-center shadow-xl border relative z-10">
          {icon || <Lock className="h-10 w-10 text-primary" />}
        </div>
        <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full animate-pulse" />
      </div>

      <h2 className="text-2xl font-black tracking-tight mb-3 relative z-10">{title}</h2>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed relative z-10">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 relative z-10">
        <Button 
          render={<Link href="/login" />} 
          className="rounded-xl px-8 py-6 h-auto font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
        >
          <UserCheck className="h-5 w-5" />
          Jetzt anmelden
        </Button>
        <Button 
          render={<Link href="/register" />} 
          variant="outline" 
          className="rounded-xl px-8 py-6 h-auto font-bold transition-all active:scale-95"
        >
          Konto erstellen
        </Button>
      </div>

      <Link 
        href="/promo" 
        className="mt-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors relative z-10"
      >
        Warum ein Konto?
      </Link>

      <div className="mt-8 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40">
        Zutritt nur für Schüler der HGR
      </div>
    </motion.div>
  )
}
