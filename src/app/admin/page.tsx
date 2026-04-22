'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Settings, 
  Activity, 
  ShieldAlert, 
  MessageSquare, 
  Trophy, 
  CreditCard, 
  History,
  Send,
  Database,
  RefreshCw,
  Layout
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const adminModules = [
  {
    title: 'Benutzerverwaltung',
    description: 'Profile, Rollen und Berechtigungen verwalten.',
    href: '/admin/user',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    title: 'Globale Einstellungen',
    description: 'Kurse, Gruppen und System-Konfiguration.',
    href: '/admin/global-settings',
    icon: Settings,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10'
  },
  {
    title: 'Aktivitäts-Logs',
    description: 'Protokollierung aller Admin- und Nutzeraktionen.',
    href: '/admin/logs',
    icon: Activity,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  {
    title: 'Danger Logs',
    description: 'Kritische Sicherheitsereignisse einsehen.',
    href: '/admin/danger',
    icon: ShieldAlert,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  {
    title: 'Feedback',
    description: 'Nutzer-Feedback und Fehlermeldungen verwalten.',
    href: '/admin/feedback',
    icon: MessageSquare,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    title: 'Sammelkarten Admin',
    description: 'Karten-Bestand und Seltenheiten verwalten.',
    href: '/admin/sammelkarten',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  {
    title: 'Shop & Einnahmen',
    description: 'Finanzübersicht und Shop-Statistiken.',
    href: '/admin/shop-earnings',
    icon: CreditCard,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  {
    title: 'Popup senden',
    description: 'Systemnachrichten an Nutzer senden.',
    href: '/admin/send',
    icon: Send,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10'
  },
  {
    title: 'System & Wartung',
    description: 'Wartungsmodus und Systemstatus.',
    href: '/admin/system',
    icon: Database,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    title: 'Changelog',
    description: 'Versionshistorie verwalten.',
    href: '/admin/changelog',
    icon: History,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  },
  {
    title: 'Migrationen',
    description: 'Daten-Migrationen und Referrals.',
    href: '/admin/migrate-referrals',
    icon: RefreshCw,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10'
  },
  {
    title: 'Aufgaben',
    description: 'Admin-Aufgaben und Zuweisungen.',
    href: '/admin/aufgaben',
    icon: Layout,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10'
  }
]

export default function AdminHubPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const canAccessAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canAccessAdmin)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [profile, authLoading, canAccessAdmin, router, pathname])

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Admin Hub...</div>
  }

  if (!profile || !canAccessAdmin) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Control Center</h1>
        <p className="text-muted-foreground mt-1">Zentrale Verwaltung für alle ABI Planer Module.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {adminModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer border-border/50">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`${module.bgColor} ${module.color} p-2.5 rounded-xl`}>
                  <module.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm line-clamp-2">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
