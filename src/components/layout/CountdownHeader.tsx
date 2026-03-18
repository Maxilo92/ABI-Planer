'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useCountdown } from '@/hooks/useCountdown'
import { Clock } from 'lucide-react'

export function CountdownHeader() {
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { days, hours, minutes, seconds } = useCountdown(targetDate || '')

  useEffect(() => {
    setMounted(true)
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setTargetDate(doc.data().ball_date)
      } else {
        setTargetDate('2027-06-19T18:00:00Z')
      }
    })
    return () => unsubscribe()
  }, [])

  if (!mounted || !targetDate) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border/50 transition-all hover:bg-secondary">
      <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
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
    </div>
  )
}
