'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Edit, Trash2, ExternalLink, ShoppingBag, Save, X, Sparkles, Ticket, Tags, LayoutGrid, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ShopItem = {
  id: string
  category: 'sammelkarten' | 'extras' | 'merch' | 'tickets' | 'notenpunkte'
  name: string
  description: string
  price: string
  priceNum: number
  amount: number
  limit: number
  color: 'blue' | 'purple' | 'amber' | 'emerald' | 'slate' | 'rose' | 'indigo' | 'cyan'
  badge?: string
  isBooster?: boolean
  fanCardCount?: number
  isPlaceholder?: boolean
  requireAuth?: boolean
  supportBonus?: number
  featured?: boolean
  image?: string
  variants?: string[]
  externalUrl?: string
  eventDetails?: {
    date: string
    location: string
    time?: string
  }
}

export default function ShopAdminPage() {
  const { profile, loading: authLoading } = useAuth()
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<Partial<ShopItem>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const canManageShop = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canManageShop)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [profile, authLoading, canManageShop, router, pathname])

  useEffect(() => {
    if (!canManageShop) return

    const q = query(collection(db, 'shop_items'), orderBy('category'), orderBy('name'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItem)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [canManageShop])

  const handleSave = async () => {
    if (!editItem.name || !editItem.category || !editItem.priceNum) {
      toast.error('Bitte fülle alle Pflichtfelder aus.')
      return
    }

    try {
      const data = {
        ...editItem,
        updated_at: serverTimestamp()
      }

      if (isEditing) {
        await setDoc(doc(db, 'shop_items', isEditing), data, { merge: true })
        toast.success('Artikel aktualisiert.')
      } else {
        await addDoc(collection(db, 'shop_items'), {
          ...data,
          created_at: serverTimestamp()
        })
        toast.success('Artikel erstellt.')
      }
      setIsDialogOpen(false)
      setIsEditing(null)
      setEditItem({})
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Fehler beim Speichern.')
    }
  }

  const handleSyncDefaults = async () => {
    if (!confirm('Möchtest du den Shop mit den Standard-Artikeln (Booster & Beispiele) initialisieren? Bestehende Artikel bleiben erhalten.')) return
    setIsSyncing(true)
    try {
      const bundleDefs = [
        { amount: 1,  price: 0.60, color: 'slate', badge: 'Einsteiger' },
        { amount: 3,  price: 1.70, color: 'blue', badge: undefined },
        { amount: 5,  price: 2.70, color: 'emerald', badge: undefined },
        { amount: 10, price: 5.20, color: 'purple', badge: 'Beliebt' },
        { amount: 20, price: 10.00, color: 'amber', badge: 'Top Deal' },
        { amount: 50, price: 23.00, color: 'rose', badge: undefined },
        { amount: 100, price: 44.00, color: 'rose', badge: 'Maximaler Support' },
      ]

      const supportBonusMap: Record<number, number> = { 20: 1, 50: 4, 100: 8 }

      const defaults: Partial<ShopItem>[] = [
        {
          name: 'Offizieller Stufen-Hoodie',
          category: 'merch',
          description: 'Design ABI 2027. Abwicklung über unseren Printify Popup-Store.',
          price: 'ab 34,90 €',
          priceNum: 34.9,
          amount: 1,
          limit: 999,
          color: 'indigo',
          badge: 'Printify',
          featured: true,
          externalUrl: 'https://abi-2027.printify.me/',
          requireAuth: false
        },
        {
          name: 'Abiball 2027 Ticket',
          category: 'tickets',
          description: 'Sichere dir dein Ticket über pretix.eu.',
          price: '45,00 €',
          priceNum: 45,
          amount: 1,
          limit: 500,
          color: 'amber',
          badge: 'Ticket-Shop',
          featured: true,
          externalUrl: 'https://pretix.eu/abi2027/ball/',
          eventDetails: { date: '26. Juni 2027', location: 'Stadthalle' },
          requireAuth: false
        },
        ...bundleDefs.map((def, idx) => ({
          name: `Booster-Bundle ${def.amount}`,
          category: 'sammelkarten' as const,
          description: `${def.amount} Booster Packs (${def.amount * 3} Lehrerkarten).`,
          price: def.price.toLocaleString('de-DE', { minimumFractionDigits: 2, style: 'currency', currency: 'EUR' }),
          priceNum: def.price,
          amount: def.amount,
          limit: def.amount === 1 ? 20 : def.amount === 3 ? 10 : def.amount === 5 ? 5 : 3,
          color: def.color as any,
          badge: def.badge,
          isBooster: true,
          fanCardCount: idx + 1,
          requireAuth: true,
          supportBonus: supportBonusMap[def.amount] || 0,
          featured: def.amount === 10
        }))
      ]

      for (const item of defaults) {
        // Use setDoc with a deterministic ID to avoid duplicates if synced multiple times
        const slug = item.name!.toLowerCase().replace(/[^a-z0-9]/g, '-')
        await setDoc(doc(db, 'shop_items', slug), {
          ...item,
          updated_at: serverTimestamp()
        }, { merge: true })
      }
      toast.success('Standard-Artikel synchronisiert.')
    } catch (err) {
      console.error('Sync error:', err)
      toast.error('Sync fehlgeschlagen.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Artikel wirklich löschen?')) return
    try {
      await deleteDoc(doc(db, 'shop_items', id))
      toast.success('Artikel gelöscht.')
    } catch (err) {
      toast.error('Fehler beim Löschen.')
    }
  }

  const openEdit = (item: ShopItem) => {
    setIsEditing(item.id)
    setEditItem(item)
    setIsDialogOpen(true)
  }

  const openCreate = () => {
    setIsEditing(null)
    setEditItem({
      category: 'merch',
      color: 'indigo',
      limit: 100,
      amount: 1,
      requireAuth: false,
      priceNum: 0,
      price: '0,00 €'
    })
    setIsDialogOpen(true)
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'sammelkarten': return <Sparkles className="w-4 h-4" />
      case 'tickets': return <Ticket className="w-4 h-4" />
      case 'merch': return <ShoppingBag className="w-4 h-4" />
      case 'extras': return <Tags className="w-4 h-4" />
      default: return <LayoutGrid className="w-4 h-4" />
    }
  }

  if (authLoading || loading) return <div className="p-8 text-center">Lade Shop-Daten...</div>

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Shop-Verwaltung</h1>
          <p className="text-muted-foreground font-medium">
            Hier kannst du Artikel für den Shop anlegen und bearbeiten.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncDefaults} disabled={isSyncing} className="font-bold gap-2 h-12 rounded-xl">
             <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
             Defaults
          </Button>
          <Button onClick={openCreate} className="font-black gap-2 h-12 px-6 rounded-xl shadow-lg">
            <Plus className="w-5 h-5" />
            Neuer Artikel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktive Shop-Artikel</CardTitle>
          <CardDescription>Alle aktuell im Shop angezeigten Produkte.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Preis</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Noch keine Artikel vorhanden. Lege einen neuen Artikel an.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{item.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-2">
                          {getCategoryIcon(item.category)}
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black tabular-nums">{item.price}</TableCell>
                      <TableCell>
                        {item.externalUrl ? (
                          <Badge className="bg-sky-500 text-white gap-1 border-none">
                            <ExternalLink className="w-3 h-3" /> Extern
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500 text-white gap-1 border-none">
                            Intern
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                         <div className="flex gap-1">
                           {item.featured && <Badge className="bg-amber-500 text-white border-none">Featured</Badge>}
                           {item.isPlaceholder && <Badge variant="secondary">Placeholder</Badge>}
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{isEditing ? 'Artikel bearbeiten' : 'Neuer Artikel'}</DialogTitle>
            <DialogDescription>
              Fülle die Felder aus, um den Artikel zu konfigurieren.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Name</Label>
                <Input 
                  value={editItem.name || ''} 
                  onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="z.B. ABI Hoodie 2027"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Kategorie</Label>
                <Select 
                  value={editItem.category} 
                  onValueChange={v => setEditItem(p => ({ ...p, category: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merch">Merch</SelectItem>
                    <SelectItem value="tickets">Tickets</SelectItem>
                    <SelectItem value="sammelkarten">Sammelkarten</SelectItem>
                    <SelectItem value="extras">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Beschreibung</Label>
              <Textarea 
                value={editItem.description || ''} 
                onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))}
                placeholder="Kurze Produktbeschreibung..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Preis (Anzeige-String)</Label>
                <Input 
                  value={editItem.price || ''} 
                  onChange={e => setEditItem(p => ({ ...p, price: e.target.value }))}
                  placeholder="z.B. 19,90 €"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Preis (Numerisch in €)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={editItem.priceNum || 0} 
                  onChange={e => setEditItem(p => ({ ...p, priceNum: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Externer Shop-Link (Printify / pretix)</Label>
              <div className="flex gap-2">
                <Input 
                  value={editItem.externalUrl || ''} 
                  onChange={e => setEditItem(p => ({ ...p, externalUrl: e.target.value }))}
                  placeholder="https://shop.printify.com/ oder https://pretix.eu/..."
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Wichtig: Wenn dieser Link gesetzt ist, führt der Button im Shop direkt zu deinem **Printify Popup-Store** oder deinem **pretix Ticket-Shop**.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Farbe (Theme)</Label>
                <Select 
                  value={editItem.color} 
                  onValueChange={v => setEditItem(p => ({ ...p, color: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['indigo', 'blue', 'cyan', 'emerald', 'amber', 'rose', 'purple', 'slate'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Limit / Bestand</Label>
                <Input 
                  type="number"
                  value={editItem.limit || 0} 
                  onChange={e => setEditItem(p => ({ ...p, limit: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {editItem.category === 'merch' && (
              <div className="space-y-2">
                <Label className="font-bold">Varianten (Größen, durch Komma getrennt)</Label>
                <Input 
                  value={editItem.variants?.join(', ') || ''} 
                  onChange={e => setEditItem(p => ({ ...p, variants: e.target.value.split(',').map(v => v.trim()).filter(v => v.length > 0) }))}
                  placeholder="S, M, L, XL"
                />
              </div>
            )}

            {editItem.category === 'tickets' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="space-y-2 col-span-2">
                   <h4 className="text-xs font-black uppercase tracking-widest text-primary">Event-Details</h4>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Datum</Label>
                  <Input 
                    value={editItem.eventDetails?.date || ''} 
                    onChange={e => setEditItem(p => ({ ...p, eventDetails: { ...p.eventDetails!, date: e.target.value } }))}
                    placeholder="26. Juni 2027"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Ort</Label>
                  <Input 
                    value={editItem.eventDetails?.location || ''} 
                    onChange={e => setEditItem(p => ({ ...p, eventDetails: { ...p.eventDetails!, location: e.target.value } }))}
                    placeholder="Stadthalle"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 border rounded-2xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="featured"
                  checked={editItem.featured || false} 
                  onChange={e => setEditItem(p => ({ ...p, featured: e.target.checked }))}
                />
                <Label htmlFor="featured" className="font-bold">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="booster"
                  checked={editItem.isBooster || false} 
                  onChange={e => setEditItem(p => ({ ...p, isBooster: e.target.checked }))}
                />
                <Label htmlFor="booster" className="font-bold">Booster-Visual</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="auth"
                  checked={editItem.requireAuth || false} 
                  onChange={e => setEditItem(p => ({ ...p, requireAuth: e.target.checked }))}
                />
                <Label htmlFor="auth" className="font-bold">Login nötig</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="placeholder"
                  checked={editItem.isPlaceholder || false} 
                  onChange={e => setEditItem(p => ({ ...p, isPlaceholder: e.target.checked }))}
                />
                <Label htmlFor="placeholder" className="font-bold">Placeholder</Label>
              </div>
            </div>

            {editItem.isBooster && (
              <div className="space-y-2 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                <Label className="font-bold text-purple-600">Fan Card Count (1-7)</Label>
                <Input 
                  type="number"
                  min="1"
                  max="7"
                  value={editItem.fanCardCount || 1} 
                  onChange={e => setEditItem(p => ({ ...p, fanCardCount: parseInt(e.target.value) }))}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Bestimmt, wie viele Karten im Fächer-Visual angezeigt werden.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Abbrechen</Button>
            <Button onClick={handleSave} className="font-black gap-2">
              <Save className="w-4 h-4" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
