'use client'

import { useEffect, useState, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useCountdown } from '@/hooks/useCountdown'
import { DelayedAction } from '@/types/database'
import { AlertTriangle, X, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export function DangerAlertBanner() {
  const { profile } = useAuth()
  const [actions, setActions] = useState<DelayedAction[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin' || profile?.role === 'admin_co'

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('dismissed_delayed_actions')
      if (saved) {
        setDismissedIds(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Error loading dismissed actions:', e)
    }

    const q = query(
      collection(db, 'delayed_actions'),
      where('status', '==', 'pending')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data()
        return { 
          id: doc.id, 
          ...d,
          executableAt: d.executableAt || new Date().toISOString()
        } as DelayedAction
      })
      setActions(data)
    }, (error) => {
      console.error('Error fetching delayed actions:', error)
    })

    return () => unsubscribe()
  }, [])

  const activeAction = useMemo(() => {
    if (!actions.length) return null
    
    const nowTime = new Date().getTime()
    // Sort and filter in JS to avoid complex indexes
    return actions
      .filter(a => !dismissedIds.includes(a.id))
      .sort((a, b) => new Date(a.executableAt).getTime() - new Date(b.executableAt).getTime())
      .find(a => new Date(a.executableAt).getTime() > nowTime) || null
  }, [actions, dismissedIds])

  const { days, hours, minutes, seconds } = useCountdown(activeAction?.executableAt || '')

  const handleDismiss = () => {
    if (activeAction) {
      const newDismissed = [...dismissedIds, activeAction.id]
      setDismissedIds(newDismissed)
      try {
        localStorage.setItem('dismissed_delayed_actions', JSON.stringify(newDismissed))
      } catch (e) {
        console.error('Error saving dismissed actions:', e)
      }
    }
  }

  if (!mounted || !activeAction) return null

  // Format countdown string
  const countdownStr = `${days > 0 ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="bg-destructive text-destructive-foreground py-2.5 px-4 shadow-lg border-b border-destructive-foreground/10 relative z-50 animate-in fade-in slide-in-from-top duration-500">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-white/20 p-1.5 rounded-full shrink-0">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 overflow-hidden">
            <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest bg-black/20 px-1.5 py-0.5 rounded shrink-0">
              GEFAHRENWARNUNG
            </span>
            <span className="text-sm font-medium truncate opacity-95">
              {activeAction.description || 'System-Operation steht bevor'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1 font-mono font-bold text-sm bg-black/20 px-2 sm:px-2.5 py-1 rounded-md tabular-nums border border-white/10 shadow-inner">
            <span className="text-white/70 text-[10px] uppercase mr-1">T-</span>
            <span>{countdownStr}</span>
          </div>
          
          {isAdmin && (
            <Link 
              href="/admin/danger"
              className="hidden sm:flex items-center gap-1.5 bg-white text-destructive px-3 py-1 rounded-md text-xs font-black uppercase hover:bg-white/90 transition-colors shadow-sm"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              ZUM DANGER ZONE
            </Link>
          )}

          <button 
            onClick={handleDismiss}
            className="hover:bg-white/20 p-1.5 rounded-full transition-all active:scale-95 group"
            title="Diesen Hinweis ausblenden"
          >
            <X className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  )
}
