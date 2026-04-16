'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Users, 
  CheckSquare, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Trophy,
  Workflow
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type FeatureContent = {
  title: string
  subtitle: string
  description: string
  icon: any
  color: string
  details: { title: string; desc: string; icon: any }[]
  cta: string
}

const FEATURE_DATA: Record<string, FeatureContent> = {
  finanzen: {
    title: 'Finanzen & Prognosen',
    subtitle: 'Budget transparent steuern.',
    description: 'Vom ersten Beitrag bis zur Abschlussfeier: Der Finanzbereich bietet Transparenz und nachvollziehbare Prognosen fuer den gesamten Jahrgang.',
    icon: DollarSign,
    color: 'text-emerald-500',
    cta: 'Finanzen einrichten',
    details: [
      { title: 'Aktueller Stand', desc: 'Einnahmen und Ausgaben werden direkt in der Stufenuebersicht sichtbar.', icon: Zap },
      { title: 'Zielplanung', desc: 'Finanzziele fuer Veranstaltungen lassen sich klar definieren und verfolgen.', icon: Target },
      { title: 'Prognosen', desc: 'Auf Basis der vorhandenen Daten laesst sich der finanzielle Spielraum besser abschaetzen.', icon: Workflow }
    ]
  },
  gruppen: {
    title: 'Planungs-Gruppen',
    subtitle: 'Teamarbeit mit klarer Struktur.',
    description: 'Verantwortung wird auf mehrere Gruppen verteilt. So bleibt die Planung vom Catering bis zur Abizeitung nachvollziehbar organisiert.',
    icon: Users,
    color: 'text-blue-500',
    cta: 'Gruppen organisieren',
    details: [
      { title: 'Eigene Bereiche', desc: 'Jede Gruppe hat ihre eigenen News, Dateien und Aufgaben.', icon: ShieldCheck },
      { title: 'Rollensystem', desc: 'Klare Zustaendigkeiten verhindern doppelte Arbeit und offene Aufgaben.', icon: Users },
      { title: 'Zentraler Hub', desc: 'Tauscht euch gruppenübergreifend aus und behaltet den Überblick.', icon: Workflow }
    ]
  },
  abstimmungen: {
    title: 'Abstimmungen',
    subtitle: 'Klare Entscheidungen im Jahrgang.',
    description: 'Wichtige Themen werden transparent entschieden. Schnell, sicher und mit klar dokumentiertem Ergebnis pro Account.',
    icon: CheckSquare,
    color: 'text-brand',
    cta: 'Abstimmungen starten',
    details: [
      { title: 'Live-Ergebnisse', desc: 'Seht sofort, wie sich der Jahrgang entscheidet.', icon: Zap },
      { title: 'Anonym & Sicher', desc: 'Keine Beeinflussung durch andere – jeder stimmt für sich.', icon: ShieldCheck },
      { title: 'Klare Entscheidung', desc: 'Weniger Nebendiskussionen, dafuer ein nachvollziehbares Ergebnis.', icon: Target }
    ]
  },
  kalender: {
    title: 'Zentraler Kalender',
    subtitle: 'Alle Termine an einem Ort.',
    description: 'Von der Vorfinanzierung bis zur Zeugnisvergabe: Der Kalender bildet die gemeinsame Zeitleiste des Abschlussjahres.',
    icon: Calendar,
    color: 'text-orange-500',
    cta: 'Kalender aufrufen',
    details: [
      { title: 'Synchronisiert', desc: 'Jeder Eintrag ist sofort für alle Stufenmitglieder verfügbar.', icon: Zap },
      { title: 'Deadlines', desc: 'Wichtige Abgabetermine werden hervorgehoben und getrackt.', icon: Target },
      { title: 'Event-Details', desc: 'Alle Infos, Orte und Ansprechpartner direkt am Termin.', icon: ShieldCheck }
    ]
  },
  sammelkarten: {
    title: 'Sammelkarten TCG',
    subtitle: 'Erinnerungen digital sammeln.',
    description: 'Lehrkraefte und Mitschueler werden als digitale Karten gesammelt. Die integrierte Tauschfunktion erhoeht Beteiligung und Aktivitaet in der Stufe.',
    icon: Sparkles,
    color: 'text-purple-500',
    cta: 'Kartenbereich ansehen',
    details: [
      { title: 'Seltene Editionen', desc: 'Besondere Kartenvarianten erweitern die Sammlung langfristig.', icon: Sparkles },
      { title: 'Tauschboerse', desc: 'Karten lassen sich direkt mit anderen aus der Stufe tauschen.', icon: Workflow },
      { title: 'Sammelalbum', desc: 'Der Fortschritt der Sammlung ist jederzeit sichtbar.', icon: Trophy }
    ]
  }
}

export default function FeaturePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.feature as string
  const content = FEATURE_DATA[slug]

  if (!content) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Feature nicht gefunden</h1>
        <Button onClick={() => router.push('/')} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const Icon = content.icon

  return (
    <div className="space-y-20 pb-20">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className={`h-16 w-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center shadow-lg ${content.color}`}>
              <Icon className="h-8 w-8" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight uppercase italic leading-none">
              {content.title.split(' & ').map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  <span className={i > 0 ? 'text-brand' : ''}>{part}</span>
                </React.Fragment>
              ))}
            </h1>
            <p className="text-2xl font-bold text-muted-foreground">{content.subtitle}</p>
          </div>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            {content.description}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/30 group">
              <Link href="/register">
                {content.cta}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl border-2 border-brand/20 hover:bg-brand/5">
              <Link href="/zugang">Vorteile vergleichen</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative aspect-square lg:aspect-video rounded-[3rem] bg-card/40 border border-border/50 backdrop-blur-3xl overflow-hidden shadow-2xl flex items-center justify-center group"
        >
          <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-brand pointer-events-none`} />
          <Icon className={`h-40 w-40 opacity-10 ${content.color} transition-transform duration-700 group-hover:scale-110`} />
          
          {/* Floating decorative elements */}
          <div className="absolute top-10 right-10 h-32 w-48 bg-brand/5 border border-brand/10 rounded-2xl blur-[1px] rotate-6" />
          <div className="absolute bottom-10 left-10 h-32 w-48 bg-brand/5 border border-brand/10 rounded-2xl blur-[1px] -rotate-12" />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {content.details.map((detail, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-card border border-border/50 rounded-[2.5rem] space-y-4 hover:border-brand/30 transition-colors"
          >
            <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <detail.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight italic">{detail.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{detail.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
