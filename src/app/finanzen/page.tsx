'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { ClassRanking } from '@/components/dashboard/ClassRanking'
import { AddFinanceDialog } from '@/components/modals/AddFinanceDialog'
import { EditFinanceDialog } from '@/components/modals/EditFinanceDialog'
import { FinanceEntry, Settings } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Heart, Loader2, Trash2, Wallet } from 'lucide-react'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'

export default function FinancePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [finances, setFinances] = useState<FinanceEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!profile) {
      setLoading(false)
      return
    }

    // 1. Listen to Settings
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings({ id: 1, ...doc.data() } as Settings)
      } else {
        setSettings({ id: 1, ball_date: '2027-06-19T18:00:00Z', funding_goal: 10000 })
      }
    })

    // 2. Listen to Finances
    const financesRef = collection(db, 'finances')
    const qFinances = query(financesRef, orderBy('entry_date', 'desc'))
    const unsubscribeFinances = onSnapshot(qFinances, (snapshot) => {
      setFinances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry)))
      setLoading(false)
    }, (error) => {
      console.error('Error listening to finances:', error)
      setLoading(false)
    })

    return () => {
      unsubscribeSettings()
      unsubscribeFinances()
    }
  }, [authLoading, profile])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Finanzübersicht gesperrt" 
          description="Die Kassenstände und Ausgaben der Stufe sind privat. Bitte melde dich an, um die Finanzplanung zu sehen."
          icon={<Wallet className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin') && profile?.is_approved

  const handleTicketSalesChange = async (value: number) => {
    if (!isPlanner) return
    try {
      await setDoc(doc(db, 'settings', 'config'), { expected_ticket_sales: value }, { merge: true })

      if (user) {
        await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
          field: 'expected_ticket_sales',
          value,
          source: 'finanzen',
        })
      }
    } catch (error) {
      console.error('Error updating expected ticket sales:', error)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) return

    const entryToDelete = finances.find(f => f.id === id)

    try {
      await deleteDoc(doc(db, 'finances', id))
      
      if (user) {
        await logAction('FINANCE_DELETED', user.uid, profile?.full_name, { 
          id, 
          amount: entryToDelete?.amount,
          description: entryToDelete?.description
        })
      }

      toast.success('Eintrag gelöscht.')
    } catch (err) {
      console.error('Error deleting finance entry:', err)
      toast.error('Fehler beim Löschen.')
    }
  }

  const amounts = finances.map((entry) => Number(entry.amount) || 0)
  const totalIncome = amounts.filter((value) => value > 0).reduce((acc, value) => acc + value, 0)
  const totalExpenses = amounts.filter((value) => value < 0).reduce((acc, value) => acc + Math.abs(value), 0)
  const currentBalance = totalIncome - totalExpenses
  const fundingGoal = settings?.funding_goal ?? 10000

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanzen</h1>
          <p className="text-muted-foreground">Budgetplanung mit Einnahmen und Ausgaben.</p>
        </div>
        <div className="flex w-full md:w-auto flex-wrap gap-2">
          <Link href="/finanzen/spenden">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Heart className="h-4 w-4 text-primary fill-primary/20" />
              Spenden & Hilfe
            </Button>
          </Link>
          {isPlanner && <AddFinanceDialog />}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Gesamteinnahmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              + {totalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Gesamtausgaben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              - {totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Finanzierungsziel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {fundingGoal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary uppercase">Aktueller Kontostand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentBalance < 0 ? 'text-destructive' : 'text-primary'}`}>
              {currentBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
      </div>

      <FundingStatus
        current={currentBalance}
        goal={fundingGoal}
        initialTicketSales={settings?.expected_ticket_sales ?? 150}
        onTicketSalesChange={handleTicketSalesChange}
        isAuthenticated={!!user}
      />

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <ClassRanking 
          finances={finances} 
          goal={fundingGoal} 
          useScrollContainer={false}
          infoLink="/finanzen/spenden"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Finanzverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table className="min-w-[600px] sm:min-w-0">
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
                      <TableCell className="whitespace-nowrap">{format(toDate(entry.entry_date), 'dd.MM.yyyy', { locale: de })}</TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-[150px]">
                          <span>{entry.description}</span>
                          {entry.responsible_class && (
                            <span className="text-[10px] text-muted-foreground">Kurs {entry.responsible_class}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-semibold whitespace-nowrap ${Number(entry.amount) < 0 ? 'text-destructive' : 'text-success'}`}>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
