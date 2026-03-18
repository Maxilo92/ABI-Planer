'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc } from 'firebase/firestore'
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle } from 'lucide-react'

import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type FeedbackType = 'bug' | 'feature' | 'other'

export default function FeedbackPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<FeedbackType>('feature')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Du musst angemeldet sein, um Feedback zu geben.')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'feedback'), {
        title,
        description,
        type,
        status: 'new',
        created_at: new Date().toISOString(),
        created_by: user.uid,
        created_by_name: profile?.full_name || user.displayName || 'Unbekannt',
      })

      toast.success('Danke fuer dein Feedback!')
      setTitle('')
      setDescription('')
      setType('feature')
    } catch (error) {
      console.error('Error adding feedback:', error)
      toast.error('Fehler beim Senden des Feedbacks.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <div className="py-8 text-center text-muted-foreground">Lade Feedback-Seite...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <MessageSquarePlus className="h-7 w-7 text-primary" /> Feedback
        </h1>
        <p className="text-muted-foreground mt-1">
          Melde Bugs, teile Ideen und schicke uns Verbesserungswuensche.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neues Feedback senden</CardTitle>
          <CardDescription>
            Je genauer deine Beschreibung, desto schneller koennen wir es umsetzen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Art des Feedbacks</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={type === 'bug' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setType('bug')}
                >
                  <Bug className="h-4 w-4" /> Bug
                </Button>
                <Button
                  type="button"
                  variant={type === 'feature' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setType('feature')}
                >
                  <Lightbulb className="h-4 w-4" /> Idee
                </Button>
                <Button
                  type="button"
                  variant={type === 'other' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setType('other')}
                >
                  <HelpCircle className="h-4 w-4" /> Sonstiges
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-title">Titel</Label>
              <Input
                id="feedback-title"
                placeholder="z.B. Kalender zeigt falsche Reihenfolge"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-description">Beschreibung</Label>
              <Textarea
                id="feedback-description"
                placeholder="Was passiert? Wie kann man es reproduzieren? Was waere das gewuenschte Verhalten?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Wird gesendet...' : 'Feedback absenden'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
