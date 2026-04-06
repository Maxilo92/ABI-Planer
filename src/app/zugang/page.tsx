'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Lock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  LogIn,
  MessageSquare,
  UserPlus,
  Users,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  Coins,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ZugangPage() {
  const router = useRouter()
  const { user } = useAuth()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const features = [
    { 
      name: 'Öffentliche News', 
      desc: 'Was passiert gerade im Jahrgang?',
      requiresAuth: false, 
      icon: MegaphoneIcon 
    },
    { 
      name: 'Stufen-Dashboard', 
      desc: 'Zentrale Orga-Zentrale & Budget',
      requiresAuth: true, 
      icon: LayoutDashboard 
    },
    { 
      name: 'Planungsgruppen', 
      desc: 'Aktiv in Teams mitarbeiten',
      requiresAuth: true, 
      icon: Users 
    },
    { 
      name: 'Sammelkarten TCG', 
      desc: 'Lehrer sammeln & Booster öffnen',
      requiresAuth: true, 
      icon: Gift 
    },
    { 
      name: 'Interaktive Polls', 
      desc: 'Demokratisch mitentscheiden',
      requiresAuth: true, 
      icon: CheckCircle2 
    },
    { 
      name: 'Finanz-Transparenz', 
      desc: 'Echtzeit-Stand der Stufenkasse',
      requiresAuth: true, 
      icon: Coins 
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center pt-24 pb-20 px-6">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full space-y-16"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] bg-brand/10 text-brand-foreground border-brand/20">
            Mitgliedschaft & Zugang
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] uppercase italic">
            Zugang & <br />
            <span className="text-brand">Berechtigungen.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Die öffentliche Seite dient als Informationsquelle für Lehrer und Eltern. Das Dashboard ist der exklusive, geschützte Bereich für die interne Organisation eures Jahrgangs.
          </p>
        </motion.div>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Public Access Card */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem] overflow-hidden group hover:border-border transition-colors">
              <CardContent className="p-8 md:p-10 space-y-8">
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">Besucher-Modus</h3>
                  <p className="text-sm text-muted-foreground">Ohne Registrierung möglich. Ideal für Eltern, Lehrer und Neugierige.</p>
                </div>

                <ul className="space-y-4">
                  {features.map((f, i) => !f.requiresAuth && (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-emerald-500" />
                      </div>
                      <span>{f.name}</span>
                    </li>
                  ))}
                  {features.map((f, i) => f.requiresAuth && (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium opacity-40">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Lock className="h-3 w-3" />
                      </div>
                      <span className="line-through">{f.name}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                   <Button variant="ghost" asChild className="w-full rounded-2xl font-bold uppercase tracking-widest text-[10px] h-12">
                      <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Startseite</Link>
                   </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Member Access Card */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 border-brand bg-brand/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-brand/10">
              <div className="absolute top-0 right-0 p-6">
                 <div className="bg-brand text-brand-foreground px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                    Empfohlen
                 </div>
              </div>
              
              <CardContent className="p-8 md:p-10 space-y-8">
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-brand flex items-center justify-center text-brand-foreground mb-4 shadow-lg shadow-brand/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase text-brand">Dashboard-Zugang</h3>
                  <p className="text-sm text-brand-foreground/70 font-medium">Voller Zugriff auf alle Orga-Tools. Nur für verifizierte Jahrgangsmitglieder.</p>
                </div>

                <ul className="space-y-4">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold">
                      <div className="h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-brand" />
                      </div>
                      <div className="flex-1">
                        <p>{f.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium normal-case tracking-normal">{f.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 space-y-3">
                   <Button onClick={() => router.push('/register')} className="w-full bg-brand text-brand-foreground hover:bg-brand/90 rounded-2xl font-black uppercase tracking-widest text-[11px] h-14 shadow-xl shadow-brand/20 group">
                      Account erstellen <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                   </Button>
                   <Button variant="outline" onClick={() => router.push('/login')} className="w-full border-brand/30 hover:bg-brand/10 rounded-2xl font-black uppercase tracking-widest text-[11px] h-14">
                      Einloggen
                   </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Security Notice */}
        <motion.div variants={itemVariants} className="bg-card/50 border border-border/50 rounded-[2rem] p-8 md:p-12 text-center max-w-3xl mx-auto space-y-4">
           <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
              <ShieldCheck className="h-5 w-5" />
           </div>
           <h4 className="text-xl font-black uppercase tracking-tight">Privatsphäre an erster Stelle</h4>
           <p className="text-muted-foreground text-sm leading-relaxed leading-relaxed">
             Damit Finanzen, private Telefonnummern und Planungs-Details geschützt bleiben, ist das Dashboard **kein öffentlicher Bereich**. Jede Registrierung wird manuell durch eure Admins geprüft und freigeschaltet.
           </p>
        </motion.div>

        {/* Footer Link */}
        <motion.div variants={itemVariants} className="text-center">
           <Button variant="link" onClick={() => router.push('/')} className="text-muted-foreground hover:text-brand font-bold uppercase tracking-[0.2em] text-[10px]">
              Verstanden, zurück zur Hauptseite
           </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

function MegaphoneIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}
