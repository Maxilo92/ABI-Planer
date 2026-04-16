'use client'

import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Todo } from '@/types/database'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { 
  Calendar, 
  User, 
  Users, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Info,
  ChevronRight,
  UserCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTodoStatusLabel, getTodoStatusTone } from '@/modules/shared/status'

interface TodoDetailDialogProps {
  todo: Todo
  allTodos: Todo[]
  trigger?: React.ReactElement
}

export function TodoDetailDialog({ todo, allTodos, trigger }: TodoDetailDialogProps) {
  const children = allTodos.filter(t => t.parentId === todo.id)
  
  const getStatusIcon = (status: string) => {
    const tone = getTodoStatusTone(status)
    switch (tone) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Dialog>
      {trigger && <DialogTrigger render={trigger} nativeButton={false} />}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={todo.status === 'done' ? 'outline' : 'secondary'} className="flex items-center gap-1">
              {getStatusIcon(todo.status)}
              {getTodoStatusLabel(todo.status)}
            </Badge>
            {todo.deadline_date && (
              <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
                <Calendar className="h-3 w-3 mr-1" />
                {format(toDate(todo.deadline_date), 'PPP', { locale: de })}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold leading-tight">
            {todo.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details zur Aufgabe {todo.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          {todo.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" /> Beschreibung
              </h4>
              <div className="text-sm bg-muted/30 p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                {todo.description}
              </div>
            </div>
          )}

          {/* Responsibility & Creator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> Zuständigkeit
              </h4>
              <div className="text-sm flex items-center gap-2">
                {todo.assigned_to_user_name ? (
                  <><User className="h-3.5 w-3.5 text-primary" /> {todo.assigned_to_user_name}</>
                ) : todo.assigned_to_class ? (
                  <><Users className="h-3.5 w-3.5 text-primary" /> Kurs {todo.assigned_to_class}</>
                ) : todo.assigned_to_group ? (
                  <><Users className="h-3.5 w-3.5 text-primary" /> {todo.assigned_to_group}</>
                ) : (
                  <span className="text-muted-foreground italic">Nicht zugewiesen</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <UserCircle className="h-4 w-4" /> Erstellt von
              </h4>
              <div className="text-sm">
                {todo.created_by_name || 'Unbekannt'}
              </div>
            </div>
          </div>

          {/* Sub-tasks */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <ChevronRight className="h-4 w-4" /> Unteraufgaben ({children.length})
            </h4>
            {children.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                {children.map((child) => (
                  <div 
                    key={child.id} 
                    className="flex items-center gap-2 text-sm p-2 rounded-md border border-border/40 bg-muted/10"
                  >
                    {getStatusIcon(child.status)}
                    <span className={child.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                      {child.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic px-2">Keine Unteraufgaben vorhanden.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Schließen</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
