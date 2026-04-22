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
  Mail
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'

export default function KontaktPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter()
  const { locale } = use(params)
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  
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
      toast.success(t('auth.login.contactSuccess'))
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full text-primary">
            <CheckCircle2 className="h-16 w-16" />
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">{t('auth.login.contactTitle')}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('auth.login.contactSuccess')}
          </p>
        </div>
        <Button size="lg" onClick={() => router.push(`/${locale}`)} className="h-14 px-8 rounded-2xl">
          {locale === 'de' ? 'Zurück zum Support' : 'Back to Support'}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-12 px-4 animate-in fade-in duration-500">
      <div className="space-y-4">
        <button 
          onClick={() => router.push(`/${locale}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {locale === 'de' ? 'Zurück zum Support' : 'Back to Support'}
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{t('auth.login.contactTitle')}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {locale === 'de' 
              ? 'Hast du eine Frage oder ein Problem? Sende uns eine Nachricht und wir helfen dir gerne weiter.'
              : 'Do you have a question or a problem? Send us a message and we will be happy to help you.'}
          </p>
        </div>
      </div>

      <Card className="border-border shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8 sm:p-10">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl text-primary">
               <Mail className="h-6 w-6" />
             </div>
             <div>
               <CardTitle>{locale === 'de' ? 'Ticket erstellen' : 'Create Ticket'}</CardTitle>
               <CardDescription>
                 {locale === 'de' ? 'Wir melden uns in der Regel innerhalb von 24h.' : 'We usually respond within 24 hours.'}
               </CardDescription>
             </div>
           </div>
        </CardHeader>
        <CardContent className="p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {locale === 'de' ? 'Dein Name' : 'Your Name'}
                  </Label>
                  <Input 
                    id="name"
                    placeholder="Max Mustermann"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 bg-muted/20 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('auth.login.contactEmail')}
                  </Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="max@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-muted/20 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                {t('auth.login.contactSubject')}
              </Label>
              <Input 
                id="subject"
                placeholder={locale === 'de' ? 'Wobei brauchst du Hilfe?' : 'What do you need help with?'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-12 bg-muted/20 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                {t('auth.login.contactMessage')}
              </Label>
              <Textarea 
                id="message"
                placeholder={locale === 'de' ? 'Beschreibe dein Anliegen so detailliert wie möglich...' : 'Describe your concern as detailed as possible...'}
                className="min-h-[200px] bg-muted/20 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary p-6 leading-relaxed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full h-14 text-lg font-bold gap-2 rounded-xl shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Send className="h-5 w-5 animate-pulse" />
                  {locale === 'de' ? 'Wird gesendet...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {t('auth.login.contactSend')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {user && (
        <div className="bg-primary/5 rounded-2xl p-6 text-sm text-center text-muted-foreground">
          {locale === 'de' 
            ? 'Deine Nachricht wird automatisch mit deinem Account verknüpft.'
            : 'Your message will be automatically linked to your account.'}
        </div>
      )}
    </div>
  )
}
