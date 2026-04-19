'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { ClassRanking } from '@/components/dashboard/ClassRanking'
import { AddFinanceDialog } from '@/components/modals/AddFinanceDialog'
import { EditFinanceDialog } from '@/components/modals/EditFinanceDialog'
import { FinanceEntry, Settings, ShopEarning } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Heart, Coffee, Loader2, Trash2, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { usePopupManager } from '@/modules/popup/usePopupManager'

export default function FinancePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { confirm } = usePopupManager()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [finances, setFinances] = useState<FinanceEntry[]>([])
  const [shopEarnings, setShopEarnings] = useState<ShopEarning[]>([])
  const [shopEarningsLoaded, setShopEarningsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!profile) {
      setLoading(false)
      setShopEarningsLoaded(true)
      return
    }

    // 1. Listen to Settings
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings({ id: 1, ...doc.data() } as Settings)
      } else {
        setSettings({ id: 1, ball_date: '2027-06-19T18:00:00Z', funding_goal: 10000, support_goal: 100 })
      }
    }, (error) => {
      console.error('FinanzenPage: Error listening to settings:', error)
      setSettings({ id: 1, ball_date: '2027-06-19T18:00:00Z', funding_goal: 10000, support_goal: 100 })
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

    // 3. Listen to Shop Earnings for leaderboard support
    let unsubscribeShopEarnings = () => setShopEarningsLoaded(true)
    if (profile?.is_approved) {
      const shopEarningsRef = collection(db, 'shop_earnings')
      unsubscribeShopEarnings = onSnapshot(shopEarningsRef, (snapshot) => {
        setShopEarnings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopEarning)))
        setShopEarningsLoaded(true)
      }, (error) => {
        console.error('Error listening to shop earnings:', error)
        setShopEarningsLoaded(true)
      })
    } else {
      setShopEarningsLoaded(true)
    }

    return () => {
      unsubscribeSettings()
      unsubscribeFinances()
      unsubscribeShopEarnings()
    }
  }, [authLoading, profile])

  if (authLoading || loading || !shopEarningsLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <FundingStatus current={0} goal={10000} isAuthenticated={true} loading={true} />

        <div className="grid grid-cols-1 gap-6">
          <ClassRanking finances={[]} goal={10000} loading={true} />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
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
  const canEditTicketSales = isPlanner

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
    const confirmed = await confirm({
      title: 'Eintrag löschen?',
      content: 'Möchtest du diesen Eintrag wirklich löschen?',
      priority: 'high',
      confirmLabel: 'Eintrag löschen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return

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
      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Finanzen</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Budgetplanung</h1>
          </div>
          <div className="flex w-full md:w-auto flex-wrap gap-2">
            <Link href="/finanzen/spenden/abi">
              <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:border-primary hover:text-primary transition-all">
                <Heart className="h-4 w-4 fill-primary/10" />
                Spende Abi
              </Button>
            </Link>
            <Link href="/finanzen/spenden/entwickler">
              <Button variant="outline" size="sm" className="gap-2 border-brand/20 hover:border-brand hover:text-brand transition-all">
                <Coffee className="h-4 w-4 fill-brand/10" />
                Support App
              </Button>
            </Link>
            {isPlanner && <AddFinanceDialog />}
          </div>
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
        <Card className="bg-brand/5 border-brand/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand uppercase">Aktueller Kontostand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
              {currentBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
      </div>

      <FundingStatus
        current={currentBalance}
        goal={fundingGoal}
        initialTicketSales={settings?.expected_ticket_sales ?? 150}
        onTicketSalesChange={canEditTicketSales ? handleTicketSalesChange : undefined}
        canEditTicketSales={canEditTicketSales}
        isAuthenticated={!!user}
      />

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <ClassRanking 
          finances={finances} 
          shopEarnings={shopEarnings}
          goal={fundingGoal} 
          useScrollContainer={false}
          infoLink="/finanzen/spenden/abi"
          loading={!shopEarningsLoaded}
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
