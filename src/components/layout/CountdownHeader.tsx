'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useCountdown } from '@/hooks/useCountdown'
import { useAuth } from '@/context/AuthContext'
import { Clock, Calendar, Info, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CountdownHeader({ collapsed = false }: { collapsed?: boolean }) {
  const { profile, loading } = useAuth()
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { days, hours, minutes, seconds } = useCountdown(targetDate || '')

  useEffect(() => {
    setMounted(true)
    
    if (loading || !profile?.is_approved) return

    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setTargetDate(doc.data().ball_date)
      } else {
        setTargetDate('2027-06-19T18:00:00Z')
      }
    }, (error) => {
      console.error('Error fetching countdown settings:', error)
      setTargetDate('2027-06-19T18:00:00Z')
    })
    return () => unsubscribe()
  }, [loading, profile?.is_approved])

  if (!mounted || !targetDate) return null

  const targetDateObj = new Date(targetDate)
  const diffMs = targetDateObj.getTime() - new Date().getTime()
  const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
  const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)))
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className={cn(
            "flex items-center bg-secondary/50 rounded-full border border-border/50 transition-all hover:bg-secondary hover:border-primary/30 group outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            collapsed ? "p-2.5" : "gap-2 px-3 py-1.5"
          )}>
            <Clock className={cn("text-primary animate-pulse group-hover:scale-110 transition-transform", collapsed ? "h-4 w-4" : "h-3.5 w-3.5")} />
            {!collapsed && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-tight tabular-nums">
                <div className="flex flex-col items-center leading-none">
                  <span>{days}</span>
                  <span className="text-[7px] uppercase text-muted-foreground font-medium">d</span>
                </div>
                <span className="text-muted-foreground/50">:</span>
                <div className="flex flex-col items-center leading-none">
                  <span>{hours}</span>
                  <span className="text-[7px] uppercase text-muted-foreground font-medium">h</span>
                </div>
                <span className="text-muted-foreground/50">:</span>
                <div className="flex flex-col items-center leading-none">
                  <span>{minutes}</span>
                  <span className="text-[7px] uppercase text-muted-foreground font-medium">m</span>
                </div>
                <span className="text-muted-foreground/50">:</span>
                <div className="flex flex-col items-center leading-none">
                  <span className="text-primary">{seconds}</span>
                  <span className="text-[7px] uppercase text-primary/70 font-medium">s</span>
                </div>
              </div>
            )}
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Abiball Zeitplan
          </DialogTitle>
          <DialogDescription>
            Der große Tag findet am {targetDateObj.toLocaleDateString('de-DE', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} statt.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col p-3 rounded-lg bg-secondary/30 border border-border/50">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Timer className="h-3 w-3" /> Gesamtstunden
            </span>
            <span className="text-2xl font-black font-mono tracking-tighter">
              {totalHours.toLocaleString('de-DE')}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-lg bg-secondary/30 border border-border/50">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Timer className="h-3 w-3" /> Gesamtminuten
            </span>
            <span className="text-2xl font-black font-mono tracking-tighter">
              {totalMinutes.toLocaleString('de-DE')}
            </span>
          </div>
          <div className="col-span-2 flex flex-col p-3 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-xs text-primary/70 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Gesamtsekunden
            </span>
            <span className="text-3xl font-black font-mono tracking-tighter text-primary">
              {totalSeconds.toLocaleString('de-DE')}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-md bg-blue-500/5 border border-blue-500/10 text-[11px] text-muted-foreground italic leading-snug">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          Nutze die verbleibende Zeit weise! Jede Sekunde bringt dich näher an den Abschluss. Viel Erfolg bei den Vorbereitungen!
        </div>
      </DialogContent>
    </Dialog>
  )
}
