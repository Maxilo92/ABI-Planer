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

const DEFAULT_VARIANTS_PROBABILITIES = {
  shiny: 0.05,
  holo: 0.15,
  black_shiny_holo: 0.005
};

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
  const { collectBooster, collectMassBoosters, teachers: userTeachers, getRemainingBoosters } = useUserTeachers()
  const [config, setConfig] = useState<SammelkartenConfig | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'ripping' | 'revealed'>('idle')
  const [isMassOpening, setIsMassOpening] = useState(false)
  
  // Single Pack Results
  const [revealedTeachers, setRevealedTeachers] = useState<LootTeacher[] | null>(null)
  const [collectionResults, setCollectionResults] = useState<Array<{ isNew: boolean, isLevelUp: boolean, oldLevel?: number, newLevel: number, count: number, variant: CardVariant } | null> | null>(null)
  
  // Mass Opening Results (10 Packs)
  const [massRevealedTeachers, setMassRevealedTeachers] = useState<Array<{ teachers: LootTeacher[], isGodpack: boolean }> | null>(null)
  const [massCollectionResults, setMassCollectionResults] = useState<Array<Array<{ isNew: boolean, isLevelUp: boolean, oldLevel?: number, newLevel: number, count: number, variant: CardVariant } | null>> | null>(null)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false])
  const [isGodpack, setIsGodpack] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [showDebug, setShowDebug] = useState(false)
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

  const handleOpenTenPacks = async () => {
    if (getRemainingBoosters() < 10) {
      toast.error('Du brauchst mindestens 10 Booster für diese Aktion!')
      return
    }

    setGameState('ripping')
    setIsAnimating(true)
    setIsMassOpening(true)
    setRevealedTeachers(null)
    setCollectionResults(null)
    setMassRevealedTeachers(null)
    setMassCollectionResults(null)

    const godpackChance = config?.global_limits?.godpack_chance ?? 0.005
    const packsData = Array.from({ length: 10 }).map(() => {
      const godpack = Math.random() < godpackChance
      return {
        isGodpack: godpack,
        teachers: generatePack(godpack)
      }
    })

    try {
      const initialTeachers = { ...userTeachers }
      const massPacks = packsData.map(p => ({
        teacherIds: p.teachers.map(t => t.id || t.name),
        isGodpack: p.isGodpack
      }))

      const allResults = await collectMassBoosters(massPacks)
      
      const processedMassResults = allResults.map((packResults) => {
        return packResults.map(r => {
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
      })

      setTimeout(() => {
        setMassRevealedTeachers(packsData)
        setMassCollectionResults(processedMassResults)
        
        // Logging für Booster-Öffnungen entfernt (wird nicht mehr geloggt)
      }, 300)

      setTimeout(() => {
        setGameState('revealed')
        setIsAnimating(false)
      }, 700)
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Öffnen der 10 Packs.')
      setGameState('idle')
      setIsMassOpening(false)
    }
  }

  const handleOpenPack = async () => {
    if (getRemainingBoosters() <= 0) {
      toast.error('Limit erreicht! Komm morgen wieder.')
      return
    }

    setGameState('ripping')
    setIsAnimating(true)
    setIsMassOpening(false)
    setFlippedCards([false, false, false])
    setRevealedTeachers(null)
    setCollectionResults(null)
    setMassRevealedTeachers(null)
    setMassCollectionResults(null)

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
        
        // Logging für Booster-Öffnungen entfernt (wird nicht mehr geloggt)
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

  const getVariantProbability = (variant: CardVariant, isGodpack: boolean) => {
    const probs = config?.variant_probabilities || DEFAULT_VARIANTS_PROBABILITIES;
    
    if (isGodpack) {
      // Godpack: if (rand < 0.1) bsh; if (rand < 0.4) shiny; if (rand < 0.8) holo
      switch (variant) {
        case 'black_shiny_holo': return 0.1;
        case 'shiny': return 0.4 - 0.1; // P(0.1 <= rand < 0.4)
        case 'holo': return 0.8 - 0.4; // P(0.4 <= rand < 0.8)
        default: return 1.0 - 0.8; // P(rand >= 0.8)
      }
    }
    
    const pBSH = probs.black_shiny_holo ?? 0.005;
    const pShiny = probs.shiny ?? 0.05;
    const pHolo = probs.holo ?? 0.15;

    // Regular: if (rand < pBSH) bsh; if (rand < pShiny) shiny; if (rand < pHolo) holo
    switch (variant) {
      case 'black_shiny_holo': return pBSH;
      case 'shiny': return pShiny - pBSH; // P(pBSH <= rand < pShiny)
      case 'holo': return pHolo - pShiny; // P(pShiny <= rand < pHolo)
      default: return 1.0 - pHolo; // P(rand >= pHolo)
    }
  }

  const getPackProbabilities = () => {
    if (!revealedTeachers || !collectionResults || !config) return null;
    
    const godpackChance = config.global_limits?.godpack_chance ?? 0.005;
    const weights = isGodpack ? (config.godpack_weights || DEFAULT_GODPACK_WEIGHTS) : (config.rarity_weights || DEFAULT_RARITY_WEIGHTS);
    
    const cardChances = revealedTeachers.map((teacher, i) => {
      const slotWeights = weights[i] as any;
      const rarityChance = slotWeights[teacher.rarity] || 0;
      
      const result = collectionResults[i];
      if (!result) return 0;

      const variantChance = getVariantProbability(result.variant, isGodpack);
      return rarityChance * variantChance;
    });

    const combinedCardChance = cardChances.reduce((acc, curr) => acc * curr, 1);
    const wholePackChance = (isGodpack ? godpackChance : (1 - godpackChance)) * combinedCardChance;

    return {
      cardChances,
      wholePackChance
    };
  };

  const packProbs = getPackProbabilities();

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
              <div className="flex items-center justify-center gap-2 relative">
                <h1 className="text-3xl font-black tracking-tighter font-mono flex items-center gap-3 justify-center">
                  <Sparkles className={cn("h-7 w-7", gameState === 'revealed' ? "text-primary animate-pulse" : "text-muted-foreground")} />
                  SAMMELKARTEN
                </h1>
                <button 
                  onClick={() => setShowDebug(!showDebug)}
                  className={cn(
                    "p-1.5 rounded-full transition-all hover:bg-muted",
                    showDebug ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground/30"
                  )}
                  title="Debug-Informationen"
                >
                  <Star className="h-4 w-4" />
                </button>
              </div>
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
              
              {/* Revealed Cards (Single Pack) */}
              <AnimatePresence mode="wait">
                {(gameState === 'ripping' || gameState === 'revealed') && !isMassOpening && revealedTeachers && (
                  <motion.div 
                    key={revealedTeachers.map(t => t.id || t.name).join('-')}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="grid grid-cols-2 sm:grid-cols-3 place-items-center gap-x-2 gap-y-5 sm:gap-x-5 sm:gap-y-6 md:gap-x-8 w-full max-w-5xl px-1 sm:px-4"
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
                              x: idx === 0 ? -60 : idx === 2 ? 60 : 0
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
                            "relative flex flex-col items-center w-[44vw] min-w-[140px] max-w-[190px] sm:w-full sm:min-w-0 sm:max-w-[185px] md:max-w-[200px] lg:max-w-[220px]",
                            idx === 2 && "col-span-2 sm:col-span-1",
                            isFlipped && result?.isNew && "animate-new-card-float z-10",
                            isFlipped && result?.variant === 'black_shiny_holo' && "z-30 scale-110"
                          )}
                          style={{ zIndex: isFlipped ? (result?.variant === 'black_shiny_holo' ? 50 : 30) : 20 }}
                        >
                          {/* This outer div is now the only click handler */}
                          <div onClick={() => !isFlipped && handleFlipCard(idx)}>
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

                            <div className="relative w-full aspect-[2.5/3.5]">
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
                                interactive={false} // Card in booster view is never interactive on its own
                                upgradeInfo={isFlipped && result?.isLevelUp ? { oldLevel: result.oldLevel!, newLevel: result.newLevel } : undefined}
                                className="w-full h-auto"
                              />
                            </div>
                            
                            {isFlipped && showDebug && packProbs && (
                              <div className="mt-2 bg-black/80 text-[8px] font-mono p-1 rounded border border-white/10 text-amber-200 animate-in fade-in duration-500">
                                Chance: {(packProbs.cardChances[idx] * 100).toPrecision(3)}%
                              </div>
                            )}
                            {!isFlipped && (
                              <div className="mt-4 animate-pulse text-[10px] text-white/50 font-black uppercase tracking-[0.2em] text-center line-clamp-1">Tippen</div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mass Results (10 Packs) */}
              <AnimatePresence mode="wait">
                {(gameState === 'ripping' || gameState === 'revealed') && isMassOpening && massRevealedTeachers && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-4xl h-[65vh] overflow-y-auto px-4 space-y-6 custom-scrollbar pr-2"
                  >
                    {massRevealedTeachers.map((packData, packIdx) => (
                      <motion.div 
                        key={packIdx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: packIdx * 0.05 }}
                        className={cn(
                          "flex items-center gap-3 sm:gap-6 p-3 sm:p-5 rounded-[2.5rem] border transition-colors",
                          packData.isGodpack 
                            ? "bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/15" 
                            : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
                        )}
                      >
                        {/* Pack Counter/Visual */}
                        <div className="flex-none flex flex-col items-center justify-center w-12 sm:w-16">
                           <div className={cn(
                              "relative w-full aspect-[2.5/3.5] rounded-lg border flex items-center justify-center shadow-inner overflow-hidden",
                              packData.isGodpack ? "bg-amber-600 border-amber-400" : "bg-blue-600/20 border-white/10"
                           )}>
                              <Zap className={cn("h-6 w-6", packData.isGodpack ? "text-white animate-pulse" : "text-white/40")} />
                              <div className="absolute top-1 right-1 bg-white/10 px-1 rounded text-[8px] font-black text-white/60">#{packIdx + 1}</div>
                              {packData.isGodpack && (
                                <div className="absolute -bottom-1 -left-1 -right-1 bg-amber-200 text-amber-900 text-[6px] font-black text-center uppercase py-0.5 transform -rotate-12">GODPACK</div>
                              )}
                           </div>
                        </div>

                        {/* 3 Cards Preview */}
                        <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-4">
                          {packData.teachers.map((teacher, cardIdx) => {
                            const result = massCollectionResults?.[packIdx]?.[cardIdx]
                            const cardData = mapToCardData(teacher, result?.variant || 'normal', config?.loot_teachers || DEFAULT_TEACHERS)
                            
                            return (
                              <div key={cardIdx} className="relative group">
                                <TeacherCard 
                                  data={cardData}
                                  isFlippedExternally={true}
                                  className="w-full h-auto scale-100 group-hover:scale-[1.05] transition-transform duration-300"
                                />
                                {result && (
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-40">
                                    {result.isNew ? (
                                      <Badge className="bg-amber-500 border border-white/20 text-[8px] sm:text-[9px] font-black px-1.5 py-0 shadow-lg uppercase scale-90 sm:scale-100">NEW</Badge>
                                    ) : result.isLevelUp ? (
                                      <Badge className="bg-purple-600 border border-white/20 text-[8px] sm:text-[9px] font-black px-1.5 py-0 shadow-lg uppercase scale-90 sm:scale-100">UP</Badge>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    ))}
                    <div className="h-8" /> {/* Spacer */}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Booster Pack (Rendered on top during idle/ripping) */}
              {(gameState === 'idle' || gameState === 'ripping') && (
                <div 
                  className={cn(
                    "absolute z-30 w-64 h-96 cursor-pointer group transition-all duration-500",
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
            <div className="flex flex-col gap-4 mt-8 w-full items-center">

              {/* Action Buttons for Idle State */}
              {gameState === 'idle' && getRemainingBoosters() > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-10 border-2 border-white/20 shadow-xl font-bold"
                    onClick={handleOpenPack}
                  >
                    Pack öffnen
                  </Button>

                  {getRemainingBoosters() >= 10 && (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="rounded-full px-8 border-2 border-white/10 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all font-black uppercase tracking-widest gap-2"
                      onClick={handleOpenTenPacks}
                    >
                      <Sparkles className="h-5 w-5 fill-current text-yellow-300" />
                      10er Pack öffnen
                    </Button>
                  )}
                </div>
              )}

              {/* Action Buttons for Revealed State */}
              {gameState === 'revealed' && (isMassOpening || allFlipped) && (

              <div className="flex flex-col gap-3 w-full max-sm:max-w-[280px] sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {!isMassOpening && showDebug && packProbs && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-2 text-center">
                    <p className="text-[10px] font-mono text-amber-200 uppercase tracking-widest mb-1">Pack-Wahrscheinlichkeit</p>
                    <p className="text-xl font-black text-amber-500">{(packProbs.wholePackChance * 100).toPrecision(4)}%</p>
                    <p className="text-[8px] text-amber-200/50 mt-1 font-mono">
                      {isGodpack ? 'GODPACK FACTOR APPLIED' : 'REGULAR PACK PROBABILITY'}
                    </p>
                  </div>
                )}
                <Button 
                  onClick={getRemainingBoosters() > 0 ? (isMassOpening ? handleOpenTenPacks : handleOpenPack) : () => setGameState('idle')}
                  variant="outline"                    size="lg"
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
