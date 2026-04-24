'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { TeacherRarity } from '@/types/database'
import { CardData, CardVariant as NewCardVariant } from '@/types/cards'
import { TeacherSpecCard } from '@/components/cards/TeacherSpecCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Filter, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildTeacherCatalogFromSettings, findUserTeacherEntry, TeacherCatalogEntry } from '@/lib/cardCatalog'
import { mapTeacherCatalogToCardData } from '@/modules/cards/cardData'
import { getRarityBadgeClass } from '@/modules/shared/rarity'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const RARITY_PRIORITY: Record<TeacherRarity, number> = {
  iconic: 0,
  legendary: 1,
  mythic: 2,
  epic: 3,
  rare: 4,
  common: 5
}

const VARIANT_PRIORITY: Record<NewCardVariant, number> = {
  black_shiny_holo: 0,
  selten: 1,
  shiny: 2,
  holo: 3,
  normal: 4
}

interface DeckSelectionProps {
  onSelect: (cardId: string) => void
  onBack: () => void
  excludeCardIds: string[]
  includeCardIds?: string[]
  title?: string
}

export const DeckSelection: React.FC<DeckSelectionProps> = ({
  onSelect,
  onBack,
  excludeCardIds,
  includeCardIds,
  title = "Karte auswählen"
}) => {
  const { teachers: userTeachers, loading: loadingUserTeachers } = useUserTeachers()
  const [globalTeachers, setGlobalTeachers] = useState<TeacherCatalogEntry[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [search, setSearch] = useState('')
  const [rarityFilters, setRarityFilters] = useState<TeacherRarity[]>([])
  const [setFilters, setSetFilters] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setGlobalTeachers(buildTeacherCatalogFromSettings(data))
      }
      setLoadingGlobal(false)
    })
    return () => unsubscribe()
  }, [])

  const availableSets = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>()
    globalTeachers.forEach((teacher) => {
      if (!unique.has(teacher.setId)) {
        unique.set(teacher.setId, { id: teacher.setId, name: teacher.setName })
      }
    })
    return Array.from(unique.values())
  }, [globalTeachers])

  const filteredCards = useMemo(() => {
    if (!userTeachers) return []

    return globalTeachers
      .filter(t => {
        const id = t.fullId
        const isOwned = !!findUserTeacherEntry(userTeachers, t)
        const isExcluded = excludeCardIds.includes(id) || excludeCardIds.includes(t.baseId)
        
        // If includeCardIds is provided, only show cards from that list
        if (includeCardIds && !includeCardIds.includes(id) && !includeCardIds.includes(t.baseId)) {
          return false
        }

        if (!isOwned || isExcluded) return false
        
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
        if (rarityFilters.length > 0 && !rarityFilters.includes(t.rarity)) return false
        if (setFilters.length > 0 && !setFilters.includes(t.setId)) return false
        
        return true
      })
      .map(t => {
        const id = t.fullId
        const userData = findUserTeacherEntry(userTeachers, t)
        const cardData: CardData = mapTeacherCatalogToCardData(t, userData, globalTeachers)
        return { ...cardData, id }
      })
      .sort((a, b) => {
        // First by rarity
        const rarityA = RARITY_PRIORITY[a.rarity as TeacherRarity] ?? 10
        const rarityB = RARITY_PRIORITY[b.rarity as TeacherRarity] ?? 10
        if (rarityA !== rarityB) return rarityA - rarityB

        // Then by variant
        const variantA = VARIANT_PRIORITY[a.variant as NewCardVariant] ?? 10
        const variantB = VARIANT_PRIORITY[b.variant as NewCardVariant] ?? 10
        if (variantA !== variantB) return variantA - variantB

        // Then by name
        return a.name.localeCompare(b.name)
      })
  }, [globalTeachers, userTeachers, excludeCardIds, search, rarityFilters, setFilters])

  const toggleRarity = (rarity: TeacherRarity) => {
    setRarityFilters(prev => 
      prev.includes(rarity) 
        ? prev.filter(r => r !== rarity) 
        : [...prev, rarity]
    )
  }

  const toggleSet = (setId: string) => {
    setSetFilters(prev =>
      prev.includes(setId)
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    )
  }

  const hasActiveFilters = rarityFilters.length > 0 || setFilters.length > 0

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">Wähle einen Lehrer aus deiner Sammlung.</p>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-3xl p-4 border border-white/10 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Lehrer suchen..."
            className="pl-10 h-11 rounded-xl border-2 border-black/10 focus:border-blue-500 transition-all bg-background/50"
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
          <DropdownMenuTrigger render={<Button variant="outline" className="h-11 rounded-xl border-2 border-black/10 gap-2 bg-background/50" />}>
            <Filter className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {rarityFilters.length + setFilters.length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-2 border-black">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
              Seltenheit
            </DropdownMenuLabel>
            <div className="grid grid-cols-3 gap-1 p-1">
              {(['iconic', 'legendary', 'mythic', 'epic', 'rare', 'common'] as TeacherRarity[]).map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => toggleRarity(rarity)}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center transition-all border-2",
                    rarityFilters.includes(rarity)
                      ? cn("border-transparent shadow-sm", getRarityBadgeClass(rarity))
                      : "border-muted-foreground/10 bg-muted/30 hover:border-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    rarityFilters.includes(rarity) ? "bg-white" : getRarityBadgeClass(rarity)
                  )} />
                </button>
              ))}
            </div>

            {availableSets.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
                  Sets
                </DropdownMenuLabel>
                <div className="space-y-1 px-1 pb-1 max-h-36 overflow-y-auto">
                  {availableSets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => toggleSet(set.id)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-md text-xs transition-all',
                        setFilters.includes(set.id)
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {set.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <button
                  onClick={() => {
                    setRarityFilters([])
                    setSetFilters([])
                  }}
                  className="w-full px-2 py-2 text-[10px] font-black uppercase text-destructive hover:bg-destructive/10 rounded-md transition-all text-center"
                >
                  Filter löschen
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-h-[400px]">
        {loadingUserTeachers || loadingGlobal ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-muted-foreground font-medium">Lade Sammlung...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-[2.5rem] border-2 border-dashed border-white/10">
            <p className="text-muted-foreground italic">
              Keine passenden Karten in deiner Sammlung gefunden.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                onClick={() => onSelect(card.id)}
                className="flex flex-col items-center w-full cursor-pointer group"
              >
                <div className="relative transition-all duration-300 transform group-hover:scale-[1.02] active:scale-95 w-full aspect-[2.5/3.5]">
                  <TeacherSpecCard
                    data={card}
                    styleVariant="modern-flat"
                    className="shadow-xl"
                  />
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors rounded-[var(--card-radius,1.2cqw)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
