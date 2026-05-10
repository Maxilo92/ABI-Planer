'use client'

import { useState, useMemo, use } from 'react'
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
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import Link from 'next/link'
import { Locale } from '@/lib/helpFaqs'
import { motion, AnimatePresence } from 'framer-motion'
import { translations } from '@/lib/i18n/translations'

export default function SupportBeschwerdenPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter()
  const { locale: localeRaw } = use(params)
  const locale = localeRaw as Locale
  const { user, profile, resendVerification, refreshAuth } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)

  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const commonT = langTranslations?.supportCenter || translations['de-DE'].supportCenter

  const t = {
    de: {
      authRequired: 'Anmeldung erforderlich',
      authRequiredSub: 'Du musst mit deinem verifizierten Lehrer-Account angemeldet sein, um eine Beschwerde einzureichen.',
      backSupport: 'Zurück zum Support',
      toLogin: 'Zum Login',
      title: 'Lehrer-Beschwerden',
      description: 'Wir nehmen den Schutz deiner Persönlichkeitsrechte ernst. Hier kannst du Korrekturwünsche oder Löschanträge für deine Sammelkarte einreichen.',
      verifyTitle: 'Identität bestätigen',
      verifyDesc: 'E-Mail-Verifizierung erforderlich',
      verifyText: 'Um sicherzustellen, dass Beschwerden nur von den betroffenen Personen eingereicht werden, musst du deine E-Mail-Adresse bestätigen.',
      sendVerify: 'Bestätigungs-E-Mail senden',
      checkStatus: 'Status prüfen',
      verifiedTitle: 'Identität verifiziert',
      verifiedDesc: 'Du kannst jetzt eine Beschwerde einreichen.',
      step1: 'Betroffene Karte auswählen',
      suggestions: 'Vorschläge für dich',
      searchCard: 'Karte suchen',
      searchPlaceholder: 'Name des Lehrers...',
      noCards: 'Keine weiteren Karten gefunden.',
      step2: 'Grund der Beschwerde',
      reasonLabel: 'Was möchtest du ändern oder löschen lassen? Warum?',
      reasonPlaceholder: 'Bitte beschreibe dein Anliegen so detailliert wie möglich...',
      hint: 'Deine Beschwerde wird direkt an die Administratoren mit höchster Priorität weitergeleitet. Wir bearbeiten Anfragen von verifizierten Lehrern bevorzugt.',
      submitting: 'Wird gesendet...',
      submit: 'Beschwerde mit Prio absenden'
    },
    en: {
      authRequired: 'Login required',
      authRequiredSub: 'You must be logged in with your verified teacher account to submit a complaint.',
      backSupport: 'Back to Support',
      toLogin: 'To Login',
      title: 'Teacher Complaints',
      description: 'We take the protection of your privacy rights seriously. Here you can submit correction requests or deletion requests for your trading card.',
      verifyTitle: 'Confirm Identity',
      verifyDesc: 'Email verification required',
      verifyText: 'To ensure that complaints are only submitted by the affected persons, you must confirm your email address.',
      sendVerify: 'Send verification email',
      checkStatus: 'Check status',
      verifiedTitle: 'Identity verified',
      verifiedDesc: 'You can now submit a complaint.',
      step1: 'Select affected card',
      suggestions: 'Suggestions for you',
      searchCard: 'Search card',
      searchPlaceholder: 'Teacher\'s name...',
      noCards: 'No other cards found.',
      step2: 'Reason for complaint',
      reasonLabel: 'What do you want to change or delete? Why?',
      reasonPlaceholder: 'Please describe your concern as detailed as possible...',
      hint: 'Your complaint will be forwarded directly to the administrators with the highest priority. We process requests from verified teachers preferentially.',
      submitting: 'Sending...',
      submit: 'Submit complaint with priority'
    },
    es: {
      authRequired: 'Inicio de sesión requerido',
      authRequiredSub: 'Debes iniciar sesión con tu cuenta de profesor verificada para enviar una reclamación.',
      backSupport: 'Volver a Soporte',
      toLogin: 'Ir al Login',
      title: 'Reclamaciones de Profesores',
      description: 'Nos tomamos en serio la protección de tus derechos de privacidad. Aquí puedes enviar solicitudes de corrección o eliminación de tu tarjeta coleccionable.',
      verifyTitle: 'Confirmar Identidad',
      verifyDesc: 'Se requiere verificación de correo electrónico',
      verifyText: 'Para asegurar que las reclamaciones solo sean enviadas por las personas afectadas, debes confirmar tu dirección de correo electrónico.',
      sendVerify: 'Enviar correo de verificación',
      checkStatus: 'Comprobar estado',
      verifiedTitle: 'Identidad verificada',
      verifiedDesc: 'Ahora puedes enviar una reclamación.',
      step1: 'Seleccionar tarjeta afectada',
      suggestions: 'Sugerencias para ti',
      searchCard: 'Buscar tarjeta',
      searchPlaceholder: 'Nombre del profesor...',
      noCards: 'No se encontraron más tarjetas.',
      step2: 'Motivo de la reclamación',
      reasonLabel: '¿Qué quieres cambiar o eliminar? ¿Por qué?',
      reasonPlaceholder: 'Por favor, describe tu inquietud con el mayor detalle posible...',
      hint: 'Tu reclamación será enviada directamente a los administradores con la máxima prioridad. Procesamos preferentemente las solicitudes de profesores verificados.',
      submitting: 'Enviando...',
      submit: 'Enviar reclamación con prioridad'
    }
  }[locale] || {
    de: {
      authRequired: 'Anmeldung erforderlich',
      authRequiredSub: 'Du musst mit deinem verifizierten Lehrer-Account angemeldet sein, um eine Beschwerde einzureichen.',
      backSupport: 'Zurück zum Support',
      toLogin: 'Zum Login',
      title: 'Lehrer-Beschwerden',
      description: 'Wir nehmen den Schutz deiner Persönlichkeitsrechte ernst. Hier kannst du Korrekturwünsche oder Löschanträge für deine Sammelkarte einreichen.',
      verifyTitle: 'Identität bestätigen',
      verifyDesc: 'E-Mail-Verifizierung erforderlich',
      verifyText: 'Um sicherzustellen, dass Beschwerden nur von den betroffenen Personen eingereicht werden, musst du deine E-Mail-Adresse bestätigen.',
      sendVerify: 'Bestätigungs-E-Mail senden',
      checkStatus: 'Status prüfen',
      verifiedTitle: 'Identität verifiziert',
      verifiedDesc: 'Du kannst jetzt eine Beschwerde einreichen.',
      step1: 'Betroffene Karte auswählen',
      suggestions: 'Vorschläge für dich',
      searchCard: 'Karte suchen',
      searchPlaceholder: 'Name des Lehrers...',
      noCards: 'Keine weiteren Karten gefunden.',
      step2: 'Grund der Beschwerde',
      reasonLabel: 'Was möchtest du ändern oder löschen lassen? Warum?',
      reasonPlaceholder: 'Bitte beschreibe dein Anliegen so detailliert wie möglich...',
      hint: 'Deine Beschwerde wird direkt an die Administratoren mit höchster Priorität weitergeleitet. Wir bearbeiten Anfragen von verifizierten Lehrern bevorzugt.',
      submitting: 'Wird gesendet...',
      submit: 'Beschwerde mit Prio absenden'
    }
  }.de

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
      toast.success(locale === 'en' ? 'Verification email sent.' : 'Bestätigungs-E-Mail wurde gesendet.')
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsEmailSending(false)
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshAuth()
      toast.success(locale === 'en' ? 'Status updated.' : 'Status aktualisiert.')
    } catch (error: any) {
      toast.error('Error: ' + error.message)
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
      toast.success(locale === 'en' ? 'Your complaint has been submitted.' : 'Deine Beschwerde wurde eingereicht.')
      router.push(`/${locale}`)
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-32 px-4 text-center space-y-8 animate-in fade-in duration-500">
        <div className="p-6 bg-muted w-fit mx-auto rounded-[2rem]">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">{t.authRequired}</h1>
          <p className="text-muted-foreground text-xl font-medium max-w-md mx-auto">{t.authRequiredSub}</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="outline" className="h-12 px-8 rounded-2xl font-bold" asChild><Link href={`/${locale}`}>{t.backSupport}</Link></Button>
          <Button className="h-12 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20" asChild><a href="/login">{t.toLogin}</a></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-16 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <button 
          onClick={() => router.push(`/${locale}`)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          {t.backSupport}
        </button>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest">
            <ShieldAlert className="h-3 w-3" />
            Legal & Privacy
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">{t.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed font-medium">
            {t.description}
          </p>
        </div>
      </motion.div>

      {!user.emailVerified ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-destructive/30 bg-destructive/5 overflow-hidden rounded-[2rem] shadow-xl shadow-destructive/5">
            <CardHeader className="border-b border-destructive/10 p-8 sm:p-10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-destructive/10 rounded-2xl">
                  <ShieldAlert className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight text-destructive">{t.verifyTitle}</CardTitle>
                  <CardDescription className="font-bold uppercase tracking-widest text-[10px] mt-1">{t.verifyDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-10 space-y-8">
              <p className="text-lg font-medium leading-relaxed">
                {t.verifyText} (<strong>{user.email}</strong>).
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSendVerification} disabled={isEmailSending} className="h-12 gap-2 rounded-2xl px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                  <Mail className="h-4 w-4" />
                  {isEmailSending ? t.submitting : t.sendVerify}
                </Button>
                <Button variant="outline" onClick={handleRefresh} className="h-12 gap-2 rounded-2xl px-8 font-black uppercase tracking-widest text-[10px] hover:bg-background">
                  <RotateCcw className="h-4 w-4" />
                  {t.checkStatus}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-green-500/30 bg-green-500/5 rounded-[2rem] shadow-xl shadow-green-500/5">
            <CardHeader className="p-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-green-500/10 rounded-2xl text-green-600 shadow-sm">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight text-green-700 dark:text-green-400">{t.verifiedTitle}</CardTitle>
                  <CardDescription className="font-bold uppercase tracking-widest text-[10px] mt-1">{t.verifiedDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-16">
        <section className="space-y-8">
          <div className="flex items-center gap-4 text-2xl font-black tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm shadow-sm">1</div>
            <span>{t.step1}</span>
          </div>

          <div className="space-y-8">
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t.suggestions}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestions.map(card => (
                    <motion.div 
                      key={card.fullId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCardId(card.fullId)}
                      className={`
                        p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center justify-between
                        ${selectedCardId === card.fullId 
                          ? 'border-primary bg-primary/5 ring-8 ring-primary/5 shadow-xl shadow-primary/5' 
                          : 'border-border/50 hover:border-primary/40 bg-background shadow-sm'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-2xl shadow-inner">
                          {card.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-xl tracking-tight leading-none">{card.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 opacity-60">{card.cardNumber}</p>
                        </div>
                      </div>
                      {selectedCardId === card.fullId && (
                        <div className="p-1 bg-primary rounded-full">
                          <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <Label htmlFor="search" className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t.searchCard}</Label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  id="search"
                  placeholder={t.searchPlaceholder} 
                  className="h-14 pl-12 rounded-2xl bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto rounded-[2rem] border border-border/50 bg-muted/10 p-3 space-y-1 scrollbar-thin">
                {filteredCards.length > 0 ? (
                  filteredCards.map(card => (
                    <div 
                      key={card.fullId}
                      onClick={() => setSelectedCardId(card.fullId)}
                      className={`
                        p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all
                        ${selectedCardId === card.fullId 
                          ? 'bg-primary/10 border-primary/50 text-primary shadow-sm' 
                          : 'bg-background border-transparent hover:border-muted-foreground/20'}
                      `}
                    >
                      <span className="font-bold text-base tracking-tight">{card.name} <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-3 font-medium">{card.cardNumber}</span></span>
                      {selectedCardId === card.fullId && <CheckCircle2 className="h-5 w-5" />}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center space-y-2">
                    <p className="text-sm text-muted-foreground font-medium italic">{t.noCards}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8 border-t border-border/50 pt-16">
          <div className="flex items-center gap-4 text-2xl font-black tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm shadow-sm">2</div>
            <span>{t.step2}</span>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="reason" className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t.reasonLabel}</Label>
            <Textarea 
              id="reason"
              placeholder={t.reasonPlaceholder}
              className="min-h-[250px] rounded-[2rem] bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary p-8 text-lg font-medium leading-relaxed shadow-inner"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[1.5rem] flex gap-4 shadow-sm">
              <Clock className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-bold">
                <span className="uppercase tracking-widest text-[10px] block mb-1 opacity-70">{locale === 'en' ? 'Note' : 'Hinweis'}</span> 
                {t.hint}
              </p>
            </div>
          </div>
        </section>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-8"
        >
          <Button 
            type="submit" 
            disabled={isSubmitting || !user.emailVerified || !selectedCardId || reason.trim().length < 10}
            className="w-full h-20 text-2xl font-black tracking-tighter gap-3 rounded-[2rem] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
               <RotateCcw className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
            )}
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}
