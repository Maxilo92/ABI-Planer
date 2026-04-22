'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getFirebaseFunctions } from '@/lib/firebase'
import { httpsCallable } from 'firebase/functions'
import { ShieldCheck, LogOut, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import Logo from '@/components/Logo'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { getSupportBaseUrl } from '@/lib/dashboard-url'

const auth = getFirebaseAuth()

export function TwoFactorGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, is2FAVerified, is2FAInitialCheckDone, set2FAVerified } = useAuth()
  const { t } = useLanguage()
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const functions = getFirebaseFunctions()
  const pathname = usePathname()
  const supportUrl = getSupportBaseUrl()

  // If loading auth or no user, let the AuthProvider/AppShell handle redirection
  if (loading || !user || !profile) return children

  // If we haven't finished checking sessionStorage for 2FA status, don't show gate yet
  if (!is2FAInitialCheckDone) return children

  // Determine if we are in TCG area or Shop area (both exempt from 2FA gate)
  const isTcgArea = typeof window !== 'undefined' && (
                    window.location.hostname.startsWith('tcg.') || 
                    pathname?.startsWith('/sammelkarten') || 
                    pathname?.startsWith('/battle-pass')
                  )
  const isShopArea = typeof window !== 'undefined' && (
                    window.location.hostname.startsWith('shop.') || 
                    pathname?.startsWith('/shop')
                  )

  // If 2FA is not enabled, already verified, or user is in TCG/Shop area, show content
  // TCG and Shop are exempt from 2FA gate to allow quick collection/browsing without friction
  if (!profile.is_2fa_enabled || is2FAVerified || isTcgArea || isShopArea) {
    return children
  }

  // Otherwise, show the 2FA blocking screen
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setVerifying(true)
    setError(null)

    try {
      const verifyLogin2FA = httpsCallable<{ code: string }, { success: boolean }>(functions, 'verifyLogin2FA')
      const result = await verifyLogin2FA({ code })

      if (result.data.success) {
        set2FAVerified(true)
      } else {
        throw new Error(t('auth.login.errors.invalidCode'))
      }
    } catch (err: any) {
      console.error('2FA Verification failed:', err)
      setError(err.message || t('auth.login.errors.expiredCode'))
    } finally {
      setVerifying(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    window.location.href = '/login'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-8">
          <Logo width={80} height={80} />
        </div>
        
        <Card className="border-border shadow-2xl overflow-hidden">
          <CardHeader className="space-y-3 text-center pt-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.login.verifying')}</CardTitle>
            <CardDescription>
              {t('auth.login.desc2fa')}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleVerify}>
            <CardContent className="space-y-6 pb-8">
              {error && (
                <div className="text-destructive text-sm p-3 rounded-md bg-destructive/10 text-center font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="gate-2fa-code" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center block">
                  {t('auth.login.twoFactorCode')}
                </Label>
                <Input 
                  id="gate-2fa-code" 
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-4xl tracking-[0.4em] font-mono h-20 bg-background/50 border-border"
                  autoFocus
                  autoComplete="one-time-code"
                  required 
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3 bg-muted/30 p-6">
              <Button type="submit" className="w-full h-12 font-bold" disabled={verifying || code.length !== 6}>
                {verifying ? t('auth.login.verifyButtonLoading') : t('auth.login.verifyButton')}
              </Button>
              <Button 
                variant="ghost" 
                type="button" 
                className="w-full text-muted-foreground text-xs hover:text-foreground"
                onClick={handleSignOut}
              >
                {t('auth.login.backToLogin')}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {t('auth.login.twoFactorLost')}
          </p>
          <a 
            href={supportUrl}
            className="inline-block text-xs font-bold text-primary hover:underline underline-offset-4"
          >
            {t('auth.login.contactAdmin')} →
          </a>
        </div>
      </div>
    </div>
  )
}
