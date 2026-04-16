'use client'

import { useState, useEffect } from 'react'
import { db, functions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Trash2, X, ShieldAlert, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DelayedAction } from '@/types/database'
import { logAction } from '@/lib/logging'
import { usePopupManager } from '@/modules/popup/usePopupManager'

const DANGER_ACTIONS = [
  {
    id: 'SYSTEM_TEST_DRY_RUN',
    title: 'System-Test (Keine Auswirkung)',
    description: 'Testet den kompletten Sicherheits-Workflow inklusive 2FA-Validierung, 24h-Warteschlange und globalem Countdown-Banner, ohne Änderungen an der Datenbank vorzunehmen.',
    confirmationString: 'RUN SYSTEM TEST',
    severity: 'low'
  },
  {
    id: 'EMPTY_ALL_ALBUMS',
    title: 'Alle Alben leeren (Progression Reset)',
    description: 'Löscht alle "user_teachers" Einträge. Alle Nutzer verlieren ihre Karten, aber die registrierten Lehrer bleiben in der Datenbank ("teachers" Collection) und können weiterhin gezogen werden.',
    confirmationString: 'EMPTY ALL ALBUMS',
    severity: 'medium'
  },
  {
    id: 'WIPE_TEACHER_DB',
    title: 'Lehrer-Datenbank löschen (Total Reset)',
    description: 'Löscht die gesamte Lehrer-Basis ("teachers" Collection) UND alle Nutzer-Karten. Danach können keine Karten mehr gezogen werden, bis neue Lehrer importiert wurden.',
    confirmationString: 'WIPE TEACHER DATABASE',
    severity: 'high'
  },
  {
    id: 'RESET_ALL_VOTES',
    title: 'Alle Lehrer-Bewertungen löschen',
    description: 'Setzt alle "votes" Dokumente zurück. Alle bisherigen Stimmen für Lehrer-Seltenheiten werden gelöscht und die globalen Statistiken auf den Ursprungszustand gesetzt.',
    confirmationString: 'RESET ALL VOTES',
    severity: 'medium'
  },
  {
    id: 'DELETE_ALL_FEEDBACK',
    title: 'Sämtliches Feedback unwiderruflich löschen',
    description: 'Sämtliches Feedback wird gelöscht. Eingereichte Fehlerberichte, Wünsche und Nachrichten von Nutzern gehen vollständig verloren.',
    confirmationString: 'DELETE ALL FEEDBACK',
    severity: 'low'
    }
    ]

export default function DangerZonePage() {
  const { profile, loading: authLoading } = useAuth()
  const { confirm } = usePopupManager()
  const [pendingActions, setPendingActions] = useState<DelayedAction[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<typeof DANGER_ACTIONS[0] | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isMainAdmin = profile?.role === 'admin_main'
  const is2FAEnabled = profile?.is_2fa_enabled

  useEffect(() => {
    if (!authLoading && (!profile || !isMainAdmin)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [profile, authLoading, isMainAdmin, router, pathname])

  useEffect(() => {
    if (!isMainAdmin) return

    const q = query(
      collection(db, 'delayed_actions'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actions = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          executableAt: data.executableAt instanceof Timestamp ? data.executableAt.toDate().toISOString() : data.executableAt,
        } as DelayedAction
      })
      setPendingActions(actions)
      setLoading(false)
    }, (error) => {
      console.error('DangerZonePage: Error listening to delayed actions:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isMainAdmin])

  const fetchActions = async () => {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'delayed_actions'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const actions = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          executableAt: data.executableAt instanceof Timestamp ? data.executableAt.toDate().toISOString() : data.executableAt,
        } as DelayedAction
      })
      setPendingActions(actions)
    } catch (error) {
      console.error('Error fetching actions:', error)
      toast.error('Fehler beim Laden der Aktionen.')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerAction = async () => {
    if (!is2FAEnabled) {
      toast.error('Zwei-Faktor-Authentisierung ist erforderlich.')
      return
    }

    if (!selectedAction) return

    if (confirmText.toLowerCase() !== selectedAction.confirmationString.toLowerCase()) {
      toast.error('Bestätigungstext stimmt nicht überein.')
      return
    }

    if (totpCode.length !== 6) {
      toast.error('Bitte gib einen gültigen 6-stelligen 2FA Code ein.')
      return
    }

    setIsSubmitting(true)
    try {
      const authorizeDangerAction = httpsCallable(functions, 'authorizeDangerAction')
      await authorizeDangerAction({
        actionType: selectedAction.id,
        confirmationString: confirmText,
        code: totpCode,
        payload: { description: selectedAction.description }
      })

      toast.success('Aktion erfolgreich geplant. Sie wird in 24 Stunden ausführbar sein.')
      setDialogOpen(false)
      setConfirmText('')
      setTotpCode('')
    } catch (error: any) {
      console.error('Error triggering danger action:', error)
      toast.error(error.message || 'Fehler beim Planen der Aktion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelAction = async (action: DelayedAction) => {
    const confirmed = await confirm({
      title: 'Geplante Aktion abbrechen?',
      content: 'Möchtest du diese geplante Aktion wirklich abbrechen?',
      priority: 'high',
      confirmLabel: 'Abbrechen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return

    try {
      const docRef = doc(db, 'delayed_actions', action.id)
      await updateDoc(docRef, { 
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelledBy: profile?.id || 'unknown'
      })
      
      // Log cancellation
      if (profile) {
        await logAction(
          'DANGER_ACTION_CANCELLED',
          profile.id,
          profile.full_name,
          { 
            actionId: action.id, 
            actionType: action.actionType,
            originalTriggeredBy: action.triggeredBy
          }
        )
      }
      
      toast.success('Aktion abgebrochen und protokolliert.')
    } catch (error: any) {
      console.error('Error cancelling action:', error)
      toast.error('Fehler beim Abbrechen der Aktion.')
    }
  }

  if (authLoading || (loading && pendingActions.length === 0)) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Danger Zone...</div>
  }

  if (!profile || !isMainAdmin) return null

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" />
          Danger Zone
        </h1>
        <p className="text-muted-foreground">
          Kritische Systemaktionen, die eine 2FA-Bestätigung und eine 24-stündige Wartezeit erfordern.
        </p>
      </div>

      {!is2FAEnabled && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-full">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-400 text-lg">2FA Erforderlich</CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-500">
                Um Aktionen in der Danger Zone auszuführen, musst du zuerst die Zwei-Faktor-Authentisierung in deinem Profil aktivieren.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40" onClick={() => router.push('/profil')}>
              Jetzt 2FA einrichten
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DANGER_ACTIONS.map((action) => (
          <Card key={action.id} className={`border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors ${!is2FAEnabled ? 'opacity-60 grayscale' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Dialog open={dialogOpen && selectedAction?.id === action.id} onOpenChange={(open) => {
                if (!is2FAEnabled) return
                setDialogOpen(open)
                if (open) setSelectedAction(action)
              }}>
                <DialogTrigger 
                  render={
                    <Button variant="destructive" className="w-full gap-2" disabled={!is2FAEnabled}>
                      <AlertTriangle className="h-4 w-4" />
                      Aktion planen
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Aktion bestätigen
                    </DialogTitle>
                    <DialogDescription>
                      Diese Aktion ist hochgradig destruktiv. Bitte bestätige deine Identität und die Absicht.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Bitte tippe <span className="font-mono font-bold select-all">"{action.confirmationString}"</span> zur Bestätigung:
                      </label>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={action.confirmationString}
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        6-stelliger 2FA Code (Authenticator App):
                      </label>
                      <Input
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        type="text"
                        pattern="\d*"
                      />
                    </div>
                    
                    <div className="p-3 bg-muted rounded-md text-xs flex gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p>Nach der Bestätigung wird die Aktion in die Warteschlange gestellt und kann erst nach 24 Stunden ausgeführt werden.</p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                      Abbrechen
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleTriggerAction} 
                      disabled={isSubmitting || confirmText !== action.confirmationString || totpCode.length !== 6}
                    >
                      {isSubmitting ? 'Verarbeite...' : 'Unwiderruflich planen'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Geplante & Vergangene Aktionen
          </h2>
          <Button variant="outline" size="sm" onClick={fetchActions} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        {pendingActions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Keine geplanten Aktionen vorhanden.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingActions.map((action) => (
              <Card key={action.id} className={action.status === 'pending' ? 'border-amber-500/50 bg-amber-50/5' : ''}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {action.status === 'pending' && <Clock className="h-5 w-5 text-amber-500" />}
                      {action.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {action.status === 'cancelled' && <X className="h-5 w-5 text-muted-foreground" />}
                      {action.status === 'failed' && <AlertCircle className="h-5 w-5 text-destructive" />}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {action.actionType}
                        <Badge variant={
                          action.status === 'pending' ? 'outline' : 
                          action.status === 'completed' ? 'secondary' : 
                          action.status === 'failed' ? 'destructive' : 'ghost'
                        }>
                          {action.status === 'pending' ? 'Wartend' : 
                           action.status === 'completed' ? 'Abgeschlossen' : 
                           action.status === 'failed' ? 'Fehlgeschlagen' : 'Abgebrochen'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                      {action.error && (
                        <p className="text-xs text-destructive font-medium mt-1">Fehler: {action.error}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Triggered by: <strong>{action.triggeredByName}</strong></span>
                        <span>Erstellt am: {new Date(action.createdAt).toLocaleString('de-DE')}</span>
                        {action.status === 'pending' && (
                          <span className="text-amber-600 font-medium">
                            Ausführbar ab: {new Date(action.executableAt).toLocaleString('de-DE')}
                          </span>
                        )}
                        {action.completedAt && (
                          <span>Abgeschlossen am: {new Date(action.completedAt instanceof Timestamp ? action.completedAt.toDate() : action.completedAt).toLocaleString('de-DE')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {action.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10 border-destructive/20 font-bold"
                      onClick={() => handleCancelAction(action)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      STOPP (Abbrechen)
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

