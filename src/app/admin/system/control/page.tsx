'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ShieldAlert, Sparkles, 
  ArrowLeftRight, ShoppingBag, Megaphone, 
  Calendar, CheckSquare,
  RefreshCw, BarChart2,
  Swords, Construction
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminSystem } from '@/components/admin/AdminSystemContext'
import { FeatureStatusToggle } from '@/components/admin/system/SystemComponents'
import { usePopupManager } from '@/modules/popup/usePopupManager'

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
  } catch {
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
  
  const { confirm } = usePopupManager()

  const handleClearMaintenancePlan = async () => {
    const confirmed = await confirm({
      title: 'Wartungsplanung löschen?',
      content: 'Möchtest du die geplante Wartungszeit wirklich löschen?',
      priority: 'high',
      confirmLabel: 'Löschen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return

    handleSaveMaintenance({
      ...maintenance,
      start: null,
      end: null,
    })
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-3 border-2">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Emergency Feature Toggles
                </CardTitle>
                <CardDescription>Zentrale Steuerung der App-Module. Deaktivierte Module zeigen Nutzern eine Wartungsmeldung.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-10">
            {/* Sammelkarten Ökosystem */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sammelkarten-Ökosystem</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureStatusToggle
                  label="Karten & Album"
                  description="Zugriff auf die Sammlungen"
                  icon={<Sparkles className="w-4 h-4" />}
                  status={features?.sammelkarten_status}
                  onStatusChange={(s) => updateFeatureStatus('sammelkarten_status', s)}
                />
                <FeatureStatusToggle
                  label="Trading & Tausch"
                  description="Interaktion zwischen Spielern"
                  icon={<ArrowLeftRight className="w-4 h-4" />}
                  status={features?.trading_status}
                  onStatusChange={(s) => updateFeatureStatus('trading_status', s)}
                />
                <FeatureStatusToggle
                  label="Kampf-System"
                  description="Duelle gegen andere Schüler"
                  icon={<Swords className="w-4 h-4" />}
                  status={features?.combat_status}
                  onStatusChange={(s) => updateFeatureStatus('combat_status', s)}
                />
                <FeatureStatusToggle
                  label="Shop & Stripe"
                  description="Finanztransaktionen & Booster"
                  icon={<ShoppingBag className="w-4 h-4" />}
                  status={features?.shop_status}
                  onStatusChange={(s) => updateFeatureStatus('shop_status', s)}
                />
              </div>
            </div>

            {/* Planungs-Tools */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Planungs-Tools & Kommunikation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureStatusToggle
                  label="News Feed"
                  description="Ankündigungen & Push-Infos"
                  icon={<Megaphone className="w-4 h-4" />}
                  status={features?.news_status}
                  onStatusChange={(s) => updateFeatureStatus('news_status', s)}
                />
                <FeatureStatusToggle
                  label="Terminkalender"
                  description="Event-Planung & Deadlines"
                  icon={<Calendar className="w-4 h-4" />}
                  status={features?.calendar_status}
                  onStatusChange={(s) => updateFeatureStatus('calendar_status', s)}
                />
                <FeatureStatusToggle
                  label="Todo-Listen"
                  description="Aufgabenmanagement"
                  icon={<CheckSquare className="w-4 h-4" />}
                  status={features?.todos_status}
                  onStatusChange={(s) => updateFeatureStatus('todos_status', s)}
                />
                <FeatureStatusToggle
                  label="Umfragen"
                  description="Interaktive Abstimmungen"
                  icon={<BarChart2 className="w-4 h-4" />}
                  status={features?.polls_status}
                  onStatusChange={(s) => updateFeatureStatus('polls_status', s)}
                />
              </div>
            </div>
            
            <div className="pt-6 border-t space-y-6">
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
                    onClick={() => void handleClearMaintenancePlan()}
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
                  onChange={() => {
                    // We use a local state or just call handleSaveMaintenance on blur
                    // For simplicity, we'll just use the context's maintenance and call handleSaveMaintenance
                  }}
                  onBlur={(e) => handleSaveMaintenance({ ...maintenance, message: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-colors",
                  isMaintenanceActive ? "bg-red-500/5 border-red-500/20" : "bg-muted/30 border-transparent"
                )}>
                  <div className="space-y-0.5">
                    <p className={cn("text-xs font-black uppercase tracking-tight", isMaintenanceActive ? "text-red-500" : "")}>
                      {isMaintenanceActive ? "System gesperrt" : "System online"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Nutzer blockieren.</p>
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

                <div className="flex items-center justify-between p-4 rounded-xl border border-muted/30 bg-muted/10">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-tight">Session Daten</p>
                    <p className="text-[10px] text-muted-foreground">Statistiken bereinigen.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] font-black uppercase tracking-widest border-red-500/20 text-red-600 hover:bg-red-500/5"
                    onClick={resetSessionStatistics}
                    disabled={resettingSessionStats}
                  >
                    <RefreshCw className={cn('w-3 h-3 mr-1.5', resettingSessionStats && 'animate-spin')} />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
