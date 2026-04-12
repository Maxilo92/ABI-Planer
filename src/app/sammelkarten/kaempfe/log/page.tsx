'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2, Swords } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useCombatHistory } from '@/hooks/useCombatHistory'
import { useSammelkartenConfig } from '@/app/sammelkarten/_modules/hooks/useSammelkartenConfig'
import { CombatHistoryMatch, CombatMode } from '@/types/combat'

const MODE_LABELS: Record<CombatMode, string> = {
  ranked: 'Rangliste',
  unranked: 'Ungewertet',
  pve: 'KI',
  pve_custom: 'KI (Custom ELO)',
  event: 'Event'
}

const formatMatchDate = (match: CombatHistoryMatch): string => {
  const value = match.createdAt
  if (!value) return 'Kein Datum'

  if (value instanceof Date) {
    return value.toLocaleString('de-DE')
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString('de-DE')
  }

  return 'Kein Datum'
}

const getOpponentName = (match: CombatHistoryMatch, currentUserId: string): string => {
  const isPlayerA = match.playerA_uid === currentUserId
  const opponent = isPlayerA ? match.playerB : match.playerA
  return opponent?.name || 'Unbekannter Gegner'
}

const getResultLabel = (match: CombatHistoryMatch, currentUserId: string): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
  if (!match.winner) return { label: 'Unentschieden', variant: 'secondary' }
  if (match.winner === currentUserId) return { label: 'Sieg', variant: 'default' }
  return { label: 'Niederlage', variant: 'destructive' }
}

export default function CombatLogPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { isCombatEnabled, loading: configLoading } = useSammelkartenConfig()
  const { matches, loading, error } = useCombatHistory()

  const isAdmin = ['admin', 'admin_main', 'admin_co'].includes(profile?.role || '')

  useEffect(() => {
    if (configLoading || authLoading) return
    if (isCombatEnabled === false && !isAdmin) {
      router.replace('/sammelkarten')
    }
  }, [isCombatEnabled, configLoading, authLoading, isAdmin, router])

  if (configLoading || authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Kampflog wird geladen...</p>
      </div>
    )
  }

  if (isCombatEnabled === false && !isAdmin) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Kampflog</h1>
          <p className="text-sm text-muted-foreground">Alle beendeten Kämpfe von dir.</p>
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm">
          {matches.length} Einträge
        </Badge>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Kampflog konnte nicht geladen werden. Bitte versuche es später erneut.
        </div>
      )}

      {!error && matches.length === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
            <Swords className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold">Noch keine beendeten Kämpfe</h2>
          <p className="text-sm text-muted-foreground">Sobald ein Kampf beendet ist, erscheint er hier im Log.</p>
          <Link href="/sammelkarten/kaempfe" className="text-sm font-semibold text-primary hover:underline">
            Zu Kämpfe wechseln
          </Link>
        </div>
      )}

      {!error && matches.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <ul className="divide-y">
            {matches.map((match) => {
              const result = getResultLabel(match, user.uid)
              const modeLabel = MODE_LABELS[match.mode] || 'Unbekannt'
              const opponentName = getOpponentName(match, user.uid)

              return (
                <li key={match.id}>
                  <Link
                    href={`/sammelkarten/kaempfe/${match.id}`}
                    className="block p-4 sm:p-5 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-bold leading-tight">vs. {opponentName}</p>
                        <p className="text-sm text-muted-foreground">{formatMatchDate(match)}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge variant="outline">{modeLabel}</Badge>
                        <Badge variant={result.variant}>{result.label}</Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
