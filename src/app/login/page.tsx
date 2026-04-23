'use client'

import { useState, useEffect } from 'react'
import { db, getFirebaseAuth, getFirebaseFunctions } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { ForgotPasswordDialog } from '@/components/modals/ForgotPasswordDialog'
import { useAuth } from '@/context/AuthContext'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { getAppHomeUrl, getAccessTargetFromProfile, getSupportBaseUrl } from '@/lib/dashboard-url'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

const auth = getFirebaseAuth()
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function hasRecentTwoFactorVerification(userId: string): boolean {
  if (typeof window === 'undefined') return false

  const raw = window.localStorage.getItem(`abi_last_2fa_verification_at_${userId}`)
  if (!raw) return false

  const timestamp = Number.parseInt(raw, 10)
  if (!Number.isFinite(timestamp)) return false

  return Date.now() - timestamp < THIRTY_DAYS_MS
}

export default function LoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reasonMessage, setReasonMessage] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  
  // 2FA state
  const [step, setStep] = useState<'login' | '2fa'>('login')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const { set2FAVerified } = useAuth()
  const functions = getFirebaseFunctions()
  
  const router = useRouter()

  const redirectToApp = (target: 'dashboard' | 'tcg' | 'shop' | 'support') => {
    if (typeof window === 'undefined') {
      router.push('/')
      return
    }

    if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
      router.replace(redirectPath)
      return
    }

    window.location.href = getAppHomeUrl(window.location, target)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const reason = params.get('reason')
      const redirect = params.get('redirect')
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        setRedirectPath(redirect)
      }
      if (reason === 'timeout') {
        setReasonMessage(t('auth.login.errors.timeout'))
      } else if (reason === 'unauthorized') {
        setReasonMessage(t('auth.login.errors.unauthorized'))
      }
    }
  }, [t])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('[Login] Attempting sign-in for:', email)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        throw new Error(t('auth.login.errors.domainRestricted'))
      }
      
      console.log('[Login] calling signInWithEmailAndPassword...')
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      const uid = userCredential.user.uid
      console.log('[Login] auth success, uid:', uid)

      // Check if 2FA is enabled
      console.log('[Login] fetching profile from abi-data...')
      const profileSnap = await getDoc(doc(db, 'profiles', uid))
      
      if (!profileSnap.exists()) {
        console.error('[Login] Profile not found for UID:', uid)
        // If profile doesn't exist, we assume no 2FA
        set2FAVerified(true)
        redirectToApp('tcg')
        return
      }

      const profileData = profileSnap.data()
      console.log('[Login] profile fetched, is_2fa_enabled:', profileData?.is_2fa_enabled)
      const accessTarget = getAccessTargetFromProfile(profileData)
      
      const requires2FA = profileData?.is_2fa_enabled && !hasRecentTwoFactorVerification(uid)

      if (requires2FA) {
        console.log('[Login] switching to 2FA step')
        setStep('2fa')
      } else {
        console.log('[Login] no 2FA (or already verified), proceeding to app target:', accessTarget)
        set2FAVerified(true)
        redirectToApp(accessTarget)
      }
    } catch (err: any) {
      console.error('[Login] Error during sign-in:', err)
      let message = t('auth.login.errors.failed')
      if (err.code === 'auth/user-not-found') message = t('auth.login.errors.userNotFound')
      if (err.code === 'auth/wrong-password') message = t('auth.login.errors.wrongPassword')
      if (err.code === 'auth/invalid-credential') message = t('auth.login.errors.invalidCredential')
      setError(message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorCode.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const verifyLogin2FA = httpsCallable<{ code: string }, { success: boolean }>(functions, 'verifyLogin2FA')
      const result = await verifyLogin2FA({ code: twoFactorCode })

      if (result.data.success) {
        set2FAVerified(true)
        const uid = auth.currentUser?.uid
        if (!uid) {
          redirectToApp('tcg')
          return
        }

        const profileSnap = await getDoc(doc(db, 'profiles', uid))
        const accessTarget = getAccessTargetFromProfile(profileSnap.exists() ? profileSnap.data() : null)
        redirectToApp(accessTarget)
      } else {
        throw new Error(t('auth.login.errors.invalidCode'))
      }
    } catch (err: any) {
      console.error('2FA Verification failed:', err)
      setError(err.message || t('auth.login.errors.expiredCode'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:flex md:items-center md:justify-center relative">
      {/* Language Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageToggle />
      </div>

      <div className="mx-auto w-full max-w-md flex flex-col items-center gap-8">
        <Logo width={120} height={120} />
        <Card className="w-full rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
          <div className="px-5 pt-4 sm:px-7 sm:pt-5">
            {step === '2fa' ? (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground hover:text-foreground gap-2"
                onClick={() => {
                  setStep('login')
                  setError(null)
                  setTwoFactorCode('')
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('auth.login.backToLogin')}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground hover:text-foreground"
                render={<Link href="/">{t('auth.login.backToHome')}</Link>}
              />
            )}
          </div>
          
          <CardHeader className="space-y-3 px-5 pb-7 pt-3 text-center sm:px-7 sm:pb-9 sm:pt-5">
            <CardTitle className="text-4xl font-black tracking-tight">
              {step === 'login' ? t('auth.login.title') : t('auth.login.verifying')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 'login' 
                ? t('auth.login.desc') 
                : t('auth.login.desc2fa')}
            </CardDescription>
          </CardHeader>

          {step === 'login' ? (
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
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('auth.login.email')}</Label>
                   <Input 
                     id="email" 
                     type="email" 
                     placeholder="nachname.vorname@hgr-web.lernsax.de" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/70 border-border h-12 text-base focus:bg-background transition-all"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('auth.login.password')}</Label>
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
                  {loading ? t('auth.login.buttonLoading') : t('auth.login.button')}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  {t('auth.login.noAccount')}{' '}
                  <Link href="/register" className="text-foreground hover:underline font-bold decoration-2 underline-offset-4">
                    {t('auth.login.register')}
                  </Link>
                </p>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA}>
              <CardContent className="space-y-6 px-5 pb-7 sm:space-y-7 sm:px-7 sm:pb-8 text-center">
                {error && (
                  <div className="text-destructive text-sm p-3 rounded-md bg-destructive/10 text-center font-medium">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="2fa-code" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t('auth.login.twoFactorCode')}
                  </Label>
                  <Input 
                    id="2fa-code" 
                    placeholder="000000"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-3xl tracking-[0.5em] font-mono h-16 bg-background/70 border-border"
                    autoFocus
                    autoComplete="one-time-code"
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.login.twoFactorHint')}
                  </p>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                      {t('auth.login.twoFactorLost')}
                    </p>
                    <a 
                      href={getSupportBaseUrl()}
                      className="text-xs font-bold text-primary hover:underline underline-offset-4"
                    >
                      {t('auth.login.contactAdmin')} →
                    </a>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-6 border-0 bg-transparent rounded-none px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-4">
                <Button type="submit" className="w-full h-12 text-base font-bold shadow-md active:scale-[0.98] transition-transform" disabled={loading || twoFactorCode.length !== 6}>
                  {loading ? t('auth.login.verifyButtonLoading') : t('auth.login.verifyButton')}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
