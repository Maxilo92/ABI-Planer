'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClassName, FinanceEntry } from '@/types/database'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Lightbulb, Loader2 } from 'lucide-react'

interface ClassStats {
  className: ClassName
  amount: number
  percentage: number
}

interface ClassRankingProps {
  finances: FinanceEntry[]
  goal: number
}

export function ClassRanking({ finances, goal }: ClassRankingProps) {
  const [courses, setCourses] = useState<string[]>(['12A', '12B', '12C', '12D'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists() && doc.data().courses) {
        setCourses(doc.data().courses)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])
  
  const stats: ClassStats[] = courses.map(c => {
    const amount = finances
      .filter(f => f.responsible_class === c && Number(f.amount) > 0)
      .reduce((acc, f) => acc + Number(f.amount), 0)
    
    const classGoal = (goal || 1) / (courses.length || 1)
    const percentage = Math.min(Math.round((amount / classGoal) * 100), 100)
    
    return { className: c, amount, percentage }
  }).sort((a, b) => b.amount - a.amount)

  if (loading) {
    return (
      <Card className="h-full border-border/40 shadow-subtle flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
      </Card>
    )
  }

  const winner = stats[0]
  const lastPlace = [...stats].reverse().find(s => s.amount >= 0) || stats[stats.length - 1]

  return (
    <Card className="h-full border-border/40 shadow-subtle overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Kurs-Ranking
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-none">
            Top: {winner.className}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          {stats.map((s, index) => (
            <div key={s.className} className="flex items-center justify-between p-3 transition-colors hover:bg-muted/30 group">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' : 
                  index === 1 ? 'bg-slate-400/20 text-slate-500' :
                  index === 2 ? 'bg-orange-400/20 text-orange-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-tight leading-none">Kurs {s.className}</p>
                  <div className="w-24 h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-primary' : 'bg-primary/40'
                      }`} 
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold tabular-nums leading-none">
                  {s.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter mt-1">
                  {s.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tip section - sticky at bottom */}
        <div className="p-3 bg-muted/20 border-t border-border/40 shrink-0">
          <div className="flex items-start gap-2.5 bg-background/50 rounded-xl p-2.5 border border-border/40">
            <div className="mt-0.5 bg-primary/10 p-1 rounded-lg shrink-0">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.1em] leading-tight mb-0.5">Ranking-Tipp</p>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Kurs <span className="font-bold text-foreground">{lastPlace.className}</span> ist aktuell das Schlusslicht.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
