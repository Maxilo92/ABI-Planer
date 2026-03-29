import Link from 'next/link'
import { SearchX, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border bg-card/80 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <SearchX className="h-7 w-7 text-primary" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Fehler 404</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Seite nicht gefunden</h1>
        <p className="mt-3 text-muted-foreground">
          Diese URL existiert nicht oder wurde verschoben.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button render={<Link href="/" />} className="gap-2">
            <Home className="h-4 w-4" />
            Zur Startseite
          </Button>
          <Button variant="outline" render={<Link href="/hilfe" />} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zur Hilfe
          </Button>
        </div>
      </div>
    </div>
  )
}
