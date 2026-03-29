'use client'

import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle, CheckCircle2, Search, Info } from 'lucide-react'
import Link from 'next/link'

export default function MigrateReferralsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Debug states
  const [debugCode, setDebugCode] = useState('')
  const [debugLoading, setDebugLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)

  const isAdmin = profile && ['admin', 'admin_main', 'admin_co'].includes(profile.role)

  const handleCheckCode = async () => {
    if (!debugCode.trim()) return
    setDebugLoading(true)
    setDebugResult(null)
    try {
      const checkFn = httpsCallable(functions, 'debugCheckReferralCode')
      const response = await checkFn({ code: debugCode.trim() })
      setDebugResult(response.data)
    } catch (err: any) {
      setDebugResult({ found: false, reason: 'error', error: err.message })
    } finally {
      setDebugLoading(false)
    }
  }

  const handleMigrate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const migrateFn = httpsCallable(functions, 'adminMigrateReferrals')
      const response = await migrateFn()
      setResult(response.data)
    } catch (err: any) {
      console.error('Migration error:', err)
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
        <p className="mt-2">Du hast keine Berechtigung, diese Seite aufzurufen.</p>
        <Button render={<Link href="/">Zum Dashboard</Link>} className="mt-4" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">System-Migration</h1>
        <Button variant="outline" render={<Link href="/admin">Zurück zur Übersicht</Link>} />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Referrer-Check (Diagnose)
          </CardTitle>
          <CardDescription>
            Prüfe hier, ob ein Code (UID oder Kurz-Code) vom System gefunden wird.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Code eingeben (z.B. n3BhNhnp)" 
              value={debugCode}
              onChange={(e) => setDebugCode(e.target.value)}
              className="bg-background"
            />
            <Button onClick={handleCheckCode} disabled={debugLoading}>
              {debugLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Prüfen'}
            </Button>
          </div>

          {debugResult && (
            <div className={`p-4 rounded-lg text-sm border ${
              debugResult.found ? 'bg-green-50 border-green-200 text-green-800' : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              {debugResult.found ? (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Gefunden!
                  </p>
                  <p>Name: {debugResult.name || 'Unbekannt'}</p>
                  <p>UID: <code className="bg-white/50 px-1 rounded">{debugResult.uid}</code></p>
                  <p>Typ: {debugResult.type === 'uid' ? 'Direkte User-ID' : 'Kurz-Code'}</p>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Nicht gefunden
                    </p>
                    <p>Grund: {debugResult.reason === 'query_error' ? `Datenbank-Fehler (${debugResult.error})` : 'Code existiert nicht.'}</p>

                    {debugResult.existingSamples && debugResult.existingSamples.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-destructive/10">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Existierende Beispiel-Codes in der DB:</p>
                        <ul className="space-y-2">
                          {debugResult.existingSamples.map((s: any) => (
                            <li key={s.uid} className="flex flex-col bg-background/50 p-2 rounded border border-destructive/5">
                              <span className="font-mono font-bold text-foreground">Code: {s.code}</span>
                              <span className="text-[10px] opacity-70">Nutzer: {s.name} (UID: {s.uid})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {debugResult.reason === 'query_error' && (
                ...
                    <p className="text-xs mt-2 opacity-80">
                      <Info className="h-3 w-3 inline mr-1" />
                      Hinweis: Ein Datenbank-Fehler deutet oft auf einen fehlenden Firestore-Index hin.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral-System V2</CardTitle>
          <CardDescription>
            Diese Funktion überführt alle bestehenden Empfehlungsdaten in das neue robuste System (`referral_claims`).
            Dabei werden auch die Statistiken (`total_referrals`) in den Profilen korrigiert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result && !error && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              Hinweis: Die Migration ist idempotent. Bereits migrierte Daten werden nicht doppelt verarbeitet.
            </div>
          )}

          {error && (
            <div className="bg-destructive/15 border border-destructive/20 p-4 rounded-lg text-sm text-destructive flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-bold">Migration erfolgreich!</p>
                <ul className="mt-2 space-y-1 opacity-90">
                  <li>Verarbeitet: {result.totalProcessed}</li>
                  <li>Neu migriert: {result.migratedCount}</li>
                  <li>Übersprungen: {result.skippedCount}</li>
                </ul>
              </div>
            </div>
          )}

          <Button 
            onClick={handleMigrate} 
            disabled={loading}
            className="w-full h-12 text-lg font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Migration läuft...
              </>
            ) : (
              'Referrals migrieren'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
