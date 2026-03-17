'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc, where } from 'firebase/firestore'
import { Countdown } from '@/components/dashboard/Countdown'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { TodoList } from '@/components/dashboard/TodoList'
import { CalendarEvents } from '@/components/dashboard/CalendarEvents'
import { EditSettingsDialog } from '@/components/modals/EditSettingsDialog'
import { useAuth } from '@/context/AuthContext'

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [todos, setTodos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
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
      const total = snapshot.docs.reduce((acc, doc) => acc + Number(doc.data().amount), 0)
      setCurrentFunding(total)
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

  const canManage = (profile?.role === 'planner' || profile?.role === 'admin') && profile?.is_approved

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">ABI Planer 2026</h1>
        <p className="text-muted-foreground">Willkommen zurück! Hier ist der aktuelle Stand der Dinge.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Indicators */}
        <Countdown 
          targetDate={settings?.ball_date || '2026-06-20T18:00:00'} 
          editButton={canManage ? <EditSettingsDialog currentDate={settings?.ball_date} currentGoal={settings?.funding_goal || 10000} /> : null}
        />
        <FundingStatus current={currentFunding} goal={settings?.funding_goal || 10000} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Content Sections */}
        <TodoList todos={todos || []} canManage={canManage} />
        <CalendarEvents events={events || []} />
      </div>

      {/* News Preview */}
      <section className="bg-secondary/30 rounded-xl p-6 border">
        <h3 className="text-xl font-bold mb-4">Letzte Updates</h3>
        <div className="space-y-4">
          {news && news.length > 0 ? (
            news.map((item) => (
              <div key={item.id} className="bg-background rounded-lg p-4 border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{item.title}</h4>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('de-DE') : 'Neu'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.content}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">Noch keine Neuigkeiten vorhanden.</p>
          )}
        </div>
      </section>
    </div>
  )
}
