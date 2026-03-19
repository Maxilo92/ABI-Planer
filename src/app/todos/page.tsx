'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { TodoList } from '@/components/dashboard/TodoList'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { Todo } from '@/types/database'
import { Loader2 } from 'lucide-react'

export default function TodosPage() {
  const { profile, loading: authLoading } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'todos'),
      orderBy('status', 'desc'),
      orderBy('created_at', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!authLoading && profile) {
      const updateLastVisited = async () => {
        try {
          const now = new Date()
          const lastVisitedStr = profile.last_visited?.todos
          const lastVisited = lastVisitedStr ? new Date(lastVisitedStr) : new Date(0)
          
          if (!lastVisitedStr || (now.getTime() - lastVisited.getTime() > 60 * 60 * 1000)) {
            const userRef = doc(db, 'profiles', profile.id)
            await updateDoc(userRef, {
              [`last_visited.todos`]: now.toISOString()
            })
          }
        } catch (error) {
          console.error('Error updating last_visited for todos:', error)
        }
      }
      updateLastVisited()
    }
  }, [profile?.id, profile?.last_visited?.todos, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const canManage = (profile?.role === 'planner' || profile?.role === 'admin_co' || profile?.role === 'admin_main' || profile?.role === 'admin') && profile?.is_approved

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aufgaben</h1>
          <p className="text-muted-foreground">Alle anstehenden To-Dos für unser Abi.</p>
        </div>
        {canManage && <AddTodoDialog />}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TodoList todos={todos || []} canManage={canManage} />
      </div>
    </div>
  )
}
