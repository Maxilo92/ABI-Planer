'use client'

import { useAuth } from '@/context/AuthContext'
import { Sparkles } from 'lucide-react'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { useCustomPackQueue } from '@/hooks/useCustomPackQueue'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { DeckGrid } from '@/components/cards/DeckGrid'
import { DeckEditor } from '@/components/cards/DeckEditor'
import { useDecks } from '@/hooks/useDecks'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { useSammelkartenConfig } from '../hooks/useSammelkartenConfig'
import { useSammelkartenGame } from '../hooks/useSammelkartenGame'
import { getPackProbabilities } from '../utils/probability'
import { AvailablePack, PackSelection, UserTeacherMap } from '../types'
import { SammelkartenHeader } from './SammelkartenHeader'
import { SinglePackReveal } from './SinglePackReveal'
import { MassPackReveal } from './MassPackReveal'
import { PackOpeningStage } from './PackOpeningStage'
import { SammelkartenFooterActions } from './SammelkartenFooterActions'
import { TcgDashboard } from './TcgDashboard'
import { FundingBanner } from '@/components/funding/FundingBanner'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

interface SammelkartenModuleProps {
  defaultView?: string
  hideFundingBanner?: boolean
}

export function SammelkartenModule({ defaultView = 'dashboard', hideFundingBanner = false }: SammelkartenModuleProps) {
  const searchParams = useSearchParams()
  // Use prop as fallback for the query param
  const view = searchParams.get('view') || defaultView
  const packParam = searchParams.get('pack')
  const { user, loading } = useAuth()
  const { pushMessage } = useSystemMessage()
  const { createDeck } = useDecks()
  const { collectBooster, collectMassBoosters, teachers: userTeachers, getRemainingBoosters, getRemainingSupportBoosters } = useUserTeachers()
  const { queueEntries: customPackQueue } = useCustomPackQueue()
  const { config, isTradingEnabled, timeLeft } = useSammelkartenConfig()
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)
  const [supportGoal, setSupportGoal] = useState<number | null>(null)
  const [supportAmount, setSupportAmount] = useState<number | null>(null)

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      const data = snapshot.data() as { support_goal?: number, current_support_amount?: number } | undefined
      setSupportGoal(typeof data?.support_goal === 'number' ? data.support_goal : 100)
      setSupportAmount(typeof data?.current_support_amount === 'number' ? data.current_support_amount : 0)
    }, (error) => {
      console.error('Error listening to support settings:', error)
      setSupportGoal(100)
      setSupportAmount(0)
    })

    return () => unsubscribe()
  }, [])

  const availablePacks = useMemo<AvailablePack[]>(() => {
    const totalRemaining = getRemainingBoosters()
    const supportCount = getRemainingSupportBoosters()

    const packs: AvailablePack[] = []

    if (totalRemaining > 0) {
      packs.push({
        id: 'random-pack',
        name: 'Standard Booster',
        count: totalRemaining,
        source: 'random',
        description: 'Normale Packs aus deinem täglichen Kontingent und Extras',
      })
    }

    if (supportCount > 0) {
      packs.push({
        id: 'support-vol-1',
        name: 'Support Pack Vol. 1',
        count: supportCount,
        source: 'random',
        packId: 'support_vol_1',
        description: 'Gratis Bonus aus Bundle-Käufen. Enthält 1 Karte.',
      })
    }

    customPackQueue.forEach((entry, index) => {
      const remaining = Math.max(0, Math.floor(entry.remainingPacks || 0))
      if (remaining <= 0) return

      packs.push({
        id: entry.id || `custom-pack-${index}`,
        name: (entry.name || 'Custom Pack').trim(),
        count: remaining,
        source: 'custom',
        queueId: entry.id,
        packId: entry.packId,
        description: entry.presetId ? `Preset: ${entry.presetId}` : 'Deterministisches Geschenk mit festen Slots',
      })
    })

    return packs
  }, [customPackQueue, getRemainingBoosters, getRemainingSupportBoosters])

  const selectedPack = useMemo(() => {
    if (availablePacks.length === 0) return null
    if (packParam) {
      return availablePacks.find((pack) => pack.id === packParam) || availablePacks[0]
    }

    return availablePacks[0]
  }, [availablePacks, packParam])

  const getRandomOpenableBoosters = useCallback(() => {
    return selectedPack?.count || 0
  }, [selectedPack])

  const getActivePackSelection = useCallback((): PackSelection | null => {
    if (!selectedPack) return null

    if (selectedPack.source === 'custom') {
      return {
        packSource: 'custom',
        customPackQueueId: selectedPack.queueId || selectedPack.id,
      }
    }

    return { 
      packSource: 'random',
      packId: selectedPack.packId 
    }
  }, [selectedPack])

  const {
    gameState,
    setGameState,
    isMassOpening,
    showDebug,
    setShowDebug,
    revealedTeachers,
    collectionResults,
    massRevealedTeachers,
    massCollectionResults,
    flippedCards,
    isGodpack,
    isAnimatedMassOpening,
    currentRippingPackIndex,
    setCurrentRippingPackIndex,
    massFlippedCards,
    consecutiveOpenCount,
    speedMultiplier,
    handleOpenPack,
    handleOpenTenPacks,
    handleFlipCard,
    allFlipped
  } = useSammelkartenGame({
    config,
    userTeachers: (userTeachers || {}) as UserTeacherMap,
    getRemainingBoosters,
    getRemainingSupportBoosters,
    getRandomOpenableBoosters,
    getActivePackSelection,
    collectBooster,
    collectMassBoosters,
    pushMessage
  })

  if (loading) return null
  const shouldShowProtectedGate = !user
  const packProbs = getPackProbabilities({
    revealedTeachers,
    collectionResults,
    config,
    isGodpack
  })

  const handleCreateDeck = async () => {
    if (!user) return

    const createdDeckId = await createDeck({
      title: 'Neues Deck',
      cardIds: [],
      coverCardId: '',
      isActive: false,
    })

    setActiveDeckId(createdDeckId)
  }

  const handleEditDeck = (deckId: string) => {
    setActiveDeckId(deckId)
  }

  return (
    <div className="container mx-auto py-8">
      {shouldShowProtectedGate ? (
        <div className="py-12">
          <ProtectedSystemGate
            title="Sammelkarten gesperrt"
            description="Sammle Lehrer, levele sie auf und vervollständige dein Album. Um Booster zu öffnen, musst du angemeldet sein."
            icon={<Sparkles className="h-10 w-10 text-primary" />}
          />
        </div>
      ) : view === 'dashboard' ? (
        <TcgDashboard />
      ) : view === 'sammelkarten' ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] overflow-visible pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="relative flex flex-col items-center space-y-8 sm:space-y-12 w-full max-w-4xl px-6">
            <SammelkartenHeader
              gameState={gameState}
              showDebug={showDebug}
              setShowDebug={setShowDebug}
              getRemainingBoosters={getRemainingBoosters}
              getRemainingSupportBoosters={getRemainingSupportBoosters}
              timeLeft={timeLeft}
              packSelectionHref={availablePacks.length > 1 && selectedPack ? `/sammelkarten/packs?selected=${encodeURIComponent(selectedPack.id)}` : null}
            />

            {!hideFundingBanner && (
              <FundingBanner
                bannerId="support-banner"
                current={supportAmount ?? 0}
                goal={supportGoal ?? 100}
                title="Helft uns die Seite am Laufen zu halten"
                description="Damit der ABI Planer werbefrei, stabil und für alle kostenlos bleibt, fallen monatliche Kosten für Server, Datenbanken und Hosting an. Da wir keine Daten verkaufen oder Werbung schalten, deckt dieser Support-Pool ausschließlich diese technischen Ausgaben. Sollte das Ziel nicht erreicht werden, müssten die Kosten privat getragen oder Funktionen eingeschränkt werden – jeder Euro sichert also den Betrieb eurer Plattform!"
                ctaHref="/finanzen/spenden/entwickler"
                ctaLabel="Support geben"
                storageKey="tcg-funding-banner-collapsed"
              />
            )}

            <div className="relative w-full min-h-[400px] flex items-center justify-center overflow-visible">
              <SinglePackReveal
                gameState={gameState}
                isMassOpening={isMassOpening}
                revealedTeachers={revealedTeachers}
                flippedCards={flippedCards}
                collectionResults={collectionResults}
                config={config}
                showDebug={showDebug}
                packProbs={packProbs}
                handleFlipCard={handleFlipCard}
              />

              <MassPackReveal
                gameState={gameState}
                isMassOpening={isMassOpening}
                isAnimatedMassOpening={isAnimatedMassOpening}
                currentRippingPackIndex={currentRippingPackIndex}
                massFlippedCards={massFlippedCards}
                handleFlipCard={handleFlipCard}
                massRevealedTeachers={massRevealedTeachers}
                massCollectionResults={massCollectionResults}
                showDebug={showDebug}
                config={config}
              />

              <PackOpeningStage
                gameState={gameState}
                getRemainingBoosters={getRemainingBoosters}
                getRemainingSupportBoosters={getRemainingSupportBoosters}
                isGodpack={isGodpack}
                timeLeft={timeLeft}
                availablePacks={availablePacks}
                selectedPackId={selectedPack?.id || null}
                handleOpenPack={handleOpenPack}
                isMassOpening={isMassOpening}
                isAnimatedMassOpening={isAnimatedMassOpening}
                currentRippingPackIndex={currentRippingPackIndex}
                setCurrentRippingPackIndex={setCurrentRippingPackIndex}
                setGameState={setGameState}
              />
              </div>

              <SammelkartenFooterActions
              showDebug={showDebug}
              speedMultiplier={speedMultiplier}
              consecutiveOpenCount={consecutiveOpenCount}
              gameState={gameState}
              isMassOpening={isMassOpening}
              packProbs={packProbs}
              getRemainingBoosters={getRemainingBoosters}
              getRemainingSupportBoosters={getRemainingSupportBoosters}
              selectedPack={selectedPack}
              handleOpenPack={handleOpenPack}
              handleOpenTenPacks={handleOpenTenPacks}
              setGameState={setGameState}
              timeLeft={timeLeft}
              allFlipped={allFlipped}
              isTradingEnabled={!!isTradingEnabled}
              getRandomOpenableBoosters={getRandomOpenableBoosters}
              />
          </div>
        </div>
      ) : view === 'decks' && activeDeckId ? (
        <div className="max-w-6xl mx-auto px-4">
          <DeckEditor
            deckId={activeDeckId}
            onBack={() => setActiveDeckId(null)}
          />
        </div>
      ) : view === 'decks' ? (
        <div className="max-w-6xl mx-auto px-4">
          <DeckGrid onEditDeck={handleEditDeck} onCreateDeck={() => void handleCreateDeck()} />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          <Skeleton name="teacher-album-container" loading={false}>
            <TeacherAlbum />
          </Skeleton>
        </div>
      )}
    </div>
  )
}
