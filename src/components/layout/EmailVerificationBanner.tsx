'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AlertCircle, Mail, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function EmailVerificationBanner() {
  const { user, profile, resendVerification, requestEmailChange, refreshAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const [changeMode, setChangeMode] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  if (!user || user.emailVerified) return null

  const isReferred = !!profile?.referred_by

  const handleResend = async () => {
    setLoading(true)
    try {
      await resendVerification()
      setResent(true)
      toast.success('Verifizierungs-E-Mail wurde erneut gesendet!')
    } catch (error: any) {
      toast.error('Fehler beim Senden: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refreshAuth()
      toast.info('Status aktualisiert. Bitte prüfe, ob die Warnung noch angezeigt wird.')
    } catch (error: any) {
      toast.error('Fehler beim Aktualisieren: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) {
      toast.error('Bitte gib zuerst eine neue E-Mail-Adresse ein.')
      return
    }

    setLoading(true)
    try {
      await requestEmailChange(newEmail)
      setResent(true)
      setChangeMode(false)
      toast.success('Änderungs-Mail gesendet. Bitte bestätige die neue E-Mail in deinem Postfach.')
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Ändern der E-Mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-warning/15 border-b border-warning/20 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-3">
        <div className="flex items-center gap-3 text-warning-foreground">
          <div className="bg-warning/20 p-2 rounded-full">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Verifizierungs-E-Mail an {user.email} gesendet</p>
            <p className="text-xs opacity-80">
              {isReferred 
                ? "Erst nach der Verifizierung erhältst du deine Willkommens-Booster und kannst andere werben."
                : "Erst nach der Verifizierung kannst du andere Nutzer werben und Bonus-Booster erhalten."}
            </p>
            <p className="text-xs opacity-80 mt-1">
              Bitte prüfe, ob die E-Mail korrekt ist. Falls nicht, kannst du sie direkt hier ändern.
            </p>
          </div>
        </div>
        
        {changeMode && (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Input
              type="email"
              placeholder="nachname.vorname@hgr-web.lernsax.de"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-9 bg-background"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRequestEmailChange}
                disabled={loading}
                className="h-9 text-xs"
              >
                Neue E-Mail bestätigen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangeMode(false)}
                disabled={loading}
                className="h-9 text-xs"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResend} 
            disabled={loading || resent}
            className="flex-1 sm:flex-none h-9 text-xs gap-2"
          >
            {resent ? <CheckCircle2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            {resent ? 'Gesendet' : 'E-Mail erneut senden'}
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={loading}
            className="flex-1 sm:flex-none h-9 text-xs gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Status prüfen
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChangeMode((prev) => !prev)}
            disabled={loading}
            className="flex-1 sm:flex-none h-9 text-xs"
          >
            E-Mail ändern
          </Button>
        </div>
      </div>
    </div>
  )
}
