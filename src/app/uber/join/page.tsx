'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Code2, 
  Users, 
  Rocket, 
  Mail, 
  CheckCircle2, 
  Terminal, 
  Cpu, 
  Globe, 
  Lock,
  MessageSquare,
  Sparkles,
  Zap,
  Coffee
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function JoinTeamPage() {
  const router = useRouter()

  const requirements = [
    { title: "Grundlagen", desc: "HTML, CSS und JavaScript solltest du sicher beherrschen." },
    { title: "React/Next.js", desc: "Erste Erfahrungen mit React sind super, den Rest lernst du hier." },
    { title: "Motivation", desc: "Du hast Lust, den Jahrgang 2027 mit deinen Skills zu unterstützen." },
    { title: "Zuverlässigkeit", desc: "Wir arbeiten im Team – Verlässlichkeit ist das A und O." }
  ]

  const tasks = [
    { title: "Feature Development", desc: "Implementiere neue Module wie Voting-Systeme, Finanz-Tools oder Karten-Features." },
    { title: "Bugfixing", desc: "Spüre Fehler auf und sorge für eine stabile App-Performance." },
    { title: "UI/UX Design", desc: "Mache die App noch schöner und intuitiver mit Tailwind CSS." },
    { title: "Backend & Logic", desc: "Optimiere Firestore-Datenstrukturen und Cloud Functions." }
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-muted/30 border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          <Button 
            variant="ghost" 
            className="gap-2 -ml-2 mb-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
          
          <div className="space-y-4 max-w-2xl">
            <Badge variant="outline" className="px-3 py-1 text-primary border-primary/20 bg-primary/5">
              Developer Onboarding
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Werde Teil des <span className="text-primary">Dev-Teams</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Wir suchen motivierte Köpfe, die Lust haben, den ABI Planer 2027 auf das nächste Level zu heben. 
              Hier erfährst du alles über den Ablauf und wie du einsteigen kannst.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-16">
        
        {/* Why Join? */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" /> Warum mitmachen?
            </h2>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Echtes Projekt:</strong> Arbeite an einer App, die hunderte Schüler täglich nutzen.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Modern Stack:</strong> Lerne professionelle Workflows mit Next.js, Firebase & GitHub.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Impact:</strong> Deine Features erleichtern die Planung für den kompletten Jahrgang.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Portfolio:</strong> Ein cooles Open-Source Projekt macht sich super im Lebenslauf.</span>
              </li>
            </ul>
          </div>
          <Card className="bg-primary/5 border-primary/10 p-6 flex flex-col justify-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full w-fit">
              <Coffee className="h-8 w-8 text-primary" />
            </div>
            <p className="italic text-muted-foreground leading-relaxed">
              "Die App ist zu groß für eine Person geworden. Wir brauchen Teamspirit, neue Ideen und Leute, die Bock auf Code haben."
            </p>
            <p className="font-bold text-sm text-primary">— Maximilian, Lead Developer</p>
          </Card>
        </section>

        {/* Requirements & Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" /> Anforderungen
            </h3>
            <div className="space-y-4">
              {requirements.map((req, i) => (
                <div key={i} className="p-4 bg-muted/40 rounded-xl border border-border/50">
                  <h4 className="font-bold text-sm mb-1">{req.title}</h4>
                  <p className="text-sm text-muted-foreground">{req.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Mögliche Aufgaben
            </h3>
            <div className="space-y-4">
              {tasks.map((task, i) => (
                <div key={i} className="p-4 bg-muted/40 rounded-xl border border-border/50">
                  <h4 className="font-bold text-sm mb-1">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">{task.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Process Timeline */}
        <section className="space-y-8 py-8 bg-muted/20 rounded-3xl p-8 border">
          <h2 className="text-2xl font-bold text-center">Der Bewerbungsprozess</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="space-y-3 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">1</div>
              <h4 className="font-bold">E-Mail schreiben</h4>
              <p className="text-sm text-muted-foreground">Kurze Nachricht an uns mit deinen Erfahrungen.</p>
            </div>
            <div className="space-y-3 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">2</div>
              <h4 className="font-bold">Check & Chat</h4>
              <p className="text-sm text-muted-foreground">Kurzer Call oder Treffen zum Kennenlernen & Onboarding.</p>
            </div>
            <div className="space-y-3 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">3</div>
              <h4 className="font-bold">Code on!</h4>
              <p className="text-sm text-muted-foreground">Du bekommst Zugriff auf das Repo und wir legen los.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <Card className="border-primary/20 shadow-2xl overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="text-center p-8 pb-4">
            <CardTitle className="text-3xl font-bold">Bereit einzusteigen?</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Melde dich jetzt und gestalte die digitale Zukunft unseres Jahrgangs mit.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex flex-col items-center space-y-6">
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 text-center w-full max-w-sm">
              <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">Kontakt-E-Mail</p>
              <p className="text-lg font-mono font-bold">priesnitz.maximilian@icloud.com</p>
            </div>
            <Button size="lg" variant="secondary" className="gap-2 px-12" asChild>
              <a href="mailto:priesnitz.maximilian@icloud.com?subject=Bewerbung Dev-Team ABI Planer">
                <Mail className="h-5 w-5" /> Jetzt E-Mail senden
              </a>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
