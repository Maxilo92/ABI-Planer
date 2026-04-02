'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore'
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
import { Plus, ChevronDown, Loader2 } from 'lucide-react'
import { ClassName } from '@/types/database'
import { logAction } from '@/lib/logging'

export function AddFinanceDialog() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [responsibleClass, setResponsibleClass] = useState<ClassName | 'Allgemein'>('Allgemein')
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
      console.error('AddFinanceDialog: Error listening to settings:', error)
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
        await addDoc(collection(db, 'finances'), { 
          amount: numericAmount, 
          description,
          responsible_class: responsibleClass === 'Allgemein' ? null : responsibleClass,
          responsible_user_name: profile?.full_name || user.displayName || 'Unbekannt',
          created_by: user.uid,
          entry_date: serverTimestamp() 
        })

        await logAction('FINANCE_ADDED', user.uid, profile?.full_name, { 
          amount: numericAmount, 
          description,
          responsible_class: responsibleClass
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
            <Plus className="h-4 w-4" /> Betrag erfassen
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finanzposten hinzufügen</DialogTitle>
          <DialogDescription>
            Positive Werte sind Einnahmen, negative Werte sind Ausgaben.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag in €</Label>
              <Input 
                id="amount" 
                placeholder="z.B. 250 oder -1500" 
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
              <p className="text-xs text-muted-foreground">Negativ für Ausgaben (z.B. -1500 für Location).</p>
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
              {loading ? 'Speichern...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
