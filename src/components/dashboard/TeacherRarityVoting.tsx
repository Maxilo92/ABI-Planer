'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, updateDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Teacher } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const RARITY_OPTIONS = [
  { label: 'Gewöhnlich', value: 0.0, color: 'bg-slate-500' },
  { label: 'Selten', value: 0.25, color: 'bg-emerald-500' },
  { label: 'Episch', value: 0.5, color: 'bg-purple-500' },
  { label: 'Mythisch', value: 0.75, color: 'bg-red-500' },
  { label: 'Legendär', value: 1.0, color: 'bg-amber-500' },
]

export function TeacherRarityVoting() {
  const { user, profile } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const fetchTeachers = async () => {
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
      } catch (error) {
        console.error('Error fetching teachers for voting:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile) {
      fetchTeachers()
    }
  }, [profile])

  const handleVote = async (rating: number) => {
    if (!user || currentIndex === -1) return
    
    setVoting(true)
    const teacher = teachers[currentIndex]
    const voteId = `${user.uid}_${teacher.id}`
    
    try {
      // 1. Save individual rating
      await setDoc(doc(db, 'teacher_ratings', voteId), {
        userId: user.uid,
        teacherId: teacher.id,
        rating: rating,
        created_at: new Date().toISOString()
      })

      // 2. Update user profile (rated_teachers)
      await updateDoc(doc(db, 'profiles', user.uid), {
        rated_teachers: arrayUnion(teacher.id)
      })

      // 3. Update teacher aggregate (avg_rating, vote_count)
      // Note: In a production app, this would be better handled by a Cloud Function 
      // or a transaction to ensure consistency.
      const newVoteCount = (teacher.vote_count || 0) + 1
      const currentTotal = (teacher.avg_rating || 0) * (teacher.vote_count || 0)
      const newAvg = (currentTotal + rating) / newVoteCount

      await updateDoc(doc(db, 'teachers', teacher.id), {
        avg_rating: newAvg,
        vote_count: newVoteCount
      })

      toast.success(`${teacher.name} bewertet!`)
      
      // Move to next random teacher
      const nextTeachers = teachers.filter((_, i) => i !== currentIndex)
      setTeachers(nextTeachers)
      
      if (nextTeachers.length > 0) {
        setCurrentIndex(Math.floor(Math.random() * nextTeachers.length))
      } else {
        setFinished(true)
      }
    } catch (error) {
      console.error('Error submitting teacher vote:', error)
      toast.error('Bewertung fehlgeschlagen.')
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
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
              disabled={voting}
              onClick={() => handleVote(opt.value)}
              className={cn(
                "h-auto py-4 flex flex-col gap-2 border-2 transition-all hover:scale-105 active:scale-95 group/btn",
                voting && "opacity-50"
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

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
      variant === 'outline' ? "bg-background border-border" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </span>
  )
}
