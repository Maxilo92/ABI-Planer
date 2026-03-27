'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Heart, PiggyBank, School } from 'lucide-react'
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
              <School className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Am Max</CardTitle>
            <CardDescription>Spenden direkt vor Ort in der Schule.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Du kannst uns direkt am Max-Planck-Gymnasium unterstützen. 
              Wir sind regelmäßig bei Schulveranstaltungen, Elternabenden oder in den Pausen mit einem Stand vertreten.
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Möglichkeiten:</h4>
              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                <li>Kuchenverkauf in den Pausen</li>
                <li>Getränkeverkauf bei Konzerten</li>
                <li>Direkte Barspenden in unsere Sammelbüchse</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Alle Einnahmen vor Ort fließen zu 100% in die Abikasse und werden für den Abiball verwendet.
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full border-primary/20 shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <PiggyBank className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Abikasse</CardTitle>
            <CardDescription>Überweisungen und digitale Spenden.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Für größere Beträge oder wenn du nicht persönlich vorbeikommen kannst, 
              ist eine Überweisung direkt auf unser Abikonto der einfachste Weg.
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
              Auf Wunsch stellen wir gerne eine private Spendenquittung aus (bitte Name im Verwendungszweck angeben).
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
