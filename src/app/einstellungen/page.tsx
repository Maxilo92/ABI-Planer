'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { User, MoonStar, MessageSquarePlus, LogOut } from 'lucide-react'

import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AddFeedbackDialog } from '@/components/modals/AddFeedbackDialog'

export default function SettingsPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
  }, [loading, profile, router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/login')
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Lade Einstellungen...</div>
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Hier findest du persönliche Optionen, ohne den Header zu überladen.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5" /> Konto
          </CardTitle>
          <CardDescription>Profil ansehen und abmelden.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            render={
              <Link href="/profil" className="w-full sm:w-auto">
                Profil öffnen
              </Link>
            }
          />
          <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto gap-2">
            <LogOut className="h-4 w-4" /> Abmelden
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MoonStar className="h-5 w-5" /> Darstellung
          </CardTitle>
          <CardDescription>Hell, dunkel oder automatisch nach System.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquarePlus className="h-5 w-5" /> Feedback
          </CardTitle>
          <CardDescription>Teile Bugs, Ideen und Feature-Wünsche.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddFeedbackDialog />
        </CardContent>
      </Card>
    </div>
  )
}
