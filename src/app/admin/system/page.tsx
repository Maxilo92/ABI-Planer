'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart2,
  DollarSign,
  MessageSquareHeart,
  Server,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

interface FeatureFlags {
  is_trading_enabled: boolean
}

const adminLinks = [
  { href: '/admin', label: 'Benutzer', description: 'Nutzerkonten verwalten & Aktionen', icon: Users },
  { href: '/admin/sammelkarten', label: 'Sammelkarten Manager', description: 'Lehrer-Karten & Konfiguration', icon: Sparkles },
  { href: '/admin/trades', label: 'Trade Moderation', description: 'Tauschanfragen moderieren', icon: ArrowLeftRight },
  { href: '/admin/global-settings', label: 'Globale Einstellungen', description: 'Popups, Banner, Wartungsmodus', icon: Settings },
  { href: '/admin/shop-earnings', label: 'Shop Einnahmen', description: 'Transaktionen & Einnahmen', icon: DollarSign },
  { href: '/admin/logs', label: 'Logs', description: 'Aktivitäts- & Danger-Logs', icon: BarChart2 },
  { href: '/admin/feedback', label: 'Feedback Admin', description: 'Nutzerfeedback einsehen', icon: MessageSquareHeart },
  { href: '/admin/danger', label: 'Danger Zone', description: 'Kritische System-Operationen', icon: AlertTriangle, dangerOnly: true },
]

function SystemPageContent() {
  const { profile } = useAuth()
  const [features, setFeatures] = useState<FeatureFlags>({ is_trading_enabled: false })
  const [savingFeatures, setSavingFeatures] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'features'),
      (snap) => {
        if (snap.exists()) {
          setFeatures({
            is_trading_enabled: !!snap.data().is_trading_enabled,
          })
        }
      },
      (error) => {
        console.error('Fehler beim Laden der Feature-Flags:', error)
      }
    )
    return () => unsub()
  }, [])

  const handleToggleTrading = async (enabled: boolean) => {
    setSavingFeatures(true)
    try {
      await setDoc(doc(db, 'settings', 'features'), { is_trading_enabled: enabled }, { merge: true })
      toast.success(enabled ? 'Trading aktiviert' : 'Trading deaktiviert')
    } catch (error) {
      console.error('Fehler beim Speichern der Feature-Flags:', error)
      toast.error('Fehler beim Speichern der Feature-Flags')
    } finally {
      setSavingFeatures(false)
    }
  }

  const isMainAdmin = profile?.role === 'admin_main'
  const visibleLinks = adminLinks.filter((link) => !link.dangerOnly || isMainAdmin)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Server className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Control Center</h1>
        </div>
        <p className="text-muted-foreground text-sm">Systemübersicht & Feature-Verwaltung</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Aktiviere oder deaktiviere globale Funktionen für alle Nutzer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Trading</span>
                <Badge variant={features.is_trading_enabled ? 'default' : 'secondary'}>
                  {features.is_trading_enabled ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Erlaubt Nutzern, Sammelkarten untereinander zu tauschen.
              </p>
            </div>
            <Switch
              checked={features.is_trading_enabled}
              onCheckedChange={handleToggleTrading}
              disabled={savingFeatures}
              aria-label="Trading aktivieren"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin-Bereiche</CardTitle>
          <CardDescription>Schnellzugriff auf alle Admin-Seiten.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/70 p-4 transition-colors hover:bg-accent/10 hover:border-border"
                >
                  <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">{link.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminSystemPage() {
  return (
    <AdminGuard>
      <SystemPageContent />
    </AdminGuard>
  )
}
