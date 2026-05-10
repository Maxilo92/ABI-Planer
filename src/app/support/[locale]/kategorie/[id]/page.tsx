'use client'

import { use } from 'react'
import { helpFaqSections, Locale } from '@/lib/helpFaqs'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ChevronRight,
  FileText,
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
  HelpCircle,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
}

export default function CategoryPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const router = useRouter()
  const { locale: localeRaw, id } = use(params)
  const locale = localeRaw as Locale
  
  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const commonT = langTranslations?.supportCenter || translations['de-DE'].supportCenter
  const t = commonT.subPages.category
  
  const section = (helpFaqSections[locale] || helpFaqSections.de).find(s => s.id === id)

  if (!section) {
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

  const Icon = categoryIcons[section.id] || HelpCircle

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-12">
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 border-b border-border/50 pb-12">
          <div className="p-6 bg-primary/10 rounded-3xl text-primary shadow-xl shadow-primary/5 group-hover:scale-105 transition-transform">
            <Icon size={40} />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              Category
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">{section.category}</h1>
            <p className="text-muted-foreground text-lg font-medium opacity-70">
              {t.allArticles} {section.category}.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4"
      >
        {section.items.map((itemSection) => (
          <motion.div key={itemSection.id} variants={item}>
            <Link href={`/${locale}/artikel/${itemSection.id}`}>
              <div className="p-6 bg-muted/20 hover:bg-muted/40 border border-border/50 hover:border-primary/50 rounded-[2rem] transition-all group flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-primary/5">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-background rounded-2xl text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="font-black text-xl tracking-tight group-hover:text-primary transition-colors">
                    {itemSection.question}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {section.items.length === 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground py-20 italic font-medium"
        >
          {t.noArticles}
        </motion.p>
      )}
    </div>
  )
}
