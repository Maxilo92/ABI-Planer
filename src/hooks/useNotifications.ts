'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc 
} from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Todo, Event, NewsEntry, Poll } from '@/types/database'
import { toDate } from '@/lib/utils'

export function useNotifications() {
  const { profile, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState({
    todos: false,
    kalender: false,
    umfragen: false,
    news: false,
  })

  useEffect(() => {
    if (authLoading || !profile) {
      setNotifications({
        todos: false,
        kalender: false,
        umfragen: false,
        news: false,
      })
      return
    }

    // 1. Todos: New todos since last visit.
    const todosQuery = query(
      collection(db, 'todos'),
      where('status', 'in', ['open', 'in_progress'])
    )
    const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
      const lastVisited = profile.last_visited?.todos ? new Date(profile.last_visited.todos) : new Date(0)
      
      const hasActionItem = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as Todo
        const createdAt = data.created_at ? toDate(data.created_at) : new Date(0)
        
        // Show notification if it's assigned to user/class/group AND created since last visit
        const isAssigned = data.assigned_to_user === profile.id || 
                           data.assigned_to_class === profile.class_name || 
                           data.assigned_to_group === profile.planning_group
        
        return isAssigned && createdAt > lastVisited
      })
      setNotifications(prev => ({ ...prev, todos: hasActionItem }))
    })

    // 2. Kalender: New events created since last visit.
    const eventsQuery = query(collection(db, 'events'))
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const lastVisited = profile.last_visited?.kalender ? new Date(profile.last_visited.kalender) : new Date(0)
      
      const hasNewEvent = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as Event
        const createdAt = data.created_at ? toDate(data.created_at) : new Date(0)
        return createdAt > lastVisited
      })
      setNotifications(prev => ({ ...prev, kalender: hasNewEvent }))
    })

    // 3. Umfragen: Active polls since last visit OR unvoted active polls.
    let voteUnsubscribes: (() => void)[] = []
    const pollsQuery = query(collection(db, 'polls'), where('is_active', '==', true))
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      voteUnsubscribes.forEach(unsub => unsub())
      voteUnsubscribes = []

      const activePolls = snapshot.docs.map(d => ({ ...d.data() as Poll, id: d.id }))
      const lastVisited = profile.last_visited?.umfragen ? new Date(profile.last_visited.umfragen) : new Date(0)

      if (activePolls.length === 0) {
        setNotifications(prev => ({ ...prev, umfragen: false }))
        return
      }

      // First check if there are NEW polls since last visit
      const hasNewPoll = activePolls.some(poll => {
        const createdAt = poll.created_at ? toDate(poll.created_at) : new Date(0)
        return createdAt > lastVisited
      })

      if (hasNewPoll) {
        setNotifications(prev => ({ ...prev, umfragen: true }))
        return
      }

      // If no new polls, check if there are unvoted active polls
      const pollStatus: Record<string, boolean> = {}
      activePolls.forEach(poll => {
        const vRef = doc(db, 'polls', poll.id, 'votes', profile.id)
        const unsub = onSnapshot(vRef, (vSnap) => {
          pollStatus[poll.id] = vSnap.exists()
          if (Object.keys(pollStatus).length === activePolls.length) {
            const hasUnvoted = activePolls.some(p => !pollStatus[p.id])
            setNotifications(prev => ({ ...prev, umfragen: hasUnvoted }))
          }
        })
        voteUnsubscribes.push(unsub)
      })
    })

    // 4. News: News created since last visit or not viewed.
    const newsQuery = query(collection(db, 'news'))
    const unsubscribeNews = onSnapshot(newsQuery, (snapshot) => {
      const lastVisited = profile.last_visited?.news ? new Date(profile.last_visited.news) : new Date(0)

      const hasUnviewedNews = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as NewsEntry
        const viewedBy = data.viewed_by || []
        const createdAt = data.created_at ? toDate(data.created_at) : new Date(0)
        
        return !viewedBy.includes(profile.id) && createdAt > lastVisited
      })
      setNotifications(prev => ({ ...prev, news: hasUnviewedNews }))
    })

    return () => {
      unsubscribeTodos()
      unsubscribeEvents()
      unsubscribePolls()
      voteUnsubscribes.forEach(unsub => unsub())
      unsubscribeNews()
    }
  }, [profile, authLoading])

  return notifications
}
