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
import { Plus, Users, User as UserIcon } from 'lucide-react'
import { Profile } from '@/types/database'

export function AddTodoDialog() {
  const [title, setTitle] = useState('')
  const [assignedUser, setAssignedUser] = useState('')
  const [assignedClass, setAssignedClass] = useState('')
  const [assignedGroup, setAssignedGroup] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [planningGroups, setPlanningGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()

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
        })

        setTitle('')
        setAssignedUser('')
        setAssignedClass('')
        setAssignedGroup('')
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
                <Label htmlFor="assigned-user" className="flex items-center gap-2">
                  <UserIcon className="h-3 w-3" /> Zuweisen an Person
                </Label>
                <select
                  id="assigned-user"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={assignedUser}
                  onChange={(e) => {
                    setAssignedUser(e.target.value)
                    if (e.target.value) {
                      setAssignedClass('')
                      setAssignedGroup('')
                    }
                  }}
                >
                  <option value="">Niemand</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned-class" className="flex items-center gap-2">
                  <Users className="h-3 w-3" /> Zuweisen an Kurs
                </Label>
                <select
                  id="assigned-class"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={assignedClass}
                  onChange={(e) => {
                    setAssignedClass(e.target.value)
                    if (e.target.value) {
                      setAssignedUser('')
                      setAssignedGroup('')
                    }
                  }}
                >
                  <option value="">Kein Kurs</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned-group" className="flex items-center gap-2">
                  <Users className="h-3 w-3" /> Erwähnen für Planungsgruppe
                </Label>
                <select
                  id="assigned-group"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={assignedGroup}
                  onChange={(e) => {
                    setAssignedGroup(e.target.value)
                    if (e.target.value) {
                      setAssignedUser('')
                      setAssignedClass('')
                    }
                  }}
                >
                  <option value="">Keine Gruppe</option>
                  {planningGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
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
