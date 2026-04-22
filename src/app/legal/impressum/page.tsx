'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ImpressumPage() {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length <= 2) {
      router.push('/')
    } else {
      router.back()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 pt-20 px-4">
      <Button 
        variant="ghost" 
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Impressum</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Angaben gemäß § 5 DDG</h3>
            <p className="text-muted-foreground leading-relaxed">
              Maximilian Priesnitz<br />
              Ahornweg 6d<br />
              01454 Wachau<br />
              Deutschland
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Kontakt</h3>
            <p className="text-muted-foreground leading-relaxed">
              E-Mail: priesnitz.maximilian@icloud.com<br />
              Tel: +049 0176 36370172<br />
              Webseite: https://github.com/Maxilo92/ABI-Planer
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Hinweis zur Verantwortlichkeit</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ABI Planer ist ein privat betriebenes Projekt von Schülern für Schüler und kein offizielles Angebot der Schule.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Hinweis zum Entwicklungsstand</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Die Plattform wird fortlaufend technisch und inhaltlich weiterentwickelt. Trotz sorgfältiger Pflege können in
              Einzelfällen vorübergehende Funktionsabweichungen oder Darstellungsfehler auftreten.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Datenschutz</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Informationen zur Verarbeitung personenbezogener Daten finden Sie in der <Link href="/legal/datenschutz" className="underline hover:text-primary">Datenschutzerklärung</Link>.
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
            Stand: 22. April 2026.
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
