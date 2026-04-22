'use client'

import { use } from 'react'
import { helpFaqSections } from '@/lib/helpFaqs'
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

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const section = helpFaqSections.find(s => s.id === id)

  if (!section) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold">Kategorie nicht gefunden.</h1>
        <Link href="/" className="text-primary hover:underline mt-4 block">Zurück zur Startseite</Link>
      </div>
    )
  }

  const Icon = categoryIcons[section.id] || HelpCircle

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-12 animate-in fade-in duration-500">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Zurück zur Übersicht
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b pb-12">
        <div className="p-5 bg-primary/10 rounded-2xl text-primary">
          <Icon size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{section.category}</h1>
          <p className="text-muted-foreground text-lg">
            Alle Artikel zum Thema {section.category}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {section.items.map((item) => (
          <Link key={item.id} href={`/a/${item.id}`}>
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
          Noch keine Artikel in dieser Kategorie vorhanden.
        </p>
      )}
    </div>
  )
}
