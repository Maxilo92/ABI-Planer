'use client'

import { useAuth } from '@/context/AuthContext'
import { ArrowLeftRight, History, Plus, AlertCircle, Clock, CheckCircle2, XCircle, ChevronRight, User, Info, ArrowLeft } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCardTrade } from '@/hooks/useCardTrade'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { CardTrade } from '@/types/trades'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { TradeNegotiationModal } from '@/components/cards/TradeNegotiationModal'
import { useRouter } from 'next/navigation'
import { useCountdown } from '@/hooks/useCountdown'
import { getTradeStatusMeta } from '@/modules/shared/status'

function TradeCountdown({ targetDate }: { targetDate: any }) {
  const dateStr = targetDate?.toDate ? targetDate.toDate().toISOString() : (targetDate instanceof Date ? targetDate.toISOString() : targetDate)
  const { days, hours, minutes, seconds } = useCountdown(dateStr)
  
  const isExpired = days === 0 && hours === 0 && minutes === 0 && seconds === 0
  
  if (isExpired) return <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Abgelaufen</span>

  return (
    <span className={cn(
      "font-mono font-bold tracking-tight text-[10px] tabular-nums",
      days === 0 && hours < 6 ? "text-red-500 animate-pulse" : "text-blue-500"
    )}>
      {days > 0 && `${days}d `}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </span>
  )
}

export default function TradeCenterPage() {
  const { profile } = useAuth()
  const { activeTrades, pastTrades, loading, currentUserId, isTradingEnabled } = useCardTrade()
  const { teachers, loading: teachersLoading } = useUserTeachers()
  const [selectedTrade, setSelectedTrade] = useState<CardTrade | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isTradingEnabled === false) {
      router.replace('/sammelkarten')
    }
  }, [isTradingEnabled, router])

  const totalCards = useMemo(() => {
    if (teachers) {
      return Object.values(teachers).reduce((sum, entry) => sum + (entry?.count || 0), 0)
    }

    return profile?.booster_stats?.total_cards || 0
  }, [teachers, profile?.booster_stats?.total_cards])

  const canTrade = totalCards >= 100
  const showLockedBanner = !teachersLoading && !canTrade

  const getStatusBadge = (status: string) => {
    const meta = getTradeStatusMeta(status)
    return <Badge variant={meta.variant} className={meta.className}>{meta.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Lade Trading-Hub...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
            <ArrowLeftRight className="w-8 h-8 text-blue-500" />
            Trading-Hub
          </h1>
          <p className="text-muted-foreground">Tausche Karten mit deinen Freunden.</p>
        </div>
        <Button 
          onClick={() => router.push('/sammelkarten/tausch/neu')} 
          disabled={!canTrade || teachersLoading}
          className="font-bold uppercase tracking-tight"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neuer Tausch
        </Button>
      </div>

      {showLockedBanner && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6 flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900 uppercase text-sm tracking-tight">Tauschen noch gesperrt</p>
              <p className="text-amber-800 text-sm">
                Du benötigst mindestens 100 Karten in deiner Sammlung, um am Trading teilzunehmen. 
                Du hast aktuell <strong>{totalCards}</strong> Karten. Sammle mehr Booster, um diese Funktion freizuschalten!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!teachersLoading && !canTrade && totalCards === 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6 flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900 uppercase text-sm tracking-tight">Kartenstand nicht synchron</p>
              <p className="text-amber-800 text-sm">
                Die Handelsprüfung liest jetzt direkt dein Inventar. Wenn hier trotzdem 0 steht, ist dein Kartenbestand noch nicht geladen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
          <TabsTrigger value="active" className="font-bold uppercase tracking-tight">Aktiv ({activeTrades.length})</TabsTrigger>
          <TabsTrigger value="past" className="font-bold uppercase tracking-tight">Verlauf ({pastTrades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTrades.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xl opacity-60">Keine aktiven Tausche</p>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Starte einen Tausch mit einem Freund oder warte auf Anfragen.
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/sammelkarten/tausch/neu')} disabled={!canTrade || teachersLoading}>
                Jetzt Tausch starten
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeTrades.map((trade) => {
                const isExpired = trade.expiresAt?.toDate 
                  ? trade.expiresAt.toDate().getTime() < Date.now() 
                  : (trade.expiresAt instanceof Date ? trade.expiresAt.getTime() < Date.now() : false)

                return (
                  <Card 
                    key={trade.id} 
                    className={cn(
                      "transition-colors border-2",
                      !isExpired && "cursor-pointer hover:border-blue-300",
                      !isExpired && trade.lastActorId !== currentUserId ? "border-blue-500 bg-blue-50/30" : "",
                      isExpired && "opacity-60 grayscale-[0.5] border-muted bg-muted/10 cursor-not-allowed"
                    )}
                    onClick={() => !isExpired && setSelectedTrade(trade)}
                  >
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-black uppercase text-sm tracking-tight leading-none">
                            {trade.senderId === currentUserId ? trade.receiverName : trade.senderName}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                            Zuletzt aktiv: {trade.updatedAt ? format(trade.updatedAt.toDate ? trade.updatedAt.toDate() : trade.updatedAt, 'HH:mm, dd. MMM', { locale: de }) : 'Unbekannt'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <TradeCountdown targetDate={trade.expiresAt} />
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(trade.status)}
                    </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-xl border">
                      <div className="flex-1 text-center">
                        <p className="text-[10px] uppercase font-black opacity-40 mb-1">Du gibst</p>
                        <p className="font-bold text-xs truncate">
                          {trade.senderId === currentUserId ? trade.offeredCard.name || trade.offeredCard.teacherId : trade.requestedCard.name || trade.requestedCard.teacherId}
                        </p>
                        <p className="text-[8px] uppercase font-bold opacity-60">
                          {trade.senderId === currentUserId ? trade.offeredCard.rarity : trade.requestedCard.rarity} • {trade.senderId === currentUserId ? trade.offeredCard.variant : trade.requestedCard.variant}
                        </p>
                      </div>
                      <ArrowLeftRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-center">
                        <p className="text-[10px] uppercase font-black opacity-40 mb-1">Du erhältst</p>
                        <p className="font-bold text-xs truncate">
                          {trade.senderId === currentUserId ? trade.requestedCard.name || trade.requestedCard.teacherId : trade.offeredCard.name || trade.offeredCard.teacherId}
                        </p>
                        <p className="text-[8px] uppercase font-bold opacity-60">
                          {trade.senderId === currentUserId ? trade.requestedCard.rarity : trade.offeredCard.rarity} • {trade.senderId === currentUserId ? trade.requestedCard.variant : trade.offeredCard.variant}
                        </p>
                      </div>
                    </div>
                    {trade.lastActorId !== currentUserId && (
                      <div className="mt-3 flex items-center gap-2 text-blue-600 bg-blue-100/50 p-2 rounded-lg border border-blue-200">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-[11px] font-bold uppercase tracking-tight">Du bist am Zug!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastTrades.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed opacity-50">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-bold">Noch keine abgeschlossenen Tausche</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {pastTrades.map((trade) => (
                <div 
                  key={trade.id} 
                  className="flex items-center justify-between p-3 bg-card border rounded-xl opacity-80 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs uppercase truncate leading-none">
                        {trade.senderId === currentUserId ? trade.receiverName : trade.senderName}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {trade.updatedAt ? format(trade.updatedAt.toDate ? trade.updatedAt.toDate() : trade.updatedAt, 'P', { locale: de }) : 'Unbekannt'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-[10px] font-black uppercase opacity-40">
                      {trade.status === 'completed' ? 'Erfolgreich' : 'Beendet'}
                    </p>
                    {getStatusBadge(trade.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Regeln */}
      <Card className="border-2 shadow-none bg-slate-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Trading-Regeln
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p><strong>100 Karten:</strong> Du benötigst mindestens 100 Karten, um teilzunehmen.</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p><strong>Strict Match:</strong> Nur Karten mit gleicher Seltenheit und Folie können getauscht werden.</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p><strong>Limit:</strong> Du kannst maximal 3 erfolgreiche Tausche pro Tag durchführen.</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p><strong>High-Value Schutz:</strong> Iconic und Secret Rare Karten sind vom Tausch ausgeschlossen.</p>
          </div>
          <div className="flex gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p><strong>Verhandlung:</strong> Ein Tausch wird nach max. 3 Schritten (Gegenangeboten) automatisch beendet, wenn keine Einigung erzielt wurde.</p>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 sm:hidden">
         <Link href="/sammelkarten">
            <Button size="lg" className="rounded-full shadow-2xl font-black uppercase tracking-tighter h-14 px-8 bg-black hover:bg-zinc-900 border-2 border-white/20">
               <ArrowLeft className="w-5 h-5 mr-2" />
               Zurück zum Album
            </Button>
         </Link>
      </div>

      <AnimatePresence>
        {selectedTrade && (
          <TradeNegotiationModal 
            trade={selectedTrade} 
            onClose={() => setSelectedTrade(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
