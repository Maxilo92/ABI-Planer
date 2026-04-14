'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShieldCheck, Printer, ShoppingBag, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SammelkartenAGBPage() {
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
            <CardTitle className="text-2xl font-bold tracking-tight">Besondere Bedingungen für Sammelkarten</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-8 pt-8">
          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> 1. Datennutzung und Rechteeinräumung
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Mit der Einreichung von Inhalten (Name, Bild, Texte, Angriffe) für eine Sammelkarte im ABI Planer räumst du dem Betreiber der Plattform ein einfaches, zeitlich und räumlich unbeschränktes Recht ein, diese Inhalte für die Erstellung, Darstellung und den Vertrieb der Sammelkarten zu nutzen.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" /> 2. Physische Reproduktion (Druck)
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Wir behalten uns ausdrücklich das Recht vor, die auf der Plattform erstellten digitalen Sammelkarten zu einem späteren Zeitpunkt als reale, physisch gedruckte Karten zu produzieren. Dies kann sowohl zum Zweck der Erinnerung für den Jahrgang als auch zum Verkauf an Dritte geschehen.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" /> 3. Kommerzieller Vertrieb
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Der Verkauf gedruckter Sammelkarten dient primär der Finanzierung des Abiturjahrgangs 2027 (Abikasse). Durch die Einreichung deiner Daten stimmst du zu, dass dein Name und dein Bild auf diesen kommerziell vertriebenen Produkten erscheinen können. Ein Anspruch auf eine finanzielle Beteiligung am Verkaufserlös besteht für den einzelnen Nutzer nicht; die Erlöse fließen gemäß den allgemeinen AGB in die Stufenkasse.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> 4. Widerruf der Zustimmung
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Eine einmal erteilte Zustimmung zur Nutzung der Daten für gedruckte Karten kann nur aus wichtigem Grund widerrufen werden, sofern der Produktionsprozess (Druckauftrag) noch nicht eingeleitet wurde. Nach erfolgtem Druck ist ein Widerruf für die bereits produzierten Exemplare ausgeschlossen.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> 5. Anpassung von Kartendetails
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Wir behalten uns das Recht vor, die vom Nutzer eingereichten Kartendetails (insbesondere Seltenheitsstufe, Angriffsnamen, Schadenswerte und Beschreibungen) jederzeit anzupassen. Dies dient der Gewährleistung der Spielbalance (Balancing) sowie der technischen Umsetzbarkeit im Druckprozess. Ein Anspruch auf eine bestimmte Seltenheit oder unveränderte Übernahme der Texte besteht nicht.
            </p>
          </section>

          <div className="pt-8 border-t space-y-2">
            <p className="text-xs text-muted-foreground italic">
              Stand: 14. April 2026. Ergänzung zu den Allgemeinen Geschäftsbedingungen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
