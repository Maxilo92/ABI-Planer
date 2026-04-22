'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Code2, 
  Users, 
  Zap, 
  Shield, 
  Heart, 
  LayoutDashboard, 
  Calendar, 
  Trello, 
  PiggyBank, 
  Newspaper, 
  Vote, 
  MessagesSquare,
  Terminal,
  Cpu,
  Globe,
  Lock,
  Rocket,
  Github,
  MessageCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UberPage() {
  const router = useRouter()
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'

  const features = [
    {
      icon: <LayoutDashboard className="h-6 w-6 text-blue-500" />,
      title: "Dashboard",
      description: "Countdown, Finanzen, Aufgaben & News – alles Wichtige auf einen Blick."
    },
    {
      icon: <Calendar className="h-6 w-6 text-emerald-500" />,
      title: "Kalender",
      description: "Zentrale Verwaltung aller Termine, Events & Deadlines für den Jahrgang."
    },
    {
      icon: <Trello className="h-6 w-6 text-orange-500" />,
      title: "Aufgaben",
      description: "To-Do Listen mit Prioritäten, Status-Tracking & Zuweisung an Teams."
    },
    {
      icon: <PiggyBank className="h-6 w-6 text-pink-500" />,
      title: "Finanzen",
      description: "Einnahmen & Ausgaben Tracking, Progress-Bars & Kontostands-Übersicht."
    },
    {
      icon: <Newspaper className="h-6 w-6 text-purple-500" />,
      title: "News",
      description: "Zentrale Kommunikation mit Bildern, Links & Ankündigungen für alle."
    },
    {
      icon: <Vote className="h-6 w-6 text-yellow-500" />,
      title: "Abstimmungen",
      description: "Schnelle Live-Umfragen für wichtige Entscheidungen im Jahrgang."
    }
  ]

  const securityFeatures = [
    { title: "Lernsax-Integration", description: "Nur @hgr-web.lernsax.de Adressen", icon: <Lock className="h-4 w-4" /> },
    { title: "Zero-Trust Modell", description: "Granulare Firestore Security Rules", icon: <Shield className="h-4 w-4" /> },
    { title: "HTTPS & Encryption", description: "Verschlüsselt in Transit & at Rest", icon: <Globe className="h-4 w-4" /> },
    { title: "Action Logging", description: "Protokollierung kritischer Änderungen", icon: <Terminal className="h-4 w-4" /> }
  ]

  const roadmap = [
    { version: "v1.0.0", date: "März 2026", status: "completed", title: "Der Release", desc: "Launch der Core-Features, Production Ready." },
    { version: "v1.1.0", date: "April 2026", status: "current", title: "Optimization", desc: "Kalender-Export, Reports & Mobile Optimization." },
    { version: "v2.0.0+", date: "Zukunft", status: "planned", title: "Expansion", desc: "Multi-School Support & Reusable Templates." }
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-muted/30 border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-16 relative">
          <Button 
            variant="ghost" 
            className="gap-2 -ml-2 mb-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
          
          <div className="space-y-4 max-w-2xl">
            <Badge variant="outline" className="px-3 py-1 text-primary border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              Über das Projekt
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700">
              ABI Planer <span className="text-primary text-2027-gradient">2027</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Die zentrale Plattform für die Planung und Organisation eures Abiturjahrgangs. 
              Entwickelt von Schülern für Schüler – smart, sicher und effizient.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8 space-y-16">
        
        {/* Quick Stats / Intro Card */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-primary/10 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" /> Unsere Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              Wir wollten das Chaos aus Excel-Tabellen und WhatsApp-Gruppen beenden. 
              Der ABI Planer bündelt alle wichtigen Fäden an einem Ort: Finanzen, Termine und Aufgaben. 
              Damit ihr euch auf das konzentrieren könnt, was zählt: Euer Abi (und die Party danach).
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 bg-primary/5 flex flex-col justify-center items-center p-6 text-center space-y-2">
            <div className="p-3 bg-primary/10 rounded-full mb-2">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Community Focus</div>
          </Card>
        </section>

        {/* Features Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Alles was ihr braucht</h2>
            <p className="text-muted-foreground">Ein komplettes Ökosystem für euren Jahrgang.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/50">
                <CardHeader>
                  <div className="p-2 w-fit bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Roadmap & Team Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Roadmap */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Rocket className="h-7 w-7 text-primary" /> Roadmap
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
              {roadmap.map((item, i) => (
                <div key={i} className="relative flex items-start gap-6 group">
                  <div className={`mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-colors ${
                    item.status === 'completed' ? 'border-primary bg-primary/10 text-primary' : 
                    item.status === 'current' ? 'border-primary ring-4 ring-primary/10 text-primary' : 
                    'border-muted text-muted-foreground'
                  }`}>
                    {item.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{item.version}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0">{item.date}</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Team & Credits */}
          <section className="space-y-8 bg-muted/30 p-8 rounded-3xl border">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" /> Team & Credits
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border shadow-sm group hover:border-primary/30 transition-colors">
                <Avatar className="h-16 w-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                  <AvatarImage src="/maximilian.jpg" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">MX</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-xl font-bold">Maximilian</h4>
                  <p className="text-primary font-medium text-sm">Main Developer & Architect</p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                      <a href="https://github.com/Maxilo92" target="_blank"><Github className="h-4 w-4" /></a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Special Thanks</h5>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-background/50">Planner Team</Badge>
                  <Badge variant="outline" className="bg-background/50">Beta Tester</Badge>
                  <Badge variant="outline" className="bg-background/50">HGR Web Support</Badge>
                  <Badge variant="outline" className="bg-background/50">Feedback Heroes</Badge>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  Ein besonderer Dank geht an alle, die durch ihr Feedback, ihre Ideen und das Testen von Bugs geholfen haben, diese App zu dem zu machen, was sie heute ist.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Tech Stack & Security - Bento Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Technik & Sicherheit</h2>
            <p className="text-muted-foreground">Moderne Standards für eure Daten.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-zinc-900 text-zinc-100 border-zinc-800 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Cpu className="h-32 w-32" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Terminal className="h-5 w-5" />
                  <span className="text-xs font-mono uppercase tracking-widest">Stack.info</span>
                </div>
                <CardTitle className="text-2xl pt-2">Powered by Modern Web Tech</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono opacity-80">
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Next.js 16</div>
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-yellow-400" /> Firebase</div>
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Tailwind 4</div>
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-600" /> TypeScript</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Security First</CardTitle>
                <CardDescription>Zero Compromises</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {securityFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                      {f.icon}
                    </div>
                    <span className="font-medium">{f.title}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-primary rounded-3xl p-8 md:p-12 text-primary-foreground text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="relative space-y-4">
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors px-4 py-1">
              Verstärkung gesucht
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold">Werde Teil des Teams</h2>
            <p className="text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed text-lg">
              Der ABI Planer wächst – und wir brauchen dringend Unterstützung! Die Weiterentwicklung alleine zu stemmen ist eine riesige Aufgabe. 
              <strong> Wenn du Lust auf React, TypeScript oder Firebase hast, melde dich.</strong> 
              Jede helfende Hand macht die App für uns alle besser!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center relative pt-4">
            <Button variant="secondary" size="lg" className="gap-2 px-8" onClick={() => router.push('/uber/join')}>
              <Users className="h-5 w-5" /> Jetzt Teil des Teams werden
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10 gap-2 px-8" asChild>
              <a href="https://github.com/Maxilo92/ABI-Planer" target="_blank"><Github className="h-5 w-5" /> Quellcode ansehen</a>
            </Button>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center space-y-2 pt-8 border-t opacity-60">
          <p className="text-sm italic flex items-center justify-center gap-2">
            Gebaut mit <Heart className="h-3 w-3 fill-current text-red-500" /> für den Abiturjahrgang 2027
          </p>
          <p className="text-xs font-mono">
            Version {version} | ABI Planer OS
          </p>
        </div>

      </div>
    </div>
  )
}
