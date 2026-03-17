'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
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
import { Settings as SettingsIcon } from 'lucide-react'
import { format } from 'date-fns'

interface EditSettingsDialogProps {
  currentDate: string
  currentGoal: number
}

export function EditSettingsDialog({ currentDate, currentGoal }: EditSettingsDialogProps) {
  // Format the date for the datetime-local input (YYYY-MM-DDTHH:MM)
  const initialDate = currentDate ? format(new Date(currentDate), "yyyy-MM-dd'T'HH:mm") : ''
  
  const [date, setDate] = useState(initialDate)
  const [goal, setGoal] = useState(currentGoal.toString())
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await setDoc(doc(db, 'settings', 'config'), { 
        ball_date: new Date(date).toISOString(),
        funding_goal: parseFloat(goal)
      }, { merge: true })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating settings:', error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <SettingsIcon className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einstellungen bearbeiten</DialogTitle>
          <DialogDescription>
            Passe das Datum des Balls und das Finanzierungsziel an.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum & Uhrzeit des Balls</Label>
              <Input 
                id="date" 
                type="datetime-local" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Finanzierungsziel in €</Label>
              <Input 
                id="goal" 
                type="number"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
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
