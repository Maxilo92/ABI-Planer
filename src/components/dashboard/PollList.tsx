'use client'

import { Poll, PollOption, PollVote } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PollListProps {
  polls: Poll[]
  userId: string
  isApproved?: boolean
}

export function PollList({ polls, userId, isApproved = false }: PollListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleVote = async (pollId: string, optionId: string) => {
    if (!userId || !isApproved) return
    setLoading(optionId)
    
    try {
      // In Firestore we use a unique ID for the vote to prevent multiple votes
      // by using a composite ID: pollId_userId
      const voteId = `${pollId}_${userId}`
      const voteRef = doc(db, 'poll_votes', voteId)
      
      await setDoc(voteRef, {
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
        created_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error voting:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {polls.map((poll) => {
        const totalVotes = poll.votes?.length || 0
        const userVote = poll.votes?.find(v => v.user_id === userId)

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
                const optionVotes = poll.votes?.filter(v => v.option_id === option.id).length || 0
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
                    {!userVote && userId && isApproved && (
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

              {userId && !isApproved && (
                <div className="bg-destructive/10 p-3 rounded-md mt-4 text-center">
                  <p className="text-xs text-destructive font-medium">Dein Account wartet noch auf Freischaltung durch einen Admin.</p>
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
