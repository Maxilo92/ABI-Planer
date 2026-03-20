'use client'

import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Sparkles, Gift, GraduationCap, RotateCcw, Zap, Trophy, MousePointer2 } from 'lucide-react'
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
  const [clicksLeft, setClicksLeft] = useState(4)
  const [gameState, setGameState] = useState<'idle' | 'upgrading' | 'revealed'>('idle')
  const [revealedTeacher, setRevealedTeacher] = useState<LootTeacher | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

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
    setGameState('upgrading')
    setCurrentRarityIndex(0)
    setClicksLeft(4)
    setRevealedTeacher(null)
  }

  const handleUpgradeClick = () => {
    if (clicksLeft <= 0 || gameState !== 'upgrading' || isAnimating) return

    setIsAnimating(true)
    setClicksLeft(prev => prev - 1)

    const rand = Math.random()
    let upgradeSteps = 0
    
    if (rand < 0.10) {
      upgradeSteps = 2
    } else if (rand < 0.33) {
      upgradeSteps = 1
    }

    if (upgradeSteps > 0) {
      setCurrentRarityIndex(prev => Math.min(prev + upgradeSteps, RARITY_ORDER.length - 1))
    }

    setTimeout(() => {
      setIsAnimating(false)
      if (clicksLeft === 1) {
        revealLoot()
      }
    }, 400)
  }

  const revealLoot = () => {
    setGameState('revealed')
    const finalRarity = RARITY_ORDER[currentRarityIndex]
    const teachers = globalSettings?.loot_teachers || []
    const matchingTeachers = teachers.filter((t: any) => t.rarity === finalRarity)
    
    if (matchingTeachers.length > 0) {
      setRevealedTeacher(matchingTeachers[Math.floor(Math.random() * matchingTeachers.length)])
    } else {
      // Fallback if no teacher for this rarity exists
      setRevealedTeacher({ name: "Ein unbekannter Lehrer", rarity: finalRarity })
    }
  }

  const currentRarity = RARITY_ORDER[currentRarityIndex]
  
  const getRarityInfo = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return { label: 'Gewöhnlich', color: 'bg-slate-500', text: 'text-slate-500', glow: 'shadow-slate-500/20' }
      case 'rare': return { label: 'Selten', color: 'bg-emerald-500', text: 'text-emerald-500', glow: 'shadow-emerald-500/40' }
      case 'epic': return { label: 'Episch', color: 'bg-purple-500', text: 'text-purple-500', glow: 'shadow-purple-500/60' }
      case 'mythic': return { label: 'Mythisch', color: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/80' }
      case 'legendary': return { label: 'Legendär', color: 'bg-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/100' }
    }
  }

  const info = getRarityInfo(currentRarity)

  return (
    <div className="container max-w-2xl py-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight font-mono">
          LEHRER LOOTBOX
        </h1>
        <p className="text-muted-foreground text-sm max-w-[400px]">
          Upgrade deine Box durch Klicks und ziehe einen legendären Lehrer!
        </p>
      </div>

      <div className="flex justify-center">
        {gameState === 'idle' ? (
          <Card 
            className="w-64 h-80 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform border-dashed border-2 bg-secondary/10"
            onClick={handleStart}
          >
            <Gift className="h-20 w-20 text-muted-foreground mb-4" />
            <span className="font-bold text-muted-foreground">Klicke zum Starten</span>
          </Card>
        ) : (
          <div className="space-y-6 w-full flex flex-col items-center">
            {/* The Box */}
            <div 
              className={cn(
                "relative w-64 h-64 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-4 shadow-2xl",
                info.color,
                "border-white/20",
                info.glow,
                isAnimating && "scale-110",
                gameState === 'upgrading' && "cursor-pointer active:scale-95"
              )}
              onClick={handleUpgradeClick}
            >
              {gameState === 'upgrading' ? (
                <>
                  <Gift className="h-32 w-32 text-white animate-bounce" />
                  <div className="absolute top-4 right-4 bg-black/40 text-white rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm">
                    {clicksLeft} Klicks
                  </div>
                  <div className="mt-4 text-white font-black text-xl tracking-widest uppercase">
                    {info.label}
                  </div>
                  {isAnimating && (
                    <Zap className="absolute inset-0 m-auto h-full w-full text-white/30 animate-ping" />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in duration-500">
                  <GraduationCap className="h-32 w-32 text-white mb-4" />
                  <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center max-w-[90%]">
                    <div className="text-[10px] font-black uppercase text-white/60 mb-1 tracking-widest">
                      {info.label} gezogen!
                    </div>
                    <div className="text-white font-bold text-xl truncate">
                      {revealedTeacher?.name}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls & Stats */}
            <div className="w-full space-y-4">
              {gameState === 'upgrading' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <MousePointer2 className="h-4 w-4" />
                    Klicke auf die Box zum Upgraden!
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", info.color)}
                      style={{ width: `${(currentRarityIndex / (RARITY_ORDER.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {gameState === 'revealed' && (
                <Button 
                  onClick={handleStart}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Nochmal versuchen
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-secondary/20">
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Upgrade-Chancen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs space-y-2">
            <div className="flex justify-between">
              <span>Nächste Stufe (+1)</span>
              <span className="font-bold text-emerald-500">33%</span>
            </div>
            <div className="flex justify-between">
              <span>Übernächste Stufe (+2)</span>
              <span className="font-bold text-amber-500">10%</span>
            </div>
            <p className="text-muted-foreground mt-2 italic">
              Du hast genau 4 Klicks Zeit, die Seltenheit deiner Box zu maximieren.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20">
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Seltenheiten
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-wrap gap-1">
            {RARITY_ORDER.map(r => {
              const rInfo = getRarityInfo(r)
              return (
                <span 
                  key={r} 
                  className={cn("px-2 py-0.5 rounded text-[9px] font-bold text-white", rInfo.color)}
                >
                  {rInfo.label}
                </span>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
        Völlig nutzlos, aber irgendwie befriedigend.
      </div>
    </div>
  )
}
