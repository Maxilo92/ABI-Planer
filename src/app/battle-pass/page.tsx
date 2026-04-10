'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { cn } from '@/lib/utils'
import { ArrowRight, CheckCircle2, Gift, Lock, Sparkles, Trophy } from 'lucide-react'

const TOTAL_TIERS = 30
const MOCK_CURRENT_TIER = 7
const MOCK_CURRENT_XP = 430
const MOCK_NEXT_TIER_XP = 500

type TierState = 'completed' | 'current' | 'upcoming'

type TierTrackItem = {
  tier: number
  state: TierState
  freeReward: string
  premiumReward: string
}

const FREE_REWARDS = [
  '50 NP',
  'Booster x1',
  'Titel-Tag',
  'Profilrahmen',
  'Sticker-Pack',
]

const PREMIUM_REWARDS = [
  'Epic Skin',
  'Booster x3',
  'Exklusiver Titel',
  'Profil-Effekt',
  'Premium Emote',
]

function getTierState(tier: number): TierState {
  if (tier < MOCK_CURRENT_TIER) return 'completed'
  if (tier === MOCK_CURRENT_TIER) return 'current'
  return 'upcoming'
}

function getFreeReward(tier: number) {
  return FREE_REWARDS[(tier - 1) % FREE_REWARDS.length]
}

function getPremiumReward(tier: number) {
  return PREMIUM_REWARDS[(tier - 1) % PREMIUM_REWARDS.length]
}

export default function BattlePassPage() {
  const { profile, loading } = useAuth()

  const tiers = useMemo<TierTrackItem[]>(() => {
    return Array.from({ length: TOTAL_TIERS }, (_, index) => {
      const tier = index + 1
      return {
        tier,
        state: getTierState(tier),
        freeReward: getFreeReward(tier),
        premiumReward: getPremiumReward(tier),
      }
    })
  }, [])

  const progressPercent = Math.round((MOCK_CURRENT_TIER / TOTAL_TIERS) * 100)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  // Feature is currently disabled
  const isFeatureEnabled = false;

  if (!isFeatureEnabled) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter italic">Battle Pass deaktiviert</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Der Battle Pass ist zurzeit nicht verfügbar. Wir arbeiten an neuen Inhalten und Features für euch.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl font-bold">
          <Link href="/">Zurück zum Dashboard</Link>
        </Button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate
          title="Battle Pass gesperrt"
          description="Melde dich an, um deinen Free Pass und den Premium Pass zu sehen."
          icon={<Trophy className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-background to-sky-500/15 px-5 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(250,204,21,0.25),transparent_35%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.2),transparent_30%)]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 text-amber-950">Season 1</Badge>
              <Badge variant="outline" className="border-amber-500/40 bg-background/70">30 Stufen</Badge>
              <Badge variant="outline" className="border-sky-500/40 bg-background/70">Free + Premium</Badge>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Battle Pass</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Sammle XP, level deinen Pass und sichere dir Belohnungen auf 30 Stufen.
                Der Premium-Track ist bereits sichtbar und wird nach der Shop-Anbindung freigeschaltet.
              </p>
            </div>
          </div>

          <Card className="w-full max-w-sm border-amber-500/40 bg-background/80 shadow-xl">
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dein Fortschritt</p>
                <p className="text-sm font-bold">Stufe {MOCK_CURRENT_TIER}/{TOTAL_TIERS}</p>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{MOCK_CURRENT_XP} XP</span>
                <span>{MOCK_NEXT_TIER_XP} XP bis nächste Stufe</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            <p className="text-sm font-bold text-muted-foreground">Horizontale Track-Ansicht</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">
            <Lock className="h-3.5 w-3.5" />
            Premium aktuell gelockt (Shop-Anbindung folgt)
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-5">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-max space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <Gift className="h-3.5 w-3.5" />
                  Free Pass
                </div>

                <div className="flex items-stretch gap-3">
                  {tiers.map((tier) => (
                    <Card
                      key={`free-${tier.tier}`}
                      className={cn(
                        'w-[136px] shrink-0 border-2 py-0 transition-all',
                        tier.state === 'completed' && 'border-emerald-500/50 bg-emerald-500/10',
                        tier.state === 'current' && 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/20',
                        tier.state === 'upcoming' && 'border-border bg-background/90'
                      )}
                    >
                      <CardContent className="space-y-2 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Stufe {tier.tier}</p>
                          {tier.state === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {tier.state === 'current' && <Badge className="h-5 bg-sky-500 px-1.5 text-[9px]">Jetzt</Badge>}
                        </div>
                        <p className="line-clamp-2 min-h-9 text-xs font-bold leading-snug">{tier.freeReward}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                  Premium Pass
                </div>

                <div className="flex items-stretch gap-3">
                  {tiers.map((tier) => (
                    <Card
                      key={`premium-${tier.tier}`}
                      className={cn(
                        'relative w-[136px] shrink-0 border-2 border-amber-500/30 bg-amber-500/[0.08] py-0 transition-all',
                        tier.state === 'current' && 'shadow-md shadow-amber-500/20'
                      )}
                    >
                      <CardContent className="space-y-2 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Stufe {tier.tier}</p>
                          <Lock className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <p className="line-clamp-2 min-h-9 text-xs font-bold leading-snug text-amber-900/80 dark:text-amber-100/80">
                          {tier.premiumReward}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>Loot, Claim-Logik und Premium-Freischaltung folgen in einem separaten Schritt.</p>
            <Button asChild size="sm" className="font-bold">
              <Link href="/shop/abo">
                Premium im Shop ansehen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}