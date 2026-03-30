'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { Euro, TrendingUp, PiggyBank, Briefcase, Calendar as CalendarIcon } from 'lucide-react'

type StripeTransaction = {
  id: string
  amount: number
  charged_amount_eur: number
  charged_amount_cents: number
  item_id: string
  selected_course: string | null
  donor_name: string | null
  user_id: string
  is_guest: boolean
  customer_email: string | null
  processed_at: any
  status: string
}

export default function ShopEarningsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<StripeTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const router = useRouter()
  const pathname = usePathname()

  const canManageUsers = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canManageUsers)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [profile, authLoading, canManageUsers, router, pathname])

  useEffect(() => {
    if (!canManageUsers) return

    const q = query(
      collection(db, 'stripe_transactions'),
      where('status', '==', 'completed'),
      orderBy('processed_at', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StripeTransaction)))
      setLoading(false)
    }, (error) => {
      console.error("Error fetching stripe transactions:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [canManageUsers])

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Shop Einnahmen...</div>
  }

  if (!profile || !canManageUsers) {
    return null
  }

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions
    
    return transactions.filter(tx => {
      if (!tx.processed_at || !tx.processed_at.toDate) return false
      const date = tx.processed_at.toDate()
      const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      return monthStr === selectedMonth
    })
  }, [transactions, selectedMonth])

  const totalEarnings = filteredTransactions.reduce((sum, tx) => sum + (tx.charged_amount_eur || 0), 0)
  const stufeShare = totalEarnings * 0.9
  const devShare = totalEarnings * 0.1

  const formatCurrency = (val: number) => {
    return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
  }

  const formatDate = (ts: any) => {
    if (!ts || !ts.toDate) return 'Unbekannt'
    return ts.toDate().toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // Generate available months for the dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    transactions.forEach(tx => {
      if (tx.processed_at && tx.processed_at.toDate) {
        const date = tx.processed_at.toDate()
        months.add(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`)
      }
    })
    
    // Always include current month
    const now = new Date()
    months.add(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`)
    
    return Array.from(months).sort().reverse()
  }, [transactions])

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleString('de-DE', { month: 'long', year: 'numeric' })
  }

  // Set default to current month on load if selectedMonth is 'all' and it's the first time
  useEffect(() => {
    if (!loading && transactions.length > 0 && selectedMonth === 'all') {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
      if (availableMonths.includes(currentMonth)) {
        setSelectedMonth(currentMonth)
      }
    }
  }, [loading, transactions.length, availableMonths, selectedMonth])

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Shop Einnahmen</h1>
          <p className="text-muted-foreground font-medium">
            Detaillierte Übersicht aller Shop-Käufe und Spenden, aufgeteilt in 90% Abikasse und 10% Entwickler-Support.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-xl border border-border">
          <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-sm font-bold outline-none focus:ring-0 cursor-pointer pr-4 py-1"
          >
            <option value="all">Gesamte Zeit</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{formatMonthLabel(month)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-primary">
              <Euro className="w-4 h-4" /> Gesamteinnahmen
            </CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(totalEarnings)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">100% aller Transaktionen</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="w-4 h-4" /> Anteil Abikasse (90%)
            </CardDescription>
            <CardTitle className="text-3xl text-emerald-700 dark:text-emerald-400">
              {formatCurrency(stufeShare)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">Direkt für eure Stufenkasse</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Briefcase className="w-4 h-4" /> Anteil Entwickler (10%)
            </CardDescription>
            <CardTitle className="text-3xl text-amber-700 dark:text-amber-400">
              {formatCurrency(devShare)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">Serverkosten & Support</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Letzte Transaktionen
          </CardTitle>
          <CardDescription>
            Liste aller erfolgreichen Käufe aus dem Shop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Käufer</TableHead>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Zugeordneter Kurs</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">
                      Bisher keine Transaktionen in diesem Zeitraum vorhanden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap tabular-nums text-xs">
                        {formatDate(tx.processed_at)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{tx.donor_name || 'Anonym / Gast'}</div>
                        {tx.customer_email && (
                          <div className="text-[10px] text-muted-foreground">{tx.customer_email}</div>
                        )}
                        {tx.is_guest && <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0">Gast</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{tx.item_id}</Badge>
                      </TableCell>
                      <TableCell>
                        {tx.selected_course ? <Badge className="bg-primary/20 text-primary border-primary/30">{tx.selected_course}</Badge> : '-'}
                      </TableCell>
                      <TableCell className="text-right font-black">
                        {formatCurrency(tx.charged_amount_eur)}
                      </TableCell>
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