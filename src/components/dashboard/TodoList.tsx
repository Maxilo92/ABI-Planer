'use client'

import { useMemo } from 'react'
import { Todo } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { toDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EditTodoDialog } from '@/components/modals/EditTodoDialog'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { TodoDetailDialog } from '@/components/modals/TodoDetailDialog'
import { format, isBefore, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { logAction } from '@/lib/logging'

interface TodoListProps {
  todos: Todo[]
  canManage?: boolean
  maxItems?: number
  useScrollContainer?: boolean
}

export function TodoList({
  todos,
  canManage = false,
  maxItems,
  useScrollContainer = true,
}: TodoListProps) {
  const { user, profile } = useAuth()

  // Flatten the todo tree for rendering
  const displayedTodos = useMemo(() => {
    const result: (Todo & { depth: number })[] = [];
    const processed = new Set<string>();

    const addWithChildren = (todo: Todo, depth: number) => {
      if (processed.has(todo.id)) return;
      processed.add(todo.id);
      result.push({ ...todo, depth });
      
      const children = todos.filter((t) => t.parentId === todo.id);
      children.forEach((c) => addWithChildren(c, depth + 1));
    };

    // First, process todos that are "roots" in the current set 
    // (either parentId is null or parent is not present in the current todos array)
    const roots = todos.filter((t) => !t.parentId || !todos.find((p) => p.id === t.parentId));
    
    // Process roots to build the partial tree
    roots.forEach((r) => addWithChildren(r, 0));
    
    // Finally, apply maxItems slice if necessary (though page.tsx already limits to 5)
    return typeof maxItems === 'number' ? result.slice(0, maxItems) : result;
  }, [todos, maxItems])

  const handleToggle = async (id: string, completed: boolean) => {
    if (!canManage) return

    const todo = todos.find((entry) => entry.id === id)

    try {
      const docRef = doc(db, 'todos', id)
      await updateDoc(docRef, { 
        status: completed ? 'done' : 'open',
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user?.uid : null,
        completed_by_name: completed ? (profile?.full_name || user?.displayName || 'Unbekannt') : null
      })

      if (user) {
        await logAction('TODO_COMPLETED', user.uid, profile?.full_name, {
          todo_id: id,
          title: todo?.title,
          status: completed ? 'done' : 'open',
        })
      }
    } catch (err) {
      console.error('Error updating todo:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!canManage) return
    if (!window.confirm('Diese Aufgabe wirklich löschen? (Alle Unteraufgaben werden ebenfalls gelöscht)')) return

    const getDescendantIds = (parentId: string): string[] => {
      const children = todos.filter((t) => (t.parentId || null) === parentId)
      return children.flatMap((c) => [c.id, ...getDescendantIds(c.id)])
    }

    const idsToDelete = [id, ...getDescendantIds(id)]

    try {
      for (const docId of idsToDelete) {
        const docRef = doc(db, 'todos', docId)
        await deleteDoc(docRef)
      }

      if (user) {
        const mainTodo = todos.find(t => t.id === id)
        await logAction('TODO_DELETED', user.uid, profile?.full_name, {
          todo_id: id,
          title: mainTodo?.title,
          deleted_count: idsToDelete.length,
        })
      }

      toast.success(idsToDelete.length > 1 ? `${idsToDelete.length} Aufgaben gelöscht.` : 'Aufgabe gelöscht.')
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
      <CardContent className="p-0 bg-card">
        <div className={useScrollContainer ? "h-full overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-muted-foreground/20" : "p-4 space-y-3"}>
          {displayedTodos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Keine Aufgaben vorhanden.</p>
          ) : (
            displayedTodos.map((todo) => {
              const isAssignedToMe = todo.assigned_to_user === user?.uid
              const userCourse = profile?.class_name
              const userPlanningGroup = profile?.planning_group
              const isAssignedToMyClass = todo.assigned_to_class && todo.assigned_to_class === userCourse
              const isAssignedToMyGroup = todo.assigned_to_group && todo.assigned_to_group === userPlanningGroup

              const isOverdue = todo.deadline_date && todo.status !== 'done' && isBefore(toDate(todo.deadline_date), startOfDay(new Date()))

              return (
                <div
                  key={todo.id}
                  style={todo.depth > 0 ? { marginLeft: `${todo.depth * 1}rem` } : {}}
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
                      <TodoDetailDialog
                        todo={todo}
                        allTodos={todos}
                        trigger={
                          <span 
                            className={`text-sm font-semibold leading-tight cursor-pointer hover:underline ${todo.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          >
                            {todo.title}
                          </span>
                        }
                      />
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
                      {todo.depth < 4 && (
                        <AddTodoDialog parentId={todo.id} defaultGroup={todo.assigned_to_group || undefined} />
                      )}
                      <EditTodoDialog todo={todo} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive transition-opacity"
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
