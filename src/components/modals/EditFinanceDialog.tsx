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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Pencil, ChevronDown } from 'lucide-react'
import { ClassName, FinanceEntry } from '@/types/database'
import { toast } from 'sonner'

interface EditFinanceDialogProps {
  entry: FinanceEntry
}

export function EditFinanceDialog({ entry }: EditFinanceDialogProps) {
  const [amount, setAmount] = useState(entry.amount.toString())
  const [description, setDescription] = useState(entry.description || '')
  const [responsibleClass, setResponsibleClass] = useState<ClassName | 'Allgemein'>(entry.responsible_class || 'Allgemein')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const classes: (ClassName | 'Allgemein')[] = ['12A', '12B', '12C', '12D', 'Allgemein']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const docRef = doc(db, 'finances', entry.id)
      await updateDoc(docRef, { 
        amount: parseFloat(amount.replace(',', '.')), 
        description,
        responsible_class: responsibleClass === 'Allgemein' ? null : responsibleClass,
      })

      toast.success('Eintrag aktualisiert.')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating finance entry:', error)
      toast.error('Fehler beim Aktualisieren.')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einnahme bearbeiten</DialogTitle>
          <DialogDescription>
            Passe die Details der Einnahme an.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Betrag in €</Label>
              <Input 
                id="edit-amount" 
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-finance-description">Beschreibung / Quelle</Label>
              <Input 
                id="edit-finance-description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Verantwortliche Klasse</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {responsibleClass === 'Allgemein' ? 'Allgemein / Keine Klasse' : `Klasse ${responsibleClass}`}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
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
              {loading ? 'Speichern...' : 'Aktualisieren'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
