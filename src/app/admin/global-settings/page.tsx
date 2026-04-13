'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, setDoc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, RotateCcw, Cookie, GraduationCap, Sparkles, Construction, Users, Save } from 'lucide-react'
import { logAction } from '@/lib/logging'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Profile } from '@/types/database'

interface CustomPopupMessage {
  id: string
  title: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  dismissLabel?: string
  chance?: number
  enabled?: boolean
  routes?: string[]
}

interface PlanningGroupRow {
  id: string
  before: string
  after: string
  leaderUserId: string
}

interface GlobalSettings {
  cookie_banner_chance: number
  ad_banner_chance: number
  cookie_messages: string[]
  ad_messages: string[]
  custom_popup_messages: CustomPopupMessage[]
  maintenance?: {
    start: string | null
    end?: string | null
    active: boolean
    message?: string
  }
  loot_teachers?: any[] // Legacy, moved to settings/sammelkarten
}

const DEFAULT_SETTINGS: GlobalSettings = {
  cookie_banner_chance: 0.3,
  ad_banner_chance: 0.3,
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
  custom_popup_messages: [
    {
      id: 'info-welcome',
      title: 'Willkommen im ABI Planer!',
      body: 'Hier kannst du alles rund um Abi-Events, Finanzen und Organisation verwalten. Viel Erfolg beim Planen!',
      dismissLabel: 'Schließen',
      chance: 1,
      enabled: true,
      routes: ['*'],
    },
    {
      id: 'cta-finance',
      title: 'Finanzen im Blick behalten',
      body: 'Denkt daran, regelmäßig eure Einnahmen und Ausgaben zu prüfen, damit am Ende alles passt.',
      ctaLabel: 'Zu den Finanzen',
      ctaUrl: '/finanzen',
      dismissLabel: 'Später',
      chance: 0.5,
      enabled: true,
      routes: ['/', '/finanzen'],
    },
    {
      id: 'warn-deadline',
      title: 'Wichtige Frist steht an!',
      body: 'Vergesst nicht, eure Deadlines für Location, Musik und Catering rechtzeitig zu setzen.',
      dismissLabel: 'Verstanden',
      chance: 0.3,
      enabled: true,
      routes: ['/', '/kalender'],
    },
    {
      id: 'success-packs',
      title: 'Neues Feature: Sammelkarten-Packs!',
      body: 'Ab sofort könnt ihr Lehrer als Sammelkarten in Packs ziehen. Probiert es gleich aus!',
      ctaLabel: 'Zu den Packs',
      ctaUrl: '/sammelkarten',
      dismissLabel: 'Später',
      chance: 0.7,
      enabled: true,
      routes: ['/', '/sammelkarten'],
    },
  ],
  maintenance: {
    start: null,
    end: null,
    active: false,
    message: ''
  }
}

export default function GlobalSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [initialSettings, setInitialSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [newMessage, setNewMessage] = useState('')
  const [newAdMessage, setNewAdMessage] = useState('')
  const [newCustomPopup, setNewCustomPopup] = useState<CustomPopupMessage>({
    id: '',
    title: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    dismissLabel: 'Schließen',
    chance: 0.35,
    enabled: true,
    routes: ['*'],
  })
  const [planningGroupRows, setPlanningGroupRows] = useState<PlanningGroupRow[]>([])
  const [originalGroups, setOriginalGroups] = useState<{ name: string; leader_user_id: string | null }[]>([])
  const [planners, setPlanners] = useState<Profile[]>([])
  const [savingGroups, setSavingGroups] = useState(false)
  const [isGuardOpen, setIsGuardOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  const formatDateForInput = (isoString: string | null | undefined) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return ''
      // Adjust for local timezone to show correct time in datetime-local input
      const offset = date.getTimezoneOffset() * 60000
      const localDate = new Date(date.getTime() - offset)
      return localDate.toISOString().slice(0, 16)
    } catch (e) {
      return ''
    }
  }

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)
  
  // Autosave bei Settings-Änderung
  useEffect(() => {
    if (JSON.stringify(settings) === JSON.stringify(initialSettings)) return
    if (saving) return
    setAutosaveStatus('idle')
    if (autosaveTimeout) clearTimeout(autosaveTimeout)
    const timeout = setTimeout(async () => {
      setAutosaveStatus('saving')
      const ok = await handleSave(settings)
      setAutosaveStatus(ok ? 'success' : 'error')
    }, 1200)
    setAutosaveTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { if (timeout) clearTimeout(timeout) }
  }, [settings])

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
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
      return
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as GlobalSettings
        const loadedSettings = {
          ...DEFAULT_SETTINGS,
          ...data,
          ad_messages: data.ad_messages || DEFAULT_SETTINGS.ad_messages,
          custom_popup_messages: data.custom_popup_messages || DEFAULT_SETTINGS.custom_popup_messages
        }
        setSettings(loadedSettings)
        setInitialSettings(loadedSettings)
      } else {
        setSettings(DEFAULT_SETTINGS)
        setInitialSettings(DEFAULT_SETTINGS)
      }
      setLoading(false)
    }, (error) => {
      console.error('GlobalSettingsPage: Error listening to global settings:', error)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [profile, authLoading, isAdmin, router, pathname])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
      const groups: any[] = snap.exists() ? (snap.data().planning_groups || []) : []
      setOriginalGroups(groups.map((g: any) => ({ name: g.name, leader_user_id: g.leader_user_id || null })))
      setPlanningGroupRows(groups.map((g: any, i: number) => ({
        id: `group-${i}`,
        before: g.name,
        after: g.name,
        leaderUserId: g.leader_user_id || '',
      })))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'profiles'), where('is_approved', '==', true))
    const unsubscribe = onSnapshot(q, (snap) => {
      setPlanners(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Profile))
          .filter(p => p.role === 'planner' || (p.role || '').includes('admin'))
      )
    })
    return () => unsubscribe()
  }, [])

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

  const handleAddCustomPopupMessage = () => {
    const title = newCustomPopup.title.trim()
    const body = newCustomPopup.body.trim()
    const id = (newCustomPopup.id.trim() || `popup-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-_]/g, '-')

    if (!title || !body) return
    if ((newCustomPopup.ctaUrl || '').trim() && !(newCustomPopup.ctaUrl || '').trim().startsWith('/')) {
      toast.error('CTA-Link muss mit "/" beginnen.')
      return
    }

    const updatedSettings = {
      ...settings,
      custom_popup_messages: [
        ...(settings.custom_popup_messages || []),
        {
          id,
          title,
          body,
          ctaLabel: (newCustomPopup.ctaLabel || '').trim() || undefined,
          ctaUrl: (newCustomPopup.ctaUrl || '').trim() || undefined,
          dismissLabel: (newCustomPopup.dismissLabel || '').trim() || 'Schließen',
          chance: typeof newCustomPopup.chance === 'number' ? newCustomPopup.chance : 0.35,
          enabled: newCustomPopup.enabled !== false,
          routes: Array.isArray(newCustomPopup.routes) ? newCustomPopup.routes : ['*'],
        }
      ]
    }

    const old = settings
    setSettings(updatedSettings)
    setNewCustomPopup({
      id: '',
      title: '',
      body: '',
      ctaLabel: '',
      ctaUrl: '',
      dismissLabel: 'Schließen',
      chance: 0.35,
      enabled: true,
      routes: ['*'],
    })
    setTimeout(async () => {
      const ok = await handleSave(updatedSettings)
      if (!ok) setSettings(old)
    }, 0)
  }

  const handleUpdateCustomPopupMessage = <K extends keyof CustomPopupMessage>(index: number, key: K, value: CustomPopupMessage[K]) => {
    const updated = [...(settings.custom_popup_messages || [])]
    updated[index] = { ...updated[index], [key]: value }
    setSettings((prev) => ({ ...prev, custom_popup_messages: updated }))
  }

  const handleRemoveCustomPopupMessage = (index: number) => {
    const updatedSettings = {
      ...settings,
      custom_popup_messages: (settings.custom_popup_messages || []).filter((_, i) => i !== index)
    }
    const old = settings
    setSettings(updatedSettings)
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

  const migratePlanningGroupName = async (from: string, to: string) => {
    const targets = [
      { col: 'profiles', field: 'planning_group' },
      { col: 'todos', field: 'assigned_to_group' },
    ]
    for (const target of targets) {
      const docs = await getDocs(query(collection(db, target.col), where(target.field, '==', from)))
      if (docs.empty) continue
      let batch = writeBatch(db)
      let ops = 0
      for (const d of docs.docs) {
        batch.update(doc(db, target.col, d.id), { [target.field]: to })
        if (++ops >= 400) { await batch.commit(); batch = writeBatch(db); ops = 0 }
      }
      if (ops > 0) await batch.commit()
    }
  }

  const handleSavePlanningGroups = async () => {
    const rows = planningGroupRows.map(r => ({ ...r, after: r.after.trim() }))
    const seen = new Set<string>()
    const planning_groups = rows
      .filter(r => r.after.length > 0 && !seen.has(r.after) && !!seen.add(r.after))
      .map(r => {
        const leader = planners.find(p => p.id === r.leaderUserId)
        return { name: r.after, leader_user_id: leader?.id || null, leader_name: leader?.full_name || null }
      })

    if (planning_groups.length === 0) { toast.error('Mindestens eine Gruppe erforderlich.'); return }
    const renamed = rows.filter(r => r.before.trim().length > 0 && r.after.length > 0 && r.before !== r.after)

    setSavingGroups(true)
    try {
      const affected = new Set<string>()
      originalGroups.forEach(g => { if (g.leader_user_id) affected.add(g.leader_user_id) })
      planning_groups.forEach(g => { if (g.leader_user_id) affected.add(g.leader_user_id) })

      const batch = writeBatch(db)
      for (const uid of Array.from(affected)) {
        const led = planning_groups.filter(g => g.leader_user_id === uid).map(g => g.name)
        batch.update(doc(db, 'profiles', uid), { led_groups: led, is_group_leader: led.length > 0 })
      }
      batch.set(doc(db, 'settings', 'config'), { planning_groups }, { merge: true })
      await batch.commit()

      for (const r of renamed) await migratePlanningGroupName(r.before, r.after)

      toast.success(renamed.length > 0
        ? 'Planungsgruppen aktualisiert und Zuordnungen umbenannt.'
        : 'Planungsgruppen gespeichert.')
      if (user) await logAction('SETTINGS_UPDATED', user.uid, profile?.full_name, {
        field: 'planning_groups', total: planning_groups.length,
        renamed: renamed.map(r => ({ before: r.before, after: r.after }))
      })
    } catch (e) {
      console.error(e)
      toast.error('Fehler beim Speichern der Planungsgruppen.')
    } finally {
      setSavingGroups(false)
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

  return (
    <div className="space-y-6">
      <div className="fixed top-4 right-4 z-50">
        {autosaveStatus === 'saving' && <span className="px-3 py-1 rounded bg-muted text-xs text-muted-foreground">Speichere...</span>}
        {autosaveStatus === 'success' && <span className="px-3 py-1 rounded bg-green-100 text-xs text-green-800">Gespeichert ✓</span>}
        {autosaveStatus === 'error' && <span className="px-3 py-1 rounded bg-red-100 text-xs text-red-800">Fehler beim Speichern!</span>}
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Globale Einstellungen</h1>
          <p className="text-muted-foreground">Verwalte systemweite Parameter und Texte.</p>
        </div>
        <div className="flex gap-2">
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
              <Label htmlFor="chance">Cookie-Banner Erscheinungswahrscheinlichkeit (0.0 bis 1.0)</Label>
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

            <div className="space-y-2 pt-2">
              <Label htmlFor="ad-chance">Werbe-Parodie Erscheinungswahrscheinlichkeit (0.0 bis 1.0)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="ad-chance"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.ad_banner_chance ?? 0.3}
                  onChange={(e) => setSettings(prev => ({ ...prev, ad_banner_chance: parseFloat(e.target.value) }))}
                  className="max-w-[200px]"
                />
                <span className="text-sm text-muted-foreground">
                  Aktuell: {((settings.ad_banner_chance ?? 0.3) * 100).toFixed(0)}% Chance bei jedem Seitenaufruf.
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

            <div className="space-y-4 pt-4 border-t">
              <Label>Custom Popup-Nachrichten (verschiedene Fälle)</Label>
              <p className="text-xs text-muted-foreground">
                Diese Popups erscheinen als Benachrichtigung unten rechts. Du kannst sie pro Route, Chance und CTA konfigurieren.
              </p>

              <div className="space-y-3">
                {(settings.custom_popup_messages || []).map((entry, index) => (
                  <div key={`${entry.id}-${index}`} className="rounded-lg border p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">ID</Label>
                        <Input
                          value={entry.id}
                          onChange={(e) => handleUpdateCustomPopupMessage(index, 'id', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Aktiv</Label>
                        <select
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          value={entry.enabled === false ? 'off' : 'on'}
                          onChange={(e) => handleUpdateCustomPopupMessage(index, 'enabled', e.target.value === 'on')}
                        >
                          <option value="on">Ja</option>
                          <option value="off">Nein</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Titel</Label>
                      <Input
                        value={entry.title}
                        onChange={(e) => handleUpdateCustomPopupMessage(index, 'title', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Text</Label>
                      <Textarea
                        value={entry.body}
                        onChange={(e) => handleUpdateCustomPopupMessage(index, 'body', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">CTA Label</Label>
                        <Input
                          value={entry.ctaLabel || ''}
                          onChange={(e) => handleUpdateCustomPopupMessage(index, 'ctaLabel', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CTA Link</Label>
                        <Input
                          value={entry.ctaUrl || ''}
                          onChange={(e) => handleUpdateCustomPopupMessage(index, 'ctaUrl', e.target.value)}
                          placeholder="/finanzen"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dismiss Text</Label>
                        <Input
                          value={entry.dismissLabel || ''}
                          onChange={(e) => handleUpdateCustomPopupMessage(index, 'dismissLabel', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Chance (0-1)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={typeof entry.chance === 'number' ? entry.chance : 0.35}
                          onChange={(e) => handleUpdateCustomPopupMessage(index, 'chance', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Routen (CSV)</Label>
                        <Input
                          value={(entry.routes || ['*']).join(', ')}
                          onChange={(e) => {
                            const routes = e.target.value.split(',').map((r) => r.trim()).filter(Boolean)
                            handleUpdateCustomPopupMessage(index, 'routes', routes.length > 0 ? routes : ['*'])
                          }}
                          placeholder="*, /, /sammelkarten"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveCustomPopupMessage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
                <Label className="text-xs">Neue Custom Popup-Nachricht</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="ID (optional)"
                    value={newCustomPopup.id}
                    onChange={(e) => setNewCustomPopup((prev) => ({ ...prev, id: e.target.value }))}
                  />
                  <Input
                    placeholder="Titel"
                    value={newCustomPopup.title}
                    onChange={(e) => setNewCustomPopup((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Popup Text"
                  value={newCustomPopup.body}
                  onChange={(e) => setNewCustomPopup((prev) => ({ ...prev, body: e.target.value }))}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="CTA Label"
                    value={newCustomPopup.ctaLabel || ''}
                    onChange={(e) => setNewCustomPopup((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                  />
                  <Input
                    placeholder="CTA Link (/seite)"
                    value={newCustomPopup.ctaUrl || ''}
                    onChange={(e) => setNewCustomPopup((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  />
                  <Input
                    placeholder="Dismiss Text"
                    value={newCustomPopup.dismissLabel || ''}
                    onChange={(e) => setNewCustomPopup((prev) => ({ ...prev, dismissLabel: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={newCustomPopup.chance ?? 0.35}
                    onChange={(e) => setNewCustomPopup((prev) => ({ ...prev, chance: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    placeholder="Routen CSV (*, /, /sammelkarten)"
                    value={(newCustomPopup.routes || ['*']).join(', ')}
                    onChange={(e) => {
                      const routes = e.target.value.split(',').map((r) => r.trim()).filter(Boolean)
                      setNewCustomPopup((prev) => ({ ...prev, routes: routes.length > 0 ? routes : ['*'] }))
                    }}
                  />
                </div>
                <Button onClick={handleAddCustomPopupMessage} disabled={!newCustomPopup.title.trim() || !newCustomPopup.body.trim()}>
                  <Plus className="h-4 w-4 mr-2" /> Custom Popup hinzufügen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="planungsgruppen">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Planungsgruppen
            </CardTitle>
            <CardDescription>
              Verwaltung der Planungsgruppen. Jede Gruppe erscheint als eigener Chat unter /gruppen.
              Umbenennungen werden automatisch in Profilen und Todos übernommen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {planningGroupRows.map((row) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <Input
                    value={row.after}
                    onChange={(e) => setPlanningGroupRows(prev =>
                      prev.map(r => r.id === row.id ? { ...r, after: e.target.value } : r)
                    )}
                    placeholder="z.B. Ballplanung"
                  />
                  <Select
                    value={row.leaderUserId || '__none__'}
                    onValueChange={(v) => setPlanningGroupRows(prev =>
                      prev.map(r => r.id === row.id ? { ...r, leaderUserId: v === '__none__' ? '' : v } : r)
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kein Gruppenleiter">
                        {row.leaderUserId 
                          ? (planners.find(p => p.id === row.leaderUserId)?.full_name || planners.find(p => p.id === row.leaderUserId)?.email || row.leaderUserId)
                          : 'Kein Gruppenleiter'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Kein Gruppenleiter</SelectItem>
                      {planners.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setPlanningGroupRows(prev => prev.filter(r => r.id !== row.id))}
                    disabled={planningGroupRows.length <= 1}
                    title="Gruppe entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="gap-2"
              onClick={() => setPlanningGroupRows(prev => [
                ...prev,
                { id: `group-new-${Date.now()}`, before: '', after: '', leaderUserId: '' }
              ])}>
              <Plus className="h-4 w-4" /> Gruppe hinzufügen
            </Button>
            <div className="flex justify-end">
              <Button onClick={handleSavePlanningGroups} disabled={savingGroups} className="gap-2">
                {savingGroups ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingGroups ? 'Speichern...' : 'Gruppen speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Lehrer-Sammelkarten Suite
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10">Neu</Badge>
            </div>
            <CardDescription>
              Das Sammelkarten-Management wurde in eine eigene Suite verschoben, um mehr Kontrolle über Drop-Rates und Packs zu ermöglichen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/sammelkarten">
              <Button className="w-full sm:w-auto gap-2">
                <Sparkles className="h-4 w-4" />
                Sammelkarten Manager öffnen
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
