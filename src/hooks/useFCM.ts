'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, app } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export function useFCM() {
  const { user, profile } = useAuth()
  const [messaging, setMessaging] = useState<Messaging | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      
      // Initialize messaging only if supported
      try {
        const m = getMessaging(app)
        setMessaging(m)
      } catch (err) {
        console.warn('FCM is not supported in this browser:', err)
      }
    }
  }, [])

  const saveTokenToDb = useCallback(async (newToken: string) => {
    if (!user?.uid) return
    
    try {
      const userRef = doc(db, 'profiles', user.uid)
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(newToken),
        isPushEnabled: true
      })
    } catch (err) {
      console.error('Error saving FCM token to DB:', err)
    }
  }, [user?.uid])

  const removeTokenFromDb = useCallback(async (oldToken: string) => {
    if (!user?.uid) return
    
    try {
      const userRef = doc(db, 'profiles', user.uid)
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(oldToken),
        isPushEnabled: false
      })
    } catch (err) {
      console.error('Error removing FCM token from DB:', err)
    }
  }, [user?.uid])

  const requestPermission = useCallback(async () => {
    if (!messaging) return false

    if (!VAPID_KEY) {
      console.error('FCM Error: NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing in your .env.local')
      toast.error('Push-Konfiguration fehlt (VAPID Key).')
      return false
    }

    try {
      const status = await Notification.requestPermission()
      setPermission(status)
      
      if (status === 'granted') {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY })
        if (currentToken) {
          setToken(currentToken)
          await saveTokenToDb(currentToken)
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      return false
    }
  }, [messaging, saveTokenToDb])

  const disableNotifications = useCallback(async () => {
    if (token) {
      await removeTokenFromDb(token)
      setToken(null)
    }
  }, [token, removeTokenFromDb])

  // Handle foreground messages
  useEffect(() => {
    if (!messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      
      if (payload.notification) {
        toast(payload.notification.title || 'Benachrichtigung', {
          description: payload.notification.body,
          action: payload.data?.url ? {
            label: 'Ansehen',
            onClick: () => window.location.href = payload.data!.url as string
          } : undefined
        })
      }
    })

    return () => unsubscribe()
  }, [messaging])

  return {
    permission,
    token,
    requestPermission,
    disableNotifications,
    isSupported: !!messaging
  }
}
