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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [className, setClassName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const classes = ['12A', '12B', '12C', '12D']

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!className) {
        throw new Error('Bitte wähle deine Klasse aus.')
      }

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
        role: isFirstUser ? 'admin_main' : 'viewer',
        is_approved: true, // Auto-approve for MVP
        class_name: className,
        planning_group: null,
        total_contributions: 0,
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
      <Card className="w-full max-w-md border border-slate-200 shadow-sm p-6">
        <CardHeader className="space-y-2 pb-8 text-center pt-4">
          <CardTitle className="text-3xl font-bold tracking-tight">Registrieren</CardTitle>
          <CardDescription className="text-muted-foreground">
            Werde Teil der ABI Planung 2026
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-6 pb-6">
            {error && (
              <div className="text-destructive text-sm p-3 rounded-md bg-destructive/10 text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Vollständiger Name</Label>
              <Input 
                id="fullName" 
                placeholder="Max Mustermann" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-muted/30 border-slate-200 h-12 focus:bg-background transition-all"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Lernsax E-Mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@hgr-web.lernsax.de" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/30 border-slate-200 h-12 focus:bg-background transition-all"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Passwort" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Passwort</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/30 border-slate-200 h-12 focus:bg-background transition-all"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Deine Klasse</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="w-full h-12 justify-between bg-muted/30 border-slate-200 hover:bg-background transition-all text-sm font-medium">
                      {className ? `Klasse ${className}` : 'Klasse auswählen'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  }
                />
                <DropdownMenuContent className="w-[calc(100vw-4rem)] max-w-[350px]">
                  {classes.map((c) => (
                    <DropdownMenuItem key={c} onClick={() => setClassName(c)}>
                      Klasse {c}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pt-2 pb-4">
            <Button type="submit" className="w-full h-12 text-base font-bold shadow-md active:scale-[0.98] transition-transform" disabled={loading}>
              {loading ? 'Konto wird erstellt...' : 'Account erstellen'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Bereits einen Account?{' '}
              <Link href="/login" className="text-foreground hover:underline font-bold decoration-2 underline-offset-4">
                Anmelden
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
