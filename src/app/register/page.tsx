'use client'

import { useEffect, useState, Suspense } from 'react'
import { auth, db } from '@/lib/firebase'
import { Skeleton } from '@/components/ui/skeleton'
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth'
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
import { getMainBaseUrl } from '@/lib/dashboard-url'

const OPTION_TEACHER = 'Lehrer'
const OPTION_OTHER_GRADE = 'andere KlassenStufe'

function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [courses, setCourses] = useState<string[]>(['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7'])
  const [selectedCourse, setSelectedCourse] = useState('Kurs 1')
  const [manualGrade, setManualGrade] = useState('')
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)
  const [isAtLeast16, setIsAtLeast16] = useState(false)
  const [acceptsTerms, setAcceptsTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const mainBaseUrl = getMainBaseUrl()

  const isSpecialOption = selectedCourse === OPTION_TEACHER || selectedCourse === OPTION_OTHER_GRADE

  useEffect(() => {
    const loadCourses = async () => {
      setIsCoursesLoading(true)
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        let allCourses = ['Kurs 1', 'Kurs 2', 'Kurs 3', 'Kurs 4', 'Kurs 5', 'Kurs 6', 'Kurs 7']
        if (settingsSnap.exists()) {
          const configuredCourses = settingsSnap.data().courses
          if (Array.isArray(configuredCourses) && configuredCourses.length > 0) {
            allCourses = configuredCourses.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          }
        }
        
        // Add special options if not present
        if (!allCourses.includes(OPTION_TEACHER)) allCourses.push(OPTION_TEACHER)
        if (!allCourses.includes(OPTION_OTHER_GRADE)) allCourses.push(OPTION_OTHER_GRADE)
        
        setCourses(allCourses)
        setSelectedCourse(allCourses[0])
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

    if (step === 4) {
      if (selectedCourse === OPTION_OTHER_GRADE && !manualGrade.trim()) {
        setError('Bitte gib deine Klassenstufe ein.')
        return false
      }
      return true
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    if (!validateCurrentStep()) {
      setShowError(true)
      return
    }

    if (step === 3 && isSpecialOption) {
      setStep(4)
      setShowError(false)
      return
    }

    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5)
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

      // 3. Send verification email
      try {
        await sendEmailVerification(user)
      } catch (verifErr) {
        console.error('Error sending verification email:', verifErr)
        // We continue anyway, the user can resend it later from the dashboard
      }

      // 4. Check if this is the first user ever
      const profilesRef = collection(db, 'profiles')
      const q = query(profilesRef, limit(1))
      const querySnapshot = await getDocs(q)
      const isFirstUser = querySnapshot.empty

      // 5. Create profile document in Firestore
      const classNameToSave = selectedCourse === OPTION_OTHER_GRADE ? manualGrade : selectedCourse

      await setDoc(doc(db, 'profiles', user.uid), {
        full_name: fullName,
        email: normalizedEmail,
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: classNameToSave,
        planning_groups: [],
        led_groups: [],
        is_group_leader: false,
        is_approved: true, // Auto-approve for MVP
        created_at: new Date().toISOString(),
        legal_consents: {
          is_at_least_16: true,
          terms_accepted: true,
          terms_version: '2026-03-29',
          accepted_at: new Date().toISOString(),
        },
        referral_code: user.uid.slice(0, 8), // Unique code for sharing
        referred_by: ref || null, // Capture invitation source
      })

      // ACCOUNT_CREATED Log (garantiert mit Name)
      await logAction('ACCOUNT_CREATED', user.uid, fullName, {
        email: normalizedEmail,
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: classNameToSave,
        created_at: new Date().toISOString(),
      })

      // PROFILE_UPDATED Log (wie bisher)
      await logAction('PROFILE_UPDATED', user.uid, fullName, {
        action: 'profile_created',
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: classNameToSave,
        legal_consents_recorded: true,
      })

      setStep(5) // Success/Verification step
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
              render={<Link href="/">Zurück zur Startseite</Link>}
            />
          </div>
          <CardHeader className="space-y-3 px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-5">
            <CardTitle className="text-4xl font-black text-center tracking-tight">
              {step === 5 ? 'Fast fertig!' : 'Registrieren'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 5 
                ? 'Wir haben dir eine Verifizierungs-E-Mail gesendet.' 
                : 'Erstelle einen Account, um mitzugestalten oder abzustimmen.'}
            </CardDescription>
            {step < 5 && (
              <div className="pt-3 space-y-2.5">
                <div className="flex gap-2">
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                  {isSpecialOption && (
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 4 ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {step === 1 ? `Schritt 1/${isSpecialOption ? '4' : '3'}: Name` : 
                   step === 2 ? `Schritt 2/${isSpecialOption ? '4' : '3'}: E-Mail & Passwort` : 
                   step === 3 ? `Schritt 3/${isSpecialOption ? '4' : '3'}: Kurs` : 
                   `Schritt 4/4: ${selectedCourse === OPTION_TEACHER ? 'Lehrer Info' : 'Klassenstufe'}`}
                </p>
              </div>
            )}
          </CardHeader>
          {step === 5 ? (
            <CardContent className="space-y-6 px-5 pb-7 sm:px-7 sm:pb-8 text-center">
              <div className="p-4 bg-primary/10 rounded-xl text-sm text-primary font-medium leading-relaxed">
                Bitte klicke auf den Link in der E-Mail (Check auch deinen Spam-Ordner), um deinen Account zu aktivieren und deine Willkommens-Booster zu erhalten!
              </div>
              <Button onClick={() => router.push('/')} className="w-full h-12">
                Zum Dashboard
              </Button>
            </CardContent>
          ) : (
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
                        placeholder="nachname.vorname@hgr-web.lernsax.de" 
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
                      <p className="text-xs text-muted-foreground">
                        Du kannst hier ein neues Passwort festlegen, es muss nicht dein LernSax-Passwort sein.
                      </p>
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
                          <a
                            href={`${mainBaseUrl}/agb`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="underline hover:text-primary"
                          >
                            AGB
                          </a>
                          .
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    {selectedCourse === OPTION_TEACHER ? (
                      <div className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                        <p className="text-sm font-bold text-foreground">Lehrer-Account</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Als Lehrer hast du vollen Zugriff auf alle Inhalte der App, um den Abiturjahrgang zu unterstützen. 
                          Bitte beachte, dass du an schüler-spezifischen Abstimmungen (z.B. Abimotto) nicht teilnehmen kannst.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                          <p className="text-sm font-bold text-foreground">Andere Klassenstufe</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Diese App ist primär auf die Organisation der aktuellen Abitur-Stufe ausgelegt. 
                            Du kannst sie dennoch nutzen, um über Veranstaltungen informiert zu bleiben.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="manualGrade" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Klassenstufe / Bezeichnung</Label>
                          <Input 
                            id="manualGrade" 
                            placeholder="z.B. 10L2, 7b, ..." 
                            value={manualGrade}
                            onChange={(e) => setManualGrade(e.target.value)}
                            className="h-12 text-base bg-background/70 border-border"
                            required 
                          />
                        </div>
                      </div>
                    )}
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
                      onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)}
                      disabled={loading}
                    >
                      Zurück
                    </Button>
                  )}

                  <Button type="submit" className="flex-1 h-12" disabled={loading}>
                    {step < 3 || (step === 3 && isSpecialOption) ? 'Weiter' : (loading ? 'Erstellung...' : 'Account erstellen')}
                  </Button>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Bereits einen Account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Anmelden
                  </Link>
                  <br />
                  <span className="text-xs">
                    <a href={`${mainBaseUrl}/datenschutz`} className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">
                      Datenschutzerklärung
                    </a>
                  </span>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:flex md:items-center md:justify-center">
        <div className="mx-auto w-full max-w-md flex flex-col items-center gap-8">
          <Skeleton className="h-[120px] w-[120px] rounded-full" />
          <div className="w-full rounded-2xl border border-border/70 bg-card p-8 space-y-6">
            <Skeleton className="h-10 w-48 mx-auto" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
