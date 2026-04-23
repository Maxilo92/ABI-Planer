'use client'

import { useSystemFeatures } from '@/hooks/useSystemFeatures'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Construction, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SystemFeatures } from '@/types/system'

interface FeatureGateProps {
  children: ReactNode
}

export function FeatureGate({ children }: FeatureGateProps) {
  const pathname = usePathname()
  const { isEnabled, loading } = useSystemFeatures()

  const gateInfo = useMemo(() => {
    if (!pathname) return { enabled: true }

    const checks: { path: string; feature: keyof SystemFeatures; label: string }[] = [
      { path: '/news', feature: 'news_status', label: 'News & Ankündigungen' },
      { path: '/abstimmungen', feature: 'polls_status', label: 'Umfragen' },
      { path: '/kalender', feature: 'calendar_status', label: 'Kalender & Events' },
      { path: '/todos', feature: 'todos_status', label: 'Todos & Aufgaben' },
      { path: '/finanzen', feature: 'shop_status', label: 'Finanzen & Shop' },
      { path: '/shop', feature: 'shop_status', label: 'ABISHOP' },
      { path: '/home', feature: 'sammelkarten_status', label: 'Sammelkarten System' },
      { path: '/album', feature: 'sammelkarten_status', label: 'Sammelkarten Album' },
      { path: '/booster', feature: 'sammelkarten_status', label: 'Booster Packs' },
      { path: '/battle-pass', feature: 'sammelkarten_status', label: 'Battle Pass' },
    ]

    for (const check of checks) {
      if (pathname === check.path || pathname.startsWith(check.path + '/')) {
        return {
          enabled: isEnabled(check.feature),
          label: check.label,
          feature: check.feature
        }
      }
    }

    return { enabled: true }
  }, [pathname, isEnabled])

  if (loading) return children
  if (gateInfo.enabled) return children

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <Card className="max-w-md w-full border-2 border-amber-500/20 shadow-xl overflow-hidden">
        <div className="h-2 bg-amber-500" />
        <CardContent className="p-8 space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <Construction className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Modul gesperrt</h2>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{gateInfo.label}</p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Dieses Modul wurde vorübergehend durch die Administration deaktiviert. 
            Bitte versuche es später erneut oder informiere dich in den News über den aktuellen Status.
          </p>

          <div className="pt-4 space-y-3">
            <Link href="/">
              <Button className="w-full gap-2 font-bold uppercase tracking-widest text-xs h-11">
                <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
              </Button>
            </Link>
            <Link href="/news">
              <Button variant="outline" className="w-full gap-2 font-bold uppercase tracking-widest text-xs h-11">
                News ansehen
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
        <Lock className="w-3 h-3" />
        Emergency Feature Toggle Active
      </div>
    </div>
  )
}
