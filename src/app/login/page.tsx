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
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md border-t-4 border-t-[#004a99]">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex justify-center mb-2">
            <div className="bg-[#004a99] text-white px-3 py-1 rounded text-xs font-bold tracking-widest uppercase">
              Lernsax Login
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">ABI Planer Anmeldung</CardTitle>
          <CardDescription className="text-center">
            Logge dich mit deinem verifizierten Lernsax-Konto ein.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center font-medium border border-destructive/20">
                {error}
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-md space-y-1">
              <p className="text-[11px] font-bold text-[#004a99] uppercase">Wichtiger Hinweis</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Verwende ausschließlich deine E-Mail Adresse der Form: <br/>
                <code className="font-bold">vorname.nachname@hgr-web.lernsax.de</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Lernsax E-Mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="max.mustermann@hgr-web.lernsax.de" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-300 focus:ring-[#004a99] focus:border-[#004a99]"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-300 focus:ring-[#004a99] focus:border-[#004a99]"
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#004a99] hover:bg-[#003a7a] text-white" disabled={loading}>
              {loading ? 'Anmeldung läuft...' : 'Sicher anmelden'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Noch keinen Account für den ABI Planer?{' '}
              <Link href="/register" className="text-[#004a99] hover:underline font-bold">
                Hier registrieren
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
