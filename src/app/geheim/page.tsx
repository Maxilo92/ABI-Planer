'use client'

import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Lock, Zap, Ghost, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'

export default function SecretPage() {
  const { profile, loading } = useAuth()
  const [glitchText, setGlitchText] = useState('TOP SECRET')

  useEffect(() => {
    if (!loading && !profile?.easter_egg_unlocked) {
      redirect('/')
    }
  }, [profile, loading])

  useEffect(() => {
    const texts = ['TOP SECRET', 'T0P S3CR3T', 'TOP $ECRET', 'T0P SECRET']
    const interval = setInterval(() => {
      setGlitchText(texts[Math.floor(Math.random() * texts.length)])
    }, 200)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null

  return (
    <div className="container max-w-4xl py-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-primary/10 text-primary animate-pulse">
          <Sparkles className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter sm:text-6xl font-mono text-primary">
          {glitchText}
        </h1>
        <p className="text-muted-foreground text-lg max-w-[600px]">
          Herzlichen Glückwunsch! Du hast das am schlechtesten versteckte Easter Egg der Welt gefunden.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Was ist das?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 font-mono">
            <p className="text-primary/80">&gt; Initializing secret module...</p>
            <p className="text-primary/80">&gt; User identified: {profile?.full_name}</p>
            <p className="text-primary/80">&gt; Access level: LEGENDARY</p>
            <p className="text-primary/80">&gt; Loading meaningless data...</p>
            <p className="text-primary/80">&gt; Done.</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Special Features
            </CardTitle>
            <CardDescription>Demnächst vielleicht...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Noch mehr Geheimnisse?</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <Ghost className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Unsichtbarer Modus (vielleicht)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black text-green-500 font-mono p-6 overflow-hidden">
        <div className="space-y-1 text-xs">
          <p>[SYSTEM] ABI Planer Kernel v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
          <p>[INFO] Memory leak detected in common sense...</p>
          <p>[INFO] Coffee level critical...</p>
          <p>[INFO] Deploying unicorns...</p>
          <p className="animate-pulse">[INFO] Scanning for intruders... None found. You are one of us.</p>
          <div className="pt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-1 bg-green-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000" 
                  style={{ width: `${Math.random() * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
        This page does absolutely nothing useful. Enjoy.
      </div>
    </div>
  )
}
