'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShieldX, Home, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const reason = searchParams.get('reason')

  const reasonMessage = reason === 'admin'
    ? 'Dieser Bereich ist nur fuer Admins freigegeben.'
    : 'Du hast keine Berechtigung fuer diese Seite.'

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border bg-card/80 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
          <ShieldX className="h-7 w-7 text-destructive" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Fehler 403</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Kein Zugriff</h1>
        <p className="mt-3 text-muted-foreground">
          {reasonMessage}
        </p>

        {from && (
          <p className="mt-4 break-all rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Angefragter Pfad: {from}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button render={<Link href="/" />} className="gap-2">
            <Home className="h-4 w-4" />
            Zur Startseite
          </Button>
          <Button variant="outline" render={<Link href="/login?reason=unauthorized" />} className="gap-2">
            <LogIn className="h-4 w-4" />
            Anmelden
          </Button>
        </div>
      </div>
    </div>
  )
}
