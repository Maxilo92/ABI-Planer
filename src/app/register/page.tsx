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

    if (step !== 3) return

    setLoading(true)
    setError(null)

    try {
      // 0. Domain validation
      if (!email.endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Nur E-Mail Adressen von @hgr-web.lernsax.de sind erlaubt.')
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
        planning_group: selectedCourse,
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
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-6 sm:py-10 overflow-y-auto">
      <Card className="w-full max-w-md">
        <div className="px-6 pt-6 pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            render={<Link href="/">Zurück zum Dashboard</Link>}
          />
        </div>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">Registrieren</CardTitle>
          <CardDescription className="text-center">
            Erstelle einen Account, um mitzugestalten oder abzustimmen.
          </CardDescription>
          <div className="pt-2 space-y-2">
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
          <CardContent className="space-y-4 pb-5 sm:pb-6">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Vollständiger Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="Max Mustermann" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="name"
                  required 
                />
              </div>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="vorname.nachname@hgr-web.lernsax.de" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    autoComplete="email"
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
                    className="h-12 text-base"
                    autoComplete="new-password"
                    required 
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-2 mb-1 sm:mb-2">
                <Label htmlFor="course">Kurs</Label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
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
          <CardFooter className="flex flex-col space-y-4">
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

              {step < 3 ? (
                <Button
                  type="button"
                  className="flex-1 h-12"
                  onClick={() => {
                    setError(null)
                    if (!validateCurrentStep()) return

                    setStep((prev) => (prev + 1) as 1 | 2 | 3)
                  }}
                  disabled={loading}
                >
                  Weiter
                </Button>
              ) : (
                <Button type="submit" className="flex-1 h-12" disabled={loading}>
                  {loading ? 'Erstellung...' : 'Account erstellen'}
                </Button>
              )}
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
