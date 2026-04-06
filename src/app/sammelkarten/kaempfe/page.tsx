'use client'

import { Swords, Sparkles, Trophy, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function KaempfePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
            <Swords className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Karten-Kämpfe</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bereite dich vor! Das ultimative Kampfsystem für deine Lehrer-Karten ist in der Entwicklung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-secondary/20 border-brand/20">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Duelle</CardTitle>
              <CardDescription>Fordere deine Freunde zu strategischen Duellen heraus.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-secondary/20 border-brand/20">
            <CardHeader>
              <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle>Turniere</CardTitle>
              <CardDescription>Nimm an wöchentlichen Turnieren teil und gewinne exklusive Belohnungen.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-secondary/20 border-brand/20">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Stats & Skills</CardTitle>
              <CardDescription>Nutze die HP und Attacken deiner Karten, um den Sieg zu erringen.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-primary/5 rounded-3xl p-8 border-2 border-dashed border-primary/20 text-center">
          <h2 className="text-2xl font-bold mb-4">Wann geht's los?</h2>
          <p className="text-muted-foreground mb-6">
            Wir arbeiten unter Hochdruck an der Kampf-Engine. In der Zwischenzeit kannst du bereits deine 
            <strong> Decks zusammenstellen</strong> und deine Karten im Album bewundern.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/sammelkarten?view=decks">Meine Decks planen</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href="/sammelkarten?view=album">Album ansehen</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
