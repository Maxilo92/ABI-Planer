'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore'
import { Badge } from '@/components/ui/badge'
import { History, Loader2, User, Trophy, ShieldCheck, Zap } from 'lucide-react'
import { toDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DiscountHistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

interface HistoryEntry {
  id: string
  timestamp: any
  user_name: string 
  action: string
  details: {
    old_value?: number
    new_value?: number
    reason?: string
    task_title?: string
    ticket_reduction?: number
    reward_boosters?: number
    target_user_id?: string
  }
}

export function DiscountHistoryDialog({
  isOpen,
  onOpenChange,
  userId,
  userName,
}: DiscountHistoryDialogProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      void fetchHistory()
    }
  }, [isOpen, userId])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      // We perform two separate queries to avoid complex composite index requirements
      // 1. Actions performed BY the user (Claims)
      const qUser = query(
        collection(db, 'logs'),
        where('action', '==', 'TASK_REWARD_CLAIMED'),
        where('user_id', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      )

      // 2. Actions performed ON the user by admins (Adjustments, Approvals)
      const qAdmin = query(
        collection(db, 'logs'),
        where('action', 'in', ['TICKET_DISCOUNT_ADJUSTED', 'TASK_APPROVED']),
        where('details.target_user_id', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      )
      
      const [snapUser, snapAdmin] = await Promise.all([
        getDocs(qUser),
        getDocs(qAdmin)
      ])

      const entriesUser = snapUser.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
      const entriesAdmin = snapAdmin.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))

      const merged = [...entriesUser, ...entriesAdmin].sort((a, b) => {
        const timeA = toDate(a.timestamp).getTime()
        const timeB = toDate(b.timestamp).getTime()
        return timeB - timeA
      })

      setHistory(merged)
    } catch (error) {
      console.error('Error fetching discount history:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderEntry = (entry: HistoryEntry) => {
    const isManual = entry.action === 'TICKET_DISCOUNT_ADJUSTED'
    const isClaim = entry.action === 'TASK_REWARD_CLAIMED'
    const isApproval = entry.action === 'TASK_APPROVED'

    return (
      <div key={entry.id} className="p-3 rounded-xl border bg-card/50 space-y-2 relative overflow-hidden group hover:border-primary/30 transition-colors">
        {/* Type indicator side bar */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          isManual ? "bg-brand" : isClaim ? "bg-success" : "bg-primary"
        )} />

        <div className="flex justify-between items-start gap-2 pl-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {isManual ? <History className="h-2.5 w-2.5" /> : isClaim ? <Trophy className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
            <span>{isManual ? 'Manueller Rabatt' : isClaim ? 'Prämie abgeholt' : 'Aufgabe genehmigt'}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {toDate(entry.timestamp).toLocaleString('de-DE')}
          </span>
        </div>
        
        <div className="pl-2 space-y-1">
          {isManual && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">Anpassung durch Admin</span>
                <Badge variant="outline" className="text-[10px] font-black border-brand/30 text-brand">
                  {entry.details.old_value !== undefined && (
                    <span className="line-through mr-1 opacity-50">{entry.details.old_value}€</span>
                  )}
                  {entry.details.new_value}€
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <User className="h-2.5 w-2.5" />
                <span>Verantwortlich: {entry.user_name}</span>
              </div>
            </div>
          )}

          {isClaim && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold truncate flex-1">{entry.details.task_title || 'Aufgabe'}</span>
                <div className="flex gap-1 shrink-0">
                  {entry.details.ticket_reduction ? (
                    <Badge variant="success" className="text-[10px] font-black px-1.5">
                      -{entry.details.ticket_reduction}€
                    </Badge>
                  ) : null}
                  {entry.details.reward_boosters ? (
                    <Badge variant="secondary" className="text-[10px] font-black px-1.5 gap-1">
                      <Zap className="h-2 w-2 fill-current" />
                      {entry.details.reward_boosters}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Prämie wurde vom Nutzer aktiviert.</p>
            </div>
          )}

          {isApproval && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">Aufgabe genehmigt</span>
                <span className="text-[10px] text-muted-foreground truncate flex-1">&quot;{entry.details.task_title}&quot;</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <User className="h-2.5 w-2.5" />
                <span>Geprüft von: {entry.user_name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black italic">
            <History className="h-6 w-6 text-primary" />
            RABATT-HISTORIE
          </DialogTitle>
          <DialogDescription>
            Chronologischer Verlauf der Ticket-Rabatte für <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[450px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest">Wird geladen...</p>
            </div>
          ) : history.length > 0 ? (
            history.map(renderEntry)
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                <History className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">Keine Einträge gefunden</p>
                <p className="text-[10px] text-muted-foreground italic max-w-[240px] mx-auto">
                  Es wurden noch keine Aufgaben abgeschlossen oder manuelle Rabatte vergeben.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
