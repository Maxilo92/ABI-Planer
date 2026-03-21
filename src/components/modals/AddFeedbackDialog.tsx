'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
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
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { FeedbackType } from '@/types/database'

// Extracted form component to isolate state-driven re-renders from the Dialog component
function FeedbackForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<FeedbackType>('feature')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Du musst angemeldet sein, um Feedback zu geben.')
      return
    }

    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, 'feedback'), {
        title,
        description,
        type,
        status: 'new',
        created_at: new Date().toISOString(),
        created_by: user.uid,
        created_by_name: profile?.full_name || user.displayName || 'Unbekannt',
        is_anonymous: isAnonymous,
        is_private: isPrivate,
      })

      await logAction('FEEDBACK_SUBMIT', user.uid, profile?.full_name, {
        id: docRef.id,
        title,
        type,
        is_anonymous: isAnonymous,
        is_private: isPrivate,
      })

      toast.success('Danke für dein Feedback!')
      onSuccess()
    } catch (error) {
      console.error('Error adding feedback:', error)
      toast.error('Fehler beim Senden des Feedbacks.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Art des Feedbacks</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={type === 'bug' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 px-2"
              onClick={() => setType('bug')}
            >
              <Bug className="h-3.5 w-3.5" /> Bug
            </Button>
            <Button
              type="button"
              variant={type === 'feature' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 px-2"
              onClick={() => setType('feature')}
            >
              <Lightbulb className="h-3.5 w-3.5" /> Idee
            </Button>
            <Button
              type="button"
              variant={type === 'other' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 px-2"
              onClick={() => setType('other')}
            >
              <HelpCircle className="h-3.5 w-3.5" /> Sonstiges
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fb-title">Titel</Label>
          <Input 
            id="fb-title" 
            placeholder="z.B. Bug beim Leaderboard" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fb-desc">Beschreibung</Label>
          <Textarea 
            id="fb-desc" 
            placeholder="Beschreibe dein Anliegen so genau wie möglich..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            className="[field-sizing:fixed]" // Explicitly disable auto-sizing if it's causing lag
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="fb-anonymous" 
              checked={isAnonymous} 
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="fb-anonymous"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Anonym posten
              </label>
              <p className="text-xs text-muted-foreground">
                Dein Name wird nicht öffentlich angezeigt.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="fb-private" 
              checked={isPrivate} 
              onCheckedChange={(checked) => setIsPrivate(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="fb-private"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Privat senden
              </label>
              <p className="text-xs text-muted-foreground">
                Nur für Admins sichtbar.
              </p>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Wird gesendet...' : 'Absenden'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AddFeedbackDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquarePlus className="h-4 w-4" /> Feedback / Feature-Wunsch
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Feedback & Wünsche</DialogTitle>
          <DialogDescription>
            Hast du einen Fehler gefunden oder eine Idee für eine neue Funktion?
          </DialogDescription>
        </DialogHeader>
        <FeedbackForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
