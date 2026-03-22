'use client'

import { useAuth } from '@/context/AuthContext'
import { Sparkles, Gift, GraduationCap, RotateCcw, Zap, Trophy, Clock, Star, Lock } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { redirect, useSearchParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { TeacherRarity, LootTeacher } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { logAction } from '@/lib/logging'
import { toast } from 'sonner'

const DEFAULT_TEACHERS: LootTeacher[] = [
  { id: 'max-mustermann', name: "Max Mustermann", rarity: "common" },
  { id: 'erika-musterfrau', name: "Erika Musterfrau", rarity: "rare" },
  { id: 'marie-curie', name: "Marie Curie", rarity: "mythic" },
  { id: 'albert-einstein', name: "Albert Einstein", rarity: "legendary" }
]

function SammelkartenContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'sammelkarten'
  const { user, profile, loading } = useAuth()
  const { collectBooster, teachers: userTeachers, getRemainingBoosters } = useUserTeachers()
  const [globalSettings, setGlobalSettings] = useState<any>(null)
  const [gameState, setGameState] = useState<'idle' | 'ripping' | 'revealed'>('idle')
  const [revealedTeachers, setRevealedTeachers] = useState<LootTeacher[] | null>(null)
  const [collectionResults, setCollectionResults] = useState<Array<{ isNew: boolean, isLevelUp: boolean, newLevel: number, count: number } | null> | null>(null)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false])
  const [isAnimating, setIsAnimating] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      
      // Calculate next 9:00 AM in Europe/Berlin
      const berlinNowStr = now.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
      const berlinNow = new Date(berlinNowStr)
      
      const target = new Date(berlinNowStr)
      target.setHours(9, 0, 0, 0)
      
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
  }, [])



  useEffect(() => {
    if (!loading && !user) {
      redirect('/login?reason=unauthorized')
    }
  }, [user, loading])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.data())
      } else {
        setGlobalSettings({ loot_teachers: DEFAULT_TEACHERS })
      }
    })
    return () => unsubscribe()
  }, [])

  if (loading) return null

  const generatePack = (): LootTeacher[] => {
    const teachers = Array.isArray(globalSettings?.loot_teachers) && globalSettings.loot_teachers.length > 0
      ? globalSettings.loot_teachers
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

    const slotWeights = [
      { common: 0.8, rare: 0.15, epic: 0.035, mythic: 0.01, legendary: 0.005 },
      { common: 0.6, rare: 0.25, epic: 0.10, mythic: 0.03, legendary: 0.02 },
      { common: 0.4, rare: 0.35, epic: 0.15, mythic: 0.05, legendary: 0.05 }
    ]

    return slotWeights.map(weights => {
      const targetRarity = getWeightedRarity(weights)
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

    const pack = generatePack()
    setRevealedTeachers(pack)

    // Trigger explosive fly-apart immediately
    try {
      const teacherIds = pack.map(t => t.id || t.name)
      const initialTeachers = { ...userTeachers }
      const results = await collectBooster(teacherIds)
      
      const processedResults = results.map(r => {
        const isNew = !initialTeachers[r.teacherId]
        const oldLevel = initialTeachers[r.teacherId]?.level || 1
        const isLevelUp = !isNew && r.level > oldLevel
        
        initialTeachers[r.teacherId] = { count: r.count, level: r.level }
        return {
          isNew,
          isLevelUp,
          newLevel: r.level,
          count: r.count
        }
      })

      setCollectionResults(processedResults)

      if (user) {
        logAction('LOOT_BOOSTER', user.uid, profile?.full_name, { 
          teachers: pack.map(t => t.id || t.name),
          results: processedResults
        })
      }

      // Final transition to revealed
      setTimeout(() => {
        setGameState('revealed')
        setIsAnimating(false)
      }, 400) // Faster transition
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

  const info = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return { 
        label: 'Gewöhnlich', 
        color: 'bg-slate-500', 
        glow: 'shadow-[0_0_20px_rgba(100,116,139,0.4)]',
        highlight: 'rgba(100, 116, 139, 0.4)',
        border: 'rgba(100, 116, 139, 0.5)'
      }
      case 'rare': return { 
        label: 'Selten', 
        color: 'bg-emerald-500', 
        glow: 'shadow-[0_0_25px_rgba(16,185,129,0.6)]',
        highlight: 'rgba(16, 185, 129, 0.4)',
        border: 'rgba(16, 185, 129, 0.5)'
      }
      case 'epic': return { 
        label: 'Episch', 
        color: 'bg-purple-600', 
        glow: 'shadow-[0_0_30px_rgba(147,51,234,0.7)]',
        highlight: 'rgba(147, 51, 234, 0.4)',
        border: 'rgba(147, 51, 234, 0.5)'
      }
      case 'mythic': return { 
        label: 'Mythisch', 
        color: 'bg-red-600', 
        glow: 'shadow-[0_0_35px_rgba(220,38,38,0.8)]',
        highlight: 'rgba(220, 38, 38, 0.4)',
        border: 'rgba(220, 38, 38, 0.5)'
      }
      case 'legendary': return { 
        label: 'Legendär', 
        color: 'bg-amber-500', 
        glow: 'shadow-[0_0_40px_rgba(245,158,11,1)]',
        highlight: 'rgba(245, 158, 11, 0.4)',
        border: 'rgba(245, 158, 11, 0.5)'
      }
    }
  }

  return (
    <div className="container mx-auto py-8">
      {view === 'sammelkarten' ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] overflow-hidden">
          <div className="relative flex flex-col items-center space-y-12 w-full max-w-4xl px-6">
            
            {/* Minimal Header */}
            <div className={cn(
              "text-center space-y-2 transition-all duration-700",
              gameState === 'revealed' ? "opacity-100 scale-105" : "opacity-40"
            )}>
              <h1 className="text-3xl font-black tracking-tighter font-mono flex items-center gap-3 justify-center">
                <Sparkles className={cn("h-7 w-7", gameState === 'revealed' ? "text-primary animate-pulse" : "text-muted-foreground")} />
                SAMMELKARTEN
              </h1>
              {gameState === 'idle' && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant={getRemainingBoosters() > 0 ? "secondary" : "destructive"} className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-white/10">
                    <Zap className="h-3 w-3 mr-1.5 fill-current" />
                    {getRemainingBoosters() > 0 ? `${getRemainingBoosters()} / 2 Booster übrig` : `Nächster Booster in ${timeLeft}`}
                  </Badge>
                </div>
              )}
            </div>

            {/* The Pack/Card Container */}
            <div className="relative w-full min-h-[400px] flex items-center justify-center overflow-visible">
              
              {/* Revealed Cards (Rendered behind the pack during ripping) */}
              {(gameState === 'ripping' || gameState === 'revealed') && revealedTeachers && (
                <div className={cn(
                  "flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-5xl transition-all duration-700",
                  gameState === 'ripping' ? "opacity-100 scale-75" : "opacity-100 scale-100"
                )}>
                  {revealedTeachers.map((teacher, idx) => {
                    const isFlipped = flippedCards[idx]
                    const result = collectionResults?.[idx]
                    const cardInfo = info(teacher.rarity)
                    
                    return (
                      <div 
                        key={`${teacher.id}-${idx}`}
                        className={cn(
                          "perspective-1000 w-40 h-56 sm:w-48 sm:h-64 cursor-pointer relative transition-all duration-700 ease-out",
                          isFlipped && result?.isNew && "animate-new-card-float z-10"
                        )}
                        style={{ 
                          transform: gameState === 'ripping' 
                            ? `translate(${idx === 0 ? '120px' : idx === 2 ? '-120px' : '0'}, 0) rotate(${idx === 0 ? '-5deg' : idx === 2 ? '5deg' : '0'})` 
                            : 'translate(0, 0) rotate(0deg)',
                          zIndex: gameState === 'ripping' ? 10 : 20
                        }}
                        onClick={() => !isFlipped && handleFlipCard(idx)}
                      >
                        <div className={cn(
                          "relative w-full h-full transition-all duration-700 preserve-3d will-change-transform",
                          isFlipped && !result?.isLevelUp && "rotate-y-180",
                          isFlipped && result?.isLevelUp && "animate-level-up-spin"
                        )}>
                          {/* Minimalist Back of Card */}
                          <div 
                            className="absolute inset-0 backface-hidden rounded-2xl bg-slate-900 border-[6px] border-white/10 flex flex-col items-center justify-center shadow-xl overflow-hidden"
                            style={{ transform: 'translateZ(1px)' }}
                          >
                             <div className="relative z-10 flex flex-col items-center">
                               <div className="p-3 rounded-full bg-white/5 mb-3">
                                 <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-white/20" />
                               </div>
                               <div className="text-white/20 font-black text-base sm:text-lg tracking-tighter italic text-center px-2">ABI PLANER</div>
                               {!isFlipped && (
                                 <div className="mt-4 animate-pulse text-[8px] text-white/30 font-bold uppercase tracking-[0.2em]">Tippen zum Umdrehen</div>
                               )}
                             </div>
                          </div>

                          {/* Front of Card */}
                          <div 
                            className={cn(
                              "absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border-4 border-white flex flex-col items-center p-2 transition-all duration-500 shadow-xl overflow-hidden",
                              cardInfo?.color,
                              isFlipped && cardInfo?.glow
                            )}
                            style={{ transform: 'rotateY(180deg) translateZ(1px)' }}
                          >
                             {/* Solid background to prevent bleed through */}
                             <div className={cn("absolute inset-0 z-0 rounded-[inherit]", cardInfo?.color)} />

                             {/* Special "NEW" card highlight */}
                             {isFlipped && result?.isNew && (
                               <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-[inherit]">
                                 <div 
                                   className="absolute inset-[-50%] animate-pulse" 
                                   style={{ background: `radial-gradient(circle, ${cardInfo?.highlight} 0%, transparent 70%)` }}
                                 />
                                 <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer opacity-50" />
                                 <div 
                                   className="absolute inset-0 border-4 rounded-[inherit] animate-pulse" 
                                   style={{ borderColor: cardInfo?.border }}
                                 />
                               </div>
                             )}

                             {/* Rarity Effects */}
                             {isFlipped && (teacher.rarity === 'legendary' || teacher.rarity === 'mythic') && (
                               <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-10">
                                 <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
                               </div>
                             )}

                            {/* Top Layout: Badges & Label */}
                            <div className="w-full flex flex-col items-center gap-1 z-30 pt-1">
                              {isFlipped && result && (
                                <div className="flex justify-center">
                                  {result.isNew ? (
                                    <Badge className="bg-amber-500 border-2 border-white text-[9px] font-black px-1.5 shadow-lg animate-in zoom-in duration-500">NEW</Badge>
                                  ) : result.isLevelUp ? (
                                    <Badge className="bg-purple-500 border-2 border-white text-[9px] font-black px-1.5 shadow-lg animate-in zoom-in duration-500">LEVEL UP</Badge>
                                  ) : (
                                    <Badge className="bg-emerald-500 border-2 border-white text-[9px] font-black px-1.5 shadow-lg animate-in zoom-in duration-500">LVL {result.newLevel}</Badge>
                                  )}
                                </div>
                              )}
                              <div className="text-[7px] sm:text-[8px] font-black uppercase text-white/60 tracking-[0.2em] text-center drop-shadow-sm">
                                {cardInfo?.label}
                              </div>
                            </div>

                            {/* Middle (Icon): Flexible container */}
                            <div className="flex-1 w-full min-h-0 flex items-center justify-center p-2 relative z-20">
                              <div className="w-full h-full aspect-square max-h-[120px] rounded-xl bg-white/10 flex items-center justify-center shadow-inner border border-white/5">
                                 <GraduationCap className="h-1/2 w-1/2 text-white drop-shadow-2xl opacity-90 relative z-10" />
                              </div>
                            </div>

                            {/* Bottom Layout: Fixed name container growing upwards */}
                            <div className="w-full mt-auto z-20">
                              <div className="w-full bg-black/40 rounded-xl p-2 border border-white/10 flex flex-col-reverse">
                                <div className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight text-center break-words hyphens-auto [text-wrap:balance]">
                                  {teacher.name}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Booster Pack (Rendered on top during idle/ripping) */}
              {(gameState === 'idle' || gameState === 'ripping') && (
                <div 
                  className={cn(
                    "absolute z-50 w-64 h-96 cursor-pointer group transition-all duration-500",
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
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-800 rounded-t-3xl border-x-4 border-t-4 border-white/20 shadow-inner" />
                    <Zap className="h-12 w-12 text-white/60 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] relative z-10" />
                  </div>
                  
                  {/* Bottom Part */}
                  <div className={cn(
                    "absolute bottom-0 left-0 w-full h-2/3 z-10 flex flex-col items-center pt-8 transition-transform duration-500",
                    gameState === 'ripping' && "animate-rip-bottom"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-blue-900 to-blue-800 rounded-b-3xl border-x-4 border-b-4 border-white/20 shadow-2xl" />
                    <div className="relative z-10 flex flex-col items-center h-full w-full">
                      <div className="w-16 h-1 bg-white/20 rounded-full mb-8" />
                      <h2 className="text-white font-black text-3xl tracking-tighter mb-1 italic drop-shadow-md">ABI PLANER</h2>
                      <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.4em]">Booster Pack</p>
                      
                      <div className="mt-auto mb-12">
                         <div className="relative">
                            <Gift className={cn(
                              "h-16 w-16 transition-all duration-500",
                              gameState === 'idle' ? "text-white/30 group-hover:text-white/60 group-hover:scale-110" : "text-white/50 scale-110"
                            )} />
                            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 animate-pulse" />
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
                <div className="flex flex-col gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
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
                        Nochmal versuchen
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