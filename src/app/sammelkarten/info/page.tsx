'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { SammelkartenConfig } from '@/types/cards'
import { ProbabilityInfo } from '@/components/cards/ProbabilityInfo'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Scale, ShieldCheck, AlertCircle, Info } from 'lucide-react'

const DEFAULT_RARITY_WEIGHTS = [
  { common: 0.8, rare: 0.15, epic: 0.04, mythic: 0.008, legendary: 0.002 },
  { common: 0.6, rare: 0.25, epic: 0.11, mythic: 0.03, legendary: 0.01 },
  { common: 0.4, rare: 0.35, epic: 0.17, mythic: 0.06, legendary: 0.02 }
]

const DEFAULT_VARIANTS_PROBABILITIES = {
  shiny: 0.05,
  holo: 0.15,
  black_shiny_holo: 0.005
};

export default function SammelkartenInfoPage() {
  const router = useRouter()
  const [config, setConfig] = useState<SammelkartenConfig | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as SammelkartenConfig)
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </Button>
          <h1 className="font-bold tracking-tight">Informationen & Transparenz</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-8 space-y-12">
        {/* Intro Section */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-info/10 border border-info/20 text-info text-xs font-bold uppercase tracking-widest">
            <Scale className="w-3 h-3" />
            Fairness Garantie
          </div>
          <h2 className="text-3xl font-black tracking-tight">Sammelkarten System</h2>
          <p className="text-muted-foreground leading-relaxed">
            Das Sammeln von Lehrerkarten im ABI Planer ist als unterhaltsames Begleitelement für deine Abiturphase gedacht. 
            Um volle Transparenz zu gewährleisten, listen wir hier alle Wahrscheinlichkeiten und rechtlichen Rahmenbedingungen auf.
          </p>
        </section>

        {/* Probabilities Component */}
        <ProbabilityInfo 
          rarityWeights={config?.rarity_weights || DEFAULT_RARITY_WEIGHTS}
          variantProbabilities={config?.variant_probabilities || DEFAULT_VARIANTS_PROBABILITIES}
          godpackChance={config?.global_limits?.godpack_chance || 0.005}
        />

        {/* Legal & Safety Section */}
        <section className="grid gap-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success" />
            Rechtliche Hinweise & Jugendschutz
          </h3>
          
          <div className="grid gap-4">
            <div className="p-5 bg-card border border-border rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Kein materieller Wert
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Die digitalen Sammelkarten im ABI Planer besitzen keinen materiellen Gegenwert. Sie können nicht gegen Echtgeld ausgezahlt, 
                außerhalb der Plattform gehandelt oder übertragen werden. Es handelt sich rein um digitale Unterhaltungsgüter.
              </p>
            </div>

            <div className="p-5 bg-card border border-border rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-info" />
                Jugendschutz (Lootbox-Richtlinien)
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Wir halten uns an die aktuellen Empfehlungen zum Jugendschutz. Der Erwerb von Boostern erfolgt primär durch Engagement 
                innerhalb der App (Tägliche Belohnung, Teilnahme an Abstimmungen). Eventuelle Käufe von Zusatz-Boostern sind optional 
                und dienen der Unterstützung der Plattform-Entwicklung.
              </p>
            </div>

            <div className="p-5 bg-card border border-border rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2 font-bold">
                <Scale className="w-4 h-4 text-purple-500" />
                Algorithmus & Zufall
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Die Verteilung der Karten erfolgt über einen kryptographisch sicheren Zufallsgenerator. Die Wahrscheinlichkeiten 
                sind für alle Nutzer identisch und werden nicht individuell beeinflusst. Die Drop-Rates werden regelmäßig 
                überprüft, um die Balance des Systems zu wahren.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Info */}
        <footer className="pt-10 border-t border-border text-center space-y-4">
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">100%</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Transparent</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-border px-6">
              <span className="text-2xl font-bold">Fair</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Play</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">Secure</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Random</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground max-w-md mx-auto">
            ABI Planer Sammelkarten-System v2026.1. Bei Fragen zum System oder zu deinen Wahrscheinlichkeiten wende dich bitte an den Support.
          </p>
        </footer>
      </main>
    </div>
  )
}

