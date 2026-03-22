'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, updateDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Teacher } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Loader2, Sparkles, CheckCircle2, Lock } from 'lucide-react'
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

export function TeacherRarityVoting() {
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
        const querySnapshot = await getDocs(collection(db, 'teachers'))
        const allTeachers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher))
        
        // Filter out already rated teachers
        const ratedIds = new Set(profile?.rated_teachers || [])
        const unrated = allTeachers.filter(t => !ratedIds.has(t.id))
        
        setTeachers(unrated)
        if (unrated.length > 0) {
          setCurrentIndex(Math.floor(Math.random() * unrated.length))
        } else {
          setFinished(true)
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
  }, [profile, initialized, authLoading])

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
      
      // We keep the old state in case we need to rollback, but for UX we move on
      const oldTeachers = [...teachers]
      const oldIndex = currentIndex
      
      setTeachers(nextTeachers)
      setCurrentIndex(nextIndex)
      if (nextTeachers.length === 0) setFinished(true)

      // 2. Perform DB operations in background
      // Save individual rating
      await setDoc(doc(db, 'teacher_ratings', voteId), {
        userId: user.uid,
        teacherId: teacher.id,
        rating: rating,
        created_at: new Date().toISOString()
      })

      // Update user profile (rated_teachers)
      await updateDoc(doc(db, 'profiles', user.uid), {
        rated_teachers: arrayUnion(teacher.id)
      })

      // Update teacher aggregate
      const newVoteCount = (teacher.vote_count || 0) + 1
      const currentTotal = (teacher.avg_rating || 0) * (teacher.vote_count || 0)
      const newAvg = (currentTotal + rating) / newVoteCount

      await updateDoc(doc(db, 'teachers', teacher.id), {
        avg_rating: newAvg,
        vote_count: newVoteCount
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

  return (
    <Card className="border-primary/40 shadow-lg bg-gradient-to-br from-card to-primary/5 relative overflow-hidden group">
      {!user && (
        <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="bg-card p-6 rounded-xl border-2 border-primary shadow-xl max-w-sm space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-lg">Bewertung Gesperrt</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed italic">
                Um Manipulationen zu verhindern, ist eine Mitbestimmung bei den Seltenheiten nur mit verifiziertem Konto möglich.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest shadow-lg" onClick={() => router.push('/login')}>
                Jetzt Anmelden
              </Button>
              <Button variant="ghost" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5" onClick={() => router.push('/promo')}>
                Vorteile entdecken →
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black tracking-tighter uppercase text-[10px]">
            Crowdsourced Rarity
          </Badge>
          <span className="text-[10px] font-medium text-muted-foreground">
            Noch {teachers.length} übrig
          </span>
        </div>
        <CardTitle className="text-2xl font-black tracking-tight mt-2">
          Wie selten ist {currentTeacher.name}?
        </CardTitle>
        <CardDescription>
          Deine Stimme hilft dabei, die offizielle Seltenheit im Lehrer-Album festzulegen.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {RARITY_OPTIONS.map((opt) => (
            <Button
              key={opt.label}
              variant="outline"
              disabled={voting || !user}
              onClick={() => handleVote(opt.value)}
              className={cn(
                "h-auto py-4 flex flex-col gap-2 border-2 transition-all hover:scale-105 active:scale-95 group/btn",
                (voting || !user) && "opacity-50"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full", opt.color)} />
              <span className="font-bold text-[11px] uppercase tracking-wider">{opt.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

