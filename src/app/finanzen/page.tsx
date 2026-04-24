'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc, limit } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { ClassRanking } from '@/components/dashboard/ClassRanking'
import { AddFinanceDialog } from '@/components/modals/AddFinanceDialog'
import { EditFinanceDialog } from '@/components/modals/EditFinanceDialog'
import { VerifyCashDialog } from '@/components/modals/VerifyCashDialog'
import { FinanceEntry, Settings, ShopEarning, CashVerification } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Heart, Coffee, Loader2, Trash2, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { usePopupManager } from '@/modules/popup/usePopupManager'
import { FinanceChart } from '@/components/dashboard/FinanceChart'

export default function FinancePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { confirm } = usePopupManager()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [finances, setFinances] = useState<FinanceEntry[]>([])
  const [lastVerification, setLastVerification] = useState<CashVerification | null>(null)
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

    // 2.5 Listen to latest Cash Verification
    const verificationsRef = collection(db, 'cash_verifications')
    const qVerifications = query(verificationsRef, orderBy('verification_date', 'desc'), limit(1))
    const unsubscribeVerifications = onSnapshot(qVerifications, (snapshot) => {
      if (!snapshot.empty) {
        setLastVerification({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CashVerification)
      } else {
        setLastVerification(null)
      }
    }, (error) => {
      console.error('Error listening to cash verifications:', error)
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
      unsubscribeVerifications()
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

  const handleTicketPriceChange = async (value: number) => {
    if (!isPlanner) return
    try {
      await setDoc(doc(db, 'settings', 'config'), { expected_ticket_price: value }, { merge: true })

      if (user) {
        await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
          field: 'expected_ticket_price',
          value,
          source: 'finanzen',
        })
      }
    } catch (error) {
      console.error('Error updating expected ticket price:', error)
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

  // Calculate course breakdown for progress bar
  const COURSE_COLORS = [
    'bg-primary',
    'bg-success',
    'bg-brand',
    'bg-info',
    'bg-warning',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ]

  const courseContributions: Record<string, number> = {}
  
  // Add contributions from finance entries (income only for better visualization)
  finances.forEach(entry => {
    if (entry.responsible_class && entry.amount > 0) {
      const course = String(entry.responsible_class)
      courseContributions[course] = (courseContributions[course] || 0) + entry.amount
    }
  })

  // Add contributions from shop earnings
  shopEarnings.forEach(earning => {
    if (earning.selected_course && earning.abi_share_eur > 0) {
      const course = String(earning.selected_course)
      courseContributions[course] = (courseContributions[course] || 0) + earning.abi_share_eur
    }
  })

  // Add manual adjustments if they exist
  if (settings?.leaderboard_adjustments) {
    Object.entries(settings.leaderboard_adjustments).forEach(([course, amount]) => {
      if (amount > 0) {
        courseContributions[course] = (courseContributions[course] || 0) + amount
      }
    })
  }

  const breakdown = Object.entries(courseContributions)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([course, amount], index) => ({
      label: `Kurs ${course}`,
      amount,
      color: COURSE_COLORS[index % COURSE_COLORS.length]
    }))

  // Checksum calculation
  const diff = lastVerification ? lastVerification.amount - currentBalance : null
  const isDiffSignificant = diff !== null && Math.abs(diff) > 0.01

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
            {isPlanner && (
              <>
                <VerifyCashDialog />
                <AddFinanceDialog />
              </>
            )}
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
            <CardTitle className="text-sm font-medium text-brand uppercase">Kontostand (Effektiv)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${currentBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {Math.max(currentBalance, lastVerification?.amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </div>
              {isDiffSignificant && (
                <div className="text-warning animate-pulse">
                  <AlertCircle className="h-5 w-5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <FinanceChart 
        finances={finances} 
        shopEarnings={shopEarnings} 
        settings={settings} 
        loading={loading || !shopEarningsLoaded}
      />

      {lastVerification && (
        <Card className={`border-l-4 ${isDiffSignificant ? 'border-l-warning bg-warning/5' : 'border-l-success bg-success/5'}`}>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-full ${isDiffSignificant ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                  {isDiffSignificant ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">Letzter Kassenabgleich (Prüfsumme)</h3>
                  <p className="text-xs text-muted-foreground">
                    Zuletzt am {format(toDate(lastVerification.verification_date), 'dd.MM.yyyy HH:mm', { locale: de })} von {lastVerification.verified_by_name}
                  </p>
                  {lastVerification.note && (
                    <p className="text-[10px] mt-1 text-muted-foreground italic">"{lastVerification.note}"</p>
                  )}
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Physisch gezählt</p>
                  <p className="text-lg font-bold">{lastVerification.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Differenz</p>
                  <p className={`text-lg font-black ${isDiffSignificant ? 'text-destructive' : 'text-success'}`}>
                    {diff! > 0 ? '+' : ''}{diff?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            </div>
            {isDiffSignificant && (
              <p className="mt-3 text-[10px] text-warning-foreground bg-warning/10 p-2 rounded-lg border border-warning/20">
                Achtung: Der physische Kassenstand weicht vom Transaktionsverlauf ab. Bitte prüfe, ob alle Einnahmen und Ausgaben korrekt erfasst wurden oder ob Geld in der Kasse fehlt.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <FundingStatus
        current={currentBalance}
        checksum={lastVerification?.amount}
        breakdown={breakdown}
        goal={fundingGoal}
        initialTicketSales={settings?.expected_ticket_sales ?? 150}
        initialTicketPrice={settings?.expected_ticket_price ?? 0}
        onTicketSalesChange={canEditTicketSales ? handleTicketSalesChange : undefined}
        onTicketPriceChange={canEditTicketSales ? handleTicketPriceChange : undefined}
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
