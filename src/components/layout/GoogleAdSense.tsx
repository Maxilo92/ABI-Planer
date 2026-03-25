'use client'

import { useAuth } from '@/context/AuthContext'

export function GoogleAdSense() {
  const { user } = useAuth()

  // Only hide ads if user is definitively logged in
  if (user) {
    return null
  }

  return (
    <div className="my-8 flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
        Anzeige
      </span>
      <div className="w-full max-w-7xl mx-auto min-h-[100px] flex items-center justify-center bg-muted/30 rounded-xl border border-dashed border-border/50">
        <span className="text-xs text-muted-foreground italic">Google AdSense</span>
      </div>
    </div>
  )
}
