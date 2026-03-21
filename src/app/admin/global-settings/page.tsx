'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Save, RotateCcw, Cookie, Gift, GraduationCap, Search, AlertTriangle, Pencil, Upload, RefreshCw } from 'lucide-react'
import { logAction } from '@/lib/logging'
import { TeacherRarity, Teacher } from '@/types/database'
import { collection, getDocs, writeBatch } from 'firebase/firestore'
import { Badge } from '@/components/ui/badge'

interface LootTeacher {
  id: string
  name: string
  rarity: TeacherRarity
}

interface GlobalSettings {
  cookie_banner_chance: number
  cookie_messages: string[]
  ad_messages: string[]
  loot_teachers: LootTeacher[]
}

const DEFAULT_SETTINGS: GlobalSettings = {
  cookie_banner_chance: 0.3,
  cookie_messages: [
    "Diese Webseite nutzt keine Cookies. Aber hast du schon mal drüber nachgedacht, echte Cookies in der Schule zu verkaufen, um Geld für die Abikasse zu sammeln?",
    "Keine Cookies hier! Vielleicht solltet ihr stattdessen einen Kuchenverkauf organisieren? Das bringt deutlich mehr für das Budget.",
    "Wir speichern keine Daten in Cookies. Aber wir speichern die Hoffnung, dass euer Abiball legendär wird!",
    "Cookie-Banner sind nervig, deshalb haben wir keine Cookies. Wie wäre es mit einem Waffelverkauf in der großen Pause?",
    "Diese Seite ist 100% krümelfrei. Echte Cookies gibt's am Kiosk (und der Erlös geht hoffentlich in eure Kasse)!",
    "Hier gibt es keine digitalen Kekse. Aber echte Kekse mit eurem Abi-Logo wären doch eine super Finanzierungsidee, oder?",
    "0% Cookies, 100% Abi-Planung. Denkt dran: Einnahmen aus dem Verkauf von Süßigkeiten steigern euren Kontostand massiv!"
  ],
  ad_messages: [
    'Werbung (nicht bezahlt): 10 Minuten Team-Meeting sparen euch 2 Stunden Abi-Chaos am Ende der Woche.',
    'Abi-Tipp des Tages: Erst Budget planen, dann Motto-Glitzer kaufen. Euer Kassenwart wird es euch danken.',
    'Parodie-Anzeige: Kuchenverkauf Plus bringt +100 Sympathie und +250 EUR Klassenkasse.',
    'Sponsoring-Idee: Lokale Cafés fragen, ob sie euren Abi-Jahrgang bei Aktionen supporten.',
    'Promo-Hinweis: Eine gute Aufgabenliste ist günstiger als jede Last-Minute-Rettungsaktion.',
    'Abi-Gag mit Mehrwert: Plant den DJ früh, bevor nur noch die Schützenkapelle frei ist.',
    'Werbeblock Ende: Wenn jeder im Team eine Mini-Aufgabe übernimmt, wird der Abiball plötzlich machbar.'
  ],
  loot_teachers: [
    { id: 'max-mustermann', name: "Max Mustermann", rarity: "common" },
    { id: 'erika-musterfrau', name: "Erika Musterfrau", rarity: "rare" },
    { id: 'albert-einstein', name: "Albert Einstein", rarity: "legendary" }
  ]
}

export default function GlobalSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [initialSettings, setInitialSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [newAdMessage, setNewAdMessage] = useState('')
  const [newTeacherName, setNewTeacherName] = useState('')
  const [newTeacherRarity, setNewTeacherRarity] = useState<TeacherRarity>('common')
  const [editingTeacher, setEditingTeacher] = useState<LootTeacher | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState('')
  const [votingData, setVotingData] = useState<Record<string, { avg: number, count: number }>>({})
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [isGuardOpen, setIsGuardOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)
  const router = useRouter()

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (anchor && anchor.href && anchor.target !== '_blank') {
        const url = new URL(anchor.href)
        const destination = `${url.pathname}${url.search}${url.hash}`
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`

        if (url.origin === window.location.origin && destination !== current && hasUnsavedChanges) {
          e.preventDefault()
          setNextPath(destination)
          setIsGuardOpen(true)
        }
      }
    }

    window.addEventListener('click', handleAnchorClick, true)
    return () => window.removeEventListener('click', handleAnchorClick, true)
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!authLoading && (!profile || !isAdmin)) {
      router.push('/')
      return
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as GlobalSettings
        const loadedSettings = {
          ...DEFAULT_SETTINGS,
          ...data,
          ad_messages: data.ad_messages || DEFAULT_SETTINGS.ad_messages,
          loot_teachers: data.loot_teachers || DEFAULT_SETTINGS.loot_teachers
        }
        setSettings(loadedSettings)
        setInitialSettings(loadedSettings)
      } else {
        setSettings(DEFAULT_SETTINGS)
        setInitialSettings(DEFAULT_SETTINGS)
      }
      setLoading(false)
    })

    // Fetch live voting data for display
    const unsubscribeVoting = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const data: Record<string, { avg: number, count: number }> = {}
      snapshot.docs.forEach(doc => {
        const d = doc.data()
        data[doc.id] = { avg: d.avg_rating || 0, count: d.vote_count || 0 }
      })
      setVotingData(data)
    })

    return () => {
      unsubscribe()
      unsubscribeVoting()
    }
  }, [profile, authLoading, isAdmin, router])

  const handleSave = async (settingsToSave?: GlobalSettings): Promise<boolean> => {
    if (!user || !isAdmin) return false
    const data = settingsToSave || settings
    setSaving(true)

    try {
      await setDoc(doc(db, 'settings', 'global'), data)
      await logAction('GLOBAL_SETTINGS_UPDATED', user.uid, profile?.full_name, { settings: data })
      setInitialSettings(data)
      toast.success('Einstellungen erfolgreich gespeichert.')
      return true
    } catch (error) {
      console.error('Error saving global settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmNavigation = () => {
    setIsGuardOpen(false)
    if (nextPath) {
      router.push(nextPath)
      setNextPath(null)
    }
  }

  const handleSaveAndContinue = async () => {
    const didSave = await handleSave()
    if (!didSave) return

    setIsGuardOpen(false)
    if (nextPath) {
      router.push(nextPath)
      setNextPath(null)
    }
  }

  const handleAddMessage = () => {
    if (!newMessage.trim()) return
    const updatedSettings = {
      ...settings,
      cookie_messages: [...settings.cookie_messages, newMessage.trim()]
    }
    const old = settings
    setSettings(updatedSettings)
    setNewMessage('')
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleRemoveMessage = (index: number) => {
    const updatedSettings = {
      ...settings,
      cookie_messages: settings.cookie_messages.filter((_, i) => i !== index)
    }
    const old = settings
    setSettings(updatedSettings)
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleAddAdMessage = () => {
    if (!newAdMessage.trim()) return
    const updatedSettings = {
      ...settings,
      ad_messages: [...settings.ad_messages, newAdMessage.trim()]
    }
    const old = settings
    setSettings(updatedSettings)
    setNewAdMessage('')
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleRemoveAdMessage = (index: number) => {
    const updatedSettings = {
      ...settings,
      ad_messages: settings.ad_messages.filter((_, i) => i !== index)
    }
    const old = settings
    setSettings(updatedSettings)
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) return
    if ((settings.loot_teachers || []).length >= 100) {
      toast.error('Limit von 100 Lehrern erreicht.')
      return
    }
    const id = newTeacherName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
    const updatedSettings = {
      ...settings,
      loot_teachers: [...(settings.loot_teachers || []), { id, name: newTeacherName.trim(), rarity: newTeacherRarity }]
    }
    const old = settings
    setSettings(updatedSettings)
    setNewTeacherName('')
    setNewTeacherRarity('common')
    // Nach dem Hinzufügen speichern
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleEditTeacher = (teacher: LootTeacher) => {
    setEditingTeacher({ ...teacher })
    setIsEditDialogOpen(true)
  }

  const handleUpdateTeacher = () => {
    if (!editingTeacher || !editingTeacher.name.trim()) return
    
    const updatedTeachers = (settings.loot_teachers || []).map(t => 
      t.id === editingTeacher.id ? editingTeacher : t
    )
    
    const updatedSettings = {
      ...settings,
      loot_teachers: updatedTeachers
    }
    
    const old = settings
    setSettings(updatedSettings)
    setIsEditDialogOpen(false)
    setEditingTeacher(null)
    
    // Nach dem Update speichern
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleRemoveTeacher = (index: number) => {
    const updatedSettings = {
      ...settings,
      loot_teachers: settings.loot_teachers.filter((_, i) => i !== index)
    }
    const old = settings
    setSettings(updatedSettings)
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleBulkImport = async () => {
    if (!isAdmin || importing) return
    const confirmed = window.confirm('Möchtest du alle Lehrer aus der vordefinierten Liste importieren? Bestehende Lehrer in der Voting-Datenbank werden übersprungen.')
    if (!confirmed) return

    setImporting(true)
    try {
      // The list from the processed CSV
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
      toast.success('Alle Lehrer erfolgreich importiert!')
      if (user) await logAction('TEACHERS_BULK_IMPORT', user.uid, profile?.full_name, { count: teachersToImport.length })
    } catch (error) {
      console.error('Error in bulk import:', error)
      toast.error('Fehler beim Importieren.')
    } finally {
      setImporting(false)
    }
  }

  const handleSyncRarities = async () => {
    if (!isAdmin || syncing) return
    const confirmed = window.confirm('Möchtest du die Seltenheiten im Lehrer-Album basierend auf den aktuellen Voting-Durchschnitten aktualisieren? Dies überschreibt die aktuellen Seltenheiten.')
    if (!confirmed) return

    setSyncing(true)
    try {
      const querySnapshot = await getDocs(collection(db, 'teachers'))
      const teachersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher))
      
      const newLootTeachers: LootTeacher[] = teachersData.map(t => {
        const avg = t.avg_rating || 0
        let rarity: TeacherRarity = 'common'
        
        if (avg >= 0.85) rarity = 'legendary'
        else if (avg >= 0.65) rarity = 'mythic'
        else if (avg >= 0.40) rarity = 'epic'
        else if (avg >= 0.15) rarity = 'rare'
        
        return { id: t.id, name: t.name, rarity }
      })

      const updatedSettings = { ...settings, loot_teachers: newLootTeachers }
      await handleSave(updatedSettings)
      toast.success('Seltenheiten erfolgreich synchronisiert!')
      if (user) await logAction('TEACHERS_RARITY_SYNC', user.uid, profile?.full_name, { count: newLootTeachers.length })
    } catch (error) {
      console.error('Error syncing rarities:', error)
      toast.error('Fehler beim Synchronisieren.')
    } finally {
      setSyncing(false)
    }
  }

  const getRarityLabel = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return 'Gewöhnlich'
      case 'rare': return 'Selten'
      case 'epic': return 'Episch'
      case 'mythic': return 'Mythisch'
      case 'legendary': return 'Legendär'
      default: return rarity
    }
  }

  const getRarityColor = (rarity: TeacherRarity) => {
    switch (rarity) {
      case 'common': return 'text-slate-500'
      case 'rare': return 'text-emerald-500'
      case 'epic': return 'text-purple-500'
      case 'mythic': return 'text-red-500'
      case 'legendary': return 'text-amber-500'
      default: return ''
    }
  }

  const handleResetToDefault = () => {
    if (confirm('Möchtest du wirklich alle Einstellungen auf die Standardwerte zurücksetzen?')) {
      const old = settings
      setSettings(DEFAULT_SETTINGS)
      setTimeout(async () => {
        const ok = await handleSave(DEFAULT_SETTINGS)
        if (!ok) setSettings(old)
      }, 0)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const filteredTeachers = (settings.loot_teachers || []).filter(t => 
    t.name.toLowerCase().includes(teacherSearch.toLowerCase())
  )

  return (

    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Globale Einstellungen</h1>
          <p className="text-muted-foreground">Verwalte systemweite Parameter und Texte.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkImport} disabled={saving || importing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Lehrer Importieren
          </Button>
          <Button variant="outline" onClick={handleResetToDefault} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" /> Zurücksetzen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Cookie-Banner Einstellungen
            </CardTitle>
            <CardDescription>
              Hier kannst du steuern, wie oft und mit welchen Nachrichten der Cookie-Banner erscheint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chance">Erscheinungswahrscheinlichkeit (0.0 bis 1.0)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="chance"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.cookie_banner_chance}
                  onChange={(e) => setSettings(prev => ({ ...prev, cookie_banner_chance: parseFloat(e.target.value) }))}
                  className="max-w-[200px]"
                />
                <span className="text-sm text-muted-foreground">
                  Aktuell: {(settings.cookie_banner_chance * 100).toFixed(0)}% Chance pro Sitzung.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Cookie-Nachrichten</Label>
              <div className="space-y-3">
                {settings.cookie_messages.map((msg, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={msg}
                      onChange={(e) => {
                        const newMsgs = [...settings.cookie_messages]
                        newMsgs[index] = e.target.value
                        setSettings(prev => ({ ...prev, cookie_messages: newMsgs }))
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveMessage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Textarea
                  placeholder="Neue Nachricht hinzufügen..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddMessage} disabled={!newMessage.trim()} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" /> Hinzufügen
                </Button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Werbe-/Abi-Gag-Nachrichten (ohne Cookie-Bezug)</Label>
              <div className="space-y-3">
                {settings.ad_messages.map((msg, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={msg}
                      onChange={(e) => {
                        const newMsgs = [...settings.ad_messages]
                        newMsgs[index] = e.target.value
                        setSettings(prev => ({ ...prev, ad_messages: newMsgs }))
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveAdMessage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Textarea
                  placeholder="Neue Werbe-/Abi-Gag-Nachricht hinzufügen..."
                  value={newAdMessage}
                  onChange={(e) => setNewAdMessage(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddAdMessage} disabled={!newAdMessage.trim()} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" /> Hinzufügen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Lehrer-Sammelkarten (Easter Egg)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSyncRarities} disabled={syncing || saving}>
                  {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                  Raritäten Sync
                </Button>
                <Badge variant="secondary">
                  {(settings.loot_teachers || []).length} / 100
                </Badge>
              </div>
            </div>
            <CardDescription>
              Verwalte die Lehrer, die aus den Sammelkarten-Packungen gezogen werden können.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end pt-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="teacher-name" className="text-xs">Neuer Lehrer Name</Label>
                  <Input
                    id="teacher-name"
                    placeholder="z.B. Herr Schmidt"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTeacher()}
                  />
                </div>
                <div className="sm:w-[200px] space-y-2">
                  <Label htmlFor="teacher-rarity" className="text-xs">Seltenheit</Label>
                  <select
                    id="teacher-rarity"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={newTeacherRarity}
                    onChange={(e) => setNewTeacherRarity(e.target.value as TeacherRarity)}
                  >
                    <option value="common">Gewöhnlich (Grau)</option>
                    <option value="rare">Selten (Grün)</option>
                    <option value="epic">Episch (Lila)</option>
                    <option value="mythic">Mythisch (Rot)</option>
                    <option value="legendary">Legendär (Gelb)</option>
                  </select>
                </div>
                <Button onClick={handleAddTeacher} disabled={!newTeacherName.trim() || (settings.loot_teachers || []).length >= 100} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Hinzufügen
                </Button>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Lehrer suchen..."
                    className="pl-9"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </div>

                <div className="rounded-md border bg-muted/20">
                  <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-primary/10">
                    {filteredTeachers.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground italic">
                        Keine Lehrer gefunden.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredTeachers.map((teacher) => {
                          const originalIndex = settings.loot_teachers.findIndex(t => t === teacher)
                          const liveData = votingData[teacher.id]
                          return (
                            <div key={`${teacher.name}-${originalIndex}`} className="flex items-center justify-between p-2 rounded-lg border bg-background group">
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs truncate">{teacher.name}</span>
                                  {liveData && liveData.count > 0 && (
                                    <Badge variant="outline" className="h-4 text-[8px] px-1 bg-primary/5 border-primary/10">
                                      Ø {liveData.avg.toFixed(2)} ({liveData.count} 🗳️)
                                    </Badge>
                                  )}
                                </div>
                                <span className={`text-[9px] font-black uppercase ${getRarityColor(teacher.rarity)}`}>
                                  {getRarityLabel(teacher.rarity)}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-primary hover:bg-primary/10 h-7 w-7 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleEditTeacher(teacher)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 h-7 w-7 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemoveTeacher(originalIndex)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 text-[10px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-3 w-3" />
              Upgrade: 4 Klicks (33% +1, 10% +2) | Reveal: 5. Klick
            </div>
            <span>Limit: 100 Lehrer</span>
          </CardFooter>
        </Card>
      </div>

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
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={editingTeacher?.rarity || 'common'}
                onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, rarity: e.target.value as TeacherRarity } : null)}
              >
                <option value="common">Gewöhnlich (Grau)</option>
                <option value="rare">Selten (Grün)</option>
                <option value="epic">Episch (Lila)</option>
                <option value="mythic">Mythisch (Rot)</option>
                <option value="legendary">Legendär (Gelb)</option>
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
  )
}
