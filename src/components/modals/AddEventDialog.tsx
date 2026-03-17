'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
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

export function AddEventDialog() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from('events')
        .insert([{ 
          title, 
          event_date: new Date(date).toISOString(), 
          created_by: user.id 
        }])

      if (!error) {
        setTitle('')
        setDate('')
        setOpen(false)
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Termin hinzufügen
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Termin planen</DialogTitle>
          <DialogDescription>
            Plane ein Treffen oder eine Deadline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Name</Label>
              <Input 
                id="title" 
                placeholder="z.B. Treffen Finanzausschuss" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Datum & Uhrzeit</Label>
              <Input 
                id="date" 
                type="datetime-local" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
