'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { db, functions } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, setDoc, getDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Search, Pencil, Trash2, GraduationCap, 
  RefreshCw, Loader2, Sparkles, Database,
  AlertTriangle, Zap, Settings2,
  TrendingUp, Activity, BarChart3, Users, Upload,
  ArrowDownAZ, ArrowUpAZ, ArrowDownWideNarrow, ArrowUpWideNarrow, ArrowLeftRight
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { TeacherRarity, LootTeacher, CardProposal, TeacherAttack } from '@/types/database'
import { SammelkartenConfig, CardSet } from '@/types/cards'
import { CARD_SETS } from '@/constants/cardRegistry'
import { cn, getRarityColor, getRarityLabel, restoreGermanUmlauts } from '@/lib/utils'
import { TeacherEditDialog } from '@/components/admin/TeacherEditDialog'
import { NotificationPreviewDialog } from '@/components/admin/NotificationPreviewDialog'
import { TeacherList } from '@/components/admin/TeacherList'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

interface SmartNumericInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
  isInteger?: boolean;
}

type ProposalUsageStatus = 'unknown' | 'used' | 'not_used'

interface ProposalEditDraft {
  teacher_name: string
  hp: number
  description: string
  attacks: TeacherAttack[]
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
  { common: 0.8, rare: 0.15, epic: 0.04, mythic: 0.008, legendary: 0.0015, iconic: 0.0005 },
  { common: 0.6, rare: 0.25, epic: 0.11, mythic: 0.03, legendary: 0.008, iconic: 0.002 },
  { common: 0.4, rare: 0.35, epic: 0.17, mythic: 0.06, legendary: 0.015, iconic: 0.005 }
]

const DEFAULT_GODPACK_WEIGHTS = [
  { common: 0, rare: 0.4, epic: 0.35, mythic: 0.15, legendary: 0.05, iconic: 0.05 },
  { common: 0, rare: 0.2, epic: 0.4, mythic: 0.25, legendary: 0.05, iconic: 0.1 },
  { common: 0, rare: 0, epic: 0.4, mythic: 0.4, legendary: 0.0, iconic: 0.2 }
]

const DEFAULT_VARIANTS = {
  shiny: 0.05,
  holo: 0.15,
  black_shiny_holo: 0.005
}

const DEFAULT_LIMITS = {
  daily_allowance: 2,
  reset_hour: 9,
  godpack_chance: 0.005,
  rarity_limits: {
    iconic: 1,
    legendary: 5,
    mythic: 15
  }
}

const RARITY_ORDER: TeacherRarity[] = ['common', 'rare', 'epic', 'mythic', 'legendary', 'iconic']
const RARITY_CHART_COLORS: Record<TeacherRarity, string> = {
  common: '#94a3b8',
  rare: '#10b981',
  epic: '#a855f7',
  mythic: '#ef4444',
  legendary: '#f59e0b',
  iconic: '#4338ca',
}

const VARIANT_CHART_COLORS: Record<string, string> = {
  normal: '#64748b',
  holo: '#8b5cf6',
  shiny: '#f59e0b',
  black_shiny_holo: '#111827',
}

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

function normalizeVisibleTeacherText(teacher: LootTeacher): LootTeacher {
  return {
    ...teacher,
    name: restoreGermanUmlauts(teacher.name || ''),
    description: teacher.description ? restoreGermanUmlauts(teacher.description) : teacher.description,
    attacks: teacher.attacks?.map((attack) => ({
      ...attack,
      name: restoreGermanUmlauts(attack.name || ''),
      description: attack.description ? restoreGermanUmlauts(attack.description) : attack.description,
    }))
  }
}

export default function CardManagerPage() {
  const { user, profile } = useAuth()
  const [, setConfig] = useState<SammelkartenConfig | null>(null)
  const [localConfig, setLocalConfig] = useState<SammelkartenConfig | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [autosaveCountdown, setAutosaveCountdown] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Teacher Pool States
  const [selectedSetId, setSelectedSetId] = useState<string>('teacher_vol1')
  const [isAddingSet, setIsAddingSet] = useState(false)
  const [newSetName, setNewSetName] = useState('')
  const [newSetId, setNewSetId] = useState('')
  const [newSetPrefix, setNewSetPrefix] = useState('')
  const [newSetColor, setNewSetColor] = useState('#3b82f6')

  const [newTeacherName, setNewTeacherName] = useState('')
  const [newTeacherRarity, setNewTeacherRarity] = useState<TeacherRarity>('common')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [teacherSort, setTeacherSort] = useState<'name-asc' | 'name-desc' | 'rarity-asc' | 'rarity-desc'>('name-asc')
  const [editingTeacher, setEditingTeacher] = useState<LootTeacher | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCleaningInventory, setIsCleaningInventory] = useState(false)
  const [isSyncingOpenedPacks, setIsSyncingOpenedPacks] = useState(false)
  const [isCleaningLegacyVotes, setIsCleaningLegacyVotes] = useState(false)
  const [isMigratingInventory, setIsMigratingInventory] = useState(false)
  const [isMigratingTeacherVol1, setIsMigratingTeacherVol1] = useState(false)

  // ... (nach den anderen handle-Funktionen)
  const handleMigrateInventory = async () => {
    if (!user) return
    setIsMigratingInventory(true)
    const toastId = toast.loading("Migriere Booster-Inventar...")
    try {
      const migrateFn = httpsCallable(functions, 'migrateBoosterStats')
      const result = await migrateFn()
      const data = result.data as { success: boolean, message: string, migrated: boolean }
      
      if (data.success) {
        toast.success(data.message, { id: toastId })
      } else {
        toast.error("Migration fehlgeschlagen.", { id: toastId })
      }
    } catch (error) {
      console.error("Migration error:", error)
      toast.error("Fehler beim Aufruf der Migration.", { id: toastId })
    } finally {
      setIsMigratingInventory(false)
    }
  }

  const handleMigrateTeacherVol1 = async () => {
    if (!user) return
    setIsMigratingTeacherVol1(true)
    const toastId = toast.loading("Migriere teacher_vol1 Inventar...")
    try {
      const migrateFn = httpsCallable(functions, 'migrateTeacherVol1Inventory')
      const result = await migrateFn()
      const data = result.data as {
        success: boolean
        stats?: {
          inventoryDocsUpdated?: number
          profileDocsUpdated?: number
          cardKeysRewritten?: number
        }
      }

      if (data.success) {
        const inventoryUpdated = data.stats?.inventoryDocsUpdated ?? 0
        const profilesUpdated = data.stats?.profileDocsUpdated ?? 0
        const keysRewritten = data.stats?.cardKeysRewritten ?? 0
        toast.success(
          `teacher_vol1 Migration abgeschlossen. user_teachers: ${inventoryUpdated}, profiles: ${profilesUpdated}, keys: ${keysRewritten}`,
          { id: toastId }
        )
      } else {
        toast.error("teacher_vol1 Migration fehlgeschlagen.", { id: toastId })
      }
    } catch (error) {
      console.error("teacher_vol1 migration error:", error)
      toast.error("Fehler beim Aufruf der teacher_vol1 Migration.", { id: toastId })
    } finally {
      setIsMigratingTeacherVol1(false)
    }
  }
  const [isSyncing, setIsSyncing] = useState(false)
  
  const [importing, setImporting] = useState(false)
  const [systemFeatures, setSystemFeatures] = useState<any>(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) setSystemFeatures(snap.data())
    })
    return () => unsub()
  }, [])
  
  // Dry-Run Dialog State
  const [showDryRunDialog, setShowDryRunDialog] = useState(false)
  const [dryRunPreview, setDryRunPreview] = useState<any>(null)
  const [isDryRunning, setIsDryRunning] = useState(false)
  const [pendingDryRunAction, setPendingDryRunAction] = useState<string | null>(null)
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})

  type RarityFixDetail = {
    userId: string
    teacherId: string
    cardsRemoved: number
    duplicates: number
    compensationPacks: number
    rarity?: string
    variants?: Record<string, number>
  }

  type PreviewNotification = {
    userId: string
    userName?: string
    totalCardsRemoved: number
    totalCompensation: number
    removedCards: Array<{
      teacherId: string
      teacherName: string
      rarity: string
      variants: Record<string, number>
      totalRemoved: number
      duplicates: number
      compensationPacks: number
    }>
  }

  
  // CSV Import State
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [parsedTeachers, setParsedTeachers] = useState<LootTeacher[]>([])
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper to generate consistent IDs
  const generateTeacherId = (name: string, existingIds: string[] = []) => {
    const baseId = name.trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let finalId = baseId;
    let counter = 1;
    
    // Ensure uniqueness within the existing pool
    while (existingIds.includes(finalId)) {
      counter++;
      finalId = `${baseId}-${counter}`;
    }
    
    return finalId;
  };

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

  // Ideen-Labor Proposals (read-only)
  const [cardProposals, setCardProposals] = useState<CardProposal[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(true)
  const [moderatingProposalId, setModeratingProposalId] = useState<string | null>(null)
  const [backfillingProposalUsage, setBackfillingProposalUsage] = useState(false)
  const [proposalModerationDialogOpen, setProposalModerationDialogOpen] = useState(false)
  const [proposalInDialog, setProposalInDialog] = useState<CardProposal | null>(null)
  const [proposalEditDraft, setProposalEditDraft] = useState<ProposalEditDraft | null>(null)
  const [proposalUsageStatusDraft, setProposalUsageStatusDraft] = useState<'used' | 'not_used'>('used')
  const [proposalAdminNoteDraft, setProposalAdminNoteDraft] = useState('')

  const availableSets = useMemo(() => {
    const dynamicSets = localConfig?.sets || {}
    // Merge static and dynamic sets. Dynamic overrides static with same ID.
    const merged = { ...CARD_SETS, ...dynamicSets }
    return Object.values(merged)
  }, [localConfig?.sets])

  const currentSet = useMemo(() => {
    if (!localConfig) return null
    return localConfig.sets?.[selectedSetId] || CARD_SETS[selectedSetId]
  }, [localConfig, selectedSetId])

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
    }, () => {
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isDirty])

  useEffect(() => {
    const proposalsQuery = query(collection(db, 'card_proposals'), orderBy('created_at', 'desc'))

    const unsubscribe = onSnapshot(proposalsQuery, (snapshot) => {
      const items = snapshot.docs.map((proposalDoc) => ({
        id: proposalDoc.id,
        ...(proposalDoc.data() as Omit<CardProposal, 'id'>)
      }))
      setCardProposals(items)
      setProposalsLoading(false)
    }, (error) => {
      console.error('Error loading card proposals:', error)
      setProposalsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const configRef = useRef<SammelkartenConfig | null>(null)
  useEffect(() => {
    configRef.current = localConfig
  }, [localConfig])

  useEffect(() => {
    if (!isDirty) {
      setAutosaveCountdown(null)
      return
    }

    const timer = setTimeout(() => {
      if (configRef.current) {
        performActualSave(configRef.current)
      }
    }, 10000)

    const interval = setInterval(() => {
      setAutosaveCountdown(prev => (prev !== null && prev > 0) ? prev - 1 : 0)
    }, 1000)
    setAutosaveCountdown(10)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [isDirty])

  const sanitizeDataForFirestore = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeDataForFirestore)
    } else if (obj !== null && typeof obj === 'object') {
      const newObj: any = {}
      for (const key of Object.keys(obj)) {
        if (obj[key] !== undefined) {
          newObj[key] = sanitizeDataForFirestore(obj[key])
        }
      }
      return newObj
    }
    return obj
  }

  const performActualSave = async (dataToSave: SammelkartenConfig) => {
    setSaving(true)
    try {
      const sanitized = sanitizeDataForFirestore(dataToSave)
      await updateDoc(doc(db, 'settings', 'sammelkarten'), {
        ...sanitized,
        updated_at: serverTimestamp()
      })
      setIsDirty(false)
      setAutosaveCountdown(null)
      toast.success('Änderungen automatisch gespeichert')
    } catch (error) {
      console.error('Autosave failed:', error)
      toast.error('Automatisches Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfig = useCallback((updatedFields: Partial<SammelkartenConfig>) => {
    setLocalConfig(prev => {
      if (!prev) return null
      
      let newLootTeachers = updatedFields.loot_teachers || prev.loot_teachers;
      if (newLootTeachers) {
        const seen = new Set();
        newLootTeachers = newLootTeachers.filter(t => {
          if (!t.id || seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
      }

      return { ...prev, ...updatedFields, loot_teachers: newLootTeachers }
    })
    setIsDirty(true)
  }, [])

  const handleManualSave = async () => {
    if (!localConfig || !isDirty) return
    await performActualSave(localConfig)
  }

  const handleMigrateToSets = async () => {
    if (!localConfig || !localConfig.loot_teachers || localConfig.loot_teachers.length === 0) return
    if (!confirm('Möchtest du den aktuellen Lehrer-Pool in das neue Set-System (teacher_vol1) migrieren?')) return

    const teachersV1Set: CardSet = {
      id: 'teacher_vol1',
      name: 'Lehrer Set v1',
      prefix: 'T1',
      color: '#3b82f6',
      cards: localConfig.loot_teachers
    }

    const updatedConfig: Partial<SammelkartenConfig> = {
      sets: {
        ...(localConfig.sets || {}),
        'teacher_vol1': teachersV1Set
      },
      loot_teachers: [] // Legacy Pool leeren
    }

    handleSaveConfig(updatedConfig)
    toast.success('Migration in Set-System erfolgreich!')
  }

  const handleAddSet = () => {
    if (!newSetName || !newSetId || !newSetPrefix || !localConfig) return
    
    const newSet: CardSet = {
      id: newSetId.trim(),
      name: newSetName.trim(),
      prefix: newSetPrefix.trim().toUpperCase(),
      color: newSetColor,
      cards: []
    }

    const updatedSets = { ...(localConfig.sets || {}), [newSet.id]: newSet }
    handleSaveConfig({ sets: updatedSets })
    setIsAddingSet(false)
    setNewSetName('')
    setNewSetId('')
    setNewSetPrefix('')
    setSelectedSetId(newSet.id)
    toast.success(`Set "${newSet.name}" erstellt.`)
  }

  const handleRemoveSet = (setId: string) => {
    if (!localConfig || !localConfig.sets?.[setId]) return
    if (!confirm(`Möchtest du das Set "${localConfig.sets[setId].name}" wirklich löschen? Alle Karten in diesem Set gehen verloren!`)) return

    const updatedSets = { ...localConfig.sets }
    delete updatedSets[setId]
    
    handleSaveConfig({ sets: updatedSets })
    if (selectedSetId === setId) {
      const firstId = Object.keys(updatedSets)[0] || ''
      setSelectedSetId(firstId)
    }
    toast.success('Set gelöscht.')
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
    if (!newTeacherName.trim() || !localConfig || !selectedSetId) return
    
    if (!currentSet) {
      toast.error('Kein Set ausgewählt.')
      return
    }

    const normalizedName = restoreGermanUmlauts(newTeacherName.trim())
    const id = generateTeacherId(normalizedName, currentSet.cards.map(t => t.id))
    const newTeacher = normalizeVisibleTeacherText({
      id,
      name: normalizedName,
      rarity: newTeacherRarity
    })
    
    const updatedCards = [...(currentSet.cards || []), newTeacher]
    const updatedSets = {
      ...(localConfig.sets || {}),
      [selectedSetId]: { ...currentSet, cards: updatedCards }
    }
    handleSaveConfig({ sets: updatedSets })
    setNewTeacherName('')
  }

  const handleRemoveTeacher = useCallback(async (teacher: LootTeacher) => {
    if (!confirm(`Möchtest du ${teacher.name} wirklich entfernen?`)) return
    
    setLocalConfig(prev => {
      if (!prev || !selectedSetId || !currentSet) return prev

      const updatedCards = currentSet.cards.filter(t => t.id !== teacher.id)
      return { 
        ...prev, 
        sets: { ...(prev.sets || {}), [selectedSetId]: { ...currentSet, cards: updatedCards } } 
      }
    })
    setIsDirty(true)
  }, [selectedSetId, currentSet])

  const handleEditTeacher = useCallback((teacher: LootTeacher) => {
    setEditingTeacher({ ...teacher })
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdateTeacher = useCallback(async (
    updatedTeacher: LootTeacher,
    options?: { skipRaritySync?: boolean }
  ) => {
    if (!selectedSetId || !currentSet) return

    const oldTeacher = currentSet.cards.find(t => t.id === updatedTeacher.id)
    const rarityChanged = oldTeacher && oldTeacher.rarity !== updatedTeacher.rarity
    const shouldRunRaritySync = Boolean(rarityChanged && !options?.skipRaritySync)

    if (shouldRunRaritySync) {
      if (!confirm(`Du hast die Seltenheit von ${updatedTeacher.name} geändert. \n\nDies wird die Karte aus den Inventaren ALLER Schüler entfernen, aber sie erhalten pro entfernter Karte 1 Booster-Pack als Entschädigung. \n\nFortfahren?`)) {
        return
      }
    }

    setLocalConfig(prev => {
      if (!prev || !selectedSetId || !currentSet) return prev

      const updatedCards = [...currentSet.cards]
      const index = updatedCards.findIndex(t => t.id === updatedTeacher.id)
      if (index !== -1) {
        updatedCards[index] = normalizeVisibleTeacherText(updatedTeacher)
      }
      return { 
        ...prev, 
        sets: { ...(prev.sets || {}), [selectedSetId]: { ...currentSet, cards: updatedCards } } 
      }
    })
    setIsDirty(true)
    setIsEditDialogOpen(false)

    if (shouldRunRaritySync) {
      const rarityChangeFn = httpsCallable<
        { teacherId: string, teacherName: string, setId?: string },
        { success: boolean, usersUpdated: number, totalCompensatedBoosters: number, notificationsCreated?: number }
      >(functions, 'handleTeacherRarityChange')
      
      const toastId = toast.loading(`${updatedTeacher.name} wird aus Inventaren entfernt und Nutzer entschädigt...`)
      
      try {
        const result = await rarityChangeFn({ 
          teacherId: updatedTeacher.id, 
          teacherName: updatedTeacher.name,
          setId: selectedSetId
        })
        
        const { usersUpdated, totalCompensatedBoosters, notificationsCreated } = result.data
        toast.success(
          `Inventare bereinigt: ${usersUpdated} Nutzer erhielten insgesamt ${totalCompensatedBoosters} Booster. Nachrichten erstellt: ${notificationsCreated ?? usersUpdated}.`,
          { id: toastId }
        )
        
        if (user) {
          await logAction('TEACHERS_RARITY_SYNC', user.uid, profile?.full_name, {
            teacherId: updatedTeacher.id,
            teacherName: updatedTeacher.name,
            setId: selectedSetId,
            usersUpdated,
            totalCompensatedBoosters
          })
        }
      } catch (err: any) {
        console.error('Error handling rarity change cleanup:', err)
        toast.error('Fehler bei der Inventar-Bereinigung nach Seltenheitsänderung.', { id: toastId })
      }
    }
  }, [localConfig, user, profile, selectedSetId])

  const runRemoveTeacherFromAlbums = useCallback(async (teacher: LootTeacher, compensate: boolean) => {
    const removeFn = httpsCallable<
      { teacherId: string; dryRun?: boolean; compensate?: boolean },
      {
        success: boolean
        message: string
        stats: {
          usersAffected: number
          cardsRemoved: number
          compensationPacks: number
        }
      }
    >(functions, 'removeTeacherCards')

    const toastId = toast.loading(`Entferne ${teacher.name} aus Alben${compensate ? ' (mit Kompensation)' : ''}...`)

    try {
      const result = await removeFn({ teacherId: teacher.id, dryRun: false, compensate })
      const stats = result.data.stats

      toast.success(
        `Fertig: ${stats.usersAffected} Nutzer, ${stats.cardsRemoved} Karten entfernt${compensate ? `, ${stats.compensationPacks} Booster kompensiert` : ''}.`,
        { id: toastId }
      )

      if (user) {
        await logAction('REMOVE_TEACHER_CARDS', user.uid, profile?.full_name, {
          teacherId: teacher.id,
          teacherName: teacher.name,
          compensate,
          usersAffected: stats.usersAffected,
          cardsRemoved: stats.cardsRemoved,
          compensationPacks: stats.compensationPacks,
        })
      }
    } catch (err: any) {
      console.error('Error removing teacher from albums:', err)
      toast.error(err.message || 'Fehler beim Entfernen aus Alben.', { id: toastId })
      throw err
    }
  }, [user, profile])

  const handleSaveAndRemoveTeacher = useCallback(async (updatedTeacher: LootTeacher, options: { compensate: boolean }) => {
    await handleUpdateTeacher(updatedTeacher, { skipRaritySync: true })
    await runRemoveTeacherFromAlbums(updatedTeacher, options.compensate)
  }, [handleUpdateTeacher, runRemoveTeacherFromAlbums])

  const handleRemoveTeacherOnly = useCallback(async (teacher: LootTeacher, options: { compensate: boolean }) => {
    await runRemoveTeacherFromAlbums(teacher, options.compensate)
  }, [runRemoveTeacherFromAlbums])

  const handleCleanupDuplicates = () => {
    if (!localConfig || !selectedSetId || !currentSet) return

    const teachers = currentSet.cards
    const seenNames = new Map<string, string>() // name -> canonicalId
    const canonicalTeachers: LootTeacher[] = []
    let cleanedCount = 0

    teachers.forEach(t => {
      const nameKey = t.name.toLowerCase().trim()
      if (seenNames.has(nameKey)) {
        cleanedCount++
        return
      }
      seenNames.set(nameKey, t.id)
      canonicalTeachers.push(t)
    })

    if (cleanedCount > 0) {
      const updatedSets = { ...(localConfig.sets || {}), [selectedSetId]: { ...currentSet, cards: canonicalTeachers } }
      handleSaveConfig({ sets: updatedSets })
      toast.success(`${cleanedCount} Duplikate (nach Name) entfernt.`)
      
      if (user) {
        logAction('CLEANUP_POOL', user.uid, profile?.full_name, {
          cleanedCount,
          setId: selectedSetId
        })
      }
    } else {
      toast.info('Keine Namensduplikate gefunden.')
    }
  }

  const handleCleanupInventory = async () => {
    if (!confirm('Möchtest du wirklich alle Inventare von Lehrern bereinigen, die nicht mehr existieren? Dies kann einen Moment dauern.')) return

    setIsCleaningInventory(true)
    const cleanupFn = httpsCallable<void, { success: boolean, usersProcessed: number, usersUpdated: number, cardsRemoved: number }>(functions, 'cleanupNonExistentTeachers')
    
    try {
      const result = await cleanupFn()
      const { usersUpdated, cardsRemoved } = result.data
      toast.success(`Bereinigung abgeschlossen! ${usersUpdated} Inventare aktualisiert, ${cardsRemoved} ungültige Karten entfernt.`)
      
      if (user) {
        await logAction('CLEANUP_INVENTORIES', user.uid, profile?.full_name, {
          usersUpdated,
          cardsRemoved
        })
      }
    } catch (err: any) {
      console.error('Error cleaning up inventories:', err)
      toast.error(err.message || 'Fehler bei der Bereinigung der Inventare.')
    } finally {
      setIsCleaningInventory(false)
    }
  }

  const handleSyncOpenedPacksToInventory = async () => {
    if (!confirm('Packs geöffnet mit Inventar synchronisieren? Formel: ceil(Anzahl Karten / 3).')) return

    setIsSyncingOpenedPacks(true)
    const syncFn = httpsCallable<void, { success: boolean; stats: { usersChecked: number; usersUpdated: number } }>(
      functions,
      'syncOpenedPacksToInventory'
    )

    try {
      const result = await syncFn()
      const { usersChecked, usersUpdated } = result.data.stats
      toast.success(`Pack-Sync fertig: ${usersUpdated}/${usersChecked} Profile aktualisiert.`)

      if (user) {
        await logAction('SYNC_OPENED_PACKS_TO_INVENTORY', user.uid, profile?.full_name, {
          usersChecked,
          usersUpdated,
        })
      }
    } catch (err: any) {
      console.error('Error syncing opened packs:', err)
      toast.error(err.message || 'Fehler beim Pack-Sync.')
    } finally {
      setIsSyncingOpenedPacks(false)
    }
  }

  const handleCleanupLegacyTeachersVoted = async () => {
    if (!confirm('Legacy-Felder teachers_voted / rated_teachers aus Profilen entfernen?')) return

    setIsCleaningLegacyVotes(true)
    const cleanupFn = httpsCallable<void, {
      success: boolean;
      stats: {
        usersChecked: number;
        usersUpdated: number;
        removedTeachersVoted?: number;
        removedRatedTeachers?: number;
      }
    }>(
      functions,
      'cleanupLegacyTeachersVoted'
    )

    try {
      const result = await cleanupFn()
      const { usersChecked, usersUpdated, removedTeachersVoted = 0, removedRatedTeachers = 0 } = result.data.stats
      toast.success(
        `Legacy-Cleanup fertig: ${usersUpdated}/${usersChecked} Profile bereinigt (teachers_voted: ${removedTeachersVoted}, rated_teachers: ${removedRatedTeachers}).`
      )

      if (user) {
        await logAction('CLEANUP_LEGACY_TEACHERS_VOTED', user.uid, profile?.full_name, {
          usersChecked,
          usersUpdated,
          removedTeachersVoted,
          removedRatedTeachers,
        })
      }
    } catch (err: any) {
      console.error('Error cleaning legacy teachers_voted:', err)
      toast.error(err.message || 'Fehler beim Legacy-Cleanup.')
    } finally {
      setIsCleaningLegacyVotes(false)
    }
  }

  const handleGlobalSync = async () => {
    if (!confirm('Dies startet eine globale Synchronisierung aller Nutzer-Inventare basierend auf den aktuellen Seltenheits-Limits pro Nutzer. Nutzer, die Karten verlieren, erhalten EINE einmalige Entschädigung. Dieser Vorgang kann nicht rückgängig gemacht werden. Fortfahren?')) return

    setIsSyncing(true)
    const syncFn = httpsCallable<void, { success: boolean, message: string }>(functions, 'runGlobalRaritySync')
    const toastId = toast.loading('Starte globale Inventar-Synchronisierung...')

    try {
      const result = await syncFn()
      toast.success('Synchronisierung erfolgreich!', {
        id: toastId,
        description: result.data.message,
      })

      if (user) {
        await logAction('GLOBAL_RARITY_SYNC_TRIGGERED', user.uid, profile?.full_name, {
          result: result.data.message
        })
      }
    } catch (err: any) {
      console.error('Error running global sync:', err)
      toast.error(err.message || 'Fehler bei der globalen Synchronisierung.', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  const buildDryRunNotifications = useCallback((details: RarityFixDetail[]): PreviewNotification[] => {
    if (!localConfig) return []

    const teacherNameById = new Map<string, string>()
    if (localConfig.loot_teachers) {
      localConfig.loot_teachers.forEach(t => teacherNameById.set(t.id, t.name))
    }
    if (localConfig.sets) {
      Object.values(localConfig.sets).forEach(set => {
        set.cards.forEach(t => teacherNameById.set(t.id, t.name))
      })
    }
    const groupedByUser = new Map<string, PreviewNotification>()

    details.forEach((detail) => {
      const existing = groupedByUser.get(detail.userId)
      const teacherName = teacherNameById.get(detail.teacherId) || detail.teacherId
      const removedCard = {
        teacherId: detail.teacherId,
        teacherName,
        rarity: detail.rarity || 'unknown',
        variants: detail.variants || {},
        totalRemoved: detail.cardsRemoved,
        duplicates: detail.duplicates,
        compensationPacks: detail.compensationPacks,
      }

      if (!existing) {
        groupedByUser.set(detail.userId, {
          userId: detail.userId,
          totalCardsRemoved: detail.cardsRemoved,
          totalCompensation: 0,
          removedCards: [removedCard],
        })
        return
      }

      existing.totalCardsRemoved += detail.cardsRemoved
      existing.removedCards.push(removedCard)
    })

    return Array.from(groupedByUser.values()).map((entry) => ({
      ...entry,
      totalCompensation: Math.ceil(entry.totalCardsRemoved / 3),
    }))
  }, [localConfig])

  const hydrateUserNames = useCallback(async (notifications: PreviewNotification[]) => {
    const missingUserIds = notifications
      .map((entry) => entry.userId)
      .filter((userId) => !userNameCache[userId])

    if (missingUserIds.length === 0) {
      return notifications.map((entry) => ({
        ...entry,
        userName: userNameCache[entry.userId],
      }))
    }

    const resolvedEntries = await Promise.all(missingUserIds.map(async (userId) => {
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', userId))
        if (!profileSnap.exists()) return [userId, userId] as const

        const data = profileSnap.data() as { full_name?: string; email?: string }
        return [userId, data.full_name || data.email || userId] as const
      } catch {
        return [userId, userId] as const
      }
    }))

    const nextCache = resolvedEntries.reduce<Record<string, string>>((acc, [userId, userName]) => {
      acc[userId] = userName
      return acc
    }, {})

    setUserNameCache((prev) => ({ ...prev, ...nextCache }))

    return notifications.map((entry) => ({
      ...entry,
      userName: nextCache[entry.userId] || userNameCache[entry.userId] || entry.userId,
    }))
  }, [userNameCache])

  const handleRemoveAllMismatches = useCallback(async () => {
    if (isDryRunning || isSyncing) return

    setIsDryRunning(true)
    setPendingDryRunAction('validate_rarities')

    try {
      const dryRunFn = httpsCallable<{ dryRun: boolean }, {
        success: boolean
        dryRun: boolean
        stats: { details: RarityFixDetail[] }
      }>(functions, 'validateAndFixRarities')

      const result = await dryRunFn({ dryRun: true })
      const details = result.data.stats?.details || []

      if (details.length === 0) {
        setPendingDryRunAction(null)
        toast.success('Keine Rarity-Mismatches gefunden.')
        return
      }

      const notifications = buildDryRunNotifications(details)
      const notificationsWithNames = await hydrateUserNames(notifications)
      setDryRunPreview({
        notifications: notificationsWithNames,
        details,
      })
      setShowDryRunDialog(true)
    } catch (error) {
      console.error('Error checking rarity mismatches:', error)
      toast.error('Dry-Run fehlgeschlagen. Bitte erneut versuchen.')
      setPendingDryRunAction(null)
    } finally {
      setIsDryRunning(false)
    }
  }, [buildDryRunNotifications, hydrateUserNames, isDryRunning, isSyncing])

  const handleConfirmDryRun = useCallback(async (selectedUserIds: string[]) => {
    if (pendingDryRunAction !== 'validate_rarities') {
      setShowDryRunDialog(false)
      return
    }

    if (!selectedUserIds || selectedUserIds.length === 0) {
      toast.info('Keine Nutzer ausgewählt.')
      return
    }

    setIsSyncing(true)
    const runToastId = toast.loading('Reparatur wird ausgeführt...')

    try {
      const executeFn = httpsCallable<{ dryRun: boolean; targetUserIds?: string[] }, {
        success: boolean
        stats: {
          usersAffected: number
          cardsRemoved: number
          compensationPacks: number
        }
      }>(functions, 'validateAndFixRarities')

      const result = await executeFn({ dryRun: false, targetUserIds: selectedUserIds })
      const stats = result.data.stats

      toast.success(
        `Reparatur abgeschlossen: ${stats.usersAffected} Nutzer, ${stats.cardsRemoved} Karten entfernt, ${stats.compensationPacks} Booster vergeben.`,
        { id: runToastId }
      )

      if (user) {
        await logAction('VALIDATE_AND_FIX_RARITIES', user.uid, profile?.full_name, {
          selectedUsers: selectedUserIds.length,
          usersAffected: stats.usersAffected,
          cardsRemoved: stats.cardsRemoved,
          compensationPacks: stats.compensationPacks,
        })
      }

      setShowDryRunDialog(false)
      setDryRunPreview(null)
      setPendingDryRunAction(null)
    } catch (error) {
      console.error('Error fixing rarity mismatches:', error)
      toast.error('Reparatur fehlgeschlagen.', { id: runToastId })
    } finally {
      setIsSyncing(false)
    }
  }, [pendingDryRunAction, user, profile])

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '')
        if (rows.length < 2) {
          toast.error("Die CSV-Datei scheint leer zu sein oder hat keine Kopfzeile.")
          return
        }

        // Robust CSV row parser that handles quotes and escaped characters
        const parseCSVRow = (row: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"' && inQuotes && row[i+1] === '"') {
              current += '"';
              i++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const headers = parseCSVRow(rows[0]).map(h => h.trim().toLowerCase())
        const nameIdx = headers.indexOf('name')
        const rarityIdx = headers.indexOf('rarity') === -1 ? headers.indexOf('seltenheit') : headers.indexOf('rarity')
        const hpIdx = headers.indexOf('hp')
        const descIdx = headers.indexOf('description') === -1 ? headers.indexOf('beschreibung') : headers.indexOf('description')
        const attacksIdx = headers.indexOf('attacks') === -1 ? headers.indexOf('attacken') : headers.indexOf('attacks')
        const idIdx = headers.indexOf('id')
        
        if (nameIdx === -1) {
          toast.error("Kopfzeile 'name' nicht gefunden. Bitte nutze 'name,rarity,hp,description,attacks' (optional).")
          return
        }

        const newTeachers: LootTeacher[] = []
        const currentSet = localConfig?.sets?.[selectedSetId]
        const existingIds = currentSet?.cards.map(t => t.id) || []
        const currentBatchIds: string[] = []

        for (let i = 1; i < rows.length; i++) {
          const cols = parseCSVRow(rows[i]).map(c => c.trim())
          const name = restoreGermanUmlauts(cols[nameIdx])
          if (!name) continue

          const rarity = (cols[rarityIdx] as TeacherRarity) || 'common'
          const hp = hpIdx !== -1 ? parseInt(cols[hpIdx]) : undefined
          const description = descIdx !== -1 ? restoreGermanUmlauts(cols[descIdx]) : undefined
          let attacks: any[] | undefined = undefined;
          
          if (attacksIdx !== -1 && cols[attacksIdx]) {
            try {
              // Handle both JSON string and potential double-escaped strings
              const rawAttacks = cols[attacksIdx].startsWith('[') ? cols[attacksIdx] : cols[attacksIdx].replace(/^"|"$/g, '').replace(/""/g, '"');
              const parsedAttacks = JSON.parse(rawAttacks);
              if (Array.isArray(parsedAttacks)) {
                attacks = parsedAttacks.map((attack) => ({
                  ...attack,
                  name: typeof attack?.name === 'string' ? restoreGermanUmlauts(attack.name) : attack?.name,
                  description: typeof attack?.description === 'string' ? restoreGermanUmlauts(attack.description) : attack?.description,
                }));
              }
            } catch (e) {
              console.warn("Failed to parse attacks for", name, e);
            }
          }
          
          const id = (idIdx !== -1 && cols[idIdx]) 
            ? cols[idIdx] 
            : generateTeacherId(name, [...existingIds, ...currentBatchIds])
          
          newTeachers.push(normalizeVisibleTeacherText({
            id,
            name,
            rarity: ['common', 'rare', 'epic', 'mythic', 'legendary', 'iconic'].includes(rarity) ? rarity : 'common',
            hp: isNaN(hp as any) ? undefined : hp,
            description,
            attacks
          }))
          currentBatchIds.push(id)
        }

        setParsedTeachers(newTeachers)
        setIsImportDialogOpen(true)
      } catch (err) {
        console.error("Error parsing CSV:", err)
        toast.error("Fehler beim Parsen der CSV-Datei.")
      }
    }
    reader.readAsText(file)
    if (e.target) e.target.value = ''
  }

  const handleExportCSV = () => {
    const currentSet = localConfig?.sets?.[selectedSetId]
    if (!currentSet?.cards || currentSet.cards.length === 0) {
      toast.error("Keine Lehrer in diesem Set zum Exportieren vorhanden.")
      return
    }

    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    try {
      const headers = ['id', 'name', 'rarity', 'hp', 'description', 'attacks']
      const rows = currentSet.cards.map(t => [
        csvEscape(t.id),
        csvEscape(t.name),
        csvEscape(t.rarity),
        csvEscape(t.hp),
        csvEscape(t.description),
        csvEscape(t.attacks)
      ].join(','))

      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${currentSet.id}_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`${currentSet.cards.length} Lehrer aus Set "${currentSet.name}" als CSV exportiert!`)
    } catch (err) {
      console.error("Error exporting CSV:", err)
      toast.error("Fehler beim Exportieren der CSV-Datei.")
    }
  }

  const handleExportJSON = () => {
    const currentSet = localConfig?.sets?.[selectedSetId]
    if (!currentSet?.cards || currentSet.cards.length === 0) {
      toast.error("Keine Lehrer in diesem Set zum Exportieren vorhanden.")
      return
    }

    try {
      const data = JSON.stringify(currentSet.cards, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${currentSet.id}_backup_${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`JSON Backup für Set "${currentSet.name}" erstellt!`)
    } catch (err) {
      console.error("Error exporting JSON:", err)
      toast.error("Fehler beim Exportieren der JSON-Datei.")
    }
  }

  const handleBulkImport = async (mode: 'merge' | 'overwrite') => {
    if (!localConfig || !selectedSetId || importing) return
    const currentSet = localConfig.sets?.[selectedSetId]
    if (!currentSet) return
    
    setImporting(true)
    try {
      let finalCards = mode === 'overwrite' ? [] : [...currentSet.cards]
      
      let addedCount = 0
      let updatedCount = 0

      for (const t of parsedTeachers) {
        const existingIdx = finalCards.findIndex(lt => lt.id === t.id)
        if (existingIdx !== -1) {
          finalCards[existingIdx] = { ...finalCards[existingIdx], ...t }
          updatedCount++
        } else {
          finalCards.push(t)
          addedCount++
        }
      }
      
      const seen = new Set()
      finalCards = finalCards.filter(t => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })

      const updatedSets = {
        ...localConfig.sets,
        [selectedSetId]: { ...currentSet, cards: finalCards }
      }
      handleSaveConfig({ sets: updatedSets })
      setIsImportDialogOpen(false)
      
      toast.success(`${addedCount} neue Lehrer in Set "${currentSet.name}" importiert, ${updatedCount} aktualisiert!`)
      
      if (user) {
        await logAction('CARDS_BULK_IMPORT', user.uid, profile?.full_name, {
          mode,
          setId: selectedSetId,
          added: addedCount,
          updated: updatedCount
        })
      }
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
        rarityCounts: { common: 0, rare: 0, epic: 0, mythic: 0, legendary: 0, iconic: 0 } as Record<TeacherRarity, number>,
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

  const filteredTeachers = useMemo(() => {
    const teachers = [...(currentSet?.cards || [])].filter(t => 
      t.name.toLowerCase().includes(teacherSearch.toLowerCase())
    )

    return teachers.sort((a, b) => {
      if (teacherSort === 'name-asc') return a.name.localeCompare(b.name)
      if (teacherSort === 'name-desc') return b.name.localeCompare(a.name)

      const rA = RARITY_ORDER.indexOf(a.rarity)
      const rB = RARITY_ORDER.indexOf(b.rarity)

      if (teacherSort === 'rarity-asc') return rA - rB
      if (teacherSort === 'rarity-desc') return rB - rA

      return 0
    })
  }, [currentSet, teacherSearch, teacherSort])
  const rarityDistribution = useMemo(() => {
    if (!currentSet) return {}

    const dist: Record<string, number> = {}
    currentSet.cards.forEach(t => {
      dist[t.rarity] = (dist[t.rarity] || 0) + 1
    })
    return dist
  }, [currentSet])

  const proposalStatusCounts = useMemo(() => {
    return cardProposals.reduce((acc, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1
      return acc
    }, { pending: 0, accepted: 0, rejected: 0 } as Record<'pending' | 'accepted' | 'rejected', number>)
  }, [cardProposals])

  const rarityChartData = useMemo<ChartData<'doughnut', number[], string> | null>(() => {
    if (!currentSet || currentSet.cards.length === 0) return null

    const labels = RARITY_ORDER.map((rarity) => getRarityLabel(rarity))
    const values = RARITY_ORDER.map((rarity) => rarityDistribution[rarity] || 0)

    return {
      labels,
      datasets: [
        {
          label: 'Karten',
          data: values,
          backgroundColor: RARITY_ORDER.map((rarity) => RARITY_CHART_COLORS[rarity]),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }
  }, [currentSet, rarityDistribution])

  const proposalStatusChartData = useMemo<ChartData<'bar', number[], string>>(() => ({
    labels: ['Offen', 'Angenommen', 'Abgelehnt'],
    datasets: [
      {
        label: 'Vorschläge',
        data: [proposalStatusCounts.pending, proposalStatusCounts.accepted, proposalStatusCounts.rejected],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }), [proposalStatusCounts])

  const simRarityChartData = useMemo<ChartData<'bar', number[], string> | null>(() => {
    if (!simResults) return null

    return {
      labels: RARITY_ORDER.map((rarity) => getRarityLabel(rarity)),
      datasets: [
        {
          label: 'Getroffene Karten',
          data: RARITY_ORDER.map((rarity) => simResults.rarityCounts[rarity] || 0),
          backgroundColor: RARITY_ORDER.map((rarity) => RARITY_CHART_COLORS[rarity]),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }, [simResults])

  const simVariantChartData = useMemo<ChartData<'bar', number[], string> | null>(() => {
    if (!simResults) return null

    const variantOrder = ['normal', 'holo', 'shiny', 'black_shiny_holo']
    const labels = variantOrder.map((variant) => variant.replace(/_/g, ' '))
    const values = variantOrder.map((variant) => simResults.variantCounts[variant] || 0)

    return {
      labels,
      datasets: [
        {
          label: 'Varianten',
          data: values,
          backgroundColor: variantOrder.map((variant) => VARIANT_CHART_COLORS[variant]),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }, [simResults])

  const baseBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        displayColors: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 116, 139, 0.15)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
    },
  }

  const proposalStatusChartOptions = useMemo<ChartOptions<'bar'>>(() => ({
    ...baseBarOptions,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 116, 139, 0.15)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
    },
  }), [])

  const simulationBarOptions = useMemo<ChartOptions<'bar'>>(() => ({
    ...baseBarOptions,
    indexAxis: 'y',
  }), [])

  const rarityChartOptions = useMemo<ChartOptions<'doughnut'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748b',
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: {
            size: 10,
            weight: 600,
          },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      },
    },
  }), [])

  const getProposalStatusBadge = (status: CardProposal['status']) => {
    if (status === 'accepted') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Angenommen</Badge>
    if (status === 'rejected') return <Badge variant="destructive">Abgelehnt</Badge>
    return <Badge variant="secondary">Offen</Badge>
  }

  const getProposalUsageBadge = (usageStatus?: ProposalUsageStatus) => {
    if (usageStatus === 'used') {
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Genutzt</Badge>
    }
    if (usageStatus === 'not_used') {
      return <Badge variant="outline">Nicht genutzt</Badge>
    }
    if (usageStatus === 'unknown') {
      return <Badge variant="outline">Unbekannt (Altfall)</Badge>
    }
    return null
  }

  const buildProposalDraft = (proposal: CardProposal): ProposalEditDraft => {
    const normalizedAttacks = (proposal.attacks || [])
      .slice(0, 2)
      .map((attack) => ({
        name: attack.name || '',
        damage: Number.isFinite(Number(attack.damage)) ? Number(attack.damage) : 0,
        description: attack.description || '',
      }))

    if (normalizedAttacks.length === 0) {
      normalizedAttacks.push({ name: '', damage: 0, description: '' })
    }

    return {
      teacher_name: proposal.teacher_name || '',
      hp: Number.isFinite(Number(proposal.hp)) ? Number(proposal.hp) : 60,
      description: proposal.description || '',
      attacks: normalizedAttacks,
    }
  }

  const updateProposalAttackDraft = (index: number, field: keyof TeacherAttack, value: string | number) => {
    setProposalEditDraft((prev) => {
      if (!prev) return prev
      const nextAttacks = [...prev.attacks]
      const existing = nextAttacks[index] || { name: '', damage: 0, description: '' }
      nextAttacks[index] = {
        ...existing,
        [field]: value,
      }

      return {
        ...prev,
        attacks: nextAttacks,
      }
    })
  }

  const openAcceptProposalDialog = (proposal: CardProposal) => {
    setProposalInDialog(proposal)
    setProposalEditDraft(buildProposalDraft(proposal))
    setProposalUsageStatusDraft('used')
    setProposalAdminNoteDraft(proposal.admin_note || '')
    setProposalModerationDialogOpen(true)
  }

  const resetProposalModerationDialog = () => {
    setProposalModerationDialogOpen(false)
    setProposalInDialog(null)
    setProposalEditDraft(null)
    setProposalUsageStatusDraft('used')
    setProposalAdminNoteDraft('')
  }

  const handleModerateProposal = async (proposal: CardProposal, action: 'accept' | 'reject') => {
    if (!user) return

    if (action === 'accept') {
      openAcceptProposalDialog(proposal)
      return
    }

    const shouldContinue = confirm(`Vorschlag von ${proposal.created_by_name} ablehnen?`)
    if (!shouldContinue) return

    const adminNote = window.prompt('Ablehnungsgrund / Notiz (optional):', proposal.admin_note || '')
    if (adminNote === null) return

    setModeratingProposalId(proposal.id)
    try {
      const moderateFn = httpsCallable<{
        proposalId: string
        action: 'accept' | 'reject'
        adminNote?: string
        rewardPacks?: number
        usageStatus?: 'used' | 'not_used'
        editedProposal?: ProposalEditDraft
      }, {
        success: boolean
        status: 'accepted' | 'rejected'
        usageStatus: ProposalUsageStatus
        rewardGranted: number
      }>(functions, 'moderateCardProposal')

      const result = await moderateFn({
        proposalId: proposal.id,
        action,
        adminNote,
        rewardPacks: 0,
        usageStatus: 'not_used',
      })

      toast.success('Vorschlag abgelehnt.')

      await logAction('CARDS_SETTINGS_UPDATED', user.uid, profile?.full_name, {
        section: 'card_proposals',
        proposal_id: proposal.id,
        moderation_action: action,
        reward_granted: result.data.rewardGranted,
      })
    } catch (error: any) {
      console.error('Error moderating proposal:', error)
      toast.error(error?.message || 'Fehler bei der Moderation des Vorschlags.')
    } finally {
      setModeratingProposalId(null)
    }
  }

  const handleAcceptProposalFromDialog = async () => {
    if (!user || !proposalInDialog || !proposalEditDraft) return

    const cleanedAttacks = proposalEditDraft.attacks
      .slice(0, 2)
      .map((attack) => ({
        name: (attack.name || '').trim(),
        damage: Number.isFinite(Number(attack.damage)) ? Number(attack.damage) : 0,
        description: (attack.description || '').trim(),
      }))
      .filter((attack) => attack.name.length > 0)

    if (proposalEditDraft.teacher_name.trim().length < 2) {
      toast.error('Lehrername ist zu kurz.')
      return
    }

    if (cleanedAttacks.length < 1) {
      toast.error('Mindestens ein Angriff mit Name ist erforderlich.')
      return
    }

    const rewardPacks = proposalUsageStatusDraft === 'used' ? 2 : 0
    setModeratingProposalId(proposalInDialog.id)

    try {
      const moderateFn = httpsCallable<{
        proposalId: string
        action: 'accept' | 'reject'
        adminNote?: string
        rewardPacks?: number
        usageStatus?: 'used' | 'not_used'
        editedProposal?: ProposalEditDraft
      }, {
        success: boolean
        status: 'accepted' | 'rejected'
        usageStatus: ProposalUsageStatus
        rewardGranted: number
      }>(functions, 'moderateCardProposal')

      const result = await moderateFn({
        proposalId: proposalInDialog.id,
        action: 'accept',
        adminNote: proposalAdminNoteDraft,
        rewardPacks,
        usageStatus: proposalUsageStatusDraft,
        editedProposal: {
          teacher_name: proposalEditDraft.teacher_name.trim(),
          hp: Math.max(10, Math.min(300, Math.round(Number(proposalEditDraft.hp) || 60))),
          description: proposalEditDraft.description,
          attacks: cleanedAttacks,
        },
      })

      toast.success(
        result.data.rewardGranted > 0
          ? `Vorschlag angenommen und genutzt. Belohnung: ${result.data.rewardGranted} Booster.`
          : 'Vorschlag angenommen (nicht genutzt, keine Booster).'
      )

      await logAction('CARDS_SETTINGS_UPDATED', user.uid, profile?.full_name, {
        section: 'card_proposals',
        proposal_id: proposalInDialog.id,
        moderation_action: 'accept',
        usage_status: proposalUsageStatusDraft,
        reward_granted: result.data.rewardGranted,
      })

      resetProposalModerationDialog()
    } catch (error: any) {
      console.error('Error moderating proposal:', error)
      toast.error(error?.message || 'Fehler bei der Moderation des Vorschlags.')
    } finally {
      setModeratingProposalId(null)
    }
  }

  const handleBackfillProposalUsage = async () => {
    if (!user) return
    setBackfillingProposalUsage(true)
    try {
      const backfillFn = httpsCallable<void, { success: boolean; updated: number }>(
        functions,
        'backfillCardProposalUsageStatus'
      )
      const result = await backfillFn()
      toast.success(`Altfaelle aktualisiert: ${result.data.updated} Vorschlaege.`)
    } catch (error: any) {
      console.error('Error backfilling card proposals:', error)
      toast.error(error?.message || 'Backfill konnte nicht ausgefuehrt werden.')
    } finally {
      setBackfillingProposalUsage(false)
    }
  }

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
                <div className="overflow-x-auto">
                  <TabsList className="w-fit bg-muted/50 p-1 rounded-xl border border-border/60 inline-flex">
                    <TabsTrigger value="teachers" className="px-3 sm:px-4 py-1.5 text-xs gap-2 transition-all shrink-0">
                      <Users className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Lehrerpool</span>
                      <span className="sm:hidden">Pool</span>
                    </TabsTrigger>
                    <TabsTrigger value="weights" className="px-3 sm:px-4 py-1.5 text-xs gap-2 transition-all shrink-0">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Drop-Rates</span>
                      <span className="sm:hidden">Rates</span>
                    </TabsTrigger>
                    <TabsTrigger value="limits" className="px-3 sm:px-4 py-1.5 text-xs gap-2 transition-all shrink-0">
                      <Settings2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Parameter</span>
                      <span className="sm:hidden">Param</span>
                    </TabsTrigger>
                    <TabsTrigger value="proposals" className="px-3 sm:px-4 py-1.5 text-xs gap-2 transition-all shrink-0">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ideen-Labor</span>
                      <span className="sm:hidden">Labor</span>
                    </TabsTrigger>
                    <TabsTrigger value="trading" className="px-3 sm:px-4 py-1.5 text-xs gap-2 transition-all shrink-0">
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Trading</span>
                      <span className="sm:hidden">Trade</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="teachers" className="mt-6">
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
                          <ArrowLeftRight className="h-4 w-4" /> Migration (Legacy)
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
                            {/* Essential buttons visible on all sizes */}
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
                            {/* Hidden admin tools section on mobile */}
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
                            {/* Desktop version - all visible */}
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
                            <Button variant="outline" size="sm" onClick={handleExportCSV}>
                              <TrendingUp className="h-3.5 w-3.5 rotate-90 mr-2" />
                              Full CSV Export
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportJSON}>
                              <RefreshCw className="h-3.5 w-3.5 mr-2" />
                              JSON Backup
                            </Button>
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
                            <Badge variant="secondary">
                              {currentSet?.cards.length || 0} Karten
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
                              <option value="iconic">Ikonisch</option>
                            </select>
                          </div>
                          <Button onClick={handleAddTeacher} disabled={!newTeacherName.trim()}>
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
                          <Activity className="h-4 w-4 text-emerald-500" />
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
                                style={{ width: `${((rarityDistribution[rarity] || 0) / (localConfig.sets?.[selectedSetId]?.cards.length || 1)) * 100}%` }}
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
                          {RARITY_ORDER.map((rarity) => {
                            const weight = slot[rarity] ?? 0
                            return (
                              <div key={rarity} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                  <span className={getRarityColor(rarity)}>{getRarityLabel(rarity)}</span>
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
                            )
                          })}
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
                          {RARITY_ORDER.map((rarity) => {
                            const weight = slot[rarity] ?? 0
                            return (
                              <div key={rarity} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                  <span className={getRarityColor(rarity)}>{getRarityLabel(rarity)}</span>
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
                            )
                          })}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="limits" className="mt-6 space-y-6">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
                   </div>
                </TabsContent>

                <TabsContent value="proposals" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Ideen-Labor Vorschlaege
                          </CardTitle>
                          <CardDescription>
                            Eingereichte Kartenvorschlaege aus dem Ideen-Labor (Collection: card_proposals).
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Offen: {proposalStatusCounts.pending}</Badge>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Angenommen: {proposalStatusCounts.accepted}</Badge>
                          <Badge variant="destructive">Abgelehnt: {proposalStatusCounts.rejected}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleBackfillProposalUsage}
                            disabled={backfillingProposalUsage}
                            className="h-7 text-[11px]"
                          >
                            {backfillingProposalUsage ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Altfaelle backfill'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {proposalsLoading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground gap-3">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Lade Vorschlaege...</span>
                        </div>
                      ) : cardProposals.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic border rounded-lg bg-muted/20">
                          Noch keine Vorschlaege vorhanden.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {cardProposals.map((proposal) => (
                            <Card key={proposal.id} className="border-border/70">
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-bold text-sm">{proposal.teacher_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      von {proposal.created_by_name || 'Unbekannt'} • {new Date(proposal.created_at).toLocaleDateString('de-DE')}
                                    </p>
                                    {proposal.status !== 'pending' && (
                                      <p className="text-[11px] text-muted-foreground mt-1">
                                        Belohnung: {proposal.reward_packs_awarded ?? (proposal.reward_claimed ? 2 : 0)} Booster
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getProposalStatusBadge(proposal.status)}
                                    {getProposalUsageBadge(proposal.usage_status)}
                                    <Badge variant="outline">HP {proposal.hp}</Badge>
                                    {proposal.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-[11px]"
                                          onClick={() => handleModerateProposal(proposal, 'reject')}
                                          disabled={moderatingProposalId === proposal.id}
                                        >
                                          {moderatingProposalId === proposal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ablehnen'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-7 text-[11px]"
                                          onClick={() => handleModerateProposal(proposal, 'accept')}
                                          disabled={moderatingProposalId === proposal.id}
                                        >
                                          {moderatingProposalId === proposal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Pruefen & annehmen'}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {proposal.description && (
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {proposal.description}
                                  </p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {(proposal.attacks || []).slice(0, 2).map((attack, idx) => (
                                    <div key={`${proposal.id}-attack-${idx}`} className="rounded-md border bg-muted/20 p-2">
                                      <p className="text-xs font-bold uppercase tracking-wide">
                                        {attack.name || `Angriff ${idx + 1}`}
                                        {attack.damage !== undefined ? ` • ${attack.damage} DMG` : ''}
                                      </p>
                                      {attack.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{attack.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {proposal.admin_note && (
                                  <div className="rounded-md border border-primary/20 bg-primary/5 p-2">
                                    <p className="text-xs font-semibold text-primary">Admin-Notiz</p>
                                    <p className="text-xs mt-1 whitespace-pre-wrap">{proposal.admin_note}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="trading" className="mt-6">
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
                          <p className="text-sm text-muted-foreground">Wenn deaktiviert, ist das Tausch-Zentrum für Nutzer komplett unsichtbar.</p>
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
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Pack Simulator */}
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

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
                          <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest">Simulation: Seltenheiten</h5>
                            <p className="text-[11px] text-muted-foreground">Welche Seltenheiten im Testlauf gezogen wurden.</p>
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
                            <p className="text-[11px] text-muted-foreground">Verteilung der Varianten im Simulationsergebnis.</p>
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
          </div>
        )}

        {/* Edit Dialog */}
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
                Finalisiere die Karte manuell. Die Belohnung wird nur vergeben, wenn du "Genutzt" auswaehlst.
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
                    importMode === 'overwrite' ? "border-destructive bg-destructive/5" : "border-border hover:border-destructive/50"
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
                        {t.hp && <span className="text-muted-foreground">HP: {t.hp}</span>}
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
        {/* Notification Preview Dialog */}
        <NotificationPreviewDialog
          open={showDryRunDialog}
          onOpenChange={setShowDryRunDialog}
          notifications={dryRunPreview?.notifications || []}
          isLoading={isSyncing}
          onConfirm={handleConfirmDryRun}
          actionType="validate_rarities"
        />

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
    </AdminGuard>
  )
}
