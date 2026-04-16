'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, limit } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, ArrowLeftRight, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { CardTrade } from '@/types/trades'
import { getTradeStatusMeta } from '@/modules/shared/status'
import { usePopupManager } from '@/modules/popup/usePopupManager'

export default function AdminTradesPage() {
  const { profile, loading: authLoading } = useAuth()
  const [trades, setTrades] = useState<CardTrade[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { confirm } = usePopupManager()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/unauthorized')
    }
  }, [authLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return

    const q = query(collection(db, 'card_trades'), orderBy('updatedAt', 'desc'), limit(100))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardTrade)))
      setLoading(false)
    }, (error) => {
      console.error('AdminTradesPage: Error loading trades:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isAdmin])

  const handleDeleteTrade = async (tradeId: string) => {
    const confirmed = await confirm({
      title: 'Trade unwiderruflich löschen?',
      content: 'Möchtest du diesen Tausch wirklich unwiderruflich löschen? Eventuelle reservierte Karten werden dadurch NICHT automatisch zurückgegeben (nur der Trade-Eintrag verschwindet).',
      priority: 'high',
      confirmLabel: 'Trade löschen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return
    
    try {
      await deleteDoc(doc(db, 'card_trades', tradeId))
    } catch (error) {
      console.error('Error deleting trade:', error)
      alert('Fehler beim Löschen des Trades.')
    }
  }

  const getStatusBadge = (status: string) => {
    const meta = getTradeStatusMeta(status)
    return <Badge variant={meta.variant} className={meta.className}>{meta.label}</Badge>
  }

  if (loading) return <div className="p-8 text-center">Lade Trades...</div>

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" />
            Trade Moderation
          </h1>
          <p className="text-muted-foreground">Übersicht aller Tauschvorgänge im System.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktive & Vergangene Trades</CardTitle>
          <CardDescription>Die neuesten 100 Tauschvorgänge sortiert nach Aktualisierung.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Empfänger</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runden</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 opacity-50 italic">Keine Trades gefunden.</TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="text-xs">
                      {trade.updatedAt ? format(trade.updatedAt.toDate ? trade.updatedAt.toDate() : trade.updatedAt, 'dd.MM. HH:mm', { locale: de }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs uppercase truncate max-w-[120px]">{trade.senderName}</span>
                        <span className="text-[10px] opacity-50 font-mono">{trade.senderId.substring(0, 6)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs uppercase truncate max-w-[120px]">{trade.receiverName}</span>
                        <span className="text-[10px] opacity-50 font-mono">{trade.receiverId.substring(0, 6)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase whitespace-nowrap">
                        <span className="text-blue-600">{trade.offeredCard.name}</span>
                        <ArrowLeftRight className="w-3 h-3 opacity-30" />
                        <span className="text-purple-600">{trade.requestedCard.name}</span>
                      </div>
                      <div className="text-[8px] opacity-50 uppercase tracking-tighter">
                        {trade.offeredCard.rarity} • {trade.offeredCard.variant}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(trade.status)}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{trade.roundCount + 1}/3</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTrade(trade.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
