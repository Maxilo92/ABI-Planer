'use client'

import { useEffect, useState } from 'react'
import { Timer, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface MaintenanceBannerProps {
  startTime: string
  onDismiss?: () => void
}

export function MaintenanceBanner({ startTime, onDismiss }: MaintenanceBannerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isCritical, setIsCritical] = useState(false)

  useEffect(() => {
    const targetDate = new Date(startTime)
    
    const updateCountdown = () => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('Wartung beginnt jetzt...')
        setIsCritical(true)
        return
      }

      // If less than 15 minutes, show critical styling
      if (diff < 15 * 60 * 1000) {
        setIsCritical(true)
      }

      setTimeLeft(formatDistanceToNow(targetDate, { locale: de, addSuffix: false }))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  return (
    <div className={cn(
      "relative w-full py-2 px-4 flex items-center justify-center gap-3 text-white transition-colors duration-500 z-[60]",
      isCritical ? "bg-destructive animate-pulse" : "bg-amber-600"
    )}>
      <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
        <Timer className="h-4 w-4" />
        <span>Geplante Wartung in: {timeLeft}</span>
      </div>
      <p className="hidden md:block text-xs opacity-90 font-medium">
        Die App wird während der Wartung vorübergehend gesperrt.
      </p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute right-2 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
