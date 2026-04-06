'use client'

import React from 'react'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VorteileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-brand/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-brand/5 blur-[100px]" />
      </div>

      <LandingHeader isAuthenticated={!!user} />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <Button variant="ghost" asChild className="rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand/5">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Link>
            </Button>
          </motion.div>
          
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
