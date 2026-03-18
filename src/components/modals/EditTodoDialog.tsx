'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
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
import { Pencil } from 'lucide-react'
import { Todo } from '@/types/database'
import { toast } from 'sonner'

interface EditTodoDialogProps {
  todo: Todo
}

export function EditTodoDialog({ todo }: EditTodoDialogProps) {
  const [title, setTitle] = useState(todo.title)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const docRef = doc(db, 'todos', todo.id)
      await updateDoc(docRef, { title })

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
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          <DialogDescription>
            Passe den Titel der Aufgabe an.
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
