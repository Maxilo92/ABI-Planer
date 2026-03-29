'use client'

import { useEffect, useState, Suspense } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, collection, getDocs, limit, query, getDoc } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { logAction } from '@/lib/logging'

function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [courses, setCourses] = useState<string[]>(['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7'])
  const [selectedCourse, setSelectedCourse] = useState('Kurs 1')
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)
  const [isAtLeast16, setIsAtLeast16] = useState(false)
  const [acceptsTerms, setAcceptsTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  useEffect(() => {
    const loadCourses = async () => {
      setIsCoursesLoading(true)
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        if (settingsSnap.exists()) {
          const configuredCourses = settingsSnap.data().courses
          if (Array.isArray(configuredCourses) && configuredCourses.length > 0) {
            const normalizedCourses = configuredCourses.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
            if (normalizedCourses.length > 0) {
              setCourses(normalizedCourses)
              setSelectedCourse(normalizedCourses[0])
            }
          }
        }
      } catch (loadError) {
        console.error('Error loading courses:', loadError)
      } finally {
        setIsCoursesLoading(false)
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
      if (isCoursesLoading) {
        setError('Kurse werden noch geladen. Bitte warte einen Moment.')
        return false
      }
      if (!selectedCourse) {
        setError('Bitte wähle einen Kurs aus.')
        return false
      }

      if (!isAtLeast16) {
        setError('Du musst bestätigen, dass du mindestens 16 Jahre alt bist.')
        return false
      }

      if (!acceptsTerms) {
        setError('Bitte akzeptiere die AGB.')
        return false
      }

      return true
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setShowError(true)
    
    // Final validation check for all required fields
    if (!fullName.trim()) {
      setStep(1)
      setError('Bitte gib deinen vollständigen Namen ein.')
      return
    }
    if (!email.trim() || !password.trim() || !email.includes('@hgr-web.lernsax.de')) {
      setStep(2)
      setError('Bitte überprüfe deine E-Mail und dein Passwort.')
      return
    }
    if (!isAtLeast16 || !acceptsTerms) {
      setStep(3)
      setError('Bitte bestätige dein Alter und die AGB.')
      return
    }

    if (!validateCurrentStep()) return

    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3)
      setShowError(false)
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
        legal_consents: {
          is_at_least_16: true,
          terms_accepted: true,
          terms_version: '2026-03-20',
          accepted_at: new Date().toISOString(),
        },
        referral_code: user.uid.slice(0, 8), // Unique code for sharing
        referred_by: ref || null, // Capture invitation source
      })

      // ACCOUNT_CREATED Log (garantiert mit Name)
      await logAction('ACCOUNT_CREATED', user.uid, fullName, {
        email: normalizedEmail,
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: selectedCourse,
        created_at: new Date().toISOString(),
      })

      // PROFILE_UPDATED Log (wie bisher)
      await logAction('PROFILE_UPDATED', user.uid, fullName, {
        action: 'profile_created',
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: selectedCourse,
        legal_consents_recorded: true,
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
              {showError && error && (
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
                <div className="space-y-5 mb-1 sm:mb-2">
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Kurs</Label>
                    <div className="relative">
                      <select
                        id="course"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="flex h-12 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-base disabled:opacity-50"
                        required
                        disabled={isCoursesLoading}
                      >
                        {isCoursesLoading ? (
                          <option value="">Lade Kurse...</option>
                        ) : (
                          courses.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))
                        )}
                      </select>
                      {isCoursesLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
                      <Checkbox
                        id="age16"
                        checked={isAtLeast16}
                        onCheckedChange={(checked) => setIsAtLeast16(checked === true)}
                        className="mt-0.5 shrink-0"
                      />
                      <Label htmlFor="age16" className="!block text-xs leading-relaxed text-muted-foreground font-medium cursor-pointer">
                        Ich bestätige, dass ich mindestens 16 Jahre alt bin.
                      </Label>
                    </div>

                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
                      <Checkbox
                        id="termsAccepted"
                        checked={acceptsTerms}
                        onCheckedChange={(checked) => setAcceptsTerms(checked === true)}
                        className="mt-0.5 shrink-0"
                      />
                      <Label htmlFor="termsAccepted" className="!block text-xs leading-relaxed text-muted-foreground font-medium cursor-pointer">
                        Ich akzeptiere die{' '}
                        <Link
                          href="/agb"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="underline hover:text-primary"
                        >
                          AGB
                        </Link>
                        .
                      </Label>
                    </div>
                  </div>
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
                <br />
                <span className="text-xs">
                  <Link href="/datenschutz" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">
                    Datenschutzerklärung
                  </Link>
                </span>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
