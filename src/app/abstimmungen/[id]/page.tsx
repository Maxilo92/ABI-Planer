'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart2, ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PollList } from '@/components/dashboard/PollList'
import { Poll, PollOption, PollVote } from '@/types/database'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SinglePollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile, loading: authLoading } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const fetchPoll = async () => {
      try {
        const pollDoc = await getDoc(doc(db, 'polls', id))
        if (pollDoc.exists()) {
          const pollData = { id: pollDoc.id, ...pollDoc.data() } as Poll
          
          // Fetch options and votes
          const optionsSnap = await getDocs(collection(db, 'polls', id, 'options'))
          const options = optionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollOption))
          
          const votesSnap = await getDocs(collection(db, 'polls', id, 'votes'))
          const votes = votesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollVote))
          
          setPoll({ ...pollData, options, votes })
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching poll:', error)
        setLoading(false)
      }
    }
    
    fetchPoll()
  }, [id, authLoading])

  if (authLoading || loading) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-6 rounded-2xl border border-border/40 bg-card p-4 shadow-subtle">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-8 w-full rounded mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Abstimmung gesperrt" 
          description="Um an Umfragen teilzunehmen und die Ergebnisse zu sehen, musst du mit deinem Lernsax-Konto angemeldet sein."
          icon={<BarChart2 className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Umfrage nicht gefunden</h3>
        <p className="text-muted-foreground mt-2">Diese Umfrage existiert nicht oder wurde gelöscht.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/abstimmungen">Alle Umfragen ansehen</Link>
        </Button>
      </div>
    )
  }

  const isPlanner =
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  const canVote = !!user

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/abstimmungen">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Umfrage Details</h1>
      </div>

      <PollList 
        polls={[poll]} 
        userId={user?.uid || ''} 
        userName={profile?.full_name} 
        userRole={profile?.role}
        userGroups={profile?.planning_groups}
        canVote={canVote} 
        canManage={isPlanner}
        useScrollContainer={false}
      />
    </div>
  )
}
