'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart2, Loader2 } from 'lucide-react'
import { PollList } from '@/components/dashboard/PollList'
import { AddPollDialog } from '@/components/modals/AddPollDialog'
import { Poll, PollOption, PollVote } from '@/types/database'

export default function PollsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const q = query(
      collection(db, 'polls'),
      where('is_active', '==', true),
      orderBy('created_at', 'desc')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const pollsData: Poll[] = []
      
      for (const doc of snapshot.docs) {
        const poll = { id: doc.id, ...doc.data() } as Poll
        
        // Fetch options and votes for each poll
        const optionsSnap = await getDocs(collection(db, 'polls', doc.id, 'options'))
        const options = optionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollOption))
        
        const votesSnap = await getDocs(collection(db, 'polls', doc.id, 'votes'))
        const votes = votesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollVote))
        
        pollsData.push({ ...poll, options, votes })
      }
      
      setPolls(pollsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isPlanner = profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co'
  const isApproved = profile?.is_approved || false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Umfragen</h1>
          <p className="text-muted-foreground">Stimme über wichtige Entscheidungen ab.</p>
        </div>
        {isPlanner && <AddPollDialog />}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {polls.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold">Aktuell keine aktiven Umfragen</h3>
              <p className="text-muted-foreground max-w-xs mt-2">
                Sobald es wichtige Entscheidungen gibt (z.B. Motto oder Menü), findest du sie hier.
              </p>
            </CardContent>
          </Card>
        ) : (
          <PollList polls={polls} userId={user?.uid || ''} isApproved={isApproved} />
        )}
      </div>
    </div>
  )
}
