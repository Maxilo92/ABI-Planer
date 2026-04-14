'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ShieldAlert, Sparkles, 
  ArrowLeftRight, ShoppingBag, Megaphone, 
  Calendar, CheckSquare, AlertTriangle,
  RefreshCw, BarChart2,
  Swords, Construction, Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAdminSystem } from '@/components/admin/AdminSystemContext'
import { FeatureStatusToggle } from '@/components/admin/system/SystemComponents'
import { useAuth } from '@/context/AuthContext'

/**
 * Formats an ISO string for use in a datetime-local input.
 */
const formatDateForInput = (isoString: string | null | undefined) => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    const offset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - offset)
    return localDate.toISOString().slice(0, 16)
  } catch (e) {
    return ''
  }
}

export default function AdminSystemControl() {
  const { 
    features, 
    maintenance, 
    savingMaintenance, 
    resettingSessionStats,
    isMaintenanceActive,
    updateFeatureStatus,
    handleSaveMaintenance,
    resetSessionStatistics
  } = useAdminSystem()
  
  const { profile } = useAuth()
  const router = useRouter()
  const [localMaintenance, setLocalMaintenance] = useState(maintenance)

  const isMainAdmin = profile?.role === 'admin_main'

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Emergency Feature Toggles
            </CardTitle>
            <CardDescription>Hier können einzelne Module der App im Notfall sofort abgeschaltet werden.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureStatusToggle
              label="Sammelkarten System"
              description="Globaler Zugriff auf Karten & Album"
              icon={<Sparkles className="w-4 h-4" />}
              status={features?.sammelkarten_status}
              onStatusChange={(s) => updateFeatureStatus('sammelkarten_status', s)}
            />
            <FeatureStatusToggle
              label="Trading Feature"
              description="Karten-Tausch zwischen Freunden"
              icon={<ArrowLeftRight className="w-4 h-4" />}
              status={features?.trading_status}
              onStatusChange={(s) => updateFeatureStatus('trading_status', s)}
            />
            <FeatureStatusToggle
              label="Kampf System"
              description="Sammelkarten-Duelle gegen andere Schüler"
              icon={<Swords className="w-4 h-4" />}
              status={features?.combat_status}
              onStatusChange={(s) => updateFeatureStatus('combat_status', s)}
            />
            <FeatureStatusToggle
              label="Shop & Stripe"
              description="Kauf von Boostern & Spenden"
              icon={<ShoppingBag className="w-4 h-4" />}
              status={features?.shop_status}
              onStatusChange={(s) => updateFeatureStatus('shop_status', s)}
            />
            <FeatureStatusToggle
              label="News & Ankündigungen"
              description="News-Feed und Push-Benachrichtigungen"
              icon={<Megaphone className="w-4 h-4" />}
              status={features?.news_status}
              onStatusChange={(s) => updateFeatureStatus('news_status', s)}
            />
            <FeatureStatusToggle
              label="Kalender & Events"
              description="Event-Planung und Termine"
              icon={<Calendar className="w-4 h-4" />}
              status={features?.calendar_status}
              onStatusChange={(s) => updateFeatureStatus('calendar_status', s)}
            />
            <FeatureStatusToggle
              label="Todos & Aufgaben"
              description="Aufgabenverwaltung der Gruppen"
              icon={<CheckSquare className="w-4 h-4" />}
              status={features?.todos_status}
              onStatusChange={(s) => updateFeatureStatus('todos_status', s)}
            />
            <FeatureStatusToggle
              label="Umfragen"
              description="Jahrgangsweite Abstimmungen"
              icon={<BarChart2 className="w-4 h-4" />}
              status={features?.polls_status}
              onStatusChange={(s) => updateFeatureStatus('polls_status', s)}
            />
            
            <div className="md:col-span-2 pt-6 mt-4 border-t space-y-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Construction className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black uppercase tracking-tight text-sm">Wartungspause & Sperre</h3>
                </div>
                {(maintenance?.start || maintenance?.end) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Möchtest du die geplante Wartungszeit wirklich löschen?')) {
                        handleSaveMaintenance({
                          ...maintenance,
                          start: null,
                          end: null
                        })
                      }
                    }}
                  >
                    Planung löschen
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Beginn der Wartung</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateForInput(maintenance?.start)}
                    className="h-9 text-xs"
                    onChange={(e) => {
                      const val = e.target.value ? new Date(e.target.value).toISOString() : null
                      handleSaveMaintenance({ ...maintenance, start: val })
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Voraussichtliches Ende</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateForInput(maintenance?.end)}
                    className="h-9 text-xs"
                    onChange={(e) => {
                      const val = e.target.value ? new Date(e.target.value).toISOString() : null
                      handleSaveMaintenance({ ...maintenance, end: val })
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wartungsmeldung</Label>
                <Textarea
                  placeholder="Wir führen Wartungsarbeiten durch..."
                  value={maintenance?.message || ''}
                  className="min-h-[80px] text-xs"
                  onChange={(e) => {
                    // We use a local state or just call handleSaveMaintenance on blur
                    // For simplicity, we'll just use the context's maintenance and call handleSaveMaintenance
                  }}
                  onBlur={(e) => handleSaveMaintenance({ ...maintenance, message: e.target.value })}
                />
              </div>

              <div className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-colors",
                isMaintenanceActive ? "bg-red-500/5 border-red-500/20" : "bg-muted/30 border-transparent"
              )}>
                <div className="space-y-0.5">
                  <p className={cn("text-xs font-black uppercase tracking-tight", isMaintenanceActive ? "text-red-500" : "")}>
                    {isMaintenanceActive ? "System gesperrt" : "System online"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Alle Nutzer außer Admins blockieren.</p>
                </div>
                <Button 
                  size="sm"
                  variant={isMaintenanceActive ? "destructive" : "outline"}
                  className="h-8 text-[10px] font-black uppercase tracking-widest"
                  disabled={savingMaintenance}
                  onClick={() => {
                    if (isMaintenanceActive) {
                      handleSaveMaintenance({ 
                        ...maintenance, 
                        active: false, 
                        start: null, 
                        end: null 
                      })
                    } else {
                      handleSaveMaintenance({ 
                        ...maintenance, 
                        active: true 
                      })
                    }
                  }}
                >
                  {isMaintenanceActive ? "Wartung beenden" : "Wartung starten"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-tight">Admin Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <Button variant="outline" className="w-full justify-start text-xs font-bold uppercase border-white/10 hover:bg-white/5" onClick={() => router.push('/admin/logs')}>
              <Activity className="w-3 h-3 mr-2" /> System-Logs einsehen
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs font-bold uppercase border-white/10 hover:bg-white/5" onClick={() => router.push('/admin/feedback')}>
              <AlertTriangle className="w-3 h-3 mr-2" /> Bug Reports prüfen
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs font-bold uppercase border-red-500/40 text-red-200 hover:bg-red-500/10 hover:text-red-100"
              onClick={resetSessionStatistics}
              disabled={resettingSessionStats}
            >
              <RefreshCw className={cn('w-3 h-3 mr-2', resettingSessionStats && 'animate-spin')} />
              Session-Statistiken zuruecksetzen
            </Button>

            <div className="pt-8 space-y-4 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Indicators</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span>Server Response</span>
                  <span className="text-emerald-400 text-[10px]">Optimal</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '18%' }} className="h-full bg-emerald-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span>DB Read Load</span>
                  <span className="text-cyan-400 text-[10px]">Normal</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-cyan-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
