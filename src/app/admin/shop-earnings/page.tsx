'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { Euro, TrendingUp, PiggyBank, Briefcase, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'

type ShopEarning = {
  id: string
  stripe_session_id: string
  user_id: string
  is_guest: boolean
  item_id: string
  item_label: string
  amount_total_eur: number
  amount_total_cents: number
  stripe_fee_eur: number
  stripe_fee_cents: number
  payout_net_eur: number
  payout_net_cents: number
  abi_share_eur: number
  platform_share_eur: number
  selected_course: string | null
  payer_name: string | null
  customer_email: string | null
  month_key: string
  processed_at: any
  created_by: string
}

export default function ShopEarningsPage() {
  const { profile, loading: authLoading } = useAuth()
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [entries, setEntries] = useState<ShopEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isBackfilling, setIsBackfilling] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const canManageUsers = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    months.add(currentMonthKey)
    for (const entry of entries) {
      if (typeof entry.month_key === 'string' && /^\d{4}-\d{2}$/.test(entry.month_key)) {
        months.add(entry.month_key)
      }
    }

    return Array.from(months).sort().reverse()
  }, [entries, currentMonthKey])

  const filteredEntries = useMemo(() => {
    if (selectedMonth === 'all') return entries
    return entries.filter((entry) => entry.month_key === selectedMonth)
  }, [entries, selectedMonth])

  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        acc.total += Number(entry.amount_total_eur) || 0
        acc.fee += Number(entry.stripe_fee_eur) || 0
        acc.net += Number(entry.payout_net_eur) || 0
        acc.abi += Number(entry.abi_share_eur) || 0
        acc.platform += Number(entry.platform_share_eur) || 0
        return acc
      },
      { total: 0, fee: 0, net: 0, abi: 0, platform: 0 }
    )
  }, [filteredEntries])

  useEffect(() => {
    if (!authLoading && (!profile || !canManageUsers)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [profile, authLoading, canManageUsers, router, pathname])

  useEffect(() => {
    if (!canManageUsers) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'shop_earnings'), orderBy('processed_at', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEntries(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShopEarning)))
        setPermissionError(null)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching shop earnings:', error)
        setPermissionError(error?.message || 'Unbekannter Fehler beim Laden der Shop-Einnahmen.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [canManageUsers])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
  }

  const formatDate = (ts: any) => {
    if (!ts || !ts.toDate) return 'Unbekannt'
    return ts.toDate().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMonthLabel = (monthStr: string) => {
    if (monthStr === 'all') return 'Gesamte Zeit'
    const [year, month] = monthStr.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleString('de-DE', { month: 'long', year: 'numeric' })
  }

  const handleBackfill = async () => {
    setIsBackfilling(true)
    try {
      const functions = getFunctions(undefined, 'europe-west3')
      const runBackfill = httpsCallable<undefined, { success: boolean; created: number; updated: number; skipped: number; invalid: number; total: number }>(
        functions,
        'backfillShopEarnings'
      )
      const result = await runBackfill()
      const data = result.data

      if (data?.success) {
        toast.success('Backfill abgeschlossen', {
          description: `Neu: ${data.created}, aktualisiert: ${data.updated}, ungültig: ${data.invalid}`,
        })
      } else {
        toast.error('Backfill konnte nicht abgeschlossen werden.')
      }
    } catch (error: any) {
      console.error('Backfill error:', error)
      toast.error('Backfill fehlgeschlagen', {
        description: error?.message || 'Unbekannter Fehler.',
      })
    } finally {
      setIsBackfilling(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Shop Einnahmen...</div>
  }

  if (!profile || !canManageUsers) {
    return null
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Shop Einnahmen</h1>
          <p className="text-muted-foreground font-medium">
            Eigene Shop-Einnahmen-Tabelle mit Stripe-Gebuehren (1,5% + 0,25 EUR) und 90/10-Aufteilung auf den Netto-Betrag.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-xl border border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackfill}
            disabled={isBackfilling}
            className="font-bold"
          >
            {isBackfilling ? 'Backfill läuft...' : 'Altkäufe importieren'}
          </Button>
          <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-sm font-bold outline-none focus:ring-0 cursor-pointer pr-4 py-1"
          >
            <option value="all">Gesamte Zeit</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {permissionError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-lg">Fehlende Berechtigung</CardTitle>
            <CardDescription>
              {permissionError}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-primary">
              <Euro className="w-4 h-4" /> Gesamtumsatz (Brutto)
            </CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(totals.total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">Vor Stripe-Gebuehren</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
              <Euro className="w-4 h-4" /> Stripe Gebuehren
            </CardDescription>
            <CardTitle className="text-3xl text-red-700 dark:text-red-400">{formatCurrency(totals.fee)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">Von Stripe einbehalten</p>
          </CardContent>
        </Card>

        <Card className="border-sky-500/20 bg-sky-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Euro className="w-4 h-4" /> Netto zur Verteilung
            </CardDescription>
            <CardTitle className="text-3xl text-sky-700 dark:text-sky-400">{formatCurrency(totals.net)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">Brutto minus Stripe-Gebuehren</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="w-4 h-4" /> Anteil Abikasse (90% Netto)
            </CardDescription>
            <CardTitle className="text-3xl text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totals.abi)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">Direkt fuer eure Stufenkasse</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Briefcase className="w-4 h-4" /> Anteil Plattform (10% Netto)
            </CardDescription>
            <CardTitle className="text-3xl text-amber-700 dark:text-amber-400">
              {formatCurrency(totals.platform)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-semibold">Serverkosten & Betrieb</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Einzelne Shop-Einnahmen
          </CardTitle>
          <CardDescription>
            {selectedMonth === 'all'
              ? 'Alle Shop-Transaktionen (All-Time)'
              : `Monat: ${formatMonthLabel(selectedMonth)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Zahler</TableHead>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead className="text-right">Stripe</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                  <TableHead className="text-right">90%</TableHead>
                  <TableHead className="text-right">10%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground font-medium">
                      Keine Shop-Einnahmen in diesem Zeitraum vorhanden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap tabular-nums text-xs">{formatDate(entry.processed_at)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.payer_name || 'Anonym / Gast'}</div>
                        {entry.customer_email && <div className="text-[10px] text-muted-foreground">{entry.customer_email}</div>}
                        {entry.is_guest && (
                          <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0">
                            Gast
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {entry.item_label || entry.item_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.selected_course ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30">{entry.selected_course}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-black">{formatCurrency(entry.amount_total_eur || 0)}</TableCell>
                      <TableCell className="text-right font-bold text-red-700 dark:text-red-400">
                        {formatCurrency(entry.stripe_fee_eur || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sky-700 dark:text-sky-400">
                        {formatCurrency(entry.payout_net_eur || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(entry.abi_share_eur || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(entry.platform_share_eur || 0)}
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
