import { useCallback, useEffect, useMemo, useState } from 'react'
import { SammelkartenConfig, CardVariant } from '@/types/cards'
import { LootTeacher } from '@/types/database'
import { CollectionResult, MassPackReveal, MaybeCollectionResult, PackSelection, UserTeacherMap } from '../types'
import {
  buildMassPackReveal,
  isGodpackResult,
  mapResultsToTeachers,
  processCollectionResults,
  processMassCollectionResults
} from '../utils/packResults'
import { CARD_SETS } from '@/constants/cardRegistry'

type PushMessageFn = (payload: {
  type: 'toast'
  priority: 'critical' | 'info'
  title: string
  content: string
  duration?: number
}) => void

type UseSammelkartenGameInput = {
  config: SammelkartenConfig | null
  userTeachers: UserTeacherMap
  getRemainingBoosters: () => number
  getRemainingSupportBoosters: () => number
  getRandomOpenableBoosters: () => number
  getActivePackSelection: () => PackSelection | null
  collectBooster: (options?: { packSource?: 'random' | 'custom', customPackQueueId?: string | null, packId?: string }) => Promise<Array<{ teacherId: string, variant: CardVariant, count: number, level: number }>>
  collectMassBoosters: (amount: number, options?: { packSource?: 'random' | 'custom', customPackQueueId?: string | null, packId?: string }) => Promise<Array<Array<{ teacherId: string, variant: CardVariant, count: number, level: number }>>>
  pushMessage: PushMessageFn
}

export function useSammelkartenGame(input: UseSammelkartenGameInput) {
  const { config, userTeachers, getRemainingBoosters, getRemainingSupportBoosters, getRandomOpenableBoosters, getActivePackSelection, collectBooster, collectMassBoosters, pushMessage } = input

  const [gameState, setGameState] = useState<'idle' | 'ripping' | 'revealed'>('idle')
  const [isMassOpening, setIsMassOpening] = useState(false)
  const [isAnimatedMassOpening, setIsAnimatedMassOpening] = useState(false)
  const [currentRippingPackIndex, setCurrentRippingPackIndex] = useState(-1)
  const [showDebug, setShowDebug] = useState(false)
  const [revealedTeachers, setRevealedTeachers] = useState<LootTeacher[] | null>(null)
  const [collectionResults, setCollectionResults] = useState<MaybeCollectionResult[] | null>(null)
  const [massRevealedTeachers, setMassRevealedTeachers] = useState<MassPackReveal[] | null>(null)
  const [massCollectionResults, setMassCollectionResults] = useState<MaybeCollectionResult[][] | null>(null)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false])
  const [massFlippedCards, setMassFlippedCards] = useState<boolean[][]>(Array(10).fill(null).map(() => Array(3).fill(false)))
  const [isGodpack, setIsGodpack] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [consecutiveOpenCount, setConsecutiveOpenCount] = useState(0)

  const speedMultiplier = useMemo(
    () => Math.max(0.3, 1 - (consecutiveOpenCount * 0.12)),
    [consecutiveOpenCount]
  )

  useEffect(() => {
    if (consecutiveOpenCount <= 0) return

    const timer = setTimeout(() => {
      setConsecutiveOpenCount((prev) => Math.max(0, prev - 1))
    }, 10000)

    return () => clearTimeout(timer)
  }, [consecutiveOpenCount, gameState])

  const handleFlipCard = useCallback((index: number, packIndex?: number) => {
    if (packIndex !== undefined) {
      setMassFlippedCards((prev) => {
        const next = [...prev]
        next[packIndex] = [...next[packIndex]]
        next[packIndex][index] = true
        return next
      })
    } else {
      setFlippedCards((prev) => {
        const next = [...prev]
        next[index] = true
        return next
      })
    }
  }, [])

  const handleOpenTenPacks = useCallback(async (options?: { useAnimation?: boolean }) => {
    if (getRandomOpenableBoosters() < 10) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Du brauchst mindestens 10 Booster für diese Aktion!'
      })
      return
    }

    const useAnimation = options?.useAnimation ?? false
    const isReopen = gameState === 'revealed'
    if (!isReopen) setGameState('ripping')

    setIsAnimating(true)
    setIsMassOpening(true)
    setIsAnimatedMassOpening(useAnimation)
    setMassRevealedTeachers(null)
    setMassCollectionResults(null)
    setConsecutiveOpenCount((prev) => prev + 1)
    setCurrentRippingPackIndex(useAnimation ? 0 : -1)

    try {
      const selection = getActivePackSelection()
      const allResults = await collectMassBoosters(10, { 
        packSource: selection?.packSource || 'random',
        packId: selection?.packId
      })
      const teachers = config?.loot_teachers || (CARD_SETS['teacher_vol1']?.cards || []) as LootTeacher[]

      const packsData = buildMassPackReveal(allResults, teachers)
      const processedResults = processMassCollectionResults(allResults, userTeachers)

      // Set initial flipped state: if not animating, all are revealed
      setMassFlippedCards(Array(10).fill(null).map(() => Array(3).fill(!useAnimation)))

      setTimeout(() => {
        setMassRevealedTeachers(packsData)
        setMassCollectionResults(processedResults)
      }, isReopen ? 100 : 300)

      if (useAnimation) {
        // We handle the rest of the flow in the ripping animation
      } else {
        setTimeout(() => {
          setGameState('revealed')
          setIsAnimating(false)
        }, isReopen ? 200 : 700)
      }
    } catch (err: any) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: err.message || 'Fehler beim Öffnen der 10 Packs.'
      })
      setGameState('idle')
      setIsMassOpening(false)
      setIsAnimatedMassOpening(false)
    }
  }, [getRandomOpenableBoosters, pushMessage, gameState, collectMassBoosters, config, userTeachers, getActivePackSelection])

  const handleOpenPack = useCallback(async () => {
    const selection = getActivePackSelection()
    const isSupportPack = selection?.packId === 'support_vol_1'
    const remaining = isSupportPack ? getRemainingSupportBoosters() : getRemainingBoosters()

    if (remaining <= 0) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: isSupportPack ? 'Keine Support-Booster mehr übrig!' : 'Limit erreicht! Komm morgen wieder.'
      })
      return
    }

    const isReopen = gameState === 'revealed'
    if (!isReopen) setGameState('ripping')

    setIsAnimating(true)
    setIsMassOpening(false)
    setRevealedTeachers(null)
    setCollectionResults(null)
    setConsecutiveOpenCount((prev) => prev + 1)

    try {
      const results = await collectBooster({
        packSource: selection?.packSource,
        customPackQueueId: selection?.customPackQueueId,
        packId: selection?.packId
      })
      const teachers = config?.loot_teachers || (CARD_SETS['teacher_vol1']?.cards || []) as LootTeacher[]

      const packTeachers = mapResultsToTeachers(results, teachers)
      const godpack = isGodpackResult(results)
      setIsGodpack(godpack)

      if (godpack) {
        pushMessage({
          type: 'toast',
          priority: 'info',
          title: ' GODPACK GEFUNDEN! ',
          content: 'Alle Karten sind besonders selten!',
          duration: 5000
        })
      }

      const processedResults = processCollectionResults(results, userTeachers)

      setTimeout(() => {
        setRevealedTeachers(packTeachers)
        setCollectionResults(processedResults)
        setFlippedCards(new Array(results.length).fill(false))
      }, isReopen ? 100 : 300)

      setTimeout(() => {
        setGameState('revealed')
        setIsAnimating(false)
      }, isReopen ? 200 : 700)
    } catch (err: any) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: err.message || 'Fehler beim Sammeln.'
      })
      setGameState('idle')
    }
  }, [getRemainingBoosters, getRemainingSupportBoosters, pushMessage, gameState, collectBooster, config, userTeachers, getActivePackSelection])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      event.preventDefault()

      if (gameState === 'idle' && getRemainingBoosters() > 0) {
        handleOpenPack()
      } else if (gameState === 'revealed' && !isMassOpening) {
        const nextIndex = flippedCards.findIndex((flipped) => !flipped)
        if (nextIndex !== -1) {
          handleFlipCard(nextIndex)
        } else {
          if (getRemainingBoosters() > 0) {
            handleOpenPack()
          } else {
            setGameState('idle')
          }
        }
      } else if (gameState === 'revealed' && isMassOpening) {
        // Handle flipping in mass mode
        let nextPackIdx = -1
        let nextCardIdx = -1

        for (let p = 0; p < massFlippedCards.length; p++) {
          const c = massFlippedCards[p].findIndex(f => !f)
          if (c !== -1) {
            nextPackIdx = p
            nextCardIdx = c
            break
          }
        }

        if (nextCardIdx !== -1) {
          handleFlipCard(nextCardIdx, nextPackIdx)
        } else if (getRandomOpenableBoosters() >= 10) {
          handleOpenTenPacks({ useAnimation: isAnimatedMassOpening })
        } else {
          setGameState('idle')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    flippedCards,
    gameState,
    getRemainingBoosters,
    getRandomOpenableBoosters,
    handleFlipCard,
    handleOpenPack,
    handleOpenTenPacks,
    isMassOpening,
    isAnimatedMassOpening,
    massFlippedCards
  ])

  return {
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
    isAnimating,
    isAnimatedMassOpening,
    currentRippingPackIndex,
    setCurrentRippingPackIndex,
    consecutiveOpenCount,
    speedMultiplier,
    handleOpenPack,
    handleOpenTenPacks,
    handleFlipCard,
    massFlippedCards,
    allFlipped: isMassOpening 
      ? massFlippedCards.every((pack) => pack.every((flipped) => flipped))
      : flippedCards.every((value) => value === true)
  }
}
