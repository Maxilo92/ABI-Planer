import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowLeftRight, Clock, LayoutGrid, Trophy, Zap } from 'lucide-react'

import { AvailablePack } from '../types'

export type PackProbabilities = {
  wholePackChance: number
}

type SammelkartenFooterActionsProps = {
  showDebug: boolean
  speedMultiplier: number
  consecutiveOpenCount: number
  gameState: 'idle' | 'ripping' | 'revealed'
  isMassOpening: boolean
  packProbs: PackProbabilities | null
  getRemainingBoosters: () => number
  getRemainingSupportBoosters: () => number
  selectedPack: AvailablePack | null
  handleOpenPack: () => void
  handleOpenTenPacks: () => void
  setGameState: (state: 'idle' | 'ripping' | 'revealed') => void
  timeLeft: string
  allFlipped: boolean
  isTradingEnabled: boolean
  getRandomOpenableBoosters: () => number
}

export function SammelkartenFooterActions(props: SammelkartenFooterActionsProps) {
  const {
    showDebug,
    speedMultiplier,
    consecutiveOpenCount,
    gameState,
    isMassOpening,
    packProbs,
    getRemainingBoosters,
    getRemainingSupportBoosters,
    selectedPack,
    handleOpenPack,
    handleOpenTenPacks,
    setGameState,
    timeLeft,
    allFlipped,
    isTradingEnabled,
    getRandomOpenableBoosters
  } = props

  const isSupportPack = selectedPack?.packId === 'support_vol_1'
  const currentRemaining = isSupportPack ? getRemainingSupportBoosters() : getRemainingBoosters()

  return (
    <div className="flex flex-col gap-3 mt-6 w-full items-center">
      {showDebug && (
        <div className="flex gap-2 w-full max-sm:max-w-[280px] sm:max-w-sm mb-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-2 text-center transition-all shadow-sm">
            <p className="text-[8px] font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-0.5 font-bold">Unpack Speed</p>
            <p className="text-sm font-black text-amber-600 dark:text-amber-500 italic uppercase tracking-tighter">
              {((1 - speedMultiplier) * 100).toFixed(0)}% <span className="text-[10px] ml-1 opacity-60">({consecutiveOpenCount}x)</span>
            </p>
          </div>
          {(gameState === 'revealed' || gameState === 'ripping') && !isMassOpening && packProbs && (
            <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-2 text-center transition-all animate-in zoom-in duration-300 shadow-sm">
              <p className="text-[8px] font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-0.5 font-bold">Probability</p>
              <p className="text-sm font-black text-amber-600 dark:text-amber-500">{(packProbs.wholePackChance * 100).toPrecision(4)}%</p>
            </div>
          )}
        </div>
      )}

      {gameState === 'idle' && currentRemaining > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-10 border-2 border-white/20 shadow-lg font-bold"
            onClick={handleOpenPack}
          >
            Pack öffnen
          </Button>

          {getRandomOpenableBoosters() >= 10 && (
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full px-8 border-2 border-white/10 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all font-black uppercase tracking-widest gap-2"
              onClick={handleOpenTenPacks}
            >
              10er Pack öffnen
            </Button>
          )}
        </div>
      )}

      {gameState === 'revealed' && (isMassOpening || allFlipped) && (
        <div className="flex flex-col gap-2 w-full max-sm:max-w-[280px] sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {(() => {
            const canOpenAnotherTen = isMassOpening && getRandomOpenableBoosters() >= 10
            const singlePacksRemaining = !isMassOpening && currentRemaining > 0

            return (
          <Button
            onClick={
              canOpenAnotherTen
                ? handleOpenTenPacks
                : singlePacksRemaining
                  ? handleOpenPack
                  : () => setGameState('idle')
            }
            variant="default"
            size="lg"
            className={cn(
              'rounded-full px-8 border-2 transition-all duration-500 shadow-xl w-full',
              canOpenAnotherTen
                ? 'border-neutral-900 !bg-neutral-900 !text-white hover:!bg-neutral-800 hover:border-neutral-800'
                : singlePacksRemaining
                  ? 'border-neutral-900 !bg-neutral-900 !text-white hover:!bg-neutral-800 hover:border-neutral-800'
                  : 'border-destructive bg-destructive text-white hover:bg-destructive/90'
            )}
          >
            {canOpenAnotherTen ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Weitere 10 Packs aufreißen ({getRandomOpenableBoosters()})
              </>
            ) : singlePacksRemaining ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Nächstes Pack öffnen ({currentRemaining})
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                {isSupportPack ? 'Keine Support-Packs mehr' : `Pack-Reset in ${timeLeft}`}
              </>
            )}
          </Button>
            )
          })()}

          {(() => {
            const singlePacksRemaining = !isMassOpening && currentRemaining > 0

            if (!singlePacksRemaining) return null

            return (
              <Button
                onClick={() => setGameState('idle')}
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Zur Booster-Ansicht
              </Button>
            )
          })()}

          <div className="flex gap-2 w-full">
            <Button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('view', 'album')
                window.history.pushState({}, '', url)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              variant="ghost"
              size="sm"
              className="flex-1 text-muted-foreground hover:text-primary transition-all duration-1000 px-3"
            >
              <Trophy className="h-3.5 w-3.5 mr-2" />
              Album
            </Button>

            <Button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('view', 'decks')
                window.history.pushState({}, '', url)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              variant="ghost"
              size="sm"
              className="flex-1 text-muted-foreground hover:text-primary transition-all duration-1000 px-3"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-2" />
              Decks
            </Button>
          </div>

          {isTradingEnabled && (
            <Link href="/sammelkarten/tausch" className="w-full max-sm:max-w-[280px] sm:max-w-sm mt-0.5">
              <Button variant="secondary" size="sm" className="w-full text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 font-bold uppercase tracking-tight shadow-sm">
                <ArrowLeftRight className="h-3.5 w-3.5 mr-2" />
                Tausch-Zentrum
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
