'use client'

import { useEffect, useState } from 'react'
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
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logging'

interface EditSettingsDialogProps {
  currentDate: string
  currentGoal: number
  currentSupportGoal: number
  currentSupportAmount?: number
}

export function EditSettingsDialog({ currentDate, currentGoal, currentSupportGoal, currentSupportAmount = 0 }: EditSettingsDialogProps) {
  const { user, profile } = useAuth()
  
  const [date, setDate] = useState('')
  const [goal, setGoal] = useState(currentGoal.toString())
  const [supportGoal, setSupportGoal] = useState(currentSupportGoal.toString())
  const [supportAmount, setSupportAmount] = useState(currentSupportAmount.toString())
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Sync state when props change (e.g. after loading from Firestore)
  useEffect(() => {
    if (currentDate) {
      try {
        setDate(format(new Date(currentDate), "yyyy-MM-dd'T'HH:mm"))
      } catch (error) {
        console.error('Invalid date format:', currentDate, error)
      }
    }
    setGoal(currentGoal.toString())
    setSupportGoal(currentSupportGoal.toString())
    setSupportAmount(currentSupportAmount.toString())
  }, [currentDate, currentGoal, currentSupportGoal, currentSupportAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await setDoc(doc(db, 'settings', 'config'), { 
        ball_date: new Date(date).toISOString(),
        funding_goal: parseFloat(goal),
        support_goal: parseFloat(supportGoal),
        current_support_amount: parseFloat(supportAmount),
      }, { merge: true })

      if (user) {
        await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
          fields: ['ball_date', 'funding_goal', 'support_goal', 'current_support_amount'],
          ball_date: new Date(date).toISOString(),
          funding_goal: parseFloat(goal),
          support_goal: parseFloat(supportGoal),
          current_support_amount: parseFloat(supportAmount),
          source: 'edit-settings-dialog',
        })
      }

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
              <Label htmlFor="supportGoal">Support-Ziel in €</Label>
              <Input 
                id="supportGoal" 
                type="number"
                value={supportGoal}
                onChange={(e) => setSupportGoal(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportAmount">Aktueller Support-Stand in €</Label>
              <Input 
                id="supportAmount" 
                type="number"
                step="0.01"
                value={supportAmount}
                onChange={(e) => setSupportAmount(e.target.value)}
                required 
              />
              <p className="text-[10px] text-muted-foreground">Manueller Stand (BMAC + Überweisungen).</p>
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
