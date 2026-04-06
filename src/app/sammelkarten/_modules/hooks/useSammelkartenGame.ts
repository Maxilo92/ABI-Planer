import { useCallback, useEffect, useMemo, useState } from 'react'
import { SammelkartenConfig } from '@/types/cards'
import { LootTeacher } from '@/types/database'
import { DEFAULT_TEACHERS } from '../constants'
import { CollectionResult, MassPackReveal, MaybeCollectionResult, PackSelection, UserTeacherMap } from '../types'
import {
  buildMassPackReveal,
  isGodpackResult,
  mapResultsToTeachers,
  processCollectionResults,
  processMassCollectionResults
} from '../utils/packResults'

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
  getRandomOpenableBoosters: () => number
  getActivePackSelection: () => PackSelection | null
  collectBooster: (options?: { packSource?: 'random' | 'custom', customPackQueueId?: string | null }) => Promise<Array<{ teacherId: string, variant: 'normal' | 'holo' | 'shiny' | 'black_shiny_holo', count: number, level: number }>>
  collectMassBoosters: (amount: number, options?: { packSource?: 'random' | 'custom', customPackQueueId?: string | null }) => Promise<Array<Array<{ teacherId: string, variant: 'normal' | 'holo' | 'shiny' | 'black_shiny_holo', count: number, level: number }>>>
  pushMessage: PushMessageFn
}

export function useSammelkartenGame(input: UseSammelkartenGameInput) {
  const { config, userTeachers, getRemainingBoosters, getRandomOpenableBoosters, getActivePackSelection, collectBooster, collectMassBoosters, pushMessage } = input

  const [gameState, setGameState] = useState<'idle' | 'ripping' | 'revealed'>('idle')
  const [isMassOpening, setIsMassOpening] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [revealedTeachers, setRevealedTeachers] = useState<LootTeacher[] | null>(null)
  const [collectionResults, setCollectionResults] = useState<MaybeCollectionResult[] | null>(null)
  const [massRevealedTeachers, setMassRevealedTeachers] = useState<MassPackReveal[] | null>(null)
  const [massCollectionResults, setMassCollectionResults] = useState<MaybeCollectionResult[][] | null>(null)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false])
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

  const handleFlipCard = useCallback((index: number) => {
    setFlippedCards((prev) => {
      const next = [...prev]
      next[index] = true
      return next
    })
  }, [])

  const handleOpenTenPacks = useCallback(async () => {
    if (getRandomOpenableBoosters() < 10) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Du brauchst mindestens 10 Booster für diese Aktion!'
      })
      return
    }

    const isReopen = gameState === 'revealed'
    if (!isReopen) setGameState('ripping')

    setIsAnimating(true)
    setIsMassOpening(true)
    setMassRevealedTeachers(null)
    setMassCollectionResults(null)
    setConsecutiveOpenCount((prev) => prev + 1)

    try {
      const allResults = await collectMassBoosters(10, { packSource: 'random' })
      const teachers = config?.loot_teachers || DEFAULT_TEACHERS

      const packsData = buildMassPackReveal(allResults, teachers)
      const processedResults = processMassCollectionResults(allResults, userTeachers)

      setTimeout(() => {
        setMassRevealedTeachers(packsData)
        setMassCollectionResults(processedResults)
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
        content: err.message || 'Fehler beim Öffnen der 10 Packs.'
      })
      setGameState('idle')
      setIsMassOpening(false)
    }
  }, [getRandomOpenableBoosters, pushMessage, gameState, collectMassBoosters, config, userTeachers])

  const handleOpenPack = useCallback(async () => {
    if (getRemainingBoosters() <= 0) {
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Limit erreicht! Komm morgen wieder.'
      })
      return
    }

    const isReopen = gameState === 'revealed'
    if (!isReopen) setGameState('ripping')

    setIsAnimating(true)
    setIsMassOpening(false)
    setRevealedTeachers(null)
    setCollectionResults(null)
    setFlippedCards([false, false, false])
    setConsecutiveOpenCount((prev) => prev + 1)

    try {
      const selection = getActivePackSelection()
      const results = await collectBooster(selection || undefined)
      const teachers = config?.loot_teachers || DEFAULT_TEACHERS

      const packTeachers = mapResultsToTeachers(results, teachers)
      const godpack = isGodpackResult(results)
      setIsGodpack(godpack)

      if (godpack) {
        pushMessage({
          type: 'toast',
          priority: 'info',
          title: '✨ GODPACK GEFUNDEN! ✨',
          content: 'Alle Karten sind besonders selten!',
          duration: 5000
        })
      }

      const processedResults = processCollectionResults(results, userTeachers)

      setTimeout(() => {
        setRevealedTeachers(packTeachers)
        setCollectionResults(processedResults)
        setFlippedCards([false, false, false])
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
  }, [getRemainingBoosters, pushMessage, gameState, collectBooster, config, userTeachers, getActivePackSelection])

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
        if (getRandomOpenableBoosters() >= 10) {
          handleOpenTenPacks()
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
    isMassOpening
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
    consecutiveOpenCount,
    speedMultiplier,
    handleOpenPack,
    handleOpenTenPacks,
    handleFlipCard,
    allFlipped: flippedCards.every((value) => value === true)
  }
}
