'use client'

import { Poll, PollVote, UserRole } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/firebase'
import { collection, deleteDoc, doc, getDocs, serverTimestamp, writeBatch, runTransaction, addDoc, increment, arrayUnion } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Lock, Eye, Users, Share2, Send, Lightbulb } from 'lucide-react'
import { logAction } from '@/lib/logging'
import { usePopupManager } from '@/modules/popup/usePopupManager'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'


interface PollListProps {
  polls: Poll[]
  userId?: string
  userName?: string | null
  userRole?: UserRole
  userGroups?: string[]
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
  userRole,
  userGroups = [],
  canVote = false,
  canManage = false,
  limit,
  useScrollContainer = true,
  loading = false,
}: PollListProps) {
  const router = useRouter()
  const { confirm } = usePopupManager()
  const [isVoting, setIsVoting] = useState<string | null>(null)
  const [votesByPoll, setVotesByPoll] = useState<Record<string, PollVote[]>>({})
  const [detailsPoll, setDetailsPoll] = useState<Poll | null>(null)
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [isSubmittingCustom, setIsSubmittingCustom] = useState<string | null>(null)

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

  // Filter polls based on visibility settings
  const filteredPolls = polls.filter(poll => {
    // Managers and creators can always see the poll
    if (canManage || poll.created_by === userId) return true;
    
    // Public polls are visible to everyone
    if (poll.is_public !== false) return true;
    
    // Check target roles
    if (poll.target_roles && userRole && poll.target_roles.includes(userRole)) return true;
    
    // Check target groups
    if (poll.target_groups && userGroups.some(g => poll.target_groups?.includes(g))) return true;
    
    return false;
  })

  const displayedPolls = limit ? filteredPolls.slice(0, limit) : filteredPolls

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
    const userSelection = existingVote?.option_ids || (existingVote?.option_id ? [existingVote.option_id] : [])

    // Early validation: Check limit before transaction to avoid console errors
    if (poll?.multiple_choice && !userSelection.includes(optionId) && userSelection.length >= (poll.max_votes || 1)) {
      toast.error(`Du kannst maximal ${poll.max_votes} Stimmen vergeben.`)
      return
    }

    if (existingVote && poll?.allow_vote_change !== true) {
      toast.error('Diese Umfrage erlaubt keine nachträgliche Änderung der Stimme.')
      return
    }

    if (!existingVote && poll?.allow_vote_change === false) {
      const confirmed = await confirm({
        title: 'Final abstimmen?',
        content: 'Diese Umfrage erlaubt keine spätere Meinungsänderung. Wirklich jetzt abstimmen?',
        priority: 'warning',
        confirmLabel: 'Jetzt abstimmen',
      })
      if (!confirmed) return
    }

    setIsVoting(optionId)
    
    try {
      const voteRef = doc(db, 'polls', pollId, 'votes', userId)
      const profileRef = doc(db, 'profiles', userId)
      
      let isFirstReward = false;
      let finalOptionIds: string[] = []
      let action: 'added' | 'removed' | 'changed' | string = 'changed'

      await runTransaction(db, async (transaction) => {
        const voteSnap = await transaction.get(voteRef)
        const profileSnap = await transaction.get(profileRef)
        
        const profileData = profileSnap.exists() ? profileSnap.data() : null
        const claimedPolls = profileData?.booster_stats?.claimed_poll_boosters || []
        const currentVoteData = voteSnap.exists() ? voteSnap.data() as PollVote : null
        
        isFirstReward = !claimedPolls.includes(pollId)

        if (poll?.multiple_choice) {
          const currentOptionIds = currentVoteData?.option_ids || (currentVoteData?.option_id ? [currentVoteData.option_id] : [])
          
          if (currentOptionIds.includes(optionId)) {
            // Remove
            finalOptionIds = currentOptionIds.filter(id => id !== optionId)
            action = 'removed'
          } else {
            // Add
            if (currentOptionIds.length >= (poll.max_votes || 1)) {
              // This is a safety check in case state was out of sync, 
              // but we throw a string to distinguish from technical errors
              throw "LIMIT_REACHED"
            }
            finalOptionIds = [...currentOptionIds, optionId]
            action = 'added'
          }
        } else {
          finalOptionIds = [optionId]
          action = existingVote ? 'changed' : 'added'
        }
        
        transaction.set(voteRef, {
          poll_id: pollId,
          option_id: finalOptionIds[0] || null, // Keep for backward compatibility
          option_ids: finalOptionIds,
          user_id: userId,
          user_name: userName,
          updated_at: serverTimestamp(),
          created_at: voteSnap.exists() ? currentVoteData?.created_at : serverTimestamp()
        }, { merge: true })

        if (isFirstReward) {
          transaction.update(profileRef, {
            'booster_stats.extra_available': increment(1),
            'booster_stats.claimed_poll_boosters': arrayUnion(pollId)
          })
        }
      })

      await refreshVotesForPoll(pollId)
      
      if (isFirstReward) {
        toast.success('Stimme gespeichert. Du hast 1 Booster-Pack als Belohnung erhalten.')
      } else if (action === 'added') {
        toast.success('Stimme hinzugefügt.')
      } else if (action === 'removed') {
        toast.success('Stimme entfernt.')
      } else {
        toast.success('Stimme geändert.')
      }
      
      const optionText = poll?.options?.find(o => o.id === optionId)?.option_text || optionId
      await logAction('VOTE_CAST', userId, userName, { 
        poll_id: pollId, 
        poll_question: poll?.question,
        option_id: optionId,
        option_text: optionText,
        action: action
      })
    } catch (err: any) {
      if (err === "LIMIT_REACHED") {
        toast.error(`Du kannst maximal ${poll?.max_votes} Stimmen vergeben.`)
      } else {
        console.error('Error voting:', err)
        toast.error('Abstimmung fehlgeschlagen.')
      }
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

    const confirmed = await confirm({
      title: 'Stimme zurückziehen?',
      content: 'Möchtest du deine Stimme wirklich zurückziehen?',
      priority: 'warning',
      confirmLabel: 'Zurückziehen',
    })
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

  const handleCustomOption = async (pollId: string) => {
    const input = customInputs[pollId]?.trim()
    if (!input || !userId) return

    const poll = polls.find(p => p.id === pollId)
    if (!poll || !poll.allow_custom_options) return

    // 1. Enforce character length
    const maxLength = poll.custom_options_max_length || 50
    if (input.length > maxLength) {
      toast.error(`Deine Idee ist zu lang (max. ${maxLength} Zeichen).`)
      return
    }

    // 2. Enforce total vote limit
    const existingVote = (votesByPoll[pollId] || poll.votes || []).find(v => v.user_id === userId)
    const userSelection = existingVote?.option_ids || (existingVote?.option_id ? [existingVote.option_id] : [])

    // 2. Enforce total vote limit ONLY for multiple choice. 
    // For single choice, we allow submission because handleVote will just replace the previous vote.
    if (poll.multiple_choice && userSelection.length >= (poll.max_votes || 1)) {
      toast.error(`Du kannst maximal ${poll.max_votes} Stimmen vergeben.`)
      return
    }

    // 3. Enforce personal proposal limit
    const maxProposals = poll.max_custom_proposals || 1
    const userCustomOptionsCount = poll.options?.filter(o => (o as any).created_by === userId && (o as any).is_custom).length || 0
    
    if (userCustomOptionsCount >= maxProposals) {
      toast.error(`Du hast bereits das Limit von ${maxProposals} eigenen Vorschlägen erreicht.`)
      return
    }

    setIsSubmittingCustom(pollId)
    
    try {
      // Check if option already exists (case-insensitive)
      const optionsSnap = await getDocs(collection(db, 'polls', pollId, 'options'))
      const existingOption = optionsSnap.docs.find(d => d.data().option_text.toLowerCase() === input.toLowerCase())

      let optionIdToVote = existingOption?.id

      if (!optionIdToVote) {
        // Create new option
        const optionsRef = collection(db, 'polls', pollId, 'options')
        const newOptionDoc = await addDoc(optionsRef, {
          poll_id: pollId,
          option_text: input,
          created_by: userId,
          is_custom: true
        })
        optionIdToVote = newOptionDoc.id
      }

      // Cast vote
      if (optionIdToVote) {
        await handleVote(pollId, optionIdToVote)
      }

      // Clear input
      setCustomInputs(prev => ({ ...prev, [pollId]: '' }))
    } catch (error) {
      console.error('Error adding custom option:', error)
      toast.error('Fehler beim Hinzufügen deiner Idee.')
    } finally {
      setIsSubmittingCustom(null)
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
    const confirmed = await confirm({
      title: 'Umfrage löschen?',
      content: 'Umfrage wirklich löschen? Stimmen und Optionen werden ebenfalls gelöscht.',
      priority: 'high',
      confirmLabel: 'Umfrage löschen',
      confirmVariant: 'destructive',
    })
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

  const handleShare = (pollId: string) => {
    const url = `${window.location.origin}/abstimmungen/${pollId}`
    navigator.clipboard.writeText(url)
    toast.success('Link in die Zwischenablage kopiert!')
  }

  const pollCards = displayedPolls.map((poll) => {
        const pollVotes = votesByPoll[poll.id] || poll.votes || []
        const totalParticipants = pollVotes.length
        const userVote = userId ? pollVotes.find(v => v.user_id === userId) : null
        const userSelection = userVote?.option_ids || (userVote?.option_id ? [userVote.option_id] : [])

        return (
          <Card key={poll.id} className={poll.is_public === false ? 'border-primary/20 bg-primary/5' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{poll.question}</CardTitle>
                    {poll.is_public === false && (
                      <Users className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  {poll.multiple_choice && (
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-tight text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                        Multiple Choice ({userSelection.length} / {poll.max_votes} Stimmen)
                      </p>
                    </div>
                  )}
                  {poll.allow_vote_change === false && (
                    <p className="text-[10px] font-bold uppercase tracking-tight text-amber-600">Stimme ist final</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleShare(poll.id)}
                    title="Link kopieren"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setDetailsPoll(poll)}
                        title="Ergebnisse im Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeletePoll(poll.id)}
                        title="Umfrage löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardDescription>
                {totalParticipants} {totalParticipants === 1 ? 'Teilnehmer' : 'Teilnehmer'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {poll.options?.map((option) => {
                const optionVotes = pollVotes.filter(v => v.option_ids ? v.option_ids.includes(option.id) : v.option_id === option.id).length
                const percentage = totalParticipants > 0 ? Math.round((optionVotes / totalParticipants) * 100) : 0
                const isSelected = userSelection.includes(option.id)

                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isSelected ? 'font-bold text-primary' : ''}>
                        {option.option_text} {isSelected && '(Gewählt)'}
                      </span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className={isSelected ? 'bg-primary/20' : ''} />
                    {userId && (!userVote || poll.allow_vote_change === true) && (
                      <Button 
                        variant={isSelected ? "secondary" : "outline"} 
                        size="sm" 
                        className="w-full mt-1 h-8 text-[10px] font-bold uppercase tracking-widest transition-all"
                        onClick={() => handleVote(poll.id, option.id)}
                        disabled={!!isVoting || (isSelected && poll.allow_vote_change === false)}
                      >
                        {isVoting === option.id 
                          ? 'Abstimmung...' 
                          : isSelected 
                            ? 'Abwählen' 
                            : userSelection.length >= (poll.max_votes || 1) 
                              ? 'Limit erreicht' 
                              : 'Wählen'}
                      </Button>
                    )}
                  </div>
                )
              })}
              
              {poll.allow_custom_options && userId && (userSelection.length < (poll.max_votes || 1)) && (
                <div className="pt-4 mt-2 border-t border-dashed border-border/60 animate-in fade-in slide-in-from-top-2 duration-500">
                  {(() => {
                    const maxProposals = poll.max_custom_proposals || 1
                    const userCustomOptionsCount = poll.options?.filter(o => (o as any).created_by === userId && (o as any).is_custom).length || 0
                    const limitReached = userCustomOptionsCount >= maxProposals
                    const maxLength = poll.custom_options_max_length || 50
                    const currentLength = (customInputs[poll.id] || '').length

                    if (limitReached) {
                      return (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Du hast dein Limit von {maxProposals} {maxProposals === 1 ? 'Vorschlag' : 'Vorschlägen'} erreicht.
                          </span>
                        </div>
                      )
                    }

                    return (
                      <>
                        <div className="flex items-center justify-between mb-2 px-1">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-3 w-3 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eigene Idee einreichen</span>
                          </div>
                          <span className={`text-[9px] font-bold ${currentLength > maxLength * 0.8 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {currentLength}/{maxLength}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="z.B. Dein Motto-Vorschlag..."
                            value={customInputs[poll.id] || ''}
                            onChange={(e) => setCustomInputs(prev => ({ ...prev, [poll.id]: e.target.value }))}
                            className="h-9 text-xs"
                            maxLength={maxLength}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomOption(poll.id)}
                            disabled={!!isSubmittingCustom}
                          />
                          <Button 
                            size="icon" 
                            className="h-9 w-9 shrink-0" 
                            onClick={() => handleCustomOption(poll.id)}
                            disabled={!customInputs[poll.id]?.trim() || !!isSubmittingCustom}
                          >
                            {isSubmittingCustom === poll.id ? (
                              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-2 italic pl-1">
                          Dein Vorschlag wird nach dem Absenden für alle wählbar. ({userCustomOptionsCount}/{maxProposals} eingereicht)
                        </p>
                      </>
                    )
                  })()}
                </div>
              )}
              
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
                  <p className="text-[10px] text-muted-foreground italic">
                    Du hast bereits abgestimmt.
                  </p>
                  {poll.allow_vote_change === true && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:text-destructive h-7"
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

  return (
    <div className={useScrollContainer ? "h-full overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20" : "space-y-6"}>
      {pollCards}

      {/* Details Dialog */}
      <Dialog open={!!detailsPoll} onOpenChange={(open) => !open && setDetailsPoll(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Stimmen im Detail</DialogTitle>
            <DialogDescription>
              {detailsPoll?.question}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
            {detailsPoll?.options?.map(option => {
              const pollVotes = votesByPoll[detailsPoll.id] || detailsPoll.votes || []
              const optionVotes = pollVotes.filter(v => v.option_ids ? v.option_ids.includes(option.id) : v.option_id === option.id)
              
              return (
                <div key={option.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-bold text-sm">{option.option_text}</h4>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                      {optionVotes.length} {optionVotes.length === 1 ? 'Stimme' : 'Stimmen'}
                    </span>
                  </div>
                  
                  {optionVotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-2">Noch keine Stimmen.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pl-2">
                      {optionVotes.map(vote => (
                        <div key={vote.id} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
                          {vote.user_name || 'Unbekannter Nutzer'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t text-[10px] text-muted-foreground italic">
            Hinweis: Namen werden zum Zeitpunkt der Abstimmung gespeichert. Spätere Namensänderungen werden hier ggf. nicht sofort reflektiert.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
