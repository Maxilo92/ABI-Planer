'use client'

import { useAuth } from '@/context/AuthContext'
import { Sparkles, Gift, GraduationCap, RotateCcw, Zap, Trophy, Clock } from 'lucide-react'
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
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!loading && !profile?.easter_egg_unlocked) {
      redirect('/')
    }
  }, [profile, loading])

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
      { common: 0.8, rare: 0.15, epic: 0.045, legendary: 0.005 },
      { common: 0.6, rare: 0.25, epic: 0.13, legendary: 0.02 },
      { common: 0.4, rare: 0.35, epic: 0.20, legendary: 0.05 }
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
      }, 800) // Duration of the explosive rip animation
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
      }
      case 'rare': return { 
        label: 'Selten', 
        color: 'bg-emerald-500', 
        glow: 'shadow-[0_0_25px_rgba(16,185,129,0.6)]',
      }
      case 'epic': return { 
        label: 'Episch', 
        color: 'bg-purple-600', 
        glow: 'shadow-[0_0_30px_rgba(147,51,234,0.7)]',
      }
      case 'mythic': return { 
        label: 'Mythisch', 
        color: 'bg-red-600', 
        glow: 'shadow-[0_0_35px_rgba(220,38,38,0.8)]',
      }
      case 'legendary': return { 
        label: 'Legendär', 
        color: 'bg-amber-500', 
        glow: 'shadow-[0_0_40px_rgba(245,158,11,1)]',
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
            <div className="relative w-full min-h-[400px] flex items-center justify-center">
              {gameState === 'idle' || gameState === 'ripping' ? (
                <div 
                  className={cn(
                    "relative w-64 h-96 cursor-pointer group transition-all duration-500",
                    getRemainingBoosters() <= 0 && "opacity-50 cursor-not-allowed",
                    gameState === 'idle' && getRemainingBoosters() > 0 && "hover:scale-105 active:scale-95"
                  )}
                  onClick={getRemainingBoosters() > 0 && gameState === 'idle' ? handleOpenPack : undefined}
                >
                  {/* Premium Booster Design */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950 rounded-3xl border-4 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_0%,transparent_100%)]" />
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
                  </div>

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

                  {/* Ripping serrated edge effect */}
                  <div className="absolute top-1/3 left-0 w-full h-4 z-15 flex overflow-hidden opacity-40">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-8 h-8 bg-blue-800 transform rotate-45 translate-y-2 border-t-2 border-l-2 border-white/20" />
                    ))}
                  </div>

                  {getRemainingBoosters() <= 0 && gameState === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 rounded-3xl backdrop-blur-sm">
                       <RotateCcw className="h-10 w-10 text-white mb-3 animate-spin-slow" />
                       <p className="text-white font-black text-xs uppercase tracking-[0.2em]">{timeLeft}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-5xl animate-in fade-in zoom-in duration-700">
                  {revealedTeachers?.map((teacher, idx) => {
                    const isFlipped = flippedCards[idx]
                    const result = collectionResults?.[idx]
                    const cardInfo = info(teacher.rarity)
                    
                    return (
                      <div 
                        key={`${teacher.id}-${idx}`}
                        className="perspective-1000 w-40 h-56 sm:w-48 sm:h-64 cursor-pointer"
                        onClick={() => !isFlipped && handleFlipCard(idx)}
                      >
                        <div className={cn(
                          "relative w-full h-full transition-all duration-700 preserve-3d will-change-transform",
                          isFlipped && "rotate-y-180"
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
                              "absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border-4 border-white flex flex-col items-center p-3 sm:p-4 transition-all duration-500 shadow-xl overflow-hidden",
                              cardInfo?.color,
                              isFlipped && cardInfo?.glow
                            )}
                            style={{ transform: 'rotateY(180deg) translateZ(1px)' }}
                          >
                             {/* Solid background to prevent bleed through */}
                             <div className={cn("absolute inset-0 z-0", cardInfo?.color)} />

                             {/* Rarity Effects */}
                             {isFlipped && (teacher.rarity === 'legendary' || teacher.rarity === 'mythic') && (
                               <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10">
                                 <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
                               </div>
                             )}

                            {isFlipped && result && (
                              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
                                {result.isNew ? (
                                  <Badge className="bg-amber-500 border-2 border-white text-[10px] font-black px-2 shadow-lg animate-in zoom-in duration-500">NEW</Badge>
                                ) : result.isLevelUp ? (
                                  <Badge className="bg-purple-500 border-2 border-white text-[10px] font-black px-2 shadow-lg animate-in zoom-in duration-500">LEVEL UP</Badge>
                                ) : (
                                  <Badge className="bg-emerald-500 border-2 border-white text-[10px] font-black px-2 shadow-lg animate-in zoom-in duration-500">LVL {result.newLevel}</Badge>
                                )}
                              </div>
                            )}

                            <div className="w-full aspect-square rounded-xl bg-white/10 flex items-center justify-center mb-3 mt-5 sm:mt-7 shadow-inner border border-white/5 relative z-20">
                               <GraduationCap className="h-14 w-14 sm:h-20 sm:w-20 text-white drop-shadow-2xl relative z-10" />
                            </div>

                            <div className="mt-auto w-full bg-black/40 rounded-xl p-2 sm:p-3 border border-white/10 relative z-20 min-h-[3.5rem] sm:min-h-[4.5rem] flex flex-col justify-center">
                              <div className="text-[8px] font-black uppercase text-white/50 tracking-widest mb-0.5">
                                {cardInfo?.label}
                              </div>
                              <div className="text-white font-bold text-xs sm:text-sm leading-tight line-clamp-2">
                                {teacher.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
