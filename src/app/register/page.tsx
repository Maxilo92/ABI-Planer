'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, collection, getDocs, limit, query, onSnapshot } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [courseName, setCourseName] = useState<string | null>(null)
  const [courses, setCourses] = useState<string[]>(['12A', '12B', '12C', '12D'])
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists() && doc.data().courses) {
        setCourses(doc.data().courses)
      }
      setLoadingCourses(false)
    })
    return () => unsubscribe()
  }, [])

  const validateStep = (targetStep: number) => {
    if (targetStep === 1) {
      if (!fullName.trim()) {
        setError('Bitte gib deinen vollständigen Namen ein.')
        return false
      }

      if (!email.trim()) {
        setError('Bitte gib deine E-Mail ein.')
        return false
      }

      if (!email.toLowerCase().endsWith('@hgr-web.lernsax.de')) {
        setError('Bitte verwende deine offizielle @hgr-web.lernsax.de E-Mail Adresse.')
        return false
      }
    }

    if (targetStep === 2) {
      if (!courseName) {
        setError('Bitte wähle deinen Kurs aus.')
        return false
      }
    }

    if (targetStep === 3) {
      if (!password || password.length < 6) {
        setError('Bitte wähle ein Passwort mit mindestens 6 Zeichen.')
        return false
      }
    }

    return true
  }

  const goNext = () => {
    const currentStep = step
    if (!validateStep(currentStep)) return
    setError(null)
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const goBack = () => {
    setError(null)
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleRegister = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
        setLoading(false)
        return
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
        class_name: courseName,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step < 3) {
      goNext()
      return
    }

    await handleRegister()
  }

  const progress = (step / 3) * 100

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md border border-slate-200 shadow-sm p-6">
        <CardHeader className="space-y-2 pb-8 text-center pt-4">
          <CardTitle className="text-3xl font-bold tracking-tight">Registrieren</CardTitle>
          <CardDescription className="text-muted-foreground">
            Werde Teil der ABI Planung 2026
          </CardDescription>

          <div className="pt-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <span>Schritt {step} von 3</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pb-6">
            {error && (
              <div className="text-destructive text-sm p-3 rounded-md bg-destructive/10 text-center font-medium">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
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
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Wähle deinen Kurs, damit du den richtigen Bereichen zugeordnet wirst.</p>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Dein Kurs (Tutorat)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" className="w-full h-12 justify-between bg-muted/30 border-slate-200 hover:bg-background transition-all text-sm font-medium" disabled={loadingCourses}>
                          {loadingCourses ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Lade Kurse...
                            </>
                          ) : (
                            <>
                              {courseName ? `Kurs ${courseName}` : 'Kurs auswählen'}
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </>
                          )}
                        </Button>
                      }
                    />
                    {!loadingCourses && (
                      <DropdownMenuContent className="w-[calc(100vw-4rem)] max-w-[350px]">
                        {courses.map((c) => (
                          <DropdownMenuItem key={c} onClick={() => setCourseName(c)}>
                            Kurs {c}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                  <p><span className="font-semibold">Name:</span> {fullName || '—'}</p>
                  <p><span className="font-semibold">E-Mail:</span> {email || '—'}</p>
                  <p><span className="font-semibold">Kurs:</span> {courseName ? `Kurs ${courseName}` : '—'}</p>
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
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pt-2 pb-4">
            <div className="flex w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" className="h-12 px-4" onClick={goBack} disabled={loading}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}

              {step < 3 ? (
                <Button type="submit" className="flex-1 h-12 text-base font-bold shadow-md active:scale-[0.98] transition-transform" disabled={loading || loadingCourses}>
                  Weiter <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 h-12 text-base font-bold shadow-md active:scale-[0.98] transition-transform" disabled={loading}>
                  {loading ? 'Konto wird erstellt...' : 'Account erstellen'}
                </Button>
              )}
            </div>

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
