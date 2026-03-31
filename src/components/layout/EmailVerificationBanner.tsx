'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AlertCircle, Mail, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function EmailVerificationBanner() {
  const { user, profile, resendVerification, refreshAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)

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

  return (
    <div className="bg-warning/15 border-b border-warning/20 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
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
          </div>
        </div>
        
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
        </div>
      </div>
    </div>
  )
}
