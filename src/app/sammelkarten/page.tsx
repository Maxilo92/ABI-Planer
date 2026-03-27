'use client'

import { useAuth } from '@/context/AuthContext'
import { Sparkles, Gift, GraduationCap, RotateCcw, Zap, Trophy, Clock, Star, Lock, Info, ShoppingBag } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { redirect, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { TeacherRarity, LootTeacher, CardVariant } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useUserTeachers, getCurrentBoosterDay } from '@/hooks/useUserTeachers'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { CardData, CardVariant as NewCardVariant, SammelkartenConfig } from '@/types/cards'
import { ProbabilityInfo } from '@/components/cards/ProbabilityInfo'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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

function getTeacherRarityHex(rarity: TeacherRarity) {
  switch (rarity) {
    case 'common': return '#64748b'
    case 'rare': return '#10b981'
    case 'epic': return '#9333ea'
    case 'mythic': return '#dc2626'
    case 'legendary': return '#f59e0b'
    default: return '#64748b'
  }
}

function mapToTeacherCardData(teacher: LootTeacher, variant: CardVariant | NewCardVariant, globalTeachers: LootTeacher[]): CardData {
  const newVariant: NewCardVariant = variant as NewCardVariant;
  
  const globalIndex = globalTeachers.findIndex(t => (t.id || t.name) === (teacher.id || teacher.name))
  
  return {
    id: teacher.id || teacher.name,
    name: teacher.name,
    rarity: teacher.rarity,
    variant,
    color: getTeacherRarityHex(teacher.rarity),
    cardNumber: (globalIndex + 1).toString().padStart(3, '0'),
    description: teacher.description,
    }
}

function SammelkartenContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'sammelkarten'
  const { user, profile, loading } = useAuth()
  const { pushMessage } = useSystemMessage()
  const { collectBooster, collectMassBoosters, teachers: userTeachers, getRemainingBoosters } = useUserTeachers()
  const [config, setConfig] = useState<SammelkartenConfig | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'ripping' | 'revealed'>('idle')
  const [isMassOpening, setIsMassOpening] = useState(false)
  const [showProbabilities, setShowProbabilities] = useState(false)
  
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
  const [consecutiveOpenCount, setConsecutiveOpenCount] = useState(0)

  // Calculate speed multiplier based on consecutive opens (0.3 to 1.0)
  const speedMultiplier = Math.max(0.3, 1 - (consecutiveOpenCount * 0.12))

  useEffect(() => {
    // Gradual combo decay: -1 every 10 seconds of inactivity
    if (consecutiveOpenCount > 0) {
      const timer = setTimeout(() => {
        setConsecutiveOpenCount(prev => Math.max(0, prev - 1))
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [consecutiveOpenCount, gameState])

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (e.repeat) return;
        e.preventDefault();
        
        if (gameState === 'idle' && getRemainingBoosters() > 0) {
          handleOpenPack();
        } else if (gameState === 'revealed' && !isMassOpening) {
          const nextIndex = flippedCards.findIndex(f => !f);
          if (nextIndex !== -1) {
            handleFlipCard(nextIndex);
          } else if (getRemainingBoosters() > 0) {
            handleOpenPack();
          } else {
            setGameState('idle');
          }
        } else if (gameState === 'revealed' && isMassOpening) {
          if (getRemainingBoosters() >= 10) {
            handleOpenTenPacks();
          } else {
            setGameState('idle');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, flippedCards, getRemainingBoosters, isMassOpening]);

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
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Du brauchst mindestens 10 Booster für diese Aktion!'
      })
      return
    }

    const isReopen = gameState === 'revealed'
    if (!isReopen) setGameState('ripping')
    
    setIsAnimating(true)
    setIsMassOpening(true)
    setMassRevealedTeachers(null)
    setMassCollectionResults(null)
    setConsecutiveOpenCount(prev => prev + 1)

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
      }, isReopen ? 100 : 300)

      setTimeout(() => {
        setGameState('revealed')
        setIsAnimating(false)
      }, isReopen ? 200 : 700)
    } catch (err: any) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: err.message || 'Fehler beim Öffnen der 10 Packs.'
      })
      setGameState('idle')
      setIsMassOpening(false)
    }
  }

  const handleOpenPack = async () => {
    if (getRemainingBoosters() <= 0) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Limit erreicht! Komm morgen wieder.'
      })
      return
    }

    const isReopen = gameState === 'revealed'
    if (!isReopen) setGameState('ripping')
    
    setIsAnimating(true)
    setIsMassOpening(false)
    setRevealedTeachers(null)
    setCollectionResults(null)
    setFlippedCards([false, false, false])
    setConsecutiveOpenCount(prev => prev + 1)

    const godpackChance = config?.global_limits?.godpack_chance ?? 0.005
    const godpack = Math.random() < godpackChance
    setIsGodpack(godpack)
    const pack = generatePack(godpack)

    if (godpack) {
      pushMessage({
        type: 'toast',
        priority: 'info',
        title: '✨ GODPACK GEFUNDEN! ✨',
        content: 'Alle Karten sind besonders selten!',
        duration: 5000,
      })
    }

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

      setTimeout(() => {
        setRevealedTeachers(pack)
        setCollectionResults(processedResults)
        setFlippedCards([false, false, false]) // Reset flip state only when new cards are set
      }, isReopen ? 100 : 300)

      setTimeout(() => {
        setGameState('revealed')
        setIsAnimating(false)
      }, isReopen ? 200 : 700)
    } catch (err: any) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: err.message || 'Fehler beim Sammeln.'
      })
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
      switch (variant) {
        case 'black_shiny_holo': return 0.1;
        case 'shiny': return 0.3;
        case 'holo': return 0.4;
        default: return 0.2;
      }
    }
    
    const pBSH = probs.black_shiny_holo ?? 0.005;
    const pShiny = probs.shiny ?? 0.05;
    const pHolo = probs.holo ?? 0.15;

    switch (variant) {
      case 'black_shiny_holo': return pBSH;
      case 'shiny': return pShiny - pBSH;
      case 'holo': return pHolo - pShiny;
      default: return 1.0 - pHolo;
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
                      {getRemainingBoosters() > 0 ? `${getRemainingBoosters()} Packs verfügbar` : `Nächste Packs in ${timeLeft}`}
                    </Badge>
                    
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
                    className="grid grid-cols-2 sm:grid-cols-3 place-items-center gap-x-6 gap-y-6 sm:gap-x-6 sm:gap-y-7 md:gap-x-8 w-full max-w-5xl px-2 sm:px-4"
                  >
                    {revealedTeachers.map((teacher, idx) => {
                      const isFlipped = flippedCards[idx]
                      const result = collectionResults?.[idx]
                      const cardData = mapToTeacherCardData(teacher, result?.variant || 'normal', config?.loot_teachers || DEFAULT_TEACHERS)
                      
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
                                delay: idx * 0.04,
                                type: 'spring',
                                damping: 18,
                                stiffness: 220
                              }
                            }
                          }}
                          className={cn(
                            "relative flex flex-col items-center w-[40vw] min-w-[140px] max-w-[200px] sm:w-full sm:min-w-0 sm:max-w-[190px] md:max-w-[210px] lg:max-w-[220px] p-0.5",
                            idx === 2 && "col-span-2 sm:col-span-1",
                            isFlipped && result?.isNew && "animate-new-card-float z-10",
                            isFlipped && result?.variant === 'black_shiny_holo' && "z-30 scale-[1.03] sm:scale-[1.05]"
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

                              <TeacherCard 
                                data={cardData}
                                styleVariant="modern-flat"
                                isFlippedExternally={isFlipped}
                                interactive={false}
                                upgradeInfo={isFlipped && result?.isLevelUp ? { oldLevel: result.oldLevel!, newLevel: result.newLevel } : undefined}
                                className="w-full h-auto"
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

              {/* Mass Results (10 Packs) */}
              <AnimatePresence mode="wait">
                {(gameState === 'ripping' || gameState === 'revealed') && isMassOpening && massRevealedTeachers && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-4xl h-[65vh] overflow-y-auto px-4 space-y-6 custom-scrollbar pr-2"
                  >
                    {massRevealedTeachers.map((packData, packIdx) => {
                      const packProbs = showDebug ? (() => {
                        const weights = packData.isGodpack 
                          ? (config?.godpack_weights || DEFAULT_GODPACK_WEIGHTS) 
                          : (config?.rarity_weights || DEFAULT_RARITY_WEIGHTS);
                        
                        const cardChances = packData.teachers.map((teacher, i) => {
                          const slotWeights = weights[i] as any;
                          const rarityChance = slotWeights[teacher.rarity] || 0;
                          const result = massCollectionResults?.[packIdx]?.[i];
                          if (!result) return 0;
                          const variantChance = getVariantProbability(result.variant, packData.isGodpack);
                          return rarityChance * variantChance;
                        });
                        return cardChances;
                      })() : null;

                      return (
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

                          <div className="flex-1 grid grid-cols-3 gap-3 sm:gap-4">
                            {packData.teachers.map((teacher, cardIdx) => {
                              const result = massCollectionResults?.[packIdx]?.[cardIdx]
                              const cardData = mapToTeacherCardData(teacher, result?.variant || 'normal', config?.loot_teachers || DEFAULT_TEACHERS)
                              
                              return (
                                <div key={cardIdx} className="relative group p-0.5">
                                  <TeacherCard 
                                    data={cardData}
                                    styleVariant="modern-flat"
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
                                  {showDebug && packProbs && (
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
                    }
                    )}
                    <div className="h-8" />
                  </motion.div>
                )}
              </AnimatePresence>

              {(gameState === 'idle' || gameState === 'ripping') && (
                <div 
                  className={cn(
                    "absolute z-30 w-64 h-[400px] cursor-pointer group transition-all duration-500",
                    getRemainingBoosters() <= 0 && "opacity-80 cursor-not-allowed",
                    gameState === 'idle' && getRemainingBoosters() > 0 && "hover:scale-105 active:scale-95"
                  )}
                  style={{ 
                    filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))',
                    perspective: '1000px'
                  }}
                  onClick={getRemainingBoosters() > 0 && gameState === 'idle' ? handleOpenPack : undefined}
                >
                  {getRemainingBoosters() <= 0 && gameState === 'idle' && (
                    <div className="absolute inset-[-20px] z-50 flex items-center justify-center p-5">
                      <div className="w-full h-full bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 flex flex-col items-center justify-center text-center p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                          <Lock className="h-8 w-8 text-white/40" />
                        </div>
                        <h3 className="text-white font-black text-xl tracking-tighter uppercase mb-1 italic">Sperre aktiv</h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Nachschub kommt in</p>
                        
                        <div className="bg-primary/20 px-4 py-2 rounded-xl border border-primary/30">
                          <p className="text-primary font-mono text-2xl font-black tracking-widest">{timeLeft}</p>
                        </div>

                        <Link href="/sammelkarten/shop" className="mt-6">
                           <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10 text-white/60 hover:text-white transition-all text-[10px] h-8 font-black uppercase tracking-widest">
                              <ShoppingBag className="w-3.5 h-3.5 mr-2" />
                              Nachschub kaufen
                           </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 flex flex-col h-full w-full">
                    <div 
                      className={cn(
                        "relative w-full h-1/3 z-20 transition-transform duration-700 ease-in-out overflow-hidden",
                        gameState === 'ripping' && "animate-rip-top"
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 border-x-4 border-t-4 border-black",
                        isGodpack ? "bg-neutral-950" : "bg-blue-600"
                      )} />
                      
                      <div className="absolute top-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-b-2 border-black/20" />
                      
                      <div className="absolute inset-0 flex items-center justify-center pt-8">
                         <div className={cn(
                           "p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                           isGodpack ? "bg-amber-400" : "bg-white"
                         )}>
                           <Zap className={cn("h-8 w-8", isGodpack ? "text-black fill-black" : "text-black fill-black")} />
                         </div>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "relative w-full h-2/3 z-10 transition-transform duration-700 ease-in-out -mt-[1px] overflow-hidden",
                        gameState === 'ripping' && "animate-rip-bottom"
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 border-x-4 border-b-4 border-black",
                        isGodpack ? "bg-neutral-900" : "bg-blue-700"
                      )} />
                      
                      <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-t-2 border-black/20" />

                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                      <div className="relative z-10 flex flex-col items-center h-full w-full px-6 pt-10">
                        <div className={cn(
                          "relative mb-4 px-4 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1",
                          isGodpack ? "bg-amber-400" : "bg-white"
                        )}>
                          <h2 className="font-black text-3xl tracking-tighter italic text-black uppercase">ABI PLANER</h2>
                          {isGodpack && (
                            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-black animate-bounce shadow-md">GOD!</div>
                          )}
                        </div>

                        <div className={cn(
                          "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-auto border-4 border-black",
                          isGodpack ? "bg-amber-500 text-black" : "bg-white text-black"
                        )}>
                          {isGodpack ? "SPECIAL EDITION" : "3 Lehrer Karten"}
                        </div>

                        <div className="w-full flex justify-between items-end pb-12">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-black/40 uppercase">S1/2026</span>
                              <div className="flex gap-1">
                                 {[...Array(4)].map((_, i) => (
                                   <div key={i} className="w-3 h-1 bg-black/20 rounded-sm" />
                                 ))}
                              </div>
                           </div>

                           <div className={cn(
                             "w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                             isGodpack ? "bg-amber-400" : "bg-white"
                           )}>
                             <Gift className="h-7 w-7 text-black fill-black" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 mt-8 w-full items-center">
              {showDebug && (
                <div className="flex gap-2 w-full max-sm:max-w-[280px] sm:max-w-sm mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex-1 bg-amber-100/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-2 text-center transition-all">
                    <p className="text-[8px] font-mono text-amber-900/50 dark:text-amber-200 uppercase tracking-widest mb-0.5">Unpack Speed</p>
                    <p className="text-sm font-black text-amber-900 dark:text-amber-500 italic uppercase tracking-tighter">
                      {((1 - speedMultiplier) * 100).toFixed(0)}% <span className="text-[10px] ml-1 opacity-60">({consecutiveOpenCount}x)</span>
                    </p>
                  </div>
                  {(gameState === 'revealed' || gameState === 'ripping') && !isMassOpening && packProbs && (
                    <div className="flex-1 bg-amber-100/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-2 text-center transition-all animate-in zoom-in duration-300">
                      <p className="text-[8px] font-mono text-amber-900/50 dark:text-amber-200 uppercase tracking-widest mb-0.5">Probability</p>
                      <p className="text-sm font-black text-amber-900 dark:text-amber-500">{(packProbs.wholePackChance * 100).toPrecision(4)}%</p>
                    </div>
                  )}
                </div>
              )}

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

              {gameState === 'revealed' && (isMassOpening || allFlipped) && (
                <div className="flex flex-col gap-3 w-full max-sm:max-w-[280px] sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <Button 
                    onClick={getRemainingBoosters() > 0 ? (isMassOpening ? handleOpenTenPacks : handleOpenPack) : () => setGameState('idle')}
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
                        <Zap className="h-4 w-4 mr-2" />
                        {isMassOpening ? 'Weitere 10 Packs' : 'Booster'} aufreißen ({getRemainingBoosters()})
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
