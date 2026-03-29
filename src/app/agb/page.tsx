'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AGBPage() {
  const router = useRouter()

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
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-8 pt-8">
          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">1. Geltungsbereich</h3>
            <p className="text-muted-foreground leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung des "ABI Planer" (im Folgenden "Plattform" genannt). Die Plattform ist ein privates Organisations-Tool für den Abiturjahrgang 2027 des HGR. Durch die Registrierung und Nutzung erklären Sie sich mit diesen Bedingungen einverstanden.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">2. Nutzung des Dienstes</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Plattform dient ausschließlich der Organisation und Planung von Aktivitäten rund um den Abiturjahrgang 2027. Die Nutzung ist Mitgliedern des Jahrgangs vorbehalten, die über eine offizielle E-Mail-Adresse (@hgr-web.lernsax.de) verfügen. Eine Registrierung und Nutzung ist nur für Personen zulässig, die mindestens 16 Jahre alt sind.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">3.1 Kein offizielles Angebot der Schule</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Plattform wird privat betrieben und ist kein offizielles digitales Angebot der Schule. Eine Nutzung von Schul-E-Mail-Adressen erfolgt ausschließlich zur Zuordnung zum Jahrgang und begründet keine Trägerschaft oder Verantwortung der Schule.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">3. Nutzerpflichten</h3>
            <p className="text-muted-foreground leading-relaxed">
              Nutzer verpflichten sich, die Plattform nicht missbräuchlich zu verwenden. Insbesondere sind beleidigende, diskriminierende oder rechtswidrige Inhalte untersagt. Die Administratoren behalten sich das Recht vor, Inhalte zu moderieren und Nutzer bei Verstößen von der Plattform auszuschließen.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">4. Datenschutz & Logging</h3>
            <p className="text-muted-foreground leading-relaxed">
              Wir nehmen den Schutz Ihrer persönlichen Daten ernst. Zur Gewährleistung der Datensicherheit und Rückverfolgbarkeit von Aktionen (z.B. Finanz-Updates, Abstimmungen) werden Nutzeraktionen protokolliert (Logging). Details entnehmen Sie bitte unserer Datenschutzerklärung.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">5. Haftung</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Plattform wird auf freiwilliger Basis von Schülern für Schüler betrieben. Eine Haftung für die Richtigkeit der eingetragenen Daten (insbesondere bei Finanzen) oder für die ständige Verfügbarkeit des Dienstes wird ausgeschlossen. Die Plattform dient lediglich als Planungshilfe.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">6. Kauf digitaler Inhalte (Booster-Shop)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Nutzer haben die Möglichkeit, digitale Zusatzinhalte (Booster-Packs für das Sammelkarten-Spiel) gegen Entgelt zu erwerben. Die Abwicklung erfolgt über den externen Zahlungsdienstleister Stripe. 
              <br /><br />
              <strong>Spendenzweck:</strong> Mit dem Kauf unterstützen Sie direkt den Abiturjahrgang 2027. Von jedem Brutto-Verkaufspreis fließen 90% in die Stufenkasse (Abikasse) zur Finanzierung des Abiballs und anderer Jahrgangsaktivitäten. Die restlichen 10% dienen der Deckung von Transaktionsgebühren, Steuern und Serverkosten.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">7. Widerrufsbelehrung & Erlöschen des Widerrufsrechts</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bei dem Kauf von Booster-Packs handelt es sich um die Bereitstellung digitaler Inhalte, die nicht auf einem körperlichen Datenträger geliefert werden. 
              <br /><br />
              <strong>Erlöschen des Widerrufsrechts:</strong> Das Widerrufsrecht erlischt vorzeitig, wenn wir mit der Ausführung des Vertrages begonnen haben (Zustellung der digitalen Booster im Nutzerprofil), nachdem Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnen, und Sie Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht verlieren.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">8. Schlussbestimmungen</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt. Gerichtsstand ist, soweit zulässig, der Standort der Schule.
            </p>
          </section>

          <div className="pt-8 border-t space-y-2">
            <p className="text-xs text-muted-foreground italic">
              Stand: 29. März 2026. Dies ist ein privat betriebenes Schul-Projekt des Abiturjahrgangs 2027.
            </p>
            <p className="text-xs text-muted-foreground">
              Projekt-Link: <a href="https://github.com/Maxilo92/ABI-Planer" className="underline hover:text-primary">GitHub Repository</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
