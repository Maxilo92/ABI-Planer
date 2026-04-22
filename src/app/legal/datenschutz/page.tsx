'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DatenschutzPage() {
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

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Datenschutzerklärung</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-8 pt-8">
          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">1. Verantwortlicher</h3>
            <p className="text-muted-foreground leading-relaxed">
              Verantwortlich für die Datenverarbeitung in dieser App ist:
              <br />
              Maximilian Priesnitz
              <br />
              Ahornweg 6d
              <br />
              01454 Wachau
              <br />
              E-Mail: priesnitz.maximilian@icloud.com
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">2. Zweck der Verarbeitung</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung personenbezogener Daten erfolgt zur Bereitstellung der Funktionen des ABI Planers, insbesondere zur
              Organisation von Terminen, Abstimmungen, Aufgaben, Finanzen und gruppenbezogenen Informationen des Abiturjahrgangs.
              Zusätzlich verarbeiten wir technische Nutzungsdaten zur Qualitätssicherung, Fehleranalyse und laufenden Weiterentwicklung
              der Plattform.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">3. Verarbeitete Daten</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bei der Nutzung können insbesondere folgende Daten verarbeitet werden:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Name bzw. angezeigter Profilname</li>
              <li>Schul-E-Mail-Adresse</li>
              <li>Nutzungs- und Inhaltsdaten innerhalb der App (z. B. Beiträge, Aufgaben, Abstimmungen, Finanzeinträge)</li>
              <li>Technische Protokolldaten zur Sicherheit und Nachvollziehbarkeit von Änderungen (Logging)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">4. Rechtsgrundlagen</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der App-Funktionen) und Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse an Sicherheit, Stabilität und Missbrauchsprävention). Soweit im Einzelfall erforderlich, erfolgt die Verarbeitung auf
              Grundlage einer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">5. Altersvoraussetzung</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die App richtet sich ausschließlich an Personen ab 16 Jahren. Eine Registrierung und Nutzung durch unter 16-Jährige ist nicht vorgesehen.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">6. Speicherdauer</h3>
            <p className="text-muted-foreground leading-relaxed">
              Personenbezogene Daten werden nur so lange gespeichert, wie dies für die genannten Zwecke erforderlich ist oder gesetzliche
              Aufbewahrungspflichten bestehen. Bei Beendigung der Nutzung werden Daten gelöscht oder anonymisiert, sofern keine rechtlichen Gründe
              entgegenstehen.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">7. Empfänger und Hosting</h3>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Diese App wird über Firebase betrieben. Dabei werden insbesondere folgende Dienste genutzt:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Firebase Hosting (Auslieferung der Website)</li>
                <li>Firebase Authentication (Anmeldung/Benutzerkonto)</li>
                <li>Cloud Firestore (Speicherung der App-Daten)</li>
              </ul>
              <p>
                Anbieter ist Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Eine Verarbeitung durch
                Google LLC (USA) kann nicht ausgeschlossen werden.
              </p>
              <p>
                Soweit Daten in Drittländer (insbesondere die USA) übermittelt werden, erfolgt dies auf Grundlage der von der EU-Kommission
                anerkannten Garantien (insbesondere Standardvertragsklauseln) sowie ggf. weiterer geeigneter Schutzmaßnahmen.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">8. Google AdSense</h3>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Diese Website nutzt Google AdSense, einen Dienst zum Einbinden von Werbeanzeigen der Google Ireland Limited ("Google").
              </p>
              <p>
                Google AdSense verwendet sog. "Cookies", Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website ermöglichen. Google AdSense verwendet auch sog. Web Beacons (unsichtbare Grafiken). Durch diese Web Beacons können Informationen wie der Besucherverkehr auf diesen Seiten ausgewertet werden.
              </p>
              <p>
                Die durch Cookies und Web Beacons erzeugten Informationen über die Benutzung dieser Website (einschließlich Ihrer IP-Adresse) und Auslieferung von Werbeformaten werden an einen Server von Google in den USA oder anderen Drittstaaten übertragen und dort gespeichert. Diese Informationen können von Google an Vertragspartner von Google weitergegeben werden. Google wird Ihre IP-Adresse jedoch nicht mit anderen von Ihnen gespeicherten Daten zusammenführen.
              </p>
              <p>
                <strong>Einwilligungsvorbehalt:</strong> Die Speicherung von AdSense-Cookies und die Aktivierung von Web Beacons erfolgen ausschließlich nach Ihrer ausdrücklichen Einwilligung über unseren Cookie-Banner (Art. 6 Abs. 1 lit. a DSGVO). Ohne Ihre Zustimmung werden keine Cookies durch Google AdSense gesetzt.
              </p>
              <p>
                Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft über die Cookie-Einstellungen widerrufen. Alternativ können Sie die Installation der Cookies durch eine entsprechende Einstellung Ihrer Browser-Software verhindern; wir weisen Sie jedoch darauf hin, dass Sie in diesem Fall gegebenenfalls nicht sämtliche Funktionen dieser Website vollumfänglich nutzen können.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">9. Stripe (Zahlungsabwicklung)</h3>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Wir bieten die Möglichkeit an, digitale Zusatzinhalte über unsere Website zu erwerben. Für die Abwicklung der Zahlungen nutzen wir den Zahlungsdienstleister Stripe. Anbieter für Nutzer im Europäischen Wirtschaftsraum ist Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland ("Stripe").
              </p>
              <p>
                Wenn Sie eine Zahlung über Stripe tätigen, werden Ihre Zahlungsdaten (z. B. Kreditkartennummer, Bankverbindung, Rechnungsadresse) an Stripe übermittelt. Die Übermittlung Ihrer Daten an Stripe erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              </p>
              <p>
                <strong>Stripe Tax:</strong> Zur Einhaltung steuerrechtlicher Verpflichtungen (insbesondere zur korrekten Berechnung der Umsatzsteuer bei digitalen Gütern) nutzt Stripe Ihre Adressdaten, um den steuerrelevanten Ort der Leistung zu bestimmen.
              </p>
              <p>
                Details zum Datenschutz bei Stripe finden Sie in der Datenschutzerklärung von Stripe unter: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">https://stripe.com/de/privacy</a>.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">10. Ihre Rechte</h3>
            <p className="text-muted-foreground leading-relaxed">Sie haben nach der DSGVO insbesondere folgende Rechte:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung bzw. Einschränkung der Verarbeitung (Art. 17, 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen bestimmte Verarbeitungen (Art. 21 DSGVO)</li>
              <li>Beschwerde bei einer Datenschutzaufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">11. Kontakt bei Datenschutzfragen</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bei Fragen zur Datenverarbeitung oder zur Ausübung Ihrer Rechte wenden Sie sich bitte an:
              <br />
              priesnitz.maximilian@icloud.com
            </p>
          </section>

          <div className="pt-8 border-t space-y-2">
            <p className="text-xs text-muted-foreground italic">Stand: 22. April 2026.</p>
            <p className="text-xs text-muted-foreground">
              Hinweis: Diese App ist ein privat betriebenes Projekt und kein offizielles Angebot der Schule.
            </p>
            <p className="text-xs text-muted-foreground">
              Die Plattform wird fortlaufend weiterentwickelt; dabei kann es vereinzelt zu vorübergehenden Funktionsstörungen oder
              Darstellungsfehlern kommen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
