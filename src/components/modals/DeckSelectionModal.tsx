'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { LootTeacher, TeacherRarity } from '@/types/database'
import { CardData, CardVariant as NewCardVariant } from '@/types/cards'
import { TeacherCard } from '@/components/cards/TeacherCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Filter, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DeckSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (cardId: string) => void
  excludeCardIds: string[]
}

function getBestVariant(variants: Record<string, number> | undefined): NewCardVariant {
  if (!variants) return 'normal'
  if (variants.black_shiny_holo) return 'black_shiny_holo'
  if (variants.shiny) return 'shiny'
  if (variants.holo) return 'holo'
  return 'normal'
}

function getTeacherRarityHex(rarity: string) {
  switch (rarity) {
    case 'common': return '#64748b'
    case 'rare': return '#10b981'
    case 'epic': return '#9333ea'
    case 'mythic': return '#dc2626'
    case 'legendary': return '#f59e0b'
    case 'iconic': return '#000000'
    default: return '#64748b'
  }
}

const getRarityBadge = (rarity: TeacherRarity) => {
  switch (rarity) {
    case "common": return "bg-slate-500";
    case "rare": return "bg-emerald-500";
    case "epic": return "bg-purple-500";
    case "mythic": return "bg-red-500";
    case "legendary": return "bg-amber-500";
    case "iconic": return "bg-neutral-950 border border-amber-500/50 text-amber-500";
    default: return "";
  }
};

export const DeckSelectionModal: React.FC<DeckSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  excludeCardIds
}) => {
  const { teachers: userTeachers, loading: loadingUserTeachers } = useUserTeachers()
  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [search, setSearch] = useState('')
  const [rarityFilters, setRarityFilters] = useState<TeacherRarity[]>([])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (Array.isArray(data.loot_teachers)) {
          setGlobalTeachers(data.loot_teachers)
        }
      }
      setLoadingGlobal(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredCards = useMemo(() => {
    if (!userTeachers) return []

    return globalTeachers
      .filter(t => {
        const id = t.id || t.name
        const isOwned = !!userTeachers[id]
        const isExcluded = excludeCardIds.includes(id)
        
        if (!isOwned || isExcluded) return false
        
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
        if (rarityFilters.length > 0 && !rarityFilters.includes(t.rarity)) return false
        
        return true
      })
      .map(t => {
        const id = t.id || t.name
        const userData = userTeachers[id]
        const globalIndex = globalTeachers.findIndex(gt => (gt.id || gt.name) === id)
        
        const cardData: CardData = {
          id,
          name: t.name,
          rarity: t.rarity,
          variant: getBestVariant(userData?.variants),
          color: getTeacherRarityHex(t.rarity),
          cardNumber: (globalIndex + 1).toString().padStart(3, '0'),
          description: t.description,
          hp: t.hp,
          attacks: t.attacks,
        }
        
        return cardData
      })
  }, [globalTeachers, userTeachers, excludeCardIds, search, rarityFilters])

  const toggleRarity = (rarity: TeacherRarity) => {
    setRarityFilters(prev => 
      prev.includes(rarity) 
        ? prev.filter(r => r !== rarity) 
        : [...prev, rarity]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-4 border-black rounded-[2.5rem]">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              Karte auswählen
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Wähle einen Lehrer aus deiner Sammlung für dein Deck.
          </p>
        </DialogHeader>

        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Lehrer suchen..."
              className="pl-10 h-11 rounded-xl border-2 border-black/10 focus:border-blue-500 transition-all"
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

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="h-11 rounded-xl border-2 border-black/10 gap-2" />}>
              <Filter className="h-4 w-4" />
              Filter
              {rarityFilters.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {rarityFilters.length}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
                Seltenheit
              </DropdownMenuLabel>
              <div className="grid grid-cols-3 gap-1 p-1">
                {(['iconic', 'legendary', 'mythic', 'epic', 'rare', 'common'] as TeacherRarity[]).map((rarity) => (
                  <button
                    key={rarity}
                    onClick={() => toggleRarity(rarity)}
                    className={cn(
                      "aspect-square rounded-md flex items-center justify-center transition-all border-2",
                      rarityFilters.includes(rarity)
                        ? cn("border-transparent shadow-sm", getRarityBadge(rarity))
                        : "border-muted-foreground/10 bg-muted/30 hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      rarityFilters.includes(rarity) ? "bg-white" : getRarityBadge(rarity)
                    )} />
                  </button>
                ))}
              </div>
              {rarityFilters.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    onClick={() => setRarityFilters([])}
                    className="w-full px-2 py-2 text-[10px] font-black uppercase text-destructive hover:bg-destructive/10 rounded-md transition-all text-center"
                  >
                    Filter löschen
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingUserTeachers || loadingGlobal ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-muted-foreground font-medium">Lade Sammlung...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
              <p className="text-muted-foreground italic">
                Keine passenden Karten in deiner Sammlung gefunden.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => onSelect(card.id)}
                  className="flex flex-col items-center w-full cursor-pointer group"
                >
                  <div className="relative transition-all duration-300 transform group-hover:scale-[1.05] group-hover:-rotate-1 active:scale-95 w-full aspect-[2.5/3.5]">
                    <TeacherCard
                      data={card}
                      styleVariant="modern-flat"
                      isFlippedExternally={true}
                      interactive={false}
                    />
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors rounded-[3.5cqw]" />
                  </div>
                  <div className="w-full mt-2 text-center">
                    <h3 className="font-black text-[10px] uppercase tracking-tight line-clamp-1 opacity-80 group-hover:text-blue-500 transition-colors">
                      {card.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
