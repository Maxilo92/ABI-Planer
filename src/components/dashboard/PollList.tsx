'use client'

import { Poll, PollOption, PollVote } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/firebase'
import { collection, deleteDoc, doc, getDocs, serverTimestamp, writeBatch, runTransaction, increment } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Lock } from 'lucide-react'
import { logAction } from '@/lib/logging'

interface PollListProps {
  polls: Poll[]
  userId?: string
  userName?: string | null
  canVote?: boolean
  canManage?: boolean
  limit?: number
  useScrollContainer?: boolean
  loading?: boolean
}

export function PollList({
  polls,
  userId,
  userName,
  canVote = false,
  canManage = false,
  limit,
  useScrollContainer = true,
  loading = false,
}: PollListProps) {
  const router = useRouter()
  const [isVoting, setIsVoting] = useState<string | null>(null)
  const [votesByPoll, setVotesByPoll] = useState<Record<string, PollVote[]>>({})

  useEffect(() => {
    const nextVotes: Record<string, PollVote[]> = {}
    polls.forEach((poll) => {
      nextVotes[poll.id] = poll.votes || []
    })
    setVotesByPoll(nextVotes)
  }, [polls])

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-8 w-full mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const displayedPolls = limit ? polls.slice(0, limit) : polls

  const refreshVotesForPoll = async (pollId: string) => {
    const votesSnap = await getDocs(collection(db, 'polls', pollId, 'votes'))
    const refreshedVotes = votesSnap.docs.map((voteDoc) => ({ id: voteDoc.id, ...voteDoc.data() } as PollVote))
    setVotesByPoll((prev) => ({ ...prev, [pollId]: refreshedVotes }))
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!userId) {
      toast.error('Du musst angemeldet sein, um abzustimmen.')
      router.push('/zugang')
      return
    }

    if (!canVote) return

    const poll = polls.find((entry) => entry.id === pollId)
    const pollVotes = votesByPoll[pollId] || poll?.votes || []
    const existingVote = pollVotes.find((vote) => vote.user_id === userId)

    if (existingVote && poll?.allow_vote_change !== true) {
      toast.error('Diese Umfrage erlaubt keine nachträgliche Änderung der Stimme.')
      return
    }

    if (!existingVote && poll?.allow_vote_change === false) {
      const confirmed = window.confirm('Diese Umfrage erlaubt keine spätere Meinungsänderung. Wirklich jetzt abstimmen?')
      if (!confirmed) return
    }

    setIsVoting(optionId)
    
    try {
      // One vote per user and poll by storing vote under polls/{pollId}/votes/{userId}
      const voteRef = doc(db, 'polls', pollId, 'votes', userId)
      const profileRef = doc(db, 'profiles', userId)
      
      await runTransaction(db, async (transaction) => {
        const voteSnap = await transaction.get(voteRef)
        const isFirstVote = !voteSnap.exists()
        
        transaction.set(voteRef, {
          poll_id: pollId,
          option_id: optionId,
          user_id: userId,
          created_at: serverTimestamp()
        })

        if (isFirstVote) {
          transaction.update(profileRef, {
            'booster_stats.extra_available': increment(1)
          })
        }
      })

      await refreshVotesForPoll(pollId)
      if (!existingVote) toast.success('Deine Stimme wurde gespeichert.' + ' Du hast 1 Booster-Pack als Belohnung erhalten.'); else toast.success('Deine Stimme wurde geändert.')
      
      const optionText = poll?.options?.find(o => o.id === optionId)?.option_text || optionId
      await logAction('VOTE_CAST', userId, userName, { 
        poll_id: pollId, 
        poll_question: poll?.question,
        option_id: optionId,
        option_text: optionText
      })
    } catch (err) {
      console.error('Error voting:', err)
      toast.error('Abstimmung fehlgeschlagen. Bitte prüfe deine Berechtigungen.')
    } finally {
      setIsVoting(null)
    }
  }

  const handleWithdraw = async (pollId: string) => {
    if (!userId || !canVote) return
    const poll = polls.find((entry) => entry.id === pollId)
    if (poll?.allow_vote_change !== true) {
      toast.error('Diese Umfrage erlaubt keine nachträgliche Änderung der Stimme.')
      return
    }

    const confirmed = window.confirm('Möchtest du deine Stimme wirklich zurückziehen?')
    if (!confirmed) return

    setIsVoting('withdraw-' + pollId)
    
    try {
      const voteRef = doc(db, 'polls', pollId, 'votes', userId)
      await deleteDoc(voteRef)
      await refreshVotesForPoll(pollId)
      toast.success('Deine Teilnahme wurde zurückgezogen.')
      await logAction('VOTE_CAST', userId, userName, { 
        poll_id: pollId, 
        poll_question: poll?.question,
        action: 'withdraw' 
      })
    } catch (err) {
      console.error('Error withdrawing vote:', err)
      toast.error('Zurückziehen fehlgeschlagen. Bitte prüfe deine Berechtigungen.')
    } finally {
      setIsVoting(null)
    }
  }

  const deleteSubcollectionDocs = async (pollId: string, subcollection: 'options' | 'votes') => {
    const snapshot = await getDocs(collection(db, 'polls', pollId, subcollection))
    if (snapshot.empty) return

    let batch = writeBatch(db)
    let operations = 0

    for (const item of snapshot.docs) {
      batch.delete(doc(db, 'polls', pollId, subcollection, item.id))
      operations += 1

      if (operations >= 400) {
        await batch.commit()
        batch = writeBatch(db)
        operations = 0
      }
    }

    if (operations > 0) {
      await batch.commit()
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!canManage) return
    const confirmed = window.confirm('Umfrage wirklich löschen? Stimmen und Optionen werden ebenfalls gelöscht.')
    if (!confirmed) return

    try {
      await deleteSubcollectionDocs(pollId, 'votes')
      await deleteSubcollectionDocs(pollId, 'options')
      await deleteDoc(doc(db, 'polls', pollId))

      const deletedPoll = polls.find((poll) => poll.id === pollId)
      if (userId) {
        await logAction('POLL_DELETED', userId, userName, {
          poll_id: pollId,
          question: deletedPoll?.question,
        })
      }

      setVotesByPoll((prev) => {
        const next = { ...prev }
        delete next[pollId]
        return next
      })

      toast.success('Umfrage gelöscht.')
    } catch (error) {
      console.error('Error deleting poll:', error)
      toast.error('Umfrage konnte nicht gelöscht werden.')
    }
  }

  const pollCards = displayedPolls.map((poll) => {
        const pollVotes = votesByPoll[poll.id] || poll.votes || []
        const totalVotes = pollVotes.length
        const userVote = userId ? pollVotes.find(v => v.user_id === userId) : null

        return (
          <Card key={poll.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{poll.question}</CardTitle>
                  {poll.allow_vote_change === false && (
                    <p className="text-xs text-amber-600 mt-1">Stimme ist final und nicht änderbar</p>
                  )}
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeletePoll(poll.id)}
                    title="Umfrage löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
                    {userId && (!userVote || poll.allow_vote_change === true) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-1 h-8"
                        onClick={() => handleVote(poll.id, option.id)}
                        disabled={!!isVoting || (userVote?.option_id === option.id)}
                      >
                        {isVoting === option.id ? 'Abstimmung...' : userVote ? 'Auswahl ändern' : 'Wählen'}
                      </Button>
                    )}
                  </div>
                )
              })}
              
              {!userId && (
                <div className="relative mt-8 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
                  <div className="bg-muted/30 p-8 rounded-xl border border-border flex flex-col items-center text-center relative shadow-sm">
                    {/* Floating Lock Icon on Border */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background p-2 rounded-full shadow-sm border border-border">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <p className="text-sm font-black uppercase tracking-widest mb-2 mt-2">Login erforderlich</p>
                    <p className="text-[10px] text-muted-foreground mb-6 leading-relaxed italic max-w-[320px]">
                      Um Manipulationen zu verhindern, ist eine Abstimmung nur mit verifiziertem Konto möglich.
                    </p>
                    
                    <div className="flex flex-col w-full max-w-[280px] gap-2">
                      <Button 
                        size="sm" 
                        className="h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20" 
                        onClick={() => router.push('/login')}
                      >
                        Jetzt Anmelden
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-primary/5" 
                        onClick={() => router.push('/zugang')}
                      >
                        Vorteile entdecken
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {userVote && (
                <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground italic">
                    Du hast bereits abgestimmt.
                  </p>
                  {poll.allow_vote_change === true && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive h-7"
                      onClick={() => handleWithdraw(poll.id)}
                      disabled={!!isVoting}
                    >
                      {isVoting === 'withdraw-' + poll.id ? 'Wird zurückgezogen...' : 'Teilnahme zurückziehen'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })



  if (!useScrollContainer) {
    return <div className="space-y-6">{pollCards}</div>
  }

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20">
      {pollCards}
    </div>
  )
}
