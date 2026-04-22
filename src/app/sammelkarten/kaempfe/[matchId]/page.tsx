'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSammelkartenConfig } from '@/app/sammelkarten/_modules/hooks/useSammelkartenConfig'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { db, functions } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { GameBoard } from '@/components/combat/GameBoard'
import { InitialCardSelection } from '@/components/combat/InitialCardSelection'
import { CombatDebugPanel } from '@/components/combat/CombatDebugPanel'

export default function MatchPage() {
  const { matchId } = useParams()
  const router = useRouter()
  const { isCombatEnabled, loading: configLoading } = useSammelkartenConfig()
  const { user, profile, loading: authLoading } = useAuth()
  const isAdmin = ['admin', 'admin_main', 'admin_co'].includes(profile?.role || '')

  const [matchData, setMatchData] = useState<any>(null)
  const [loadingMatch, setLoadingMatch] = useState(true)

  useEffect(() => {
    if (configLoading || authLoading) return
    if (isCombatEnabled === false && !isAdmin) {
      router.replace('/sammelkarten')
    }
  }, [isCombatEnabled, configLoading, authLoading, isAdmin, router])

  // Fetch Match Data from Firestore - This is our Single Source of Truth
  useEffect(() => {
    if (!matchId || typeof matchId !== 'string' || authLoading) return

    const unsubMatch = onSnapshot(doc(db, 'matches', matchId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMatchData(data);
        setLoadingMatch(false);
        
        // Log for debugging
        if (typeof window !== 'undefined') {
          console.log('[MatchPage] matchData loaded:', {
            id: matchId,
            status: data?.status,
            playerA_has_activeCard: !!data?.playerA?.activeCard,
            playerB_has_activeCard: !!data?.playerB?.activeCard,
            playerA_bench_count: data?.playerA?.bench?.length,
            playerB_bench_count: data?.playerB?.bench?.length,
            playerA_points: data?.playerA?.points,
            playerB_points: data?.playerB?.points,
          });
          // Full Firestore document for inspection
          console.log('[MatchPage] Full match document:', data);
        }
      } else {
        // Handle match not found (e.g. invalid ID)
        if (!loadingMatch) router.replace('/sammelkarten/kaempfe')
      }
    }, (error) => {
      console.error("Error listening to match:", error)
    })

    return () => unsubMatch()
  }, [matchId, authLoading])

  if (configLoading || authLoading || loadingMatch) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <div className="space-y-6 flex flex-col items-center">
          <div className="h-20 w-20 bg-brand/10 rounded-3xl flex items-center justify-center border border-brand/20 shadow-2xl">
            <Loader2 className="h-10 w-10 text-brand animate-spin" />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-center">Kampf wird geladen...</h1>
          <p className="text-muted-foreground font-medium animate-pulse">Synchronisierung mit Server</p>
        </div>
      </div>
    )
  }

  if (isCombatEnabled === false && !isAdmin) {
    return null
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] -m-4 sm:-m-6 lg:-m-8">
      <CombatDebugPanel matchData={matchData} userId={user?.uid || ''} />
      <div className="flex-1 w-full bg-neutral-950/50">
        <GameBoard 
          matchData={matchData} 
          currentUserId={user?.uid || ''}
          onExit={() => router.push('/sammelkarten/kaempfe')}
        />
      </div>
    </div>
  )
}
