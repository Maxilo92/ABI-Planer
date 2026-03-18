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
import { Textarea } from '@/components/ui/textarea'
import { Pencil } from 'lucide-react'
import { NewsEntry } from '@/types/database'
import { toast } from 'sonner'

interface EditNewsDialogProps {
  news: NewsEntry
}

export function EditNewsDialog({ news }: EditNewsDialogProps) {
  const [title, setTitle] = useState(news.title)
  const [content, setContent] = useState(news.content)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const docRef = doc(db, 'news', news.id)
      await updateDoc(docRef, { 
        title, 
        content,
        updated_at: new Date().toISOString()
      })

      toast.success('News-Beitrag aktualisiert.')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating news:', error)
      toast.error('Fehler beim Aktualisieren.')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>News-Beitrag bearbeiten</DialogTitle>
          <DialogDescription>
            Passe die Überschrift oder den Inhalt an.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Überschrift</Label>
              <Input 
                id="edit-title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Inhalt</Label>
              <Textarea 
                id="edit-content" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
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
