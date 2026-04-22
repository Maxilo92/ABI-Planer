'use client'

import { getMainBaseUrl } from '@/lib/dashboard-url'
import { Logo } from '@/components/Logo'
import Link from 'next/link'

export function SupportFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-muted/30">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Logo width={30} height={30} />
              <span className="font-bold tracking-tight">ABI Planer Support</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Dein Begleiter für eine stressfreie Abitur-Planung. Wir helfen dir bei technischen Problemen, Fragen zur Registrierung oder zum Sammelkarten-Game.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Ressourcen</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">Startseite</Link>
              </li>
              <li>
                <Link href="/beschwerden" className="hover:text-primary transition-colors">Beschwerde einreichen</Link>
              </li>
              <li>
                <a href={`${getMainBaseUrl()}/agb`} className="hover:text-primary transition-colors">AGB</a>
              </li>
              <li>
                <a href={`${getMainBaseUrl()}/datenschutz`} className="hover:text-primary transition-colors">Datenschutz</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Plattform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={getMainBaseUrl()} className="hover:text-primary transition-colors">ABI Planer öffnen</a>
              </li>
              <li>
                <a href={`${getMainBaseUrl()}/login`} className="hover:text-primary transition-colors">Anmelden</a>
              </li>
              <li>
                <a href={`${getMainBaseUrl()}/impressum`} className="hover:text-primary transition-colors">Impressum</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} ABI Planer Team. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-6">
            <span>Version {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
            <a href="https://abi-planer-27.de" className="hover:text-primary underline underline-offset-4">abi-planer-27.de</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
