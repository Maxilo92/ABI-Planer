'use client'

import { useAuth } from '@/context/AuthContext'
import { Sparkles, Gift, GraduationCap, RotateCcw, Zap, Trophy } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { redirect, useSearchParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { TeacherRarity, LootTeacher } from '@/types/database'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { logAction } from '@/lib/logging'

const RARITY_ORDER: TeacherRarity[] = ['common', 'rare', 'epic', 'mythic', 'legendary']

function SammelkartenContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'sammelkarten'
  const { user, profile, loading } = useAuth()
  const { collectTeacher, teachers: userTeachers } = useUserTeachers()
  const [globalSettings, setGlobalSettings] = useState<any>(null)
  const [currentRarityIndex, setCurrentRarityIndex] = useState(0)
  const [clicksCount, setClicksCount] = useState(0) // 0 to 5
  const [gameState, setGameState] = useState<'idle' | 'interacting' | 'revealed'>('idle')
  const [revealedTeacher, setRevealedTeacher] = useState<LootTeacher | null>(null)
  const [collectionResult, setCollectionResult] = useState<{ isNew: boolean, newLevel: number, count: number } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!loading && !profile?.easter_egg_unlocked) {
      redirect('/')
    }
  }, [profile, loading])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.data())
      }
    })
    return () => unsubscribe()
  }, [])

  if (loading) return null

  const handleStart = () => {
    setGameState('interacting')
    setCurrentRarityIndex(0)
    setClicksCount(0)
    setRevealedTeacher(null)
    setCollectionResult(null)
  }

  const triggerShake = () => {
    setShake(true)
    const duration = currentRarityIndex === 4 ? 200 : currentRarityIndex === 3 ? 250 : 300
    setTimeout(() => setShake(false), duration)
  }

  const handleBoxClick = () => {
    if (gameState !== 'interacting' || isAnimating) return

    const nextClick = clicksCount + 1
    setClicksCount(nextClick)
    triggerShake()

    if (nextClick <= 4) {
      setIsAnimating(true)
      const rand = Math.random()
      let upgradeSteps = 0
      
      // Upgrade probabilities
      if (rand < 0.12) upgradeSteps = 2
      else if (rand < 0.38) upgradeSteps = 1

      if (upgradeSteps > 0) {
        // Upgrade animation is slightly longer to emphasize the rarity change
        setCurrentRarityIndex(prev => Math.min(prev + upgradeSteps, RARITY_ORDER.length - 1))
        setTimeout(() => setIsAnimating(false), 500)
      } else {
        setTimeout(() => setIsAnimating(false), 300)
      }
    } else if (nextClick === 5) {
      revealLoot()
    }
  }

  const revealLoot = async () => {
    setIsAnimating(true)
    // Extra long shake for the reveal
    setShake(true)
    
    setTimeout(async () => {
      setShake(false)
      setGameState('revealed')
      setIsAnimating(false)
      const finalRarity = RARITY_ORDER[currentRarityIndex]
      const teachers = globalSettings?.loot_teachers || []
      const matchingTeachers = teachers.filter((t: any) => t.rarity === finalRarity)
      
      let teacher: LootTeacher
      if (matchingTeachers.length > 0) {
        teacher = matchingTeachers[Math.floor(Math.random() * matchingTeachers.length)]
      } else {
        teacher = { id: 'unknown', name: "Ein unbekannter Lehrer", rarity: finalRarity }
      }
      setRevealedTeacher(teacher)

      // Persist to collection
      if (teacher.id !== 'unknown') {
        const isNew = !userTeachers?.[teacher.id]
        const result = await collectTeacher(teacher.id)
        setCollectionResult({
          isNew,
          newLevel: result.level,
          count: result.count
        })

        if (user) {
          logAction('LOOT_TEACHER', user.uid, profile?.full_name, { 
            id: teacher.id, 
            count: result.count, 
            level: result.level 
          })
        }
      }
    }, 800)
  }

  const info = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return { 
        label: 'Gewöhnlich', 
        color: 'bg-slate-500', 
        glow: 'shadow-slate-500/20',
        shake: 'animate-sammelkarten-shake-1'
      }
      case 'rare': return { 
        label: 'Selten', 
        color: 'bg-emerald-500', 
        glow: 'shadow-emerald-500/40',
        shake: 'animate-sammelkarten-shake-2'
      }
      case 'epic': return { 
        label: 'Episch', 
        color: 'bg-purple-500', 
        glow: 'shadow-purple-500/60',
        shake: 'animate-sammelkarten-shake-3'
      }
      case 'mythic': return { 
        label: 'Mythisch', 
        color: 'bg-red-500', 
        glow: 'shadow-red-500/80',
        shake: 'animate-sammelkarten-shake-4'
      }
      case 'legendary': return { 
        label: 'Legendär', 
        color: 'bg-amber-500', 
        glow: 'shadow-amber-500/100',
        shake: 'animate-sammelkarten-shake-5'
      }
    }
  }

  const currentInfo = info(RARITY_ORDER[currentRarityIndex])

  return (
    <div className="container mx-auto py-8">
      {view === 'sammelkarten' ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] overflow-hidden">
          <div className="relative flex flex-col items-center space-y-12 w-full max-w-sm px-6">
            
            {/* Lightweight reveal glow */}
            {gameState === 'revealed' && (
              <div className={cn(
                "absolute inset-0 -z-10 w-[140%] h-[140%] blur-3xl opacity-25",
                currentInfo.color
              )} />
            )}

            {/* Minimal Header */}
            <div className={cn(
              "text-center space-y-2 transition-all duration-700",
              gameState === 'revealed' ? "opacity-100 scale-110" : "opacity-40"
            )}>
              <h1 className="text-3xl font-black tracking-tighter font-mono flex items-center gap-3">
                <Sparkles className={cn("h-7 w-7", gameState === 'revealed' ? "text-white animate-pulse" : "text-primary")} />
                SAMMELKARTEN
              </h1>
            </div>

            {/* The Box Container */}
            <div className="relative w-72 h-72 flex items-center justify-center">
              {gameState === 'idle' ? (
                <div 
                  className="group relative w-64 h-64 rounded-[2.5rem] border-4 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all duration-500 hover:border-primary/40 hover:bg-primary/10"
                  onClick={handleStart}
                >
                  <Gift className="h-24 w-24 text-primary/40 group-hover:text-primary transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 group-hover:text-primary transition-colors">Starten</p>
                </div>
              ) : (
                <div 
                  className={cn(
                    "relative w-64 h-64 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 border-[8px] shadow-xl will-change-transform",
                    currentInfo.color,
                    "border-white/40",
                    currentInfo.glow,
                    shake && currentInfo.shake,
                    !shake && gameState === 'interacting' && "animate-float",
                    gameState === 'interacting' && "cursor-pointer active:scale-90",
                    gameState === 'revealed' && "scale-[1.12] border-white shadow-[0_0_36px_rgba(255,255,255,0.28)] animate-reveal-pop"
                  )}
                  onClick={handleBoxClick}
                >
                  {gameState === 'interacting' ? (
                    <>
                      <Gift className={cn(
                        "h-32 w-32 text-white transition-all duration-300",
                        isAnimating ? "scale-125 rotate-6" : "scale-100"
                      )} />
                      
                      {/* Progress Indicators (Only 4 for upgrades) */}
                      <div className="absolute -bottom-14 flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                          <div 
                            key={i} 
                            className={cn(
                              "h-2 w-10 rounded-full transition-all duration-500",
                              i <= clicksCount 
                                ? (i === clicksCount && isAnimating ? "bg-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.8)]" : "bg-primary") 
                                : "bg-secondary/40"
                            )} 
                          />
                        ))}
                      </div>

                      <div className="absolute top-4 font-black text-white/40 text-[9px] tracking-[0.4em] uppercase">
                        {clicksCount < 4 ? "Upgrade Phase" : "Bereit zum Öffnen"}
                      </div>
                      
                      <div className={cn(
                        "mt-3 text-white font-black text-2xl tracking-tighter uppercase drop-shadow-lg transition-all duration-300",
                        isAnimating && "scale-110 blur-[1px]"
                      )}>
                        {currentInfo.label}
                      </div>

                      {isAnimating && (
                        <div className="absolute -top-2 right-4 rounded-full bg-white/30 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      {collectionResult && (
                        <div className="absolute -top-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          {collectionResult.isNew ? (
                            <div className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest border-2 border-white">
                              <Sparkles className="h-3 w-3" />
                              NEU ENTDECKT!
                            </div>
                          ) : (
                            <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest border-2 border-white">
                              <RotateCcw className="h-3 w-3" />
                              DUPLIKAT! (Lvl {collectionResult.newLevel})
                            </div>
                          )}
                        </div>
                      )}

                      <div className="relative mb-4">
                        <GraduationCap className="h-28 w-28 text-white drop-shadow-[0_12px_12px_rgba(0,0,0,0.35)] animate-float" />
                        <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-white animate-pulse" />
                      </div>
                      
                      <div className="bg-black/90 backdrop-blur-2xl rounded-[2rem] p-5 border-2 border-white/30 text-center max-w-[120%] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                        <div className={cn(
                          "text-[9px] font-black uppercase mb-1.5 tracking-[0.3em] transition-colors",
                          currentRarityIndex >= 3 ? "text-amber-400" : "text-white/60"
                        )}>
                          {currentInfo.label}
                        </div>
                        <div className="text-white font-black text-xl tracking-tight whitespace-nowrap px-2">
                          {revealedTeacher?.name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reset Action */}
            <div className="h-12 mt-4">
              {gameState === 'revealed' && (
                <Button 
                  onClick={handleStart}
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 border-2 hover:bg-white hover:text-black transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 shadow-xl"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nochmal versuchen
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          <TeacherAlbum excludeIds={revealedTeacher ? [revealedTeacher.id] : []} />
        </div>
      )}
    </div>
  )
}

export default function SammelkartenPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Lade...</div>}>
      <SammelkartenContent />
    </Suspense>
  )
}
