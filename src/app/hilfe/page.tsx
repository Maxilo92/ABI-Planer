'use client'

import { helpFaqSections } from '@/lib/helpFaqs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HelpCircle, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function HilfePage() {
  const router = useRouter()
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({})
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const faqs = helpFaqSections.map((section) => ({
    id: section.id,
    category: section.category,
    items: section.items.map((item) => ({ q: item.question, a: item.answer })),
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <Button 
        variant="ghost" 
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Hilfe & FAQ</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tipp:</strong> Nutze Strg+F (Cmd+F auf Mac) um diese Seite zu durchsuchen!
            </p>
          </div>

          {faqs.map(category => (
            <section key={category.id} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">
                {category.category}
              </h3>

              <div className="space-y-2">
                {category.items.map((item, idx) => {
                  const accordionId = `${category.id}-${idx}`
                  const isOpen = openAccordions[accordionId]

                  return (
                    <div key={accordionId} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleAccordion(accordionId)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="font-medium text-foreground pr-4">
                          {item.q}
                        </span>
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-4 py-3 bg-muted/30 border-t text-muted-foreground leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <section className="bg-destructive/5 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive/30 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="p-1 bg-destructive/10 rounded-md">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </span>
              Bist du ein Lehrer?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Du bist mit einer Karte unzufrieden oder möchtest, dass Informationen angepasst werden? Wir nehmen den Schutz deiner Persönlichkeitsrechte ernst.
            </p>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-destructive/30 hover:bg-destructive/5 hover:text-destructive gap-2"
              onClick={() => router.push('/hilfe/beschwerden')}
            >
              Beschwerde einreichen
            </Button>
          </section>

          <section className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Deine Frage ist nicht beantwortet?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Kein Problem! Nutze das <strong>Feedback-Feature</strong> im Menü – schreib deine Frage auf und das Team wird dir helfen. Oder stell die Frage im Planner-Team-Chat.
            </p>
          </section>

          <div className="pt-8 border-t space-y-2">
            <p className="text-xs text-muted-foreground italic">
              Stand: März 2026 | v{version}
            </p>
            <p className="text-xs text-muted-foreground">
              Noch Fragen? Klick hier um <strong>Feedback zu geben</strong> oder kontaktiert einen Admin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
