'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { Ad } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Megaphone, ExternalLink, Eye, Pencil, Archive } from 'lucide-react'
import { logAction } from '@/lib/logging'
import { Switch } from '@/components/ui/switch'
import { AdTile } from '@/components/dashboard/AdTile'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdManagerPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAd, setNewAd] = useState<Partial<Ad>>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    priority: 0,
    is_active: true
  })
  const router = useRouter()

  const isAdmin = profile?.role && ['admin', 'admin_main', 'admin_co', 'planner'].includes(profile.role)

  useEffect(() => {
    if (!authLoading && (!profile || !isAdmin)) {
      router.replace('/unauthorized')
      return
    }

    const q = query(collection(db, 'ads'), orderBy('priority', 'desc'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)))
      setLoading(false)
    }, (error) => {
      console.error('Error fetching ads:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [profile, authLoading, isAdmin, router])

  const sanitizeLink = (url: string) => {
    if (!url) return ''
    const trimmed = url.trim()
    if (trimmed.startsWith('/') || trimmed.startsWith('http') || trimmed.startsWith('//')) {
      return trimmed
    }
    // If it looks like a domain (has a dot) but no protocol, add https://
    if (trimmed.includes('.') && !trimmed.startsWith('mailto:') && !trimmed.startsWith('tel:')) {
      return `https://${trimmed}`
    }
    return trimmed
  }

  const handleCreateAd = async () => {
    if (!newAd.title || !newAd.description || !user) return
    setActionLoading(true)

    try {
      const adData = {
        ...newAd,
        link_url: sanitizeLink(newAd.link_url || ''),
        created_at: serverTimestamp()
      }
      await addDoc(collection(db, 'ads'), adData)
      await logAction('AD_CREATED', user.uid, profile?.full_name, { title: newAd.title })
      
      setNewAd({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        priority: 0,
        is_active: true
      })
      setIsCreateDialogOpen(false)
      toast.success('Anzeige erfolgreich erstellt.')
    } catch (error) {
      console.error('Error creating ad:', error)
      toast.error('Fehler beim Erstellen der Anzeige.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateAd = async (adId: string, data: Partial<Ad>) => {
    if (!user) return
    try {
      const updateData = { ...data }
      if (updateData.link_url !== undefined) {
        updateData.link_url = sanitizeLink(updateData.link_url)
      }
      await updateDoc(doc(db, 'ads', adId), updateData)
      toast.success('Anzeige aktualisiert.')
    } catch (error) {
      console.error('Error updating ad:', error)
      toast.error('Fehler beim Aktualisieren.')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingAd || !user) return
    setActionLoading(true)
    try {
      const { id, created_at, ...updateData } = editingAd
      updateData.link_url = sanitizeLink(updateData.link_url || '')
      
      await updateDoc(doc(db, 'ads', id), updateData)
      await logAction('AD_UPDATED', user.uid, profile?.full_name, { title: editingAd.title })
      setEditingAd(null)
      toast.success('Anzeige erfolgreich aktualisiert.')
    } catch (error) {
      console.error('Error updating ad:', error)
      toast.error('Fehler beim Aktualisieren der Anzeige.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAd = async (adId: string, title: string) => {
    if (!user || !window.confirm(`Möchtest du die Anzeige "${title}" wirklich löschen?`)) return
    try {
      await deleteDoc(doc(db, 'ads', adId))
      await logAction('AD_DELETED', user.uid, profile?.full_name, { ad_id: adId, title })
      toast.success('Anzeige gelöscht.')
    } catch (error) {
      console.error('Error deleting ad:', error)
      toast.error('Fehler beim Löschen.')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeAds = ads.filter(ad => ad.is_active)
  const inactiveAds = ads.filter(ad => !ad.is_active)

  const AdForm = ({ data, setData, isEdit = false }: { data: Partial<Ad>, setData: any, isEdit?: boolean }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titel</Label>
          <Input 
            placeholder="z.B. Abiball-Tickets jetzt!" 
            value={data.title} 
            onChange={(e) => setData((prev: any) => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea 
            placeholder="Kurzer Infotext..." 
            value={data.description} 
            onChange={(e) => setData((prev: any) => ({ ...prev, description: e.target.value }))}
            className="min-h-[100px]"
          />
        </div>
        <div className="space-y-2">
          <Label>Bild-URL (optional)</Label>
          <Input 
            placeholder="https://..." 
            value={data.image_url || ''} 
            onChange={(e) => setData((prev: any) => ({ ...prev, image_url: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Link-URL (optional)</Label>
          <Input 
            placeholder="Intern (/shop) oder Extern (https://...)" 
            value={data.link_url || ''} 
            onChange={(e) => setData((prev: any) => ({ ...prev, link_url: e.target.value }))}
          />
          <p className="text-[10px] text-muted-foreground italic">
            Externe Links müssen mit <strong>https://</strong> beginnen.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Priorität</Label>
          <Select 
            value={String(data.priority || 0)} 
            onValueChange={(val) => setData((prev: any) => ({ ...prev, priority: parseInt(val || '0') }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priorität wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 - Niedrig (Ganz unten)</SelectItem>
              <SelectItem value="10">10 - Mittel (Unter Umfragen)</SelectItem>
              <SelectItem value="50">50 - Hoch (Über Umfragen)</SelectItem>
              <SelectItem value="100">100 - Sehr Hoch (Über Aufgaben)</SelectItem>
              <SelectItem value="500">500 - Dringend (Ganz oben)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          Live-Vorschau
        </Label>
        <div className="border rounded-2xl p-4 bg-muted/30 flex items-center justify-center min-h-[300px]">
          <div className="w-full max-w-sm">
            <AdTile ads={[{
              id: 'preview',
              title: data.title || 'Dein Titel hier',
              description: data.description || 'Deine Beschreibung wird hier erscheinen...',
              image_url: data.image_url,
              link_url: data.link_url,
              is_active: true,
              priority: data.priority || 0,
              created_at: new Date().toISOString()
            }]} />
          </div>
        </div>
        
        {!isEdit && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
            <h4 className="text-xs font-bold flex items-center gap-1.5">
              <Megaphone className="h-3 w-3" /> Dashboard-Ranking
            </h4>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Die Position auf dem Dashboard hängt von der Priorität ab. Dringende Anzeigen stehen immer ganz oben.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AD-Manager</h1>
          <p className="text-muted-foreground mt-1">Verwalte benutzerdefinierte Werbung und Hinweise für das Dashboard.</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Neue Anzeige
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Anzeige erstellen</DialogTitle>
              <DialogDescription>Erstelle eine neue Werbekachel für das Dashboard.</DialogDescription>
            </DialogHeader>
            <AdForm data={newAd} setData={setNewAd} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleCreateAd} disabled={actionLoading || !newAd.title || !newAd.description}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Anzeige schalten
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <TabsList className="w-fit">
            <TabsTrigger value="active" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Aktiv ({activeAds.length})
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Archive className="h-4 w-4" />
              Archiv ({inactiveAds.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="space-y-6 outline-none">
          {activeAds.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center text-muted-foreground">
                Keine aktiven Anzeigen vorhanden.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} onEdit={() => setEditingAd(ad)} onDelete={() => handleDeleteAd(ad.id, ad.title)} onToggle={(val) => handleUpdateAd(ad.id, { is_active: val })} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archive" className="space-y-6 outline-none">
          {inactiveAds.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center text-muted-foreground">
                Keine archivierten Anzeigen vorhanden.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} onEdit={() => setEditingAd(ad)} onDelete={() => handleDeleteAd(ad.id, ad.title)} onToggle={(val) => handleUpdateAd(ad.id, { is_active: val })} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingAd} onOpenChange={(open) => !open && setEditingAd(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Anzeige bearbeiten</DialogTitle>
            <DialogDescription>Passe die Details deiner Anzeige an.</DialogDescription>
          </DialogHeader>
          {editingAd && <AdForm data={editingAd} setData={setEditingAd} isEdit />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAd(null)}>Abbrechen</Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Änderungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdCard({ ad, onEdit, onDelete, onToggle }: { ad: Ad, onEdit: () => void, onDelete: () => void, onToggle: (val: boolean) => void }) {
  return (
    <Card className={cn("overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-md", !ad.is_active && "opacity-60 grayscale border-dashed")}>
      <div className="relative h-40 bg-muted overflow-hidden">
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <Megaphone className="h-10 w-10 text-primary/30" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Switch 
            checked={ad.is_active} 
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold">
          Prio: {ad.priority}
        </div>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg line-clamp-1">{ad.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs min-h-[2.5rem]">{ad.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1">
        {ad.link_url && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate bg-muted/50 p-1.5 rounded">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{ad.link_url}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
