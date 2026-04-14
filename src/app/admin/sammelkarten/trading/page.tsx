'use client'

import React from 'react'
import { useSammelkartenAdmin } from '@/components/admin/SammelkartenAdminContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'

export default function TradingPage() {
  const { systemFeatures } = useSammelkartenAdmin()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          Card Trading System
        </CardTitle>
        <CardDescription>
          Konfiguriere das Tauschsystem für Sammelkarten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <div className="space-y-0.5">
            <Label className="text-base font-bold uppercase tracking-tight">System Aktiviert</Label>
            <p className="text-sm text-muted-foreground">Wenn deaktiviert, ist der Trading-Hub für Nutzer komplett unsichtbar.</p>
          </div>
          <Button 
            variant={systemFeatures?.is_trading_enabled ? "default" : "outline"}
            onClick={async () => {
              const newVal = !systemFeatures?.is_trading_enabled;
              await updateDoc(doc(db, 'settings', 'features'), { is_trading_enabled: newVal });
              toast.success(`Trading wurde ${newVal ? 'aktiviert' : 'deaktiviert'}`);
            }}
            className={cn("w-32 font-bold uppercase tracking-widest", systemFeatures?.is_trading_enabled ? "bg-emerald-600 hover:bg-emerald-700" : "")}
          >
            {systemFeatures?.is_trading_enabled ? "Aktiv" : "Inaktiv"}
          </Button>
        </div>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            <strong>Hinweis:</strong> Das Deaktivieren des Systems löscht keine bestehenden Trades. 
            Alle Daten bleiben in der Datenbank erhalten, aber die Nutzer können nicht mehr darauf zugreifen oder neue Trades starten.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
