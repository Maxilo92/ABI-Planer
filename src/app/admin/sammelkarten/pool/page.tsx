'use client'

import React from 'react'
import { useSammelkartenAdmin } from '@/components/admin/SammelkartenAdminContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Search, Trash2, GraduationCap, 
  Loader2, Database, Upload, TrendingUp, RefreshCw, Zap,
  ArrowDownAZ, ArrowUpAZ, ArrowDownWideNarrow, ArrowUpWideNarrow
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { TeacherList } from '@/components/admin/TeacherList'
import { CARD_SETS } from '@/constants/cardRegistry'
import { cn, getRarityColor, getRarityLabel } from '@/lib/utils'
import { TeacherRarity } from '@/types/database'

export default function PoolPage() {
  const {
    localConfig, selectedSetId, setSelectedSetId, availableSets, currentSet,
    isAddingSet, setIsAddingSet, newSetName, setNewSetName, newSetId, setNewSetId,
    newSetPrefix, setNewSetPrefix, newSetColor, setNewSetColor,
    handleAddSet, handleRemoveSet, handleMigrateToSets,
    newTeacherName, setNewTeacherName, newTeacherRarity, setNewTeacherRarity,
    teacherSearch, setTeacherSearch, teacherSort, setTeacherSort,
    filteredTeachers, rarityDistribution,
    handleAddTeacher, handleRemoveTeacher, handleEditTeacher,
    fileInputRef, importing, isImportDialogOpen, setIsImportDialogOpen,
    parsedTeachers, importMode, setImportMode, handleCSVUpload, handleBulkImport,
    handleExportCSV, handleExportJSON,
    handleCleanupDuplicates, handleCleanupInventory, handleSyncOpenedPacksToInventory,
    handleCleanupLegacyTeachersVoted, handleMigrateInventory, handleMigrateTeacherVol1,
    handleRemoveAllMismatches, isCleaningInventory, isSyncingOpenedPacks,
    isCleaningLegacyVotes, isMigratingInventory, isMigratingTeacherVol1, isDryRunning, isSyncing
  } = useSammelkartenAdmin()

  if (!localConfig) return null

  return (
    <div className="space-y-6">
      {/* Set Selector & Management */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-muted/30 p-4 rounded-xl border border-border/60">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Database className="h-3 w-3" /> Aktuelles Set
          </Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value)}
          >
            {availableSets.map(set => (
              <option key={set.id} value={set.id}>{set.name} ({set.prefix})</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddingSet(true)} className="h-10 gap-2">
            <Plus className="h-4 w-4" /> Neues Set
          </Button>
          {localConfig.loot_teachers && localConfig.loot_teachers.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleMigrateToSets} className="h-10 gap-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30">
              <TrendingUp className="h-4 w-4" /> Migration (Legacy)
            </Button>
          )}
          {selectedSetId && !CARD_SETS[selectedSetId] && (
            <Button variant="outline" size="sm" onClick={() => handleRemoveSet(selectedSetId)} className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Karten-Pool: {currentSet?.name || 'Set wählen'}
              </CardTitle>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCleanupDuplicates} title="Bereinigt Duplikate nach Name" className="flex-1">
                    <Trash2 className="h-3 w-3 mr-2" />
                    <span className="hidden sm:inline">Cleanup Pool</span>
                    <span className="sm:hidden">Cleanup</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex-1">
                    {importing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                    <span className="hidden sm:inline">Bulk Import</span>
                    <span className="sm:hidden">Import</span>
                  </Button>
                </div>
                <details className="sm:hidden">
                  <summary className="text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1">▼ Admin-Tools</summary>
                  <div className="mt-2 space-y-2 pl-3 border-l-2 border-border/50 pb-2">
                    <Button variant="outline" size="sm" onClick={handleCleanupInventory} disabled={isCleaningInventory} title="Inventare bereinigen" className="w-full text-xs h-9">
                      {isCleaningInventory ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                      Inv. Cleanup
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSyncOpenedPacksToInventory} disabled={isSyncingOpenedPacks} title="Packs synchronisieren" className="w-full text-xs h-9">
                      {isSyncingOpenedPacks ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                      Sync Packs
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCleanupLegacyTeachersVoted} disabled={isCleaningLegacyVotes} title="Legacy-Daten entfernen" className="w-full text-xs h-9">
                      {isCleaningLegacyVotes ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                      Legacy Cleanup
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleMigrateInventory} disabled={isMigratingInventory} title="Inventar migrieren" className="w-full text-xs h-9">
                      {isMigratingInventory ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                      Inv. Migrieren
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleMigrateTeacherVol1} disabled={isMigratingTeacherVol1} title="Lehrer migrieren" className="w-full text-xs h-9">
                      {isMigratingTeacherVol1 ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                      Teacher Migrieren
                    </Button>
                  </div>
                </details>
                <div className="hidden sm:flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCleanupInventory} disabled={isCleaningInventory} title="Inventare bereinigen">
                    {isCleaningInventory ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                    Cleanup Inventories
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSyncOpenedPacksToInventory} disabled={isSyncingOpenedPacks} title="Packs synchronisieren">
                    {isSyncingOpenedPacks ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                    Sync Packs
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCleanupLegacyTeachersVoted} disabled={isCleaningLegacyVotes} title="Legacy-Daten entfernen">
                    {isCleaningLegacyVotes ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                    Cleanup Legacy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMigrateInventory} disabled={isMigratingInventory} title="Inventar migrieren">
                    {isMigratingInventory ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                    Migrate Inventory
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMigrateTeacherVol1} disabled={isMigratingTeacherVol1} title="Lehrer migrieren">
                    {isMigratingTeacherVol1 ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                    Migrate teacher_vol1
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex-1">
                    <TrendingUp className="h-3.5 w-3.5 rotate-90 mr-2" />
                    CSV Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportJSON} className="flex-1">
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    JSON Backup
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAllMismatches}
                  disabled={isDryRunning || isSyncing}
                  title="Dry-Run für Rarity-Mismatches"
                >
                  {isDryRunning ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Zap className="h-3 w-3 mr-2" />}
                  Mismatches prüfen
                </Button>
                <Badge variant="secondary" className="w-fit">
                  {currentSet?.cards.length || 0} Karten
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/30 p-4 rounded-xl border">
              <div className="flex-1 space-y-2 w-full">
                <Label htmlFor="teacher-name" className="text-[10px] font-bold uppercase text-muted-foreground">Name</Label>
                <Input
                  id="teacher-name"
                  placeholder="z.B. Herr Schmidt"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeacher()}
                />
              </div>
              <div className="sm:w-[200px] space-y-2 w-full">
                <Label htmlFor="teacher-rarity" className="text-[10px] font-bold uppercase text-muted-foreground">Seltenheit</Label>
                <select
                  id="teacher-rarity"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={newTeacherRarity}
                  onChange={(e) => setNewTeacherRarity(e.target.value as TeacherRarity)}
                >
                  <option value="common">Gewöhnlich</option>
                  <option value="rare">Selten</option>
                  <option value="epic">Episch</option>
                  <option value="mythic">Mythisch</option>
                  <option value="legendary">Legendär</option>
                  <option value="iconic">Ikonisch</option>
                </select>
              </div>
              <Button onClick={handleAddTeacher} disabled={!newTeacherName.trim()} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Lehrer suchen..."
                    className="pl-10 h-11"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex bg-muted/50 p-1 rounded-lg border border-border/60 shrink-0">
                  <button 
                    onClick={() => setTeacherSort('name-asc')}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      teacherSort === 'name-asc' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="A-Z sortieren"
                  >
                    <ArrowDownAZ className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setTeacherSort('name-desc')}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      teacherSort === 'name-desc' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Z-A sortieren"
                  >
                    <ArrowUpAZ className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-1 self-center" />
                  <button 
                    onClick={() => setTeacherSort('rarity-asc')}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      teacherSort === 'rarity-asc' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Seltenheit aufsteigend"
                  >
                    <ArrowUpWideNarrow className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setTeacherSort('rarity-desc')}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      teacherSort === 'rarity-desc' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Seltenheit absteigend"
                  >
                    <ArrowDownWideNarrow className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <TeacherList 
                  teachers={filteredTeachers} 
                  onEdit={handleEditTeacher} 
                  onRemove={handleRemoveTeacher} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Pool Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['common', 'rare', 'epic', 'mythic', 'legendary', 'iconic'].map((rarity) => (
              <div key={rarity} className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className={getRarityColor(rarity as TeacherRarity)}>{getRarityLabel(rarity as TeacherRarity)}</span>
                  <span>{rarityDistribution[rarity] || 0}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", 
                      rarity === 'common' ? 'bg-slate-400' :
                      rarity === 'rare' ? 'bg-emerald-500' :
                      rarity === 'epic' ? 'bg-purple-500' :
                      rarity === 'mythic' ? 'bg-red-500' : 
                      rarity === 'legendary' ? 'bg-amber-500' : 'bg-indigo-950 dark:bg-indigo-400'
                    )} 
                    style={{ width: `${((rarityDistribution[rarity] || 0) / (currentSet?.cards.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-4 italic">
              Tipp: Versuche eine gesunde Balance zu halten. Zu viele Legendarys machen sie weniger wertvoll.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lehrer Importieren</DialogTitle>
            <DialogDescription>
              Du hast {parsedTeachers.length} Lehrer in der Datei gefunden. Wähle eine Methode:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2",
                  importMode === 'merge' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setImportMode('merge')}
              >
                <div className="font-bold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Merge
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Aktualisiert bestehende Lehrer und fügt neue hinzu. IDs bleiben erhalten.
                </p>
              </div>
              <div 
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2",
                  importMode === 'overwrite' ? "border-destructive bg-destructive/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setImportMode('overwrite')}
              >
                <div className="font-bold flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" /> Überschreiben
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Löscht den aktuellen Pool und ersetzt ihn durch die CSV-Daten.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest opacity-50">Vorschau ({parsedTeachers.length})</Label>
              <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-muted/20 text-[10px] space-y-1">
                {parsedTeachers.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b last:border-0 border-border/40">
                    <span className="font-medium">{t.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[8px] h-4">{t.rarity}</Badge>
                      {t.type === 'teacher' && (t as any).hp && <span className="text-muted-foreground">HP: {(t as any).hp}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant={importMode === 'overwrite' ? 'destructive' : 'default'}
              onClick={() => handleBulkImport(importMode)}
              disabled={importing}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {importMode === 'merge' ? "Import & Zusammenführen" : "Alles Ersetzen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Set Dialog */}
      <Dialog open={isAddingSet} onOpenChange={setIsAddingSet}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Neues Set erstellen</DialogTitle>
            <DialogDescription>
              Erstelle ein neues Sammelkarten-Set. Die ID muss weltweit eindeutig sein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="set-id">ID (Internal, z.B. support_v1)</Label>
              <Input id="set-id" value={newSetId} onChange={(e) => setNewSetId(e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="support_v1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="set-name">Name</Label>
              <Input id="set-name" value={newSetName} onChange={(e) => setNewSetName(e.target.value)} placeholder="Support Set Vol. 1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="set-prefix">Prefix (z.B. S1)</Label>
              <Input id="set-prefix" value={newSetPrefix} onChange={(e) => setNewSetPrefix(e.target.value.toUpperCase())} placeholder="S1" maxLength={3} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="set-color">Themen-Farbe</Label>
              <div className="flex gap-2">
                <Input id="set-color" type="color" value={newSetColor} onChange={(e) => setNewSetColor(e.target.value)} className="w-12 h-10 p-1" />
                <Input value={newSetColor} onChange={(e) => setNewSetColor(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingSet(false)}>Abbrechen</Button>
            <Button onClick={handleAddSet} disabled={!newSetName || !newSetId || !newSetPrefix}>Set erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
