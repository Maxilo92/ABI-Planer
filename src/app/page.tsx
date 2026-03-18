'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc, where, setDoc } from 'firebase/firestore'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
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
      const amounts = snapshot.docs.map((entryDoc) => Number(entryDoc.data().amount) || 0)
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

    return () => {
      unsubscribeSettings()
      unsubscribeTodos()
      unsubscribeEvents()
      unsubscribeFinances()
      unsubscribeNews()
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
        {/* Top Indicators */}
        <FundingStatus
          current={currentFunding}
          goal={expenseGoal > 0 ? expenseGoal : (settings?.funding_goal || 10000)}
          initialTicketSales={settings?.expected_ticket_sales ?? 150}
          onTicketSalesChange={handleTicketSalesChange}
        />

        {/* News Preview */}
        <section className="bg-secondary/10 rounded-xl p-6 border flex flex-col h-full">
          <h3 className="text-xl font-bold mb-4">Letzte Updates</h3>
          <div className="space-y-4 flex-1">
            {news && news.length > 0 ? (
              news.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="block bg-background rounded-lg p-4 border shadow-sm transition-colors hover:bg-muted/30"
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
          <Link href="/news" className="mt-4 text-xs font-semibold text-center hover:underline text-muted-foreground">
            Alle News ansehen
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Content Sections */}
        <TodoList todos={todos || []} canManage={canManage} />
        <CalendarEvents events={events || []} />
      </div>

    </div>
  )
}
