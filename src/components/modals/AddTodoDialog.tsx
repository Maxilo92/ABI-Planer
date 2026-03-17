'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
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
import { Plus } from 'lucide-react'

export function AddTodoDialog() {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user) {
      try {
        await addDoc(collection(db, 'todos'), {
          title,
          created_by: user.uid,
          status: 'open',
          created_at: serverTimestamp(),
        })

        setTitle('')
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
      <DialogContent>
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
