'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, TrendingUp } from 'lucide-react'
import { ClassName } from '@/types/database'

interface ClassStats {
  className: ClassName
  amount: number
  percentage: number
}

interface ClassLeaderboardProps {
  finances: any[]
  goal: number
}

export function ClassLeaderboard({ finances, goal }: ClassLeaderboardProps) {
  const classes: ClassName[] = ['12A', '12B', '12C', '12D']
  
  const stats: ClassStats[] = classes.map(c => {
    const amount = finances
      .filter(f => f.responsible_class === c)
      .reduce((acc, f) => acc + Number(f.amount), 0)
    
    // Calculate percentage relative to a quarter of the total goal
    const classGoal = goal / 4
    const percentage = Math.min(Math.round((amount / classGoal) * 100), 100)
    
    return { className: c, amount, percentage }
  }).sort((a, b) => b.amount - a.amount)

  const totalRaisedByClasses = stats.reduce((acc, s) => acc + s.amount, 0)
  const winner = stats[0]
  const nextUp = [...stats].sort((a, b) => a.amount - b.amount)[0]

  return (
    <Card className="h-full border-primary/20 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Klassen-Wettstreit
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">Top: Klasse {winner.className}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {stats.map((s) => (
              <div key={s.className} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>Klasse {s.className}</span>
                  <span>{s.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} ({s.percentage}%)</span>
                </div>
                <Progress value={s.percentage} className="h-2" />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t bg-primary/5 rounded-b-lg -mx-6 -mb-6 p-4 mt-2">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Strategie-Tipp</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Klasse <span className="font-bold text-foreground">{nextUp.className}</span> ist aktuell das Schlusslicht. Zeit für einen Kuchenverkauf oder eine Pfandsammelaktion!
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`px-2 py-0.5 rounded-full font-medium ${variant === 'outline' ? 'border text-muted-foreground' : 'bg-primary text-primary-foreground'} ${className}`}>
      {children}
    </span>
  )
}
