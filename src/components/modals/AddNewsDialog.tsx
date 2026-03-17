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
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

export function AddNewsDialog() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
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
        .from('news')
        .insert([{ title, content, created_by: user.id }])

      if (!error) {
        setTitle('')
        setContent('')
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
            <Plus className="h-4 w-4" /> News verfassen
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neues Update verfassen</DialogTitle>
          <DialogDescription>
            Informiere den Jahrgang über Neuigkeiten.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Überschrift</Label>
              <Input 
                id="title" 
                placeholder="z.B. Location gefunden!" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Inhalt</Label>
              <Textarea 
                id="content" 
                placeholder="Beschreibe kurz was es Neues gibt..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Veröffentlichen...' : 'Posten'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
