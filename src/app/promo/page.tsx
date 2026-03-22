'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Check, 
  X, 
  LogIn, 
  UserPlus, 
  Users, 
  Gift, 
  CheckCircle2, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Database,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { redirect } from 'next/navigation'

export default function PromoAuthPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if already logged in
  if (user) {
    redirect('/')
  }

  const features = [
    { name: 'Aktuelle News & Termine lesen', guest: true, user: true, icon: <Calendar className="h-4 w-4" /> },
    { name: 'Umfragen einsehen (ohne Abstimmung)', guest: true, user: true, icon: <MessageSquare className="h-4 w-4" /> },
    { name: 'Finanzstatus einsehen', guest: true, user: true, icon: <Clock className="h-4 w-4" /> },
    { name: 'An Umfragen teilnehmen & mitbestimmen', guest: false, user: true, icon: <CheckCircle2 className="h-4 w-4" /> },
    { name: 'Sammelkarten-Spielfortschritt', guest: false, user: true, icon: <Gift className="h-4 w-4" /> },
    { name: 'Eigene To-Do Listen & Checklisten', guest: false, user: true, icon: <CheckCircle2 className="h-4 w-4" /> },
    { name: 'Teilnahme an Planungsgruppen', guest: false, user: true, icon: <Users className="h-4 w-4" /> },
    { name: 'News kommentieren & Feedback geben', guest: false, user: true, icon: <MessageSquare className="h-4 w-4" /> },
    { name: 'Sichere Datenspeicherung (Cross-Browser)', guest: false, user: true, icon: <Database className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20">
            Account Vorteile
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase italic leading-none">
            Dein Abi. <br />
            <span className="text-primary drop-shadow-[0_2px_10px_rgba(var(--primary-rgb),0.3)]">Dein Account.</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto font-medium">
            Du kannst den Abi-Planer zwar als Gast nutzen, aber erst mit einem Account entfaltet sich die volle Power der ABI '27 Organisation.
          </p>
        </div>

        {/* Feature Cards / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="h-32 w-32 -rotate-12 translate-x-8 -translate-y-8" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold uppercase tracking-wide">
                Gast-Besuch
              </CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                Nur das Nötigste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                Deine Daten sind nur lokal in diesem Browser gespeichert. Wenn du den Cache löschst oder das Gerät wechselst, sind deine Votes und Fortschritte weg.
              </p>
              <ul className="space-y-3">
                {features.filter(f => f.guest).map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-medium text-foreground/80">
                    <div className="bg-muted p-1.5 rounded-full"><Check className="h-3 w-3 text-muted-foreground" /></div>
                    {feature.name}
                  </li>
                ))}
                {features.filter(f => !f.guest).map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-medium text-muted-foreground/40 line-through">
                    <div className="bg-muted/50 p-1.5 rounded-full opacity-50"><X className="h-3 w-3" /></div>
                    {feature.name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-primary/5 relative overflow-hidden group shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <Gift className="h-32 w-32 -rotate-12 translate-x-8 -translate-y-8" />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-wide text-primary">
                  Premium Account
                </CardTitle>
                <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest px-2 py-0.5 animate-pulse">
                  Empfohlen
                </Badge>
              </div>
              <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-primary/60">
                Volle Kontrolle & Progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/90 leading-relaxed mb-4 font-medium">
                Sichere dir dauerhaft deinen Platz in der ABI '27 Organisation. Dein Progress wird synchronisiert, egal von welchem Gerät du zugreifst.
              </p>
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-bold text-foreground">
                    <div className="bg-primary/20 p-1.5 rounded-full"><Check className="h-3 w-3 text-primary" /></div>
                    <span className="flex items-center gap-2">
                      {feature.name}
                      <span className="opacity-40">{feature.icon}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto h-12 px-8 text-xs font-black uppercase tracking-[0.2em] border-2 group"
            onClick={() => router.push('/login')}
          >
            <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Anmelden
          </Button>
          <Button 
            variant="default" 
            size="lg" 
            className="w-full sm:w-auto h-12 px-8 text-xs font-black uppercase tracking-[0.2em] shadow-lg group"
            onClick={() => router.push('/register')}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Jetzt Registrieren
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="text-center pt-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold hover:text-foreground"
            onClick={() => router.push('/')}
          >
            Vorerst weiter als Gast
          </Button>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-10" />
      </div>
    </div>
  )
}
