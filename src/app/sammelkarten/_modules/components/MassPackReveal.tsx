import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { CardRenderer } from '@/components/cards/CardRenderer'
import { cn } from '@/lib/utils'
import { SammelkartenConfig } from '@/types/cards'
import { mapToTeacherCardData } from '../utils/cardData'
import { getMassPackCardChances } from '../utils/probability'
import { MassPackReveal as MassPackRevealData, MaybeCollectionResult } from '../types'
import { Zap } from 'lucide-react'

type MassPackRevealProps = {
  gameState: 'idle' | 'ripping' | 'revealed'
  isMassOpening: boolean
  isAnimatedMassOpening?: boolean
  currentRippingPackIndex?: number
  massFlippedCards?: boolean[][]
  handleFlipCard?: (index: number, packIndex: number) => void
  massRevealedTeachers: MassPackRevealData[] | null
  massCollectionResults: MaybeCollectionResult[][] | null
  showDebug: boolean
  config: SammelkartenConfig | null
}

export function MassPackReveal(props: MassPackRevealProps) {
  const {
    gameState,
    isMassOpening,
    isAnimatedMassOpening,
    currentRippingPackIndex,
    massFlippedCards,
    handleFlipCard,
    massRevealedTeachers,
    massCollectionResults,
    showDebug,
    config
  } = props

  const isRevealing = gameState === 'revealed' || (isAnimatedMassOpening && gameState === 'ripping')

  return (
    <AnimatePresence mode="wait">
      {isRevealing && isMassOpening && massRevealedTeachers && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "w-full max-w-4xl h-[65vh] overflow-y-auto px-4 space-y-6 custom-scrollbar pr-2",
            isAnimatedMassOpening && gameState === 'ripping' && "overflow-hidden"
          )}
        >
          {massRevealedTeachers.map((packData, packIdx) => {
            const isPackVisible = !isAnimatedMassOpening || packIdx <= (currentRippingPackIndex ?? -1) || gameState === 'revealed'
            if (!isPackVisible) return null

            const packProbs = showDebug
              ? getMassPackCardChances({
                teachers: packData.teachers,
                collectionResults: massCollectionResults?.[packIdx],
                isGodpack: packData.isGodpack,
                config
              })
              : null

            return (
              <motion.div
                key={packIdx}
                initial={{ opacity: 0, x: -20, scale: isAnimatedMassOpening && packIdx === currentRippingPackIndex ? 1.1 : 1 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: isAnimatedMassOpening ? 0 : packIdx * 0.05 }}
                className={cn(
                  'flex items-center gap-3 sm:gap-6 p-3 sm:p-5 rounded-[2.5rem] border transition-all duration-500',
                  packData.isGodpack
                    ? 'bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/15'
                    : 'bg-white/5 border-white/10 hover:bg-white/[0.08]',
                  isAnimatedMassOpening && packIdx === currentRippingPackIndex && gameState === 'ripping' && "ring-4 ring-blue-500 ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                )}
              >
                <div className="flex-none flex flex-col items-center justify-center w-12 sm:w-16">
                  <div className={cn(
                    'relative w-full aspect-[2.5/3.5] rounded-lg border flex items-center justify-center shadow-inner overflow-hidden',
                    packData.isGodpack ? 'bg-amber-600 border-amber-400' : 'bg-blue-600/20 border-white/10'
                  )}>
                    <Zap className={cn('h-6 w-6', packData.isGodpack ? 'text-white animate-pulse' : 'text-white/40')} />
                    <div className="absolute top-1 right-1 bg-white/10 px-1 rounded text-[8px] font-black text-white/60">#{packIdx + 1}</div>
                    {packData.isGodpack && (
                      <div className="absolute -bottom-1 -left-1 -right-1 bg-amber-200 text-amber-900 text-[6px] font-black text-center uppercase py-0.5 transform -rotate-12">GODPACK</div>
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-3 sm:gap-4">
                  {packData.teachers.map((teacher, cardIdx) => {
                    const result = massCollectionResults?.[packIdx]?.[cardIdx]
                    const cardData = mapToTeacherCardData(teacher, result?.variant || 'normal')
                    const isFlipped = massFlippedCards?.[packIdx]?.[cardIdx] ?? true

                    return (
                      <div 
                        key={cardIdx} 
                        className="relative group p-0.5"
                        onClick={() => !isFlipped && handleFlipCard?.(cardIdx, packIdx)}
                      >
                        <CardRenderer
                          data={cardData}
                          isFlippedExternally={isFlipped}
                          interactive={false}
                          className="w-full h-auto scale-100 group-hover:scale-[1.05] transition-transform duration-300"
                        />
                        {isFlipped && result && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-40">
                            {result.isNew ? (
                              <Badge className="bg-amber-500 border border-white/20 text-[8px] sm:text-[9px] font-black px-1.5 py-0 shadow-lg uppercase scale-90 sm:scale-100">NEW</Badge>
                            ) : result.isLevelUp ? (
                              <Badge className="bg-purple-600 border border-white/20 text-[8px] sm:text-[9px] font-black px-1.5 py-0 shadow-lg uppercase scale-90 sm:scale-100">UP</Badge>
                            ) : null}
                          </div>
                        )}
                        {!isFlipped && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center animate-pulse">
                               <Zap className="h-4 w-4 text-white/40" />
                             </div>
                          </div>
                        )}
                        {showDebug && packProbs && isFlipped && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 text-[6px] font-mono px-1 rounded border border-white/10 text-amber-200 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            {(packProbs[cardIdx] * 100).toPrecision(2)}%
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
          <div className="h-8" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
