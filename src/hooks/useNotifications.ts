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
    if (authLoading || !profile?.id) {
      setNotifications({
        todos: false,
        kalender: false,
        umfragen: false,
        news: false,
      })
      return
    }

    const profileId = profile.id
    const profileClass = profile.class_name
    const profileGroup = profile.planning_group
    const lastVisitedTodos = profile.last_visited?.todos
    const lastVisitedKalender = profile.last_visited?.kalender
    const lastVisitedUmfragen = profile.last_visited?.umfragen
    const lastVisitedNews = profile.last_visited?.news

    const handleSnapshotError = (source: string, error: unknown) => {
      console.error(`useNotifications: ${source} snapshot failed:`, error)
      setNotifications((prev) => ({ ...prev, [source]: false }))
    }

    // 1. Todos: New todos since last visit.
    const todosQuery = query(
      collection(db, 'todos'),
      where('status', 'in', ['open', 'in_progress'])
    )
    const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
      const lastVisited = lastVisitedTodos ? new Date(lastVisitedTodos) : new Date(0)
      
      const hasActionItem = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as Todo
        const createdAt = data.created_at ? toDate(data.created_at) : new Date(0)
        
        // Show notification if it's assigned to user/class/group AND created since last visit
        const isAssigned = data.assigned_to_user === profileId || 
                           data.assigned_to_class === profileClass || 
                           data.assigned_to_group === profileGroup
        
        return isAssigned && createdAt > lastVisited
      })
      setNotifications(prev => ({ ...prev, todos: hasActionItem }))
    }, (error) => {
      handleSnapshotError('todos', error)
    })

    // 2. Kalender: New events created since last visit.
    const eventsQuery = query(collection(db, 'events'))
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const lastVisited = lastVisitedKalender ? new Date(lastVisitedKalender) : new Date(0)
      
      const hasNewEvent = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as Event
        const createdAt = data.created_at ? toDate(data.created_at) : new Date(0)
        return createdAt > lastVisited
      })
      setNotifications(prev => ({ ...prev, kalender: hasNewEvent }))
    }, (error) => {
      handleSnapshotError('kalender', error)
    })

    // 3. Umfragen: Active polls since last visit OR unvoted active polls.
    const voteUnsubscribes = new Map<string, () => void>()
    const pollStatus: Record<string, boolean> = {}

    const pollsQuery = query(collection(db, 'polls'), where('is_active', '==', true))
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      const activePolls = snapshot.docs.map(d => ({ ...d.data() as Poll, id: d.id }))
      const lastVisited = lastVisitedUmfragen ? new Date(lastVisitedUmfragen) : new Date(0)

      if (activePolls.length === 0) {
        // Cleanup all
        voteUnsubscribes.forEach(unsub => unsub())
        voteUnsubscribes.clear()
        setNotifications(prev => ({ ...prev, umfragen: false }))
        return
      }

      // Cleanup old listeners for polls that are no longer active
      const activePollIds = new Set(activePolls.map(p => p.id))
      voteUnsubscribes.forEach((unsub, id) => {
        if (!activePollIds.has(id)) {
          unsub()
          voteUnsubscribes.delete(id)
          delete pollStatus[id]
        }
      })

      // First check if there are NEW polls since last visit
      const hasNewPoll = activePolls.some(poll => {
        const createdAt = poll.created_at ? toDate(poll.created_at) : new Date(0)
        return createdAt > lastVisited
      })

      // Check if there are unvoted active polls
      activePolls.forEach(poll => {
        if (!voteUnsubscribes.has(poll.id)) {
          const vRef = doc(db, 'polls', poll.id, 'votes', profileId)
          const unsub = onSnapshot(vRef, (vSnap) => {
            pollStatus[poll.id] = vSnap.exists()
            
            // Only update notifications if we have info for all active polls
            // OR if we already know there's a new poll
            const currentActiveIds = Array.from(activePollIds)
            if (currentActiveIds.every(id => Object.prototype.hasOwnProperty.call(pollStatus, id))) {
              const hasUnvoted = currentActiveIds.some(id => !pollStatus[id])
              setNotifications(prev => ({ ...prev, umfragen: hasNewPoll || hasUnvoted }))
            }
          }, (error) => {
            console.error(`useNotifications: poll vote snapshot failed for ${poll.id}:`, error)
            pollStatus[poll.id] = true // Assume voted on error to avoid false positives
          })
          voteUnsubscribes.set(poll.id, unsub)
        }
      })
    }, (error) => {
      handleSnapshotError('umfragen', error)
    })

    // 4. News: News created since last visit or not viewed.
    const newsQuery = query(collection(db, 'news'))
    const unsubscribeNews = onSnapshot(newsQuery, (snapshot) => {
      const lastVisited = lastVisitedNews ? new Date(lastVisitedNews) : new Date(0)

      const hasUnviewedNews = snapshot.docs.some(docSnap => {
        const data = docSnap.data() as NewsEntry
        const viewedBy = data.viewed_by || []
        const createdAt = data.created_at ? toDate(data.created_at) : new Date(0)
        
        return !viewedBy.includes(profileId) && createdAt > lastVisited
      })
      setNotifications(prev => ({ ...prev, news: hasUnviewedNews }))
    }, (error) => {
      handleSnapshotError('news', error)
    })

    return () => {
      unsubscribeTodos()
      unsubscribeEvents()
      unsubscribePolls()
      voteUnsubscribes.forEach(unsub => unsub())
      voteUnsubscribes.clear()
      unsubscribeNews()
    }
  }, [
    authLoading, 
    profile?.id, 
    profile?.class_name, 
    profile?.planning_group, 
    profile?.last_visited?.todos,
    profile?.last_visited?.kalender,
    profile?.last_visited?.umfragen,
    profile?.last_visited?.news
  ])

  return notifications
}
