'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Users, Calendar } from 'lucide-react'
import { Todo, Profile } from '@/types/database'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logging'

interface EditTodoDialogProps {
  todo: Todo
}

export function EditTodoDialog({ todo }: EditTodoDialogProps) {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState(todo.title)
  const [assignedUser, setAssignedUser] = useState(todo.assigned_to_user || '')
  const [assignedClass, setAssignedClass] = useState(todo.assigned_to_class || '')
  const [assignedGroup, setAssignedGroup] = useState(todo.assigned_to_group || '')
  const [deadline, setDeadline] = useState(todo.deadline_date || '')
  const [users, setUsers] = useState<Profile[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [planningGroups, setPlanningGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Sync state when todo prop changes
  useEffect(() => {
    setTitle(todo.title)
    setAssignedUser(todo.assigned_to_user || '')
    setAssignedClass(todo.assigned_to_class || '')
    setAssignedGroup(todo.assigned_to_group || '')
    setDeadline(todo.deadline_date || '')
  }, [todo])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Users
      const usersRef = collection(db, 'profiles')
      const q = query(usersRef, where('is_approved', '==', true))
      const querySnapshot = await getDocs(q)
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile)))

      // Fetch Classes
      const settingsRef = doc(db, 'settings', 'config')
      const settingsSnap = await getDoc(settingsRef)
      if (settingsSnap.exists()) {
        setClasses(settingsSnap.data().courses || [])
        const groups = settingsSnap.data().planning_groups || []
        setPlanningGroups(
          groups
            .map((group: { name?: string }) => group.name)
            .filter((name: string | undefined): name is string => typeof name === 'string' && name.trim().length > 0)
        )
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const docRef = doc(db, 'todos', todo.id)
      const selectedUser = users.find(u => u.id === assignedUser)
      
      await updateDoc(docRef, { 
        title,
        assigned_to_user: assignedUser || null,
        assigned_to_user_name: selectedUser?.full_name || null,
        assigned_to_class: assignedClass || null,
        assigned_to_group: assignedGroup || null,
        deadline_date: deadline || null,
      })

      if (user) {
        await logAction('TODO_EDITED', user.uid, profile?.full_name, {
          todo_id: todo.id,
          title,
          assigned_to_user: assignedUser || null,
          assigned_to_user_name: selectedUser?.full_name || null,
          assigned_to_class: assignedClass || null,
          assigned_to_group: assignedGroup || null,
          deadline_date: deadline || null,
        })
      }

      toast.success('Aufgabe aktualisiert.')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating todo:', error)
      toast.error('Fehler beim Aktualisieren.')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 text-muted-foreground hover:text-primary transition-opacity">
            <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          <DialogDescription>
            Passe den Titel und die Zuweisung der Aufgabe an.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-todo-title">Titel der Aufgabe</Label>
              <Input 
                id="edit-todo-title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-assignment" className="flex items-center gap-2">
                  <Users className="h-3 w-3" /> Zuständigkeit
                </Label>
                <select
                  id="edit-assignment"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={assignedUser ? `user:${assignedUser}` : assignedClass ? `class:${assignedClass}` : assignedGroup ? `group:${assignedGroup}` : ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setAssignedUser('')
                    setAssignedClass('')
                    setAssignedGroup('')
                    
                    if (val.startsWith('user:')) setAssignedUser(val.replace('user:', ''))
                    else if (val.startsWith('class:')) setAssignedClass(val.replace('class:', ''))
                    else if (val.startsWith('group:')) setAssignedGroup(val.replace('group:', ''))
                  }}
                >
                  <option value="">Niemand / Alle</option>
                  
                  {users.length > 0 && (
                    <optgroup label="Personen">
                      {users.map((u) => (
                        <option key={u.id} value={`user:${u.id}`}>
                          {u.full_name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {classes.length > 0 && (
                    <optgroup label="Kurse">
                      {classes.map((c) => (
                        <option key={c} value={`class:${c}`}>
                          Kurs {c}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {planningGroups.length > 0 && (
                    <optgroup label="Planungsgruppen">
                      {planningGroups.map((g) => (
                        <option key={g} value={`group:${g}`}>
                          {g}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-deadline" className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Deadline (Optional)
                </Label>
                <Input 
                  id="edit-deadline" 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Aktualisieren'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
