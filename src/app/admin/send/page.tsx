'use client'

import { useEffect, useState, Suspense } from 'react'
import { db, functions } from '@/lib/firebase'
import { collection, query, onSnapshot, getDocs, where, doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UniversalBanner } from '@/components/layout/UniversalBanner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { 
  Gift, MessageSquare, Info, Star, ArrowLeft, 
  Send, Users, Layout, X, Loader2, Copy, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { Profile } from '@/types/database'
import { getAllCards, getCard } from '@/constants/cardRegistry'
import { CardRenderer } from '@/components/cards/CardRenderer'
import { CardData } from '@/types/cards'
import { ResolvedCard } from '@/types/registry'

type PopupActionType = 'gift' | 'custom_gift' | 'multicast'
type NotificationKind = 'popup' | 'banner' | 'quickmessage'
type NotificationIconKind = 'gift' | 'info' | 'star' | 'message'
type CardVariant = 'normal' | 'holo' | 'shiny' | 'black_shiny_holo'

type CustomPackSlot = {
  slotIndex: number
  teacherId: string
  variant: CardVariant
}

type CustomPackPreset = {
  id: string
  name: string
  allowRandomFill?: boolean
  slots: CustomPackSlot[]
}

type LootTeacherOption = {
  id: string
  name: string
}

type MessageTemplate = {
  id: string
  label: string
  title: string
  body: string
  ctaLabel: string
  ctaUrl: string
  dismissLabel: string
  packCount?: number
}

const COMMUNICATION_TEMPLATES: MessageTemplate[] = [
  {
    id: 'packs-standard',
    label: 'Pack-Schenkung',
    title: 'Neue Pack-Schenkung',
    body: 'Du hast zusätzliche Packs erhalten. Viel Spaß beim Öffnen!',
    ctaLabel: 'Zu den Packs',
    ctaUrl: '/sammelkarten',
    dismissLabel: 'Okay',
    packCount: 1,
  },
  {
    id: 'packs-event',
    label: 'Event-Belohnung',
    title: 'Belohnung freigeschaltet',
    body: 'Danke für deinen Einsatz! Als Belohnung warten neue Booster auf dich.',
    ctaLabel: 'Belohnung öffnen',
    ctaUrl: '/sammelkarten',
    dismissLabel: 'Danke',
    packCount: 2,
  },
  {
    id: 'info-deadline',
    label: 'Deadline-Info',
    title: 'Wichtige Frist',
    body: 'Bitte prüfe die aktuellen Aufgaben und bestätige deinen Status bis heute Abend.',
    ctaLabel: 'Zu den Aufgaben',
    ctaUrl: '/todos',
    dismissLabel: 'Verstanden',
  },
]

const NOTIFICATION_ICON_OPTIONS: Array<{ key: NotificationIconKind; label: string }> = [
  { key: 'gift', label: 'Geschenk' },
  { key: 'info', label: 'Info' },
  { key: 'star', label: 'Highlight' },
  { key: 'message', label: 'Nachricht' },
]

const DEFAULT_CUSTOM_SLOTS: CustomPackSlot[] = [
  { slotIndex: 0, teacherId: '', variant: 'normal' },
  { slotIndex: 1, teacherId: '', variant: 'normal' },
  { slotIndex: 2, teacherId: '', variant: 'normal' },
]

const CARD_VARIANT_OPTIONS: Array<{ value: CardVariant; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'holo', label: 'Holo' },
  { value: 'shiny', label: 'Shiny' },
  { value: 'black_shiny_holo', label: 'Black Shiny Holo' },
]

function AdminSendContent() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [recipients, setRecipients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  // Form State
  const [popupActionType, setPopupActionType] = useState<PopupActionType>('gift')
  const [giftPackId, setGiftPackId] = useState('teacher_vol1')
  const [giftPackCount, setGiftPackCount] = useState(1)
  const [giftMessage, setGiftMessage] = useState('Ihr habt neue Packs geschenkt bekommen. Viel Spaß beim Öffnen!')
  const [giftPopupTitle, setGiftPopupTitle] = useState('Neue Pack-Schenkung')
  const [giftPopupBody, setGiftPopupBody] = useState('Du hast zusätzliche Packs erhalten.')
  const [giftCtaLabel, setGiftCtaLabel] = useState('Zu den Packs')
  const [giftCtaUrl, setGiftCtaUrl] = useState('/sammelkarten')
  const [giftDismissLabel, setGiftDismissLabel] = useState('Okay')
  const [giftSenderName, setGiftSenderName] = useState('')
  const [sendAsSystem, setSendAsSystem] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationKind>('popup')
  const [notificationIcon, setNotificationIcon] = useState<NotificationIconKind>('gift')
  const [customPackName, setCustomPackName] = useState('Custom Pack')
  const [customPackPresetId, setCustomPackPresetId] = useState('')
  const [customPackAllowRandomFill, setCustomPackAllowRandomFill] = useState(true)
  const [customPackSlots, setCustomPackSlots] = useState<CustomPackSlot[]>(DEFAULT_CUSTOM_SLOTS)
  const [customPackPresets, setCustomPackPresets] = useState<CustomPackPreset[]>([])
  const [availableCards, setAvailableCards] = useState<ResolvedCard[]>([])

  const canManage = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  const effectiveSenderName = sendAsSystem
    ? 'System'
    : (giftSenderName.trim() || profile?.full_name?.trim() || 'Admin Team')

  const previewIcon = notificationIcon === 'gift'
    ? <Gift className="h-5 w-5" />
    : notificationIcon === 'info'
      ? <Info className="h-5 w-5" />
      : notificationIcon === 'star'
        ? <Star className="h-5 w-5" />
        : <MessageSquare className="h-5 w-5" />

  const autoResizeTextarea = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const applyTemplate = (template: MessageTemplate) => {
    setGiftPopupTitle(template.title)
    setGiftPopupBody(template.body)
    setGiftCtaLabel(template.ctaLabel)
    setGiftCtaUrl(template.ctaUrl)
    setGiftDismissLabel(template.dismissLabel)
    if ((popupActionType === 'gift' || popupActionType === 'custom_gift') && typeof template.packCount === 'number') {
      setGiftPackCount(template.packCount)
    }
  }

  const setSenderPreset = (preset: 'system' | 'admin' | 'me') => {
    if (preset === 'system') {
      setSendAsSystem(true)
      return
    }

    setSendAsSystem(false)
    if (preset === 'me') {
      setGiftSenderName(profile?.full_name || '')
      return
    }

    setGiftSenderName('Admin Team')
  }

  const updateCustomSlot = (slotIndex: number, field: 'teacherId' | 'variant', value: string) => {
    setCustomPackSlots((prev) => prev.map((slot) => {
      if (slot.slotIndex !== slotIndex) return slot
      if (field === 'teacherId') return { ...slot, teacherId: value }
      return { ...slot, variant: value as CardVariant }
    }))
  }

  const applyCustomPreset = (presetId: string) => {
    setCustomPackPresetId(presetId)
    const preset = customPackPresets.find((entry) => entry.id === presetId)
    if (!preset) return

    setCustomPackName(preset.name)
    setCustomPackAllowRandomFill(preset.allowRandomFill !== false)

    const normalizedSlots = DEFAULT_CUSTOM_SLOTS.map((defaultSlot) => {
      const existing = preset.slots.find((slot) => slot.slotIndex === defaultSlot.slotIndex)
      if (!existing) return defaultSlot
      return {
        slotIndex: defaultSlot.slotIndex,
        teacherId: existing.teacherId,
        variant: existing.variant || 'normal',
      }
    })

    setCustomPackSlots(normalizedSlots)
  }

  useEffect(() => {
    if (!authLoading && (!profile || !canManage)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
      return
    }

    const loadRecipients = async () => {
      // 1. Try sessionStorage (for bulk actions)
      const storedIds = sessionStorage.getItem('admin_send_recipients')
      // 2. Try query param (for single user actions)
      const queryId = searchParams.get('u')
      
      let targetIds: string[] = []
      if (storedIds) {
        try {
          targetIds = JSON.parse(storedIds)
        } catch {
          console.error("Failed to parse stored IDs")
        }
      } else if (queryId) {
        targetIds = [queryId]
      }

      if (targetIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        const profilesRef = collection(db, 'profiles')
        // We fetch all profiles and filter manually to avoid complex IN queries if list is long
        // In a real high-scale app, we'd use chunks of 10 or 30 IDs for 'where in'
        const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
          const allProfiles = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Profile))
          const filtered = allProfiles.filter(p => targetIds.includes(p.id))
          setRecipients(filtered)
          setLoading(false)
        }, (error) => {
          console.error('SendAdminPage: Error listening to profiles:', error)
          setLoading(false)
        })
        return () => unsubscribe()
      } catch (error) {
        console.error("Error loading recipients:", error)
        setLoading(false)
      }
    }

    loadRecipients()
  }, [authLoading, profile, canManage, router, searchParams, pathname])

  useEffect(() => {
    if (authLoading || !canManage) return

    const loadCustomPackSettings = async () => {
      try {
        // Load from Registry first (primary)
        const registryCards = getAllCards()
        
        const settingsRef = doc(db, 'settings', 'sammelkarten')
        const settingsSnap = await getDoc(settingsRef)
        
        let allCards: ResolvedCard[] = [...registryCards]

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data() as {
            loot_teachers?: Array<{ id?: string; name?: string }>
            custom_pack_presets?: Array<{
              id?: string
              name?: string
              allowRandomFill?: boolean
              slots?: Array<{ slotIndex?: number; teacherId?: string; variant?: CardVariant }>
            }>
          }

          // Add any cards from Firestore that are not in registry (Legacy fallback)
          if (Array.isArray(settingsData.loot_teachers)) {
            settingsData.loot_teachers.forEach(t => {
              const id = (t.id || t.name || '').trim()
              if (id && !allCards.find(rc => rc.id === id || rc.fullId === id)) {
                // Wrap in a minimal ResolvedCard structure
                allCards.push({
                  id,
                  name: t.name || id,
                  rarity: 'common',
                  type: 'teacher',
                  setId: 'legacy',
                  fullId: id,
                  cardNumber: 'LEG',
                  color: '#64748b',
                  cards: []
                } as any)
              }
            })
          }

          const presets = Array.isArray(settingsData.custom_pack_presets)
            ? settingsData.custom_pack_presets
              .map((preset, index) => {
                const id = (preset?.id || `preset-${index + 1}`).trim()
                const name = (preset?.name || id || `Preset ${index + 1}`).trim()
                const slots = Array.isArray(preset?.slots)
                  ? preset.slots
                    .map((slot) => ({
                      slotIndex: Math.max(0, Math.floor(Number(slot?.slotIndex))),
                      teacherId: (slot?.teacherId || '').trim(),
                      variant: (slot?.variant || 'normal') as CardVariant,
                    }))
                    .filter((slot) => slot.teacherId.length > 0)
                  : []

                return {
                  id,
                  name,
                  allowRandomFill: preset?.allowRandomFill !== false,
                  slots,
                } as CustomPackPreset
              })
              .filter((preset) => preset.slots.length > 0)
            : []

          setCustomPackPresets(presets)
        }

        setAvailableCards(allCards)
      } catch (error) {
        console.error('Failed to load custom pack settings:', error)
      }
    }

    loadCustomPackSettings()
  }, [authLoading, canManage])

  const handleSend = async () => {
    if (!user || recipients.length === 0) return

    const normalizedPopupTitle = giftPopupTitle.trim()
    const normalizedPopupBody = giftPopupBody.trim()
    const normalizedCtaLabel = giftCtaLabel.trim()
    const normalizedCtaUrl = giftCtaUrl.trim()
    const normalizedDismissLabel = giftDismissLabel.trim()
    const trimmedMessage = giftMessage.trim() || normalizedPopupBody

    if (!normalizedPopupTitle || !normalizedPopupBody || !normalizedCtaLabel || !normalizedDismissLabel) {
      toast.error('Bitte alle Popup-Texte ausfüllen.')
      return
    }

    if (!normalizedCtaUrl.startsWith('/')) {
      toast.error('Der Link muss mit "/" beginnen, z.B. /sammelkarten')
      return
    }

    const isGiftFlow = popupActionType === 'gift' || popupActionType === 'custom_gift'
    const normalizedPackCount = isGiftFlow ? Math.floor(giftPackCount) : 0
    const normalizedCustomSlots = customPackSlots
      .map((slot) => ({
        slotIndex: Math.floor(slot.slotIndex),
        teacherId: slot.teacherId.trim(),
        variant: slot.variant,
      }))
      .filter((slot) => slot.teacherId.length > 0)

    if (popupActionType === 'custom_gift') {
      if (normalizedPackCount <= 0) {
        toast.error('Custom Packs brauchen mindestens 1 Pack pro Empfänger.')
        return
      }
      if (normalizedCustomSlots.length === 0) {
        toast.error('Bitte mindestens einen Custom-Slot mit Lehrer definieren.')
        return
      }
    }
    
    setSending(true)
    try {
      const giftBoosterPack = httpsCallable(functions, 'giftBoosterPack')
      const response = await giftBoosterPack({
        userIds: recipients.map(r => r.id),
        packCount: normalizedPackCount,
        packId: isGiftFlow ? giftPackId : null,
        customMessage: trimmedMessage,
        popupTitle: normalizedPopupTitle,
        popupBody: normalizedPopupBody,
        ctaLabel: normalizedCtaLabel,
        ctaUrl: normalizedCtaUrl,
        dismissLabel: normalizedDismissLabel,
        senderName: effectiveSenderName,
        notificationType,
        notificationIcon,
        requestId: crypto.randomUUID(),
        customPackPresetId: popupActionType === 'custom_gift' ? (customPackPresetId || null) : null,
        customPackName: popupActionType === 'custom_gift' ? customPackName.trim() : null,
        customPackAllowRandomFill: popupActionType === 'custom_gift' ? customPackAllowRandomFill : null,
        customPackSlots: popupActionType === 'custom_gift' ? normalizedCustomSlots : [],
      })

      const payload = (response.data || {}) as { giftedCount?: number; failedUserIds?: string[] }
      const giftedCount = payload.giftedCount || 0
      const failedCount = (payload.failedUserIds || []).length

      await logAction('BOOSTER_GIFT_SENT', user.uid, profile?.full_name, {
        recipients: recipients.map(r => r.id),
        pack_count: normalizedPackCount,
        pack_id: isGiftFlow ? giftPackId : null,
        message: trimmedMessage,
        popup_type: popupActionType,
        sender_name: effectiveSenderName,
        custom_pack_enabled: popupActionType === 'custom_gift',
        custom_pack_name: popupActionType === 'custom_gift' ? customPackName.trim() : null,
        custom_pack_preset: popupActionType === 'custom_gift' ? (customPackPresetId || null) : null,
      })

      if (failedCount > 0) {
        toast.warning(`${giftedCount} Nutzer benachrichtigt, ${failedCount} fehlgeschlagen.`)
      } else {
        toast.success('Nachricht erfolgreich versendet!')
      }

      // Cleanup and redirect
      sessionStorage.removeItem('admin_send_recipients')
      router.push('/admin')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Versand fehlgeschlagen.')
    } finally {
      setSending(false)
    }
  }

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id))
  }

  const copyRecipientValue = async (value: string | null | undefined, label: string) => {
    const normalized = (value || '').trim()
    if (!normalized) {
      toast.info(`${label} nicht vorhanden.`)
      return
    }

    try {
      await navigator.clipboard.writeText(normalized)
      toast.success(`${label} kopiert.`)
    } catch {
      toast.error(`${label} konnte nicht kopiert werden.`)
    }
  }

  const selectAdminMain = async () => {
    try {
      const q = query(collection(db, 'profiles'), where('role', 'in', ['admin_main']))
      const querySnapshot = await getDocs(q)
      const admins = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile))
      
      setRecipients(prev => {
        const newRecipients = [...prev]
        let addedCount = 0
        admins.forEach(admin => {
          if (!newRecipients.find(r => r.id === admin.id)) {
            newRecipients.push(admin)
            addedCount++
          }
        })
        if (addedCount > 0) {
          toast.success(`${addedCount} Admins hinzugefügt.`)
        } else {
          toast.info('Alle Admins sind bereits in der Liste.')
        }
        return newRecipients
      })
    } catch (error) {
      console.error("Error fetching admin_main:", error)
      toast.error("Fehler beim Laden der Admins.")
    }
  }

  if (authLoading || loading) {
    return <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Lade Kommunikations-Zentrale...</p>
    </div>
  }

  return (
    <div className="container mx-auto py-8 space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <Button 
          variant="link" 
          size="sm" 
          onClick={() => router.push('/admin')} 
          className="w-fit h-auto p-0 text-muted-foreground hover:text-primary gap-1 no-underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Zurück zur Verwaltung
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                Kommunikations-Zentrale
              </h1>
              <p className="text-muted-foreground text-sm">Popups und Belohnungen an Nutzer senden.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 h-8 px-3 gap-2">
              <Users className="h-3.5 w-3.5" />
              {recipients.length} Empfänger
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-5 w-5 text-primary" />
                Inhalt konfigurieren
              </CardTitle>
              <CardDescription>Wähle den Typ und den Text der Nachricht.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Schnellvorlagen</p>
                  <span className="text-[10px] text-muted-foreground">1 Klick fuellt Titel, Text und Buttons</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMUNICATION_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyTemplate(template)}
                      className="h-8"
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notification-Art</p>
                  <span className="text-[10px] text-muted-foreground">Popup, Banner oder Quickmessage</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant={notificationType === 'popup' ? 'default' : 'outline'} onClick={() => setNotificationType('popup')}>Popup</Button>
                  <Button type="button" size="sm" variant={notificationType === 'banner' ? 'default' : 'outline'} onClick={() => setNotificationType('banner')}>Banner</Button>
                  <Button type="button" size="sm" variant={notificationType === 'quickmessage' ? 'default' : 'outline'} onClick={() => setNotificationType('quickmessage')}>Quickmessage</Button>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Icon-Auswahl</p>
                  <span className="text-[10px] text-muted-foreground">Welches Icon in der Nachricht verwendet wird</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NOTIFICATION_ICON_OPTIONS.map((entry) => (
                    <Button
                      key={entry.key}
                      type="button"
                      size="sm"
                      variant={notificationIcon === entry.key ? 'default' : 'outline'}
                      onClick={() => setNotificationIcon(entry.key)}
                    >
                      {entry.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Tabs value={popupActionType} onValueChange={(v) => setPopupActionType(v as PopupActionType)} className="w-full">
                <TabsList className="grid w-fit grid-cols-3 mb-8 bg-muted/50 p-1">
                  <TabsTrigger value="gift" className="gap-2 px-6">
                    <Gift className="h-4 w-4" />
                    Packs verschenken
                  </TabsTrigger>
                  <TabsTrigger value="custom_gift" className="gap-2 px-6">
                    <Star className="h-4 w-4" />
                    Custom Packs
                  </TabsTrigger>
                  <TabsTrigger value="multicast" className="gap-2 px-6">
                    <MessageSquare className="h-4 w-4" />
                    Multicast Nachricht
                  </TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    {(popupActionType === 'gift' || popupActionType === 'custom_gift') && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label htmlFor="gift-pack-id" className="font-bold">Booster-Set auswählen</Label>
                          <select
                            id="gift-pack-id"
                            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            value={giftPackId}
                            onChange={(e) => setGiftPackId(e.target.value)}
                          >
                            <option value="teacher_vol1">Lehrer Set v1 (Standard)</option>
                            <option value="support_vol_1">Support Set Vol. 1</option>
                          </select>
                          <p className="text-[10px] text-muted-foreground">Bestimmt, aus welchem Pool die Karten gezogen werden.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gift-pack-count" className="font-bold">Anzahl Packs pro Person</Label>
                          <Input
                            id="gift-pack-count"
                            type="number"
                            min={0}
                            max={50}
                            className="h-11 text-lg font-mono"
                            value={giftPackCount}
                            onChange={(e) => setGiftPackCount(Number(e.target.value) || 0)}
                          />
                          <p className="text-[10px] text-muted-foreground">Maximale Schenkung: 50 Packs</p>
                        </div>
                      </div>
                    )}

                    {popupActionType === 'custom_gift' && (
                      <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-pack-preset" className="font-bold">Preset laden (optional)</Label>
                          <select
                            id="custom-pack-preset"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={customPackPresetId}
                            onChange={(e) => applyCustomPreset(e.target.value)}
                          >
                            <option value="">Kein Preset</option>
                            {customPackPresets.map((preset) => (
                              <option key={preset.id} value={preset.id}>{preset.name}</option>
                            ))}
                          </select>
                          {customPackPresets.length === 0 && (
                            <p className="text-[10px] text-muted-foreground">Keine Presets in settings/sammelkarten.custom_pack_presets gefunden.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="custom-pack-name" className="font-bold">Custom Pack Name</Label>
                          <Input
                            id="custom-pack-name"
                            value={customPackName}
                            onChange={(e) => setCustomPackName(e.target.value)}
                            maxLength={60}
                            placeholder="z.B. Mathe-Legenden"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            id="custom-pack-random-fill"
                            type="checkbox"
                            checked={customPackAllowRandomFill}
                            onChange={(e) => setCustomPackAllowRandomFill(e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                          />
                          <Label htmlFor="custom-pack-random-fill" className="font-bold">Freie Slots mit Zufall auffüllen</Label>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Slots (Position, Karte, Folie)</p>
                          {customPackSlots.map((slot) => {
                            const selectedCard = availableCards.find(c => c.fullId === slot.teacherId || c.id === slot.teacherId)
                            const cardData: CardData | null = selectedCard ? {
                              id: selectedCard.id,
                              setId: selectedCard.setId,
                              fullId: selectedCard.fullId,
                              name: selectedCard.name,
                              rarity: selectedCard.rarity,
                              variant: slot.variant,
                              color: selectedCard.color,
                              cardNumber: selectedCard.cardNumber,
                              style: selectedCard.style,
                              description: selectedCard.description,
                              hp: (selectedCard as any).hp,
                              attacks: (selectedCard as any).attacks
                            } : null

                            return (
                              <div key={slot.slotIndex} className="grid grid-cols-1 gap-4 rounded-xl border bg-background/80 p-4 md:grid-cols-4 items-start">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black uppercase opacity-50">Slot {slot.slotIndex + 1}</Label>
                                  <div className="h-24 w-full flex items-center justify-center bg-muted/30 rounded-lg border border-dashed relative overflow-hidden">
                                    {cardData ? (
                                      <CardRenderer 
                                        data={cardData} 
                                        className="w-16 h-auto scale-75"
                                        isFlippedExternally={true}
                                        interactive={false}
                                      />
                                    ) : (
                                      <Layout className="h-6 w-6 text-muted-foreground/20" />
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-[10px] font-black uppercase opacity-50">Karte auswählen</Label>
                                  <select
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={slot.teacherId}
                                    onChange={(e) => updateCustomSlot(slot.slotIndex, 'teacherId', e.target.value)}
                                  >
                                    <option value="">Bitte wählen</option>
                                    {availableCards.map((card) => (
                                      <option key={card.fullId} value={card.fullId}>
                                        {card.setId === 'legacy' ? '' : `[${card.setId.split('_')[0].toUpperCase()}] `}{card.name} ({card.rarity})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black uppercase opacity-50">Variante</Label>
                                  <select
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={slot.variant}
                                    onChange={(e) => updateCustomSlot(slot.slotIndex, 'variant', e.target.value)}
                                  >
                                    {CARD_VARIANT_OPTIONS.map((variant) => (
                                      <option key={variant.value} value={variant.value}>{variant.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="gift-popup-title" className="font-bold">Popup-Titel</Label>
                      <textarea
                        id="gift-popup-title"
                        className="flex min-h-[44px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={giftPopupTitle}
                        onChange={(e) => setGiftPopupTitle(e.target.value)}
                        onInput={autoResizeTextarea}
                        maxLength={80}
                        placeholder="Wichtiges Update"
                        rows={1}
                      />
                      <p className="text-[10px] text-right text-muted-foreground">{giftPopupTitle.length}/80</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gift-popup-body" className="font-bold">Popup-Haupttext</Label>
                      <textarea
                        id="gift-popup-body"
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={giftPopupBody}
                        onChange={(e) => setGiftPopupBody(e.target.value)}
                        maxLength={200}
                        placeholder="Hier steht die eigentliche Nachricht..."
                      />
                      <p className="text-[10px] text-right text-muted-foreground">{giftPopupBody.length}/200</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="gift-message" className="font-bold text-amber-600">Interner Log-Kommentar</Label>
                      <textarea
                        id="gift-message"
                        className="flex min-h-[44px] w-full resize-none overflow-hidden rounded-md border border-amber-200 bg-amber-50/30 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        onInput={autoResizeTextarea}
                        placeholder="Grund der Schenkung..."
                        rows={1}
                      />
                    </div>

                    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <div className="space-y-2">
                        <Label className="font-bold">Absender-Presets</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => setSenderPreset('system')}>System</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setSenderPreset('admin')}>Admin Team</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setSenderPreset('me')}>Mein Name</Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id="send-as-system"
                          type="checkbox"
                          checked={sendAsSystem}
                          onChange={(e) => setSendAsSystem(e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <Label htmlFor="send-as-system" className="font-bold">Als System senden</Label>
                      </div>
                      {!sendAsSystem && (
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <Label htmlFor="gift-sender-name" className="font-bold">Absender-Anzeigename</Label>
                          <textarea
                            id="gift-sender-name"
                            className="flex min-h-[44px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={giftSenderName}
                            onChange={(e) => setGiftSenderName(e.target.value)}
                            onInput={autoResizeTextarea}
                            maxLength={40}
                            placeholder={profile?.full_name || 'Admin Team'}
                            rows={1}
                          />
                          <p className="text-[10px] text-muted-foreground">Wird beim Empfänger als Absender angezeigt. {giftSenderName.length}/40</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gift-popup-cta-label" className="font-bold">Button-Text</Label>
                        <textarea
                          id="gift-popup-cta-label"
                          className="flex min-h-[44px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={giftCtaLabel}
                          onChange={(e) => setGiftCtaLabel(e.target.value)}
                          onInput={autoResizeTextarea}
                          maxLength={40}
                          rows={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gift-popup-dismiss-label" className="font-bold">Schließen-Text</Label>
                        <textarea
                          id="gift-popup-dismiss-label"
                          className="flex min-h-[44px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={giftDismissLabel}
                          onChange={(e) => setGiftDismissLabel(e.target.value)}
                          onInput={autoResizeTextarea}
                          maxLength={30}
                          rows={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gift-popup-cta-url" className="font-bold">Link-Ziel (URL)</Label>
                      <textarea
                        id="gift-popup-cta-url"
                        className="flex min-h-[44px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={giftCtaUrl}
                        onChange={(e) => setGiftCtaUrl(e.target.value)}
                        onInput={autoResizeTextarea}
                        placeholder="/sammelkarten"
                        rows={1}
                      />
                    </div>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Empfänger-Liste
              </CardTitle>
              <Button variant="link" size="sm" onClick={selectAdminMain} className="h-auto p-0 text-xs"> 
                <Star className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" /> Admin Main hinzufügen 
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[260px] overflow-y-auto p-1">
                {recipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Keine Empfänger ausgewählt.</p>
                ) : (
                  recipients.map((r) => (
                    <ContextMenu key={r.id}>
                      <ContextMenuTrigger asChild>
                        <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 shadow-sm cursor-context-menu">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{r.full_name || r.email}</p>
                            <p className="truncate text-xs text-muted-foreground">{r.email || r.id}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 rounded-full hover:bg-destructive hover:text-white transition-colors"
                            onClick={() => removeRecipient(r.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-56">
                        <ContextMenuLabel>{r.full_name || r.email || r.id}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => copyRecipientValue(r.full_name, 'Name')}>
                          <Copy className="h-4 w-4" />
                          Name kopieren
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => copyRecipientValue(r.email, 'E-Mail')}>
                          <Copy className="h-4 w-4" />
                          E-Mail kopieren
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => copyRecipientValue(r.id, 'User-ID')}>
                          <Copy className="h-4 w-4" />
                          User-ID kopieren
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem variant="destructive" onClick={() => removeRecipient(r.id)}>
                          <Trash2 className="h-4 w-4" />
                          Aus Liste entfernen
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview & Submit */}
        <div className="space-y-6">
          <Card className="sticky top-8 shadow-xl border-primary/20 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Live-Vorschau
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center relative min-h-[300px]">
              <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(white,transparent)] -z-10" />

              {notificationType === 'popup' && (
                <div className="w-full rounded-xl border bg-background/95 p-4 shadow-2xl backdrop-blur">
                  <UniversalBanner
                    tone={popupActionType === 'multicast' ? 'info' : 'primary'}
                    layout="floating"
                    title={giftPopupTitle || 'Titel'}
                    message={giftPopupBody || 'Hauptnachricht...'}
                    icon={previewIcon}
                    actions={
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-1 min-w-0 italic text-xs text-muted-foreground break-words pr-2">{effectiveSenderName}</span>
                        <div className="flex items-center gap-2">
                          {giftCtaLabel && (
                            <Button size="sm" variant="default" className="pointer-events-none">
                              {giftCtaLabel}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="pointer-events-none">
                            {giftDismissLabel || 'Schließen'}
                          </Button>
                        </div>
                      </div>
                    }
                    className="w-full shadow-none border-primary/20 animate-none"
                  />
                </div>
              )}

              {notificationType === 'banner' && (
                <div className="w-full space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Top-Banner Vorschau</div>
                  <UniversalBanner
                    tone={popupActionType === 'multicast' ? 'info' : 'primary'}
                    layout="inline"
                    title={giftPopupTitle || 'Titel'}
                    message={giftPopupBody || 'Hauptnachricht...'}
                    icon={previewIcon}
                    actions={
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-1 min-w-0 italic text-xs text-muted-foreground break-words pr-2">{effectiveSenderName}</span>
                        <div className="flex items-center gap-2">
                          {giftCtaLabel && (
                            <Button size="sm" variant="default" className="pointer-events-none">
                              {giftCtaLabel}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="pointer-events-none">
                            {giftDismissLabel || 'Schließen'}
                          </Button>
                        </div>
                      </div>
                    }
                    className="w-full border-primary/20"
                  />
                </div>
              )}

              {notificationType === 'quickmessage' && (
                <div className="w-full flex justify-end">
                  <div className="max-w-[360px] w-full rounded-xl border bg-background p-3 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 text-primary p-2">{previewIcon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-tight">{giftPopupTitle || 'Titel'}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{giftPopupBody || 'Hauptnachricht...'}</p>
                        <p className="mt-2 italic text-[11px] text-muted-foreground break-words">{effectiveSenderName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12 w-full space-y-4 pt-6 border-t border-dashed">
                <div className="bg-background rounded-xl p-4 border shadow-inner">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase mb-2">Zusammenfassung</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Empfänger:</span>
                      <span className="font-bold">{recipients.length} Nutzer</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Typ:</span>
                      <span className="font-bold">{popupActionType === 'multicast' ? 'Information' : 'Belohnung'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Notification:</span>
                      <span className="font-bold">{notificationType}</span>
                    </div>
                    {popupActionType === 'custom_gift' && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span>Custom Pack:</span>
                          <span className="font-bold">{customPackName || 'Custom Pack'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Fixe Slots:</span>
                          <span className="font-bold">{customPackSlots.filter((slot) => slot.teacherId.trim().length > 0).length}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-xs">
                      <span>Absender:</span>
                      <span className="font-bold">{effectiveSenderName}</span>
                    </div>
                    {(popupActionType === 'gift' || popupActionType === 'custom_gift') && (
                      <div className="flex justify-between text-xs">
                        <span>Booster-Set:</span>
                        <span className="font-bold text-primary">
                          {giftPackId === 'support_vol_1' ? 'Support Set Vol. 1' : 'Lehrer Set v1'}
                        </span>
                      </div>
                    )}
                    {(popupActionType === 'gift' || popupActionType === 'custom_gift') && (
                      <div className="flex justify-between text-xs">
                        <span>Packs gesamt:</span>
                        <span className="font-bold text-primary">{recipients.length * giftPackCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg font-bold gap-3 shadow-lg shadow-primary/20"
                  disabled={sending || recipients.length === 0}
                  onClick={handleSend}
                >
                  {sending ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Sende...</>
                  ) : (
                    <><Send className="h-5 w-5" /> Nachricht jetzt senden</>
                  )}
                </Button>
                
                <p className="text-[9px] text-center text-muted-foreground px-4 leading-relaxed">
                  Nach dem Klick wird die Notification für alle Empfänger sofort in der Datenbank hinterlegt und beim nächsten Seitenaufruf angezeigt.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

export default function AdminSendPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Initialisiere...</p>
      </div>
    }>
      <AdminSendContent />
    </Suspense>
  )
}
