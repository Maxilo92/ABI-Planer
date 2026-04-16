'use client'

import React from 'react'
import { useDecks } from '@/hooks/useDecks'
import { DeckCard } from './DeckCard'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { usePopupManager } from '@/modules/popup/usePopupManager'

interface DeckGridProps {
  onEditDeck: (deckId: string) => void
  onCreateDeck: () => void
}

export const DeckGrid: React.FC<DeckGridProps> = ({ onEditDeck, onCreateDeck }) => {
  const { decks, loading, deleteDeck } = useDecks()
  const { confirm } = usePopupManager()

  const handleDelete = async (deckId: string) => {
    const confirmed = await confirm({
      title: 'Deck löschen?',
      content: 'Möchtest du dieses Deck wirklich löschen?',
      priority: 'high',
      confirmLabel: 'Deck löschen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return

    try {
      await deleteDeck(deckId)
    } catch (err) {
      console.error('Failed to delete deck:', err)
      alert('Fehler beim Löschen des Decks.')
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-black uppercase tracking-tight">Deine Decks</h2>
        </div>
        <Button 
          onClick={onCreateDeck}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Neues Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-white/10">
          <p className="text-muted-foreground font-medium mb-4">Du hast noch keine Decks erstellt.</p>
          <Button variant="outline" onClick={onCreateDeck} className="gap-2">
            <Plus className="w-4 h-4" />
            Erstes Deck erstellen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {decks.map((deck) => (
            <DeckCard 
              key={deck.id} 
              deck={deck} 
              onEdit={onEditDeck} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
