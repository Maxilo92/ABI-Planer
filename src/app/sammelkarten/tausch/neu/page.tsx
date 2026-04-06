'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowLeftRight, Check, ChevronRight, HelpCircle, Send, Sparkles, User } from 'lucide-react'
import Link from 'next/link'
import { doc, getDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useCardTrade } from '@/hooks/useCardTrade'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { LootTeacher, TeacherRarity, CardVariant } from '@/types/database'
import { CardSelection } from '@/types/trades'
import { CardData, CardVariant as VisualCardVariant } from '@/types/cards'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { TeacherSpecCard } from '@/components/cards/TeacherSpecCard'
import { cn } from '@/lib/utils'

type Step = 'select_target' | 'select_friend' | 'select_offer' | 'confirm'

const EXCLUDED_RARITIES: TeacherRarity[] = ['iconic']
const TRADEABLE_VARIANTS: CardVariant[] = ['normal', 'holo', 'shiny']
const RARITY_SORT_DESC: Record<TeacherRarity, number> = {
  iconic: 5,
  legendary: 4,
  mythic: 3,
  epic: 2,
  rare: 1,
  common: 0,
}

function getTeacherRarityHex(rarity: TeacherRarity) {
  switch (rarity) {
    case 'common':
      return '#64748b'
    case 'rare':
      return '#10b981'
    case 'epic':
      return '#9333ea'
    case 'mythic':
      return '#dc2626'
    case 'legendary':
      return '#f59e0b'
    case 'iconic':
      return '#000000'
    default:
      return '#64748b'
  }
}

function mapTeacherToCardData(
  teacher: LootTeacher,
  cardNumber: number,
  variant: VisualCardVariant,
): CardData {
  return {
    id: teacher.id,
    name: teacher.name,
    rarity: teacher.rarity,
    variant,
    color: getTeacherRarityHex(teacher.rarity),
    cardNumber: cardNumber.toString().padStart(3, '0'),
    description: teacher.description,
    hp: teacher.hp,
    attacks: teacher.attacks,
  }
}

export default function NewTradePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const { isTradingEnabled, getFriendsWithCard, sendOffer, currentUserId } = useCardTrade()
  const { teachers: myInventory, loading: inventoryLoading } = useUserTeachers()

  const [step, setStep] = useState<Step>('select_target')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([])
  const [teacherSearch, setTeacherSearch] = useState('')
  const [selectedTargetTeacherId, setSelectedTargetTeacherId] = useState<string>('')
  const [selectedTargetVariant, setSelectedTargetVariant] = useState<CardVariant>('normal')
  const [specCardTeacherId, setSpecCardTeacherId] = useState<string | null>(null)

  const [friendsWithCard, setFriendsWithCard] = useState<Array<{ id: string; name: string }>>([])
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null)
  const [selectedOfferCard, setSelectedOfferCard] = useState<CardSelection | null>(null)

  useEffect(() => {
    if (isTradingEnabled === false) {
      router.replace('/sammelkarten/tausch')
    }
  }, [isTradingEnabled, router])

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

  const teacherById = useMemo(() => {
    return new Map(globalTeachers.map((teacher) => [teacher.id, teacher]))
  }, [globalTeachers])

  const teacherOrderMap = useMemo(() => {
    return new Map(globalTeachers.map((teacher, index) => [teacher.id, index + 1]))
  }, [globalTeachers])

  const getCardDataForTeacher = (teacher: LootTeacher, variant: VisualCardVariant) => {
    return mapTeacherToCardData(
      teacher,
      teacherOrderMap.get(teacher.id) || 0,
      variant,
    )
  }

  const selectedTargetTeacher = useMemo(() => {
    if (!selectedTargetTeacherId) return null
    return teacherById.get(selectedTargetTeacherId) ?? null
  }, [selectedTargetTeacherId, teacherById])

  const totalCards = useMemo(() => {
    if (myInventory) {
      return Object.values(myInventory).reduce((sum, entry) => sum + (entry?.count || 0), 0)
    }
    return profile?.booster_stats?.total_cards || 0
  }, [myInventory, profile?.booster_stats?.total_cards])

  const canTrade = totalCards >= 100

  const filteredTeachers = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase()

    const tradeablePool = globalTeachers.filter((teacher) => !EXCLUDED_RARITIES.includes(teacher.rarity))

    const sorted = [...tradeablePool].sort((a, b) => {
      const rarityDiff = (RARITY_SORT_DESC[b.rarity] ?? 0) - (RARITY_SORT_DESC[a.rarity] ?? 0)
      if (rarityDiff !== 0) return rarityDiff
      return a.name.localeCompare(b.name, 'de')
    })
    if (!query) return sorted

    return sorted.filter((teacher) => {
      return teacher.name.toLowerCase().includes(query)
    })
  }, [globalTeachers, teacherSearch])

  const eligibleOfferCards = useMemo(() => {
    if (!selectedTargetTeacher || !myInventory) return []

    const results: CardSelection[] = []
    Object.entries(myInventory).forEach(([teacherId, data]) => {
      const teacher = teacherById.get(teacherId)
      if (!teacher) return

      if (teacher.rarity === selectedTargetTeacher.rarity && !EXCLUDED_RARITIES.includes(teacher.rarity)) {
        const variantCount = data.variants?.[selectedTargetVariant] || 0
        if (variantCount > 0) {
          results.push({
            teacherId,
            variant: selectedTargetVariant,
            rarity: teacher.rarity,
            name: teacher.name,
          })
        }
      }
    })

    return results.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
  }, [myInventory, selectedTargetTeacher, selectedTargetVariant, teacherById])

  const resetDownstreamSelections = () => {
    setFriendsWithCard([])
    setSelectedFriend(null)
    setSelectedOfferCard(null)
    setError(null)
  }

  const handleSelectTarget = async () => {
    if (!selectedTargetTeacher) return

    setLoading(true)
    setError(null)

    try {
      const result = await getFriendsWithCard(selectedTargetTeacher.id, selectedTargetVariant)
      setFriendsWithCard(result.friends)

      if (result.friends.length === 0) {
        setError(`Keiner deiner Freunde besitzt ${selectedTargetTeacher.name} in '${selectedTargetVariant}'.`)
        setStep('select_target')
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

    if (!currentUserId) {
      setError('Noch nicht angemeldet. Bitte warte einen Moment und versuche es erneut.')
      return
    }

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
          name: selectedTargetTeacher.name,
        }
      )

      if (result.success) {
        router.push('/sammelkarten/tausch')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Starten des Trades.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-5xl mx-auto px-3 py-4 sm:px-4 md:p-6 space-y-5 min-h-screen pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/sammelkarten/tausch">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-7 h-7 text-blue-500" />
              Neuer Tausch
            </h1>
            <p className="text-sm text-muted-foreground">Eigene Seite mit Mini-Album und Folien-Auswahl.</p>
          </div>
        </div>
        <Badge variant="outline" className="font-bold uppercase tracking-tight w-fit">Karten: {totalCards}</Badge>
      </div>

      {!canTrade && !inventoryLoading && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800 font-medium">
              Du benötigst mindestens 100 Karten zum Tauschen. Aktuell: {totalCards}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {step === 'select_target' && (
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-xl font-black uppercase tracking-tight">1. Wunschkarte wählen</CardTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Lehrer im Album suchen..."
              />
              <Select
                value={selectedTargetVariant}
                onValueChange={(value) => {
                  setSelectedTargetVariant(value as CardVariant)
                  resetDownstreamSelections()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Folie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {TRADEABLE_VARIANTS.map((variant) => (
                    <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="max-h-[48vh] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredTeachers.map((teacher) => {
                const isBlocked = EXCLUDED_RARITIES.includes(teacher.rarity)
                const isSelected = selectedTargetTeacherId === teacher.id
                const isSpecOpen = specCardTeacherId === teacher.id
                const cardData = mapTeacherToCardData(
                  teacher,
                  teacherOrderMap.get(teacher.id) || 0,
                  selectedTargetVariant as VisualCardVariant,
                )

                return (
                  <button
                    key={teacher.id}
                    type="button"
                    disabled={isBlocked}
                    onClick={() => {
                      const didChangeTeacher = selectedTargetTeacherId !== teacher.id
                      setSelectedTargetTeacherId(teacher.id)
                      setSpecCardTeacherId((prev) => (prev === teacher.id ? null : teacher.id))
                      if (didChangeTeacher) {
                        resetDownstreamSelections()
                      }
                    }}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all bg-card',
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-muted hover:border-blue-300',
                      isBlocked && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="w-full aspect-[2.5/3.5] mb-2 [perspective:1200px] max-w-[240px] mx-auto sm:max-w-none">
                      <div
                        className="relative w-full h-full transition-transform duration-500 preserve-3d"
                        style={{ transform: isSpecOpen ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                      >
                        <div className="absolute inset-0 backface-hidden">
                          <TeacherCard
                            data={cardData}
                            className="w-full h-full"
                            styleVariant="modern-flat"
                            isFlippedExternally={true}
                            interactive={false}
                          />
                        </div>
                        <div className="absolute inset-0 backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                          <TeacherSpecCard
                            data={cardData}
                            className="w-full h-full"
                            styleVariant="modern-flat"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-black uppercase truncate">{teacher.name}</p>
                    <Badge variant="secondary" className="mt-1 text-[9px] uppercase">{teacher.rarity}</Badge>
                    {isBlocked && <p className="text-[9px] mt-1 text-muted-foreground">Nicht tauschbar</p>}
                  </button>
                )
              })}
            </div>

            <Button
              className="w-full font-black uppercase tracking-tight"
              onClick={handleSelectTarget}
              disabled={loading || !selectedTargetTeacher || !canTrade}
            >
              {loading ? 'Suche Freunde...' : 'Weiter zu Freunden'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'select_friend' && (
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-black uppercase tracking-tight">2. Freund wählen</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedTargetTeacher?.name} ({selectedTargetVariant}) ist bei diesen Freunden vorhanden.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {friendsWithCard.map((friend) => (
              <button
                key={friend.id}
                type="button"
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                  selectedFriend?.id === friend.id ? 'border-blue-500 bg-blue-50/30' : 'border-muted hover:border-blue-300'
                )}
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-bold uppercase tracking-tight text-sm">{friend.name}</p>
                </div>
                {selectedFriend?.id === friend.id && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('select_target')}>Zurück</Button>
              <Button disabled={!selectedFriend} onClick={() => setStep('select_offer')}>
                Weiter
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'select_offer' && (
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-black uppercase tracking-tight">3. Dein Angebot</CardTitle>
            <p className="text-sm text-muted-foreground">
              Du brauchst eine Karte mit Seltenheit {selectedTargetTeacher?.rarity} und Folie {selectedTargetVariant}.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibleOfferCards.length === 0 ? (
              <div className="p-8 text-center bg-muted/30 rounded-3xl border-2 border-dashed space-y-3">
                <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Keine passende Karte in deinem Inventar gefunden.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[46vh] overflow-y-auto pr-1">
                {eligibleOfferCards.map((card) => (
                  (() => {
                    const teacher = teacherById.get(card.teacherId)
                    const cardData = teacher ? getCardDataForTeacher(teacher, card.variant as VisualCardVariant) : null

                    return (
                  <button
                    key={card.teacherId}
                    type="button"
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all bg-card',
                      selectedOfferCard?.teacherId === card.teacherId ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-muted hover:border-blue-300'
                    )}
                    onClick={() => setSelectedOfferCard(card)}
                  >
                    <div className="w-full aspect-[2.5/3.5] mb-2 [perspective:1200px] max-w-[240px] mx-auto sm:max-w-none">
                      {cardData ? (
                        <TeacherCard
                          data={cardData}
                          className="w-full h-full"
                          styleVariant="modern-flat"
                          isFlippedExternally={true}
                          interactive={false}
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl border bg-muted/30 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-black uppercase truncate">{card.name || card.teacherId}</p>
                    <Badge variant="outline" className="text-[9px] mt-1 uppercase">{card.rarity} • {card.variant}</Badge>
                  </button>
                    )
                  })()
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setStep('select_friend')}>Zurück</Button>
              <Button disabled={!selectedOfferCard} onClick={() => setStep('confirm')}>
                Weiter
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase tracking-tight">4. Bestätigen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black opacity-40">Du gibst</p>
                {selectedOfferCard && teacherById.get(selectedOfferCard.teacherId) && (
                  <TeacherCard
                    data={getCardDataForTeacher(
                      teacherById.get(selectedOfferCard.teacherId)!,
                      selectedOfferCard.variant as VisualCardVariant,
                    )}
                    className="w-full max-w-[240px] mx-auto sm:max-w-[280px]"
                    styleVariant="modern-flat"
                    isFlippedExternally={true}
                    interactive={false}
                  />
                )}
                <p className="font-bold text-sm uppercase mt-1">{selectedOfferCard?.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{selectedOfferCard?.rarity} • {selectedOfferCard?.variant}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black opacity-40">Du erhältst</p>
                {selectedTargetTeacher && (
                  <TeacherCard
                    data={getCardDataForTeacher(selectedTargetTeacher, selectedTargetVariant as VisualCardVariant)}
                    className="w-full max-w-[240px] mx-auto sm:max-w-[280px]"
                    styleVariant="modern-flat"
                    isFlippedExternally={true}
                    interactive={false}
                  />
                )}
                <p className="font-bold text-sm uppercase mt-1">{selectedTargetTeacher?.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{selectedTargetTeacher?.rarity} • {selectedTargetVariant}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Empfänger: <strong>{selectedFriend?.name}</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setStep('select_offer')}>Zurück</Button>
              <Button className="font-black uppercase tracking-tight" onClick={handleStartTrade} disabled={loading || !currentUserId}>
                {loading ? 'Sende...' : 'Angebot senden'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
