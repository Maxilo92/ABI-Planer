'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, collection, getDocs, limit, query, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { logAction } from '@/lib/logging'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [courses, setCourses] = useState<string[]>(['12A', '12B', '12C', '12D'])
  const [selectedCourse, setSelectedCourse] = useState('12A')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        const configuredCourses = settingsSnap.exists() ? settingsSnap.data().courses : undefined
        if (Array.isArray(configuredCourses) && configuredCourses.length > 0) {
          const normalizedCourses = configuredCourses.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          if (normalizedCourses.length > 0) {
            setCourses(normalizedCourses)
            setSelectedCourse(normalizedCourses[0])
          }
        }
      } catch (loadError) {
        console.error('Error loading courses:', loadError)
      }
    }

    loadCourses()
  }, [])

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Bitte gib zuerst deinen vollständigen Namen ein.')
        return false
      }
      return true
    }

    if (step === 2) {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail || !password.trim()) {
        setError('Bitte gib E-Mail und Passwort ein.')
        return false
      }

      if (!normalizedEmail.includes('@')) {
        setError('Bitte gib eine gültige E-Mail-Adresse ein.')
        return false
      }

      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        setError('Nur E-Mail Adressen von @hgr-web.lernsax.de sind erlaubt.')
        return false
      }

      if (password.length < 6) {
        setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
        return false
      }

      return true
    }

    if (step === 3) {
      if (!selectedCourse) {
        setError('Bitte wähle einen Kurs aus.')
        return false
      }
      return true
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    if (!validateCurrentStep()) return

    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3)
      return
    }

    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      // 0. Domain validation
      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Nur E-Mail Adressen von @hgr-web.lernsax.de sind erlaubt.')
      }

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
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
        email: normalizedEmail,
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: selectedCourse,
        planning_group: null,
        is_approved: true, // Auto-approve for MVP
        created_at: new Date().toISOString(),
      })

      await logAction('PROFILE_UPDATED', user.uid, fullName, {
        action: 'profile_created',
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: selectedCourse,
      })

      router.push('/')
    } catch (err: any) {
      setError('Registrierung fehlgeschlagen: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:flex md:items-center md:justify-center">
      <Card className="mx-auto w-full max-w-md rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="px-5 pt-4 sm:px-7 sm:pt-5">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground hover:text-foreground"
            render={<Link href="/">Zurück zum Dashboard</Link>}
          />
        </div>
        <CardHeader className="space-y-3 px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-5">
          <CardTitle className="text-4xl font-black text-center tracking-tight">Registrieren</CardTitle>
          <CardDescription className="text-center">
            Erstelle einen Account, um mitzugestalten oder abzustimmen.
          </CardDescription>
          <div className="pt-3 space-y-2.5">
            <div className="flex gap-2">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {step === 1 ? 'Schritt 1/3: Name' : step === 2 ? 'Schritt 2/3: E-Mail & Passwort' : 'Schritt 3/3: Kurs'}
            </p>
          </div>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-6 px-5 pb-7 sm:px-7 sm:pb-8">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Vollständiger Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="Max Mustermann" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 text-base bg-background/70 border-border"
                  autoComplete="name"
                  required 
                />
              </div>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-Mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="vorname.nachname@hgr-web.lernsax.de" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base bg-background/70 border-border"
                    autoComplete="email"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Passwort</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base bg-background/70 border-border"
                    autoComplete="new-password"
                    required 
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-2 mb-1 sm:mb-2">
                <Label htmlFor="course" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Kurs</Label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="flex h-12 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-base"
                  required
                >
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 border-0 bg-transparent rounded-none px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-4">
            <div className="w-full flex gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                  disabled={loading}
                >
                  Zurück
                </Button>
              )}

              <Button type="submit" className="flex-1 h-12" disabled={loading}>
                {step < 3 ? 'Weiter' : (loading ? 'Erstellung...' : 'Account erstellen')}
              </Button>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Bereits einen Account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Anmelden
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
