'use client'

import { useAuth } from '@/context/AuthContext'
import { Sparkles, Gift, GraduationCap, RotateCcw, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { TeacherRarity, LootTeacher } from '@/types/database'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const RARITY_ORDER: TeacherRarity[] = ['common', 'rare', 'epic', 'mythic', 'legendary']

export default function SecretPage() {
  const { profile, loading } = useAuth()
  const [globalSettings, setGlobalSettings] = useState<any>(null)
  const [currentRarityIndex, setCurrentRarityIndex] = useState(0)
  const [clicksCount, setClicksCount] = useState(0) // 0 to 5
  const [gameState, setGameState] = useState<'idle' | 'interacting' | 'revealed'>('idle')
  const [revealedTeacher, setRevealedTeacher] = useState<LootTeacher | null>(null)
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
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 300)
  }

  const handleBoxClick = () => {
    if (gameState !== 'interacting' || isAnimating) return

    const nextClick = clicksCount + 1
    setClicksCount(nextClick)
    triggerShake()

    if (nextClick <= 4) {
      // Upgrade Phase
      setIsAnimating(true)
      const rand = Math.random()
      let upgradeSteps = 0
      
      if (rand < 0.10) upgradeSteps = 2
      else if (rand < 0.33) upgradeSteps = 1

      if (upgradeSteps > 0) {
        setCurrentRarityIndex(prev => Math.min(prev + upgradeSteps, RARITY_ORDER.length - 1))
      }

      setTimeout(() => setIsAnimating(false), 400)
    } else if (nextClick === 5) {
      // Reveal Phase
      revealLoot()
    }
  }

  const revealLoot = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setGameState('revealed')
      setIsAnimating(false)
      const finalRarity = RARITY_ORDER[currentRarityIndex]
      const teachers = globalSettings?.loot_teachers || []
      const matchingTeachers = teachers.filter((t: any) => t.rarity === finalRarity)
      
      if (matchingTeachers.length > 0) {
        setRevealedTeacher(matchingTeachers[Math.floor(Math.random() * matchingTeachers.length)])
      } else {
        setRevealedTeacher({ name: "Ein unbekannter Lehrer", rarity: finalRarity })
      }
    }, 600)
  }

  const currentRarity = RARITY_ORDER[currentRarityIndex]
  
  const getRarityInfo = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return { label: 'Gewöhnlich', color: 'bg-slate-500', glow: 'shadow-slate-500/20' }
      case 'rare': return { label: 'Selten', color: 'bg-emerald-500', glow: 'shadow-emerald-500/40' }
      case 'epic': return { label: 'Episch', color: 'bg-purple-500', glow: 'shadow-purple-500/60' }
      case 'mythic': return { label: 'Mythisch', color: 'bg-red-500', glow: 'shadow-red-500/80' }
      case 'legendary': return { label: 'Legendär', color: 'bg-amber-500', glow: 'shadow-amber-500/100' }
    }
  }

  const info = getRarityInfo(currentRarity)

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center space-y-12 w-full max-w-sm px-6">
        
        {/* Header (Minimal) */}
        <div className={cn(
          "text-center space-y-2 transition-opacity duration-500",
          gameState === 'revealed' ? "opacity-100" : "opacity-40"
        )}>
          <h1 className="text-4xl font-black tracking-tighter font-mono flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            LOOTBOX
          </h1>
        </div>

        {/* The Box Container */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          {gameState === 'idle' ? (
            <div 
              className="group relative w-64 h-64 rounded-3xl border-4 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all duration-300"
              onClick={handleStart}
            >
              <Gift className="h-24 w-24 text-primary/40 group-hover:text-primary transition-colors" />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-primary/60">Klicken zum Starten</p>
            </div>
          ) : (
            <div 
              className={cn(
                "relative w-64 h-64 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 border-[6px] shadow-2xl",
                info.color,
                "border-white/30",
                info.glow,
                shake && "animate-bounce",
                isAnimating && "scale-110 rotate-3",
                gameState === 'interacting' && "cursor-pointer active:scale-90",
                gameState === 'revealed' && "scale-125 border-white shadow-[0_0_100px_rgba(255,255,255,0.4)]"
              )}
              onClick={handleBoxClick}
            >
              {gameState === 'interacting' ? (
                <>
                  <Gift className={cn(
                    "h-32 w-32 text-white transition-transform duration-300",
                    isAnimating ? "scale-125" : "scale-100"
                  )} />
                  
                  {/* Progress Indicator */}
                  <div className="absolute -bottom-12 flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-2 w-8 rounded-full transition-all duration-300",
                          i <= clicksCount ? "bg-primary" : "bg-secondary"
                        )} 
                      />
                    ))}
                  </div>

                  <div className="absolute top-4 font-black text-white/40 text-[10px] tracking-[0.3em] uppercase">
                    {clicksCount < 4 ? "Upgrade Phase" : "Bereit zum Öffnen"}
                  </div>
                  
                  <div className="mt-2 text-white font-black text-2xl tracking-tight uppercase drop-shadow-md">
                    {info.label}
                  </div>

                  {isAnimating && (
                    <Zap className="absolute inset-0 m-auto h-full w-full text-white/40 animate-ping" />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in spin-in-12 duration-700">
                  <GraduationCap className="h-32 w-32 text-white mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
                  <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-5 border-2 border-white/20 text-center max-w-[120%] shadow-2xl">
                    <div className="text-[10px] font-black uppercase text-white/50 mb-1 tracking-[0.2em]">
                      {info.label} LEHRER
                    </div>
                    <div className="text-white font-black text-2xl tracking-tight whitespace-nowrap">
                      {revealedTeacher?.name}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-12 w-full flex justify-center">
          {gameState === 'revealed' && (
            <Button 
              onClick={handleStart}
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000"
            >
              <RotateCcw className="h-4 w-4" />
              Nochmal versuchen
            </Button>
          )}
        </div>

        {/* Background Visuals */}
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[120px]" />
        </div>
      </div>
    </div>
  )
}
