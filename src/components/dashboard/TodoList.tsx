'use client'

import { Todo } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'

interface TodoListProps {
  todos: Todo[]
  canManage?: boolean
}

export function TodoList({ todos, canManage = false }: TodoListProps) {
  const { user, profile } = useAuth()

  const handleToggle = async (id: string, completed: boolean) => {
    if (!canManage) return

    try {
      const docRef = doc(db, 'todos', id)
      await updateDoc(docRef, { 
        status: completed ? 'done' : 'open',
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user?.uid : null,
        completed_by_name: completed ? (profile?.full_name || user?.displayName || 'Unbekannt') : null
      })
    } catch (err) {
      console.error('Error updating todo:', err)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Aufgaben</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Keine Aufgaben vorhanden.</p>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                <Checkbox 
                  id={todo.id} 
                  checked={todo.status === 'done'}
                  disabled={!canManage}
                  onCheckedChange={(checked) => handleToggle(todo.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <label 
                    htmlFor={todo.id}
                    className={`text-sm font-medium leading-none cursor-pointer ${todo.status === 'done' ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {todo.title}
                  </label>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={todo.status === 'done' ? 'outline' : 'secondary'} className="text-[9px] px-1 py-0">
                        {todo.status === 'open' ? 'Offen' : todo.status === 'in_progress' ? 'In Arbeit' : 'Erledigt'}
                      </Badge>
                      {todo.created_by_name && (
                        <span className="text-[9px] text-muted-foreground">
                          Erstellt von {todo.created_by_name}
                        </span>
                      )}
                    </div>
                    {todo.status === 'done' && todo.completed_by_name && (
                      <span className="text-[9px] text-muted-foreground italic">
                        Erledigt von {todo.completed_by_name} {todo.completed_at ? `am ${new Date(todo.completed_at).toLocaleDateString('de-DE')}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
