'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClassName, FinanceEntry, ShopEarning } from '@/types/database'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { BarChart3, ChevronRight, Info, Lightbulb, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ClassStats {
  className: ClassName
  amount: number
  percentage: number
}

interface ClassRankingProps {
  finances: FinanceEntry[]
  shopEarnings?: ShopEarning[]
  goal: number
  maxRows?: number
  useScrollContainer?: boolean
  infoLink?: string
  loading?: boolean
  showManualCorrection?: boolean
}

export function ClassRanking({
  finances,
  shopEarnings = [],
  goal,
  maxRows,
  useScrollContainer = true,
  infoLink = '/finanzen',
  loading: propLoading,
  showManualCorrection = true,
}: ClassRankingProps) {
  const { user, profile, loading } = useAuth()
  const [courses, setCourses] = useState<string[]>(['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7'])
  const [manualAdjustments, setManualAdjustments] = useState<Record<string, number>>({})
  const [adjustmentDrafts, setAdjustmentDrafts] = useState<Record<string, string>>({})
  const [savingAdjustments, setSavingAdjustments] = useState(false)
  const [internalLoading, setInternalLoading] = useState(true)

  const canEditLeaderboard = !!profile?.is_approved && (
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  )

  useEffect(() => {
    if (loading || !profile?.is_approved) return

    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        if (data.courses) {
          setCourses(data.courses)
        }

        const rawAdjustments = data.leaderboard_adjustments
        if (rawAdjustments && typeof rawAdjustments === 'object') {
          const parsedAdjustments: Record<string, number> = {}
          Object.entries(rawAdjustments).forEach(([course, amount]) => {
            const numericAmount = Number(amount)
            if (Number.isFinite(numericAmount)) {
              parsedAdjustments[course] = numericAmount
            }
          })
          setManualAdjustments(parsedAdjustments)
          setAdjustmentDrafts(Object.fromEntries(Object.entries(parsedAdjustments).map(([course, amount]) => [course, String(amount)])))
        } else {
          setManualAdjustments({})
          setAdjustmentDrafts({})
        }
      }
      setInternalLoading(false)
    }, (error) => {
      console.error('ClassRanking: Error listening to settings:', error)
      setInternalLoading(false)
    })
    return () => unsubscribe()
  }, [profile?.is_approved, loading])

  const contributions = [
    ...finances
      .filter((entry) => entry.responsible_class && Number(entry.amount) > 0)
      .map((entry) => ({
        className: String(entry.responsible_class),
        amount: Number(entry.amount) || 0,
      })),
    ...shopEarnings
      .filter((entry) => entry.selected_course && Number(entry.abi_share_eur) > 0)
      .map((entry) => ({
        className: String(entry.selected_course),
        amount: Number(entry.abi_share_eur) || 0,
      })),
  ]

  const getManualAdjustmentForCourse = (course: string) => Number(manualAdjustments[course]) || 0
  
  const stats: ClassStats[] = courses.map((c) => {
    const contributionAmount = contributions
      .filter((entry) => entry.className === c)
      .reduce((acc, entry) => acc + entry.amount, 0)
    const amount = contributionAmount + getManualAdjustmentForCourse(c)

    const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 1
    const classGoal = safeGoal / Math.max(courses.length, 1)
    const rawPercentage = classGoal > 0 ? (amount / classGoal) * 100 : 0
    const percentage = Number.isFinite(rawPercentage)
      ? Math.max(0, Math.min(Math.round(rawPercentage), 100))
      : 0
    
    return { className: c, amount, percentage }
  }).sort((a, b) => b.amount - a.amount)

  const displayedStats = typeof maxRows === 'number' ? stats.slice(0, maxRows) : stats

  if (propLoading || internalLoading) {
    return (
      <Card className="h-full border-border/40 shadow-subtle flex flex-col elevated-card">
        <CardHeader className="pb-3 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 min-h-[58px] hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-1 w-24 rounded-full" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-3 w-12 ml-auto" />
                <Skeleton className="h-2 w-8 ml-auto" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const winner = stats[0]
  const lastPlace = [...stats].reverse().find(s => s.amount >= 0) || stats[stats.length - 1]

  const handleAdjustmentInput = (course: string, value: string) => {
    if (/^-?\d*([.,]\d{0,2})?$/.test(value)) {
      setAdjustmentDrafts((prev) => ({ ...prev, [course]: value }))
    }
  }

  const handleSaveAdjustments = async () => {
    if (!canEditLeaderboard || !user) return

    const normalizedAdjustments: Record<string, number> = {}
    for (const course of courses) {
      const draft = (adjustmentDrafts[course] ?? '').replace(',', '.').trim()
      if (!draft) continue

      const parsed = Number(draft)
      if (Number.isFinite(parsed) && parsed !== 0) {
        normalizedAdjustments[course] = Number(parsed.toFixed(2))
      }
    }

    try {
      setSavingAdjustments(true)
      await setDoc(doc(db, 'settings', 'config'), { leaderboard_adjustments: normalizedAdjustments }, { merge: true })
      toast.success('Leaderboard-Korrekturen gespeichert.')
    } catch (error) {
      console.error('ClassRanking: Error saving leaderboard adjustments:', error)
      toast.error('Korrekturen konnten nicht gespeichert werden.')
    } finally {
      setSavingAdjustments(false)
    }
  }

  return (
    <Card className="h-full border-border/40 shadow-subtle overflow-hidden flex flex-col elevated-card">
      <CardHeader className="pb-3 border-b border-border bg-muted/10 shrink-0">
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
      
      <CardContent className="p-0 flex-1 flex flex-col min-h-0 bg-card">
        <div className={useScrollContainer ? "flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20" : "overflow-x-hidden"}>
          {displayedStats.map((s, index) => (
            <div key={s.className} className="flex items-center justify-between p-3 min-h-[58px] transition-colors hover:bg-muted/20 group">
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
        <div className="p-3 bg-muted/20 border-t border-border/40 shrink-0 space-y-2">
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
          <div className="flex items-start gap-2.5 bg-background/50 rounded-xl p-2.5 border border-border/40">
            <div className="mt-0.5 bg-primary/10 p-1 rounded-lg shrink-0">
              <Info className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.1em] leading-tight mb-0.5">Kurs-Ziel</p>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Jeder Kurs hat ein Ziel von <span className="font-bold text-foreground">{(goal / Math.max(courses.length, 1)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span> ({goal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} Gesamtziel / {courses.length} Kurse).
              </p>
            </div>
          </div>
          {showManualCorrection && canEditLeaderboard && (
            <div className="space-y-2.5 bg-background/50 rounded-xl p-2.5 border border-border/40">
              <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.1em] leading-tight">Manuelle Korrektur (Leaderboard)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayedStats.map((entry) => (
                  <label key={`adjustment-${entry.className}`} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card px-2 py-1.5">
                    <span className="text-[11px] font-semibold text-foreground">Kurs {entry.className}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-24 h-7 rounded-md border border-border bg-background px-2 text-right text-[11px] font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                      value={adjustmentDrafts[entry.className] ?? ''}
                      onChange={(event) => handleAdjustmentInput(entry.className, event.target.value)}
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
              <Button
                type="button"
                className="w-full h-8 text-[10px] font-black uppercase tracking-[0.14em]"
                disabled={savingAdjustments}
                onClick={handleSaveAdjustments}
              >
                {savingAdjustments ? 'Speichert...' : 'Korrekturen speichern'}
              </Button>
            </div>
          )}
          <Link 
            href={infoLink} 
            className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/5 rounded-lg transition-colors border border-primary/10"
          >
            Mehr Infos <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
