'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type GiftNotice = {
  id: string
  packCount: number
  customMessage?: string
  popupTitle?: string
  popupBody?: string
  ctaLabel?: string
  ctaUrl?: string
  dismissLabel?: string
}

export function useGiftNotices(userId?: string) {
  const [giftNotices, setGiftNotices] = useState<GiftNotice[]>([])

  useEffect(() => {
    if (!userId) {
      setGiftNotices([])
      return
    }

    const giftsQuery = query(
      collection(db, 'profiles', userId, 'unseen_gifts'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(giftsQuery, (snapshot) => {
      const notices = snapshot.docs
        .map((giftDoc) => {
          const data = giftDoc.data() as {
            packCount?: number
            customMessage?: string
            popupTitle?: string
            popupBody?: string
            ctaLabel?: string
            ctaUrl?: string
            dismissLabel?: string
          }
          return {
            id: giftDoc.id,
            packCount: typeof data.packCount === 'number' ? data.packCount : 0,
            customMessage: data.customMessage,
            popupTitle: data.popupTitle,
            popupBody: data.popupBody,
            ctaLabel: data.ctaLabel,
            ctaUrl: data.ctaUrl,
            dismissLabel: data.dismissLabel,
          }
        })
        .filter((entry) => {
          if (entry.packCount > 0) return true
          return !!entry.popupTitle?.trim() || !!entry.popupBody?.trim() || !!entry.customMessage?.trim()
        })

      setGiftNotices(notices)
    })

    return () => unsubscribe()
  }, [userId])

  const totalGiftPacks = useMemo(
    () => giftNotices.reduce((sum, notice) => sum + notice.packCount, 0),
    [giftNotices]
  )

  const dismissGiftNotices = useCallback(async () => {
    if (!userId || giftNotices.length === 0) return

    await Promise.all(
      giftNotices.map((notice) => deleteDoc(doc(db, 'profiles', userId, 'unseen_gifts', notice.id)))
    )
    setGiftNotices([])
  }, [giftNotices, userId])

  return {
    giftNotices,
    totalGiftPacks,
    dismissGiftNotices,
  }
}