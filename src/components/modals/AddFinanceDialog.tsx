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

export function AddFinanceDialog() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user) {
      try {
        await addDoc(collection(db, 'finances'), { 
          amount: parseFloat(amount.replace(',', '.')), 
          description,
          created_by: user.uid,
          entry_date: serverTimestamp() 
        })

        setAmount('')
        setDescription('')
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Error adding finance entry:', error)
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Einnahme erfassen
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einnahme hinzufügen</DialogTitle>
          <DialogDescription>
            Dokumentiere Geldflüsse für das Budget.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag in €</Label>
              <Input 
                id="amount" 
                placeholder="z.B. 50.00" 
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung / Quelle</Label>
              <Input 
                id="description" 
                placeholder="z.B. Kuchenverkauf 12.03." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
