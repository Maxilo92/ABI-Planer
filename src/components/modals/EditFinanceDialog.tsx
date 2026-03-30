'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logging'
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
import { Pencil, ChevronDown, Loader2 } from 'lucide-react'
import { ClassName, FinanceEntry } from '@/types/database'
import { toast } from 'sonner'

interface EditFinanceDialogProps {
  entry: FinanceEntry
}

export function EditFinanceDialog({ entry }: EditFinanceDialogProps) {
  const [amount, setAmount] = useState(entry.amount.toString())
  const [description, setDescription] = useState(entry.description || '')
  const [responsibleClass, setResponsibleClass] = useState<ClassName | 'Allgemein'>(entry.responsible_class || 'Allgemein')
  const [courses, setCourses] = useState<string[]>(['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7'])
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [open, setOpen] = useState(false)
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading || !profile?.is_approved) return
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists() && doc.data().courses) {
        setCourses(doc.data().courses)
      }
      setLoadingCourses(false)
    }, (error) => {
      console.error('EditFinanceDialog: Error listening to settings:', error)
      setLoadingCourses(false)
    })
    return () => unsubscribe()
  }, [authLoading, profile?.is_approved])

  const dropdownClasses: (ClassName | 'Allgemein')[] = [...courses, 'Allgemein']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user) {
      try {
        const numericAmount = parseFloat(amount.replace(',', '.'))
        const docRef = doc(db, 'finances', entry.id)
        await updateDoc(docRef, { 
          amount: numericAmount, 
          description,
          responsible_class: responsibleClass === 'Allgemein' ? null : responsibleClass,
        })

        await logAction('FINANCE_EDITED', user.uid, profile?.full_name, { 
          id: entry.id,
          amount: numericAmount, 
          description,
          responsible_class: responsibleClass
        })

        toast.success('Eintrag aktualisiert.')
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Error updating finance entry:', error)
        toast.error('Fehler beim Aktualisieren.')
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finanzposten bearbeiten</DialogTitle>
          <DialogDescription>
            Positive Werte sind Einnahmen, negative Werte sind Ausgaben.
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
                placeholder="z.B. 250 oder -1500"
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
              <Label>Verantwortlicher Kurs</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between" disabled={loadingCourses}>
                      {loadingCourses ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Lade Kurse...
                        </>
                      ) : (
                        <>
                          {responsibleClass === 'Allgemein' ? 'Allgemein / Kein Kurs' : `Kurs ${responsibleClass}`}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </>
                      )}
                    </Button>
                  }
                />
                {!loadingCourses && (
                  <DropdownMenuContent className="w-[calc(100vw-4rem)] max-w-[350px]">
                    {dropdownClasses.map((c) => (
                      <DropdownMenuItem key={c} onClick={() => setResponsibleClass(c)}>
                        {c === 'Allgemein' ? 'Allgemein / Kein Kurs' : `Kurs ${c}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                )}
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
