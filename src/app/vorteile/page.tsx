'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Users, 
  CheckSquare, 
  Calendar, 
  Sparkles, 
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const FEATURES = [
  { 
    id: 'finanzen', 
    title: 'Finanzen & Prognosen', 
    desc: 'Behaltet Einnahmen, Ausgaben und das Sparziel für den Abiball immer im Blick.', 
    icon: DollarSign,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  { 
    id: 'gruppen', 
    title: 'Planungs-Gruppen', 
    desc: 'Verteilt Aufgaben an Teams wie "Abizeitung" oder "Abiball" und behaltet die Deadlines im Griff.', 
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  { 
    id: 'abstimmungen', 
    title: 'Interaktive Polls', 
    desc: 'Demokratisch, schnell und sicher. Kein Chaos mehr in WhatsApp-Gruppen.', 
    icon: CheckSquare,
    color: 'text-brand',
    bg: 'bg-brand/10'
  },
  { 
    id: 'kalender', 
    title: 'Zentraler Kalender', 
    desc: 'Alle Termine an einem Ort. Von Vorfinanzierungspartys bis zu Abgabe-Deadlines.', 
    icon: Calendar,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  { 
    id: 'sammelkarten', 
    title: 'Sammelkarten TCG', 
    desc: 'Erinnerungen für die Ewigkeit. Sammelt Lehrer und Mitschüler als digitale Karten mit individuellen Werten und Seltenheitsstufen.', 
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  }
]

export default function VorteileOverviewPage() {
  return (
    <div className="space-y-16 pb-20">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] uppercase italic">
          Alle <span className="text-brand">Funktionen.</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Der ABI Planer ist mehr als nur ein Tool. Es ist das digitale Zuhause für euren gesamten Jahrgang. Entdecke, was alles möglich ist.
        </p>
      </div>

      <section className="rounded-[3rem] border border-border/60 bg-card/70 p-8 md:p-10 shadow-sm backdrop-blur-sm">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <div className="space-y-4">
            <p className="text-brand font-black uppercase tracking-[0.4em] text-[10px]">Warum die Funktionen zusammengehören</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight italic uppercase leading-[0.92]">
              Ein gutes Abi-Projekt braucht Struktur, Beteiligung und einen Grund, wiederzukommen.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
              Die einzelnen Bereiche sind bewusst miteinander verzahnt: Planung schafft Verbindlichkeit,
              Abstimmungen sorgen für Legitimation und Sammelkarten bringen eine spielerische Ebene hinein.
              So bleibt die Plattform nicht nur ein Verwaltungswerkzeug, sondern wird im Alltag tatsächlich genutzt.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                title: 'Für Orga-Teams',
                text: 'Aufgaben, Finanzen und Kalender laufen in einer nachvollziehbaren Struktur zusammen.',
              },
              {
                title: 'Für Abstimmungen',
                text: 'Klare Ergebnisse, weniger Nebendiskussionen und ein sichtbarer Verlauf der Entscheidungen.',
              },
              {
                title: 'Für Motivation',
                text: 'Die Sammelkarten-Funktionen geben dem Jahrgang einen spielerischen Anreiz, dranzubleiben.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={`/vorteile/${feature.id}`} className="group block h-full">
              <article className="bg-card border border-border/50 h-full p-10 rounded-[3rem] space-y-6 hover:border-brand/50 hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className={`h-14 w-14 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} shadow-inner`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight italic group-hover:text-brand transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                </div>
                
                <div className="pt-6 flex items-center justify-between border-t border-border/50 group-hover:border-brand/20 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand">Details ansehen</span>
                  <ArrowRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-2" />
                </div>
              </article>
            </Link>
          </motion.div>
        ))}
        
        {/* Account Comparison Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: FEATURES.length * 0.1 }}
          className="lg:col-span-1"
        >
          <Link href="/zugang" className="group block h-full">
            <article className="bg-brand text-brand-foreground h-full p-10 rounded-[3rem] space-y-6 shadow-2xl shadow-brand/20 transition-all duration-500 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner">
                  <ArrowRight className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight italic">Account-Modelle</h3>
                <p className="text-brand-foreground/80 leading-relaxed font-medium">Finde heraus, welcher Zugang am besten zu dir passt. Gast oder volles Mitglied?</p>
              </div>
              
              <div className="pt-6 flex items-center justify-between border-t border-white/20">
                <span className="text-[10px] font-black uppercase tracking-widest">Vergleich ansehen</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
              </div>
            </article>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
