'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart2, ArrowLeft, Users, Lightbulb } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PollList } from '@/components/dashboard/PollList'
import { Poll, PollOption, PollVote } from '@/types/database'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default function SinglePollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile, loading: authLoading } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const fetchPollData = async () => {
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

          // Fetch submissions if authorized
          const canSeeDetailsLocal = 
            profile?.role === 'planner' || 
            profile?.role === 'admin' || 
            profile?.role === 'admin_main' || 
            profile?.role === 'admin_co' ||
            pollData.created_by === user?.uid
            
          if (canSeeDetailsLocal) {
            const subsSnap = await getDocs(collection(db, 'polls', id, 'submissions'))
            setSubmissions(subsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
          }
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching poll:', error)
        setLoading(false)
      }
    }
    
    fetchPollData()
  }, [id, authLoading, profile?.role, user?.uid])

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

  const canSeeDetails =
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co' ||
    poll.created_by === user?.uid
  const canVote = !!user

  if (!canSeeDetails) {
    return (
      <div className="py-24 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-destructive/10 text-destructive p-4 rounded-full w-fit mx-auto">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">Zugriff verweigert</h2>
          <p className="text-muted-foreground">
            Nur die Planer, Administratoren oder der Ersteller dieser Umfrage dürfen die detaillierten Ergebnisse und Teilnehmer einsehen.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/abstimmungen">Zurück zur Übersicht</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Group submissions by text
  const groupedSubmissions: Record<string, { text: string, users: string[] }> = {}
  submissions.forEach(s => {
    const key = (s.text || '').trim().toLowerCase()
    if (!groupedSubmissions[key]) {
      groupedSubmissions[key] = { text: s.text, users: [] }
    }
    if (s.user_name && !groupedSubmissions[key].users.includes(s.user_name)) {
      groupedSubmissions[key].users.push(s.user_name)
    }
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
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
        canManage={canSeeDetails}
        useScrollContainer={false}
      />

      {canSeeDetails && (
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Ergebnisse & Teilnehmer
            </CardTitle>
            <CardDescription>
              Hier siehst du, wer für welche Option gestimmt hat.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Tabs defaultValue="voters" className="w-full">
              <TabsList className="w-fit mb-6">
                <TabsTrigger value="voters" className="gap-2">
                  <Users className="h-4 w-4" />
                  Stimmen
                </TabsTrigger>
                {poll.allow_custom_options && (
                  <TabsTrigger value="submissions" className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Briefkasten
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="voters" className="space-y-6 outline-none">
                {(!poll.options || poll.options.length === 0) ? (
                  <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                    <p className="text-sm italic">Für diese Umfrage wurden keine Antwortmöglichkeiten definiert.</p>
                  </div>
                ) : poll.votes?.length === 0 ? (
                   <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                    <p className="text-sm italic">Es wurden bisher noch keine Stimmen abgegeben.</p>
                  </div>
                ) : (
                  poll.options.map(option => {
                    const optionVotes = poll.votes?.filter(v => 
                      v.option_ids ? v.option_ids.includes(option.id) : v.option_id === option.id
                    ) || []
                    
                    return (
                      <div key={option.id} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-bold text-sm">{option.option_text}</h4>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">
                            {optionVotes.length}
                          </span>
                        </div>
                        
                        {optionVotes.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground/50 italic">Keine Stimmen für diese Option.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {optionVotes.map(vote => (
                              <div key={vote.id} className="text-[9px] bg-card text-muted-foreground px-2 py-1 rounded-md border border-border/60 shadow-subtle font-bold tracking-tight">
                                {vote.user_name || 'Unbekannt'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </TabsContent>

              {poll.allow_custom_options && (
                <TabsContent value="submissions" className="space-y-4 outline-none">
                  {Object.values(groupedSubmissions).length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60 flex flex-col items-center gap-2">
                      <Lightbulb className="h-8 w-8 opacity-50" />
                      <p className="text-sm italic">Der Briefkasten ist leer. Es wurden noch keine Vorschläge eingereicht.</p>
                    </div>
                  ) : (
                    Object.values(groupedSubmissions).map((group, idx) => (
                      <div key={idx} className="p-4 rounded-xl border bg-card shadow-subtle space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                          <Lightbulb className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-bold text-foreground">{group.text}</p>
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-black shrink-0">
                            {group.users.length}x
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 items-center pt-2 border-t border-border/40">
                          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Von:</span>
                          {group.users.map((u, i) => (
                            <span key={i} className="text-[9px] font-bold text-primary/70">{u}{i < group.users.length - 1 ? ',' : ''}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
