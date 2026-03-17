'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 0. Domain validation
      if (!email.toLowerCase().endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Bitte verwende deine offizielle @hgr-web.lernsax.de E-Mail Adresse.')
      }

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Update display name
      await updateProfile(user, { displayName: fullName })

      // 3. Check if this is the first user ever
      const profilesRef = collection(db, 'profiles')
      const q = query(profilesRef, limit(1))
      const querySnapshot = await getDocs(q)
      const isFirstUser = querySnapshot.empty

      // 4. Create profile document in Firestore
      await setDoc(doc(db, 'profiles', user.uid), {
        full_name: fullName,
        email: email,
        role: isFirstUser ? 'admin' : 'viewer',
        is_approved: true, // Auto-approve for MVP
        created_at: new Date().toISOString(),
      })

      router.push('/')
    } catch (err: any) {
      setError('Registrierung fehlgeschlagen: ' + err.message)
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
              HGR Account
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Registrieren</CardTitle>
          <CardDescription className="text-center">
            Erstelle deinen ABI Planer Zugang mit deiner Lernsax E-Mail.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 p-3 rounded-md space-y-1">
              <p className="text-[11px] font-bold text-[#004a99] uppercase">Hinweis zur Domain</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Nur E-Mails von <code className="font-bold text-[#004a99]">@hgr-web.lernsax.de</code> sind für diesen Planer zugelassen.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Vollständiger Name</Label>
              <Input 
                id="fullName" 
                placeholder="Max Mustermann" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-slate-300 focus:ring-[#004a99] focus:border-[#004a99]"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Lernsax E-Mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@hgr-web.lernsax.de" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-300 focus:ring-[#004a99] focus:border-[#004a99]"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort festlegen</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-300 focus:ring-[#004a99] focus:border-[#004a99]"
                required 
              />
              <p className="text-[10px] text-muted-foreground italic">
                Tipp: Nutze ein sicheres Passwort, nicht zwingend dein Lernsax-Passwort.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#004a99] hover:bg-[#003a7a] text-white" disabled={loading}>
              {loading ? 'Konto wird erstellt...' : 'Jetzt registrieren'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Bereits registriert?{' '}
              <Link href="/login" className="text-[#004a99] hover:underline font-bold">
                Hier anmelden
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
