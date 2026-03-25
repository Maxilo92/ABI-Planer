'use client'

import { useAuth } from '@/context/AuthContext'
import { Sparkles, Gift, GraduationCap, RotateCcw, Zap, Trophy, Clock, Star, Lock } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { redirect, useSearchParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { TeacherRarity, LootTeacher, CardVariant } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useUserTeachers, getCurrentBoosterDay } from '@/hooks/useUserTeachers'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { GiftNoticeBanner } from '@/components/dashboard/GiftNoticeBanner'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { CardData, CardVariant as NewCardVariant, SammelkartenConfig } from '@/types/cards'
import { useGiftNotices } from '@/hooks/useGiftNotices'
import { logAction } from '@/lib/logging'
import { toast } from 'sonner'

const DEFAULT_TEACHERS: LootTeacher[] = [
  { id: 'max-mustermann', name: "Max Mustermann", rarity: "common" },
  { id: 'erika-musterfrau', name: "Erika Musterfrau", rarity: "rare" },
  { id: 'marie-curie', name: "Marie Curie", rarity: "mythic" },
  { id: 'albert-einstein', name: "Albert Einstein", rarity: "legendary" }
]

const DEFAULT_RARITY_WEIGHTS = [
  { common: 0.8, rare: 0.15, epic: 0.04, mythic: 0.008, legendary: 0.002 },
  { common: 0.6, rare: 0.25, epic: 0.11, mythic: 0.03, legendary: 0.01 },
  { common: 0.4, rare: 0.35, epic: 0.17, mythic: 0.06, legendary: 0.02 }
]

const DEFAULT_GODPACK_WEIGHTS = [
  { common: 0, rare: 0.4, epic: 0.35, mythic: 0.15, legendary: 0.10 },
  { common: 0, rare: 0.2, epic: 0.4, mythic: 0.25, legendary: 0.15 },
  { common: 0, rare: 0, epic: 0.4, mythic: 0.4, legendary: 0.2 }
]

const getRarityHex = (rarity: TeacherRarity) => {
  switch (rarity) {
    case 'common': return '#64748b'
    case 'rare': return '#10b981'
    case 'epic': return '#9333ea'
    case 'mythic': return '#dc2626'
    case 'legendary': return '#f59e0b'
    default: return '#64748b'
  }
}

const mapToCardData = (teacher: LootTeacher, variant: CardVariant | NewCardVariant, globalTeachers: LootTeacher[]): CardData => {
  const newVariant: NewCardVariant = variant as NewCardVariant;
  
  const globalIndex = globalTeachers.findIndex(t => (t.id || t.name) === (teacher.id || teacher.name))
  
  return {
    id: teacher.id || teacher.name,
    name: teacher.name,
    rarity: teacher.rarity,
    variant: newVariant,
    color: getRarityHex(teacher.rarity),
    cardNumber: (globalIndex + 1).toString().padStart(3, '0'),
  }
}

function SammelkartenContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'sammelkarten'
  const { user, profile, loading } = useAuth()
  const { collectBooster, teachers: userTeachers, getRemainingBoosters } = useUserTeachers()
  const [config, setConfig] = useState<SammelkartenConfig | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'ripping' | 'revealed'>('idle')
  const [revealedTeachers, setRevealedTeachers] = useState<LootTeacher[] | null>(null)
  const [collectionResults, setCollectionResults] = useState<Array<{ isNew: boolean, isLevelUp: boolean, oldLevel?: number, newLevel: number, count: number, variant: CardVariant } | null> | null>(null)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false])
  const [isGodpack, setIsGodpack] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const { giftNotices, totalGiftPacks, dismissGiftNotices } = useGiftNotices(user?.uid)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      
      const resetHour = config?.global_limits?.reset_hour ?? 9
      
      // Calculate next reset in Europe/Berlin
      const berlinNowStr = now.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
      const berlinNow = new Date(berlinNowStr)
      
      const target = new Date(berlinNowStr)
      target.setHours(resetHour, 0, 0, 0)
      
      if (berlinNow >= target) {
        target.setDate(target.getDate() + 1)
      }
      
      const diff = target.getTime() - berlinNow.getTime()
      
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [config])

  useEffect(() => {
    if (!loading && !user) {
      redirect('/login?reason=unauthorized')
    }
  }, [user, loading])

  const handleDismissGiftNotices = async () => {
    try {
      await dismissGiftNotices()
    } catch (error) {
      console.error('Error dismissing gift notices:', error)
      toast.error('Geschenk-Hinweis konnte nicht geschlossen werden.')
    }
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as SammelkartenConfig)
      } else {
        // Fallback to global if sammelkarten settings don't exist yet
        const unsubGlobal = onSnapshot(doc(db, 'settings', 'global'), (globalSnap) => {
          if (globalSnap.exists()) {
            const data = globalSnap.data()
            setConfig({
              loot_teachers: data.loot_teachers || DEFAULT_TEACHERS,
              rarity_weights: DEFAULT_RARITY_WEIGHTS,
              godpack_weights: DEFAULT_GODPACK_WEIGHTS,
              variant_probabilities: { shiny: 0.05, holo: 0.15, black_shiny_holo: 0.005 },
              global_limits: { daily_allowance: 2, reset_hour: 9, godpack_chance: 0.005 }
            })
          }
        })
        return () => unsubGlobal()
      }
    })
    return () => unsubscribe()
  }, [])

  if (loading) return null

  const generatePack = (isGodpack: boolean): LootTeacher[] => {
    const teachers = Array.isArray(config?.loot_teachers) && config.loot_teachers.length > 0
      ? config.loot_teachers
      : DEFAULT_TEACHERS

    const getWeightedRarity = (weights: Record<string, number>): TeacherRarity => {
      const rand = Math.random()
      let cumulative = 0
      for (const [rarity, weight] of Object.entries(weights)) {
        cumulative += weight
        if (rand < cumulative) return rarity as TeacherRarity
      }
      return 'common'
    }

    const regularWeights = config?.rarity_weights || DEFAULT_RARITY_WEIGHTS
    const godpackWeights = config?.godpack_weights || DEFAULT_GODPACK_WEIGHTS

    const slotWeights = isGodpack ? godpackWeights : regularWeights

    return slotWeights.map(weights => {
      const targetRarity = getWeightedRarity(weights as unknown as Record<string, number>)
      const matching = teachers.filter((t: any) => t.rarity === targetRarity)
      if (matching.length > 0) {
        return matching[Math.floor(Math.random() * matching.length)]
      }
      return teachers[Math.floor(Math.random() * teachers.length)]
    })
  }

  const handleOpenPack = async () => {
    if (getRemainingBoosters() <= 0) {
      toast.error('Limit erreicht! Komm morgen wieder.')
      return
    }

    setGameState('ripping')
    setIsAnimating(true)
    setFlippedCards([false, false, false])
    setRevealedTeachers(null)
    setCollectionResults(null)

    const godpackChance = config?.global_limits?.godpack_chance ?? 0.005
    const godpack = Math.random() < godpackChance
    setIsGodpack(godpack)
    const pack = generatePack(godpack)
    setRevealedTeachers(pack)

    if (godpack) {
      toast("✨ GODPACK GEFUNDEN! ✨", {
        description: "Alle Karten sind besonders selten!",
        duration: 5000,
      })
    }

    // Trigger explosive fly-apart immediately
    try {
      const teacherIds = pack.map(t => t.id || t.name)
      const initialTeachers = { ...userTeachers }
      const results = await collectBooster(teacherIds, { isGodpack: godpack })
      
      const processedResults = results.map(r => {
        const isNew = !initialTeachers[r.teacherId]
        const oldLevel = initialTeachers[r.teacherId]?.level || 1
        const isLevelUp = !isNew && r.level > oldLevel
        
        initialTeachers[r.teacherId] = { 
          count: r.count, 
          level: r.level,
          variants: {
            ...initialTeachers[r.teacherId]?.variants,
            [r.variant]: (initialTeachers[r.teacherId]?.variants?.[r.variant] || 0) + 1
          }
        }
        return {
          isNew,
          isLevelUp,
          oldLevel,
          newLevel: r.level,
          count: r.count,
          variant: r.variant
        }
      })

      // Delay data reveal until cards have flipped back (important for re-draw)
      setTimeout(() => {
        setRevealedTeachers(pack)
        setCollectionResults(processedResults)
        
        if (user) {
          logAction('LOOT_BOOSTER', user.uid, profile?.full_name, { 
            teachers: pack.map(t => t.id || t.name),
            results: processedResults,
            isGodpack: godpack
          })
        }
      }, 300)

      // Final transition to revealed
      setTimeout(() => {
        setGameState('revealed')
        setIsAnimating(false)
      }, 700) // Adjusted timing to account for data delay
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Sammeln.')
      setGameState('idle')
    }
  }

  const handleFlipCard = (index: number) => {
    const newFlipped = [...flippedCards]
    newFlipped[index] = true
    setFlippedCards(newFlipped)
  }

  const allFlipped = flippedCards.every(v => v === true)

  return (
    <div className="container mx-auto py-8">
      {giftNotices.length > 0 && (
        <GiftNoticeBanner
          totalGiftPacks={totalGiftPacks}
          titleText={giftNotices[0]?.popupTitle}
          bodyText={giftNotices[0]?.popupBody}
          customMessage={giftNotices[0]?.customMessage}
          ctaLabel={giftNotices[0]?.ctaLabel}
          ctaUrl={giftNotices[0]?.ctaUrl}
          dismissLabel={giftNotices[0]?.dismissLabel}
          onDismiss={handleDismissGiftNotices}
        />
      )}

      {view === 'sammelkarten' ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] overflow-hidden pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="relative flex flex-col items-center space-y-8 sm:space-y-12 w-full max-w-4xl px-6">
            
            {/* Minimal Header */}
            <div className={cn(
              "text-center space-y-2 transition-all duration-700",
              gameState === 'revealed' ? "opacity-100 scale-105" : "opacity-40"
            )}>
              <h1 className="text-3xl font-black tracking-tighter font-mono flex items-center gap-3 justify-center">
                <Sparkles className={cn("h-7 w-7", gameState === 'revealed' ? "text-primary animate-pulse" : "text-muted-foreground")} />
                SAMMELKARTEN
              </h1>
              {(gameState === 'idle' || gameState === 'revealed') && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant={getRemainingBoosters() > 0 ? "secondary" : "destructive"} className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-white/10">
                      <Zap className="h-3 w-3 mr-1.5 fill-current" />
                      {getRemainingBoosters() > 0 ? `${getRemainingBoosters()} Booster übrig` : `Nächster Booster in ${timeLeft}`}
                    </Badge>
                  </div>
                  {gameState === 'idle' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary mt-1 gap-2"
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
                  )}
                </div>
              )}
            </div>

            {/* The Pack/Card Container */}
            <div className="relative w-full min-h-[400px] flex items-center justify-center overflow-visible">
              
              {/* Revealed Cards (Rendered behind the pack during ripping) */}
              <AnimatePresence mode="wait">
                {(gameState === 'ripping' || gameState === 'revealed') && revealedTeachers && (
                  <motion.div 
                    key={revealedTeachers.map(t => t.id || t.name).join('-')}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-6xl px-2 sm:px-6"
                  >
                    {revealedTeachers.map((teacher, idx) => {
                      const isFlipped = flippedCards[idx]
                      const result = collectionResults?.[idx]
                      const cardData = mapToCardData(teacher, result?.variant || 'normal', config?.loot_teachers || DEFAULT_TEACHERS)
                      
                      return (
                        <motion.div 
                          key={`${teacher.id}-${idx}`}
                          variants={{
                            hidden: { 
                              y: 100, 
                              opacity: 0, 
                              scale: 0.5,
                              rotate: idx === 0 ? -15 : idx === 2 ? 15 : 0,
                              x: idx === 0 ? 100 : idx === 2 ? -100 : 0
                            },
                            visible: { 
                              y: 0, 
                              opacity: 1, 
                              scale: 1,
                              rotate: 0,
                              x: 0,
                              transition: { 
                                delay: idx * 0.1,
                                type: 'spring',
                                damping: 15,
                                stiffness: 100
                              }
                            }
                          }}
                          className={cn(
                            "relative flex flex-col items-center flex-none w-[calc(50%-1rem)] min-w-[140px] max-w-[200px] sm:flex-1 sm:max-w-none sm:min-w-0",
                            isFlipped && result?.isNew && "animate-new-card-float z-10",
                            isFlipped && result?.variant === 'black_shiny_holo' && "z-30 scale-110"
                          )}
                          style={{ zIndex: isFlipped ? (result?.variant === 'black_shiny_holo' ? 50 : 30) : 20 }}
                          onClick={() => !isFlipped && handleFlipCard(idx)}
                        >
                          {/* Black Shiny Void Effect */}
                          {isFlipped && result?.variant === 'black_shiny_holo' && (
                            <div className="absolute inset-[-40px] z-0 pointer-events-none overflow-visible">
                              <div className="absolute inset-0 bg-purple-600/20 blur-[60px] animate-pulse rounded-full" />
                              <div className="absolute inset-0 bg-blue-600/10 blur-[40px] animate-pulse rounded-full delay-700" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="w-full h-full border-4 border-white/5 animate-ping rounded-3xl opacity-20" />
                              </div>
                            </div>
                          )}

                          <div className="relative w-full aspect-[2.5/3.5] sm:w-64">
                            {/* Floating Status Badge (shown after flip) */}
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

                            <TeacherCard 
                              data={cardData}
                              isFlippedExternally={isFlipped}
                              upgradeInfo={isFlipped && result?.isLevelUp ? { oldLevel: result.oldLevel!, newLevel: result.newLevel } : undefined}
                              className="w-full h-auto"
                            />
                          </div>
                          
                          {!isFlipped && (
                            <div className="mt-4 animate-pulse text-[10px] text-white/50 font-black uppercase tracking-[0.2em] text-center line-clamp-1">Tippen</div>
                          )}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Booster Pack (Rendered on top during idle/ripping) */}
              {(gameState === 'idle' || gameState === 'ripping') && (
                <div 
                  className={cn(
                    "absolute z-20 w-64 h-96 cursor-pointer group transition-all duration-500",
                    getRemainingBoosters() <= 0 && "opacity-50 cursor-not-allowed",
                    gameState === 'idle' && getRemainingBoosters() > 0 && "hover:scale-105 active:scale-95"
                  )}
                  onClick={getRemainingBoosters() > 0 && gameState === 'idle' ? handleOpenPack : undefined}
                >
                  {getRemainingBoosters() <= 0 && gameState === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 rounded-3xl backdrop-blur-sm">
                       <Clock className="h-10 w-10 text-white mb-3" />
                       <p className="text-white font-black text-xs uppercase tracking-[0.2em]">{timeLeft}</p>
                    </div>
                  )}

                  {/* Top Part */}
                  <div className={cn(
                    "absolute top-0 left-0 w-full h-1/3 bg-transparent z-20 flex items-end justify-center pb-4 transition-transform duration-500",
                    gameState === 'ripping' && "animate-rip-top"
                  )}>
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-b rounded-t-3xl border-x-4 border-t-4 border-white/20 shadow-inner",
                      isGodpack ? "from-yellow-400 to-amber-600" : "from-blue-600 to-blue-800"
                    )} />
                    <Zap className={cn("h-12 w-12 text-white/60 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] relative z-10", isGodpack && "animate-pulse text-white")} />
                  </div>
                  
                  {/* Bottom Part */}
                  <div className={cn(
                    "absolute bottom-0 left-0 w-full h-2/3 z-10 flex flex-col items-center pt-8 transition-transform duration-500",
                    gameState === 'ripping' && "animate-rip-bottom"
                  )}>
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-t rounded-b-3xl border-x-4 border-b-4 border-white/20 shadow-2xl",
                      isGodpack ? "from-amber-900 via-amber-700 to-amber-600" : "from-slate-900 via-blue-900 to-blue-800"
                    )} />
                    <div className="relative z-10 flex flex-col items-center h-full w-full">
                      <div className="w-16 h-1 bg-white/20 rounded-full mb-8" />
                      <h2 className="text-white font-black text-3xl tracking-tighter mb-1 italic drop-shadow-md">ABI PLANER</h2>
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.4em]", isGodpack ? "text-amber-200/80" : "text-blue-200/60")}>{isGodpack ? "✨ GODPACK ✨" : "Booster Pack"}</p>
                      
                      <div className="mt-auto mb-12">
                         <div className="relative">
                            <Gift className={cn(
                              "h-16 w-16 transition-all duration-500",
                              gameState === 'idle' ? "text-white/30 group-hover:text-white/60 group-hover:scale-110" : "text-white/50 scale-110",
                              isGodpack && "text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                            )} />
                            <div className={cn("absolute inset-0 blur-xl rounded-full scale-150 animate-pulse", isGodpack ? "bg-amber-400/40" : "bg-white/20")} />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-4 w-full items-center">
              {gameState === 'revealed' && allFlipped && (
                <div className="flex flex-col gap-3 w-full max-sm:max-w-[280px] sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <Button 
                    onClick={getRemainingBoosters() > 0 ? handleOpenPack : () => setGameState('idle')}
                    variant="outline"
                    size="lg"
                    className={cn(
                      "rounded-full px-8 border-2 transition-all duration-500 shadow-xl w-full",
                      getRemainingBoosters() > 0 
                        ? "hover:bg-white hover:text-black border-white/20" 
                        : "border-destructive/30 text-destructive/80 hover:bg-destructive hover:text-white"
                    )}
                  >
                    {getRemainingBoosters() > 0 ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Noch einmal versuchen ({getRemainingBoosters()})
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Pack-Reset in {timeLeft}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.set('view', 'album')
                      window.history.pushState({}, '', url)
                      window.dispatchEvent(new PopStateEvent('popstate'))
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary transition-all duration-1000"
                  >
                    <Trophy className="h-3.5 w-3.5 mr-2" />
                    Im Album anzeigen
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          <TeacherAlbum />
        </div>
      )}
    </div>
  )
}

export default function SammelkartenPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 text-center"><Sparkles className="h-8 w-8 animate-pulse mx-auto text-primary" /></div>}>
      <SammelkartenContent />
    </Suspense>
  )
}
