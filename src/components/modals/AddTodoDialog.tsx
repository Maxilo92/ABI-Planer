'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
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
import { Plus, Users, User as UserIcon, Calendar } from 'lucide-react'
import { Profile } from '@/types/database'
import { logAction } from '@/lib/logging'

interface AddTodoDialogProps {
  defaultGroup?: string
}

export function AddTodoDialog({ defaultGroup }: AddTodoDialogProps) {
  const [title, setTitle] = useState('')
  const [assignedUser, setAssignedUser] = useState('')
  const [assignedClass, setAssignedClass] = useState('')
  const [assignedGroup, setAssignedGroup] = useState(defaultGroup || '')
  const [deadline, setDeadline] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [planningGroups, setPlanningGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (defaultGroup) {
      setAssignedGroup(defaultGroup)
    }
  }, [defaultGroup, open])

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

    if (user) {
      try {
        const selectedUser = users.find(u => u.id === assignedUser)
        await addDoc(collection(db, 'todos'), {
          title,
          created_by: user.uid,
          created_by_name: profile?.full_name || user.displayName || 'Unbekannt',
          status: 'open',
          created_at: serverTimestamp(),
          assigned_to_user: assignedUser || null,
          assigned_to_user_name: selectedUser?.full_name || null,
          assigned_to_class: assignedClass || null,
          assigned_to_group: assignedGroup || null,
          deadline_date: deadline || null,
        })

        await logAction('TODO_CREATED', user.uid, profile?.full_name, {
          title,
          assigned_to_user: assignedUser || null,
          assigned_to_user_name: selectedUser?.full_name || null,
          assigned_to_class: assignedClass || null,
          assigned_to_group: assignedGroup || null,
          deadline_date: deadline || null,
        })

        setTitle('')
        setAssignedUser('')
        setAssignedClass('')
        setAssignedGroup('')
        setDeadline('')
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Error adding todo:', error)
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Aufgabe hinzufügen
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
          <DialogDescription>
            Was muss für das Abi noch erledigt werden?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel der Aufgabe</Label>
              <Input 
                id="title" 
                placeholder="z.B. DJ anfragen" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignment" className="flex items-center gap-2">
                  <Users className="h-3 w-3" /> Zuständigkeit
                </Label>
                <select
                  id="assignment"
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
                <Label htmlFor="deadline" className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Deadline (Optional)
                </Label>
                <Input 
                  id="deadline" 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
