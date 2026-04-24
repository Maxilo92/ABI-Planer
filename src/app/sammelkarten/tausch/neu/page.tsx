'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowLeftRight, Check, ChevronRight, HelpCircle, Lock, Search, Send, Sparkles, User } from 'lucide-react'
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
  const { isTradingEnabled, getFriendsWithCard, getFriendsAvailableCards, sendOffer, currentUserId } = useCardTrade()
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
  const [availableFriendCardIds, setAvailableFriendCardIds] = useState<string[]>([])
  const [loadingFriendCards, setLoadingFriendCards] = useState(false)
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

  // Fetch available cards from friends whenever variant changes
  useEffect(() => {
    const loadAvailable = async () => {
      if (!currentUserId) return
      setLoadingFriendCards(true)
      try {
        const result = await getFriendsAvailableCards(selectedTargetVariant)
        setAvailableFriendCardIds(result.availableCardIds)
      } catch (err) {
        console.error('Failed to load available friend cards:', err)
      } finally {
        setLoadingFriendCards(false)
      }
    }
    loadAvailable()
  }, [selectedTargetVariant, currentUserId, getFriendsAvailableCards])

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

  const processedTeachers = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase()
    const tradeablePool = globalTeachers.filter((teacher) => !EXCLUDED_RARITIES.includes(teacher.rarity))

    const filtered = query 
      ? tradeablePool.filter(t => t.name.toLowerCase().includes(query))
      : tradeablePool

    const sorted = [...filtered].sort((a, b) => {
      const rarityDiff = (RARITY_SORT_DESC[b.rarity] ?? 0) - (RARITY_SORT_DESC[a.rarity] ?? 0)
      if (rarityDiff !== 0) return rarityDiff
      return a.name.localeCompare(b.name, 'de')
    })

    // Split into available and unavailable
    const available: LootTeacher[] = []
    const unavailable: LootTeacher[] = []

    sorted.forEach(t => {
      // Check if friend has it. Note: IDs in availableFriendCardIds are normalized (prefix:id)
      const hasFriend = availableFriendCardIds.includes(`teacher_vol1:${t.id}`) || 
                        availableFriendCardIds.includes(t.id)
      
      if (hasFriend) {
        available.push(t)
      } else {
        unavailable.push(t)
      }
    })

    return { available, unavailable }
  }, [globalTeachers, teacherSearch, availableFriendCardIds])

  const eligibleOfferCards = useMemo(() => {
    if (!selectedTargetTeacher || !myInventory) return []

    const results: CardSelection[] = []
    Object.entries(myInventory).forEach(([fullId, data]) => {
      // Use cardRegistry to handle potential prefixes/legacy IDs
      const teacher = teacherById.get(fullId) || 
                      (fullId.includes(':') ? teacherById.get(fullId.split(':')[1]) : null);
                      
      if (!teacher) return

      if (teacher.rarity === selectedTargetTeacher.rarity && !EXCLUDED_RARITIES.includes(teacher.rarity)) {
        const variantCount = data.variants?.[selectedTargetVariant] || 0
        if (variantCount > 0) {
          results.push({
            teacherId: fullId,
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

  const renderCardGrid = (teachers: LootTeacher[], emptyMessage: string, title?: string, icon?: any) => {
    if (teachers.length === 0 && !title) return null;
    
    return (
      <div className="space-y-4">
        {title && (
          <div className="flex items-center gap-2 border-b pb-2">
            {icon}
            <h3 className="text-sm font-black uppercase tracking-wider">{title} ({teachers.length})</h3>
          </div>
        )}
        
        {teachers.length === 0 ? (
          <div className="py-10 text-center bg-muted/20 rounded-xl border-2 border-dashed">
            <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {teachers.map((teacher) => {
              const isSelected = selectedTargetTeacherId === teacher.id
              const isSpecOpen = specCardTeacherId === teacher.id
              const cardData = mapTeacherToCardData(
                teacher,
                teacherOrderMap.get(teacher.id) || 0,
                selectedTargetVariant as VisualCardVariant,
              )

              return (
                <div key={teacher.id} className="flex flex-col items-center">
                  <div
                    onClick={() => {
                      const didChangeTeacher = selectedTargetTeacherId !== teacher.id
                      setSelectedTargetTeacherId(teacher.id)
                      setSpecCardTeacherId((prev) => (prev === teacher.id ? null : teacher.id))
                      if (didChangeTeacher) {
                        resetDownstreamSelections()
                      }
                    }}
                    className={cn(
                      'relative transition-all duration-300 transform group w-full aspect-[2.5/3.5] overflow-visible rounded-xl cursor-pointer',
                      isSelected ? 'scale-[1.05] ring-4 ring-blue-500 z-10' : 'hover:scale-[1.02] active:scale-95'
                    )}
                  >
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
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg z-20">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center w-full">
                    <p className="text-[10px] font-black uppercase truncate px-1">{teacher.name}</p>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase opacity-70">
                      {teacher.rarity}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-3 py-4 sm:px-4 md:p-6 space-y-5 min-h-screen pb-20">
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
            <p className="text-sm text-muted-foreground">Wähle eine Karte aus dem Album aus.</p>
          </div>
        </div>
        <Badge variant="outline" className="font-bold uppercase tracking-tight w-fit">Karten: {totalCards}</Badge>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {step === 'select_target' && (
        <div className="space-y-8">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black uppercase tracking-tight">1. Wunschkarte wählen</CardTitle>
                <div className="flex items-center gap-2">
                  {loadingFriendCards && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      Prüfe Freunde...
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Lehrer suchen..."
                    className="pl-9"
                  />
                </div>
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
                      <SelectItem key={variant} value={variant}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          {variant.charAt(0).toUpperCase() + variant.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-12">
            {renderCardGrid(
              processedTeachers.available, 
              "Aktuell besitzt keiner deiner Freunde eine passende Karte in dieser Folie.",
              "Bei Freunden verfügbar",
              <Check className="w-4 h-4 text-green-500" />
            )}

            {renderCardGrid(
              processedTeachers.unavailable, 
              "Keine weiteren Karten gefunden.",
              "Nicht bei Freunden gefunden",
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50">
            <div className="container max-w-7xl mx-auto flex justify-end">
              <Button
                size="lg"
                className="font-black uppercase tracking-tight min-w-[200px] shadow-xl shadow-blue-500/20"
                onClick={handleSelectTarget}
                disabled={loading || !selectedTargetTeacher || !canTrade}
              >
                {loading ? 'Suche Freunde...' : 'Tauschpartner wählen'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
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
              Wähle eine deiner Karten mit Seltenheit {selectedTargetTeacher?.rarity} und Folie {selectedTargetVariant}.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibleOfferCards.length === 0 ? (
              <div className="p-12 text-center bg-muted/30 rounded-3xl border-2 border-dashed space-y-3">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Keine passende Karte in deinem Inventar gefunden.</p>
                <Button variant="outline" size="sm" onClick={() => setStep('select_target')}>Andere Karte suchen</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-1">
                {eligibleOfferCards.map((card) => {
                  const teacher = teacherById.get(card.teacherId) || 
                                  (card.teacherId.includes(':') ? teacherById.get(card.teacherId.split(':')[1]) : null);
                  const cardData = teacher ? getCardDataForTeacher(teacher, card.variant as VisualCardVariant) : null
                  const isSelected = selectedOfferCard?.teacherId === card.teacherId

                  if (!cardData || !teacher) return null;

                  return (
                    <div key={card.teacherId} className="flex flex-col items-center">
                      <div
                        onClick={() => setSelectedOfferCard(card)}
                        className={cn(
                          'relative transition-all duration-300 transform group w-full aspect-[2.5/3.5] overflow-visible rounded-xl cursor-pointer',
                          isSelected ? 'scale-[1.05] ring-4 ring-blue-500 z-10' : 'hover:scale-[1.02] active:scale-95'
                        )}
                      >
                        <TeacherCard
                          data={cardData}
                          className="w-full h-full"
                          styleVariant="modern-flat"
                          isFlippedExternally={true}
                          interactive={false}
                        />
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg z-20">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center w-full">
                        <p className="text-[10px] font-black uppercase truncate px-1">{teacher.name}</p>
                        <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase opacity-70">
                          {teacher.rarity}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t mt-4">
              <Button variant="outline" onClick={() => setStep('select_friend')}>Zurück</Button>
              <Button disabled={!selectedOfferCard} onClick={() => setStep('confirm')}>
                Weiter zur Bestätigung
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-xl font-black uppercase tracking-tight">4. Tausch Bestätigen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="space-y-4 text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-blue-500">Du gibst</p>
                <div className="w-48 sm:w-56 aspect-[2.5/3.5] mx-auto">
                  {selectedOfferCard && (teacherById.get(selectedOfferCard.teacherId) || (selectedOfferCard.teacherId.includes(':') && teacherById.get(selectedOfferCard.teacherId.split(':')[1]))) && (
                    <TeacherCard
                      data={getCardDataForTeacher(
                        (teacherById.get(selectedOfferCard.teacherId) || teacherById.get(selectedOfferCard.teacherId.split(':')[1]))!,
                        selectedOfferCard.variant as VisualCardVariant,
                      )}
                      className="w-full h-full"
                      styleVariant="modern-flat"
                      isFlippedExternally={true}
                      interactive={false}
                    />
                  )}
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight">{selectedOfferCard?.name}</p>
                  <Badge variant="secondary" className="text-[10px] uppercase mt-1">
                    {selectedOfferCard?.rarity} • {selectedOfferCard?.variant}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted rounded-full p-4 shadow-inner flex items-center justify-center">
                <ArrowLeftRight className="w-8 h-8 text-muted-foreground animate-pulse" />
              </div>

              <div className="space-y-4 text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-green-500">Du erhältst von {selectedFriend?.name}</p>
                <div className="w-48 sm:w-56 aspect-[2.5/3.5] mx-auto">
                  {selectedTargetTeacher && (
                    <TeacherCard
                      data={getCardDataForTeacher(selectedTargetTeacher, selectedTargetVariant as VisualCardVariant)}
                      className="w-full h-full"
                      styleVariant="modern-flat"
                      isFlippedExternally={true}
                      interactive={false}
                    />
                  )}
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight">{selectedTargetTeacher?.name}</p>
                  <Badge variant="secondary" className="text-[10px] uppercase mt-1">
                    {selectedTargetTeacher?.rarity} • {selectedTargetVariant}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t">
              <Button variant="outline" size="lg" onClick={() => setStep('select_offer')}>Zurück</Button>
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-tight"
                disabled={loading}
                onClick={handleStartTrade}
              >
                {loading ? 'Tausch wird gestartet...' : 'Tauschangebot Senden'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
