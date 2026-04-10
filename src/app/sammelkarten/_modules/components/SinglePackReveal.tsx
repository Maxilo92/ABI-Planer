import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { CardRenderer } from '@/components/cards/CardRenderer'
import { cn } from '@/lib/utils'
import { CardVariant, LootTeacher } from '@/types/database'
import { SammelkartenConfig } from '@/types/cards'
import { mapToTeacherCardData } from '../utils/cardData'
import { MaybeCollectionResult } from '../types'

type PackProbability = {
  cardChances: number[]
}

type SinglePackRevealProps = {
  gameState: 'idle' | 'ripping' | 'revealed'
  isMassOpening: boolean
  revealedTeachers: LootTeacher[] | null
  flippedCards: boolean[]
  collectionResults: MaybeCollectionResult[] | null
  config: SammelkartenConfig | null
  showDebug: boolean
  packProbs: PackProbability | null
  handleFlipCard: (index: number) => void
}

export function SinglePackReveal(props: SinglePackRevealProps) {
  const {
    gameState,
    isMassOpening,
    revealedTeachers,
    flippedCards,
    collectionResults,
    config,
    showDebug,
    packProbs,
    handleFlipCard
  } = props

  return (
    <AnimatePresence mode="wait">
      {(gameState === 'ripping' || gameState === 'revealed') && !isMassOpening && revealedTeachers && (
        <motion.div
          key={revealedTeachers.map((t) => t.id || t.name).join('-')}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={cn(
            "grid place-items-center gap-x-6 gap-y-6 sm:gap-x-6 sm:gap-y-7 md:gap-x-8 w-full max-w-5xl px-2 sm:px-4",
            revealedTeachers.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
          )}
        >
          {revealedTeachers.map((teacher, idx) => {
            const isFlipped = flippedCards[idx]
            const result = collectionResults?.[idx]
            const cardData = mapToTeacherCardData(teacher, (result?.variant || 'normal') as CardVariant)

            return (
              <motion.div
                key={`${teacher.id}-${idx}`}
                variants={{
                  hidden: {
                    y: 100,
                    opacity: 0,
                    scale: 0.5,
                    rotate: revealedTeachers.length === 1 ? 0 : (idx === 0 ? -15 : idx === 2 ? 15 : 0),
                    x: revealedTeachers.length === 1 ? 0 : (idx === 0 ? -60 : idx === 2 ? 60 : 0)
                  },
                  visible: {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    x: 0,
                    transition: {
                      delay: idx * 0.04,
                      type: 'spring',
                      damping: 18,
                      stiffness: 220
                    }
                  }
                }}
                className={cn(
                  'relative flex flex-col items-center w-[40vw] min-w-[140px] max-w-[200px] sm:w-full sm:min-w-0 sm:max-w-[190px] md:max-w-[210px] lg:max-w-[220px] p-0.5',
                  revealedTeachers.length > 1 && idx === 2 && 'col-span-2 sm:col-span-1',
                  isFlipped && result?.isNew && 'animate-new-card-float z-10',
                  isFlipped && result?.variant === 'black_shiny_holo' && 'z-30 scale-[1.03] sm:scale-[1.05]'
                )}
                style={{ zIndex: isFlipped ? (result?.variant === 'black_shiny_holo' ? 50 : 30) : 20 }}
              >
                <div className="w-full" onClick={() => !isFlipped && handleFlipCard(idx)}>
                  {isFlipped && result?.variant === 'black_shiny_holo' && (
                    <div className="absolute inset-[-24px] sm:inset-[-36px] z-0 pointer-events-none overflow-visible">
                      <div className="absolute inset-0 bg-purple-600/20 blur-[60px] animate-pulse rounded-full" />
                      <div className="absolute inset-0 bg-blue-600/10 blur-[40px] animate-pulse rounded-full delay-700" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full border-4 border-white/5 animate-ping rounded-3xl opacity-20" />
                      </div>
                    </div>
                  )}

                  <div className="relative w-full aspect-[2.5/3.5]">
                    {isFlipped && result && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 animate-in zoom-in duration-500">
                        {result.variant === 'black_shiny_holo' ? (
                          <Badge className="bg-neutral-950 border-2 border-purple-500 text-purple-200 text-[10px] font-black px-2 py-0 shadow-[0_0_15px_rgba(147,51,234,0.8)] whitespace-nowrap uppercase italic tracking-widest">SECRET RARE</Badge>
                        ) : result.isNew ? (
                          <Badge className="bg-amber-500 border-2 border-white text-[10px] font-black px-2 py-0 shadow-xl whitespace-nowrap uppercase">NEW</Badge>
                        ) : result.isLevelUp ? (
                          <Badge className="bg-purple-600 border-2 border-white text-[10px] font-black px-2 py-0 shadow-xl whitespace-nowrap uppercase flex items-center gap-1">
                            LVL {result.oldLevel} <span className="text-yellow-400">→</span> {result.newLevel}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500 border-2 border-white text-[10px] font-black px-2 py-0 shadow-xl whitespace-nowrap uppercase">LVL {result.newLevel}</Badge>
                        )}
                      </div>
                    )}

                    <CardRenderer
                      data={cardData}
                      isFlippedExternally={isFlipped}
                      interactive={false}
                      upgradeInfo={isFlipped && result?.isLevelUp ? { oldLevel: result.oldLevel!, newLevel: result.newLevel } : undefined}
                      className="w-full h-auto !overflow-visible"
                    />
                  </div>

                  <div className="min-h-[2.5rem] flex flex-col items-center justify-start w-full">
                    {isFlipped && showDebug && packProbs && (
                      <div className="mt-2 bg-black/80 text-[8px] font-mono p-1 rounded border border-white/10 text-amber-200 animate-in fade-in duration-500">
                        Chance: {(packProbs.cardChances[idx] * 100).toPrecision(3)}%
                      </div>
                    )}
                    {!isFlipped && (
                      <div className="mt-4 animate-pulse text-[10px] text-white/50 font-black uppercase tracking-[0.2em] text-center line-clamp-1">Tippen</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
