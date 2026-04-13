'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TeacherSpecCard } from '@/components/cards/TeacherSpecCard'
import { Button } from '@/components/ui/button'
import { Sparkles, Check } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface InitialCardSelectionProps {
  matchData: any
  currentUserId: string
  onClose: () => void
}

export function InitialCardSelection({
  matchData,
  currentUserId,
  onClose,
}: InitialCardSelectionProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get current player's cards
  const player = matchData.playerA?.uid === currentUserId ? matchData.playerA : matchData.playerB
  
  if (!player) {
    return null
  }

  const activeCard = player.activeCard || null
  const benchCards = player.bench || []
  const reserveCards = player.reserve || []
  
  const allAvailableCards = [activeCard, ...benchCards, ...reserveCards].filter(Boolean)
  const selectedCard = allAvailableCards.find((c: any) => c.instanceId === selectedInstanceId)
  
  // Set default selection on first load
  if (!selectedInstanceId && activeCard?.instanceId) {
    setSelectedInstanceId(activeCard.instanceId)
  }

  const handleConfirm = async () => {
    if (!selectedCard || isSubmitting) return
    
    // If the selected card is already the active card, just close
    if (selectedCard.instanceId === activeCard?.instanceId) {
      onClose()
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const selectInitialCard = httpsCallable(functions, 'selectInitialCard')
      await selectInitialCard({
        matchId: matchData.id,
        selectedCardInstanceId: selectedCard.instanceId
      })
      onClose()
    } catch (err: any) {
      console.error('Error selecting initial card:', err)
      setError(err.message || 'Fehler beim Auswählen der Karte')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-3xl space-y-6 bg-neutral-900/95 border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-black text-white">Startformation</h2>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm text-white/60">
            Wähle deine aktive Karte zur Kampfvorbereitung
          </p>
        </div>

        {/* Card Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {allAvailableCards.map((card: any) => {
            // Prepare card data for TeacherSpecCard with full compatibility
            const normalizedCardId = card.cardId?.includes(':') ? card.cardId.split(':')[1] : card.cardId;
            
            const cardData: any = {
              // Core properties
              id: normalizedCardId || card.id || '',
              cardId: normalizedCardId || card.cardId || '',
              instanceId: card.instanceId || '',
              name: card.name || '',
              
              // Combat properties
              hp: card.hp || card.maxHp || 100,
              maxHp: card.maxHp || card.hp || 100,
              attacks: card.attacks || [],
              
              // Registry properties with safe defaults
              rarity: card.rarity || 'common',
              variant: card.variant || 0,
              level: card.level || 1,
              description: card.description || '',
              color: card.color || '#ffffff',
              photoUrl: card.photoUrl || '',
              type: card.type || '',
              cardNumber: card.cardNumber || '',
            };
            
            return (
            <motion.button
              key={card.instanceId}
              onClick={() => setSelectedInstanceId(card.instanceId)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                selectedInstanceId === card.instanceId
                  ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/30'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="aspect-[3/4] bg-black/40">
                <TeacherSpecCard data={cardData} isCombat compact hideAttacks />
              </div>
              
              {/* Selection checkmark */}
              {selectedInstanceId === card.instanceId && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 bg-amber-500 rounded-full p-1 text-black"
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              )}
              
              {/* Active card badge */}
              {card.instanceId === activeCard?.instanceId && (
                <div className="absolute bottom-2 left-2 bg-green-500/80 text-white text-[10px] font-black px-2 py-1 rounded">
                  AKTIV
                </div>
              )}
            </motion.button>
            );
          })}
        </div>

        {/* Preview */}
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-lg bg-white/5 border border-white/10 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{selectedCard.name}</h3>
                <div className="flex gap-4 text-xs text-white/60 mt-1">
                  <span>KP: {selectedCard.hp}/{selectedCard.maxHp || selectedCard.hp}</span>
                  <span>Selectivity: {selectedCard.attacks?.length || 0}</span>
                </div>
              </div>
            </div>
            
            {selectedCard.attacks?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedCard.attacks.map((attack: any, idx: number) => (
                  <div key={idx} className="text-xs bg-black/30 rounded px-2 py-1.5">
                    <div className="font-semibold text-white">{attack.name}</div>
                    <div className="text-white/60">{attack.damage} DMG</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-lg p-3"
          >
            {error}
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            disabled={!selectedCard || isSubmitting}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Bestätigen'}
          </Button>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            variant="outline"
            className="px-6"
          >
            Abbrechen
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
