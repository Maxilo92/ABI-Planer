'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!email.toLowerCase().endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Anmeldung nur mit offizieller @hgr-web.lernsax.de E-Mail erlaubt.')
      }
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
    } catch (err: any) {
      let message = 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Daten.'
      if (err.code === 'auth/user-not-found') message = 'Kein Account mit dieser E-Mail gefunden.'
      if (err.code === 'auth/wrong-password') message = 'Falsches Passwort.'
      setError(err.message || message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-6 sm:py-10 overflow-y-auto">
      <Card className="w-full max-w-md border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            render={<Link href="/">Zurück zum Dashboard</Link>}
          />
        </div>
        <CardHeader className="space-y-2 pb-6 sm:pb-8 text-center pt-2 sm:pt-4">
          <CardTitle className="text-3xl font-bold tracking-tight">Anmelden</CardTitle>
          <CardDescription className="text-muted-foreground">
            Nutze dein @hgr-web.lernsax.de Konto
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5 sm:space-y-6 pb-5 sm:pb-6">
            {error && (
              <div className="text-destructive text-sm p-3 rounded-md bg-destructive/10 text-center font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-Mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="vorname.nachname@hgr-web.lernsax.de" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/30 border-slate-200 h-12 text-base focus:bg-background transition-all"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Passwort</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/30 border-slate-200 h-12 text-base focus:bg-background transition-all"
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 sm:space-y-6 pt-2 pb-2 sm:pb-4">
            <Button type="submit" className="w-full h-12 text-base font-bold shadow-md active:scale-[0.98] transition-transform" disabled={loading}>
              {loading ? 'Anmeldung...' : 'Anmelden'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Noch keinen Account?{' '}
              <Link href="/register" className="text-foreground hover:underline font-bold decoration-2 underline-offset-4">
                Registrieren
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
