'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeftRight, Check, XCircle, RotateCcw, AlertCircle, Info, User, Sparkles, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardTrade, CardSelection } from '@/types/trades'
import { useCardTrade } from '@/hooks/useCardTrade'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { LootTeacher, CardVariant } from '@/types/database'
import { cn } from '@/lib/utils'
import { useCountdown } from '@/hooks/useCountdown'

function TradeCountdown({ targetDate }: { targetDate: any }) {
  const dateStr = targetDate?.toDate ? targetDate.toDate().toISOString() : (targetDate instanceof Date ? targetDate.toISOString() : targetDate)
  const { days, hours, minutes, seconds } = useCountdown(dateStr)
  
  const isExpired = days === 0 && hours === 0 && minutes === 0 && seconds === 0
  
  if (isExpired) return <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Abgelaufen</span>

  return (
    <span className={cn(
      "font-mono font-bold tracking-tight text-xs tabular-nums",
      days === 0 && hours < 6 ? "text-red-500 animate-pulse" : "text-blue-500"
    )}>
      Verfällt in: {days > 0 && `${days}d `}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </span>
  )
}

interface TradeNegotiationModalProps {
  trade: CardTrade
  onClose: () => void
}

export function TradeNegotiationModal({ trade, onClose }: TradeNegotiationModalProps) {
  const { currentUserId, acceptTrade, declineTrade, cancelTrade, counterOffer } = useCardTrade()
  const { teachers: myInventory } = useUserTeachers()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setStep] = useState<'view' | 'counter_select_my' | 'counter_select_their'>('view')
  
  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([])
  const [tempOfferedCard, setTempOfferedCard] = useState<CardSelection>(trade.offeredCard)
  const [tempRequestedCard, setTempRequestedCard] = useState<CardSelection>(trade.requestedCard)

  const isMyTurn = trade.lastActorId !== currentUserId
  const isSender = trade.senderId === currentUserId
  const opponentName = isSender ? trade.receiverName : trade.senderName
  
  const isExpired = trade.expiresAt?.toDate 
    ? trade.expiresAt.toDate().getTime() < Date.now() 
    : (trade.expiresAt instanceof Date ? trade.expiresAt.getTime() < Date.now() : false)

  // Wer bietet aktuell was?
  const currentOffer = isSender ? trade.offeredCard : trade.requestedCard
  const currentRequest = isSender ? trade.requestedCard : trade.offeredCard

  useEffect(() => {
    const loadConfig = async () => {
      const snap = await getDoc(doc(db, 'settings', 'sammelkarten'))
      if (snap.exists()) setGlobalTeachers(snap.data().loot_teachers || [])
    }
    loadConfig()
  }, [])

  const handleAccept = async () => {
    setLoading(true)
    try {
      await acceptTrade(trade.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Annehmen.')
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      await declineTrade(trade.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ablehnen.')
    } finally {
      setLoading(false)
    }
  }

  const handleCounter = async () => {
    setLoading(true)
    try {
      // Beim Counter werden die Rollen getauscht
      // Wenn ich Sender bin, ist tempOfferedCard meine neue Karte
      await counterOffer(trade.id, tempOfferedCard, tempRequestedCard)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Gegenangebot.')
    } finally {
      setLoading(false)
    }
  }

  const eligibleMyCards = useMemo(() => {
    const results: CardSelection[] = []
    if (!myInventory) return results
    Object.entries(myInventory).forEach(([teacherId, data]) => {
      const teacher = globalTeachers.find(t => t.id === teacherId)
      if (!teacher) return
      if (teacher.rarity === trade.offeredCard.rarity) {
        const variantCount = data.variants?.[trade.offeredCard.variant as CardVariant] || 0
        if (variantCount > 0) {
          results.push({
            teacherId,
            variant: trade.offeredCard.variant,
            rarity: teacher.rarity,
            name: teacher.name
          })
        }
      }
    })
    return results
  }, [myInventory, trade, globalTeachers])

  const renderContent = () => {
    if (mode === 'view') {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-4 p-6 bg-muted/40 rounded-3xl border-2 relative overflow-hidden">
            <div className="flex-1 flex flex-col items-center gap-2 text-center">
              <p className="text-[10px] uppercase font-black opacity-40">Du gibst</p>
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border">
                <Sparkles className="w-8 h-8 text-blue-400 opacity-20" />
              </div>
              <p className="font-black uppercase text-xs mt-1">{isSender ? trade.offeredCard.name : trade.requestedCard.name}</p>
              <Badge variant="secondary" className="text-[8px]">{isSender ? trade.offeredCard.rarity : trade.requestedCard.rarity}</Badge>
            </div>

            <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />

            <div className="flex-1 flex flex-col items-center gap-2 text-center">
              <p className="text-[10px] uppercase font-black opacity-40">Du erhältst</p>
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border">
                <Sparkles className="w-8 h-8 text-purple-400 opacity-20" />
              </div>
              <p className="font-black uppercase text-xs mt-1">{isSender ? trade.requestedCard.name : trade.offeredCard.name}</p>
              <Badge variant="secondary" className="text-[8px]">{isSender ? trade.requestedCard.rarity : trade.offeredCard.rarity}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-muted/30 rounded-2xl border text-center space-y-1">
              <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Status</p>
              <p className="font-bold text-sm">{trade.status === 'pending' ? 'Warten auf Reaktion' : 'Verhandlung läuft'}</p>
              <div className="flex items-center justify-center gap-2 mt-1 py-1.5 bg-white/50 rounded-lg border border-dashed mx-auto w-fit px-4">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <TradeCountdown targetDate={trade.expiresAt} />
              </div>
              <p className="text-[10px] text-muted-foreground italic mt-1">Runde {trade.roundCount + 1} von 3</p>
            </div>

            {isMyTurn && !isExpired ? (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 font-bold uppercase text-red-600 border-red-200 hover:bg-red-50" onClick={handleDecline} disabled={loading}>
                  <XCircle className="w-4 h-4 mr-2" /> Ablehnen
                </Button>
                <Button className="h-12 font-black uppercase tracking-tight bg-green-600 hover:bg-green-700" onClick={handleAccept} disabled={loading}>
                  <Check className="w-4 h-4 mr-2" /> Annehmen
                </Button>
                {trade.roundCount < 2 && (
                  <Button variant="secondary" className="col-span-2 h-12 font-bold uppercase" onClick={() => setStep('counter_select_my')} disabled={loading}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Gegenangebot machen
                  </Button>
                )}
              </div>
            ) : isExpired ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-2 items-center text-center text-red-700">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">Dieser Tausch ist abgelaufen</p>
                <p className="text-[10px] font-medium leading-tight px-4">Da die 48h Frist überschritten wurde, ist dieser Tausch nicht mehr gültig.</p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-center text-blue-700">
                <Clock className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">Warten auf {opponentName}...</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (mode === 'counter_select_my') {
      return (
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-black uppercase tracking-tight">Was möchtest du stattdessen geben?</h2>
            <p className="text-xs text-muted-foreground">Wähle eine andere Karte aus deinem Inventar ({trade.offeredCard.rarity} • {trade.offeredCard.variant}).</p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto p-1">
            {eligibleMyCards.map(card => (
              <div 
                key={card.teacherId}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all cursor-pointer hover:border-blue-400 text-center bg-card",
                  (isSender ? tempOfferedCard : tempRequestedCard).teacherId === card.teacherId ? "border-blue-500 ring-2 ring-blue-500/20" : "border-muted"
                )}
                onClick={() => {
                  if (isSender) setTempOfferedCard(card)
                  else setTempRequestedCard(card)
                  setStep('view') // Vereinfachung: Direkt zurück
                }}
              >
                <p className="font-bold text-xs uppercase truncate">{card.name}</p>
                <Badge variant="outline" className="text-[8px] px-1 py-0 mt-1 uppercase">{card.rarity}</Badge>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full font-bold uppercase" onClick={() => setStep('view')}>Abbrechen</Button>
          
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium leading-tight">
              Hinweis: In dieser Version kannst du nur dein eigenes Angebot anpassen. Die geforderte Karte des Partners bleibt gleich.
            </p>
          </div>

          <Button className="w-full font-black uppercase tracking-tight" onClick={handleCounter} disabled={loading}>
            Gegenangebot absenden
          </Button>
        </div>
      )
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-background w-full max-w-lg rounded-[2.5rem] border-4 border-black shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="bg-purple-500 p-2 rounded-xl">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <span className="font-black uppercase tracking-tight">Tausch verhandeln</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-center text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
          {renderContent()}
        </div>
      </motion.div>
    </motion.div>
  )
}
