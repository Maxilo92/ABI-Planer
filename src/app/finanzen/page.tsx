'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { AddFinanceDialog } from '@/components/modals/AddFinanceDialog'
import { EditFinanceDialog } from '@/components/modals/EditFinanceDialog'
import { FinanceEntry, Settings } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, Trash2 } from 'lucide-react'
import { toDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function FinancePage() {
  const { profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [finances, setFinances] = useState<FinanceEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Listen to Settings
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings({ id: 1, ...doc.data() } as Settings)
      } else {
        setSettings({ id: 1, ball_date: '2026-06-20T18:00:00Z', funding_goal: 10000 })
      }
    })

    // 2. Listen to Finances
    const financesRef = collection(db, 'finances')
    const qFinances = query(financesRef, orderBy('entry_date', 'desc'))
    const unsubscribeFinances = onSnapshot(qFinances, (snapshot) => {
      setFinances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry)))
      setLoading(false)
    })

    return () => {
      unsubscribeSettings()
      unsubscribeFinances()
    }
  }, [])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin') && profile?.is_approved

  const handleTicketSalesChange = async (value: number) => {
    if (!isPlanner) return
    try {
      await setDoc(doc(db, 'settings', 'config'), { expected_ticket_sales: value }, { merge: true })
    } catch (error) {
      console.error('Error updating expected ticket sales:', error)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) return

    try {
      await deleteDoc(doc(db, 'finances', id))
      toast.success('Eintrag gelöscht.')
    } catch (err) {
      console.error('Error deleting finance entry:', err)
      toast.error('Fehler beim Löschen.')
    }
  }

  const amounts = finances.map((entry) => Number(entry.amount) || 0)
  const currentFunding = amounts.filter((value) => value > 0).reduce((acc, value) => acc + value, 0)
  const expenseGoal = amounts.filter((value) => value < 0).reduce((acc, value) => acc + Math.abs(value), 0)
  const effectiveGoal = expenseGoal > 0 ? expenseGoal : (settings?.funding_goal || 10000)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanzen</h1>
          <p className="text-muted-foreground">Budgetplanung mit Einnahmen und Ausgaben.</p>
        </div>
        {isPlanner && <AddFinanceDialog />}
      </div>

      <FundingStatus
        current={currentFunding}
        goal={effectiveGoal}
        initialTicketSales={settings?.expected_ticket_sales || 150}
        onTicketSalesChange={handleTicketSalesChange}
      />

      <Card>
        <CardHeader>
          <CardTitle>Finanzverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                {isPlanner && <TableHead className="text-right w-[100px]">Aktionen</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isPlanner ? 4 : 3} className="text-center py-4 text-muted-foreground italic">
                    Noch keine Einnahmen erfasst.
                  </TableCell>
                </TableRow>
              ) : (
                finances.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(toDate(entry.entry_date), 'dd.MM.yyyy', { locale: de })}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{entry.description}</span>
                        {entry.responsible_class && (
                          <span className="text-[10px] text-muted-foreground">Kurs {entry.responsible_class}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${Number(entry.amount) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {Number(entry.amount) < 0 ? '-' : '+'} {Math.abs(Number(entry.amount)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    {isPlanner && (
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <EditFinanceDialog entry={entry} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
