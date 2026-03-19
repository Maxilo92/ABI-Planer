'use client'

import { Todo } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { toDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { EditTodoDialog } from '@/components/modals/EditTodoDialog'
import { format, isBefore, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'

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

  const handleDelete = async (id: string) => {
    if (!canManage) return
    if (!window.confirm('Diese Aufgabe wirklich löschen?')) return

    try {
      const docRef = doc(db, 'todos', id)
      await deleteDoc(docRef)
      toast.success('Aufgabe gelöscht.')
    } catch (err) {
      console.error('Error deleting todo:', err)
      toast.error('Fehler beim Löschen.')
    }
  }

  return (
    <Card className="h-full border-border/40 shadow-subtle flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-border bg-muted/10 shrink-0">
        <CardTitle className="text-lg font-bold">Aufgaben</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden bg-card">
        <div className="h-full overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Keine Aufgaben vorhanden.</p>
          ) : (
            todos.map((todo) => {
              const isAssignedToMe = todo.assigned_to_user === user?.uid
              const userCourse = profile?.class_name
              const userPlanningGroup = profile?.planning_group
              const isAssignedToMyClass = todo.assigned_to_class && todo.assigned_to_class === userCourse
              const isAssignedToMyGroup = todo.assigned_to_group && todo.assigned_to_group === userPlanningGroup

              const isOverdue = todo.deadline_date && todo.status !== 'done' && isBefore(toDate(todo.deadline_date), startOfDay(new Date()))

              return (
                <div
                  key={todo.id}
                  className={`group flex items-start gap-3 rounded-lg border px-3 py-2 ${isAssignedToMe || isAssignedToMyClass || isAssignedToMyGroup ? 'border-primary/30 bg-primary/10 shadow-sm' : 'border-border/70 bg-background/80'} ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}
                >
                  <Checkbox 
                    id={todo.id} 
                    checked={todo.status === 'done'}
                    disabled={!canManage}
                    onCheckedChange={(checked) => handleToggle(todo.id, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label 
                        htmlFor={todo.id}
                        className={`text-sm font-semibold leading-tight cursor-pointer ${todo.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                      >
                        {todo.title}
                      </label>
                      {isAssignedToMe && (
                        <Badge variant="default" className="text-[8px] px-1 py-0 h-3.5 bg-primary text-primary-foreground">
                          An Dich
                        </Badge>
                      )}
                      {isAssignedToMyClass && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-primary text-primary">
                          Dein Kurs
                        </Badge>
                      )}
                      {isAssignedToMyGroup && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-primary text-primary">
                          Deine Gruppe
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={todo.status === 'done' ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {todo.status === 'open' ? 'Offen' : todo.status === 'in_progress' ? 'In Arbeit' : 'Erledigt'}
                        </Badge>
                        {todo.assigned_to_user_name && (
                          <span className="text-[11px] font-medium text-primary">
                            Zugeordnet: {todo.assigned_to_user_name}
                          </span>
                        )}
                        {todo.assigned_to_class && (
                          <span className="text-[11px] font-medium text-primary">
                            Kurs: {todo.assigned_to_class}
                          </span>
                        )}
                        {todo.assigned_to_group && (
                          <span className="text-[11px] font-medium text-primary">
                            Gruppe: {todo.assigned_to_group}
                          </span>
                        )}
                        {todo.created_by_name && (
                          <span className="text-[11px] text-muted-foreground">
                            von {todo.created_by_name}
                          </span>
                        )}
                        {todo.deadline_date && (
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${isOverdue ? 'text-destructive animate-pulse' : 'text-orange-500'}`}>
                            <Calendar className="h-3 w-3" />
                            Fällig: {format(toDate(todo.deadline_date), 'dd.MM.yyyy', { locale: de })}
                          </span>
                        )}
                      </div>
                      {todo.status === 'done' && todo.completed_by_name && (
                        <span className="text-[11px] text-muted-foreground italic">
                          Erledigt von {todo.completed_by_name} {todo.completed_at ? `am ${toDate(todo.completed_at).toLocaleDateString('de-DE')}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <EditTodoDialog todo={todo} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(todo.id)}
                        title="Löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
