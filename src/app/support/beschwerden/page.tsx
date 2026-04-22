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
import Link from 'next/link'

export default function SupportBeschwerdenPage() {
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
      const calculateMatch = (target: string, source: string) => {
        if (!source || !target) return 0
        if (target === source) return 100
        if (target.includes(source) || source.includes(target)) return Math.max(source.length, target.length)
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
      return Math.max(calculateMatch(cn, emailPrefix), calculateMatch(cn, fullNameLower))
    }

    return cards
      .map(card => ({ card, score: getScore(card.name) }))
      .filter(item => item.score > 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
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
      toast.success('Bestätigungs-E-Mail wurde gesendet.')
    } catch (error: any) {
      toast.error('Fehler: ' + error.message)
    } finally {
      setIsEmailSending(false)
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshAuth()
      toast.success('Status aktualisiert.')
    } catch (error: any) {
      toast.error('Fehler: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !user.emailVerified || !selectedCardId || reason.trim().length < 10) return

    setIsSubmitting(true)
    try {
      const selectedCard = cards.find(c => c.fullId === selectedCardId)
      await addDoc(collection(db, 'feedback'), {
        title: `Lehrer-Beschwerde: ${selectedCard?.name || selectedCardId}`,
        description: reason,
        type: 'complaint',
        status: 'new',
        importance: 10,
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
      toast.success('Deine Beschwerde wurde eingereicht.')
      router.push('/')
    } catch (error: any) {
      toast.error('Fehler: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6 animate-in fade-in duration-500">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Anmeldung erforderlich</h1>
          <p className="text-muted-foreground text-lg">Du musst mit deinem verifizierten Lehrer-Account angemeldet sein, um eine Beschwerde einzureichen.</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="outline" asChild><Link href="/">Zurück zum Support</Link></Button>
          <Button asChild><a href="/login">Zum Login</a></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-12 px-4 animate-in fade-in duration-500">
      <div className="space-y-4">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Zurück zum Support
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Lehrer-Beschwerden</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Wir nehmen den Schutz deiner Persönlichkeitsrechte ernst. Hier kannst du Korrekturwünsche oder Löschanträge für deine Sammelkarte einreichen.
          </p>
        </div>
      </div>

      {!user.emailVerified ? (
        <Card className="border-destructive/30 bg-destructive/5 overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-destructive/10">
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
          <CardContent className="p-6 space-y-4">
            <p className="leading-relaxed">
              Um sicherzustellen, dass Beschwerden nur von den betroffenen Personen eingereicht werden, musst du deine E-Mail-Adresse (<strong>{user.email}</strong>) bestätigen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSendVerification} disabled={isEmailSending} className="gap-2 rounded-xl">
                <Mail className="h-4 w-4" />
                {isEmailSending ? 'Wird gesendet...' : 'Bestätigungs-E-Mail senden'}
              </Button>
              <Button variant="outline" onClick={handleRefresh} className="gap-2 rounded-xl">
                <RotateCcw className="h-4 w-4" />
                Status prüfen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500/30 bg-green-500/5 rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-green-700 dark:text-green-400">Identität verifiziert</CardTitle>
                <CardDescription>Du kannst jetzt eine Beschwerde einreichen.</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">1</div>
            <span>Betroffene Karte auswählen</span>
          </div>

          <div className="space-y-6">
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Vorschläge für dich</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map(card => (
                    <div 
                      key={card.fullId}
                      onClick={() => setSelectedCardId(card.fullId)}
                      className={`
                        p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between
                        ${selectedCardId === card.fullId 
                          ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                          : 'border-muted hover:border-primary/40 bg-background'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                          {card.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-lg">{card.name}</p>
                          <p className="text-xs text-muted-foreground">{card.cardNumber}</p>
                        </div>
                      </div>
                      {selectedCardId === card.fullId && <CheckCircle2 className="h-6 w-6 text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <Label htmlFor="search" className="font-bold">Karte suchen</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="search"
                  placeholder="Name des Lehrers..." 
                  className="h-12 pl-12 rounded-xl bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto rounded-2xl border bg-muted/10 p-2 space-y-1 scrollbar-thin">
                {filteredCards.length > 0 ? (
                  filteredCards.map(card => (
                    <div 
                      key={card.fullId}
                      onClick={() => setSelectedCardId(card.fullId)}
                      className={`
                        p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all
                        ${selectedCardId === card.fullId 
                          ? 'bg-primary/10 border-primary/50 text-primary' 
                          : 'bg-background border-transparent hover:border-muted-foreground/20'}
                      `}
                    >
                      <span className="font-bold">{card.name} <span className="text-xs text-muted-foreground ml-2 font-medium">{card.cardNumber}</span></span>
                      {selectedCardId === card.fullId && <CheckCircle2 className="h-5 w-5" />}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Keine weiteren Karten gefunden.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 border-t pt-12">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">2</div>
            <span>Grund der Beschwerde</span>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="reason" className="font-bold text-lg text-muted-foreground">Was möchtest du ändern oder löschen lassen? Warum?</Label>
            <Textarea 
              id="reason"
              placeholder="Bitte beschreibe dein Anliegen so detailliert wie möglich..."
              className="min-h-[200px] rounded-2xl bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary p-6 text-lg leading-relaxed"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                <strong>Hinweis:</strong> Deine Beschwerde wird direkt an die Administratoren mit höchster Priorität weitergeleitet. Wir bearbeiten Anfragen von verifizierten Lehrern bevorzugt.
              </p>
            </div>
          </div>
        </section>

        <Button 
          type="submit" 
          disabled={isSubmitting || !user.emailVerified || !selectedCardId || reason.trim().length < 10}
          className="w-full h-16 text-xl font-extrabold gap-3 rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {isSubmitting ? (
            'Wird gesendet...'
          ) : (
            <>
              <Send className="h-6 w-6" />
              Beschwerde mit Prio absenden
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
