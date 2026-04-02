'use client'

import { useState } from 'react'
import { functions } from '@/lib/firebase'
import { httpsCallable } from 'firebase/functions'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react'
import { Profile } from '@/types/database'

interface TOTPSetupProps {
  profile: Profile
}

export function TOTPSetup({ profile }: TOTPSetupProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'initial' | 'setup' | 'verifying'>('initial')
  const [setupData, setSetupData] = useState<{ secret: string, qrCodeUrl: string } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleStartSetup = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const setup2FA = httpsCallable<object, { secret: string, qrCodeUrl: string }>(functions, 'setup2FA')
      const result = await setup2FA()
      setSetupData(result.data)
      setStep('setup')
    } catch (err: any) {
      console.error('Error starting 2FA setup:', err)
      setMessage({ type: 'error', text: 'Fehler beim Starten des Setups: ' + (err.message || 'Unbekannter Fehler') })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupData || verificationCode.length !== 6) return

    setLoading(true)
    setMessage(null)
    try {
      const verifyInitial2FA = httpsCallable<{ secret: string, code: string }, { success: boolean }>(functions, 'verifyInitial2FA')
      await verifyInitial2FA({
        secret: setupData.secret,
        code: verificationCode
      })
      setMessage({ type: 'success', text: 'Zwei-Faktor-Authentisierung erfolgreich aktiviert.' })
      setTimeout(() => setOpen(false), 2000)
    } catch (err: any) {
      console.error('Error verifying 2FA:', err)
      setMessage({ type: 'error', text: 'Fehler bei der Verifizierung: ' + (err.message || 'Ungültiger Code') })
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!confirm('Möchten Sie die Zwei-Faktor-Authentisierung wirklich deaktivieren?')) return

    setLoading(true)
    setMessage(null)
    try {
      const disable2FA = httpsCallable<{ code?: string }, { success: boolean }>(functions, 'disable2FA')
      // For disabling, we might need a code too if we want it extra secure, 
      // but current implementation doesn't strictly require it or we can prompt.
      // The backend 'disable2FA' expects a 'code'.
      const code = prompt('Bitte gib zur Deaktivierung einen aktuellen 2FA-Code ein:')
      if (!code) {
        setLoading(false)
        return
      }
      await disable2FA({ code })
      setMessage({ type: 'success', text: 'Zwei-Faktor-Authentisierung wurde deaktiviert.' })
      setTimeout(() => setOpen(false), 2000)
    } catch (err: any) {
      console.error('Error disabling 2FA:', err)
      setMessage({ type: 'error', text: 'Fehler beim Deaktivieren: ' + (err.message || 'Unbekannter Fehler') })
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setStep('initial')
    setSetupData(null)
    setVerificationCode('')
    setMessage(null)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger
        render={
          <Button variant={profile.is_2fa_enabled ? "outline" : "default"} className="w-full">
            {profile.is_2fa_enabled ? (
              <>
                <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                2FA verwalten
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                2FA einrichten
              </>
            )}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zwei-Faktor-Authentisierung (2FA)</DialogTitle>
          <DialogDescription>
            Sichere dein Konto zusätzlich ab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-destructive/15 text-destructive'}`}>
              {message.text}
            </div>
          )}

          {profile.is_2fa_enabled && step === 'initial' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg">
                <ShieldCheck className="h-6 w-6 shrink-0" />
                <p className="text-sm font-medium">Die Zwei-Faktor-Authentisierung ist für dein Konto aktiviert.</p>
              </div>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleDisable}
                disabled={loading}
              >
                {loading ? 'Deaktivieren...' : '2FA deaktivieren'}
              </Button>
            </div>
          ) : step === 'initial' ? (
            <div className="space-y-4 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Durch die Aktivierung der 2FA wird dein Konto durch einen zusätzlichen Code geschützt, 
                den du mit einer Authenticator-App (z.B. Google Authenticator, Authy) generierst.
              </p>
              <Button className="w-full" onClick={handleStartSetup} disabled={loading}>
                {loading ? 'Laden...' : 'Setup starten'}
              </Button>
            </div>
          ) : step === 'setup' && setupData ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>1. Scanne diesen QR-Code</Label>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Oder gib diesen Code manuell ein: <code className="bg-muted px-1 rounded">{setupData.secret}</code>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">2. Gib den 6-stelligen Code ein</Label>
                  <Input
                    id="verification-code"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || verificationCode.length !== 6}>
                  {loading ? 'Verifizieren...' : 'Verifizieren & Aktivieren'}
                </Button>
              </form>
            </div>
          ) : null}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
