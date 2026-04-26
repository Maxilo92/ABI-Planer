'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Users, 
  Sparkles, 
  ArrowRight,
  Heart,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function UberUnsPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-16 pb-20 pt-10">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[11px] font-bold uppercase tracking-wider"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t('about.badge')}</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] uppercase italic"
        >
          {t('about.title').split(' ').map((word: string, i: number) => (
            <React.Fragment key={i}>
              {word === 'Schülern' || word === 'Schüler.' || word === 'students' || word === 'students.' || word === 'estudiantes' || word === 'estudiantes.' ? (
                <span className="text-brand">{word} </span>
              ) : (
                word + ' '
              )}
            </React.Fragment>
          ))}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium"
        >
          {t('about.desc1')}
        </motion.p>
      </div>

      <section className="rounded-[3rem] border border-border/60 bg-card/70 p-8 md:p-12 shadow-sm backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Globe className="h-64 w-64" />
        </div>
        
        <div className="grid gap-12 lg:grid-cols-2 items-center relative z-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight italic uppercase leading-none">
                {t('about.mission.title')}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                {t('about.mission.text')}
              </p>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
              {t('about.desc2')}
            </p>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2.5rem] border border-border/60 bg-background/80 p-8 shadow-sm space-y-4">
              <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">Datensicherheit</h3>
              <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                Als Plattform für Schulen hat Datenschutz höchste Priorität. Wir arbeiten nach strengen DSGVO-Richtlinien und hosten unsere Daten sicher.
              </p>
            </div>
            
            <div className="rounded-[2.5rem] border border-border/60 bg-background/80 p-8 shadow-sm space-y-4">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">{t('about.team.title')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                {t('about.team.text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { title: 'Community', text: 'Wir binden den gesamten Jahrgang aktiv ein, statt nur ein kleines Orga-Team.', icon: Users },
          { title: 'Innovation', text: 'Moderne Tools wie das Sammelkarten-System machen die Planung zum Erlebnis.', icon: Sparkles },
          { title: 'Effizienz', text: 'Wenig Aufwand, maximales Ergebnis für euren Abiball und eure Kasse.', icon: ArrowRight },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-card border border-border/50 rounded-[2.5rem] space-y-4 hover:border-brand/30 transition-colors"
          >
            <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <item.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">{item.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">{item.text}</p>
          </motion.div>
        ))}
      </div>

      <section className="py-20 text-center space-y-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase italic">
            Bereit für den <span className="text-brand">Start?</span>
          </h2>
          <p className="text-muted-foreground text-lg font-medium">
            Richte jetzt euren Jahrgang ein und starte die stressfreie Planung eures Abschlusses.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl bg-brand text-brand-foreground hover:bg-brand/90 shadow-2xl shadow-brand/30 group">
            <Link href="/register">
              {t('about.cta')}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-16 px-10 text-xs font-black uppercase tracking-[0.25em] rounded-2xl border-2 border-brand/20 hover:bg-brand/5">
            <Link href="/vorteile">Alle Funktionen</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
