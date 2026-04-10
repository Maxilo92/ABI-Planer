import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { SammelkartenConfig } from '@/types/cards'
import { db } from '@/lib/firebase'
import {
  DEFAULT_GODPACK_WEIGHTS,
  DEFAULT_RARITY_WEIGHTS,
  DEFAULT_VARIANTS_PROBABILITIES
} from '../constants'
import { CARD_SETS } from '@/constants/cardRegistry'

function getTimeLeftString(resetHour: number) {
  const now = new Date()
  const berlinNowStr = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
  const berlinNow = new Date(berlinNowStr)

  const target = new Date(berlinNowStr)
  target.setHours(resetHour, 0, 0, 0)

  if (berlinNow >= target) {
    target.setDate(target.getDate() + 1)
  }

  const diff = target.getTime() - berlinNow.getTime()

  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((diff % (1000 * 60)) / 1000)

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function useSammelkartenConfig() {
  const [config, setConfig] = useState<SammelkartenConfig | null>(null)
  const [isTradingEnabled, setIsTradingEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) setIsTradingEnabled(!!snap.data().is_trading_enabled)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let unsubGlobal: (() => void) | null = null

    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as SammelkartenConfig)
        if (unsubGlobal) {
          unsubGlobal()
          unsubGlobal = null
        }
      } else if (!unsubGlobal) {
        unsubGlobal = onSnapshot(doc(db, 'settings', 'global'), (globalSnap) => {
          if (globalSnap.exists()) {
            const data = globalSnap.data()
            setConfig({
              loot_teachers: data.loot_teachers || (CARD_SETS['teacher_vol1']?.cards || []) as any,
              rarity_weights: DEFAULT_RARITY_WEIGHTS,
              godpack_weights: DEFAULT_GODPACK_WEIGHTS,
              variant_probabilities: DEFAULT_VARIANTS_PROBABILITIES,
              global_limits: { daily_allowance: 2, reset_hour: 9, godpack_chance: 0.005 }
            })
          }
        }, (error) => {
          console.error('SammelkartenPage: Error listening to global settings fallback:', error)
        })
      }
    }, (error) => {
      console.error('SammelkartenPage: Error listening to sammelkarten settings:', error)
    })

    return () => {
      unsubscribe()
      if (unsubGlobal) unsubGlobal()
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const resetHour = config?.global_limits?.reset_hour ?? 9
      setTimeLeft(getTimeLeftString(resetHour))
    }, 1000)

    return () => clearInterval(timer)
  }, [config])

  return {
    config,
    isTradingEnabled,
    timeLeft
  }
}
