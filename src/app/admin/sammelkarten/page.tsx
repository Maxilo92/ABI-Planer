'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, setDoc, getDoc, collection, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Search, Pencil, Trash2, GraduationCap, 
  RefreshCw, Loader2, Gift, Sparkles, Database,
  AlertTriangle, Zap, Settings2,
  TrendingUp, Activity, BarChart3, Users, Upload
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { TeacherRarity, LootTeacher } from '@/types/database'
import { SammelkartenConfig } from '@/types/cards'
import { cn } from '@/lib/utils'

interface SmartNumericInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
  isInteger?: boolean;
}

function SmartNumericInput({ 
  value, 
  onChange, 
  step = "1", 
  min, 
  max, 
  className,
  isInteger = false
}: SmartNumericInputProps) {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
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

function formatProbability(weight: number) {
  if (weight <= 0) return "0%";
  const percent = (weight * 100).toFixed(weight < 0.01 ? 2 : 1) + "%";
  const oneIn = weight >= 1 ? "" : ` (1 in ${Math.round(1 / weight)})`;
  return percent + oneIn;
}

const DEFAULT_RARITY_WEIGHTS = [
  { common: 0.8, rare: 0.15, epic: 0.04, mythic: 0.008, legendary: 0.002 },
  { common: 0.6, rare: 0.25, epic: 0.11, mythic: 0.03, legendary: 0.01 },
  { common: 0.4, rare: 0.35, epic: 0.17, mythic: 0.06, legendary: 0.02 }
]

const DEFAULT_GODPACK_WEIGHTS = [
  { common: 0, rare: 0.4, epic: 0.35, mythic: 0.15, legendary: 0.10 },
  { common: 0, rare: 0.2, epic: 0.4, mythic: 0.25, legendary: 0.15 },
  { common: 0, rare: 0, epic: 0.4, mythic: 0.4, legendary: 0.2 }
]

const DEFAULT_VARIANTS = {
  shiny: 0.05,
  holo: 0.15,
  black_shiny_holo: 0.005
}

const DEFAULT_LIMITS = {
  daily_allowance: 2,
  reset_hour: 9,
  godpack_chance: 0.005
}

export default function CardManagerPage() {
  const { user, profile } = useAuth()
  const [config, setConfig] = useState<SammelkartenConfig | null>(null)
  const [localConfig, setLocalConfig] = useState<SammelkartenConfig | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [autosaveCountdown, setAutosaveCountdown] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Teacher Pool States
  const [newTeacherName, setNewTeacherName] = useState('')
  const [newTeacherRarity, setNewTeacherRarity] = useState<TeacherRarity>('common')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [editingTeacher, setEditingTeacher] = useState<LootTeacher | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Voting Data Sync State
  const [votingData, setVotingData] = useState<Record<string, { avg: number, count: number }>>({})
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)

  // Simulator State
  const [simCount, setSimCount] = useState(1000)
  const [simulating, setSimulating] = useState(false)
  const [simResults, setSimResults] = useState<{
    totalPacks: number,
    rarityCounts: Record<TeacherRarity, number>,
    variantCounts: Record<string, number>,
    godpackCount: number,
    teachersFound: Record<string, number>
  } | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SammelkartenConfig
        setConfig(data)
        if (!isDirty) {
          setLocalConfig(data)
        }
      } else {
        setConfig(null)
        setLocalConfig(null)
      }
      setLoading(false)
    })

    const fetchVotingData = async () => {
      try {
        const teachersSnap = await getDocs(collection(db, 'teachers'))
        const data: Record<string, { avg: number, count: number }> = {}
        teachersSnap.forEach(doc => {
          const d = doc.data()
          data[doc.id] = { avg: d.avg_rating || 0, count: d.vote_count || 0 }
        })
        setVotingData(data)
      } catch (e) {
        console.error("Error fetching voting data:", e)
      }
    }
    fetchVotingData()

    return () => unsubscribe()
  }, [isDirty])

  useEffect(() => {
    if (!isDirty || !localConfig) {
      setAutosaveCountdown(null)
      return
    }

    const timer = setTimeout(() => {
      performActualSave(localConfig)
    }, 10000)

    const interval = setInterval(() => {
      setAutosaveCountdown(prev => (prev !== null && prev > 0) ? prev - 1 : 0)
    }, 1000)
    setAutosaveCountdown(10)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [isDirty, localConfig])

  const performActualSave = async (dataToSave: SammelkartenConfig) => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'settings', 'sammelkarten'), {
        ...dataToSave,
        updated_at: serverTimestamp()
      })
      setIsDirty(false)
      setAutosaveCountdown(null)
      toast.success('Änderungen automatisch gespeichert')
    } catch (error) {
      toast.error('Automatisches Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfig = (updatedFields: Partial<SammelkartenConfig>) => {
    if (!localConfig) return
    setLocalConfig(prev => prev ? { ...prev, ...updatedFields } : null)
    setIsDirty(true)
  }

  const handleManualSave = async () => {
    if (!localConfig || !isDirty) return
    await performActualSave(localConfig)
  }

  const handleMigrate = async () => {
    if (!confirm('Möchtest du die Lehrer-Daten aus den globalen Einstellungen importieren? Dies überschreibt den aktuellen Lehrer-Pool hier.')) return
    
    setMigrating(true)
    try {
      const globalDoc = await getDoc(doc(db, 'settings', 'global'))
      const globalData = globalDoc.exists() ? globalDoc.data() : {}
      const existingTeachers = globalData.loot_teachers || []
      
      const newConfig: SammelkartenConfig = {
        loot_teachers: existingTeachers,
        rarity_weights: DEFAULT_RARITY_WEIGHTS,
        godpack_weights: DEFAULT_GODPACK_WEIGHTS,
        variant_probabilities: DEFAULT_VARIANTS,
        global_limits: DEFAULT_LIMITS,
        updated_at: serverTimestamp()
      }
      
      await setDoc(doc(db, 'settings', 'sammelkarten'), newConfig)
      
      if (user) {
        await logAction('CARDS_MIGRATED', user.uid, profile?.full_name, {
          teacher_count: existingTeachers.length
        })
      }
      
      toast.success('Migration erfolgreich abgeschlossen!')
    } catch (error) {
      console.error('Migration failed:', error)
      toast.error('Migration fehlgeschlagen.')
    } finally {
      setMigrating(false)
    }
  }

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim() || !localConfig) return
    
    const newTeacher: LootTeacher = {
      id: newTeacherName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: newTeacherName.trim(),
      rarity: newTeacherRarity
    }
    
    const updatedTeachers = [...(localConfig.loot_teachers || []), newTeacher]
    handleSaveConfig({ loot_teachers: updatedTeachers })
    setNewTeacherName('')
  }

  const handleRemoveTeacher = async (index: number) => {
    if (!localConfig) return
    const teacher = localConfig.loot_teachers[index]
    if (!confirm(`Möchtest du ${teacher.name} wirklich entfernen?`)) return
    
    const updatedTeachers = localConfig.loot_teachers.filter((_, i) => i !== index)
    handleSaveConfig({ loot_teachers: updatedTeachers })
  }

  const handleEditTeacher = (teacher: LootTeacher, index: number) => {
    setEditingTeacher({ ...teacher })
    setEditingIndex(index)
    setIsEditDialogOpen(true)
  }

  const handleUpdateTeacher = async () => {
    if (!editingTeacher || editingIndex === null || !localConfig) return
    
    const updatedTeachers = [...localConfig.loot_teachers]
    updatedTeachers[editingIndex] = editingTeacher
    
    handleSaveConfig({ loot_teachers: updatedTeachers })
    setIsEditDialogOpen(false)
  }

  const handleSyncRarities = async () => {
    if (!localConfig) return
    if (!confirm('Möchtest du die Seltenheiten basierend auf den aktuellen Voting-Durchschnitten aktualisieren?')) return
    
    setSyncing(true)
    try {
      const updatedTeachers = localConfig.loot_teachers.map(t => {
        const live = votingData[t.id]
        if (!live || live.count < 5) return t
        
        let newRarity: TeacherRarity = 'common'
        if (live.avg >= 0.9) newRarity = 'legendary'
        else if (live.avg >= 0.75) newRarity = 'mythic'
        else if (live.avg >= 0.55) newRarity = 'epic'
        else if (live.avg >= 0.3) newRarity = 'rare'
        
        return { ...t, rarity: newRarity }
      })

      handleSaveConfig({ loot_teachers: updatedTeachers })
      toast.success('Raritäten synchronisiert!')
    } catch (error) {
      toast.error('Sync fehlgeschlagen.')
    } finally {
      setSyncing(false)
    }
  }

  const handleBulkImport = async () => {
    if (!localConfig || importing) return
    const confirmed = window.confirm('Möchtest du alle Lehrer aus der vordefinierten Liste importieren? Bestehende Lehrer in der Voting-Datenbank werden übersprungen.')
    if (!confirmed) return

    setImporting(true)
    try {
      const teachersToImport = [
        {"id":"herr-altenhenne","name":"Herr Altenhenne","avg_rating":0,"vote_count":0},
        {"id":"frau-balling","name":"Frau Balling","avg_rating":0,"vote_count":0},
        {"id":"frau-bau","name":"Frau Bau","avg_rating":0,"vote_count":0},
        {"id":"frau-bennari","name":"Frau Bennari","avg_rating":0,"vote_count":0},
        {"id":"frau-biastoch","name":"Frau Biastoch","avg_rating":0,"vote_count":0},
        {"id":"frau-bien","name":"Frau Bien","avg_rating":0,"vote_count":0},
        {"id":"frau-bley","name":"Frau Bley","avg_rating":0,"vote_count":0},
        {"id":"frau-burckhardt","name":"Frau Burckhardt","avg_rating":0,"vote_count":0},
        {"id":"frau-b-hler-grosa","name":"Frau Bähler-Grosa","avg_rating":0,"vote_count":0},
        {"id":"frau-clemens","name":"Frau Clemens","avg_rating":0,"vote_count":0},
        {"id":"frau-courant-fernandes","name":"Frau Courant Fernandes","avg_rating":0,"vote_count":0},
        {"id":"herr-de-vivanco","name":"Herr de Vivanco","avg_rating":0,"vote_count":0},
        {"id":"frau-deleske","name":"Frau Deleske","avg_rating":0,"vote_count":0},
        {"id":"frau-drescher","name":"Frau Drescher","avg_rating":0,"vote_count":0},
        {"id":"frau-ernst","name":"Frau Ernst","avg_rating":0,"vote_count":0},
        {"id":"frau-feuerbach","name":"Frau Feuerbach","avg_rating":0,"vote_count":0},
        {"id":"frau-fiedler","name":"Frau Fiedler","avg_rating":0,"vote_count":0},
        {"id":"frau-franke","name":"Frau Franke","avg_rating":0,"vote_count":0},
        {"id":"frau-friedrich","name":"Frau Friedrich","avg_rating":0,"vote_count":0},
        {"id":"frau-fritzsch","name":"Frau Fritzsch","avg_rating":0,"vote_count":0},
        {"id":"herr-fritzsch","name":"Herr Fritzsch","avg_rating":0,"vote_count":0},
        {"id":"herr-fuchs","name":"Herr Fuchs","avg_rating":0,"vote_count":0},
        {"id":"frau-galle","name":"Frau Galle","avg_rating":0,"vote_count":0},
        {"id":"frau-gantumur","name":"Frau Gantumur","avg_rating":0,"vote_count":0},
        {"id":"frau-ganzer","name":"Frau Ganzer","avg_rating":0,"vote_count":0},
        {"id":"herr-grabowski","name":"Herr Grabowski","avg_rating":0,"vote_count":0},
        {"id":"herr-gr-ler","name":"Herr Gräßler","avg_rating":0,"vote_count":0},
        {"id":"frau-haase","name":"Frau Haase","avg_rating":0,"vote_count":0},
        {"id":"frau-henker","name":"Frau Henker","avg_rating":0,"vote_count":0},
        {"id":"frau-hoppe","name":"Frau Hoppe","avg_rating":0,"vote_count":0},
        {"id":"frau-jerol","name":"Frau Jerol","avg_rating":0,"vote_count":0},
        {"id":"frau-jurk","name":"Frau Jurk","avg_rating":0,"vote_count":0},
        {"id":"herr-j-rg","name":"Herr Jörg","avg_rating":0,"vote_count":0},
        {"id":"herr-kaiser","name":"Herr Kaiser","avg_rating":0,"vote_count":0},
        {"id":"frau-kaule","name":"Frau Kaule","avg_rating":0,"vote_count":0},
        {"id":"frau-kober","name":"Frau Kober","avg_rating":0,"vote_count":0},
        {"id":"frau-kobisch","name":"Frau Kobisch","avg_rating":0,"vote_count":0},
        {"id":"frau-krenzke","name":"Frau Krenzke","avg_rating":0,"vote_count":0},
        {"id":"herr-kreye","name":"Herr Kreye","avg_rating":0,"vote_count":0},
        {"id":"herr-kutschick","name":"Herr Kutschick","avg_rating":0,"vote_count":0},
        {"id":"herr-k-nner","name":"Herr Känner","avg_rating":0,"vote_count":0},
        {"id":"frau-k-gler","name":"Frau Kügler","avg_rating":0,"vote_count":0},
        {"id":"frau-k-nzelmann","name":"Frau Künzelmann","avg_rating":0,"vote_count":0},
        {"id":"frau-laber","name":"Frau Laber","avg_rating":0,"vote_count":0},
        {"id":"herr-lange","name":"Herr Lange","avg_rating":0,"vote_count":0},
        {"id":"frau-link","name":"Frau Link","avg_rating":0,"vote_count":0},
        {"id":"frau-loitsch","name":"Frau Loitsch","avg_rating":0,"vote_count":0},
        {"id":"herr-loitsch","name":"Herr Loitsch","avg_rating":0,"vote_count":0},
        {"id":"herr-lory","name":"Herr Lory","avg_rating":0,"vote_count":0},
        {"id":"frau-manuwald","name":"Frau Manuwald","avg_rating":0,"vote_count":0},
        {"id":"frau-matz","name":"Frau Matz","avg_rating":0,"vote_count":0},
        {"id":"frau-meinhold","name":"Frau Meinhold","avg_rating":0,"vote_count":0},
        {"id":"frau-mey","name":"Frau Mey","avg_rating":0,"vote_count":0},
        {"id":"herr-moch","name":"Herr Moch","avg_rating":0,"vote_count":0},
        {"id":"herr-musiol","name":"Herr Musiol","avg_rating":0,"vote_count":0},
        {"id":"frau-neufeldt","name":"Frau Neufeldt","avg_rating":0,"vote_count":0},
        {"id":"frau-neugebauer","name":"Frau Neugebauer","avg_rating":0,"vote_count":0},
        {"id":"frau-nims","name":"Frau Nims","avg_rating":0,"vote_count":0},
        {"id":"frau-nobis","name":"Frau Nobis","avg_rating":0,"vote_count":0},
        {"id":"frau-packheiser","name":"Frau Packheiser","avg_rating":0,"vote_count":0},
        {"id":"frau-peucker","name":"Frau Peucker","avg_rating":0,"vote_count":0},
        {"id":"frau-piwonka","name":"Frau Piwonka","avg_rating":0,"vote_count":0},
        {"id":"herr-rehnolt","name":"Herr Rehnolt","avg_rating":0,"vote_count":0},
        {"id":"frau-reichelt","name":"Frau Reichelt","avg_rating":0,"vote_count":0},
        {"id":"herr-rentsch","name":"Herr Rentsch","avg_rating":0,"vote_count":0},
        {"id":"herr-richter","name":"Herr Richter","avg_rating":0,"vote_count":0},
        {"id":"herr-riedel","name":"Herr Riedel","avg_rating":0,"vote_count":0},
        {"id":"herr-ritter","name":"Herr Ritter","avg_rating":0,"vote_count":0},
        {"id":"frau-rosenthal","name":"Frau Rosenthal","avg_rating":0,"vote_count":0},
        {"id":"frau-runge","name":"Frau Runge","avg_rating":0,"vote_count":0},
        {"id":"frau-ruscher","name":"Frau Ruscher","avg_rating":0,"vote_count":0},
        {"id":"frau-r-hling","name":"Frau Röhling","avg_rating":0,"vote_count":0},
        {"id":"frau-r-mer","name":"Frau Römer","avg_rating":0,"vote_count":0},
        {"id":"herr-sarodnik","name":"Herr Sarodnik","avg_rating":0,"vote_count":0},
        {"id":"frau-schier","name":"Frau Schier","avg_rating":0,"vote_count":0},
        {"id":"frau-schimek","name":"Frau Schimek","avg_rating":0,"vote_count":0},
        {"id":"herr-schlegel","name":"Herr Schlegel","avg_rating":0,"vote_count":0},
        {"id":"frau-schmidt","name":"Frau Schmidt","avg_rating":0,"vote_count":0},
        {"id":"herr-schneider","name":"Herr Schneider","avg_rating":0,"vote_count":0},
        {"id":"herr-scholz","name":"Herr Scholz","avg_rating":0,"vote_count":0},
        {"id":"frau-schultz","name":"Frau Schultz","avg_rating":0,"vote_count":0},
        {"id":"herr-schulze","name":"Herr Schulze","avg_rating":0,"vote_count":0},
        {"id":"frau-schumann","name":"Frau Schumann","avg_rating":0,"vote_count":0},
        {"id":"frau-schwarzer","name":"Frau Schwarzer","avg_rating":0,"vote_count":0},
        {"id":"herr-stange","name":"Herr Stange","avg_rating":0,"vote_count":0},
        {"id":"frau-stein","name":"Frau Stein","avg_rating":0,"vote_count":0},
        {"id":"frau-stelzig","name":"Frau Stelzig","avg_rating":0,"vote_count":0},
        {"id":"herr-stirner","name":"Herr Stirner","avg_rating":0,"vote_count":0},
        {"id":"frau-strote","name":"Frau Strote","avg_rating":0,"vote_count":0},
        {"id":"herr-stuhlmacher","name":"Herr Stuhlmacher","avg_rating":0,"vote_count":0},
        {"id":"herr-trinczek","name":"Herr Trinczek","avg_rating":0,"vote_count":0},
        {"id":"frau-t-th","name":"Frau Tóth","avg_rating":0,"vote_count":0},
        {"id":"frau-unger","name":"Frau Unger","avg_rating":0,"vote_count":0},
        {"id":"frau-vogel","name":"Frau Vogel","avg_rating":0,"vote_count":0},
        {"id":"frau-wahl","name":"Frau Wahl","avg_rating":0,"vote_count":0},
        {"id":"frau-weise","name":"Frau Weise","avg_rating":0,"vote_count":0},
        {"id":"herr-wei-","name":"Herr Weiß","avg_rating":0,"vote_count":0},
        {"id":"frau-wendorff","name":"Frau Wendorff","avg_rating":0,"vote_count":0},
        {"id":"frau-wilke","name":"Frau Wilke","avg_rating":0,"vote_count":0},
        {"id":"frau-wonneberger","name":"Frau Wonneberger","avg_rating":0,"vote_count":0},
        {"id":"herr-zeiler","name":"Herr Zeiler","avg_rating":0,"vote_count":0}
      ]

      let batch = writeBatch(db)
      let count = 0
      for (const t of teachersToImport) {
        const ref = doc(db, 'teachers', t.id)
        batch.set(ref, t, { merge: true })
        count++
        if (count >= 400) {
          await batch.commit()
          batch = writeBatch(db)
          count = 0
        }
      }
      await batch.commit()
      
      const newLootTeachers = [...(localConfig.loot_teachers || [])]
      let addedCount = 0
      teachersToImport.forEach(t => {
        if (!newLootTeachers.some(lt => lt.id === t.id)) {
          newLootTeachers.push({ id: t.id, name: t.name, rarity: 'common' })
          addedCount++
        }
      })
      
      if (addedCount > 0) {
        await handleSaveConfig({ loot_teachers: newLootTeachers })
      }
      
      toast.success(`${addedCount} neue Lehrer importiert!`)
    } catch (error) {
      console.error('Error in bulk import:', error)
      toast.error('Fehler beim Importieren.')
    } finally {
      setImporting(false)
    }
  }

  const runSimulation = () => {
    if (!localConfig) return
    setSimulating(true)
    
    setTimeout(() => {
      const results = {
        totalPacks: simCount,
        rarityCounts: { common: 0, rare: 0, epic: 0, mythic: 0, legendary: 0 } as Record<TeacherRarity, number>,
        variantCounts: { normal: 0, holo: 0, shiny: 0, black_shiny_holo: 0 } as Record<string, number>,
        godpackCount: 0,
        teachersFound: {} as Record<string, number>
      }

      const generateOnePack = (isGodpack: boolean) => {
        const weights = isGodpack ? localConfig!.godpack_weights : localConfig!.rarity_weights
        
        return weights.map(slotWeights => {
          const rand = Math.random()
          let cumulative = 0
          let targetRarity: TeacherRarity = 'common'
          for (const [rarity, weight] of Object.entries(slotWeights) as [TeacherRarity, number][]) {
            cumulative += weight
            if (rand < cumulative) {
              targetRarity = rarity as TeacherRarity
              break
            }
          }
          
          results.rarityCounts[targetRarity]++
          
          // Variant logic
          const vRand = Math.random()
          let variant = 'normal'
          if (isGodpack) {
            if (vRand < 0.1) variant = 'black_shiny_holo'
            else if (vRand < 0.4) variant = 'shiny'
            else if (vRand < 0.8) variant = 'holo'
          } else {
            const probs = localConfig!.variant_probabilities
            if (vRand < probs.black_shiny_holo) variant = 'black_shiny_holo'
            else if (vRand < probs.shiny) variant = 'shiny'
            else if (vRand < probs.holo) variant = 'holo'
          }
          results.variantCounts[variant]++
          
          return targetRarity
        })
      }

      for (let i = 0; i < simCount; i++) {
        const isGodpack = Math.random() < localConfig!.global_limits.godpack_chance
        if (isGodpack) results.godpackCount++
        generateOnePack(isGodpack)
      }

      setSimResults(results)
      setSimulating(false)
      toast.success('Simulation abgeschlossen')
    }, 100)
  }

  const getRarityColor = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return 'text-slate-500'
      case 'rare': return 'text-emerald-500'
      case 'epic': return 'text-purple-500'
      case 'mythic': return 'text-red-500'
      case 'legendary': return 'text-amber-500'
      default: return 'text-slate-500'
    }
  }

  const getRarityLabel = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return 'Gewöhnlich'
      case 'rare': return 'Selten'
      case 'epic': return 'Episch'
      case 'mythic': return 'Mythisch'
      case 'legendary': return 'Legendär'
    }
  }

  const filteredTeachers = useMemo(() => {
    return (localConfig?.loot_teachers || []).filter(t => 
      t.name.toLowerCase().includes(teacherSearch.toLowerCase())
    )
  }, [localConfig?.loot_teachers, teacherSearch])

  const rarityDistribution = useMemo(() => {
    if (!localConfig) return {}
    const dist: Record<string, number> = {}
    localConfig.loot_teachers.forEach(t => {
      dist[t.rarity] = (dist[t.rarity] || 0) + 1
    })
    return dist
  }, [localConfig])

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Lade Sammelkarten-Konfiguration...</p>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 space-y-8 pb-20 px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Sammelkarten Manager
            </h1>
            <p className="text-muted-foreground text-sm">Zentrale Steuerung für den Lehrerpool und die Pack-Ökonomie.</p>
          </div>
          
          <div className="flex items-center gap-2">
            {!localConfig && (
              <Button onClick={handleMigrate} disabled={migrating} className="gap-2 bg-amber-600 hover:bg-amber-700">
                {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Daten migrieren
              </Button>
            )}

            {isDirty ? (
              <div className="flex items-center gap-3 bg-muted/50 pl-3 pr-1 py-1 rounded-full border border-primary/10">
                {autosaveCountdown !== null && (
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    Autosave in {autosaveCountdown}s
                  </span>
                )}
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleManualSave} 
                  disabled={saving}
                  className="h-7 text-[11px] gap-2 hover:bg-emerald-500/10 hover:text-emerald-600"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Jetzt speichern
                </Button>
              </div>
            ) : (
              saving && (
                <Badge variant="outline" className="animate-pulse bg-primary/5 text-primary border-primary/20">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Speichere...
                </Badge>
              )
            )}
          </div>
        </div>

        {!localConfig ? (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Initialisierung erforderlich
              </CardTitle>
              <CardDescription>
                Es wurde noch keine spezialisierte Sammelkarten-Konfiguration gefunden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleMigrate} disabled={migrating}>
                Jetzt initialisieren
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8 items-start">
            
            {/* Left/Main Column: Teacher Pool & Weights */}
            <div className="xl:col-span-3 space-y-8">
              
              <Tabs defaultValue="teachers" className="w-full">
                <TabsList className="w-fit bg-muted/50 p-1 rounded-xl border border-border/60">
                  <TabsTrigger value="teachers" className="px-4 py-1.5 text-xs gap-2 transition-all">
                    <Users className="h-3.5 w-3.5" />
                    <span>Lehrerpool</span>
                  </TabsTrigger>
                  <TabsTrigger value="weights" className="px-4 py-1.5 text-xs gap-2 transition-all">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Drop-Rates</span>
                  </TabsTrigger>
                  <TabsTrigger value="limits" className="px-4 py-1.5 text-xs gap-2 transition-all">
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Parameter</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="teachers" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Lehrer-Lootpool
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleSyncRarities} disabled={syncing}>
                              {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                              Sync Polls
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleBulkImport} disabled={importing}>
                              {importing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                              Bulk Import
                            </Button>
                            <Badge variant="secondary">
                              {localConfig!.loot_teachers.length} Lehrer
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/30 p-4 rounded-xl border">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="teacher-name" className="text-[10px] font-bold uppercase text-muted-foreground">Name</Label>
                            <Input
                              id="teacher-name"
                              placeholder="z.B. Herr Schmidt"
                              value={newTeacherName}
                              onChange={(e) => setNewTeacherName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTeacher()}
                            />
                          </div>
                          <div className="sm:w-[200px] space-y-2">
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
                            </select>
                          </div>
                          <Button onClick={handleAddTeacher} disabled={!newTeacherName.trim()}>
                            <Plus className="h-4 w-4 mr-2" /> Add
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Lehrer suchen..."
                              className="pl-10 h-11"
                              value={teacherSearch}
                              onChange={(e) => setTeacherSearch(e.target.value)}
                            />
                          </div>

                          <div className="rounded-xl border overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/10">
                              {filteredTeachers.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-sm text-muted-foreground italic">
                                  Keine Lehrer im Pool.
                                </div>
                              ) : (
                                filteredTeachers.map((teacher, index) => {
                                  const liveData = votingData[teacher.id]
                                  return (
                                    <div key={`${teacher.id}-${index}`} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/30 transition-all group">
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-sm truncate">{teacher.name}</span>
                                          {liveData && liveData.count > 0 && (
                                            <Badge variant="outline" className="h-4 text-[8px] px-1 bg-primary/5 border-primary/10">
                                              Ø {liveData.avg.toFixed(2)}
                                            </Badge>
                                          )}
                                        </div>
                                        <span className={cn("text-[10px] font-black uppercase tracking-wider", getRarityColor(teacher.rarity))}>
                                          {getRarityLabel(teacher.rarity)}
                                        </span>
                                      </div>
                                      <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTeacher(teacher, index)}>
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveTeacher(index)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          Pool Verteilung
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {['common', 'rare', 'epic', 'mythic', 'legendary'].map((rarity) => (
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
                                  rarity === 'mythic' ? 'bg-red-500' : 'bg-amber-500'
                                )} 
                                style={{ width: `${((rarityDistribution[rarity] || 0) / (localConfig!.loot_teachers.length || 1)) * 100}%` }}
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
                </TabsContent>

                <TabsContent value="weights" className="mt-6 space-y-6">
                  {/* Regular Weights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        Reguläre Pack-Gewichte (3 Slots)
                      </CardTitle>
                      <CardDescription>Wahrscheinlichkeiten pro Slot im Booster (Summe sollte 1.0 ergeben).</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {localConfig!.rarity_weights.map((slot, sIdx) => (
                        <div key={`reg-slot-${sIdx}`} className="space-y-4 p-4 rounded-xl border bg-muted/30">
                          <h4 className="text-xs font-black uppercase text-center tracking-widest border-b pb-2">Slot {sIdx + 1}</h4>
                          {(Object.entries(slot) as [TeacherRarity, number][]).map(([rarity, weight]) => (
                            <div key={rarity} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className={getRarityColor(rarity as TeacherRarity)}>{getRarityLabel(rarity as TeacherRarity)}</span>
                                <span className="text-muted-foreground">{formatProbability(weight)}</span>
                              </div>
                              <SmartNumericInput 
                                step="0.001" 
                                min="0" 
                                max="1"
                                value={weight}
                                onChange={(val) => {
                                  const newWeights = [...localConfig!.rarity_weights]
                                  newWeights[sIdx] = { ...newWeights[sIdx], [rarity]: val }
                                  handleSaveConfig({ rarity_weights: newWeights })
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Godpack Weights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Godpack-Gewichte (3 Slots)
                      </CardTitle>
                      <CardDescription>Gewichte, wenn ein Godpack gezogen wird (extrem selten).</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {localConfig!.godpack_weights.map((slot, sIdx) => (
                        <div key={`god-slot-${sIdx}`} className="space-y-4 p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
                          <h4 className="text-xs font-black uppercase text-center tracking-widest border-b border-amber-500/20 pb-2 text-amber-700">Slot {sIdx + 1}</h4>
                          {(Object.entries(slot) as [TeacherRarity, number][]).map(([rarity, weight]) => (
                            <div key={rarity} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className={getRarityColor(rarity as TeacherRarity)}>{getRarityLabel(rarity as TeacherRarity)}</span>
                                <span className="text-muted-foreground">{formatProbability(weight)}</span>
                              </div>
                              <SmartNumericInput 
                                step="0.001" 
                                min="0" 
                                max="1"
                                value={weight}
                                onChange={(val) => {
                                  const newWeights = [...localConfig!.godpack_weights]
                                  newWeights[sIdx] = { ...newWeights[sIdx], [rarity]: val }
                                  handleSaveConfig({ godpack_weights: newWeights })
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="limits" className="mt-6 space-y-6">
                   <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        Globale Parameter & Varianten
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Limits */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold border-b pb-2">Limits & Reset</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Tägliche Packs pro User</Label>
                            <SmartNumericInput 
                              isInteger
                              value={localConfig!.global_limits.daily_allowance}
                              onChange={(val) => handleSaveConfig({ global_limits: { ...localConfig!.global_limits, daily_allowance: val }})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Reset Stunde (Berlin Zeit, 0-23)</Label>
                            <SmartNumericInput 
                              isInteger
                              min="0"
                              max="23"
                              value={localConfig!.global_limits.reset_hour}
                              onChange={(val) => handleSaveConfig({ global_limits: { ...localConfig!.global_limits, reset_hour: val }})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Godpack Wahrscheinlichkeit {formatProbability(localConfig!.global_limits.godpack_chance)}</Label>
                            <SmartNumericInput 
                              step="0.0001"
                              value={localConfig!.global_limits.godpack_chance}
                              onChange={(val) => handleSaveConfig({ global_limits: { ...localConfig!.global_limits, godpack_chance: val }})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Variant Probabilities */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold border-b pb-2">Varianten-Wahrscheinlichkeiten</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Shiny (Silber-Effekt) {formatProbability(localConfig!.variant_probabilities.shiny)}</Label>
                            <SmartNumericInput 
                              step="0.001"
                              value={localConfig!.variant_probabilities.shiny}
                              onChange={(val) => handleSaveConfig({ variant_probabilities: { ...localConfig!.variant_probabilities, shiny: val }})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Holo (Regenbogen-Effekt) {formatProbability(localConfig!.variant_probabilities.holo)}</Label>
                            <SmartNumericInput 
                              step="0.001"
                              value={localConfig!.variant_probabilities.holo}
                              onChange={(val) => handleSaveConfig({ variant_probabilities: { ...localConfig!.variant_probabilities, holo: val }})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Black Shiny Holo (Secret Rare) {formatProbability(localConfig!.variant_probabilities.black_shiny_holo)}</Label>
                            <SmartNumericInput 
                              step="0.0001"
                              value={localConfig!.variant_probabilities.black_shiny_holo}
                              onChange={(val) => handleSaveConfig({ variant_probabilities: { ...localConfig!.variant_probabilities, black_shiny_holo: val }})}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Pack Simulator */}
            <div className="space-y-6">
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
                              {count} <span className="text-muted-foreground text-[10px]">({((count / (simResults.totalPacks * 3)) * 100).toFixed(1)}%)</span>
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
                              {count} <span className="text-muted-foreground text-[10px]">({((count / (simResults.totalPacks * 3)) * 100).toFixed(2)}%)</span>
                            </span>
                          </div>
                        ))}
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
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lehrer bearbeiten</DialogTitle>
              <DialogDescription>
                Ändere den Namen oder die Seltenheit des Lehrers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-teacher-name">Name</Label>
                <Input
                  id="edit-teacher-name"
                  value={editingTeacher?.name || ''}
                  onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-teacher-rarity">Seltenheit</Label>
                <select
                  id="edit-teacher-rarity"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editingTeacher?.rarity || 'common'}
                  onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, rarity: e.target.value as TeacherRarity } : null)}
                >
                  <option value="common">Gewöhnlich</option>
                  <option value="rare">Selten</option>
                  <option value="epic">Episch</option>
                  <option value="mythic">Mythisch</option>
                  <option value="legendary">Legendär</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateTeacher}>
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  )
}
