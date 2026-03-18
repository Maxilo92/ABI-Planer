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
import { Plus, X, Settings as SettingsIcon } from 'lucide-react'
import { format } from 'date-fns'
import { toDate } from '@/lib/utils'

import { toast } from 'sonner'

interface EditSettingsDialogProps {
  currentDate?: string
  currentGoal?: number
  currentCourses?: string[]
}

export function EditSettingsDialog({ 
  currentDate = '2026-06-20T18:00:00Z', 
  currentGoal = 10000,
  currentCourses = ['12A', '12B', '12C', '12D']
}: EditSettingsDialogProps) {
  // Format the date for the datetime-local input (YYYY-MM-DDTHH:MM)
  const initialDate = currentDate ? format(toDate(currentDate), "yyyy-MM-dd'T'HH:mm") : ''
  
  const [date, setDate] = useState(initialDate)
  const [goal, setGoal] = useState(currentGoal.toString())
  const [courses, setCourses] = useState<string[]>(currentCourses)
  const [newCourse, setNewCourse] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleAddCourse = () => {
    if (newCourse && !courses.includes(newCourse)) {
      setCourses([...courses, newCourse])
      setNewCourse('')
    }
  }

  const handleRemoveCourse = (course: string) => {
    setCourses(courses.filter(c => c !== course))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await setDoc(doc(db, 'settings', 'config'), { 
        ball_date: new Date(date).toISOString(),
        funding_goal: parseFloat(goal),
        courses: courses
      }, { merge: true })

      toast.success('Einstellungen erfolgreich aktualisiert.')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>Einstellungen</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Einstellungen bearbeiten</DialogTitle>
          <DialogDescription>
            Passe das Datum des Balls, das Finanzierungsziel und die Kurse an.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
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

            <div className="space-y-3">
              <Label>Verfügbare Kurse</Label>
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => (
                  <div key={course} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm font-medium">
                    {course}
                    <button type="button" onClick={() => handleRemoveCourse(course)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="z.B. 12E" 
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCourse()
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={handleAddCourse} disabled={!newCourse}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
