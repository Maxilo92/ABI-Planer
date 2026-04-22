'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { SystemFeatures } from '@/types/system'
import { useAuth } from '@/context/AuthContext'

export function useSystemFeatures() {
  const { profile } = useAuth()
  const isAdmin = ['admin', 'admin_main', 'admin_co'].includes(profile?.role || '')
  const [features, setFeatures] = useState<SystemFeatures | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        setFeatures(snap.data() as SystemFeatures)
      } else {
        setFeatures({
          trading_status: 'enabled',
          combat_status: 'enabled',
          shop_status: 'enabled',
          news_status: 'enabled',
          calendar_status: 'enabled',
          todos_status: 'enabled',
          polls_status: 'enabled',
          sammelkarten_status: 'enabled',
          maintenance_mode: false
        })
      }
      setLoading(false)
    }, (error) => {
      console.error('useSystemFeatures: Error listening to features:', error)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const isEnabled = (key: keyof SystemFeatures) => {
    if (!features) return true
    
    // Status keys are preferred
    const statusKey = (key.toString().replace('_enabled', '_status')) as keyof SystemFeatures
    const status = features[statusKey] ?? features[key]

    if (status === 'enabled') return true
    if (status === 'admins_only') return isAdmin
    if (status === 'disabled') return false
    
    // Fallback for boolean keys
    if (typeof status === 'boolean') return status
    
    return true
  }

  return { features, loading, isEnabled }
}
