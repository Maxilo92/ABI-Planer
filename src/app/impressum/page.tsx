'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ImpressumPage() {
  const router = useRouter()

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <Button 
        variant="ghost" 
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Impressum</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Angaben gemäß § 5 TMG</h3>
            <p className="text-muted-foreground leading-relaxed">
              Maximilian Priesnitz<br />
              Wohnhaft in Feldschlösschen<br />
              Deutschland
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Kontakt</h3>
            <p className="text-muted-foreground leading-relaxed">
              E-Mail: priesnitz.maximilian@icloud.com<br />
              Webseite: https://github.com/Maxilo92/ABI-Planer
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Haftung für Inhalte</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Urheberrecht</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <section className="pt-4 text-xs text-muted-foreground italic border-t">
            Hinweis: Dies ist ein Schul-Projekt für den Abiturjahrgang 2027.
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
