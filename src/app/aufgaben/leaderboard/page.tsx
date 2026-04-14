'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Trophy, 
  Medal, 
  CheckCircle2, 
  Zap,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { Profile } from '@/types/database'
import Image from 'next/image'

export default function TaskLeaderboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const [leaders, setLeaders] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const q = query(
      collection(db, 'profiles'), 
      orderBy('task_stats.completed_count', 'desc'),
      limit(20)
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile))
        .filter(p => (p.task_stats?.completed_count || 0) > 0))
      setLoading(false)
    }, (error) => {
      console.error('Error listening to leaderboard:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [authLoading])

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-6 w-6 text-yellow-500" />
      case 1: return <Medal className="h-6 w-6 text-slate-400" />
      case 2: return <Medal className="h-6 w-6 text-amber-700" />
      default: return <span className="font-bold text-muted-foreground w-6 text-center">{index + 1}.</span>
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/aufgaben">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Helfer-Ranking</h1>
      </div>

      <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
        <CardHeader className="bg-primary/5 border-b p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-primary fill-primary" />
            </div>
            <div>
              <CardTitle>Top Helfer</CardTitle>
              <p className="text-sm text-muted-foreground">Die Schüler mit den meisten erledigten Aufgaben.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leaders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground italic">
              Noch keine abgeschlossenen Aufgaben vorhanden.
            </div>
          ) : (
            <div className="divide-y">
              {leaders.map((leader, index) => (
                <div 
                  key={leader.id} 
                  className={`flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors ${leader.id === profile?.id ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(index)}
                    </div>
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-background shadow-sm">
                      <Image 
                        src={leader.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.id}`} 
                        alt={leader.full_name || 'User'} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className={`font-bold ${leader.id === profile?.id ? 'text-primary' : ''}`}>
                        {leader.full_name || 'Anonym'}
                        {leader.id === profile?.id && <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">Du</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{leader.class_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="font-black text-lg">{leader.task_stats?.completed_count || 0}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-0.5">
                        <CheckCircle2 className="h-2 w-2" /> Tasks
                      </p>
                    </div>
                    <div className="text-center w-12">
                      <p className="font-bold text-primary flex items-center justify-center gap-0.5">
                        <Zap className="h-3 w-3 fill-primary" />
                        {leader.task_stats?.earned_boosters || 0}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Booster</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {profile && !leaders.find(l => l.id === profile.id) && (profile.task_stats?.completed_count || 0) > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-muted-foreground">...</span>
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-background shadow-sm">
                <Image 
                  src={profile.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                  alt={profile.full_name || 'User'} 
                  fill 
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-primary">{profile.full_name || 'Anonym'}</p>
                <p className="text-xs text-muted-foreground">{profile.class_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-black text-lg">{profile.task_stats?.completed_count || 0}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-0.5">
                  <CheckCircle2 className="h-2 w-2" /> Tasks
                </p>
              </div>
              <div className="text-center w-12">
                <p className="font-bold text-primary flex items-center justify-center gap-0.5">
                  <Zap className="h-3 w-3 fill-primary" />
                  {profile.task_stats?.earned_boosters || 0}
                </p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Booster</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
