'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { 
  getMainBaseUrl, 
  getDashboardBaseUrl, 
  getTcgBaseUrl, 
  getShopBaseUrl, 
  getSupportBaseUrl 
} from '@/lib/dashboard-url'
import { Coffee, ChevronDown } from 'lucide-react'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export function Footer() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'
  const { profile, user } = useAuth()
  const { claimExtraBoosters } = useUserTeachers()
  const [clickCount, setClickCount] = useState(0)
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  
  const pathname = usePathname()
  const mainBaseUrl = getMainBaseUrl()
  const dashboardUrl = getDashboardBaseUrl()
  const tcgUrl = getTcgBaseUrl()
  const shopUrl = getShopBaseUrl()
  const supportUrl = getSupportBaseUrl()

  // Simple locale detection for the footer
  const isEn = pathname?.includes('/en/')
  const locale = isEn ? 'en' : 'de'

  const handleVersionClick = async () => {
    const alreadyClaimed = profile?.booster_stats?.extra_boosters_claimed
    const newCount = clickCount + 1
    setClickCount(newCount)

    if (newCount === 1) {
      setShowFeedback(isEn ? 'Looking for something?' : 'Was suchst du?')
    } else if (newCount === 2) {
      setShowFeedback('')
    } else if (newCount === 3) {
      if (user && !alreadyClaimed) {
        try {
          await claimExtraBoosters()
          toast.success(isEn ? 'Stop clicking! Here are 5 boosters, now leave me alone!' : 'Hör auf zu klicken! Hier hast du 5 Booster, jetzt lass mich in Ruhe!', {
            icon: '',
            duration: 5000
          })
          setShowFeedback('')
        } catch (error: any) {
          setShowFeedback('')
        }
      } else {
        setShowFeedback('')
      }
      setClickCount(0)
    }
    setTimeout(() => setShowFeedback(null), 2000)
  }

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const footerLinks = {
    de: [
      {
        title: 'Planer',
        links: [
          { label: 'Dashboard', href: dashboardUrl },
          { label: 'Kalender', href: `${dashboardUrl}/kalender` },
          { label: 'Aufgaben', href: `${dashboardUrl}/todos` },
          { label: 'Finanzen', href: `${dashboardUrl}/finanzen` },
          { label: 'Abstimmungen', href: `${dashboardUrl}/abstimmungen` },
        ]
      },
      {
        title: 'Sammelkarten',
        links: [
          { label: 'Karten-Home', href: `${tcgUrl}/home` },
          { label: 'Lehrer-Album', href: `${tcgUrl}/album` },
          { label: 'Booster öffnen', href: `${tcgUrl}/booster` },
          { label: 'Tauschbörse', href: `${tcgUrl}/sammelkarten/tausch` },
          { label: 'Kämpfe (Beta)', href: `${tcgUrl}/sammelkarten/kaempfe` },
        ]
      },
      {
        title: 'Einkaufen',
        links: [
          { label: 'Booster Shop', href: `${shopUrl}/shop` },
          { label: 'Merchandise', href: `${shopUrl}/shop` },
          { label: 'Spenden', href: `${shopUrl}/shop` },
        ]
      },
      {
        title: 'Account',
        links: [
          { label: 'Mein Profil', href: `${dashboardUrl}/profil` },
          { label: 'Einstellungen', href: `${dashboardUrl}/einstellungen` },
          { label: 'Freunde', href: `${tcgUrl}/profil/freunde` },
          { label: 'Abmelden', href: '#', onClick: () => {/* sign out logic handled by specific page/navbar but listed for completeness */} },
        ]
      },
      {
        title: 'Support',
        links: [
          { label: 'Hilfe Center', href: supportUrl },
          { label: 'FAQ', href: `${supportUrl}/de/kategorie/registrierung` },
          { label: 'Beschwerde einreichen', href: `${supportUrl}/de/beschwerden` },
          { label: 'Fehler melden', href: `${dashboardUrl}/feedback` },
        ]
      },
      {
        title: 'Über uns',
        links: [
          { label: 'Über den ABI Planer', href: `${mainBaseUrl}/uber` },
          { label: 'Vorteile', href: `${mainBaseUrl}/vorteile` },
          { label: 'Impressum', href: `${mainBaseUrl}/legal/impressum` },
          { label: 'Datenschutz', href: `${mainBaseUrl}/legal/datenschutz` },
          { label: 'AGB', href: `${mainBaseUrl}/legal/agb` },
        ]
      }
    ],
    en: [
      {
        title: 'Planner',
        links: [
          { label: 'Dashboard', href: dashboardUrl },
          { label: 'Calendar', href: `${dashboardUrl}/kalender` },
          { label: 'Tasks', href: `${dashboardUrl}/todos` },
          { label: 'Finances', href: `${dashboardUrl}/finanzen` },
          { label: 'Polls', href: `${dashboardUrl}/abstimmungen` },
        ]
      },
      {
        title: 'Trading Cards',
        links: [
          { label: 'TCG Home', href: `${tcgUrl}/home` },
          { label: 'Teacher Album', href: `${tcgUrl}/album` },
          { label: 'Open Boosters', href: `${tcgUrl}/booster` },
          { label: 'Trade Center', href: `${tcgUrl}/sammelkarten/tausch` },
          { label: 'Combat (Beta)', href: `${tcgUrl}/sammelkarten/kaempfe` },
        ]
      },
      {
        title: 'Shop',
        links: [
          { label: 'Booster Shop', href: `${shopUrl}/shop` },
          { label: 'Merchandise', href: `${shopUrl}/shop` },
          { label: 'Donations', href: `${shopUrl}/shop` },
        ]
      },
      {
        title: 'Account',
        links: [
          { label: 'My Profile', href: `${dashboardUrl}/profil` },
          { label: 'Settings', href: `${dashboardUrl}/einstellungen` },
          { label: 'Friends', href: `${tcgUrl}/profil/freunde` },
        ]
      },
      {
        title: 'Support',
        links: [
          { label: 'Help Center', href: supportUrl },
          { label: 'FAQ', href: `${supportUrl}/en/kategorie/registrierung` },
          { label: 'Submit Complaint', href: `${supportUrl}/en/beschwerden` },
          { label: 'Report Bug', href: `${dashboardUrl}/feedback` },
        ]
      },
      {
        title: 'About Us',
        links: [
          { label: 'About ABI Planner', href: `${mainBaseUrl}/uber` },
          { label: 'Benefits', href: `${mainBaseUrl}/vorteile` },
          { label: 'Imprint', href: `${mainBaseUrl}/legal/impressum` },
          { label: 'Privacy', href: `${mainBaseUrl}/legal/datenschutz` },
          { label: 'Terms', href: `${mainBaseUrl}/legal/agb` },
        ]
      }
    ]
  }[locale]

  return (
    <footer className="w-full bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Apple-style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <button 
                className="flex items-center justify-between w-full md:cursor-default group"
                onClick={() => toggleSection(section.title)}
              >
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {section.title}
                </h4>
                <ChevronDown className={cn(
                  "h-4 w-4 md:hidden transition-transform",
                  expandedSections[section.title] ? "rotate-180" : ""
                )} />
              </button>
              
              <ul className={cn(
                "space-y-2 text-[13px] overflow-hidden transition-all duration-300 md:block md:max-h-none",
                expandedSections[section.title] ? "max-h-96" : "max-h-0"
              )}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <button className="text-muted-foreground hover:text-primary transition-colors py-1 block w-full text-left">
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors py-1 block">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3">
                <Logo width={28} height={28} />
                <span className="font-black tracking-tighter text-lg">ABI Planer 2027</span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {isEn 
                  ? 'The central platform for your graduation planning. Manage tasks, finances, and collect digital teacher trading cards. 90% of shop proceeds go directly into your class treasury.'
                  : 'Die zentrale Plattform für eure Abitur-Planung. Verwalte Aufgaben, Finanzen und sammle digitale Lehrer-Sammelkarten. 90% der Shop-Erlöse fließen direkt in eure Stufenkasse.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a 
                href="https://buymeacoffee.com/maxilo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-all group shadow-sm"
              >
                <Coffee className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>{isEn ? 'Buy us a coffee' : 'Kaffee spendieren'}</span>
              </a>

              <div className="relative">
                {showFeedback && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black animate-bounce shadow-xl whitespace-nowrap z-50">
                    {showFeedback}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
                  </div>
                )}
                <button 
                  onClick={handleVersionClick}
                  className="px-4 py-2 rounded-xl bg-secondary border text-[10px] font-black tracking-widest uppercase hover:bg-secondary/80 transition-all"
                >
                  v{version}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground font-medium">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <span>&copy; {new Date().getFullYear()} Maximilian Priesnitz</span>
              <a href={`${mainBaseUrl}/legal/impressum`} className="hover:text-primary transition-colors underline-offset-4 hover:underline">Impressum</a>
              <a href={`${mainBaseUrl}/legal/datenschutz`} className="hover:text-primary transition-colors underline-offset-4 hover:underline">Datenschutz</a>
              <a href={`${mainBaseUrl}/legal/agb`} className="hover:text-primary transition-colors underline-offset-4 hover:underline">AGB</a>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="tracking-wide">SYSTEMS OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
