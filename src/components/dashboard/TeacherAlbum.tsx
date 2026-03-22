'use client'

import { useUserTeachers } from '@/hooks/useUserTeachers'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState, useRef, useMemo } from 'react'
import { LootTeacher, TeacherRarity } from '@/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GraduationCap, Trophy, Star, Lock, Search, Filter, X, ChevronRight, Rotate3d } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'

const DEFAULT_TEACHERS: LootTeacher[] = [
  { id: 'max-mustermann', name: "Max Mustermann", rarity: "common" },
  { id: 'erika-musterfrau', name: "Erika Musterfrau", rarity: "rare" },
  { id: 'albert-einstein', name: "Albert Einstein", rarity: "legendary" }
]

const getNextLevelCount = (level: number): number => {
  return Math.pow(level, 2) + 1
}

const getPrevLevelCount = (level: number): number => {
  if (level <= 1) return 0
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

const getRarityGlow = (rarity: TeacherRarity) => {
  switch (rarity) {
    case 'common': return 'shadow-[0_0_20px_rgba(100,116,139,0.3)]'
    case 'rare': return 'shadow-[0_0_25px_rgba(16,185,129,0.5)]'
    case 'epic': return 'shadow-[0_0_30px_rgba(147,51,234,0.6)]'
    case 'mythic': return 'shadow-[0_0_35px_rgba(220,38,38,0.7)]'
    case 'legendary': return 'shadow-[0_0_40px_rgba(245,158,11,0.8)]'
    default: return ''
  }
}

const getRarityBg = (rarity: TeacherRarity) => {
  switch (rarity) {
    case 'common': return 'bg-slate-500'
    case 'rare': return 'bg-emerald-500'
    case 'epic': return 'bg-purple-600'
    case 'mythic': return 'bg-red-600'
    case 'legendary': return 'bg-amber-500'
    default: return ''
  }
}

function TeacherCardDetail({ teacher, userData, onClose }: { teacher: LootTeacher, userData: any, onClose: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  
  const isOwned = !!userData
  const level = userData?.level || 1
  const count = userData?.count || 0
  const rarityInfo = {
    color: getRarityBg(teacher.rarity),
    label: getRarityLabel(teacher.rarity),
    glow: getRarityGlow(teacher.rarity)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Performance: Limit rotation to 8 degrees and simplify math
    const rotateX = Math.max(-8, Math.min(8, (y - centerY) / 12))
    const rotateY = Math.max(-8, Math.min(8, (centerX - x) / 12))
    
    // Performance: Only update if change is significant to reduce paint frequency
    if (Math.abs(rotateX - rotate.x) > 0.5 || Math.abs(rotateY - rotate.y) > 0.5) {
       setRotate({ x: rotateX, y: rotateY })
    }
  }

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    setRotate({ x: 0, y: 0 })
  }

  return (
    <div className="flex flex-col items-center space-y-8 py-4">
      <div 
        ref={cardRef}
        className="perspective-1000 w-64 h-96 cursor-pointer relative group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlip}
      >
        <div 
          className={cn(
            "relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-3xl will-change-transform",
            isFlipped && "rotate-y-180"
          )}
          style={{ 
            transform: isFlipped 
              ? 'rotateY(180deg)' 
              : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` 
          }}
        >
          {/* Front of Card */}
          <div 
            className={cn(
              "absolute inset-0 backface-hidden rounded-3xl border-[6px] border-white flex flex-col p-2 shadow-2xl transition-all duration-500 overflow-hidden",
              rarityInfo.color,
              isFlipped ? "" : rarityInfo.glow
            )}
            style={{ transform: 'translateZ(1px)' }}
          >
            {/* Performance: Solid background to prevent back-face bleeding */}
            <div className={cn("absolute inset-0 z-0 rounded-[inherit]", rarityInfo.color)} />

            {/* Rarity Effects */}
            {(teacher.rarity === 'legendary' || teacher.rarity === 'mythic') && (
              <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-10">
                <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
              </div>
            )}

            {/* Top Layout: Rarity and Level Badge */}
            <div className="flex justify-between items-start w-full px-1.5 pt-1 relative z-30">
              <div className="text-[10px] font-black uppercase text-white/90 tracking-widest drop-shadow-md">
                {rarityInfo.label}
              </div>
              <div className="bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 text-[9px] sm:text-[10px] font-black text-white border border-white/20 shadow-lg">
                LVL {level}
              </div>
            </div>

            {/* Middle Section: Flexible Icon Container */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center relative z-20 py-2">
              <div className="h-full aspect-square max-h-[160px] rounded-2xl bg-white/10 flex items-center justify-center shadow-inner border border-white/5 relative">
                <GraduationCap className="h-1/2 w-1/2 text-white drop-shadow-2xl relative z-10" />
              </div>
            </div>
            
            {/* Bottom Layout: Fixed Name Container */}
            <div className="mt-auto w-full bg-black/40 rounded-2xl p-3 sm:p-4 border border-white/10 shadow-lg text-center relative z-20 flex flex-col-reverse justify-center">
              <div className="text-white font-black text-base sm:text-lg md:text-xl leading-tight italic break-words hyphens-auto [text-wrap:balance]">
                {teacher.name}
              </div>
            </div>

            {/* Performance: Simplified reflection (no blur) */}
            {!isFlipped && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_var(--x)_var(--y),_white_0%,_transparent_60%)] z-15"
                style={{ 
                  '--x': `${50 + rotate.y * 3}%`,
                  '--y': `${50 + rotate.x * 3}%`
                } as any}
              />
            )}
          </div>

          {/* Minimalist Back of Card */}
          <div 
            className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-slate-900 border-[10px] border-white/10 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
            style={{ transform: 'rotateY(180deg) translateZ(1px)' }}
          >
             <div className="relative z-10 flex flex-col items-center">
               <div className="p-5 rounded-full bg-white/5 mb-5">
                 <GraduationCap className="h-16 w-16 text-white/20" />
               </div>
               <div className="text-white/20 font-black text-2xl tracking-tighter italic px-4 text-center">ABI PLANER</div>
             </div>
          </div>
        </div>
      </div>

      <div className="text-center animate-pulse flex items-center gap-2 text-muted-foreground text-sm font-medium">
        <Rotate3d className="h-4 w-4" />
        Klicken zum Umdrehen
      </div>

      <div className="w-full max-w-xs bg-muted/50 rounded-2xl p-6 space-y-4 border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">Statistiken</span>
          <Badge variant="outline" className="text-[10px]">{count}x gesammelt</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold px-1">
            <span>Level {level}</span>
            <span>Fortschritt</span>
          </div>
          <Progress 
            value={((count - getPrevLevelCount(level)) / (getNextLevelCount(level) - getPrevLevelCount(level))) * 100} 
            className="h-2" 
          />
          <p className="text-[10px] text-center text-muted-foreground pt-1">
            Noch {getNextLevelCount(level) - count} Karten bis Level {level + 1}
          </p>
        </div>
      </div>
    </div>
  )
}

export function TeacherAlbum() {
  const { teachers: userTeachers, loading: loadingUserTeachers } = useUserTeachers()
  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  
  // Filters state
  const [search, setSearch] = useState('')
  const [rarityFilters, setRarityFilters] = useState<TeacherRarity[]>([])
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'missing'>('all')
  
  // Selection state
  const [selectedTeacher, setSelectedTeacher] = useState<LootTeacher | null>(null)

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

  const filteredTeachers = useMemo(() => {
    return globalTeachers.filter(t => {
      // Search filter
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
      
      // Rarity filter
      if (rarityFilters.length > 0 && !rarityFilters.includes(t.rarity)) return false
      
      // Ownership filter
      const isOwned = !!(userTeachers?.[t.id] || userTeachers?.[t.name])
      if (ownershipFilter === 'owned' && !isOwned) return false
      if (ownershipFilter === 'missing' && isOwned) return false
      
      return true
    }).sort((a, b) => {
      const ownedA = (userTeachers?.[a.id] || userTeachers?.[a.name]) ? 1 : 0
      const ownedB = (userTeachers?.[b.id] || userTeachers?.[b.name]) ? 1 : 0
      
      if (ownedA !== ownedB) return ownedB - ownedA
      
      const rarityOrder: TeacherRarity[] = ['legendary', 'mythic', 'epic', 'rare', 'common']
      const rarityA = rarityOrder.indexOf(a.rarity)
      const rarityB = rarityOrder.indexOf(b.rarity)
      
      if (rarityA !== rarityB) return rarityA - rarityB
      
      return a.name.localeCompare(b.name)
    })
  }, [globalTeachers, userTeachers, search, rarityFilters, ownershipFilter])

  if (loadingUserTeachers || loadingGlobal) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  const totalTeachers = globalTeachers.length
  const ownedCount = Object.keys(userTeachers || {}).length

  const toggleRarity = (rarity: TeacherRarity) => {
    setRarityFilters(prev => 
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setRarityFilters([])
    setOwnershipFilter('all')
  }

  const activeFilterCount = (search ? 1 : 0) + rarityFilters.length + (ownershipFilter !== 'all' ? 1 : 0)

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

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Lehrer suchen..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="gap-2 shrink-0" />}>
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Besitz-Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                checked={ownershipFilter === 'all'} 
                onCheckedChange={() => setOwnershipFilter('all')}
              >
                Alle anzeigen
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={ownershipFilter === 'owned'} 
                onCheckedChange={() => setOwnershipFilter('owned')}
              >
                Nur Entdeckte
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={ownershipFilter === 'missing'} 
                onCheckedChange={() => setOwnershipFilter('missing')}
              >
                Nur Fehlende
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Seltenheit</DropdownMenuLabel>
              {(['legendary', 'mythic', 'epic', 'rare', 'common'] as TeacherRarity[]).map((rarity) => (
                <DropdownMenuCheckboxItem 
                  key={rarity}
                  checked={rarityFilters.includes(rarity)}
                  onCheckedChange={() => toggleRarity(rarity)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getRarityBadge(rarity))} />
                    {getRarityLabel(rarity)}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              
              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem onCheckedChange={clearFilters} className="text-destructive focus:text-destructive">
                    Filter zurücksetzen
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <p className="text-muted-foreground italic">
            {totalTeachers === 0 ? "Noch keine Lehrer verfügbar." : "Keine Lehrer gefunden, die den Filtern entsprechen."}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Alle Filter löschen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTeachers.map((teacher) => {
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
                onClick={() => isOwned && setSelectedTeacher(teacher)}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 group",
                  !isOwned && "opacity-60 grayscale brightness-75",
                  isOwned && "border-2 cursor-pointer hover:scale-[1.04] hover:shadow-xl",
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
                <CardContent className="p-2.5 sm:p-3 pt-3 sm:pt-4 flex flex-col items-center text-center space-y-2.5 sm:space-y-3">
                  <div className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-transform group-hover:rotate-12",
                    isOwned ? "bg-background border-primary" : "bg-muted border-muted-foreground/20"
                  )}>
                    {isOwned ? (
                      <GraduationCap className={cn("h-7 w-7 sm:w-8 sm:h-8", getRarityColor(teacher.rarity))} />
                    ) : (
                      <Lock className="h-5 w-5 sm:w-6 sm:h-6 text-muted-foreground/40" />
                    )}
                  </div>
                  
                  <div className="w-full">
                    <h3 className="font-bold text-[10px] sm:text-xs leading-tight line-clamp-3 min-h-[2.75rem] flex items-center justify-center break-words hyphens-auto">
                      {isOwned ? teacher.name : "???"}
                    </h3>
                    {isOwned && (
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">
                        {count}x gesammelt
                      </p>
                    )}
                  </div>

                  {isOwned && level < 10 && (
                    <div className="w-full space-y-1.5 pt-0.5 sm:pt-1">
                      <div className="flex justify-between text-[8px] sm:text-[9px] font-medium px-0.5">
                        <span>Lvl {level}</span>
                        <span className="text-muted-foreground">Noch {needed}</span>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none ring-0 sm:max-w-sm">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="absolute top-2 right-2 z-50 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 border-none"
              onClick={() => setSelectedTeacher(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {selectedTeacher && (
              <TeacherCardDetail 
                teacher={selectedTeacher} 
                userData={userTeachers?.[selectedTeacher.id] || userTeachers?.[selectedTeacher.name]}
                onClose={() => setSelectedTeacher(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
