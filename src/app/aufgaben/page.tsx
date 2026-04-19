'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { 
  Plus, 
  Trophy, 
  Briefcase, 
  CheckCircle2, 
  Zap,
  ClipboardList,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { Task } from '@/types/database'
import { MarketplaceCard } from '@/components/aufgaben/MarketplaceCard'

export default function AufgabenPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!profile) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'tasks'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)))
      setLoading(false)
    }, (error) => {
      console.error('Error listening to tasks:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [authLoading, profile])

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Marktplatz gesperrt" 
          description="Du musst angemeldet sein, um Aufgaben im Marktplatz zu sehen oder anzunehmen."
          icon={<ClipboardList className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co') && profile?.is_approved

  const openTasks = tasks.filter(t => t.status === 'open')
  const myTasks = tasks.filter(t => t.assignee_id === profile.id && t.status !== 'completed')

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aufgaben Marktplatz</h1>
          <p className="text-muted-foreground">Erledige Aufgaben für unser Abi und verdiene dir Booster!</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/aufgaben/leaderboard">
            <Button variant="outline" className="gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Leaderboard
            </Button>
          </Link>
          {isPlanner && (
            <Link href="/aufgaben/neu">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Neue Aufgabe
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="marketplace" className="px-4 gap-2">
            <Briefcase className="h-4 w-4" />
            Marktplatz ({openTasks.length})
          </TabsTrigger>
          <TabsTrigger value="my-tasks" className="px-4 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Meine Aufgaben ({myTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-6">
          {openTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium">Keine offenen Aufgaben</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                Aktuell sind alle Aufgaben vergeben. Schau später wieder vorbei oder frag einen Planner!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {openTasks.map(task => <MarketplaceCard key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-tasks" className="mt-6">
          {myTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium">Du hast noch keine Aufgaben</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                Suche dir im Marktplatz eine Aufgabe aus, die dir gefällt, und leg los!
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  const trigger = document.querySelector('[value="marketplace"]') as HTMLElement
                  trigger?.click()
                }}
              >
                Zum Marktplatz
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {myTasks.map(task => <MarketplaceCard key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

