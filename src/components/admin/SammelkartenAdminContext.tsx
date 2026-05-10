'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { db, functions } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, setDoc, getDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { TeacherRarity, LootTeacher, CardProposal, TeacherAttack } from '@/types/database'
import { SammelkartenConfig, CardSet, CardConfig } from '@/types/cards'
import { CARD_SETS } from '@/constants/cardRegistry'
import { restoreGermanUmlauts } from '@/lib/utils'
import { usePopupManager } from '@/modules/popup/usePopupManager'

type ProposalUsageStatus = 'unknown' | 'used' | 'not_used'

interface ProposalEditDraft {
  teacher_name: string
  hp: number
  description: string
  attacks: TeacherAttack[]
}

interface SammelkartenAdminContextType {
  // Config & State
  localConfig: SammelkartenConfig | null
  loading: boolean
  saving: boolean
  isDirty: boolean
  autosaveCountdown: number | null
  
  // Sets
  selectedSetId: string
  setSelectedSetId: (id: string) => void
  availableSets: CardSet[]
  currentSet: CardSet | undefined
  isAddingSet: boolean
  setIsAddingSet: (val: boolean) => void
  newSetName: string
  setNewSetName: (val: string) => void
  newSetId: string
  setNewSetId: (val: string) => void
  newSetPrefix: string
  setNewSetPrefix: (val: string) => void
  newSetColor: string
  setNewSetColor: (val: string) => void
  handleAddSet: () => void
  handleRemoveSet: (id: string) => void
  handleMigrateToSets: () => void

  // Teachers
  newTeacherName: string
  setNewTeacherName: (val: string) => void
  newTeacherRarity: TeacherRarity
  setNewTeacherRarity: (val: TeacherRarity) => void
  teacherSearch: string
  setTeacherSearch: (val: string) => void
  teacherSort: 'name-asc' | 'name-desc' | 'rarity-asc' | 'rarity-desc'
  setTeacherSort: (val: 'name-asc' | 'name-desc' | 'rarity-asc' | 'rarity-desc') => void
  filteredTeachers: CardConfig[]
  rarityDistribution: Record<string, number>
  handleAddTeacher: () => void
  handleRemoveTeacher: (teacher: CardConfig) => Promise<void>
  handleEditTeacher: (teacher: CardConfig) => void
  handleUpdateTeacher: (updatedTeacher: CardConfig, options?: { skipRaritySync?: boolean }) => Promise<void>
  
  // Teacher Edit Dialog
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (val: boolean) => void
  editingTeacher: CardConfig | null
  handleSaveAndRemoveTeacher: (updatedTeacher: CardConfig, options: { compensate: boolean }) => Promise<void>
  handleRemoveTeacherOnly: (teacher: CardConfig, options: { compensate: boolean }) => Promise<void>

  // CSV/Import
  fileInputRef: React.RefObject<HTMLInputElement | null>
  importing: boolean
  isImportDialogOpen: boolean
  setIsImportDialogOpen: (val: boolean) => void
  parsedTeachers: CardConfig[]
  importMode: 'merge' | 'overwrite'
  setImportMode: (mode: 'merge' | 'overwrite') => void
  handleCSVUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBulkImport: (mode: 'merge' | 'overwrite') => Promise<void>
  handleExportCSV: () => void
  handleExportJSON: () => void

  // Maintenance & Sync
  isCleaningInventory: boolean
  isSyncingOpenedPacks: boolean
  isCleaningLegacyVotes: boolean
  isMigratingInventory: boolean
  isMigratingTeacherVol1: boolean
  isDryRunning: boolean
  isSyncing: boolean
  showDryRunDialog: boolean
  setShowDryRunDialog: (val: boolean) => void
  dryRunPreview: any
  handleCleanupDuplicates: () => void
  handleCleanupInventory: () => Promise<void>
  handleSyncOpenedPacksToInventory: () => Promise<void>
  handleCleanupLegacyTeachersVoted: () => Promise<void>
  handleMigrateInventory: () => Promise<void>
  handleMigrateTeacherVol1: () => Promise<void>
  handleRemoveAllMismatches: () => Promise<void>
  handleConfirmDryRun: () => Promise<void>

  // Proposals
  cardProposals: CardProposal[]
  proposalsLoading: boolean
  proposalStatusCounts: { pending: number, accepted: number, rejected: number }
  backfillingProposalUsage: boolean
  moderatingProposalId: string | null
  proposalModerationDialogOpen: boolean
  setProposalModerationDialogOpen: (val: boolean) => void
  proposalInDialog: CardProposal | null
  proposalEditDraft: ProposalEditDraft | null
  setProposalEditDraft: React.Dispatch<React.SetStateAction<ProposalEditDraft | null>>
  proposalUsageStatusDraft: ProposalUsageStatus
  setProposalUsageStatusDraft: (status: ProposalUsageStatus) => void
  proposalAdminNoteDraft: string
  setProposalAdminNoteDraft: (val: string) => void
  handleModerateProposal: (proposal: CardProposal, action: 'accept' | 'reject') => Promise<void>
  handleAcceptProposalFromDialog: () => Promise<void>
  handleBackfillProposalUsage: () => Promise<void>
  updateProposalAttackDraft: (index: number, field: keyof TeacherAttack, value: string | number) => void
  resetProposalModerationDialog: () => void

  // Trading
  systemFeatures: any
  
  // Simulation
  simCount: number
  setSimCount: (val: number) => void
  simulating: boolean
  runSimulation: () => void
  simResults: any
  
  // Actions
  handleSaveConfig: (updatedFields: Partial<SammelkartenConfig>) => void
  handleManualSave: () => Promise<void>
  handleMigrate: () => Promise<void>
}

const SammelkartenAdminContext = createContext<SammelkartenAdminContextType | undefined>(undefined)

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
  shiny: 0.15,
  holo: 0.05,
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

function normalizeVisibleTeacherText(teacher: LootTeacher): LootTeacher {
  return {
    ...teacher,
    type: 'teacher',
    hp: teacher.hp || 100,
    name: restoreGermanUmlauts(teacher.name || ''),
    description: teacher.description ? restoreGermanUmlauts(teacher.description) : teacher.description,
    attacks: (teacher.attacks || []).map((attack) => ({
      ...attack,
      name: restoreGermanUmlauts(attack.name || ''),
      description: attack.description ? restoreGermanUmlauts(attack.description) : attack.description,
    }))
  }
}

function generateTeacherId(name: string, existingIds: string[]): string {
  let baseId = name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  if (!baseId) baseId = 'teacher_' + Math.random().toString(36).substring(2, 7)
  
  let id = baseId
  let counter = 1
  while (existingIds.includes(id)) {
    id = `${baseId}_${counter}`
    counter++
  }
  return id
}

function sanitizeDataForFirestore(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDataForFirestore)
  } else if (obj !== null && typeof obj === 'object') {
    if (obj.id === undefined && obj.name === undefined && Object.keys(obj).length === 0) return obj
    const newObj: any = {}
    for (const key in obj) {
      if (obj[key] === undefined) continue
      newObj[key] = sanitizeDataForFirestore(obj[key])
    }
    return newObj
  }
  return obj
}

export function SammelkartenAdminProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const { confirm } = usePopupManager()
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
  const [editingTeacher, setEditingTeacher] = useState<CardConfig | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Simulation State
  const [simCount, setSimCount] = useState(100)
  const [simulating, setSimulating] = useState(false)
  const [simResults, setSimResults] = useState<{
    totalPacks: number,
    godpackCount: number,
    rarityCounts: Record<TeacherRarity, number>,
    variantCounts: Record<string, number>
  } | null>(null)

  // Proposals State
  const [cardProposals, setCardProposals] = useState<CardProposal[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(true)
  const [moderatingProposalId, setModeratingProposalId] = useState<string | null>(null)
  const [backfillingProposalUsage, setBackfillingProposalUsage] = useState(false)

  // Moderation Dialog State
  const [proposalModerationDialogOpen, setProposalModerationDialogOpen] = useState(false)
  const [proposalInDialog, setProposalInDialog] = useState<CardProposal | null>(null)
  const [proposalEditDraft, setProposalEditDraft] = useState<ProposalEditDraft | null>(null)
  const [proposalUsageStatusDraft, setProposalUsageStatusDraft] = useState<ProposalUsageStatus>('unknown')
  const [proposalAdminNoteDraft, setProposalAdminNoteDraft] = useState('')

  // Maintenance States
  const [isCleaningInventory, setIsCleaningInventory] = useState(false)
  const [isSyncingOpenedPacks, setIsSyncingOpenedPacks] = useState(false)
  const [isCleaningLegacyVotes, setIsCleaningLegacyVotes] = useState(false)
  const [isMigratingInventory, setIsMigratingInventory] = useState(false)
  const [isMigratingTeacherVol1, setIsMigratingTeacherVol1] = useState(false)
  const [isDryRunning, setIsDryRunning] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showDryRunDialog, setShowDryRunDialog] = useState(false)
  const [dryRunPreview, setDryRunPreview] = useState<any>(null)

  // Import States
  const [importing, setImporting] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [parsedTeachers, setParsedTeachers] = useState<CardConfig[]>([])
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // System Features
  const [systemFeatures, setSystemFeatures] = useState<any>(null)

  // Load Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SammelkartenConfig
        setConfig(data)
        if (!isDirty) {
          setLocalConfig(data)
        }
      } else {
        const initialConfig: SammelkartenConfig = {
          loot_teachers: [],
          rarity_weights: DEFAULT_RARITY_WEIGHTS,
          godpack_weights: DEFAULT_GODPACK_WEIGHTS,
          variant_probabilities: DEFAULT_VARIANTS,
          global_limits: DEFAULT_LIMITS,
          updated_at: serverTimestamp()
        }
        setDoc(doc(db, 'settings', 'sammelkarten'), initialConfig)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [isDirty])

  // Load Features
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snapshot) => {
      if (snapshot.exists()) {
        setSystemFeatures(snapshot.data())
      }
    })
    return () => unsub()
  }, [])

  // Load Proposals
  useEffect(() => {
    const q = query(collection(db, 'card_proposals'), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CardProposal[]
      setCardProposals(proposals)
      setProposalsLoading(false)
    })
    return () => unsub()
  }, [])

  // Autosave
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isDirty && localConfig) {
      setAutosaveCountdown(10)
      timer = setInterval(() => {
        setAutosaveCountdown(prev => {
          if (prev === null) return null
          if (prev <= 1) {
            performActualSave(localConfig)
            return null
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setAutosaveCountdown(null)
    }
    return () => clearInterval(timer)
  }, [isDirty, localConfig])

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

  const handleMigrate = async () => {
    const confirmed = await confirm({
      title: 'Lehrer-Daten importieren?',
      content: 'Möchtest du die Lehrer-Daten aus den globalen Einstellungen importieren? Dies überschreibt den aktuellen Lehrer-Pool hier.',
      priority: 'high',
      confirmLabel: 'Importieren',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return
    
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

  const availableSets = useMemo(() => {
    const staticSets = Object.values(CARD_SETS)
    const customSets = localConfig?.sets ? Object.values(localConfig.sets) : []
    
    const allSets = [...staticSets]
    customSets.forEach(cs => {
      if (!allSets.some(s => s.id === cs.id)) {
        allSets.push(cs as any)
      }
    })
    return allSets
  }, [localConfig?.sets])

  const currentSet = useMemo(() => {
    return availableSets.find(s => s.id === selectedSetId)
  }, [availableSets, selectedSetId])

  const handleMigrateToSets = async () => {
    if (!localConfig || !localConfig.loot_teachers || localConfig.loot_teachers.length === 0) return
    const confirmed = await confirm({
      title: 'In Set-System migrieren?',
      content: 'Möchtest du den aktuellen Lehrer-Pool in das neue Set-System (teacher_vol1) migrieren?',
      priority: 'warning',
      confirmLabel: 'Migrieren',
    })
    if (!confirmed) return

    const teachersV1Set: CardSet = {
      id: 'teacher_vol1',
      name: 'Lehrer Set v1',
      prefix: 'T1',
      color: '#3b82f6',
      cards: localConfig.loot_teachers as CardConfig[]
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

  const handleRemoveSet = async (setId: string) => {
    if (!localConfig || !localConfig.sets?.[setId]) return
    const confirmed = await confirm({
      title: 'Set löschen?',
      content: `Möchtest du das Set "${localConfig.sets[setId].name}" wirklich löschen? Alle Karten in diesem Set gehen verloren!`,
      priority: 'high',
      confirmLabel: 'Set löschen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return

    const updatedSets = { ...localConfig.sets }
    delete updatedSets[setId]
    
    handleSaveConfig({ sets: updatedSets })
    if (selectedSetId === setId) {
      const firstId = Object.keys(updatedSets)[0] || ''
      setSelectedSetId(firstId)
    }
    toast.success('Set gelöscht.')
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
      rarity: newTeacherRarity,
      type: 'teacher',
      hp: 100,
      attacks: []
    })
    
    const updatedCards = [...(currentSet.cards || []), newTeacher] as CardConfig[]
    const updatedSets = {
      ...(localConfig.sets || {}),
      [selectedSetId]: { ...currentSet, cards: updatedCards }
    }
    handleSaveConfig({ sets: updatedSets as Record<string, CardSet> })
    setNewTeacherName('')
  }

  const handleRemoveTeacher = useCallback(async (teacher: CardConfig) => {
    const confirmed = await confirm({
      title: 'Lehrkraft entfernen?',
      content: `Möchtest du ${teacher.name} wirklich entfernen?`,
      priority: 'high',
      confirmLabel: 'Entfernen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return
    
    setLocalConfig(prev => {
      if (!prev || !selectedSetId || !currentSet) return prev

      const updatedCards = currentSet.cards.filter(t => t.id !== teacher.id)
      return { 
        ...prev, 
        sets: { ...(prev.sets || {}), [selectedSetId]: { ...currentSet, cards: updatedCards } } 
      }
    })
    setIsDirty(true)
  }, [selectedSetId, currentSet, confirm])

  const handleEditTeacher = useCallback((teacher: CardConfig) => {
    setEditingTeacher({ ...teacher })
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdateTeacher = useCallback(async (
    updatedTeacher: CardConfig,
    options?: { skipRaritySync?: boolean }
  ) => {
    if (!selectedSetId || !currentSet) return

    const oldTeacher = currentSet.cards.find(t => t.id === updatedTeacher.id)
    const rarityChanged = oldTeacher && oldTeacher.rarity !== updatedTeacher.rarity
    const shouldRunRaritySync = Boolean(rarityChanged && !options?.skipRaritySync)

    if (shouldRunRaritySync) {
      const confirmed = await confirm({
        title: 'Seltenheitsaenderung bestaetigen?',
        content: `Du hast die Seltenheit von ${updatedTeacher.name} geändert.\n\nDies wird die Karte aus den Inventaren ALLER Schüler entfernen, aber sie erhalten pro entfernter Karte 1 Booster-Pack als Entschädigung.\n\nFortfahren?`,
        priority: 'high',
        confirmLabel: 'Fortfahren',
        confirmVariant: 'destructive',
      })
      if (!confirmed) {
        return
      }
    }

    setLocalConfig(prev => {
      if (!prev || !selectedSetId || !currentSet) return prev

      const updatedCards = [...currentSet.cards]
      const index = updatedCards.findIndex(t => t.id === updatedTeacher.id)
      if (index !== -1) {
        updatedCards[index] = updatedTeacher
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
        console.error('Rarity sync failed:', err)
        toast.error('Fehler beim Bereinigen der Inventare: ' + err.message, { id: toastId })
      }
    }
  }, [selectedSetId, currentSet, user, profile?.full_name, confirm])

  const runRemoveTeacherFromAlbums = useCallback(async (teacher: CardConfig, compensate: boolean) => {
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

  const handleSaveAndRemoveTeacher = useCallback(async (updatedTeacher: CardConfig, options: { compensate: boolean }) => {
    await handleUpdateTeacher(updatedTeacher, { skipRaritySync: true })
    await runRemoveTeacherFromAlbums(updatedTeacher, options.compensate)
  }, [handleUpdateTeacher, runRemoveTeacherFromAlbums])

  const handleRemoveTeacherOnly = useCallback(async (teacher: CardConfig, options: { compensate: boolean }) => {
    await runRemoveTeacherFromAlbums(teacher, options.compensate)
  }, [runRemoveTeacherFromAlbums])

  const filteredTeachers = useMemo(() => {
    if (!currentSet) return []
    let list = [...(currentSet.cards || [])]
    
    if (teacherSearch) {
      const s = teacherSearch.toLowerCase()
      list = list.filter(t => 
        t.name.toLowerCase().includes(s) || 
        t.rarity.toLowerCase().includes(s) ||
        t.id.toLowerCase().includes(s)
      )
    }

    list.sort((a, b) => {
      if (teacherSort === 'name-asc') return a.name.localeCompare(b.name)
      if (teacherSort === 'name-desc') return b.name.localeCompare(a.name)
      
      const rarityValue = (r: TeacherRarity) => {
        const order: TeacherRarity[] = ['iconic', 'legendary', 'mythic', 'epic', 'rare', 'common']
        return order.indexOf(r)
      }

      if (teacherSort === 'rarity-asc') return rarityValue(a.rarity) - rarityValue(b.rarity)
      if (teacherSort === 'rarity-desc') return rarityValue(b.rarity) - rarityValue(a.rarity)
      return 0
    })

    return list
  }, [currentSet, teacherSearch, teacherSort])

  const rarityDistribution = useMemo(() => {
    if (!currentSet) return {}
    return (currentSet.cards || []).reduce((acc, t) => {
      acc[t.rarity] = (acc[t.rarity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [currentSet])

  // CSV/Import functions
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n')
      const headerRow = lines[0].split(',').map(h => h.trim().toLowerCase())
      const isNewFormatHeader = headerRow.includes('nachname') && headerRow.includes('vorname')
      
      const teachers: LootTeacher[] = []
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',')
        if (row.length < 2) continue
        
        let name = ''
        let rarity: TeacherRarity = 'common'
        let hp = 100
        let description = ''

        // New format: Nachname, Vorname, Rarity, HP, Description (5 columns)
        if (isNewFormatHeader || row.length >= 5) {
          const lastName = row[0]?.trim() || ''
          const firstName = row[1]?.trim() || ''
          name = firstName ? `${firstName} ${lastName}` : lastName
          rarity = (row[2]?.trim().toLowerCase() || 'common') as TeacherRarity
          hp = row[3] ? parseInt(row[3]) : 100
          description = row[4] ? row[4].trim() : ''
        } else {
          // Old format: Name, Rarity, HP, Description
          name = row[0].trim()
          rarity = (row[1].trim().toLowerCase() || 'common') as TeacherRarity
          hp = row[2] ? parseInt(row[2]) : 100
          description = row[3] ? row[3].trim() : ''
        }
        
        const teacher: any = {
          name,
          rarity,
          type: 'teacher',
          hp,
          description,
          attacks: []
        }
        
        // ID generieren falls nicht vorhanden
        teacher.id = generateTeacherId(teacher.name, teachers.map(t => t.id))
        teachers.push(normalizeVisibleTeacherText(teacher))
      }
      
      setParsedTeachers(teachers as any)
      setIsImportDialogOpen(true)
    }
    reader.readAsText(file)
  }

  const handleBulkImport = async (mode: 'merge' | 'overwrite') => {
    if (!localConfig || !selectedSetId || !currentSet) return
    
    setImporting(true)
    try {
      let updatedCards = [...(currentSet.cards || [])]
      
      if (mode === 'overwrite') {
        updatedCards = parsedTeachers as any
      } else {
        parsedTeachers.forEach(newT => {
          const idx = updatedCards.findIndex(t => t.id === newT.id || t.name === newT.name)
          if (idx !== -1) {
            updatedCards[idx] = newT as any
          } else {
            updatedCards.push(newT as any)
          }
        })
      }

      const updatedSets = {
        ...(localConfig.sets || {}),
        [selectedSetId]: { ...currentSet, cards: updatedCards }
      }
      
      handleSaveConfig({ sets: updatedSets })
      toast.success(`${parsedTeachers.length} Lehrer erfolgreich importiert.`)
      setIsImportDialogOpen(false)
    } catch (err) {
      toast.error('Import fehlgeschlagen.')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCSV = () => {
    if (!currentSet) return
    const headers = ['Nachname', 'Vorname', 'Rarity', 'HP', 'Description']
    const rows = currentSet.cards.map(t => {
      let lastName = t.name
      let firstName = ''
      
      if (t.name.includes(',')) {
        const parts = t.name.split(',').map(s => s.trim())
        lastName = parts[0]
        firstName = parts[1] || ''
      } else {
        const parts = t.name.trim().split(/\s+/)
        if (parts.length > 1) {
          lastName = parts[parts.length - 1]
          firstName = parts.slice(0, parts.length - 1).join(' ')
        }
      }

      return [
        lastName,
        firstName,
        t.rarity,
        (t as any).hp || '',
        t.description || ''
      ]
    })
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `abi_cards_${selectedSetId}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportJSON = () => {
    if (!localConfig) return
    const blob = new Blob([JSON.stringify(localConfig, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `abi_cards_config_backup_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Maintenance & Sync functions
  const handleCleanupDuplicates = useCallback(() => {
    if (!localConfig || !selectedSetId || !currentSet) return

    const teachers = currentSet.cards
    const seenNames = new Map<string, string>() // name -> canonicalId
    const canonicalTeachers: CardConfig[] = []
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
  }, [localConfig, selectedSetId, currentSet, handleSaveConfig, user, profile])

  const handleCleanupInventory = async () => {
    const confirmed = await confirm({
      title: 'Inventare bereinigen?',
      content: 'Möchtest du wirklich alle Inventare von Lehrern bereinigen, die nicht mehr existieren? Dies kann einen Moment dauern.',
      priority: 'warning',
      confirmLabel: 'Bereinigen',
    })
    if (!confirmed) return
    
    setIsCleaningInventory(true)
    const cleanupFn = httpsCallable<void, { success: boolean, usersProcessed: number, usersUpdated: number, cardsRemoved: number }>(functions, 'cleanupNonExistentTeachers')

    try {
      const result = await cleanupFn()
      toast.success(`Inventar-Bereinigung abgeschlossen! ${result.data.cardsRemoved} Karten entfernt.`)
      if (user) {
        await logAction('INVENTORY_CLEANUP', user.uid, profile?.full_name, result.data)
      }
    } catch (err: any) {
      toast.error('Fehler: ' + err.message)
    } finally {
      setIsCleaningInventory(false)
    }
  }

  const handleSyncOpenedPacksToInventory = async () => {
    const confirmed = await confirm({
      title: 'Packs synchronisieren?',
      content: 'Dies stellt sicher, dass alle geöffneten Packs auch im Inventar der Nutzer reflektiert werden. Dies kann lange dauern. Fortfahren?',
      priority: 'warning',
      confirmLabel: 'Synchronisieren',
    })
    if (!confirmed) return
    
    setIsSyncingOpenedPacks(true)
    try {
      const syncFn = httpsCallable(functions, 'syncOpenedPacksToInventory')
      const result = await syncFn()
      toast.success('Pack-Synchronisierung abgeschlossen!')
      if (user) {
        await logAction('INVENTORY_SYNC_PACKS', user.uid, profile?.full_name, result.data)
      }
    } catch (err: any) {
      toast.error('Fehler: ' + err.message)
    } finally {
      setIsSyncingOpenedPacks(false)
    }
  }

  const handleCleanupLegacyTeachersVoted = async () => {
    const confirmed = await confirm({
      title: 'Legacy-Daten löschen?',
      content: 'Möchtest du alle "teachers_voted" Dokumente löschen? Dies ist ein Relikt aus dem alten Abstimmungssystem.',
      priority: 'warning',
      confirmLabel: 'Loeschen',
      confirmVariant: 'destructive',
    })
    if (!confirmed) return
    
    setIsCleaningLegacyVotes(true)
    try {
      const cleanupFn = httpsCallable(functions, 'cleanupLegacyVotingData')
      const result = await cleanupFn()
      toast.success('Legacy-Daten erfolgreich entfernt!')
      if (user) {
        await logAction('LEGACY_VOTING_CLEANUP', user.uid, profile?.full_name, result.data)
      }
    } catch (err: any) {
      toast.error('Fehler: ' + err.message)
    } finally {
      setIsCleaningLegacyVotes(false)
    }
  }

  const handleMigrateInventory = async () => {
    const confirmed = await confirm({
      title: 'Inventar migrieren?',
      content: 'Dies migriert alle Inventar-Einträge in das neue ID-Format (setId_cardId). Nur einmal ausführen! Fortfahren?',
      priority: 'warning',
      confirmLabel: 'Migrieren',
    })
    if (!confirmed) return
    
    setIsMigratingInventory(true)
    try {
      const migrateFn = httpsCallable(functions, 'migrateInventoryToSetIds')
      const result = await migrateFn()
      toast.success('Inventar-Migration abgeschlossen!')
      if (user) {
        await logAction('INVENTORY_MIGRATION_SETIDS', user.uid, profile?.full_name, result.data)
      }
    } catch (err: any) {
      toast.error('Fehler: ' + err.message)
    } finally {
      setIsMigratingInventory(false)
    }
  }

  const handleMigrateTeacherVol1 = async () => {
    const confirmed = await confirm({
      title: 'teacher_vol1 migrieren?',
      content: 'Dies migriert alle Karten im "teacher_vol1" Set, die noch das alte ID-Format haben. Fortfahren?',
      priority: 'warning',
      confirmLabel: 'Migrieren',
    })
    if (!confirmed) return
    
    setIsMigratingTeacherVol1(true)
    try {
      const migrateFn = httpsCallable(functions, 'migrateTeacherVol1Ids')
      const result = await migrateFn()
      toast.success('Lehrer-Migration abgeschlossen!')
      if (user) {
        await logAction('TEACHER_VOL1_MIGRATION', user.uid, profile?.full_name, result.data)
      }
    } catch (err: any) {
      toast.error('Fehler: ' + err.message)
    } finally {
      setIsMigratingTeacherVol1(false)
    }
  }

  const handleRemoveAllMismatches = async () => {
    setIsDryRunning(true)
    try {
      const dryRunFn = httpsCallable<any, any>(functions, 'validateInventoryRarities')
      const result = await dryRunFn({ dryRun: true })
      setDryRunPreview(result.data)
      setShowDryRunDialog(true)
    } catch (err: any) {
      toast.error('Dry-Run fehlgeschlagen: ' + err.message)
    } finally {
      setIsDryRunning(false)
    }
  }

  const handleConfirmDryRun = async () => {
    setIsSyncing(true)
    try {
      const syncFn = httpsCallable<any, any>(functions, 'validateInventoryRarities')
      const result = await syncFn({ dryRun: false })
      toast.success(`Synchronisierung abgeschlossen! ${result.data.mismatchesFound} Karten korrigiert.`)
      setShowDryRunDialog(false)
      if (user) {
        await logAction('INVENTORY_RARITY_SYNC', user.uid, profile?.full_name, result.data)
      }
    } catch (err: any) {
      toast.error('Fehler bei Synchronisierung: ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  // Simulation logic
  const runSimulation = () => {
    if (!localConfig || !currentSet) return
    setSimulating(true)
    
    const results = {
      totalPacks: simCount,
      godpackCount: 0,
      rarityCounts: { common: 0, rare: 0, epic: 0, mythic: 0, legendary: 0, iconic: 0 },
      variantCounts: { normal: 0, shiny: 0, holo: 0, black_shiny_holo: 0 }
    }

    const cardsByRarity = currentSet.cards.reduce((acc, c) => {
      if (!acc[c.rarity]) acc[c.rarity] = []
      acc[c.rarity].push(c)
      return acc
    }, {} as Record<TeacherRarity, CardConfig[]>)

    for (let i = 0; i < simCount; i++) {
      const isGodpack = Math.random() < localConfig.global_limits.godpack_chance
      if (isGodpack) results.godpackCount++
      
      const weights = isGodpack ? localConfig.godpack_weights : localConfig.rarity_weights
      
      for (let s = 0; s < 3; s++) {
        const slotWeights = weights[s]
        const rand = Math.random()
        let cumulative = 0
        let selectedRarity: TeacherRarity = 'common'
        
        const order: TeacherRarity[] = ['common', 'rare', 'epic', 'mythic', 'legendary', 'iconic']
        for (const r of order) {
          cumulative += slotWeights[r] || 0
          if (rand <= cumulative) {
            selectedRarity = r
            break
          }
        }
        
        results.rarityCounts[selectedRarity]++
        
        // Variant simulation
        const vRand = Math.random()
        if (vRand < localConfig.variant_probabilities.black_shiny_holo) {
          results.variantCounts.black_shiny_holo++
        } else if (vRand < localConfig.variant_probabilities.holo) {
          results.variantCounts.holo++
        } else if (vRand < localConfig.variant_probabilities.shiny) {
          results.variantCounts.shiny++
        } else {
          results.variantCounts.normal++
        }
      }
    }

    setSimResults(results)
    setSimulating(false)
  }

  // Proposal moderation functions
  const handleModerateProposal = async (proposal: CardProposal, action: 'accept' | 'reject') => {
    if (action === 'reject') {
      const confirmed = await confirm({
        title: 'Vorschlag ablehnen?',
        content: `Möchtest du den Vorschlag "${proposal.teacher_name}" wirklich ablehnen?`,
        priority: 'high',
        confirmLabel: 'Ablehnen',
        confirmVariant: 'destructive',
      })
      if (!confirmed) return
      setModeratingProposalId(proposal.id)
      try {
        const moderateFn = httpsCallable(functions, 'moderateCardProposal')
        await moderateFn({
          proposalId: proposal.id,
          action: 'reject'
        })
        toast.success('Vorschlag abgelehnt.')
      } catch (err: any) {
        toast.error('Fehler: ' + err.message)
      } finally {
        setModeratingProposalId(null)
      }
    } else {
      // Accept -> Open Dialog
      setProposalInDialog(proposal)
      setProposalEditDraft({
        teacher_name: proposal.teacher_name,
        hp: proposal.hp || 100,
        description: proposal.description || '',
        attacks: proposal.attacks || [{ name: '', damage: 0, description: '' }]
      })
      setProposalUsageStatusDraft('used')
      setProposalAdminNoteDraft('')
      setProposalModerationDialogOpen(true)
    }
  }

  const handleAcceptProposalFromDialog = async () => {
    if (!proposalInDialog || !proposalEditDraft || !selectedSetId) return
    
    setModeratingProposalId(proposalInDialog.id)
    try {
      const moderateFn = httpsCallable(functions, 'moderateCardProposal')
      await moderateFn({
        proposalId: proposalInDialog.id,
        action: 'accept',
        setId: selectedSetId,
        finalData: {
          teacher_name: proposalEditDraft.teacher_name,
          hp: proposalEditDraft.hp,
          description: proposalEditDraft.description,
          attacks: proposalEditDraft.attacks,
          usage_status: proposalUsageStatusDraft,
          admin_note: proposalAdminNoteDraft
        }
      })
      
      toast.success('Vorschlag erfolgreich angenommen und Karte erstellt!')
      resetProposalModerationDialog()
    } catch (err: any) {
      toast.error('Fehler beim Annehmen: ' + err.message)
    } finally {
      setModeratingProposalId(null)
    }
  }

  const resetProposalModerationDialog = () => {
    setProposalModerationDialogOpen(false)
    setProposalInDialog(null)
    setProposalEditDraft(null)
    setProposalUsageStatusDraft('unknown')
    setProposalAdminNoteDraft('')
  }

  const updateProposalAttackDraft = (index: number, field: keyof TeacherAttack, value: string | number) => {
    setProposalEditDraft(prev => {
      if (!prev) return null
      const newAttacks = [...prev.attacks]
      newAttacks[index] = { ...newAttacks[index], [field]: value }
      return { ...prev, attacks: newAttacks }
    })
  }

  const handleBackfillProposalUsage = async () => {
    setBackfillingProposalUsage(true)
    try {
      const backfillFn = httpsCallable(functions, 'backfillProposalUsageStatus')
      const result = await backfillFn()
      toast.success('Backfill abgeschlossen!')
      if (user) {
        await logAction('PROPOSALS_BACKFILL', user.uid, profile?.full_name, result.data)
      }
    } catch (err: any) {
      toast.error('Backfill fehlgeschlagen: ' + err.message)
    } finally {
      setBackfillingProposalUsage(false)
    }
  }

  const proposalStatusCounts = useMemo(() => {
    return cardProposals.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, { pending: 0, accepted: 0, rejected: 0 } as { pending: number, accepted: number, rejected: number })
  }, [cardProposals])

  const value = {
    localConfig, loading, saving, isDirty, autosaveCountdown,
    selectedSetId, setSelectedSetId, availableSets, currentSet,
    isAddingSet, setIsAddingSet, newSetName, setNewSetName, newSetId, setNewSetId,
    newSetPrefix, setNewSetPrefix, newSetColor, setNewSetColor,
    handleAddSet, handleRemoveSet, handleMigrateToSets,
    newTeacherName, setNewTeacherName, newTeacherRarity, setNewTeacherRarity,
    teacherSearch, setTeacherSearch, teacherSort, setTeacherSort,
    filteredTeachers, rarityDistribution,
    handleAddTeacher, handleRemoveTeacher, handleEditTeacher, handleUpdateTeacher,
    isEditDialogOpen, setIsEditDialogOpen, editingTeacher,
    handleSaveAndRemoveTeacher, handleRemoveTeacherOnly,
    fileInputRef, importing, isImportDialogOpen, setIsImportDialogOpen,
    parsedTeachers, importMode, setImportMode, handleCSVUpload, handleBulkImport,
    handleExportCSV, handleExportJSON,
    isCleaningInventory, isSyncingOpenedPacks, isCleaningLegacyVotes,
    isMigratingInventory, isMigratingTeacherVol1, isDryRunning, isSyncing,
    showDryRunDialog, setShowDryRunDialog, dryRunPreview,
    handleCleanupDuplicates, handleCleanupInventory, handleSyncOpenedPacksToInventory,
    handleCleanupLegacyTeachersVoted, handleMigrateInventory, handleMigrateTeacherVol1,
    handleRemoveAllMismatches, handleConfirmDryRun,
    cardProposals, proposalsLoading, proposalStatusCounts, backfillingProposalUsage,
    moderatingProposalId, proposalModerationDialogOpen, setProposalModerationDialogOpen,
    proposalInDialog, proposalEditDraft, setProposalEditDraft,
    proposalUsageStatusDraft, setProposalUsageStatusDraft,
    proposalAdminNoteDraft, setProposalAdminNoteDraft,
    handleModerateProposal, handleAcceptProposalFromDialog, handleBackfillProposalUsage,
    updateProposalAttackDraft, resetProposalModerationDialog,
    systemFeatures, simCount, setSimCount, simulating, runSimulation, simResults,
    handleSaveConfig, handleManualSave, handleMigrate
  }

  return (
    <SammelkartenAdminContext.Provider value={value}>
      {children}
    </SammelkartenAdminContext.Provider>
  )
}

export function useSammelkartenAdmin() {
  const context = useContext(SammelkartenAdminContext)
  if (context === undefined) {
    throw new Error('useSammelkartenAdmin must be used within a SammelkartenAdminProvider')
  }
  return context
}
