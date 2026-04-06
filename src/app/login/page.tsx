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
import { getDashboardRedirectUrl } from '@/lib/dashboard-url'

const auth = getFirebaseAuth()

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reasonMessage, setReasonMessage] = useState<string | null>(null)
  
  // 2FA state
  const [step, setStep] = useState<'login' | '2fa'>('login')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const { set2FAVerified } = useAuth()
  const functions = getFirebaseFunctions()
  
  const router = useRouter()

  const redirectToDashboard = () => {
    if (typeof window === 'undefined') {
      router.push('/')
      return
    }

    window.location.href = getDashboardRedirectUrl(window.location)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const reason = params.get('reason')
      if (reason === 'timeout') {
        setReasonMessage('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.')
      } else if (reason === 'unauthorized') {
        setReasonMessage('Du musst angemeldet sein, um auf diesen Bereich zuzugreifen.')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('[Login] Attempting sign-in for:', email)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Anmeldung nur mit offizieller @hgr-web.lernsax.de E-Mail erlaubt.')
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
        redirectToDashboard()
        return
      }

      const profileData = profileSnap.data()
      console.log('[Login] profile fetched, is_2fa_enabled:', profileData?.is_2fa_enabled)

      if (profileData?.is_2fa_enabled) {
        console.log('[Login] switching to 2FA step')
        setStep('2fa')
      } else {
        console.log('[Login] no 2FA, proceeding to dashboard')
        set2FAVerified(true)
        redirectToDashboard()
      }
    } catch (err: any) {
      console.error('[Login] Error during sign-in:', err)
      let message = 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Daten.'
      if (err.code === 'auth/user-not-found') message = 'Kein Account mit dieser E-Mail gefunden.'
      if (err.code === 'auth/wrong-password') message = 'Falsches Passwort.'
      if (err.code === 'auth/invalid-credential') message = 'E-Mail oder Passwort ist nicht korrekt.'
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
        redirectToDashboard()
      } else {
        throw new Error('Ungültiger Code.')
      }
    } catch (err: any) {
      console.error('2FA Verification failed:', err)
      setError(err.message || 'Der Code ist falsch oder abgelaufen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:flex md:items-center md:justify-center">
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
                Zurück zum Login
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground hover:text-foreground"
                render={<Link href="/">Zurück zur Startseite</Link>}
              />
            )}
          </div>
          
          <CardHeader className="space-y-3 px-5 pb-7 pt-3 text-center sm:px-7 sm:pb-9 sm:pt-5">
            <CardTitle className="text-4xl font-black tracking-tight">
              {step === 'login' ? 'Anmelden' : 'Verifizierung'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 'login' 
                ? 'Nutze dein @hgr-web.lernsax.de Konto' 
                : 'Dein Konto ist durch 2FA geschützt. Bitte gib deinen Code ein.'}
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
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-Mail</Label>
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
                    <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Passwort</Label>
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
                  {loading ? 'Anmeldung...' : 'Anmelden'}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Noch keinen Account?{' '}
                  <Link href="/register" className="text-foreground hover:underline font-bold decoration-2 underline-offset-4">
                    Registrieren
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
                    6-stelliger Authenticator-Code
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
                    Öffne deine Authenticator-App und gib den aktuell angezeigten Code ein.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-6 border-0 bg-transparent rounded-none px-5 pb-7 pt-3 sm:px-7 sm:pb-8 sm:pt-4">
                <Button type="submit" className="w-full h-12 text-base font-bold shadow-md active:scale-[0.98] transition-transform" disabled={loading || twoFactorCode.length !== 6}>
                  {loading ? 'Verifizierung...' : 'Bestätigen'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
