'use client'

import { use, useState } from 'react'
import { helpFaqSections, getHelpFaqItems, Locale } from '@/lib/helpFaqs'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { translations } from '@/lib/i18n/translations'

export default function ArticlePage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const router = useRouter()
  const { locale: localeRaw, id } = use(params)
  const locale = localeRaw as Locale
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  
  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const commonT = langTranslations?.supportCenter || translations['de-DE'].supportCenter
  const t = commonT.subPages.article
  
  const localizedItems = getHelpFaqItems(locale)
  const article = localizedItems.find(i => i.id === id)
  const section = (helpFaqSections[locale] || helpFaqSections.de).find(s => s.items.some(i => i.id === id))

  if (!article || !section) {
    return (
      <div className="container mx-auto py-32 px-4 text-center space-y-8">
        <div className="p-4 bg-muted w-fit mx-auto rounded-full">
          <HelpCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">{commonT.subPages.notFound}</h1>
          <Link href={`/${locale}`} className="text-primary font-bold hover:underline block">{commonT.subPages.backHome}</Link>
        </div>
      </div>
    )
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type)
    toast.success(t.thanks)
  }

  const relatedArticles = section.items
    .filter(i => i.id !== id)
    .slice(0, 3)

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12"
      >
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap overflow-x-auto pb-2 scrollbar-none opacity-60">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">{commonT.subPages.backOverview}</Link>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <Link href={`/${locale}/kategorie/${section.id}`} className="hover:text-primary transition-colors">{section.category}</Link>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <span className="text-foreground truncate">{article.question}</span>
          </nav>

          <article className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                Support Article
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-foreground">
                {article.question}
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg dark:prose-invert max-w-none"
            >
              <p className="text-xl text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                {article.answer}
              </p>
            </motion.div>
          </article>

          {/* Article Feedback */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-16 border-t border-border/50"
          >
            <div className="bg-muted/30 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-border/50 shadow-xl shadow-primary/5">
              <div className="space-y-2 text-center md:text-left">
                <h4 className="font-black text-2xl tracking-tight">{t.helpful}</h4>
                <p className="text-sm text-muted-foreground font-medium">{t.helpfulSub}</p>
              </div>
              <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                  {feedback === null ? (
                    <motion.div 
                      key="buttons"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-4"
                    >
                      <Button 
                        variant="outline" 
                        className="h-12 rounded-2xl gap-2 px-8 font-black uppercase tracking-widest text-[10px] hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all active:scale-95"
                        onClick={() => handleFeedback('up')}
                      >
                        <ThumbsUp className="h-4 w-4" /> {t.yes}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-12 rounded-2xl gap-2 px-8 font-black uppercase tracking-widest text-[10px] hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all active:scale-95"
                        onClick={() => handleFeedback('down')}
                      >
                        <ThumbsDown className="h-4 w-4" /> {t.no}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="thanks"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-xs"
                    >
                      <div className="p-2 bg-primary/10 rounded-full">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      {t.thanks}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-28 space-y-8">
            {relatedArticles.length > 0 && (
              <div className="bg-muted/20 border border-border/50 rounded-[2rem] p-8 space-y-6">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground opacity-60">{t.related}</h4>
                <div className="space-y-4">
                  {relatedArticles.map(item => (
                    <Link key={item.id} href={`/${locale}/artikel/${item.id}`} className="block group">
                      <p className="text-base font-black tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {item.question}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2rem] space-y-6 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
                <HelpCircle size={150} />
              </div>
              <div className="space-y-2 relative z-10">
                <h4 className="font-black text-2xl tracking-tight text-primary">{t.questions}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {t.questionsSub}
                </p>
              </div>
              <div className="space-y-3 relative z-10">
                <Button className="w-full h-12 gap-2 rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px]" onClick={() => router.push(`/${locale}/beschwerden`)}>
                  <MessageCircle className="h-4 w-4" />
                  {t.contact}
                </Button>
                <Button variant="ghost" className="w-full h-12 gap-2 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary/5" onClick={() => {
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
      </motion.div>
    </div>
  )
}
