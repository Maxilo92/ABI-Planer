'use client'

import { Poll, PollOption, PollVote } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PollListProps {
  polls: Poll[]
  userId: string
  canVote?: boolean
}

export function PollList({ polls, userId, canVote = false }: PollListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [votesByPoll, setVotesByPoll] = useState<Record<string, PollVote[]>>({})

  useEffect(() => {
    const nextVotes: Record<string, PollVote[]> = {}
    polls.forEach((poll) => {
      nextVotes[poll.id] = poll.votes || []
    })
    setVotesByPoll(nextVotes)
  }, [polls])

  const refreshVotesForPoll = async (pollId: string) => {
    const votesSnap = await getDocs(collection(db, 'polls', pollId, 'votes'))
    const refreshedVotes = votesSnap.docs.map((voteDoc) => ({ id: voteDoc.id, ...voteDoc.data() } as PollVote))
    setVotesByPoll((prev) => ({ ...prev, [pollId]: refreshedVotes }))
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!userId || !canVote) return
    setLoading(optionId)
    
    try {
      // One vote per user and poll by storing vote under polls/{pollId}/votes/{userId}
      const voteRef = doc(db, 'polls', pollId, 'votes', userId)
      
      await setDoc(voteRef, {
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
        created_at: serverTimestamp()
      })

      await refreshVotesForPoll(pollId)
      toast.success('Deine Stimme wurde gespeichert.')
    } catch (err) {
      console.error('Error voting:', err)
      toast.error('Abstimmung fehlgeschlagen. Bitte prüfe deine Berechtigungen.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {polls.map((poll) => {
        const pollVotes = votesByPoll[poll.id] || poll.votes || []
        const totalVotes = pollVotes.length
        const userVote = pollVotes.find(v => v.user_id === userId)

        return (
          <Card key={poll.id}>
            <CardHeader>
              <CardTitle>{poll.question}</CardTitle>
              <CardDescription>
                {totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'} abgegeben
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {poll.options?.map((option) => {
                const optionVotes = pollVotes.filter(v => v.option_id === option.id).length
                const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0
                const isSelected = userVote?.option_id === option.id

                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isSelected ? 'font-bold text-primary' : ''}>
                        {option.option_text} {isSelected && '(Deine Wahl)'}
                      </span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className={isSelected ? 'bg-primary/20' : ''} />
                    {!userVote && userId && canVote && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-1 h-8"
                        onClick={() => handleVote(poll.id, option.id)}
                        disabled={!!loading}
                      >
                        {loading === option.id ? 'Abstimmung...' : 'Wählen'}
                      </Button>
                    )}
                  </div>
                )
              })}
              
              {!userId && (
                <div className="bg-muted p-3 rounded-md mt-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Du musst angemeldet sein, um abzustimmen.</p>
                  <Button variant="outline" size="sm" onClick={() => router.push('/login')}>Jetzt anmelden</Button>
                </div>
              )}

              {userVote && (
                <p className="text-xs text-center text-muted-foreground italic mt-2">
                  Du hast bereits abgestimmt.
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
