'use client'

import { useState, useEffect, use } from 'react'
import { helpFaqSections, searchHelpFaqs, HelpFaqItem, Locale } from '@/lib/helpFaqs'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  UserPlus, 
  Settings, 
  Layers, 
  CreditCard, 
  PieChart, 
  Users, 
  Cpu, 
  ShieldCheck, 
  Bug, 
  MessageSquare,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  Mail,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { translations } from '@/lib/i18n/translations'

const categoryIcons: Record<string, any> = {
  registrierung: UserPlus,
  features: Settings,
  sammelkarten: Layers,
  zahlungen: CreditCard,
  finanzen: PieChart,
  gruppen: Users,
  technisch: Cpu,
  datenschutz: ShieldCheck,
  bugs: Bug,
  kontakt: MessageSquare
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter()
  const { locale: localeRaw } = use(params)
  const locale = localeRaw as Locale
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<HelpFaqItem[]>([])

  // Map locale to translation key
  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const t = langTranslations?.supportCenter || translations['de-DE'].supportCenter

  useEffect(() => {
    if (search.trim().length > 2) {
      const found = searchHelpFaqs(search, locale, 6)
      setResults(found)
    } else {
      setResults([])
    }
  }, [search, locale])

  const sections = helpFaqSections[locale] || helpFaqSections.de

  return (
    <div className="flex flex-col min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-primary/[0.02] -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10">
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        <div className="container mx-auto max-w-4xl text-center space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              Help Center
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
              {t.hero.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              {t.hero.subtitle}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto relative group"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t.hero.placeholder}
              className="h-16 pl-14 pr-6 text-lg rounded-3xl border-none shadow-2xl bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <AnimatePresence>
              {search.length > 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 w-full mt-4 bg-popover/95 backdrop-blur-md border rounded-3xl shadow-2xl p-4 z-50 text-left overflow-hidden"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2 opacity-60">{t.search.topHits}</p>
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {results.length > 0 ? (
                      results.map(item => (
                        <button
                          key={item.id}
                          className="w-full text-left p-4 hover:bg-muted rounded-2xl transition-all group flex items-center justify-between"
                          onClick={() => router.push(`/${locale}/artikel/${item.id}`)}
                        >
                          <div className="flex-1 pr-4">
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.question}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-medium">{item.category}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </button>
                      ))
                    ) : (
                      <p className="p-8 text-center text-muted-foreground italic font-medium">{t.search.noHits}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-24 px-4 container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-12 px-2">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-4">
            <div className="w-1.5 h-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
            {t.sections.browse}
          </h2>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sections.map((section) => {
            const Icon = categoryIcons[section.id] || HelpCircle
            return (
              <motion.div key={section.id} variants={item}>
                <Link href={`/${locale}/kategorie/${section.id}`}>
                  <Card className="h-full hover:shadow-2xl hover:shadow-primary/5 transition-all border border-border/50 bg-muted/20 hover:bg-background group cursor-pointer overflow-hidden relative rounded-3xl">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500">
                      <Icon size={160} />
                    </div>
                    <CardContent className="p-8 space-y-6 relative z-10">
                      <div className="p-4 bg-primary/10 rounded-2xl w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight">{section.category}</h3>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                          {section.items.length} {t.sections.articles}
                        </p>
                      </div>
                      <div className="pt-4 flex items-center text-xs font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                        {t.sections.view} <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="relative py-32 px-4 mt-auto border-t border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 -z-10" />
        
        <div className="container mx-auto max-w-5xl text-center space-y-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{t.contact.title}</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              {t.contact.subtitle}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-10 bg-background border border-border/50 rounded-[2.5rem] space-y-6 text-left hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 group"
            >
              <div className="p-4 bg-primary/10 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black tracking-tight">{t.contact.direct.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {t.contact.direct.subtitle}
                </p>
              </div>
              <button 
                onClick={() => router.push(`/${locale}/kontakt`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                {t.contact.direct.cta} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-10 bg-background border border-border/50 rounded-[2.5rem] space-y-6 text-left hover:border-destructive/50 transition-all hover:shadow-2xl hover:shadow-destructive/5 group"
            >
              <div className="p-4 bg-destructive/10 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Bug className="h-7 w-7 text-destructive" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black tracking-tight">{t.contact.complaint.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {t.contact.complaint.subtitle}
                </p>
              </div>
              <button 
                onClick={() => router.push(`/${locale}/beschwerden`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-destructive text-destructive-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-destructive/20"
              >
                {t.contact.complaint.cta} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-10 bg-background border border-border/50 rounded-[2.5rem] space-y-6 text-left hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 group"
            >
              <div className="p-4 bg-primary/10 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black tracking-tight">{t.contact.community.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {t.contact.community.subtitle}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                  {t.contact.community.badge}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

