'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function LegalNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="p-6 bg-primary/10 rounded-3xl">
            <FileQuestion className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight">Seite nicht gefunden</h1>
          <p className="text-muted-foreground text-lg">
            Das gesuchte Dokument existiert nicht oder wurde verschoben.
          </p>
          <p className="text-sm font-medium text-primary italic pt-2">
            "Diese Seite hat wohl schon vor dem Abi die Schule abgebrochen."
          </p>
        </div>

        <div className="pt-4">
          <Button asChild className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Zurück zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
