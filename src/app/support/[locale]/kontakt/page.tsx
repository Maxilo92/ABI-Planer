'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Send,
  CheckCircle2,
  Mail,
  Sparkles,
  RotateCcw
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { motion } from 'framer-motion'
import { translations } from '@/lib/i18n/translations'

export default function KontaktPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter()
  const { locale: localeRaw } = use(params)
  const locale = localeRaw as 'de' | 'en' | 'es'
  const { user, profile } = useAuth()
  
  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const commonT = langTranslations?.supportCenter || translations['de-DE'].supportCenter
  const t = langTranslations || translations['de-DE']
  
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    
    // If not logged in, name and email are also needed for reply
    if (!user && (!name.trim() || !email.trim())) {
       toast.error(locale === 'de' ? 'Bitte gib deinen Namen und deine E-Mail an.' : 'Please provide your name and email.')
       return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'feedback'), {
        title: subject,
        description: message,
        type: 'support_ticket',
        status: 'new',
        importance: 5,
        created_at: serverTimestamp(),
        created_by: user?.uid || 'guest',
        created_by_name: profile?.full_name || name || 'Anonym',
        contact_email: user?.email || email || null,
        is_anonymous: !user && !name,
        is_private: true
      })

      if (user) {
        await logAction('FEEDBACK_CREATED', user.uid, profile?.full_name || 'User', {
          type: 'support_ticket',
          subject
        })
      }
      
      setIsSuccess(true)
      toast.success(t.auth.login.contactSuccess)
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-32 px-4 text-center space-y-12 animate-in fade-in duration-500">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center"
        >
          <div className="p-8 bg-primary/10 rounded-[2.5rem] text-primary shadow-xl shadow-primary/5">
            <CheckCircle2 className="h-20 w-20" />
          </div>
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter leading-none">{t.auth.login.contactTitle}</h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-md mx-auto">
            {t.auth.login.contactSuccess}
          </p>
        </div>
        <Button size="lg" onClick={() => router.push(`/${locale}`)} className="h-16 px-10 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          {commonT.subPages.backOverview}
        </Button>
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
          {commonT.subPages.backOverview}
        </button>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            Direct Contact
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">{t.auth.login.contactTitle}</h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed">
            {locale === 'de' 
              ? 'Hast du eine Frage oder ein Problem? Sende uns eine Nachricht und wir helfen dir gerne weiter.'
              : locale === 'es'
              ? '¿Tienes alguna pregunta o problema? Envíanos un mensaje y estaremos encantados de ayudarte.'
              : 'Do you have a question or a problem? Send us a message and we will be happy to help you.'}
          </p>
        </div>
      </motion.div>

      <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/[0.03] border-b border-border/50 p-10 sm:p-12">
           <div className="flex items-center gap-6">
             <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-sm">
               <Mail className="h-8 w-8" />
             </div>
             <div>
               <CardTitle className="text-2xl font-black tracking-tight">{locale === 'de' ? 'Ticket erstellen' : locale === 'es' ? 'Crear ticket' : 'Create Ticket'}</CardTitle>
               <CardDescription className="font-bold uppercase tracking-widest text-[10px] mt-1 opacity-70">
                 {locale === 'de' ? 'Wir melden uns in der Regel innerhalb von 24h.' : locale === 'es' ? 'Normalmente respondemos en 24h.' : 'We usually respond within 24 hours.'}
               </CardDescription>
             </div>
           </div>
        </CardHeader>
        <CardContent className="p-10 sm:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    {locale === 'de' ? 'Dein Name' : locale === 'es' ? 'Tu nombre' : 'Your Name'}
                  </Label>
                  <Input 
                    id="name"
                    placeholder="Max Mustermann"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 bg-muted/20 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary shadow-inner text-lg font-medium"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    {t.auth.login.contactEmail}
                  </Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="max@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-muted/20 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary shadow-inner text-lg font-medium"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {t.auth.login.contactSubject}
              </Label>
              <Input 
                id="subject"
                placeholder={locale === 'de' ? 'Wobei brauchst du Hilfe?' : locale === 'es' ? '¿En qué necesitas ayuda?' : 'What do you need help with?'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-14 bg-muted/20 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary shadow-inner text-lg font-medium"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {t.auth.login.contactMessage}
              </Label>
              <Textarea 
                id="message"
                placeholder={locale === 'de' ? 'Beschreibe dein Anliegen so detailliert wie möglich...' : locale === 'es' ? 'Describe tu inquietud con el mayor detalle posible...' : 'Describe your concern as detailed as possible...'}
                className="min-h-[250px] bg-muted/20 border-none rounded-[2rem] focus-visible:ring-2 focus-visible:ring-primary p-8 text-lg font-medium leading-relaxed shadow-inner"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full h-20 text-2xl font-black tracking-tighter gap-3 rounded-[2rem] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <RotateCcw className="h-6 w-6 animate-spin" />
              ) : (
                <Send className="h-6 w-6" />
              )}
              {isSubmitting ? (locale === 'de' ? 'Wird gesendet...' : locale === 'es' ? 'Enviando...' : 'Sending...') : t.auth.login.contactSend}
            </Button>
          </form>
        </CardContent>
      </Card>

      {user && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-xs text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60"
        >
          {locale === 'de' 
            ? 'Deine Nachricht wird automatisch mit deinem Account verknüpft.'
            : locale === 'es'
            ? 'Tu mensaje se vinculará automáticamente a tu cuenta.'
            : 'Your message will be automatically linked to your account.'}
        </motion.div>
      )}
    </div>
  )
}
