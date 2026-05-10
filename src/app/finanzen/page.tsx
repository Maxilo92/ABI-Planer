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

import { calculateFinanceBreakdown } from '@/lib/finance-utils'

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

        <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 @xl:grid-cols-12 gap-6">
          <div className="@xl:col-span-8 space-y-6">
            <Skeleton className="h-[350px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="@xl:col-span-4 space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
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

  // Calculate course breakdown for progress bar
  const breakdown = calculateFinanceBreakdown(finances, shopEarnings, settings)

  // Checksum calculation
  const diff = lastVerification ? lastVerification.amount - currentBalance : null
  const isDiffSignificant = diff !== null && Math.abs(diff) > 0.01

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-3xl border border-border bg-card px-4 py-4 sm:px-6 sm:py-5 shadow-sm overflow-hidden">
        <div className="flex flex-col @xl:flex-row @xl:items-center justify-between gap-4">
          <div className="min-w-0 shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Finanzen</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">Budgetplanung</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 @md:gap-4 justify-start @xl:justify-end w-full @xl:w-auto min-w-0">
            {/* Support/Donation Group */}
            <div className="flex items-center bg-muted/40 p-1 rounded-full border border-border/50 shrink-0">
              <Link href="/finanzen/spenden/abi">
                <Button variant="ghost" size="sm" className="h-7 px-2 @sm:px-3 rounded-full gap-1.5 text-[10px] font-bold hover:bg-background shadow-none transition-all">
                  <Heart className="h-3 w-3 text-primary fill-primary/10" />
                  <span className="hidden @sm:inline">Spende Abi</span>
                </Button>
              </Link>
              <div className="w-px h-3 bg-border/50 mx-0.5" />
              <Link href="/finanzen/spenden/entwickler">
                <Button variant="ghost" size="sm" className="h-7 px-2 @sm:px-3 rounded-full gap-1.5 text-[10px] font-bold hover:bg-background shadow-none transition-all">
                  <Coffee className="h-3 w-3 text-brand fill-brand/10" />
                  <span className="hidden @sm:inline">Entwickler</span>
                </Button>
              </Link>
            </div>

            {/* Main Admin Actions */}
            {isPlanner && (
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-px h-5 bg-border/60 mx-1 hidden @xl:block" />
                <div className="flex items-center gap-2">
                  <VerifyCashDialog />
                  <AddFinanceDialog />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Einnahmen</p>
          <div className="text-xl sm:text-2xl font-bold text-success truncate">
            + {totalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Ausgaben</p>
          <div className="text-xl sm:text-2xl font-bold text-destructive truncate">
            - {totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Ziel</p>
          <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {fundingGoal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-brand/5 border-brand/20">
          <p className="text-[9px] font-bold text-brand uppercase tracking-wider mb-1">Stand (Eff.)</p>
          <div className="flex items-center gap-2">
            <div className={`text-xl sm:text-2xl font-bold truncate ${currentBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
              {Math.max(currentBalance, lastVerification?.amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </div>
            {isDiffSignificant && (
              <div className="text-warning animate-pulse shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 @xl:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Main Column */}
        <div className="@xl:col-span-8 space-y-4 sm:space-y-6">
          <FinanceChart 
            finances={finances} 
            shopEarnings={shopEarnings} 
            settings={settings} 
            loading={loading || !shopEarningsLoaded}
          />

          {lastVerification && (
            <Card className={`border-l-4 ${isDiffSignificant ? 'border-l-warning bg-warning/5' : 'border-l-success bg-success/5'}`}>
              <CardContent className="py-3 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-full ${isDiffSignificant ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                      {isDiffSignificant ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-tight">Kassenabgleich</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {format(toDate(lastVerification.verification_date), 'dd.MM.yy HH:mm', { locale: de })} von {lastVerification.verified_by_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">Physisch</p>
                      <p className="text-sm font-bold">{lastVerification.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">Diff.</p>
                      <p className={`text-sm font-black ${isDiffSignificant ? 'text-destructive' : 'text-success'}`}>
                        {diff! > 0 ? '+' : ''}{diff?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="py-2 px-4 border-b border-border bg-muted/5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Finanzverlauf</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[100px] h-8 text-[10px] px-4 uppercase font-bold">Datum</TableHead>
                      <TableHead className="h-8 text-[10px] px-4 uppercase font-bold">Beschreibung</TableHead>
                      <TableHead className="text-right h-8 text-[10px] px-4 uppercase font-bold">Betrag</TableHead>
                      {isPlanner && <TableHead className="text-right w-[80px] h-8 text-[10px] px-4 uppercase font-bold">Aktion</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isPlanner ? 4 : 3} className="text-center py-6 text-muted-foreground italic text-xs">
                          Keine Einträge.
                        </TableCell>
                      </TableRow>
                    ) : (
                      finances.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-muted/20">
                          <TableCell className="whitespace-nowrap font-medium text-[11px] py-1.5 px-4">{format(toDate(entry.entry_date), 'dd.MM.yy', { locale: de })}</TableCell>
                          <TableCell className="py-1.5 px-4">
                            <div className="flex flex-col min-w-[120px]">
                              <span className="font-semibold text-[11px] leading-tight">{entry.description}</span>
                              {entry.responsible_class && (
                                <span className="text-[9px] text-muted-foreground">K {entry.responsible_class}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-bold text-[11px] py-1.5 px-4 whitespace-nowrap ${Number(entry.amount) < 0 ? 'text-destructive' : 'text-success'}`}>
                            {Number(entry.amount) < 0 ? '-' : '+'} {Math.abs(Number(entry.amount)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                          </TableCell>
                          {isPlanner && (
                            <TableCell className="text-right py-1.5 px-4">
                              <div className="flex justify-end items-center gap-1">
                                <EditFinanceDialog entry={entry} />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() => handleDelete(entry.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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

        {/* Sidebar */}
        <div className="@xl:col-span-4 space-y-6">
          <FundingStatus
            current={currentBalance}
            checksum={lastVerification?.amount}
            breakdown={breakdown}
            goal={fundingGoal}
            initialTicketSales={settings?.expected_ticket_sales ?? 150}
            onTicketSalesChange={canEditTicketSales ? handleTicketSalesChange : undefined}
            canEditTicketSales={canEditTicketSales}
            isAuthenticated={!!user}
            profile={profile}
            settings={settings}
          />

          <ClassRanking 
            finances={finances} 
            shopEarnings={shopEarnings}
            goal={fundingGoal} 
            useScrollContainer={true}
            infoLink="/finanzen/spenden/abi"
            loading={!shopEarningsLoaded}
          />
        </div>
      </div>
    </div>
  )
}
