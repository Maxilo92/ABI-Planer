'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Code2, Users, Zap, Shield, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UberPage() {
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
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Über ABI Planer</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-8 pt-8">
          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Was ist ABI Planer?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Der ABI Planer ist eine <strong>zentrale Plattform für die Planung und Organisation des Abiturs 2027</strong>. Statt alles in verschiedenen Excel-Tabellen, Notizbüchern und Handy-Notizen zu verwalten, haben Planer und Organisatoren hier ein System, das wirklich funktioniert.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Die App wurde <strong>von Schülern für Schüler</strong> entwickelt – mit allen Features, die ihr wirklich braucht, nicht mit Überflüssigem.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Core Features</h3>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">Dashboard</span>
                <p>Countdown bis zum Ball, Finanzstatus, Aufgaben-Übersicht, News & aktuelle Rankings – alles auf einen Blick</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">Kalender</span>
                <p>Zentrale Verwaltung aller Termine, Events & Deadlines mit Details pro Event</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">Aufgaben</span>
                <p>To-Do Listen mit Prioritäten, Status-Tracking (offen/in Progress/erledigt) & Zuweisung</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">Finanzen</span>
                <p>Einnahmen & Ausgaben tracking, Finanzierungsziel-Progress, Kontostand-Übersicht</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">News</span>
                <p>Zentrale Kommunikation mit Bildern, Links & Ankündigungen</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">Abstimmungen</span>
                <p>Schnelle Live-Umfragen für Gruppen-Entscheidungen mit Live-Results</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">Gruppen</span>
                <p>Planungs-Teams mit Mitgliedern, Rollen & Gruppen-Wall</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Technische Architektur</h3>
            <div className="bg-muted/40 rounded-lg p-4 space-y-3 text-sm font-mono text-muted-foreground">
              <p><strong>Frontend:</strong> Next.js 16 + React 19 + TypeScript</p>
              <p><strong>Styling:</strong> Tailwind CSS 4 + shadcn/ui Components</p>
              <p><strong>Backend:</strong> Firebase (Authentication + Cloud Firestore)</p>
              <p><strong>Hosting:</strong> Firebase App Hosting (Auto-Deploy)</p>
              <p><strong>Database:</strong> Cloud Firestore (NoSQL, Echtzeit-Sync)</p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Die App ist <strong>responsive</strong> und funktioniert perfekt auf Laptop, Tablet & Handy. Dark Mode ist natürlich auch dabei.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Sicherheit & Datenschutz</h3>
            <ul className="list-none space-y-2 text-muted-foreground leading-relaxed">
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Lernsax-Integration:</strong> Nur @hgr-web.lernsax.de Adressen dürfen sich registrieren</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Firestore Security Rules:</strong> Zero-Trust Modell – Nutzer sehen nur ihre Daten</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Rollen-System:</strong> Admin/Planner/Viewer mit granularen Berechtigungen</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Action Logging:</strong> Alle kritischen Aktionen (Finanzen, Admin-Changes) werden protokolliert</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>HTTPS & Encryption:</strong> Alle Daten in Transit & at Rest verschlüsselt</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Team & Credits</h3>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>Entwickelt von:</strong> Maximilian (Developer)
              </p>
              <p>
                <strong>Unterstützung:</strong> Das komplette Planner-Team für Feedback, Testing & Ideen
              </p>
              <p>
                <strong>Built with:</strong> Next.js, Firebase, TypeScript, Tailwind CSS, shadcn/ui
              </p>
              <p className="text-xs text-muted-foreground italic">
                Spezial-Dank an alle, die Testing-Feedback gegeben haben. Ihr habt diese App besser gemacht.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Roadmap & Zukunft</h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <div>
                <p className="font-semibold text-foreground mb-1">v1.0.0 (JETZT)</p>
                <p>Launch! Alle Core Features, Testing Phase vorbei, Production Ready.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">v1.1.0 (April 2026)</p>
                <p>Kalender-Export (iCal), erweiterte Reports, frühe Mobile App Tests</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">v2.0.0+ (Nach Abi)</p>
                <p>Reusable Template für nächste Jahrgänge, Multi-School Support, erweiterte Integrationen</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Feedback & Kontakt</h3>
            <p className="text-muted-foreground leading-relaxed">
              Du hast einen Fehler gefunden? Eine Feature-Idee? Verbesserungs-Vorschlag? 
              <strong> Nutze das Feedback-Feature im Menü (Menü → Feedback)</strong> – das geht direkt an die Entwickler!
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Du interessierst dich für den Code? Das Projekt ist Open Source! 
              <a href="https://github.com" className="text-primary hover:underline"> Schau auf GitHub vorbei.</a>
            </p>
          </section>

          <div className="pt-8 border-t space-y-2">
            <p className="text-xs text-muted-foreground italic">
              Gebaut mit Passion für den Abiturjahrgang 2027
            </p>
            <p className="text-xs text-muted-foreground">
              Version 1.0.0 | März 2026
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
