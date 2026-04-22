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
import { getAppHomeUrl, getAccessTargetFromProfile, getMainBaseUrl } from '@/lib/dashboard-url'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

const OPTION_TEACHER = 'Lehrer'
const OPTION_PARENT = 'Eltern'

function RegisterForm() {
  const { t } = useLanguage()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('12')
  const [gradeSuffix, setGradeSuffix] = useState('')
  const [schoolYear, setSchoolYear] = useState('2025/26')
  const [isConfigLoading, setIsConfigLoading] = useState(true)
  const [isAtLeast16, setIsAtLeast16] = useState(false)
  const [acceptsTerms, setAcceptsTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const mainBaseUrl = getMainBaseUrl()
  
  const isSpecialRole = selectedGrade === OPTION_TEACHER || selectedGrade === OPTION_PARENT
  const selectedClassName = isSpecialRole ? selectedGrade : `${selectedGrade}${gradeSuffix}`
  const postSignupTarget = isSpecialRole
    ? 'dashboard'
    : getAccessTargetFromProfile({ class_name: selectedClassName })

  useEffect(() => {
    const loadConfig = async () => {
      setIsConfigLoading(true)
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        if (settingsSnap.exists()) {
          const config = settingsSnap.data()
          if (config.current_school_year) {
            setSchoolYear(config.current_school_year)
          }
        }
      } catch (loadError) {
        console.error('Error loading config:', loadError)
      } finally {
        setIsConfigLoading(false)
      }
    }

    loadConfig()
  }, [])

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        setError(t('auth.register.errors.nameRequired'))
        return false
      }
      return true
    }

    if (step === 2) {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail || !password.trim()) {
        setError(t('auth.register.errors.credentialsRequired'))
        return false
      }

      if (!normalizedEmail.includes('@')) {
        setError(t('auth.register.errors.invalidEmail'))
        return false
      }

      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        setError(t('auth.register.errors.domainRestricted'))
        return false
      }

      if (password.length < 6) {
        setError(t('auth.register.errors.passwordTooShort'))
        return false
      }

      return true
    }

    if (step === 3) {
      if (isConfigLoading) {
        setError(t('auth.register.errors.coursesLoading'))
        return false
      }
      if (!selectedGrade) {
        setError(t('auth.register.errors.gradeRequired'))
        return false
      }

      if (!isAtLeast16) {
        setError(t('auth.register.errors.ageRequired'))
        return false
      }

      if (!acceptsTerms) {
        setError(t('auth.register.errors.termsRequired'))
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

    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)
      setShowError(false)
      return
    }

    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      // 0. Domain validation
      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        throw new Error(t('auth.register.errors.domainRestricted'))
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
      const classNameToSave = isSpecialRole ? selectedGrade : `${selectedGrade}${gradeSuffix}`
      const accessTarget = isSpecialRole
        ? 'dashboard'
        : getAccessTargetFromProfile({ class_name: classNameToSave })

      await setDoc(doc(db, 'profiles', user.uid), {
        full_name: fullName,
        email: normalizedEmail,
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: classNameToSave,
        school_year: schoolYear,
        access_target: accessTarget,
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
        school_year: schoolYear,
        access_target: accessTarget,
        created_at: new Date().toISOString(),
      })

      // PROFILE_UPDATED Log (wie bisher)
      await logAction('PROFILE_UPDATED', user.uid, fullName, {
        action: 'profile_created',
        role: isFirstUser ? 'admin' : 'viewer',
        class_name: classNameToSave,
        school_year: schoolYear,
        access_target: accessTarget,
        legal_consents_recorded: true,
      })

      setStep(4) // Success/Verification step
    } catch (err: any) {
      setError(t('auth.register.errors.failed') + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:flex md:items-center md:justify-center">
      <div className="mx-auto w-full max-w-md flex flex-col items-center gap-8">
        <Logo width={120} height={120} />
        <Card className="w-full rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="px-5 pt-4 sm:px-7 sm:pt-5 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground hover:text-foreground"
              render={<Link href="/">{t('auth.register.backToHome')}</Link>}
            />
            <LanguageToggle />
          </div>
          <CardHeader className="space-y-3 px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-5">
            <CardTitle className="text-4xl font-black text-center tracking-tight">
              {step === 4 ? t('auth.register.titleSuccess') : t('auth.register.title')}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 4 
                ? t('auth.register.descSuccess') 
                : t('auth.register.desc')}
            </CardDescription>
            {step < 4 && (
              <div className="pt-3 space-y-2.5">
                <div className="flex gap-2">
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {step === 1 ? `${t('auth.register.step')} 1/3: ${t('auth.register.steps.name')}` : 
                   step === 2 ? `${t('auth.register.step')} 2/3: ${t('auth.register.steps.emailPassword')}` : 
                   `${t('auth.register.step')} 3/3: ${t('auth.register.steps.grade')}`}
                </p>
              </div>
            )}
          </CardHeader>
          {step === 4 ? (
            <CardContent className="space-y-6 px-5 pb-7 sm:px-7 sm:pb-8 text-center">
              <div className="p-4 bg-primary/10 rounded-xl text-sm text-primary font-medium leading-relaxed">
                {t('auth.register.success.message')}
              </div>
              <Button
                onClick={() => {
                  if (typeof window === 'undefined') {
                    router.push('/')
                    return
                  }

                  window.location.href = getAppHomeUrl(window.location, postSignupTarget)
                }}
                className="w-full h-12"
              >
                {postSignupTarget === 'tcg' ? t('auth.register.success.toCards') : t('auth.register.success.toDashboard')}
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
                    <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('auth.register.labels.fullName')}</Label>
                    <Input 
                      id="fullName" 
                      placeholder={t('auth.register.placeholders.fullName')} 
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
                      <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('auth.register.labels.email')}</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder={t('auth.register.placeholders.email')} 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 text-base bg-background/70 border-border"
                        autoComplete="email"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('auth.register.labels.password')}</Label>
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
                        {t('auth.register.hints.password')}
                      </p>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <div className="space-y-5 mb-1 sm:mb-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('auth.register.labels.manualGrade')}</Label>
                        <select
                          id="grade"
                          value={selectedGrade}
                          onChange={(e) => setSelectedGrade(e.target.value)}
                          className="flex h-12 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-base disabled:opacity-50"
                          required
                        >
                          <option value="5">Klasse 5</option>
                          <option value="6">Klasse 6</option>
                          <option value="7">Klasse 7</option>
                          <option value="8">Klasse 8</option>
                          <option value="9">Klasse 9</option>
                          <option value="10">Klasse 10</option>
                          <option value="11">Klasse 11</option>
                          <option value="12">Klasse 12</option>
                          <option value={OPTION_TEACHER}>{t('auth.register.options.teacher')}</option>
                          <option value={OPTION_PARENT}>{t('auth.register.options.parent')}</option>
                        </select>
                      </div>

                      {!isSpecialRole && (
                        <div className="space-y-2">
                          <Label htmlFor="gradeSuffix" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('auth.register.labels.gradeSuffix')}</Label>
                          <Input 
                            id="gradeSuffix" 
                            placeholder={t('auth.register.placeholders.gradeSuffix')} 
                            value={gradeSuffix}
                            onChange={(e) => setGradeSuffix(e.target.value)}
                            className="h-12 text-base bg-background/70 border-border"
                          />
                        </div>
                      )}
                    </div>

                    {selectedGrade === OPTION_TEACHER && (
                      <div className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                        <p className="text-sm font-bold text-foreground">{t('auth.register.teacherInfo.title')}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t('auth.register.teacherInfo.text')}
                        </p>
                      </div>
                    )}

                    {selectedGrade === OPTION_PARENT && (
                      <div className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border/50">
                        <p className="text-sm font-bold text-foreground">{t('auth.register.parentInfo.title')}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t('auth.register.parentInfo.text')}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
                        <Checkbox
                          id="age16"
                          checked={isAtLeast16}
                          onCheckedChange={(checked) => setIsAtLeast16(checked === true)}
                          className="mt-0.5 shrink-0"
                        />
                        <Label htmlFor="age16" className="!block text-xs leading-relaxed text-muted-foreground font-medium cursor-pointer">
                          {t('auth.register.checkboxes.age16')}
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
                          {t('auth.register.checkboxes.terms')}{' '}
                          <a
                            href={`${mainBaseUrl}/legal/agb`}
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
              </CardContent>
              <CardFooter className="flex flex-col space-y-5 border-0 bg-transparent rounded-none px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-4">
                <div className="w-full flex gap-2">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                      disabled={loading}
                    >
                      {t('auth.register.buttons.back')}
                    </Button>
                  )}

                  <Button type="submit" className="flex-1 h-12" disabled={loading}>
                    {step < 3 ? t('auth.register.buttons.next') : (loading ? t('auth.register.buttons.creating') : t('auth.register.buttons.submit'))}
                  </Button>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {t('auth.register.footer.alreadyHaveAccount')}{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    {t('auth.register.footer.login')}
                  </Link>
                  <br />
                  <span className="text-xs">
                    <a href={`${mainBaseUrl}/legal/datenschutz`} className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">
                      {t('auth.register.footer.privacy')}
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
