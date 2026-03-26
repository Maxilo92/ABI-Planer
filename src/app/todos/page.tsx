'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { TodoList } from '@/components/dashboard/TodoList'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { Todo } from '@/types/database'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TodosPage() {
  const { profile, loading: authLoading } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'todos'),
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
  }, [profile, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const canManage = (profile?.role === 'planner' || profile?.role === 'admin_co' || profile?.role === 'admin_main' || profile?.role === 'admin') && profile?.is_approved

  const filteredTodos = todos.filter(todo => 
    todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openTodos = filteredTodos.filter(t => t.status === 'open')
  const inProgressTodos = filteredTodos.filter(t => t.status === 'in_progress')
  const doneTodos = filteredTodos.filter(t => t.status === 'done')

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aufgaben</h1>
          <p className="text-muted-foreground">Alle anstehenden To-Dos für unser Abi.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canManage && <AddTodoDialog />}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="all" className="px-4">Alle ({filteredTodos.length})</TabsTrigger>
          <TabsTrigger value="open" className="px-4">Offen ({openTodos.length})</TabsTrigger>
          <TabsTrigger value="in_progress" className="px-4">In Arbeit ({inProgressTodos.length})</TabsTrigger>
          <TabsTrigger value="done" className="px-4">Erledigt ({doneTodos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TodoList todos={filteredTodos} canManage={canManage} useScrollContainer={false} />
        </TabsContent>
        <TabsContent value="open">
          <TodoList todos={openTodos} canManage={canManage} useScrollContainer={false} />
        </TabsContent>
        <TabsContent value="in_progress">
          <TodoList todos={inProgressTodos} canManage={canManage} useScrollContainer={false} />
        </TabsContent>
        <TabsContent value="done">
          <TodoList todos={doneTodos} canManage={canManage} useScrollContainer={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
