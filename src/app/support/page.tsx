'use client'

import { useState, useEffect } from 'react'
import { helpFaqSections, searchHelpFaqs, HelpFaqItem } from '@/lib/helpFaqs'
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
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function SupportPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<HelpFaqItem[]>([])

  useEffect(() => {
    if (search.trim().length > 2) {
      const found = searchHelpFaqs(search, 6)
      setResults(found)
    } else {
      setResults([])
    }
  }, [search])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary/5 border-b py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Wie können wir helfen?
            </h1>
            <p className="text-xl text-muted-foreground">
              Durchsuche unsere FAQs oder wähle eine Kategorie, um Antworten zu finden.
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Stichwort eingeben (z.B. Registrierung, Karten, Stripe)..."
              className="h-16 pl-14 pr-6 text-lg rounded-2xl border-none shadow-xl bg-background focus-visible:ring-2 focus-visible:ring-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            {search.length > 2 && (
              <div className="absolute top-full left-0 w-full mt-4 bg-popover border rounded-2xl shadow-2xl p-4 z-10 text-left animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 px-2">Häufigste Treffer</p>
                <div className="space-y-1">
                  {results.length > 0 ? (
                    results.map(item => (
                      <button
                        key={item.id}
                        className="w-full text-left p-4 hover:bg-muted rounded-xl transition-colors group flex items-center justify-between"
                        onClick={() => router.push(`/a/${item.id}`)}
                      >
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-center text-muted-foreground italic">Keine genauen Treffer gefunden.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-20 px-4 container mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold mb-10 px-2 flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full" />
          Themen durchsuchen
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpFaqSections.map((section) => {
            const Icon = categoryIcons[section.id] || HelpCircle
            return (
              <Link key={section.id} href={`/c/${section.id}`}>
                <Card className="h-full hover:shadow-lg transition-all border-none bg-muted/30 hover:bg-muted/50 group cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon size={80} />
                  </div>
                  <CardContent className="p-8 space-y-4 relative z-10">
                    <div className="p-3 bg-primary/10 rounded-xl w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{section.category}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {section.items.length} Artikel verfügbar
                      </p>
                    </div>
                    <div className="pt-4 flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                      Ansehen <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-muted/30 py-20 px-4 mt-auto border-t">
        <div className="container mx-auto max-w-4xl text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Immer noch Fragen?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Unser Team ist bereit, dir zu helfen. Wenn du in den FAQs nicht fündig geworden bist, kannst du uns direkt kontaktieren.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-8 bg-background border rounded-2xl space-y-4 text-left hover:border-primary/50 transition-colors group">
              <div className="p-3 bg-destructive/10 rounded-xl w-fit">
                <Bug className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-bold">Beschwerde</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Als Lehrer kannst du Korrekturen an deinen Sammelkarten beantragen oder Löschungen anfordern.
              </p>
              <button 
                onClick={() => router.push('/beschwerden')}
                className="text-sm font-bold text-destructive hover:underline flex items-center gap-1"
              >
                Beschwerde einreichen <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="p-8 bg-background border rounded-2xl space-y-4 text-left hover:border-primary/50 transition-colors group">
              <div className="p-3 bg-primary/10 rounded-xl w-fit">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Community Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nutze das Feedback-Feature in der App oder frage im Planner-Team-Chat nach Hilfe.
              </p>
              <p className="text-xs font-bold text-muted-foreground italic">
                Verfügbar in der Haupt-App
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
