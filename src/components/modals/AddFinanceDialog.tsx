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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, ChevronDown } from 'lucide-react'
import { ClassName } from '@/types/database'

export function AddFinanceDialog() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [responsibleClass, setResponsibleClass] = useState<ClassName | 'Allgemein'>('Allgemein')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()

  const classes: (ClassName | 'Allgemein')[] = ['12A', '12B', '12C', '12D', 'Allgemein']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user) {
      try {
        await addDoc(collection(db, 'finances'), { 
          amount: parseFloat(amount.replace(',', '.')), 
          description,
          responsible_class: responsibleClass === 'Allgemein' ? null : responsibleClass,
          responsible_user_name: profile?.full_name || user.displayName || 'Unbekannt',
          created_by: user.uid,
          entry_date: serverTimestamp() 
        })

        setAmount('')
        setDescription('')
        setResponsibleClass('Allgemein')
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
            <div className="space-y-2">
              <Label>Verantwortliche Klasse</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between">
                      {responsibleClass === 'Allgemein' ? 'Allgemein / Keine Klasse' : `Klasse ${responsibleClass}`}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  }
                />
                <DropdownMenuContent className="w-[calc(100vw-4rem)] max-w-[350px]">
                  {classes.map((c) => (
                    <DropdownMenuItem key={c} onClick={() => setResponsibleClass(c)}>
                      {c === 'Allgemein' ? 'Allgemein / Keine Klasse' : `Klasse ${c}`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
