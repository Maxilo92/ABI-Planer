'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, arrayUnion, setDoc, getDoc, runTransaction, increment } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Teacher, LootTeacher, Profile } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Loader2, Sparkles, CheckCircle2, Lock, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { logAction } from '@/lib/logging'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

const RARITY_OPTIONS = [
  { label: 'Gewöhnlich', value: 0.0, color: 'bg-slate-500' },
  { label: 'Selten', value: 0.25, color: 'bg-emerald-500' },
  { label: 'Episch', value: 0.5, color: 'bg-purple-500' },
  { label: 'Mythisch', value: 0.75, color: 'bg-red-500' },
  { label: 'Legendär', value: 1.0, color: 'bg-amber-500' },
]

export function TeacherRarityVoting({ onStatusChange }: { onStatusChange?: (finished: boolean) => void }) {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const fetchTeachers = async () => {
      if (initialized) return
      try {
        // Fetch candidates from global settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'))
        const lootTeachers = (settingsDoc.data()?.loot_teachers || []) as LootTeacher[]
        
        if (lootTeachers.length === 0) {
          setLoading(false)
          setInitialized(true)
          return
        }

        // Fetch current aggregates from teachers collection
        const querySnapshot = await getDocs(collection(db, 'teachers'))
        const teacherAggregates = new Map(
          querySnapshot.docs.map(doc => [doc.id, doc.data() as Partial<Teacher>])
        )
        
        // Filter out already rated teachers
        const ratedIds = new Set(profile?.rated_teachers || [])
        
        const unrated = lootTeachers
          .filter(lt => !ratedIds.has(lt.id))
          .map(lt => {
            const aggregate = teacherAggregates.get(lt.id) || {}
            return {
              id: lt.id,
              name: lt.name,
              avg_rating: aggregate.avg_rating || 0,
              vote_count: aggregate.vote_count || 0,
            } as Teacher
          })
        
        setTeachers(unrated)
        if (unrated.length > 0) {
          setCurrentIndex(Math.floor(Math.random() * unrated.length))
          if (onStatusChange) onStatusChange(false)
        } else {
          setFinished(true)
          if (onStatusChange) onStatusChange(true)
        }
        setInitialized(true)
      } catch (error) {
        console.error('Error fetching teachers for voting:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && !initialized) {
      fetchTeachers()
    }
  }, [profile, initialized, authLoading, onStatusChange])

  const handleVote = async (rating: number) => {
    if (!user) {
      toast.error('Du musst angemeldet sein, um abzustimmen.')
      router.push('/promo')
      return
    }
    
    if (currentIndex === -1 || voting) return
    
    setVoting(true)
    const teacher = teachers[currentIndex]
    const voteId = `${user.uid}_${teacher.id}`
    
    try {
      // 1. Update local UI state immediately to prevent "jumping"
      const nextTeachers = teachers.filter((_, i) => i !== currentIndex)
      const nextIndex = nextTeachers.length > 0 ? Math.floor(Math.random() * nextTeachers.length) : -1
      
      setTeachers(nextTeachers)
      setCurrentIndex(nextIndex)
      if (nextTeachers.length === 0) {
        setFinished(true)
        if (onStatusChange) onStatusChange(true)
      }

      // 2. Perform DB operations in background via atomic transaction
      await runTransaction(db, async (transaction) => {
        // A. Read current teacher aggregate
        const teacherRef = doc(db, 'teachers', teacher.id)
        const profileRef = doc(db, 'profiles', user.uid)
        
        const [teacherSnap, profileSnap] = await Promise.all([
          transaction.get(teacherRef),
          transaction.get(profileRef)
        ])

        const currentVoteCount = teacherSnap.exists() ? (teacherSnap.data().vote_count || 0) : 0
        const currentAvg = teacherSnap.exists() ? (teacherSnap.data().avg_rating || 0) : 0
        const currentTotal = currentAvg * currentVoteCount
        const newVoteCount = currentVoteCount + 1
        const newAvg = (currentTotal + rating) / newVoteCount

        // B. Reward Logic
        const ratedTeachers = (profileSnap.data()?.rated_teachers || []) as string[]
        const newRatedCount = ratedTeachers.length + 1
        let awardPack = false

        // First vote ever
        if (newRatedCount === 1) awardPack = true
        // 5th vote
        else if (newRatedCount === 5) awardPack = true
        // Every 10 votes after 5 (15, 25, 35...)
        else if (newRatedCount > 5 && (newRatedCount - 5) % 10 === 0) awardPack = true

        if (awardPack) {
          transaction.update(profileRef, {
            'booster_stats.extra_available': increment(1)
          })
        }

        // C. Save individual rating
        const ratingRef = doc(db, 'teacher_ratings', voteId)
        transaction.set(ratingRef, {
          userId: user.uid,
          teacherId: teacher.id,
          rating: rating,
          created_at: new Date().toISOString()
        })

        // D. Update user profile (rated_teachers)
        transaction.update(profileRef, {
          rated_teachers: arrayUnion(teacher.id)
        })

        // E. Update teacher aggregate
        transaction.set(teacherRef, {
          name: teacher.name,
          avg_rating: newAvg,
          vote_count: newVoteCount,
        }, { merge: true })

        return { awardPack }
      }).then((result) => {
        if (result?.awardPack) {
          toast.success('Du hast 1 Booster-Pack als Belohnung erhalten!', {
            icon: <Gift className="h-4 w-4 text-primary" />
          })
        }
      })

      if (user) {
        await logAction('TEACHER_VOTE', user.uid, profile?.full_name, { 
          teacher_id: teacher.id, 
          teacher_name: teacher.name,
          rating: rating 
        })
      }

      toast.success(`${teacher.name} bewertet!`)
    } catch (error) {
      console.error('Error submitting teacher vote:', error)
      toast.error('Bewertung fehlgeschlagen.')
      // No rollback for now to keep it simple, but we could restore oldTeachers/oldIndex here
    } finally {
      setVoting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5 animate-pulse">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (finished) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Alle Lehrer bewertet!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Wahnsinn! Du hast alle verfügbaren Lehrer bewertet. Vielen Dank für deine Hilfe beim Festlegen der Seltenheiten!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentTeacher = teachers[currentIndex]

  if (!currentTeacher && !finished) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground italic">
            Bewertungs-Daten momentan nicht verfügbar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/40 shadow-lg bg-gradient-to-br from-card to-primary/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      
      <div className="flex flex-col lg:flex-row">
        {/* Left Side: Question & Info */}
        <div className="lg:w-1/2 p-6 lg:border-r border-border/50 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black tracking-tighter uppercase text-[10px]">
              Crowdsourced Rarity
            </Badge>
            <span className="text-[10px] font-medium text-muted-foreground lg:bg-muted/50 lg:px-2 lg:py-0.5 lg:rounded">
              Noch {teachers.length} übrig
            </span>
          </div>
          <CardTitle className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
            Wie selten ist <span className="text-primary">{currentTeacher.name}</span>?
          </CardTitle>
          <CardDescription className="mt-3 lg:mt-4 lg:text-sm lg:leading-relaxed">
            Deine Stimme hilft dabei, die offizielle Seltenheit im Lehrer-Album festzulegen. Wähle die Kategorie, die am besten passt!
          </CardDescription>
        </div>

        {/* Right Side: Voting or Lock */}
        <div className="lg:w-1/2 p-6 bg-muted/5 lg:bg-transparent flex flex-col justify-center min-h-[220px]">
          {!user ? (
            <div className="relative mt-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
              <div className="bg-muted/30 p-6 lg:p-8 rounded-xl border border-border flex flex-col items-center text-center relative shadow-sm">
                {/* Floating Lock Icon on Border */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background p-2 rounded-full shadow-sm border border-border">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <p className="text-xs font-black uppercase tracking-widest mb-1 mt-1">Bewertung Gesperrt</p>
                <p className="text-[9px] lg:text-[10px] text-muted-foreground mb-4 leading-relaxed italic max-w-[280px]">
                  Um Manipulationen zu verhindern, ist eine Mitbestimmung bei den Seltenheiten nur mit verifiziertem Konto möglich.
                </p>
                
                <div className="flex flex-col w-full max-w-[240px] gap-2">
                  <Button 
                    size="sm" 
                    className="h-9 lg:h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20" 
                    onClick={() => router.push('/login')}
                  >
                    Jetzt Anmelden
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 lg:h-10 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-primary/5" 
                    onClick={() => router.push('/promo')}
                  >
                    Vorteile entdecken
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-5 lg:grid-cols-1 gap-2">
              {RARITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.label}
                  variant="outline"
                  disabled={voting}
                  onClick={() => handleVote(opt.value)}
                  className={cn(
                    "h-auto py-4 lg:py-3 flex flex-col lg:flex-row items-center lg:justify-start gap-2 lg:gap-4 border-2 transition-all hover:scale-[1.02] active:scale-95 group/btn",
                    voting && "opacity-50"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full shrink-0", opt.color)} />
                  <span className="font-bold text-[11px] lg:text-[12px] uppercase tracking-wider">{opt.label}</span>
                  {/* Subtle Indicator for PC row */}
                  <div className="hidden lg:block ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity">
                     <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}


