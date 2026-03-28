'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Coffee, Heart, PiggyBank } from 'lucide-react'
import Link from 'next/link'

export default function SpendenPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/finanzen">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spenden & Unterstützung</h1>
          <p className="text-muted-foreground">Wie du uns bei der Finanzierung des Abiballs helfen kannst.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full border-primary/20 shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <PiggyBank className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Abikasse</CardTitle>
            <CardDescription>Offizielle Spenden für den Abijahrgang.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Dies ist der offizielle Weg, um für unseren Abijahrgang zu spenden. 
              Alle Beträge auf dieses Konto fließen zu 100% in die Abikasse und werden direkt für die Finanzierung unseres Abiballs und gemeinsamer Aktivitäten verwendet.
            </p>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-primary tracking-wider">Kontoinhaber</p>
                <p className="text-sm font-medium">Abijahrgang 2027 - MPG</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-primary tracking-wider">IBAN</p>
                <p className="text-sm font-mono font-medium">DE12 3456 7890 1234 5678 90</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-primary tracking-wider">Verwendungszweck</p>
                <p className="text-sm font-medium">Spende Abiball [Dein Name]</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Vielen Dank für deine Unterstützung unseres Jahrgangs!
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full border-primary/20 shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Coffee className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Entwickler unterstützen</CardTitle>
            <CardDescription>Ein kleiner Support für die App-Entwicklung.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Diese App wird von mir in meiner Freizeit entwickelt und gepflegt. 
              Wenn dir die App gefällt und du meine Arbeit unterstützen möchtest, freue ich mich über einen virtuellen Kaffee!
            </p>
            <div className="pt-4">
              <Link href="https://buymeacoffee.com/maxilo" target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2">
                  <Coffee className="h-4 w-4" />
                  Kaffee spendieren
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Hinweis: Diese Spenden gehen direkt an den Entwickler (Max) und nicht in die Abikasse des Jahrgangs.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-16 h-16 rounded-full bg-primary/20 items-center justify-center text-primary shrink-0">
              <Heart className="h-8 w-8 fill-current" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Warum spenden?</h3>
              <p className="text-sm text-muted-foreground">
                Eure Spenden helfen uns, die Ticketpreise für alle Mitschüler so gering wie möglich zu halten, 
                damit jeder am Abiball teilnehmen kann – unabhängig vom Geldbeutel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Hast du Fragen zu Spenden oder Sponsoring? <br />
          Melde dich gerne bei unserem Finanz-Team oder über das Feedback-Formular.
        </p>
      </div>
    </div>
  )
}
