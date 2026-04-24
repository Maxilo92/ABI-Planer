'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  ArrowRight,
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
  Coffee,
  Heart,
  LayoutDashboard,
  Calendar,
  Trello,
  PiggyBank,
  Newspaper,
  Vote,
  ChevronRight,
  Github,
  Monitor
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function JobsPage() {
  const router = useRouter()
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.34.00'

  const roles = [
    {
      title: "Frontend Developer",
      badge: "React / Next.js",
      desc: "Implementiere neue Module wie Voting-Systeme oder Finanz-Tools mit Tailwind CSS.",
      icon: <Monitor className="h-6 w-6 text-blue-500" />
    },
    {
      title: "Backend Enthusiast",
      badge: "Firebase / NoSQL",
      desc: "Optimiere Datenstrukturen, Security Rules und Cloud Functions für maximale Performance.",
      icon: <Terminal className="h-6 w-6 text-emerald-500" />
    },
    {
      title: "UI/UX Designer",
      badge: "Aesthetic / Logic",
      desc: "Mache die App noch intuitiver und sorge für einen modernen Look auf allen Geräten.",
      icon: <Sparkles className="h-6 w-6 text-purple-500" />
    }
  ]

  const benefits = [
    { title: "Real Impact", desc: "Arbeite an einer App, die hunderte Schüler täglich nutzen.", icon: <Rocket className="h-5 w-5" /> },
    { title: "Modern Stack", desc: "Lerne professionelle Workflows mit Next.js, Firebase & GitHub.", icon: <Cpu className="h-5 w-5" /> },
    { title: "Portfolio-Boost", desc: "Ein cooles Open-Source Projekt macht sich perfekt im Lebenslauf.", icon: <LayoutDashboard className="h-5 w-5" /> }
  ]

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-muted/30 border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-24 relative">
          <Button 
            variant="ghost" 
            className="gap-2 -ml-2 mb-8 text-muted-foreground hover:text-foreground transition-all"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
          </Button>
          
          <div className="space-y-6 max-w-3xl">
            <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px] font-bold">
              Karriere & Mitarbeit
            </Badge>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Gestalte die Zukunft <br />
              <span className="text-primary text-2027-gradient">eures Jahrgangs</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-medium">
              Der ABI Planer wächst – und wir brauchen dich! Werde Teil des Teams und entwickle die Plattform weiter, die hunderte Schüler täglich begleitet.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-32 py-20">
        
        {/* Mission & Stats - Editorial Style */}
        <section className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/5 border border-red-500/10 text-red-600 dark:text-red-500 text-[10px] font-bold uppercase tracking-wider">
               <Heart className="h-3.5 w-3.5" />
               <span>Unsere Mission</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight uppercase italic">
              Warum wir <br />Verstärkung suchen
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed text-lg md:text-xl font-medium">
              <p>
                ABI Planer ist von einem kleinen Tool zu einer mächtigen Plattform gewachsen. 
                Was als einfaches Hobbyprojekt begann, koordiniert heute ganze Jahrgänge.
              </p>
              <p>
                Die Wartung, Bugfixes und neue Innovationen alleine zu stemmen ist mittlerweile fast unmöglich. 
                Wir suchen motivierte Köpfe, die Lust auf echte Softwareentwicklung haben und Verantwortung übernehmen wollen.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-4 w-full lg:w-64 shrink-0">
             <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-4xl font-black text-primary">100%</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Open Source</span>
             </div>
             <div className="p-8 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-4xl font-black text-blue-500">80k+</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Zeilen Code</span>
             </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic">Deine Vorteile</h2>
            <div className="h-1.5 w-20 bg-primary/20 mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="space-y-4 p-8 bg-muted/30 rounded-[2rem] border border-border/50 hover:border-primary/30 transition-all group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Roles - Linear List instead of Cards */}
        <section className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic">Offene Rollen</h2>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Wähle deinen Pfad</p>
          </div>
          
          <div className="divide-y divide-border/40">
            {roles.map((role, i) => (
              <div key={i} className="group py-12 flex flex-col md:flex-row items-start md:items-center gap-8 first:pt-0">
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {role.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">{role.title}</h3>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold text-[10px] px-3">{role.badge}</Badge>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl">
                      {role.desc}
                    </p>
                  </div>
                  <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all" onClick={() => window.location.href = 'mailto:priesnitz.maximilian@icloud.com?subject=Bewerbung ' + role.title}>
                    Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section className="bg-zinc-900 text-zinc-100 p-8 md:p-16 rounded-[3rem] space-y-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Terminal className="h-64 w-64" />
          </div>
          
          <div className="relative space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic">Das solltest du mitbringen</h2>
              <p className="text-zinc-400 font-medium max-w-xl">Wir erwarten keine Profis – Motivation und Lernbereitschaft zählen mehr als Jahre an Erfahrung.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { title: "Basics", text: "Grundkenntnisse in HTML & CSS." },
                { title: "Motivation", text: "Bock auf ein echtes Projekt." },
                { title: "Teamplay", text: "Zuverlässige Kommunikation." },
                { title: "AI Friendly", text: "Verständnis für Prompt Engineering." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{item.title}</p>
                    <p className="text-zinc-500 text-sm font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-6 py-20 rounded-[3rem] bg-primary overflow-hidden text-center space-y-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          
          <div className="relative space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">Bereit einzusteigen?</h2>
            <p className="text-primary-foreground/90 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              Melde dich jetzt und gestalte die digitale Plattform für unseren Jahrgang aktiv mit. Keine langen Bewerbungen, nur eine kurze Mail.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center relative pt-4">
            <Button size="lg" variant="secondary" className="h-16 px-12 rounded-2xl font-bold shadow-xl group" asChild>
              <a href="mailto:priesnitz.maximilian@icloud.com?subject=Bewerbung ABI Planer Team">
                <Mail className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" /> Jetzt bewerben
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl bg-transparent border-white/30 text-white hover:bg-white/10 font-bold" asChild>
              <a href="https://github.com/Maxilo92/ABI-Planer" target="_blank"><Github className="mr-2 h-5 w-5" /> Codebase prüfen</a>
            </Button>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center space-y-4 pt-12 border-t border-border/40 opacity-50">
          <p className="text-sm italic font-medium flex items-center justify-center gap-2">
            Gebaut mit <Heart className="h-3 w-3 fill-current text-red-500" /> für den Abiturjahrgang 2027
          </p>
          <p className="text-xs font-mono uppercase tracking-widest font-bold">
            Version {version} | 80.620 Zeilen Code
          </p>
        </div>

      </div>
    </div>
  )
}
