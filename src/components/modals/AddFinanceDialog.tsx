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

export function AddFinanceDialog() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
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
        .from('finances')
        .insert([{ 
          amount: parseFloat(amount.replace(',', '.')), 
          description,
          created_by: user.id 
        }])

      if (!error) {
        setAmount('')
        setDescription('')
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
