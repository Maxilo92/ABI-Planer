'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc, where, setDoc } from 'firebase/firestore'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { PollList } from '@/components/dashboard/PollList'
import { ClassLeaderboard } from '@/components/dashboard/ClassLeaderboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSorting } from '@/hooks/useDashboardSorting'
import { toDate } from '@/lib/utils'
import { DashboardComponentKey, Poll, PollOption, PollVote, FinanceEntry } from '@/types/database'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [allFinances, setAllFinances] = useState<FinanceEntry[]>([])
  const [currentFunding, setCurrentFunding] = useState(0)
  const [expenseGoal, setExpenseGoal] = useState(0)
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
          ball_date: '2027-06-19T18:00:00Z', 
          funding_goal: 10000 
        })
      }
    })

    // 2. Listen to Todos (top 5)
    const todosRef = collection(db, 'todos')
    const qTodos = query(todosRef, orderBy('created_at', 'desc'), limit(5))
    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      const visibleTodos = snapshot.docs
        .map((entryDoc) => ({ id: entryDoc.id, ...entryDoc.data() }))
        .filter((todo: any) => todo.status !== 'done')
        .slice(0, 5)
      setTodos(visibleTodos)
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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry))
      setAllFinances(data)
      
      const amounts = data.map((entry) => Number(entry.amount) || 0)
      const incomeTotal = amounts.filter((value) => value > 0).reduce((acc, value) => acc + value, 0)
      const plannedExpenses = amounts.filter((value) => value < 0).reduce((acc, value) => acc + Math.abs(value), 0)

      setCurrentFunding(incomeTotal)
      setExpenseGoal(plannedExpenses)
    })

    // 5. Listen to News (last 2)
    const newsRef = collection(db, 'news')
    const qNews = query(newsRef, orderBy('created_at', 'desc'), limit(2))
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    // 6. Listen to Polls (last 5)
    const pollsRef = collection(db, 'polls')
    const qPolls = query(pollsRef, where('is_active', '==', true), orderBy('created_at', 'desc'), limit(5))
    const unsubscribePolls = onSnapshot(qPolls, async (snapshot) => {
      const pollsData: Poll[] = []
      for (const doc of snapshot.docs) {
        const poll = { id: doc.id, ...doc.data() } as Poll
        const optionsSnap = await getDocs(collection(db, 'polls', doc.id, 'options'))
        const options = optionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollOption))
        const votesSnap = await getDocs(collection(db, 'polls', doc.id, 'votes'))
        const votes = votesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollVote))
        pollsData.push({ ...poll, options, votes })
      }
      setPolls(pollsData)
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

  const canManage = (
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  ) && profile?.is_approved

  const handleTicketSalesChange = async (value: number) => {
    if (!canManage) return
    try {
      await setDoc(doc(db, 'settings', 'config'), { expected_ticket_sales: value }, { merge: true })
    } catch (error) {
      console.error('Error updating expected ticket sales:', error)
    }
  }

  const sortedComponents = useDashboardSorting(profile, todos, events, polls, news)

  const componentLinks: Record<DashboardComponentKey, string> = {
    funding: '/finanzen',
    news: '/news',
    todos: '/todos',
    events: '/kalender',
    polls: '/abstimmungen',
    leaderboard: '/finanzen'
  }

  const NewsPreview = ({ items }: { items: any[] }) => (
    <Card className="flex flex-col h-full border-none shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Letzte Updates</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {items && items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                onClick={(e) => e.stopPropagation()} // Prevent card navigation
                className="block bg-background rounded-xl p-4 border border-border/40 shadow-subtle transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {item.created_at ? toDate(item.created_at).toLocaleDateString('de-DE') : 'Neu'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.content}
                </p>
                <div className="mt-2 flex items-center justify-end text-[10px] font-medium text-primary">
                  <span className="inline-flex items-center gap-1">
                    Zum Beitrag <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">Noch keine Neuigkeiten vorhanden.</p>
          )}
        </div>
        <Link href="/news" onClick={(e) => e.stopPropagation()} className="block mt-6 text-xs font-semibold text-center hover:underline text-muted-foreground">
          Alle News ansehen
        </Link>
      </CardContent>
    </Card>
  )

  const renderComponent = (key: DashboardComponentKey) => {
    const ComponentContent = () => {
      switch (key) {
        case 'funding':
          return (
            <FundingStatus
              key="funding"
              current={currentFunding}
              goal={expenseGoal > 0 ? expenseGoal : (settings?.funding_goal || 10000)}
              initialTicketSales={settings?.expected_ticket_sales ?? 150}
              onTicketSalesChange={handleTicketSalesChange}
            />
          )
        case 'news':
          return <NewsPreview key="news" items={news} />
        case 'todos':
          return <TodoList key="todos" todos={todos || []} canManage={canManage} />
        case 'events':
          return <CalendarEvents key="events" events={events || []} />
        case 'polls':
          return (
            <PollList
              key="polls"
              polls={polls}
              userId={profile?.id || ''}
              canVote={true}
              canManage={canManage}
              limit={2}
            />
          )
        case 'leaderboard':
          return (
            <ClassLeaderboard
              key="leaderboard"
              finances={allFinances}
              goal={settings?.funding_goal || 10000}
            />
          )
        default:
          return null
      }
    }

    return (
      <div 
        key={key}
        onClick={() => router.push(componentLinks[key])}
        className="cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group h-full"
      >
        <div className="pointer-events-auto h-full [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_input]:pointer-events-auto" onClick={(e) => {
          // Check if the click target or its parent is a button or link
          const target = e.target as HTMLElement
          if (target.closest('button') || target.closest('a') || target.closest('input')) {
            e.stopPropagation()
          }
        }}>
          <ComponentContent />
        </div>
      </div>
    )
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">ABI Planer 2027</h1>
          {canManage && (
            <EditSettingsDialog 
              currentDate={settings?.ball_date} 
              currentGoal={settings?.funding_goal || 10000} 
            />
          )}
        </div>
        <p className="text-muted-foreground">Willkommen zurück! Hier ist der aktuelle Stand der Dinge.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedComponents.map(key => renderComponent(key))}
      </div>
    </div>
  )
}
