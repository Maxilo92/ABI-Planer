'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Coffee, ShieldCheck, Server, Globe, Database, Heart, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function EntwicklerSpendenPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App-Support & Infrastruktur</h1>
          <p className="text-muted-foreground">Sichere den Betrieb und die Weiterentwicklung des ABI Planers.</p>
        </div>
      </div>

      <Card className="border-brand/20 bg-gradient-to-br from-brand/10 via-background to-background shadow-lg">
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-background/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand">
                <ShieldCheck className="h-3.5 w-3.5" />
                Transparente Betriebskosten
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Warum wir eure Hilfe brauchen</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                Der ABI Planer ist ein privates Projekt, das werbefrei und für alle Jahrgänge kostenlos bleibt. 
                Dennoch fallen monatliche Kosten für Server, Datenbanken, Domain und die technische Infrastruktur an. 
                Dieser Support-Pool ist <strong>strikt von der Abikasse getrennt</strong> und dient ausschließlich 
                der Deckung dieser Ausgaben.
              </p>
            </div>

            <div className="rounded-2xl border border-brand/10 bg-background/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                  <Server className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">Hosting & Server</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Database className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">Datenbanken (Firebase)</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">Domain & SSL</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full border-brand/20 shadow-lg relative overflow-hidden">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-4 text-brand">
              <ExternalLink className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Direkter Online-Support</CardTitle>
            <CardDescription>Schnelle Unterstützung via Buy Me a Coffee (PayPal/Karte).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Über Buy Me a Coffee kannst du ganz unkompliziert kleine Beträge spenden. 
              Dies ist der einfachste Weg, danke zu sagen und die monatlichen Fixkosten (Server & Datenbanken) zu decken.
            </p>
            <div className="pt-4">
              <a href="https://buymeacoffee.com/maxilo" target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full gap-2 h-12 text-lg font-bold bg-brand hover:bg-brand/90 text-white border-none shadow-md">
                  App-Support geben
                  <ExternalLink className="h-4 w-4 ml-1 opacity-50" />
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Sichere Zahlung via PayPal, Karte oder Apple/Google Pay.
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full border-brand/20 shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-4 text-brand">
              <Server className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Bankverbindung (Infrastruktur)</CardTitle>
            <CardDescription>Unterstützung ohne Plattform-Gebühren.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm leading-relaxed">
              Für größere Beträge oder wenn du keine Online-Zahlungsanbieter nutzen möchtest, kannst du die Infrastruktur-Kosten auch direkt per Überweisung decken.
            </p>
            <div className="bg-brand/5 p-4 rounded-xl border border-brand/10 space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-brand tracking-wider">Empfänger</p>
                <p className="text-sm font-medium">Maximilian Priesnitz</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-brand tracking-wider">IBAN</p>
                <p className="text-sm font-mono font-medium">DE43 2004 1177 0662 0223 00</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-brand tracking-wider">BIC</p>
                <p className="text-sm font-mono font-medium">COBADEHD077</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-brand tracking-wider">Verwendungszweck</p>
                <p className="text-sm font-medium italic">ABI Planer Infrastruktur</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Wichtig: Diese Spenden fließen an den Betrieb der Plattform, NICHT in die Abikasse eures Jahrgangs.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Du möchtest stattdessen Geld für euren Abiball einzahlen? <br />
          <Link href="/finanzen/spenden/abi" className="text-brand font-bold hover:underline underline-offset-4">
            Hier geht es zur Abikasse &rarr;
          </Link>
        </p>
      </div>
    </div>
  )
}
