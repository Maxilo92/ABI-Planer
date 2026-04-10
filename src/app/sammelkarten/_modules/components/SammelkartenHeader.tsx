import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowLeftRight, Info, LayoutGrid, ShoppingBag, Sparkles, Star, Trophy, Zap } from 'lucide-react'

type SammelkartenHeaderProps = {
  gameState: 'idle' | 'ripping' | 'revealed'
  showDebug: boolean
  setShowDebug: (value: boolean) => void
  getRemainingBoosters: () => number
  getRemainingSupportBoosters: () => number
  timeLeft: string
  packSelectionHref: string | null
}

export function SammelkartenHeader(props: SammelkartenHeaderProps) {
  const { gameState, showDebug, setShowDebug, getRemainingBoosters, getRemainingSupportBoosters, timeLeft, packSelectionHref } = props
  const totalPacks = getRemainingBoosters() + getRemainingSupportBoosters()

  return (
    <div className={cn(
      'text-center space-y-2 transition-all duration-700 opacity-100',
      gameState === 'revealed' && 'scale-105'
    )}>
      <div className="flex items-center justify-center gap-2 relative">
        <h1 className="text-3xl font-black tracking-tighter font-mono flex items-center gap-3 justify-center text-foreground">
          <Sparkles className={cn('h-7 w-7', (gameState === 'revealed' || gameState === 'idle') ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
          SAMMELKARTEN
        </h1>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={cn(
            'p-1.5 rounded-full transition-all hover:bg-muted',
            showDebug ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground/30'
          )}
          title="Debug-Informationen"
        >
          <Star className="h-4 w-4" />
        </button>
      </div>

      {(gameState === 'idle' || gameState === 'revealed') && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant={totalPacks > 0 ? 'secondary' : 'destructive'} className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-white/10">
              <Zap className="h-3 w-3 mr-1.5 fill-current" />
              {totalPacks > 0 ? `${totalPacks} Packs verfügbar` : `Nächste Packs in ${timeLeft}`}
            </Badge>

            {packSelectionHref && (
              <Link href={packSelectionHref}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Pack wechseln"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <Link href="/shop?category=sammelkarten">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Booster-Shop"
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/sammelkarten/info">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Wahrscheinlichkeiten & Infos"
              >
                <Info className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {gameState === 'idle' && (
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground/80 hover:text-primary gap-2"
                onClick={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.set('view', 'album')
                  window.history.pushState({}, '', url)
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              >
                <Trophy className="h-4 w-4" />
                Zum Album
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground/80 hover:text-primary gap-2"
                onClick={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.set('view', 'decks')
                  window.history.pushState({}, '', url)
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              >
                <LayoutGrid className="h-4 w-4" />
                Meine Decks
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
