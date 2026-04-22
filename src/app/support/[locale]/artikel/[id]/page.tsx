'use client'

import { use, useState } from 'react'
import { helpFaqItems, helpFaqSections, getHelpFaqItems, Locale } from '@/lib/helpFaqs'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ArticlePage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const router = useRouter()
  const { locale: localeRaw, id } = use(params)
  const locale = localeRaw as Locale
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  
  const localizedItems = getHelpFaqItems(locale)
  const article = localizedItems.find(i => i.id === id)
  const section = (helpFaqSections[locale] || helpFaqSections.de).find(s => s.items.some(i => i.id === id))

  const t = {
    de: {
      notFound: 'Artikel nicht gefunden.',
      backHome: 'Zurück zur Startseite',
      support: 'Support',
      helpful: 'War dieser Artikel hilfreich?',
      helpfulSub: 'Dein Feedback hilft uns, den Support zu verbessern.',
      yes: 'Ja',
      no: 'Nein',
      thanks: 'Danke für dein Feedback!',
      thanksToast: 'Vielen Dank für dein Feedback!',
      related: 'Ähnliche Artikel',
      questions: 'Noch Fragen?',
      questionsSub: 'Nicht das Richtige gefunden? Unser Team hilft dir gerne weiter.',
      contact: 'Support kontaktieren',
      share: 'Artikel teilen',
      copied: 'Link kopiert!'
    },
    en: {
      notFound: 'Article not found.',
      backHome: 'Back to home',
      support: 'Support',
      helpful: 'Was this article helpful?',
      helpfulSub: 'Your feedback helps us improve our support.',
      yes: 'Yes',
      no: 'No',
      thanks: 'Thanks for your feedback!',
      thanksToast: 'Thank you for your feedback!',
      related: 'Related Articles',
      questions: 'Still have questions?',
      questionsSub: 'Didn\'t find what you were looking for? Our team is happy to help.',
      contact: 'Contact Support',
      share: 'Share article',
      copied: 'Link copied!'
    }
  }[locale] || {
    de: {
      notFound: 'Artikel nicht gefunden.',
      backHome: 'Zurück zur Startseite',
      support: 'Support',
      helpful: 'War dieser Artikel hilfreich?',
      helpfulSub: 'Dein Feedback hilft uns, den Support zu verbessern.',
      yes: 'Ja',
      no: 'Nein',
      thanks: 'Danke für dein Feedback!',
      thanksToast: 'Vielen Dank für dein Feedback!',
      related: 'Ähnliche Artikel',
      questions: 'Noch Fragen?',
      questionsSub: 'Nicht das Richtige gefunden? Unser Team hilft dir gerne weiter.',
      contact: 'Support kontaktieren',
      share: 'Artikel teilen',
      copied: 'Link kopiert!'
    }
  }.de

  if (!article || !section) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold">{t.notFound}</h1>
        <Link href={`/${locale}`} className="text-primary hover:underline mt-4 block">{t.backHome}</Link>
      </div>
    )
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type)
    toast.success(t.thanksToast)
  }

  const relatedArticles = section.items
    .filter(i => i.id !== id)
    .slice(0, 3)

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap overflow-x-auto pb-2 scrollbar-none">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">{t.support}</Link>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <Link href={`/${locale}/kategorie/${section.id}`} className="hover:text-primary transition-colors">{section.category}</Link>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <span className="text-foreground font-medium truncate">{article.question}</span>
          </nav>

          <article className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
              {article.question}
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-xl text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {article.answer}
              </p>
            </div>
          </article>

          {/* Article Feedback */}
          <div className="pt-12 border-t">
            <div className="bg-muted/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="font-bold text-lg">{t.helpful}</h4>
                <p className="text-sm text-muted-foreground">{t.helpfulSub}</p>
              </div>
              <div className="flex items-center gap-3">
                {feedback === null ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="rounded-full gap-2 px-6 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all"
                      onClick={() => handleFeedback('up')}
                    >
                      <ThumbsUp className="h-4 w-4" /> {t.yes}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-full gap-2 px-6 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
                      onClick={() => handleFeedback('down')}
                    >
                      <ThumbsDown className="h-4 w-4" /> {t.no}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-primary font-bold animate-in zoom-in duration-300">
                    <CheckCircle2 className="h-5 w-5" />
                    {t.thanks}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-24 space-y-8">
            {relatedArticles.length > 0 && (
              <div className="bg-muted/20 border rounded-2xl p-6 space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{t.related}</h4>
                <div className="space-y-3">
                  {relatedArticles.map(item => (
                    <Link key={item.id} href={`/${locale}/artikel/${item.id}`} className="block group">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2">
                        {item.question}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-primary">{t.questions}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.questionsSub}
              </p>
              <div className="space-y-2">
                <Button className="w-full gap-2 rounded-xl shadow-lg shadow-primary/20" onClick={() => router.push(`/${locale}/beschwerden`)}>
                  <MessageCircle className="h-4 w-4" />
                  {t.contact}
                </Button>
                <Button variant="ghost" className="w-full gap-2 rounded-xl" onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success(t.copied)
                }}>
                  <Share2 className="h-4 w-4" />
                  {t.share}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
