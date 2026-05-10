'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Profile } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useFriendSystem } from '@/hooks/useFriendSystem'
import { toast } from 'sonner'
import { ProfileView } from '@/components/profile/ProfileView'
import { Timestamp } from 'firebase/firestore'

const BOT_PROFILE_DATA: Profile = {
  id: 'abi-bot',
  full_name: 'ABI Bot',
  photo_url: '/images/bot/avatar.png',
  email: 'bot@abi-planer.de',
  role: 'admin_main',
  planning_groups: ['System-Zentrale', 'Support'],
  led_groups: [],
  is_approved: true,
  created_at: '2024-01-01T00:00:00.000Z',
  referral_code: 'ABIBOT',
  referred_by: null,
  isOnline: true,
  lastOnline: new Date(),
  school_name: 'Zentrale Datenbank',
  class_name: 'KI',
  task_stats: {
    completed_count: 9999,
    earned_boosters: 42069,
    total_penalty_reduction: 0,
    ehrenpunkte: 999
  },
  booster_stats: {
    last_reset: new Date().toISOString(),
    count: 0,
    total_opened: 1337,
    total_cards: 420
  }
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const {
    outgoingRequests,
    incomingRequests,
    getRelationshipState,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriendSystem()
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id === 'abi-bot') {
      setTargetProfile(BOT_PROFILE_DATA)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profiles', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setTargetProfile({ ...(docSnap.data() as Omit<Profile, 'id'>), id: docSnap.id } as Profile)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6 pb-20 max-w-6xl mx-auto px-4 pt-6">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <Skeleton className="h-40 w-full" />
          <div className="px-8 pb-8">
            <div className="relative -mt-20 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <Skeleton className="w-36 h-36 sm:w-40 sm:h-40 rounded-[2.5rem] border-8 border-card shadow-lg" />
              <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-64 sm:h-16" />
              <Skeleton className="h-6 w-48 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
              <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-3xl" />
                <Skeleton className="h-48 w-full rounded-3xl" />
              </div>
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full rounded-[2.5rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Profil nicht gefunden.</h2>
        <Button
          variant="link"
          className="mt-4"
          render={<Link href="/news">Zurück zur Übersicht</Link>}
        />
      </div>
    )
  }

  const relationshipState = user ? getRelationshipState(id) : 'none'
  const isOwnProfile = user?.uid === id

  const handleFriendAction = async (accepted?: boolean) => {
    try {
      if (relationshipState === 'none') {
        await sendFriendRequest(id)
        toast.success('Freundschaftsanfrage gesendet.')
        return
      }

      if (relationshipState === 'pending_outgoing') {
        const request = outgoingRequests.find((entry) => entry.toUserId === id)
        if (!request) {
          throw new Error('Anfrage nicht gefunden.')
        }
        await cancelFriendRequest(request.id)
        toast.success('Freundschaftsanfrage zurückgezogen.')
        return
      }

      if (relationshipState === 'pending_incoming') {
        const request = incomingRequests.find((entry) => entry.fromUserId === id)
        if (!request) {
          throw new Error('Anfrage nicht gefunden.')
        }
        if (accepted) {
          await respondToFriendRequest(request.id, true)
          toast.success('Freundschaft bestätigt.')
        } else {
          await respondToFriendRequest(request.id, false)
          toast.success('Freundschaftsanfrage abgelehnt.')
        }
        return
      }

      if (relationshipState === 'friends') {
        await removeFriend(id)
        toast.success('Freundschaft entfernt.')
      }
    } catch (error: any) {
      console.error('[PublicProfile] Friend action failed:', error)
      toast.error(error?.message || 'Aktion konnte nicht ausgeführt werden.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          render={
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Link>
          }
        />
      </div>

      <ProfileView 
        profile={targetProfile} 
        isOwnProfile={isOwnProfile}
        relationshipState={id === 'abi-bot' ? 'none' : relationshipState}
        onFriendAction={id === 'abi-bot' ? undefined : handleFriendAction}
      />
    </div>
  )
}
