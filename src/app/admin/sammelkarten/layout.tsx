'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { SammelkartenAdminProvider, useSammelkartenAdmin } from '@/components/admin/SammelkartenAdminContext'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, RefreshCw, Users, TrendingUp, Settings2, Sparkles, Send, ArrowLeftRight, BarChart3, Zap, AlertTriangle, Wand2 } from 'lucide-react'
import { cn, getRarityColor, getRarityLabel } from '@/lib/utils'
import Link from 'next/link'
import { TeacherRarity } from '@/types/database'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeacherEditDialog } from '@/components/admin/TeacherEditDialog'
import { NotificationPreviewDialog } from '@/components/admin/NotificationPreviewDialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

function SmartNumericInput({ 
  value, 
  onChange, 
  step = "1", 
  min, 
  max, 
  className,
  isInteger = false
}: {
  value: number;
  onChange: (val: number) => void;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
  isInteger?: boolean;
}) {
  const [localValue, setLocalValue] = React.useState<string>(value.toString());

  React.useEffect(() => {
    const parsedLocal = isInteger ? parseInt(localValue) : parseFloat(localValue);
    if (parsedLocal !== value) {
      setLocalValue(value.toString());
    }
  }, [value, isInteger, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    
    if (val !== "" && val !== "-") {
      const parsed = isInteger ? parseInt(val) : parseFloat(val);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <Input
      type="number"
      step={step}
      min={min}
      max={max}
      value={localValue}
      onChange={handleChange}
      className={className}
    />
  );
}

const RARITY_CHART_COLORS: Record<TeacherRarity, string> = {
  common: '#94a3b8',
  rare: '#10b981',
  epic: '#a855f7',
  mythic: '#ef4444',
  legendary: '#f59e0b',
  iconic: '#4338ca',
}

function SammelkartenAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    loading, saving, isDirty, autosaveCountdown, handleManualSave, handleMigrate,
    currentSet, rarityDistribution, cardProposals,
    simCount, setSimCount, simulating, runSimulation, simResults,
    isEditDialogOpen, setIsEditDialogOpen, editingTeacher, handleUpdateTeacher, handleSaveAndRemoveTeacher, handleRemoveTeacherOnly,
    proposalModerationDialogOpen, setProposalModerationDialogOpen, proposalInDialog, proposalEditDraft, setProposalEditDraft,
    proposalUsageStatusDraft, setProposalUsageStatusDraft, proposalAdminNoteDraft, setProposalAdminNoteDraft,
    moderatingProposalId, resetProposalModerationDialog, handleAcceptProposalFromDialog, updateProposalAttackDraft,
    showDryRunDialog, setShowDryRunDialog, dryRunPreview, isSyncing, handleConfirmDryRun
  } = useSammelkartenAdmin()

  const activeTab = pathname.split('/').pop() || 'pool'
  
  const handleTabChange = (value: string) => {
    router.push(`/admin/sammelkarten/${value}`)
  }

  const rarityChartData = React.useMemo(() => {
    if (!currentSet) return null
    const labels = Object.keys(rarityDistribution).map(r => getRarityLabel(r as TeacherRarity))
    const data = Object.values(rarityDistribution)
    const backgroundColor = Object.keys(rarityDistribution).map(r => RARITY_CHART_COLORS[r as TeacherRarity] || '#cbd5e1')

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderWidth: 0,
        hoverOffset: 4
      }]
    }
  }, [currentSet, rarityDistribution])

  const rarityChartOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    cutout: '70%',
    maintainAspectRatio: false,
  }

  const proposalStatusChartData = React.useMemo(() => {
    const statusCounts = cardProposals.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, { pending: 0, accepted: 0, rejected: 0 } as Record<string, number>)

    return {
      labels: ['Offen', 'Angenommen', 'Abgelehnt'],
      datasets: [{
        label: 'Vorschläge',
        data: [statusCounts.pending, statusCounts.accepted, statusCounts.rejected],
        backgroundColor: ['#94a3b8', '#10b981', '#ef4444'],
        borderRadius: 4,
      }]
    }
  }, [cardProposals])

  const proposalStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  }

  const simRarityChartData = React.useMemo(() => {
    if (!simResults) return null
    const labels = Object.keys(simResults.rarityCounts).map(r => getRarityLabel(r as TeacherRarity))
    const data = Object.values(simResults.rarityCounts)
    const backgroundColor = Object.keys(simResults.rarityCounts).map(r => RARITY_CHART_COLORS[r as TeacherRarity] || '#cbd5e1')

    return {
      labels,
      datasets: [{
        label: 'Gezogen',
        data,
        backgroundColor,
        borderRadius: 4,
      }]
    }
  }, [simResults])

  const simVariantChartData = React.useMemo(() => {
    if (!simResults) return null
    return {
      labels: ['Normal', 'Shiny', 'Holo', 'Black Shiny'],
      datasets: [{
        label: 'Gezogen',
        data: [
          simResults.variantCounts.normal,
          simResults.variantCounts.shiny,
          simResults.variantCounts.holo,
          simResults.variantCounts.black_shiny_holo
        ],
        backgroundColor: ['#64748b', '#f59e0b', '#8b5cf6', '#111827'],
        borderRadius: 4,
      }]
    }
  }, [simResults])

  const simulationBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Lade Karten-Konfiguration...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 space-y-8 max-w-7xl animate-in fade-in duration-700">
      {/* Header section with Stats & Manual Save */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-background/50 backdrop-blur-sm p-6 rounded-2xl border border-border/60 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Sammelkarten Admin</h1>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Verwalte Lehrer, Drop-Rates und System-Parameter in Echtzeit.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isDirty && (
            <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-in zoom-in duration-300">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-amber-600 leading-none">Ungespeichert</span>
                <span className="text-xs font-medium text-amber-700">
                  {autosaveCountdown ? `Autosave in ${autosaveCountdown}s` : 'Wird gespeichert...'}
                </span>
              </div>
              <Button 
                size="sm" 
                onClick={handleManualSave} 
                disabled={saving}
                className="h-8 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                Jetzt speichern
              </Button>
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={handleMigrate} className="h-10 border-dashed border-2 hover:bg-muted/50 transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" /> Migration (Global)
          </Button>
        </div>
      </div>

      <div className={cn(
        "grid grid-cols-1 gap-6 lg:gap-8 items-start",
        (activeTab !== 'einladungen' && activeTab !== 'new-design') && "xl:grid-cols-4"
      )}>
        {/* Left/Main Column: Tabs Content */}
        <div className={cn(
          "space-y-8",
          (activeTab !== 'einladungen' && activeTab !== 'new-design') ? "xl:col-span-3" : "xl:col-span-full"
        )}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="relative group">
              <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                <TabsList className="w-fit bg-muted/30 p-1.5 rounded-2xl border border-border/40 inline-flex min-w-full sm:min-w-0">
                  <TabsTrigger value="pool" className="px-3 sm:px-4 py-2 text-[11px] font-bold gap-2 transition-all shrink-0 rounded-xl data-active:bg-background data-active:shadow-sm">
                    <Users className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lehrerpool</span>
                    <span className="sm:hidden">Pool</span>
                  </TabsTrigger>
                  <TabsTrigger value="drop-rates" className="px-3 sm:px-4 py-2 text-[11px] font-bold gap-2 transition-all shrink-0 rounded-xl data-active:bg-background data-active:shadow-sm">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Drop-Rates</span>
                    <span className="sm:hidden">Rates</span>
                  </TabsTrigger>
                  <TabsTrigger value="parameter" className="px-3 sm:px-4 py-2 text-[11px] font-bold gap-2 transition-all shrink-0 rounded-xl data-active:bg-background data-active:shadow-sm">
                    <Settings2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Parameter</span>
                    <span className="sm:hidden">Param</span>
                  </TabsTrigger>
                  <TabsTrigger value="ideen-labor" className="px-3 sm:px-4 py-2 text-[11px] font-bold gap-2 transition-all shrink-0 rounded-xl data-active:bg-background data-active:shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ideen-Labor</span>
                    <span className="sm:hidden">Labor</span>
                  </TabsTrigger>
                  <TabsTrigger value="einladungen" className="px-3 sm:px-4 py-2 text-[11px] font-bold gap-2 transition-all shrink-0 rounded-xl data-active:bg-background data-active:shadow-sm">
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Einladungen</span>
                    <span className="sm:hidden">Einlad.</span>
                  </TabsTrigger>
                  <TabsTrigger value="trading" className="px-3 sm:px-4 py-2 text-[11px] font-bold gap-2 transition-all shrink-0 rounded-xl data-active:bg-background data-active:shadow-sm">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Trading</span>
                    <span className="sm:hidden">Trade</span>
                  </TabsTrigger>
                  <div className="w-px h-4 bg-border/60 mx-1 self-center shrink-0" />
                  <TabsTrigger value="new-design" className="px-3 sm:px-4 py-2 text-[11px] font-bold gap-2 transition-all shrink-0 rounded-xl data-active:bg-background data-active:shadow-sm text-amber-600 dark:text-amber-400">
                    <Wand2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Neues Design</span>
                    <span className="sm:hidden">Neu</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="mt-6">
              {children}
            </div>
          </Tabs>
        </div>

        {/* Right Column: Pack Simulator & Stats */}
        {(activeTab !== 'einladungen' && activeTab !== 'new-design') && (
          <div className="space-y-6">
            <Card className="border-primary/15 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Statistiken
                </CardTitle>
                <CardDescription>Diagramme für das aktive Set, Vorschläge und die Simulation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Set-Verteilung</h3>
                      <p className="text-[11px] text-muted-foreground">Aktuelle Zusammensetzung im ausgewählten Set.</p>
                    </div>
                    <Badge variant="secondary">{currentSet?.cards.length || 0} Karten</Badge>
                  </div>
                  {rarityChartData ? (
                    <div className="h-60 rounded-xl border bg-muted/20 p-3">
                      <Doughnut data={rarityChartData} options={rarityChartOptions} />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed py-10 text-center text-xs text-muted-foreground">
                      Keine Karten im aktiven Set vorhanden.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">Ideen-Labor Status</h3>
                    <p className="text-[11px] text-muted-foreground">Verteilung der eingereichten Kartenvorschläge.</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="h-44">
                      <Bar data={proposalStatusChartData} options={proposalStatusChartOptions} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pack Simulator
                </CardTitle>
                <CardDescription>Testet die aktuellen Drop-Rates ohne Echt-Transaktionen.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs">Anzahl der Packs</Label>
                  <div className="flex gap-2">
                    <SmartNumericInput 
                      isInteger
                      value={simCount} 
                      onChange={(val) => setSimCount(val)} 
                      className="font-mono h-9"
                    />
                    <Button onClick={runSimulation} disabled={simulating} size="sm" className="shrink-0">
                      {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start"}
                    </Button>
                  </div>
                </div>

                {simResults && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-muted border">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Packs</p>
                        <p className="text-lg font-black">{simResults.totalPacks}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-[10px] text-amber-700 font-bold uppercase">Godpacks</p>
                        <p className="text-lg font-black text-amber-600">{simResults.godpackCount}</p>
                      </div>
                    </div>

                    <div className="space-y-2 border rounded-xl p-3 bg-muted/20">
                      <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 border-b pb-1">Verteilung Seltenheit</h5>
                      {Object.entries(simResults.rarityCounts).map(([rarity, count]) => (
                        <div key={rarity} className="flex items-center justify-between text-xs">
                          <span className={cn("font-bold", getRarityColor(rarity as TeacherRarity))}>{getRarityLabel(rarity as TeacherRarity)}</span>
                          <span className="font-mono font-medium">
                            {count as number} <span className="text-muted-foreground text-[10px]">({(((count as number) / (simResults.totalPacks * 3)) * 100).toFixed(1)}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 border rounded-xl p-3 bg-muted/20">
                      <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 border-b pb-1">Verteilung Varianten</h5>
                      {Object.entries(simResults.variantCounts).map(([variant, count]) => (
                        <div key={variant} className="flex items-center justify-between text-xs">
                          <span className="font-bold capitalize">{variant.replace(/_/g, ' ')}</span>
                          <span className="font-mono font-medium">
                            {count as number} <span className="text-muted-foreground text-[10px]">({(((count as number) / (simResults.totalPacks * 3)) * 100).toFixed(2)}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
                        <div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest">Simulation: Seltenheiten</h5>
                        </div>
                        {simRarityChartData ? (
                          <div className="h-44">
                            <Bar data={simRarityChartData} options={simulationBarOptions} />
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
                        <div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest">Simulation: Varianten</h5>
                        </div>
                        {simVariantChartData ? (
                          <div className="h-44">
                            <Bar data={simVariantChartData} options={simulationBarOptions} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-none">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Wichtiger Hinweis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[11px] leading-relaxed text-slate-400">
                Die Drop-Rates werden clientseitig berechnet. Änderungen in diesem Dashboard werden sofort für alle Nutzer aktiv (Echtzeit-Update). Achte darauf, dass die Summe der Gewichte pro Slot exakt 1.0 ergibt, um eine saubere Verteilung zu garantieren.
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Shared Dialogs */}
      <TeacherEditDialog 
        isOpen={isEditDialogOpen}
        teacher={editingTeacher}
        onSave={(updatedTeacher) => handleUpdateTeacher(updatedTeacher, { skipRaritySync: true })}
        onClose={() => setIsEditDialogOpen(false)}
        onSaveAndRemove={handleSaveAndRemoveTeacher}
        onRemoveOnly={handleRemoveTeacherOnly}
      />

      <Dialog
        open={proposalModerationDialogOpen}
        onOpenChange={(open) => {
          if (!open && moderatingProposalId) return
          if (!open) {
            resetProposalModerationDialog()
            return
          }
          setProposalModerationDialogOpen(true)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vorschlag bearbeiten und annehmen</DialogTitle>
            <DialogDescription>
              Finalisiere die Karte manuell. Die Belohnung wird nur vergeben, wenn du &quot;Genutzt&quot; auswaehlst.
            </DialogDescription>
          </DialogHeader>

          {proposalInDialog && proposalEditDraft && (
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Lehrername</Label>
                  <Input
                    value={proposalEditDraft.teacher_name}
                    onChange={(e) => setProposalEditDraft((prev) => prev ? { ...prev, teacher_name: e.target.value } : prev)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">HP</Label>
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    step={10}
                    value={proposalEditDraft.hp}
                    onChange={(e) => setProposalEditDraft((prev) => prev ? { ...prev, hp: Number(e.target.value) } : prev)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Beschreibung</Label>
                <Textarea
                  value={proposalEditDraft.description}
                  onChange={(e) => setProposalEditDraft((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                  className="min-h-[90px]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase">Angriffe (1-2)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProposalEditDraft((prev) => {
                      if (!prev || prev.attacks.length >= 2) return prev
                      return {
                        ...prev,
                        attacks: [...prev.attacks, { name: '', damage: 0, description: '' }],
                      }
                    })}
                    disabled={proposalEditDraft.attacks.length >= 2}
                  >
                    Angriff hinzufuegen
                  </Button>
                </div>

                {proposalEditDraft.attacks.map((attack, index) => (
                  <div key={`moderation-attack-${index}`} className="rounded-md border p-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <Label className="text-[10px] uppercase">Angriffsname</Label>
                        <Input
                          value={attack.name || ''}
                          onChange={(e) => updateProposalAttackDraft(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase">Schaden</Label>
                        <Input
                          type="number"
                          step={5}
                          min={0}
                          value={Number(attack.damage) || 0}
                          onChange={(e) => updateProposalAttackDraft(index, 'damage', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase">Effekt (optional)</Label>
                      <Input
                        value={attack.description || ''}
                        onChange={(e) => updateProposalAttackDraft(index, 'description', e.target.value)}
                      />
                    </div>
                    {proposalEditDraft.attacks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProposalEditDraft((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            attacks: prev.attacks.filter((_, attackIndex) => attackIndex !== index),
                          }
                        })}
                      >
                        Angriff entfernen
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-md border p-3 space-y-3 bg-muted/20">
                <Label className="text-xs font-bold uppercase">Wurde der Vorschlag genutzt?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={proposalUsageStatusDraft === 'used' ? 'default' : 'outline'}
                    onClick={() => setProposalUsageStatusDraft('used')}
                  >
                    Ja, genutzt (2 Booster)
                  </Button>
                  <Button
                    type="button"
                    variant={proposalUsageStatusDraft === 'not_used' ? 'default' : 'outline'}
                    onClick={() => setProposalUsageStatusDraft('not_used')}
                  >
                    Nein, nicht genutzt (0 Booster)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Admin-Notiz</Label>
                <Textarea
                  value={proposalAdminNoteDraft}
                  onChange={(e) => setProposalAdminNoteDraft(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={resetProposalModerationDialog} disabled={Boolean(moderatingProposalId)}>
              Abbrechen
            </Button>
            <Button onClick={handleAcceptProposalFromDialog} disabled={Boolean(moderatingProposalId)}>
              {moderatingProposalId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Speichern und annehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationPreviewDialog
        open={showDryRunDialog}
        onOpenChange={setShowDryRunDialog}
        notifications={dryRunPreview?.notifications || []}
        isLoading={isSyncing}
        onConfirm={handleConfirmDryRun}
        actionType="validate_rarities"
      />
    </div>
  )
}

export default function SammelkartenAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <SammelkartenAdminProvider>
        <SammelkartenAdminLayoutContent>
          {children}
        </SammelkartenAdminLayoutContent>
      </SammelkartenAdminProvider>
    </AdminGuard>
  )
}
