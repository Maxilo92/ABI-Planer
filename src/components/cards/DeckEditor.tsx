'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useDecks } from '@/hooks/useDecks'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { CardData, CardVariant as NewCardVariant } from '@/types/cards'
import { TeacherCard } from './TeacherCard'
import { Button } from '@/components/ui/button'
import { Plus, Save, ArrowLeft, Loader2, Image as ImageIcon, GraduationCap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buildTeacherCatalogFromSettings, findUserTeacherEntry, TeacherCatalogEntry } from '@/lib/cardCatalog'

import { DeckSelection } from './DeckSelection'

interface DeckEditorProps {
  deckId: string
  onBack: () => void
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

export const DeckEditor: React.FC<DeckEditorProps> = ({ deckId, onBack }) => {
  const { decks, updateDeck, loading: loadingDecks } = useDecks()
  const { teachers: userTeachers, loading: loadingUserTeachers } = useUserTeachers()
  const [globalTeachers, setGlobalTeachers] = useState<TeacherCatalogEntry[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSelectingCover, setIsSelectingCover] = useState(false)

  const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId])
  const [title, setTitle] = useState('')
  const [cardIds, setCardIds] = useState<string[]>([])
  const [coverCardId, setCoverCardId] = useState('')

  useEffect(() => {
    if (deck) {
      setTitle(deck.title)
      setCardIds(deck.cardIds)
      setCoverCardId(deck.coverCardId)
    }
  }, [deck])

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

  const handleSave = async () => {
    if (!deck) return
    setSaving(true)
    try {
      await updateDeck(deckId, {
        title: title.trim(),
        cardIds,
        coverCardId,
      })
      alert('Deck erfolgreich gespeichert!')
    } catch (err) {
      console.error('Failed to update deck:', err)
      alert('Fehler beim Speichern des Decks.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveCard = (id: string) => {
    setCardIds(prev => prev.filter(cardId => cardId !== id))
    if (coverCardId === id) {
      setCoverCardId('')
    }
  }

  const handleAddCard = () => {
    if (cardIds.length >= 10) {
      alert('Ein Deck kann maximal 10 Karten enthalten.')
      return
    }
    setIsSelecting(true)
    setIsSelectingCover(false)
  }

  const handleAddCover = () => {
    setIsSelecting(true)
    setIsSelectingCover(true)
  }

  const handleSelectCard = (id: string) => {
    if (isSelectingCover) {
      setCoverCardId(id)
      // Ensure cover card is in the deck
      setCardIds(prev => {
        if (prev.includes(id)) return prev
        if (prev.length < 10) return [...prev, id]
        
        // If deck is full, replace the old cover or the first card
        const newIds = [...prev]
        const oldCoverIndex = coverCardId ? newIds.indexOf(coverCardId) : -1
        if (oldCoverIndex !== -1) {
          newIds[oldCoverIndex] = id
        } else {
          newIds[0] = id
        }
        return newIds
      })
    } else {
      setCardIds(prev => (prev.includes(id) ? prev : [...prev, id]))
      if (!coverCardId) {
        setCoverCardId(id)
      }
    }
    setIsSelecting(false)
    setIsSelectingCover(false)
  }

  const coverCardData = useMemo(() => {
    if (!coverCardId) return null
    const teacher = globalTeachers.find(t => t.fullId === coverCardId || t.baseId === coverCardId)
    if (!teacher) return null

    const userData = findUserTeacherEntry(userTeachers, teacher)
    const globalIndex = globalTeachers.findIndex(t => t.fullId === teacher.fullId)

    return {
      id: teacher.fullId,
      setId: teacher.setId,
      fullId: teacher.fullId,
      name: teacher.name,
      rarity: teacher.rarity,
      variant: getBestVariant(userData?.variants),
      color: getTeacherRarityHex(teacher.rarity),
      cardNumber: (globalIndex + 1).toString().padStart(3, '0'),
      description: teacher.description,
      hp: teacher.hp,
      attacks: teacher.attacks,
    } as CardData
  }, [coverCardId, globalTeachers, userTeachers])

  const slots = useMemo(() => {
    const filledSlots = cardIds.map(id => {
      const teacher = globalTeachers.find(t => t.fullId === id || t.baseId === id)

      if (!teacher) return { id, type: 'empty' as const }

      const userData = findUserTeacherEntry(userTeachers, teacher)
      const globalIndex = globalTeachers.findIndex(t => t.fullId === teacher.fullId)


      const cardData: CardData = {
        id: teacher.fullId,
        setId: teacher.setId,
        fullId: teacher.fullId,
        name: teacher.name,
        rarity: teacher.rarity,
        variant: getBestVariant(userData?.variants),
        color: getTeacherRarityHex(teacher.rarity),
        cardNumber: (globalIndex + 1).toString().padStart(3, '0'),
        description: teacher.description,
        hp: teacher.hp,
        attacks: teacher.attacks,
      }

      return { id, type: 'filled' as const, data: cardData }
    })

    const emptySlots = Array.from({ length: 10 - filledSlots.length }).map((_, i) => ({
      id: `empty-${i}`,
      type: 'empty' as const
    }))

    return [...filledSlots, ...emptySlots]
  }, [cardIds, globalTeachers, userTeachers])

  if (loadingDecks || loadingGlobal || loadingUserTeachers) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-muted-foreground font-medium">Lade Deck Editor...</p>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-bold mb-4">Deck nicht gefunden.</p>
        <Button onClick={onBack}>Zurück zur Übersicht</Button>
      </div>
    )
  }

  if (isSelecting) {
    return (
      <DeckSelection 
        onSelect={handleSelectCard}
        onBack={() => {
          setIsSelecting(false)
          setIsSelectingCover(false)
        }}
        excludeCardIds={isSelectingCover ? [] : cardIds}
        includeCardIds={isSelectingCover ? cardIds : undefined}
        title={isSelectingCover ? "Cover wählen" : `Karte hinzufügen (${cardIds.length}/10)`}
      />
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tight">Deck bearbeiten</h2>
            <p className="text-sm text-muted-foreground">Stelle dein Team aus 10 Lehrern zusammen.</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-tighter gap-2 shadow-lg shadow-emerald-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </Button>
      </div>

      <div className="bg-muted/30 rounded-3xl p-4 sm:p-6 border border-white/10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
              Deck Name
            </label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Mein Power Team"
              className="bg-background/50 border-white/10 text-base sm:text-lg font-bold h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
              Status
            </label>
            <div className="h-11 flex items-center px-3 sm:px-4 bg-background/50 border border-white/10 rounded-xl">
              <span className={cn("text-xs sm:text-sm font-bold truncate", cardIds.length === 10 ? "text-emerald-500" : "text-amber-500")}>
                {cardIds.length}/10 Karten {cardIds.length === 10 ? "bereit" : "unvollständig"}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Cover Spot */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Deck Cover</h3>
          </div>
          
          <div className="flex flex-col items-center sm:items-start">
            {coverCardData ? (
              <div className="w-full max-w-[160px] aspect-[2.5/3.5] relative group">
                <TeacherCard 
                  data={coverCardData} 
                  styleVariant="modern-flat"
                  isFlippedExternally={true}
                  interactive={false}
                  isCover={true}
                  showDeckControls={true}
                  onRemove={() => handleAddCover()} // Re-select cover
                />
                <button 
                  onClick={handleAddCover}
                  className="absolute inset-0 z-50 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                >
                  <span className="text-[10px] font-black uppercase text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-lg">Ändern</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddCover}
                className="w-full max-w-[160px] aspect-[2.5/3.5] bg-background/50 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-background/80 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-500 transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-blue-500 transition-colors">
                  Cover wählen
                </span>
              </button>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground font-medium italic">
              Nur Karten aus deinem Team stehen als Cover zur Auswahl.
            </p>
          </div>
        </div>

        {/* Team Slots */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-1">
            <GraduationCap className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Team ({cardIds.length}/10)</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {slots.map((slot, index) => (
              <div key={slot.id} className="flex flex-col items-center gap-2">
                {slot.type === 'filled' ? (
                  <div className="w-full aspect-[2.5/3.5] relative group">
                    <TeacherCard 
                      data={slot.data!} 
                      styleVariant="modern-flat"
                      isFlippedExternally={true}
                      interactive={false}
                      isCover={coverCardId === slot.id}
                      showDeckControls={true}
                      onRemove={() => handleRemoveCard(slot.id)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={handleAddCard}
                    className="w-full aspect-[2.5/3.5] bg-background/50 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-background/80 hover:border-blue-500/50 transition-all group"
                    style={{ containerType: 'inline-size' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-500 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-blue-500 transition-colors">
                      Hinzufügen
                    </span>
                  </button>
                )}
                <span className="text-[10px] font-black text-muted-foreground/50 uppercase">
                  Slot {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
