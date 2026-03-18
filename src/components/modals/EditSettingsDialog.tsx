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
import { Textarea } from '@/components/ui/textarea'
import { Settings as SettingsIcon } from 'lucide-react'
import { format } from 'date-fns'

interface EditSettingsDialogProps {
  currentDate: string
  currentGoal: number
  currentCourses?: string[]
}

export function EditSettingsDialog({ currentDate, currentGoal, currentCourses = ['12A', '12B', '12C', '12D'] }: EditSettingsDialogProps) {
  // Format the date for the datetime-local input (YYYY-MM-DDTHH:MM)
  const initialDate = currentDate ? format(new Date(currentDate), "yyyy-MM-dd'T'HH:mm") : ''
  
  const [date, setDate] = useState(initialDate)
  const [goal, setGoal] = useState(currentGoal.toString())
  const [courses, setCourses] = useState(currentCourses.join('\n'))
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const normalizedCourses = courses
        .split('\n')
        .map((entry) => entry.trim())
        .filter((entry, index, self) => entry.length > 0 && self.indexOf(entry) === index)

      await setDoc(doc(db, 'settings', 'config'), { 
        ball_date: new Date(date).toISOString(),
        funding_goal: parseFloat(goal),
        courses: normalizedCourses.length > 0 ? normalizedCourses : ['12A', '12B', '12C', '12D']
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
            <div className="space-y-2">
              <Label htmlFor="courses">Kurse (eine Zeile pro Kurs)</Label>
              <Textarea
                id="courses"
                value={courses}
                onChange={(e) => setCourses(e.target.value)}
                rows={5}
                placeholder={'12A\n12B\n12C\n12D'}
              />
              <p className="text-xs text-muted-foreground">
                Hier kannst du Kurse direkt umbenennen, hinzufügen oder entfernen.
              </p>
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
