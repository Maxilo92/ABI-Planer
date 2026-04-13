'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy, limit, doc, getDocs, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { db, functions } from '@/lib/firebase'
import { CardTrade, CardSelection, TradeStatus } from '@/types/trades'

/**
 * Normalisiert ein Trade-Dokument aus Firestore.
 */
function normalizeTrade(id: string, data: Record<string, any>): CardTrade {
  return {
    id,
    senderId: data.senderId,
    receiverId: data.receiverId,
    senderName: data.senderName,
    receiverName: data.receiverName,
    status: data.status as TradeStatus,
    offeredCard: data.offeredCard,
    requestedCard: data.requestedCard,
    roundCount: data.roundCount,
    lastActorId: data.lastActorId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    expiresAt: data.expiresAt,
  }
}

export function useCardTrade() {
  const { user, profile } = useAuth()
  const currentUserId = user?.uid ?? ''
  const isAdmin = ['admin', 'admin_main', 'admin_co'].includes(profile?.role || '')
  
  const [activeTrades, setActiveTrades] = useState<CardTrade[]>([])
  const [pastTrades, setPastTrades] = useState<CardTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [isTradingEnabled, setIsTradingEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        // Check new status-based field with legacy fallback
        const status = data.trading_status || (data.is_trading_enabled ? 'enabled' : 'disabled')
        
        if (status === 'enabled') {
          setIsTradingEnabled(true)
        } else if (status === 'admins_only') {
          setIsTradingEnabled(isAdmin)
        } else {
          setIsTradingEnabled(false)
        }
      } else {
        setIsTradingEnabled(false)
      }
    })
    return () => unsub()
  }, [currentUserId, isAdmin])

  useEffect(() => {
    if (!currentUserId) {
      setActiveTrades([])
      setPastTrades([])
      setLoading(false)
      return
    }

    const tradesRef = collection(db, 'card_trades')
    
    // Aktive Trades (Status pending oder countered)
    const activeQuery = query(
      tradesRef,
      where('members', 'array-contains', currentUserId),
      where('status', 'in', ['pending', 'countered']),
      orderBy('updatedAt', 'desc')
    )

    // Abgeschlossene Trades (Status completed, declined, cancelled oder expired)
    const pastQuery = query(
      tradesRef,
      where('members', 'array-contains', currentUserId),
      where('status', 'in', ['completed', 'declined', 'cancelled', 'expired']),
      orderBy('updatedAt', 'desc'),
      limit(20)
    )

    const unsubscribeActive = onSnapshot(activeQuery, (snapshot) => {
      setActiveTrades(snapshot.docs.map(doc => normalizeTrade(doc.id, doc.data())))
      setLoading(false)
    }, (error) => {
      console.error('[useCardTrade] Error loading active trades:', error)
      setLoading(false)
    })

    const unsubscribePast = onSnapshot(pastQuery, (snapshot) => {
      setPastTrades(snapshot.docs.map(doc => normalizeTrade(doc.id, doc.data())))
    }, (error) => {
      console.error('[useCardTrade] Error loading past trades:', error)
    })

    return () => {
      unsubscribeActive()
      unsubscribePast()
    }
  }, [currentUserId])

  // Backend Callbacks
  const sendOffer = useCallback(async (receiverId: string, offeredCard: CardSelection, requestedCard: CardSelection) => {
    const fn = httpsCallable(functions, 'sendTradeOffer')
    const result = await fn({ receiverId, offeredCard, requestedCard })
    return result.data as { success: boolean; tradeId: string }
  }, [currentUserId])

  const counterOffer = useCallback(async (tradeId: string, newOfferedCard: CardSelection, newRequestedCard: CardSelection) => {
    const fn = httpsCallable(functions, 'counterTradeOffer')
    const result = await fn({ tradeId, newOfferedCard, newRequestedCard })
    return result.data as { success: boolean }
  }, [])

  const acceptTrade = useCallback(async (tradeId: string) => {
    const fn = httpsCallable(functions, 'acceptTradeOffer')
    const result = await fn({ tradeId })
    return result.data as { success: boolean }
  }, [])

  const declineTrade = useCallback(async (tradeId: string) => {
    const fn = httpsCallable(functions, 'declineTradeOffer')
    const result = await fn({ tradeId })
    return result.data as { success: boolean }
  }, [])

  const cancelTrade = useCallback(async (tradeId: string) => {
    const fn = httpsCallable(functions, 'cancelTradeOffer')
    const result = await fn({ tradeId })
    return result.data as { success: boolean }
  }, [])

  const getFriendsWithCard = useCallback(async (teacherId: string, variant: string) => {
    if (!currentUserId) {
      return { friends: [] }
    }

    const friendshipsSnap = await getDocs(
      query(collection(db, 'friendships'), where('members', 'array-contains', currentUserId))
    )

    const friendIds = friendshipsSnap.docs
      .map((snap) => {
        const members = snap.data().members as string[]
        return members.find((id) => id !== currentUserId)
      })
      .filter((id): id is string => !!id)

    if (friendIds.length === 0) {
      return { friends: [] }
    }

    const friendChecks = await Promise.all(friendIds.map(async (friendId) => {
      const [inventorySnap, profileSnap] = await Promise.all([
        getDoc(doc(db, 'user_teachers', friendId)),
        getDoc(doc(db, 'profiles', friendId)),
      ])

      const inventory = inventorySnap.exists() ? (inventorySnap.data() as Record<string, any>) : {}
      const hasVariant = (Number(inventory?.[teacherId]?.variants?.[variant]) || 0) > 0

      if (!hasVariant) return null

      const profileData = profileSnap.exists() ? profileSnap.data() : null
      return {
        id: friendId,
        name: profileData?.full_name || 'Unbekannter Freund',
      }
    }))

    return { friends: friendChecks.filter((entry): entry is { id: string; name: string } => !!entry) }
  }, [currentUserId])

  return {
    activeTrades,
    pastTrades,
    loading,
    sendOffer,
    counterOffer,
    acceptTrade,
    declineTrade,
    cancelTrade,
    getFriendsWithCard,
    isTradingEnabled,
    currentUserId
  }
}
