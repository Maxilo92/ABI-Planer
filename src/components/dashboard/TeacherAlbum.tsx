'use client'

import { useUserTeachers } from '@/hooks/useUserTeachers'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { LootTeacher, TeacherRarity } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Trophy, Star, Lock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const DEFAULT_TEACHERS: LootTeacher[] = [
  { id: 'max-mustermann', name: "Max Mustermann", rarity: "common" },
  { id: 'erika-musterfrau', name: "Erika Musterfrau", rarity: "rare" },
  { id: 'albert-einstein', name: "Albert Einstein", rarity: "legendary" }
]

/**
 * Calculates the count needed for the next level.
 * Formula matches hook: level = floor(sqrt(count - 1)) + 1
 * So count = (level - 1)^2 + 1
 */
const getNextLevelCount = (level: number): number => {
  // To reach level + 1, we need ( (level + 1) - 1 )^2 + 1 = level^2 + 1
  return Math.pow(level, 2) + 1
}

const getPrevLevelCount = (level: number): number => {
  if (level <= 1) return 1
  return Math.pow(level - 1, 2) + 1
}

const getRarityColor = (rarity: TeacherRarity) => {
  switch (rarity) {
    case 'common': return 'text-slate-500'
    case 'rare': return 'text-emerald-500'
    case 'epic': return 'text-purple-500'
    case 'mythic': return 'text-red-500'
    case 'legendary': return 'text-amber-500'
    default: return ''
  }
}

const getRarityBadge = (rarity: TeacherRarity) => {
  switch (rarity) {
    case 'common': return 'bg-slate-500'
    case 'rare': return 'bg-emerald-500'
    case 'epic': return 'bg-purple-500'
    case 'mythic': return 'bg-red-500'
    case 'legendary': return 'bg-amber-500'
    default: return ''
  }
}

const getRarityLabel = (rarity: TeacherRarity) => {
  switch (rarity) {
    case 'common': return 'Gewöhnlich'
    case 'rare': return 'Selten'
    case 'epic': return 'Episch'
    case 'mythic': return 'Mythisch'
    case 'legendary': return 'Legendär'
    default: return rarity
  }
}

export function TeacherAlbum() {
  const { teachers: userTeachers, loading: loadingUserTeachers } = useUserTeachers()
  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setGlobalTeachers(Array.isArray(data.loot_teachers) && data.loot_teachers.length > 0 
          ? data.loot_teachers 
          : DEFAULT_TEACHERS)
      } else {
        setGlobalTeachers(DEFAULT_TEACHERS)
      }
      setLoadingGlobal(false)
    })
    return () => unsubscribe()
  }, [])

  if (loadingUserTeachers || loadingGlobal) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  // Sort teachers: Owned first, then by rarity, then by name
  const sortedTeachers = [...globalTeachers].sort((a, b) => {
    const ownedA = (userTeachers?.[a.id] || userTeachers?.[a.name]) ? 1 : 0
    const ownedB = (userTeachers?.[b.id] || userTeachers?.[b.name]) ? 1 : 0
    
    if (ownedA !== ownedB) return ownedB - ownedA
    
    const rarityOrder: TeacherRarity[] = ['legendary', 'mythic', 'epic', 'rare', 'common']
    const rarityA = rarityOrder.indexOf(a.rarity)
    const rarityB = rarityOrder.indexOf(b.rarity)
    
    if (rarityA !== rarityB) return rarityA - rarityB
    
    return a.name.localeCompare(b.name)
  })

  const totalTeachers = globalTeachers.length
  const ownedCount = Object.keys(userTeachers || {}).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Lehrer-Album
          </h2>
          <p className="text-sm text-muted-foreground">
            Sammle Lehrer aus den Sammelkarten-Packungen und verbessere sie!
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">
            {ownedCount} / {totalTeachers} Gefunden
          </span>
        </div>
      </div>

      {sortedTeachers.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <p className="text-muted-foreground italic">Noch keine Lehrer verfügbar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedTeachers.map((teacher) => {
            const teacherId = teacher.id || teacher.name
            const userData = userTeachers?.[teacher.id] || userTeachers?.[teacher.name]
            const isOwned = !!userData
            const level = userData?.level || 1
            const count = userData?.count || 0
            
            const nextCount = getNextLevelCount(level)
            const prevCount = getPrevLevelCount(level)
            const progress = isOwned ? ((count - prevCount) / (nextCount - prevCount)) * 100 : 0
            const needed = nextCount - count

            return (
              <Card 
                key={teacherId}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 group hover:scale-[1.02]",
                  !isOwned && "opacity-60 grayscale brightness-75",
                  isOwned && "border-2",
                  isOwned && teacher.rarity === 'legendary' && "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10",
                  isOwned && teacher.rarity === 'mythic' && "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10",
                  isOwned && teacher.rarity === 'epic' && "border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-500/10",
                  isOwned && teacher.rarity === 'rare' && "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                )}
              >
                <CardHeader className="p-3 pb-0">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className={cn("text-[9px] px-1.5 h-4 font-black uppercase tracking-tighter", isOwned ? getRarityBadge(teacher.rarity) : "bg-slate-500", "text-white")}>
                      {getRarityLabel(teacher.rarity)}
                    </Badge>
                    {isOwned && (
                      <div className="flex items-center gap-0.5 bg-black/80 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                        <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                        Lvl {level}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-4 flex flex-col items-center text-center space-y-3">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-transform group-hover:rotate-12",
                    isOwned ? "bg-background border-primary" : "bg-muted border-muted-foreground/20"
                  )}>
                    {isOwned ? (
                      <GraduationCap className={cn("h-8 w-8", getRarityColor(teacher.rarity))} />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                      {isOwned ? teacher.name : "???"}
                    </h3>
                    {isOwned && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {count}x gesammelt
                      </p>
                    )}
                  </div>

                  {isOwned && level < 10 && (
                    <div className="w-full space-y-1.5 pt-1">
                      <div className="flex justify-between text-[9px] font-medium px-0.5">
                        <span>Lvl {level}</span>
                        <span className="text-muted-foreground">Noch {needed} bis Lvl {level + 1}</span>
                      </div>
                      <Progress value={progress} className="h-1" />
                    </div>
                  )}
                  
                  {!isOwned && (
                    <div className="text-[9px] font-medium text-muted-foreground/60 italic pt-2">
                      Noch nicht entdeckt
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
