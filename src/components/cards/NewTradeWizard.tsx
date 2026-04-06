'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, User, ArrowLeft, Send, AlertCircle, Check, Sparkles, HelpCircle, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { LootTeacher, TeacherRarity, CardVariant } from '@/types/database'
import { CardSelection } from '@/types/trades'
import { useCardTrade } from '@/hooks/useCardTrade'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { cn } from '@/lib/utils'

interface NewTradeWizardProps {
  onClose: () => void
  onTradeStarted: (tradeId: string) => void
}

type Step = 'select_target' | 'select_friend' | 'select_offer' | 'confirm';

const EXCLUDED_RARITIES: TeacherRarity[] = ['iconic', 'mythic'];
const VARIANTS: CardVariant[] = ['normal', 'holo', 'shiny', 'black_shiny_holo'];

export function NewTradeWizard({ onClose, onTradeStarted }: NewTradeWizardProps) {
  const [step, setStep] = useState<Step>('select_target')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State für die Auswahl
  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([])
  const [selectedTargetTeacherId, setSelectedTargetTeacherId] = useState<string>('')
  const [selectedTargetVariant, setSelectedTargetVariant] = useState<CardVariant>('normal')
  
  const [friendsWithCard, setFriendsWithCard] = useState<Array<{ id: string; name: string }>>([])
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null)
  
  const [selectedOfferCard, setSelectedOfferCard] = useState<CardSelection | null>(null)

  const { getFriendsWithCard, sendOffer } = useCardTrade()
  const { teachers: myInventory } = useUserTeachers()

  const teacherById = useMemo(() => new Map(globalTeachers.map((teacher) => [teacher.id, teacher])), [globalTeachers])

  const selectedTargetTeacher = useMemo(() => {
    if (!selectedTargetTeacherId) return null
    return teacherById.get(selectedTargetTeacherId) ?? null
  }, [selectedTargetTeacherId, teacherById])

  // 1. Alle Lehrer laden
  useEffect(() => {
    const loadConfig = async () => {
      const snap = await getDoc(doc(db, 'settings', 'sammelkarten'))
      if (snap.exists()) {
        const data = snap.data()
        setGlobalTeachers(data.loot_teachers || [])
      }
    }
    loadConfig()
  }, [])

  const availableTeachers = useMemo(() => {
    return globalTeachers
      .filter((teacher) => !EXCLUDED_RARITIES.includes(teacher.rarity))
      .sort((left, right) => left.name.localeCompare(right.name, 'de'))
  }, [globalTeachers])

  const resetDownstreamSelections = () => {
    setFriendsWithCard([])
    setSelectedFriend(null)
    setSelectedOfferCard(null)
  }

  // Eigene Karten, die zum Tausch passen
  const eligibleOfferCards = useMemo(() => {
    if (!selectedTargetTeacher || !myInventory) return []
    
    const results: CardSelection[] = []
    Object.entries(myInventory).forEach(([teacherId, data]) => {
      const teacher = teacherById.get(teacherId)
      if (!teacher) return
      
      // Muss gleiche Seltenheit haben und darf nicht Iconic/Mythic sein
      if (teacher.rarity === selectedTargetTeacher.rarity && !EXCLUDED_RARITIES.includes(teacher.rarity)) {
        // Muss die gleiche Folie haben
        const variantCount = data.variants?.[selectedTargetVariant] || 0
        if (variantCount > 0) {
          results.push({
            teacherId,
            variant: selectedTargetVariant,
            rarity: teacher.rarity,
            name: teacher.name
          })
        }
      }
    })
    return results
  }, [myInventory, selectedTargetTeacher, selectedTargetVariant, teacherById])

  const handleSelectTarget = async (teacher: LootTeacher, variant: CardVariant) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getFriendsWithCard(teacher.id, variant)
      setFriendsWithCard(result.friends)
      if (result.friends.length === 0) {
        setStep('select_target')
        setError(`Keiner deiner Freunde besitzt ${teacher.name} in '${variant}'.`)
      } else {
        setStep('select_friend')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Freunde.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrade = async () => {
    if (!selectedFriend || !selectedTargetTeacher || !selectedOfferCard) return
    
    setLoading(true)
    setError(null)
    try {
      const result = await sendOffer(
        selectedFriend.id,
        selectedOfferCard,
        {
          teacherId: selectedTargetTeacher.id,
          variant: selectedTargetVariant,
          rarity: selectedTargetTeacher.rarity,
          name: selectedTargetTeacher.name
        }
      )
      if (result.success) {
        onTradeStarted(result.tradeId)
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Starten des Trades.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'select_target':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Welche Karte suchst du?</h2>
              <p className="text-sm text-muted-foreground">Lehrer und Folie jetzt direkt über zwei Dropdowns auswählen.</p>
            </div>

            <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border">
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black opacity-40">Lehrer auswählen</p>
                <Select
                  value={selectedTargetTeacherId}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedTargetTeacherId(value)
                      resetDownstreamSelections()
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-2xl">
                    <SelectValue placeholder="Lehrer auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} • {teacher.rarity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black opacity-40">Folie auswählen</p>
                <Select
                  value={selectedTargetVariant}
                  onValueChange={(value) => {
                    setSelectedTargetVariant(value as CardVariant)
                    resetDownstreamSelections()
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-2xl">
                    <SelectValue placeholder="Folie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANTS.map((variant) => (
                      <SelectItem key={variant} value={variant}>
                        {variant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full font-black uppercase tracking-tight"
                onClick={() => selectedTargetTeacher && handleSelectTarget(selectedTargetTeacher, selectedTargetVariant)}
                disabled={loading || !selectedTargetTeacher}
              >
                {loading ? 'Prüfe Freunde...' : 'Weiter: Freunde finden'}
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )

      case 'select_friend':
        return (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setStep('select_target')} className="text-muted-foreground">
              <ArrowLeft className="mr-2 w-4 h-4" /> Zurück
            </Button>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Wer hat diese Karte?</h2>
              <p className="text-sm text-muted-foreground">Folgende Freunde besitzen {selectedTargetTeacher?.name} ({selectedTargetVariant}):</p>
            </div>

            <div className="grid gap-2">
              {friendsWithCard.map(friend => (
                <div 
                  key={friend.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:border-blue-300",
                    selectedFriend?.id === friend.id ? "border-blue-500 bg-blue-50/30" : "bg-card"
                  )}
                  onClick={() => setSelectedFriend(friend)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-bold uppercase tracking-tight">{friend.name}</p>
                  </div>
                  {selectedFriend?.id === friend.id && <Check className="text-blue-500 w-5 h-5" />}
                </div>
              ))}
            </div>

            {selectedFriend && (
              <Button 
                className="w-full font-black uppercase tracking-tight" 
                onClick={() => setStep('select_offer')}
              >
                Weiter: Dein Angebot wählen
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        )

      case 'select_offer':
        return (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setStep('select_friend')} className="text-muted-foreground">
              <ArrowLeft className="mr-2 w-4 h-4" /> Zurück
            </Button>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Was bietest du an?</h2>
              <p className="text-sm text-muted-foreground">
                Nur Karten der Seltenheit <strong>{selectedTargetTeacher?.rarity}</strong> und Folie <strong>{selectedTargetVariant}</strong> sind zulässig.
              </p>
            </div>

            {eligibleOfferCards.length === 0 ? (
              <div className="p-8 text-center bg-muted/30 rounded-3xl border-2 border-dashed space-y-4">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium opacity-60">Du hast leider keine passenden Karten zum Tauschen.</p>
                <Button variant="outline" size="sm" onClick={() => setStep('select_target')}>Wunschkarte ändern</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto p-1">
                {eligibleOfferCards.map(card => (
                  <div 
                    key={card.teacherId}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all cursor-pointer hover:border-blue-400 text-center bg-card",
                      selectedOfferCard?.teacherId === card.teacherId ? "border-blue-500 ring-2 ring-blue-500/20" : "border-muted"
                    )}
                    onClick={() => setSelectedOfferCard(card)}
                  >
                    <p className="font-bold text-xs uppercase truncate">{card.name || card.teacherId}</p>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 mt-1 uppercase">{card.rarity}</Badge>
                  </div>
                ))}
              </div>
            )}

            {selectedOfferCard && (
              <Button 
                className="w-full font-black uppercase tracking-tight" 
                onClick={() => setStep('confirm')}
              >
                Zusammenfassung prüfen
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-center">Tausch bestätigen</h2>
            </div>

            <div className="flex items-center justify-between gap-4 p-6 bg-muted/40 rounded-3xl border-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
              
              <div className="flex-1 flex flex-col items-center gap-2 relative z-10 text-center">
                <p className="text-[10px] uppercase font-black opacity-40">Dein Angebot</p>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border">
                  <Sparkles className="w-8 h-8 text-blue-400 opacity-30" />
                </div>
                <p className="font-black uppercase text-xs mt-1">{selectedOfferCard?.name}</p>
                <Badge variant="secondary" className="text-[8px]">{selectedOfferCard?.rarity} • {selectedOfferCard?.variant}</Badge>
              </div>

              <ArrowLeftRight className="w-8 h-8 text-muted-foreground relative z-10" />

              <div className="flex-1 flex flex-col items-center gap-2 relative z-10 text-center">
                <p className="text-[10px] uppercase font-black opacity-40">Dein Wunsch</p>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border">
                  <Sparkles className="w-8 h-8 text-purple-400 opacity-30" />
                </div>
                <p className="font-black uppercase text-xs mt-1">{selectedTargetTeacher?.name}</p>
                <Badge variant="secondary" className="text-[8px]">{selectedTargetTeacher?.rarity} • {selectedTargetVariant}</Badge>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <User className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-tight">Empfänger: {selectedFriend?.name}</p>
              </div>
              <p className="text-[10px] text-blue-600">
                Nach dem Absenden hat dein Freund 48 Stunden Zeit zu reagieren oder ein Gegenangebot zu machen.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-bold uppercase" onClick={() => setStep('select_offer')}>Zurück</Button>
              <Button className="flex-[2] font-black uppercase tracking-tight" onClick={handleStartTrade} disabled={loading}>
                {loading ? 'Wird gesendet...' : 'Angebot senden'}
                <Send className="ml-2 w-4 h-4" />
              </Button>
            </div>
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
            <div className="bg-blue-500 p-2 rounded-xl">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <span className="font-black uppercase tracking-tight">Tausch erstellen</span>
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
          {renderStep()}
        </div>
      </motion.div>
    </motion.div>
  )
}
