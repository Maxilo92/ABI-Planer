'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { 
  Plus, 
  Trophy, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Zap,
  ChevronRight,
  ClipboardList
} from 'lucide-react'
import Link from 'next/link'
import { Task } from '@/types/database'
import Image from 'next/image'

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
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

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'open': return <Badge variant="secondary">Offen</Badge>
      case 'claimed': return <Badge className="bg-blue-500 hover:bg-blue-600">Angenommen</Badge>
      case 'in_review': return <Badge className="bg-yellow-500 hover:bg-yellow-600">In Prüfung</Badge>
      case 'rejected': return <Badge variant="destructive">Nachbesserung nötig</Badge>
      case 'completed': return <Badge className="bg-green-500 hover:bg-green-600">Erledigt</Badge>
    }
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Link href={`/aufgaben/${task.id}`}>
      <Card className="h-full hover:shadow-md transition-all cursor-pointer group border-muted-foreground/10">
        <CardHeader className="p-4 space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {task.title}
            </h3>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1 text-primary font-bold">
                <Zap className="h-4 w-4 fill-primary" />
                <span>{task.reward_boosters}</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Booster</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(task.status)}
            <Badge variant="outline">Lvl {task.complexity}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3.75rem]">
            {task.description}
          </p>
          {task.task_image_urls?.[0] && (
            <div className="relative h-32 w-full rounded-md overflow-hidden bg-muted">
              <Image 
                src={task.task_image_urls[0]} 
                alt={task.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(typeof task.created_at === 'object' && 'seconds' in task.created_at ? task.created_at.seconds * 1000 : task.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-medium">
            Details <ChevronRight className="h-3 w-3" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openTasks.map(task => <TaskCard key={task.id} task={task} />)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
