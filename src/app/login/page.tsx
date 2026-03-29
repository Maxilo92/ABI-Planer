'use client'

import { useState, useEffect } from 'react'
import { getFirebaseAuth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { ForgotPasswordDialog } from '@/components/modals/ForgotPasswordDialog'

const auth = getFirebaseAuth()

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reasonMessage, setReasonMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const reason = params.get('reason')
      if (reason === 'timeout') {
        setReasonMessage('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.')
      } else if (reason === 'unauthorized') {
        setReasonMessage('Du musst angemeldet sein, um auf diesen Bereich zuzugreifen.')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Anmeldung nur mit offizieller @hgr-web.lernsax.de E-Mail erlaubt.')
      }
      await signInWithEmailAndPassword(auth, normalizedEmail, password)
      router.push('/')
    } catch (err: any) {
      let message = 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Daten.'
      if (err.code === 'auth/user-not-found') message = 'Kein Account mit dieser E-Mail gefunden.'
      if (err.code === 'auth/wrong-password') message = 'Falsches Passwort.'
      if (err.code === 'auth/invalid-credential') message = 'E-Mail oder Passwort ist nicht korrekt.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:flex md:items-center md:justify-center">
      <div className="mx-auto w-full max-w-md flex flex-col items-center gap-8">
        <Logo width={120} height={120} />
        <Card className="w-full rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="px-5 pt-4 sm:px-7 sm:pt-5">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground hover:text-foreground"
              render={<Link href="/">Zurück zum Dashboard</Link>}
            />
          </div>
          <CardHeader className="space-y-3 px-5 pb-7 pt-3 text-center sm:px-7 sm:pb-9 sm:pt-5">
            <CardTitle className="text-4xl font-black tracking-tight">Anmelden</CardTitle>
            <CardDescription className="text-muted-foreground">
              Nutze dein @hgr-web.lernsax.de Konto
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 px-5 pb-7 sm:space-y-7 sm:px-7 sm:pb-8">
              {reasonMessage && (
                <div className="text-amber-600 dark:text-amber-400 text-sm p-3 rounded-md bg-amber-500/10 text-center font-medium border border-amber-500/20">
                  {reasonMessage}
                </div>
              )}
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
                  className="bg-background/70 border-border h-12 text-base focus:bg-background transition-all"
                  required 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Passwort</Label>
                  <ForgotPasswordDialog initialEmail={email} />
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/70 border-border h-12 text-base focus:bg-background transition-all"
                  autoComplete="current-password"
                  required 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 border-0 bg-transparent rounded-none px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-4">
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
    </div>
  )
}
