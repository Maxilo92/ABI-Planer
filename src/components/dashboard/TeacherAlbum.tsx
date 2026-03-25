'use client'

import { useUserTeachers } from '@/hooks/useUserTeachers'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState, useRef, useMemo } from 'react'
import { LootTeacher, TeacherRarity, Profile, CardVariant } from '@/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { GraduationCap, Trophy, Star, Lock, Search, Filter, X, ChevronRight, Rotate3d, ArrowDownAZ, ArrowDownZA, ArrowUp10, LayoutGrid, Package } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { CardData, CardVariant as NewCardVariant } from '@/types/cards'
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'

const DEFAULT_TEACHERS: LootTeacher[] = [
  { id: 'max-mustermann', name: "Max Mustermann", rarity: "common" },
  { id: 'erika-musterfrau', name: "Erika Musterfrau", rarity: "rare" },
  { id: 'marie-curie', name: "Marie Curie", rarity: "mythic" },
  { id: 'albert-einstein', name: "Albert Einstein", rarity: "legendary" }
]

const getNextLevelCount = (level: number): number => {
  return Math.pow(level, 2) + 1
}

const getPrevLevelCount = (level: number): number => {
  if (level <= 1) return 0
  return Math.pow(level - 1, 2) + 1
}

const getVariantLabel = (variant: CardVariant) => {
  switch (variant) {
    case 'normal': return 'Normal'
    case 'holo': return 'Holo'
    case 'shiny': return 'Shiny'
    case 'black_shiny_holo': return 'Secret Rare'
    default: return variant
  }
}

const getVariantBadge = (variant: CardVariant) => {
  switch (variant) {
    case 'normal': return 'bg-slate-500'
    case 'holo': return 'bg-gradient-to-r from-blue-400 to-purple-500'
    case 'shiny': return 'bg-gradient-to-r from-yellow-400 to-orange-500'
    case 'black_shiny_holo': return 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600'
    default: return 'bg-slate-500'
  }
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

const mapToCardData = (teacher: LootTeacher, userData: any, globalTeachers: LootTeacher[]): CardData => {
  const variant: NewCardVariant = userData?.variants?.black_shiny_holo ? 'blckshiny' :
                   (userData?.variants?.shiny ? 'shiny-v2' : 
                   (userData?.variants?.holo ? 'holo' : 'normal'))
  
  const globalIndex = globalTeachers.findIndex(t => (t.id || t.name) === (teacher.id || teacher.name))
  
  return {
    id: teacher.id || teacher.name,
    name: teacher.name,
    rarity: teacher.rarity,
    variant,
    color: getRarityHex(teacher.rarity),
    cardNumber: (globalIndex + 1).toString().padStart(3, '0'),
  }
}

function TeacherCardDetail({ teacher, userData, onClose, globalTeachers }: { teacher: LootTeacher, userData: any, onClose: () => void, globalTeachers: LootTeacher[] }) {
  const isOwned = !!userData
  const level = userData?.level || 1
  const count = userData?.count || 0
  
  const cardData = mapToCardData(teacher, userData, globalTeachers)

  return (
    <div className="flex flex-col items-center space-y-8 py-4">
      <TeacherCard 
        data={cardData}
        className="scale-110 sm:scale-125"
      />

      <div className="text-center animate-pulse flex items-center gap-2 text-white/50 text-sm font-medium">
        <Rotate3d className="h-4 w-4" />
        Klicken zum Umdrehen
      </div>

      <div className="w-full max-w-xs bg-black/40 backdrop-blur-xl rounded-2xl p-6 space-y-4 border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-white">Statistiken</span>
          <Badge variant="outline" className="text-[10px] text-white/70 border-white/20">{count}x gesammelt</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold px-1 text-white/80">
            <span>Level {level}</span>
            <span>Fortschritt</span>
          </div>
          <Progress 
            value={((count - getPrevLevelCount(level)) / (getNextLevelCount(level) - getPrevLevelCount(level))) * 100} 
            className="h-2 bg-white/10" 
          />
          <p className="text-[10px] text-center text-white/40 pt-1">
            Noch {getNextLevelCount(level) - count} Karten bis Level {level + 1}
          </p>
        </div>
      </div>
    </div>
  )
}

export function TeacherAlbum({ 
  userId, 
  targetProfile, 
  initialLimit 
}: { 
  userId?: string, 
  targetProfile?: Profile | null,
  initialLimit?: number
}) {
  const router = useRouter()
  const { profile: currentProfile } = useAuth()
  const activeProfile = targetProfile !== undefined ? targetProfile : currentProfile
  const { teachers: userTeachers, loading: loadingUserTeachers } = useUserTeachers(userId)
  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Filters state
  const [search, setSearch] = useState('')
  const [rarityFilters, setRarityFilters] = useState<TeacherRarity[]>([])
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'missing'>(initialLimit ? 'owned' : 'all')
  const [sortBy, setSortBy] = useState<'rarity_desc' | 'rarity_asc' | 'name_asc' | 'name_desc' | 'level_desc' | 'level_asc' | 'upgrade'>(
    initialLimit ? 'level_desc' : 'rarity_desc'
  )
  
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
    let result = globalTeachers.filter(t => {
      // Search filter
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
      
      // Rarity filter
      if (rarityFilters.length > 0 && !rarityFilters.includes(t.rarity)) return false
      
      // Ownership filter
      const isOwned = !!(userTeachers?.[t.id] || userTeachers?.[t.name])
      if (ownershipFilter === 'owned' && !isOwned) return false
      if (ownershipFilter === 'missing' && isOwned) return false
      
      return true
    })

    // Sorting logic
    result.sort((a, b) => {
      const ownedA = (userTeachers?.[a.id] || userTeachers?.[a.name])
      const ownedB = (userTeachers?.[b.id] || userTeachers?.[b.name])
      
      // If we have an initialLimit and are not expanded, we PRIORITIZE level/rarity for the preview
      if (initialLimit && !isExpanded && !search && rarityFilters.length === 0 && (ownershipFilter === 'all' || ownershipFilter === 'owned')) {
        const lvlA = ownedA?.level || 0
        const lvlB = ownedB?.level || 0
        if (lvlA !== lvlB) return lvlB - lvlA

        const rarityOrder: TeacherRarity[] = ['legendary', 'mythic', 'epic', 'rare', 'common']
        const rarityA = rarityOrder.indexOf(a.rarity)
        const rarityB = rarityOrder.indexOf(b.rarity)
        if (rarityA !== rarityB) return rarityA - rarityB

        return a.name.localeCompare(b.name)
      }

      // Ownership always comes first in normal sorting
      if (!!ownedA !== !!ownedB) return ownedB ? 1 : -1
      
      // Secondary sorting based on user selection
      if (sortBy === 'level_desc' || sortBy === 'level_asc') {
        const lvlA = ownedA?.level || 0
        const lvlB = ownedB?.level || 0
        if (lvlA !== lvlB) return sortBy === 'level_desc' ? (lvlB - lvlA) : (lvlA - lvlB)
      } else if (sortBy === 'upgrade') {
        const getNeeded = (owned: any) => {
          if (!owned) return 1000
          const level = owned.level || 1
          const count = owned.count || 0
          return getNextLevelCount(level) - count
        }
        const neededA = getNeeded(ownedA)
        const neededB = getNeeded(ownedB)
        if (neededA !== neededB) return neededA - neededB
      } else if (sortBy === 'rarity_desc' || sortBy === 'rarity_asc') {
        const rarityOrder: TeacherRarity[] = ['legendary', 'mythic', 'epic', 'rare', 'common']
        const rarityA = rarityOrder.indexOf(a.rarity)
        const rarityB = rarityOrder.indexOf(b.rarity)
        if (rarityA !== rarityB) return sortBy === 'rarity_desc' ? (rarityA - rarityB) : (rarityB - rarityA)
      } else if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name)
      }
      
      // Default: sort by name
      return a.name.localeCompare(b.name)
    })

    return result
  }, [globalTeachers, userTeachers, search, rarityFilters, ownershipFilter, sortBy, initialLimit, isExpanded])

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
  const totalCardsCollected = Object.values(userTeachers || {}).reduce((acc: number, curr: any) => acc + (curr.count || 0), 0)
  const packsOpened = activeProfile?.booster_stats?.total_opened || 0

  const toggleRarity = (rarity: TeacherRarity) => {
    setRarityFilters(prev => 
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setRarityFilters([])
    setOwnershipFilter('all')
    setSortBy('rarity_desc')
  }

  const activeFilterCount = (search ? 1 : 0) + rarityFilters.length + (ownershipFilter !== 'all' ? 1 : 0) + (sortBy !== 'rarity_desc' ? 1 : 0)

  // Determine which teachers to show based on expansion state
  const displayedTeachers = initialLimit && !isExpanded 
    ? filteredTeachers.slice(0, initialLimit) 
    : filteredTeachers

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Lehrer-Album
          </h2>
          <p className="text-sm text-muted-foreground">
            {userId ? `Sammlung von ${activeProfile?.full_name || 'diesem Nutzer'}` : 'Sammle Lehrer aus Packs und vervollständige dein Album!'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!userId && (
            <Button 
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase tracking-tighter gap-2 shadow-lg shadow-blue-500/20 mr-2 max-sm:w-full max-sm:mr-0"
              onClick={() => router.push('/sammelkarten')}
            >
              <Package className="h-3.5 w-3.5" />
              Booster öffnen
            </Button>
          )}
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border max-sm:w-full max-sm:justify-center">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-bold">
              {ownedCount} / {totalTeachers} Entdeckt
            </span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
            <Package className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold">
              {packsOpened} Packs
            </span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
            <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-bold">
              {(totalCardsCollected as number)} Karten
            </span>
          </div>
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
              Filter & Sortierung
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
              <DropdownMenuLabel>Sortierung</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <DropdownMenuRadioItem value="rarity_desc" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Seltenheit (hoch nach niedrig)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rarity_asc" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Seltenheit (niedrig nach hoch)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name_asc" className="flex items-center gap-2">
                  <ArrowDownAZ className="h-4 w-4" />
                  Alphabetisch (A-Z)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name_desc" className="flex items-center gap-2">
                  <ArrowDownZA className="h-4 w-4" />
                  Alphabetisch (Z-A)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="level_desc" className="flex items-center gap-2">
                  <ArrowUp10 className="h-4 w-4" />
                  Level (absteigend)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="level_asc" className="flex items-center gap-2">
                  <ArrowDownAZ className="h-4 w-4" />
                  Level (aufsteigend)
                </DropdownMenuRadioItem>
                {/* Upgrade-Logik entfernt, da Packs-System */}
              </DropdownMenuRadioGroup>

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
                    Alles zurücksetzen
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
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {displayedTeachers.map((teacher) => {
              const teacherId = teacher.id || teacher.name
              const userData = userTeachers?.[teacher.id] || userTeachers?.[teacher.name]
              const isOwned = !!userData
              const cardData = mapToCardData(teacher, userData, globalTeachers)

              return (
                <div 
                  key={teacherId}
                  className="flex flex-col items-center w-full max-w-[200px] mx-auto"
                >
                  <div 
                    onClick={() => isOwned && setSelectedTeacher(teacher)}
                    className={cn(
                      "relative transition-all duration-300 transform group w-full aspect-[2.5/3.5]",
                      !isOwned && "opacity-40 grayscale cursor-not-allowed",
                      isOwned && "cursor-pointer hover:scale-[1.05] hover:-rotate-1 active:scale-95"
                    )}
                  >
                    <TeacherCard 
                      data={cardData}
                      className="w-full h-auto"
                      styleVariant="modern-flat"
                      isFlippedExternally={isOwned}
                    />
                    
                    {!isOwned && (
                      <div className="absolute inset-0 flex items-center justify-center z-50">
                        <Lock className="h-10 w-10 text-white/40 drop-shadow-lg" />
                      </div>
                    )}
                  </div>

                  {isOwned && (
                    <div className="w-full mt-2 text-center">
                      <h3 className="font-black text-[9px] sm:text-[10px] uppercase tracking-tighter line-clamp-1 opacity-80">
                        {teacher.name}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <div className="bg-black text-white rounded-full px-1.5 py-0 text-[8px] font-black border border-white/10">
                          LVL {userData.level || 1}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {initialLimit && filteredTeachers.length > initialLimit && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2"
              >
                {isExpanded ? "Weniger anzeigen" : `Alle ${filteredTeachers.length} Lehrer anzeigen`}
                <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
              </Button>
            </div>
          )}
        </>
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
                globalTeachers={globalTeachers}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}