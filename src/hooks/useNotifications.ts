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
import { Todo, Event, NewsEntry } from '@/types/database'
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

    // 1. Todos: Open todos assigned to current user, their group, or their class.
    const todosQuery = query(
      collection(db, 'todos'),
      where('status', 'in', ['open', 'in_progress'])
    )
    const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
      const hasActionItem = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as Todo
        const isAssignedToUser = data.assigned_to_user === profile.id
        const isAssignedToClass = data.assigned_to_class === profile.class_name
        const isAssignedToGroup = data.assigned_to_group === profile.planning_group
        return isAssignedToUser || isAssignedToClass || isAssignedToGroup
      })
      setNotifications(prev => ({ ...prev, todos: hasActionItem }))
    })

    // 2. Kalender: Events occurring within the next 3 days.
    const eventsQuery = query(collection(db, 'events'))
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const now = new Date()
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(now.getDate() + 3)
      
      const hasActionItem = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as Event
        const eventDate = toDate(data.event_date)
        return eventDate >= now && eventDate <= threeDaysFromNow
      })
      setNotifications(prev => ({ ...prev, kalender: hasActionItem }))
    })

    // 3. Umfragen: Active polls that the user has not yet voted in.
    let voteUnsubscribes: (() => void)[] = []
    const pollsQuery = query(collection(db, 'polls'), where('is_active', '==', true))
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      // Clear old vote listeners
      voteUnsubscribes.forEach(unsub => unsub())
      voteUnsubscribes = []

      const activePollIds = snapshot.docs.map(d => d.id)
      const pollStatus: Record<string, boolean> = {} // pollId -> hasVoted

      if (activePollIds.length === 0) {
        setNotifications(prev => ({ ...prev, umfragen: false }))
        return
      }

      activePollIds.forEach(pollId => {
        const vRef = doc(db, 'polls', pollId, 'votes', profile.id)
        const unsub = onSnapshot(vRef, (vSnap) => {
          pollStatus[pollId] = vSnap.exists()
          
          // Check if we have results for all active polls
          if (Object.keys(pollStatus).length === activePollIds.length) {
            const hasUnvoted = activePollIds.some(id => !pollStatus[id])
            setNotifications(prev => ({ ...prev, umfragen: hasUnvoted }))
          }
        }, (error) => {
          console.error(`Error listening to votes for poll ${pollId}:`, error)
          // Fallback: assume voted if we can't check
          pollStatus[pollId] = true
          if (Object.keys(pollStatus).length === activePollIds.length) {
            const hasUnvoted = activePollIds.some(id => !pollStatus[id])
            setNotifications(prev => ({ ...prev, umfragen: hasUnvoted }))
          }
        })
        voteUnsubscribes.push(unsub)
      })
    })

    // 4. News: News posted in the last 24 hours.
    const newsQuery = query(collection(db, 'news'))
    const unsubscribeNews = onSnapshot(newsQuery, (snapshot) => {
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
      
      const hasActionItem = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as NewsEntry
        const createdAt = toDate(data.created_at)
        return createdAt >= twentyFourHoursAgo
      })
      setNotifications(prev => ({ ...prev, news: hasActionItem }))
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
