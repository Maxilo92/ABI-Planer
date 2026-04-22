'use client'

import { usePathname } from 'next/navigation'
import { getMainBaseUrl } from '@/lib/dashboard-url'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Locale } from '@/lib/helpFaqs'

export function SupportFooter() {
  const pathname = usePathname()
  const locale = (pathname.split('/')[1] as Locale) || 'de'
  const currentYear = new Date().getFullYear()

  const t = {
    de: {
      description: 'Dein Begleiter für eine stressfreie Abitur-Planung. Wir helfen dir bei technischen Problemen, Fragen zur Registrierung oder zum Sammelkarten-Game.',
      resources: 'Ressourcen',
      platform: 'Plattform',
      home: 'Startseite',
      complaint: 'Beschwerde einreichen',
      open: 'ABI Planer öffnen',
      login: 'Anmelden',
      imprint: 'Impressum',
      rights: 'Alle Rechte vorbehalten.'
    },
    en: {
      description: 'Your companion for stress-free graduation planning. We help with technical issues, registration questions, or the trading card game.',
      resources: 'Resources',
      platform: 'Platform',
      home: 'Home',
      complaint: 'Submit a complaint',
      open: 'Open ABI Planner',
      login: 'Login',
      imprint: 'Imprint',
      rights: 'All rights reserved.'
    }
  }[locale]

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
              {t.description}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">{t.resources}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}`} className="hover:text-primary transition-colors">{t.home}</Link>
              </li>
              <li>
                <Link href={`/${locale}/beschwerden`} className="hover:text-primary transition-colors">{t.complaint}</Link>
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
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">{t.platform}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={getMainBaseUrl()} className="hover:text-primary transition-colors">{t.open}</a>
              </li>
              <li>
                <a href={`${getMainBaseUrl()}/login`} className="hover:text-primary transition-colors">{t.login}</a>
              </li>
              <li>
                <a href={`${getMainBaseUrl()}/impressum`} className="hover:text-primary transition-colors">{t.imprint}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} ABI Planer Team. {t.rights}</p>
          <div className="flex items-center gap-6">
            <span>Version {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
            <a href="https://abi-planer-27.de" className="hover:text-primary underline underline-offset-4">abi-planer-27.de</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
