'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Coffee, Heart, PiggyBank, CreditCard, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function SpendenPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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

      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Spendenziel offen sichtbar
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Drei Wege, uns direkt zu unterstützen</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                Wähle die Variante, die für dich am einfachsten ist. Direkte Überweisung landet vollständig in der Abikasse.
                Buy Me a Coffee unterstützt die App. Stripe ist die schnelle Kartenzahlung, aber durch Plattform- und Zahlungsgebühren kommt nicht der volle Betrag an.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Finanzziel</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-extrabold">10.000 €</span>
                <span className="pb-1 text-xs text-muted-foreground">für den Abiball</span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[42%] rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Angezeigtes Beispiel. Der echte Fortschritt wird später live aus den Finanzen geladen.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col h-full border-primary/20 shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <PiggyBank className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Direkte Kontoüberweisung</CardTitle>
            <CardDescription>Der sauberste Weg: 100% für die Abikasse.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Dies ist die direkte Überweisung auf das Kontos des Jahrgangs. Es fallen keine Plattformgebühren an und der Betrag wird vollständig für den Abiball verwendet.
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              Ideal für größere Beträge und direkte Unterstützung ohne Abzüge.
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
            <CardTitle className="text-2xl font-bold">Buy Me a Coffee</CardTitle>
            <CardDescription>Für die App-Weiterentwicklung und den Betrieb.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Wenn dir der Abi Planer hilft, kannst du die Weiterentwicklung hier direkt unterstützen. Das ist praktisch für kleine Beträge und schnelle Dankeschön-Spenden.
            </p>
            <div className="pt-4">
              <a href="https://buymeacoffee.com/maxilo" target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2">
                  <Coffee className="h-4 w-4" />
                  Kaffee spendieren
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Hinweis: Diese Unterstützung geht an den Entwickler und nicht in die Abikasse des Jahrgangs.
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full border-primary/20 shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Stripe / Kartenzahlung</CardTitle>
            <CardDescription>Schnell per Karte spenden, aber nicht ohne Abzüge.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Wenn du direkt per Karte oder Wallet zahlen willst, ist Stripe die bequemste Lösung. Sie ist gut für spontane Spenden und kleine Beträge geeignet.
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              Hinweis: Über Stripe kommen wegen Plattform- und Zahlungsgebühren nicht 100% des Betrags bei uns an.
            </div>
            <div className="pt-2">
              <Link href="/shop?category=extras">
                <Button className="w-full gap-2" variant="outline">
                  <CreditCard className="h-4 w-4" />
                  Zu den Stripe-Spenden
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Dafür ist es oft der schnellste Weg, wenn du sofort online spenden willst.
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
