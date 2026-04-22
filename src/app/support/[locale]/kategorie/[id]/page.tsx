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
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'

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

export default function CategoryPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const router = useRouter()
  const { locale: localeRaw, id } = use(params)
  const locale = localeRaw as Locale
  const section = (helpFaqSections[locale] || helpFaqSections.de).find(s => s.id === id)

  const t = {
    de: {
      notFound: 'Kategorie nicht gefunden.',
      backHome: 'Zurück zur Startseite',
      backOverview: 'Zurück zur Übersicht',
      allArticles: 'Alle Artikel zum Thema',
      noArticles: 'Noch keine Artikel in dieser Kategorie vorhanden.'
    },
    en: {
      notFound: 'Category not found.',
      backHome: 'Back to home',
      backOverview: 'Back to overview',
      allArticles: 'All articles about',
      noArticles: 'No articles available in this category yet.'
    }
  }[locale] || {
    de: {
      notFound: 'Kategorie nicht gefunden.',
      backHome: 'Zurück zur Startseite',
      backOverview: 'Zurück zur Übersicht',
      allArticles: 'Alle Artikel zum Thema',
      noArticles: 'Noch keine Artikel in dieser Kategorie vorhanden.'
    }
  }.de

  if (!section) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold">{t.notFound}</h1>
        <Link href={`/${locale}`} className="text-primary hover:underline mt-4 block">{t.backHome}</Link>
      </div>
    )
  }

  const Icon = categoryIcons[section.id] || HelpCircle

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-12 animate-in fade-in duration-500">
      <button 
        onClick={() => router.push(`/${locale}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        {t.backOverview}
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b pb-12">
        <div className="p-5 bg-primary/10 rounded-2xl text-primary">
          <Icon size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{section.category}</h1>
          <p className="text-muted-foreground text-lg">
            {t.allArticles} {section.category}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {section.items.map((item) => (
          <Link key={item.id} href={`/${locale}/artikel/${item.id}`}>
            <div className="p-6 bg-muted/20 hover:bg-muted/40 border rounded-2xl transition-all group flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-background rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg group-hover:text-primary transition-colors">
                  {item.question}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {section.items.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {t.noArticles}
        </p>
      )}
    </div>
  )
}
