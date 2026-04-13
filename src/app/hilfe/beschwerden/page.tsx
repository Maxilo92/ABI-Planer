'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getAllCards } from '@/constants/cardRegistry'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Send,
  RotateCcw
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'

export default function BeschwerdenPage() {
  const router = useRouter()
  const { user, profile, resendVerification, refreshAuth } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)

  const cards = useMemo(() => getAllCards().filter(c => c.type === 'teacher'), [])

  // Identify suggested cards based on email or profile name
  const suggestions = useMemo(() => {
    if (!user?.email && !profile?.full_name) return []
    
    const emailPrefix = user?.email?.split('@')[0].toLowerCase().replace(/[._-]/g, ' ') || ''
    const fullNameLower = profile?.full_name?.toLowerCase() || ''
    
    const getScore = (cardName: string) => {
      const cn = cardName.toLowerCase()

      // Helper for scoring matches
      const calculateMatch = (target: string, source: string) => {
        if (!source || !target) return 0
        if (target === source) return 100 // Perfect match
        if (target.includes(source) || source.includes(target)) return Math.max(source.length, target.length)
        
        // Word-based scoring (longest match)
        const targetWords = target.split(/\s+/)
        const sourceWords = source.split(/\s+/)
        let wordScore = 0
        
        for (const sw of sourceWords) {
          if (sw.length < 3) continue
          for (const tw of targetWords) {
            if (tw.length < 3) continue
            if (tw === sw) wordScore += sw.length * 2
            else if (tw.includes(sw) || sw.includes(tw)) wordScore += Math.min(sw.length, tw.length)
          }
        }
        return wordScore
      }

      const emailScore = calculateMatch(cn, emailPrefix)
      const nameScore = calculateMatch(cn, fullNameLower)
      
      return Math.max(emailScore, nameScore)
    }

    return cards
      .map(card => ({ card, score: getScore(card.name) }))
      .filter(item => item.score > 3) // Only show relevant suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 4) // Limit to top 4 suggestions
      .map(item => item.card)
  }, [user, profile, cards])

  const filteredCards = useMemo(() => {
    const s = search.toLowerCase()
    return cards.filter(card => 
      !suggestions.find(suggested => suggested.fullId === card.fullId) &&
      (card.name.toLowerCase().includes(s) || card.id.toLowerCase().includes(s))
    )
  }, [cards, suggestions, search])

  const handleSendVerification = async () => {
    if (!user) return
    setIsEmailSending(true)
    try {
      await resendVerification()
      toast.success('Bestätigungs-E-Mail wurde gesendet. Bitte prüfe dein Postfach.')
    } catch (error: any) {
      console.error('Error sending verification email:', error)
      toast.error('Fehler beim Senden der E-Mail: ' + error.message)
    } finally {
      setIsEmailSending(false)
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshAuth()
      toast.success('Status aktualisiert.')
    } catch (error: any) {
      toast.error('Fehler beim Aktualisieren: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      toast.error('Du musst angemeldet sein.')
      return
    }
    if (!user.emailVerified) {
      toast.error('Bitte bestätige zuerst deine E-Mail-Adresse.')
      return
    }
    if (!selectedCardId) {
      toast.error('Bitte wähle eine Karte aus.')
      return
    }
    if (reason.trim().length < 10) {
      toast.error('Bitte gib eine detaillierte Begründung an (mind. 10 Zeichen).')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedCard = cards.find(c => c.fullId === selectedCardId)
      
      await addDoc(collection(db, 'feedback'), {
        title: `Lehrer-Beschwerde: ${selectedCard?.name || selectedCardId}`,
        description: reason,
        type: 'complaint',
        status: 'new',
        importance: 10, // Highest Priority
        is_teacher_request: true,
        teacher_card_id: selectedCardId,
        teacher_card_name: selectedCard?.name || null,
        created_at: serverTimestamp(),
        created_by: user.uid,
        created_by_name: profile.full_name || user.email || 'Unbekannter Lehrer',
        is_anonymous: false,
        is_private: true
      })

      await logAction('FEEDBACK_CREATED', user.uid, profile.full_name, {
        type: 'complaint',
        is_teacher_request: true,
        teacher_card_id: selectedCardId
      })

      toast.success('Deine Beschwerde wurde mit höchster Priorität eingereicht.')
      router.push('/hilfe')
    } catch (error: any) {
      console.error('Error submitting complaint:', error)
      toast.error('Fehler beim Einreichen: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">Anmeldung erforderlich</h1>
        <p className="text-muted-foreground">Du musst angemeldet sein, um eine Beschwerde einzureichen.</p>
        <Button onClick={() => router.push('/login')}>Zum Login</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <Button 
        variant="ghost" 
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Lehrer-Beschwerden</h1>
        <p className="text-muted-foreground">
          Einreichung von Korrekturwünschen oder Löschanträgen für Lehrer-Sammelkarten.
        </p>
      </div>

      {!user.emailVerified ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">Identität bestätigen</CardTitle>
                <CardDescription>E-Mail-Verifizierung erforderlich</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              Um sicherzustellen, dass Beschwerden nur von den betroffenen Personen eingereicht werden, musst du deine E-Mail-Adresse (<strong>{user.email}</strong>) bestätigen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSendVerification} 
                disabled={isEmailSending}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                {isEmailSending ? 'Wird gesendet...' : 'Bestätigungs-E-Mail senden'}
              </Button>
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Status prüfen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-700 dark:text-green-400">Identität verifiziert</CardTitle>
                <CardDescription>Deine E-Mail wurde erfolgreich bestätigt.</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Search className="h-5 w-5 text-primary" />
            <span>1. Betroffene Karte auswählen</span>
          </div>

          <div className="space-y-4">
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vorgeschlagen (basierend auf deinem Profil)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map(card => (
                    <div 
                      key={card.fullId}
                      onClick={() => setSelectedCardId(card.fullId)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between
                        ${selectedCardId === card.fullId 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md' 
                          : 'border-muted hover:border-primary/40 hover:bg-muted/50'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {card.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold">{card.name}</p>
                          <p className="text-xs text-muted-foreground">{card.cardNumber}</p>
                        </div>
                      </div>
                      {selectedCardId === card.fullId && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label htmlFor="search">Andere Karte suchen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="search"
                  placeholder="Name des Lehrers..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto rounded-lg border bg-muted/20 p-2 space-y-1 scrollbar-thin">
                {filteredCards.length > 0 ? (
                  filteredCards.map(card => (
                    <div 
                      key={card.fullId}
                      onClick={() => setSelectedCardId(card.fullId)}
                      className={`
                        p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors
                        ${selectedCardId === card.fullId 
                          ? 'bg-primary/10 border-primary/50 text-primary shadow-sm' 
                          : 'hover:bg-background border-transparent'}
                      `}
                    >
                      <span className="font-medium">{card.name} <span className="text-xs text-muted-foreground ml-2">{card.cardNumber}</span></span>
                      {selectedCardId === card.fullId && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Keine weiteren Karten gefunden.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            <span>2. Grund der Beschwerde</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Was möchtest du ändern oder löschen lassen? Warum?</Label>
            <Textarea 
              id="reason"
              placeholder="Bitte beschreibe dein Anliegen so detailliert wie möglich..."
              className="min-h-[150px] resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Hinweis:</strong> Deine Beschwerde wird direkt an die Administratoren mit höchster Priorität weitergeleitet. Wir bearbeiten Anfragen von verifizierten Lehrern bevorzugt.
            </p>
          </div>
        </section>

        <Button 
          type="submit" 
          disabled={isSubmitting || !user.emailVerified || !selectedCardId || reason.trim().length < 10}
          className="w-full h-12 text-lg font-bold gap-2 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            'Wird gesendet...'
          ) : (
            <>
              <Send className="h-5 w-5" />
              Beschwerde absenden
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
