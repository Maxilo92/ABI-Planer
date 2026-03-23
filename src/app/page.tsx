'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc, where, setDoc } from 'firebase/firestore'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { PollList } from '@/components/dashboard/PollList'
import { ClassRanking } from '@/components/dashboard/ClassRanking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSorting } from '@/hooks/useDashboardSorting'
import { useGiftNotices } from '@/hooks/useGiftNotices'
import { toDate } from '@/lib/utils'
import { DashboardComponentKey, Poll, PollOption, PollVote, FinanceEntry } from '@/types/database'
import { GiftNoticeBanner } from '@/components/dashboard/GiftNoticeBanner'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { logAction } from '@/lib/logging'

export default function Dashboard() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [allFinances, setAllFinances] = useState<FinanceEntry[]>([])
  const [currentFunding, setCurrentFunding] = useState(0)
  const [initialLoadState, setInitialLoadState] = useState({
    settings: false,
    todos: false,
    events: false,
    finances: false,
    news: false,
    polls: false,
  })

  const markLoaded = (key: keyof typeof initialLoadState) => {
    setInitialLoadState((previous) => (previous[key] ? previous : { ...previous, [key]: true }))
  }

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
      markLoaded('settings')
    }, (error) => {
      console.error('Error listening to settings:', error)
      // Provide fallback values on error too
      setSettings({ 
        ball_date: '2027-06-19T18:00:00Z', 
        funding_goal: 10000 
      })
      markLoaded('settings')
    })

    // 2. Listen to Todos (top 5 most relevant tasks total)
    const todosRef = collection(db, 'todos')
    const unsubscribeTodos = onSnapshot(todosRef, (snapshot) => {
      const allTodosData = snapshot.docs.map((entryDoc) => ({ 
        id: entryDoc.id, 
        ...entryDoc.data() 
      })) as any[]
      
      const openTodos = allTodosData.filter(t => t.status !== 'done')
      
      // Determine relevance for ALL open tasks
      const userCourse = profile?.class_name
      const userPlanningGroup = profile?.planning_group
      const currentUserId = user?.uid

      const scoredTodos = openTodos.map(todo => {
        let score = 0
        
        // Priority 1: Directly assigned to user
        if (todo.assigned_to_user === currentUserId) score += 100
        
        // Priority 2: Assigned to user's planning group
        if (todo.assigned_to_group && todo.assigned_to_group === userPlanningGroup) score += 50
        
        // Priority 3: Assigned to user's class
        if (todo.assigned_to_class && todo.assigned_to_class === userCourse) score += 25
        
        // Priority 4: Deadline (sooner = more relevant)
        if (todo.deadline_date) {
          const daysToDeadline = (toDate(todo.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          if (daysToDeadline < 0) score += 40 // Overdue
          else if (daysToDeadline < 7) score += 20 // Within a week
          else if (daysToDeadline < 14) score += 10 // Within two weeks
        }

        return { ...todo, relevanceScore: score }
      })

      // Sort ALL tasks by relevance score (desc), then deadline (asc), then creation date (desc)
      const sortedTodos = scoredTodos.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
        
        const dateA = a.deadline_date ? toDate(a.deadline_date).getTime() : Infinity
        const dateB = b.deadline_date ? toDate(b.deadline_date).getTime() : Infinity
        if (dateA !== dateB) return dateA - dateB
        
        const createdA = a.created_at ? toDate(a.created_at).getTime() : 0
        const createdB = b.created_at ? toDate(b.created_at).getTime() : 0
        return createdB - createdA
      })

      // Take exactly the top 5 items total
      const finalTodos = sortedTodos.slice(0, 5)

      setTodos(finalTodos)
      markLoaded('todos')
    }, (error) => {
      console.error('Error listening to todos:', error)
      markLoaded('todos')
    })

    // 3. Listen to Events (next 3)
    const eventsRef = collection(db, 'events')
    const now = new Date().toISOString()
    const qEvents = query(eventsRef, where('start_date', '>=', now), orderBy('start_date', 'asc'), limit(3))
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      markLoaded('events')
    }, (error) => {
      console.error('Error listening to events:', error)
      markLoaded('events')
    })

    // 4. Listen to Finances for status
    const financesRef = collection(db, 'finances')
    const unsubscribeFinances = onSnapshot(financesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry))
      setAllFinances(data)
      
      const amounts = data.map((entry) => Number(entry.amount) || 0)
      const incomeTotal = amounts.filter((value) => value > 0).reduce((acc, value) => acc + value, 0)
      const expenseTotal = amounts.filter((value) => value < 0).reduce((acc, value) => acc + Math.abs(value), 0)

      setCurrentFunding(incomeTotal - expenseTotal)
      markLoaded('finances')
    }, (error) => {
      console.error('Error listening to finances:', error)
      markLoaded('finances')
    })

    // 5. Listen to News (last 2)
    const newsRef = collection(db, 'news')
    const qNews = query(newsRef, orderBy('created_at', 'desc'), limit(2))
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      markLoaded('news')
    }, (error) => {
      console.error('Error listening to news:', error)
      markLoaded('news')
    })

    // 6. Listen to Polls (last 5)
    const pollsRef = collection(db, 'polls')
    const qPolls = query(pollsRef, where('is_active', '==', true), orderBy('created_at', 'desc'), limit(5))
    const unsubscribePolls = onSnapshot(qPolls, async (snapshot) => {
      try {
        const pollsData: Poll[] = []
        for (const doc of snapshot.docs) {
          const poll = { id: doc.id, ...doc.data() } as Poll
          
          // These might fail for unauthenticated users if rules are tricky
          let options: PollOption[] = []
          try {
            const optionsSnap = await getDocs(collection(db, 'polls', doc.id, 'options'))
            options = optionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollOption))
          } catch (e) {
            console.error(`Error fetching options for poll ${doc.id}:`, e)
          }

          let votes: PollVote[] = []
          try {
            const votesSnap = await getDocs(collection(db, 'polls', doc.id, 'votes'))
            votes = votesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PollVote))
          } catch (e) {
            console.error(`Error fetching votes for poll ${doc.id}:`, e)
          }

          pollsData.push({ ...poll, options, votes })
        }
        setPolls(pollsData)
      } catch (err) {
        console.error('Error processing polls snapshot:', err)
      } finally {
        markLoaded('polls')
      }
    }, (error) => {
      console.error('Error listening to polls:', error)
      markLoaded('polls')
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

      if (user) {
        await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
          field: 'expected_ticket_sales',
          value,
          source: 'dashboard',
        })
      }
    } catch (error) {
      console.error('Error updating expected ticket sales:', error)
    }
  }

  const sortedComponents = useDashboardSorting(profile, todos, events, polls, news)
  const { giftNotices, totalGiftPacks, dismissGiftNotices } = useGiftNotices(user?.uid)
  const currentUserId = user?.uid || profile?.id || ''
  const unvotedPolls = polls.filter((poll) => {
    if (!poll.is_active) return false
    if (!currentUserId) return true
    return !(poll.votes || []).some((vote) => vote.user_id === currentUserId)
  })

  const componentLinks: Record<DashboardComponentKey, string> = {
    funding: '/finanzen',
    news: '/news',
    todos: '/todos',
    events: '/kalender',
    polls: '/abstimmungen',
    leaderboard: '/finanzen'
  }

  const NewsPreview = ({ items }: { items: any[] }) => (
    <Card className="flex flex-col border-border/40 shadow-card overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border bg-muted/10 shrink-0">
        <CardTitle className="text-lg font-bold">Letzte Updates</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-4">
          {items && items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                onClick={(e) => e.stopPropagation()} // Prevent card navigation
                className="block bg-background rounded-xl p-4 border border-border/40 shadow-subtle transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex gap-4 items-start">
                  {item.image_url && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/20">
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-semibold text-sm truncate leading-tight">{item.title}</h4>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                        {item.created_at ? toDate(item.created_at).toLocaleDateString('de-DE') : 'Neu'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                    <div className="mt-2 flex items-center justify-end text-[10px] font-medium text-primary">
                      <span className="inline-flex items-center gap-1">
                        Zum Beitrag <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">Noch keine Neuigkeiten vorhanden.</p>
          )}
          <Link href="/news" onClick={(e) => e.stopPropagation()} className="block py-4 text-xs font-semibold text-center hover:underline text-muted-foreground">
            Alle News ansehen
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  const renderComponent = (key: DashboardComponentKey) => {
    const ComponentContent = () => {
      switch (key) {
        case 'funding':
          return (
            <div className="flex flex-col">
              <FundingStatus
                key="funding"
                current={currentFunding}
                goal={settings?.funding_goal ?? 10000}
                initialTicketSales={settings?.expected_ticket_sales ?? 150}
                onTicketSalesChange={handleTicketSalesChange}
              />
            </div>
          )
        case 'news':
          return <div className="flex flex-col"><NewsPreview key="news" items={news.slice(0, 2)} /></div>
        case 'todos':
          return (
            <div className="flex flex-col">
              <TodoList key="todos" todos={todos || []} canManage={canManage} maxItems={5} useScrollContainer={false} />
            </div>
          )
        case 'events':
          return (
            <div className="flex flex-col">
              <CalendarEvents key="events" events={events || []} maxItems={3} useScrollContainer={false} />
            </div>
          )
        case 'polls':
          return null
        case 'leaderboard':
          return (
            <div className="flex flex-col">
              <ClassRanking
                key="leaderboard"
                finances={allFinances}
                goal={settings?.funding_goal ?? 10000}
                maxRows={4}
                useScrollContainer={false}
              />
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div 
        key={key}
        onClick={() => router.push(componentLinks[key])}
        className="cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group rounded-xl"
      >
        <div className="pointer-events-auto [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_input]:pointer-events-auto" onClick={(e) => {
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

  const renderPollComponent = (poll: Poll) => {
    return (
      <div
        key={`poll-${poll.id}`}
        onClick={() => router.push('/abstimmungen')}
        className="cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group rounded-xl"
      >
        <div
          className="pointer-events-auto [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_input]:pointer-events-auto"
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('button') || target.closest('a') || target.closest('input')) {
              e.stopPropagation()
            }
          }}
        >
          <div className="flex flex-col">
            <PollList
              polls={[poll]}
              userId={currentUserId}
              canVote={!!currentUserId}
              canManage={canManage}
              useScrollContainer={false}
            />
          </div>
        </div>
      </div>
    )
  }

  type DashboardItem =
    | { type: 'poll'; poll: Poll }
    | { type: 'component'; key: Exclude<DashboardComponentKey, 'polls'> }

  const sortedComponentKeys = sortedComponents.map((key) => key)

  const isInitialDashboardDataLoading = Object.values(initialLoadState).some((isLoaded) => !isLoaded)

  const dashboardItems = sortedComponentKeys.reduce<DashboardItem[]>((items, key) => {
    if (key === 'polls') {
      return [...items, ...unvotedPolls.map((poll) => ({ type: 'poll' as const, poll }))]
    }

    return [...items, { type: 'component' as const, key }]
  }, [])

  if (authLoading || isInitialDashboardDataLoading) {
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
              currentGoal={settings?.funding_goal ?? 10000} 
            />
          )}
        </div>
        <p className="text-muted-foreground">Willkommen zurück! Hier ist der aktuelle Stand der Dinge.</p>
      </div>

      {giftNotices.length > 0 && (
        <GiftNoticeBanner
          totalGiftPacks={totalGiftPacks}
          titleText={giftNotices[0]?.popupTitle}
          bodyText={giftNotices[0]?.popupBody}
          customMessage={giftNotices[0]?.customMessage}
          ctaLabel={giftNotices[0]?.ctaLabel}
          ctaUrl={giftNotices[0]?.ctaUrl}
          dismissLabel={giftNotices[0]?.dismissLabel}
          onDismiss={dismissGiftNotices}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          {dashboardItems
            .filter((_, i) => i % 2 === 0)
            .map((item) => (item.type === 'poll' ? renderPollComponent(item.poll) : renderComponent(item.key)))}
        </div>
        <div className="flex flex-col gap-6">
          {dashboardItems
            .filter((_, i) => i % 2 !== 0)
            .map((item) => (item.type === 'poll' ? renderPollComponent(item.poll) : renderComponent(item.key)))}
        </div>
      </div>
    </div>
  )
}
