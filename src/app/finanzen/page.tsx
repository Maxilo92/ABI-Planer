'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { FundingStatus } from '@/components/dashboard/FundingStatus'
import { AddFinanceDialog } from '@/components/modals/AddFinanceDialog'
import { FinanceEntry, Settings } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { toDate } from '@/lib/utils'

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

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_main' || profile?.role === 'admin_co') && profile?.is_approved
  const currentFunding = finances.reduce((acc, curr) => acc + Number(curr.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanzen</h1>
          <p className="text-muted-foreground">Budgetplanung und Einnahmen-Übersicht.</p>
        </div>
        {isPlanner && <AddFinanceDialog />}
      </div>

      <FundingStatus current={currentFunding} goal={settings?.funding_goal || 10000} />

      <Card>
        <CardHeader>
          <CardTitle>Einnahmenverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground italic">
                    Noch keine Einnahmen erfasst.
                  </TableCell>
                </TableRow>
              ) : (
                finances.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(toDate(entry.entry_date), 'dd.MM.yyyy', { locale: de })}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      + {Number(entry.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
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
