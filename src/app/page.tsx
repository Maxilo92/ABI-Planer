'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot, doc, where, getDocs } from 'firebase/firestore'
import { Countdown } from '@/components/dashboard/Countdown'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { ClassLeaderboard } from '@/components/dashboard/ClassLeaderboard'
import { PollList } from '@/components/dashboard/PollList'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'
import { toDate } from '@/lib/utils'
import { Poll, PollOption, PollVote } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { profile, user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [finances, setFinances] = useState<any[]>([])
  const [currentFunding, setCurrentFunding] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Listen to Settings
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data())
      } else {
        // Fallback defaults so the page doesn't break
        setSettings({ 
          ball_date: '2026-06-20T18:00:00Z', 
          funding_goal: 10000 
        })
      }
    })

    // 2. Listen to Todos (top 5)
    const todosRef = collection(db, 'todos')
    const qTodos = query(todosRef, orderBy('created_at', 'desc'), limit(5))
    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    // 3. Listen to Events (next 3)
    const eventsRef = collection(db, 'events')
    const now = new Date().toISOString()
    const qEvents = query(eventsRef, where('event_date', '>=', now), orderBy('event_date', 'asc'), limit(3))
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    // 4. Listen to Finances for status
    const financesRef = collection(db, 'finances')
    const unsubscribeFinances = onSnapshot(financesRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setFinances(docs)
      const total = docs.reduce((acc: number, doc: any) => acc + Number(doc.amount), 0)
      setCurrentFunding(total)
    })

    // 5. Listen to News (last 2)
    const newsRef = collection(db, 'news')
    const qNews = query(newsRef, orderBy('created_at', 'desc'), limit(2))
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }, (error) => {
      console.error('Error fetching news:', error)
    })

    // 6. Listen to Polls (last 2 active)
    const pollsRef = collection(db, 'polls')
    const qPolls = query(pollsRef, where('is_active', '==', true), orderBy('created_at', 'desc'), limit(2))
    const unsubscribePolls = onSnapshot(qPolls, async (snapshot) => {
      const pollsData = await Promise.all(snapshot.docs.map(async (pDoc) => {
        const poll = { id: pDoc.id, ...pDoc.data() } as Poll
        
        // Fetch options
        const optionsRef = collection(db, 'poll_options')
        const qOptions = query(optionsRef, where('poll_id', '==', pDoc.id))
        const optionsSnap = await getDocs(qOptions)
        poll.options = optionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PollOption))

        // Fetch votes
        const votesRef = collection(db, 'poll_votes')
        const qVotes = query(votesRef, where('poll_id', '==', pDoc.id))
        const votesSnap = await getDocs(qVotes)
        poll.votes = votesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PollVote))

        return poll
      }))
      setPolls(pollsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching polls:', error)
      setLoading(false)
    })

    return () => {
      unsubscribeSettings()
      unsubscribeTodos()
      unsubscribeEvents()
      unsubscribeFinances()
      unsubscribeNews()
      unsubscribePolls()
    }
  }, [])

  const canManage = (profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin') && profile?.is_approved

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Verifiziere Anmeldung...</div>
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Dashboard-Daten...</div>
  }

  // Role-based component ordering
  const renderNews = () => (
    <section key="news" className="bg-secondary/30 rounded-xl p-6 border">
      <h3 className="text-xl font-bold mb-4">Letzte Updates</h3>
      <div className="space-y-4">
        {news && news.length > 0 ? (
          news.map((item) => {
            const isNew = user && item.viewed_by && !item.viewed_by.includes(user.uid)

            return (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className={`block bg-background rounded-lg p-4 border shadow-sm transition-colors hover:bg-muted/30 ${isNew ? 'ring-1 ring-primary border-primary/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{item.title}</h4>
                    {isNew && (
                      <Badge variant="default" className="text-[8px] px-1 py-0 h-3.5 bg-primary animate-pulse">
                        NEU
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {item.created_at ? toDate(item.created_at).toLocaleDateString('de-DE') : 'Neu'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.content}
                </p>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t pt-2">
                  <span>Verfasst von: {item.author_name || 'Unbekannt'}</span>
                  <span className="inline-flex items-center gap-1">
                    Zum Beitrag <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            )
          })
        ) : (
          <p className="text-sm text-muted-foreground italic">Noch keine Neuigkeiten vorhanden.</p>
        )}
      </div>
    </section>
  )

  const renderPolls = () => (
    <div key="polls" className="space-y-4">
      <h3 className="text-xl font-bold">Aktuelle Abstimmungen</h3>
      <PollList polls={polls} userId={user?.uid || ''} isApproved={profile?.is_approved} />
    </div>
  )

  const renderLeaderboard = () => (
    <ClassLeaderboard key="leaderboard" finances={finances || []} goal={settings?.funding_goal || 10000} />
  )

  const renderTodos = () => (
    <TodoList key="todos" todos={todos || []} canManage={canManage} />
  )

  const renderEvents = () => (
    <div key="events" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CalendarEvents events={events || []} />
    </div>
  )

  const renderTopStats = () => (
    <div key="top-stats" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Countdown 
        targetDate={settings?.ball_date || '2026-06-20T18:00:00'} 
        editButton={canManage ? <EditSettingsDialog currentDate={settings?.ball_date} currentGoal={settings?.funding_goal || 10000} /> : null}
      />
      <FundingStatus current={currentFunding} goal={settings?.funding_goal || 10000} />
    </div>
  )

  // Determine order based on role
  let components = []
  const role = profile?.role

  if (!profile) {
    // Guest
    components = [renderNews(), renderTopStats(), renderEvents(), renderPolls(), renderLeaderboard(), renderTodos()]
  } else if (role === 'viewer') {
    // Student
    components = [renderPolls(), renderLeaderboard(), renderNews(), renderTopStats(), renderEvents(), renderTodos()]
  } else if (role === 'planner' || role === 'admin_main' || role === 'admin_co' || role === 'admin') {
    // Planner / Admin
    components = [renderTopStats(), renderTodos(), renderLeaderboard(), renderPolls(), renderEvents(), renderNews()]
  } else {
    // Fallback
    components = [renderTopStats(), renderTodos(), renderLeaderboard(), renderEvents(), renderNews()]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">ABI Planer 2026</h1>
        <p className="text-muted-foreground">Willkommen zurück! Hier ist der aktuelle Stand der Dinge.</p>
      </div>

      <div className="flex flex-col gap-6">
        {components}
      </div>
    </div>
  )
}
