'use client'

import { useEffect, useState, Suspense } from 'react'
import { db, functions } from '@/lib/firebase'
import { collection, query, onSnapshot, getDocs, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UniversalBanner } from '@/components/layout/UniversalBanner'
import { 
  Gift, MessageSquare, Info, Star, ArrowLeft, 
  Send, Users, Layout, X, Loader2 
} from 'lucide-react'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { Profile } from '@/types/database'

type PopupActionType = 'gift' | 'multicast'

function AdminSendContent() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [recipients, setRecipients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  // Form State
  const [popupActionType, setPopupActionType] = useState<PopupActionType>('gift')
  const [giftPackCount, setGiftPackCount] = useState(1)
  const [giftMessage, setGiftMessage] = useState('Ihr habt neue Packs geschenkt bekommen. Viel Spaß beim Öffnen!')
  const [giftPopupTitle, setGiftPopupTitle] = useState('Neue Pack-Schenkung')
  const [giftPopupBody, setGiftPopupBody] = useState('Du hast zusätzliche Packs erhalten.')
  const [giftCtaLabel, setGiftCtaLabel] = useState('Zu den Packs')
  const [giftCtaUrl, setGiftCtaUrl] = useState('/sammelkarten')
  const [giftDismissLabel, setGiftDismissLabel] = useState('Gelesen')

  const canManage = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canManage)) {
      router.push('/')
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
        } catch (e) {
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
        })
        return () => unsubscribe()
      } catch (error) {
        console.error("Error loading recipients:", error)
        setLoading(false)
      }
    }

    loadRecipients()
  }, [authLoading, profile, canManage, router, searchParams])

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

    const normalizedPackCount = popupActionType === 'gift' ? Math.floor(giftPackCount) : 0
    
    setSending(true)
    try {
      const giftBoosterPack = httpsCallable(functions, 'giftBoosterPack')
      const response = await giftBoosterPack({
        userIds: recipients.map(r => r.id),
        packCount: normalizedPackCount,
        customMessage: trimmedMessage,
        popupTitle: normalizedPopupTitle,
        popupBody: normalizedPopupBody,
        ctaLabel: normalizedCtaLabel,
        ctaUrl: normalizedCtaUrl,
        dismissLabel: normalizedDismissLabel,
      })

      const payload = (response.data || {}) as { giftedCount?: number; failedUserIds?: string[] }
      const giftedCount = payload.giftedCount || 0
      const failedCount = (payload.failedUserIds || []).length

      await logAction('BOOSTER_GIFT_SENT', user.uid, profile?.full_name, {
        recipients: recipients.map(r => r.id),
        pack_count: normalizedPackCount,
        message: trimmedMessage,
        popup_type: popupActionType,
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
            <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
              <Tabs value={popupActionType} onValueChange={(v) => setPopupActionType(v as PopupActionType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 mb-8 bg-muted/50 p-1">
                  <TabsTrigger value="gift" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Gift className="h-4 w-4" />
                    Packs verschenken
                  </TabsTrigger>
                  <TabsTrigger value="multicast" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageSquare className="h-4 w-4" />
                    Multicast Nachricht
                  </TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    {popupActionType === 'gift' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="gift-pack-count" className="font-bold">Packs pro Person</Label>
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
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="gift-popup-title" className="font-bold">Popup-Titel</Label>
                      <Input
                        id="gift-popup-title"
                        className="h-11"
                        value={giftPopupTitle}
                        onChange={(e) => setGiftPopupTitle(e.target.value)}
                        maxLength={80}
                        placeholder="Wichtiges Update"
                      />
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
                      <Input
                        id="gift-message"
                        className="h-11 border-amber-200 bg-amber-50/30"
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Grund der Schenkung..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gift-popup-cta-label" className="font-bold">Button-Text</Label>
                        <Input
                          id="gift-popup-cta-label"
                          value={giftCtaLabel}
                          onChange={(e) => setGiftCtaLabel(e.target.value)}
                          maxLength={40}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gift-popup-dismiss-label" className="font-bold">Schließen-Text</Label>
                        <Input
                          id="gift-popup-dismiss-label"
                          value={giftDismissLabel}
                          onChange={(e) => setGiftDismissLabel(e.target.value)}
                          maxLength={30}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gift-popup-cta-url" className="font-bold">Link-Ziel (URL)</Label>
                      <Input
                        id="gift-popup-cta-url"
                        value={giftCtaUrl}
                        onChange={(e) => setGiftCtaUrl(e.target.value)}
                        placeholder="/sammelkarten"
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
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                {recipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Keine Empfänger ausgewählt.</p>
                ) : (
                  recipients.map((r) => (
                    <Badge key={r.id} variant="secondary" className="pl-3 pr-1 py-1 gap-2 bg-background border shadow-sm">
                      <span className="max-w-[150px] truncate font-medium">{r.full_name || r.email}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 rounded-full hover:bg-destructive hover:text-white transition-colors"
                        onClick={() => removeRecipient(r.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
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
              
              <UniversalBanner
                tone={popupActionType === 'gift' ? 'primary' : 'info'}
                layout="floating"
                title={giftPopupTitle || 'Titel'}
                message={giftPopupBody || 'Hauptnachricht...'}
                icon={popupActionType === 'gift' ? <Gift className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                actions={
                  <div className="flex items-center justify-end gap-2">
                    {giftCtaLabel && (
                      <Button size="sm" variant="default" className="pointer-events-none">
                        {giftCtaLabel}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="pointer-events-none">
                      {giftDismissLabel || 'Schließen'}
                    </Button>
                  </div>
                }
                className="w-full shadow-2xl scale-100 border-primary/20 animate-none"
              />

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
                      <span className="font-bold">{popupActionType === 'gift' ? 'Belohnung' : 'Information'}</span>
                    </div>
                    {popupActionType === 'gift' && (
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
                  Nach dem Klick wird das Popup für alle Empfänger sofort in der Datenbank hinterlegt und beim nächsten Seitenaufruf angezeigt.
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
