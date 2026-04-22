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
import { Textarea } from '@/components/ui/textarea'
import { ShieldCheck } from 'lucide-react'
import { logAction } from '@/lib/logging'
import { toast } from 'sonner'

export function VerifyCashDialog() {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user) {
      try {
        const numericAmount = parseFloat(amount.replace(',', '.'))
        
        await addDoc(collection(db, 'cash_verifications'), { 
          amount: numericAmount, 
          note: note.trim() || null,
          verified_by: user.uid,
          verified_by_name: profile?.full_name || user.displayName || 'Unbekannt',
          verification_date: serverTimestamp() 
        })

        await logAction('CASH_VERIFIED', user.uid, profile?.full_name, { 
          amount: numericAmount, 
          note
        })

        toast.success('Kassenstand erfolgreich abgeglichen.')
        setAmount('')
        setNote('')
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Error verifying cash:', error)
        toast.error('Fehler beim Abgleichen des Kassenstands.')
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 border-success/20 hover:border-success hover:text-success transition-all">
            <ShieldCheck className="h-4 w-4" /> Kassenstand abgleichen
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kassenstand abgleichen (Prüfsumme)</DialogTitle>
          <DialogDescription>
            Gib hier den tatsächlich in der Kasse vorhandenen Betrag ein. Dieser Wert wird als Prüfsumme zum Transaktionsverlauf gespeichert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="v_amount">Tatsächlicher Kassenbestand in €</Label>
              <Input 
                id="v_amount" 
                placeholder="z.B. 1240,50" 
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
              <p className="text-xs text-muted-foreground">Der Betrag, der physisch in der Abikasse liegt.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Notiz (Optional)</Label>
              <Textarea 
                id="note" 
                placeholder="z.B. Nach dem Kuchenverkauf gezählt." 
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Abgleichen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
