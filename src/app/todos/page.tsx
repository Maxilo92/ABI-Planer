'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
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
