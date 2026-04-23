"use client"
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft,
  Zap,
  ShoppingBag,
  Star,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Package,
  Info,
  Trophy,
  ShieldCheck,
  Lock,
  Coffee,
  Heart,
  Clock,
  LayoutGrid,
  Tags,
  Loader2,
  Calendar,
  MapPin,
  Ticket
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { BoosterPackVisual } from '@/components/cards/BoosterPackVisual'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, getDoc, collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

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

const SUPPORT_BONUS: Record<number, number> = {
  20: 1,
  50: 4,
  100: 8,
}

const BASE_PACK_PRICE = 0.60

const CATEGORIES = [
  { id: 'all', name: 'Alle Artikel', icon: LayoutGrid },
  { id: 'tickets', name: 'Tickets', icon: Ticket },
  { id: 'merch', name: 'Stufen-Merch', icon: ShoppingBag },
  { id: 'sammelkarten', name: 'Sammelkarten', icon: Sparkles },
  { id: 'extras', name: 'Sonstiges', icon: Tags },
]

// Preisstaffel: Je größer das Bundle, desto günstiger pro Karte
const BUNDLE_DEFS = [
  { amount: 1,  price: 0.60, color: 'slate', badge: 'Einsteiger' },
  { amount: 3,  price: 1.70, color: 'blue', badge: undefined },
  { amount: 5,  price: 2.70, color: 'emerald', badge: undefined },
  { amount: 10, price: 5.20, color: 'purple', badge: 'Beliebt' },
  { amount: 20, price: 10.00, color: 'amber', badge: 'Top Deal' },
  { amount: 50, price: 23.00, color: 'rose', badge: undefined },
  { amount: 100, price: 44.00, color: 'rose', badge: 'Maximaler Support' },
]

const BUILTIN_BOOSTERS: ShopItem[] = BUNDLE_DEFS.map((def, idx) => ({
  id: `booster-bundle-${def.amount}`,
  category: 'sammelkarten',
  name: `Booster-Bundle ${def.amount}`,
  amount: def.amount,
  fanCardCount: idx + 1,
  limit: def.amount === 1 ? 20 : def.amount === 3 ? 10 : def.amount === 5 ? 5 : 3,
  price: def.price.toLocaleString('de-DE', { minimumFractionDigits: 2, style: 'currency', currency: 'EUR' }),
  priceNum: def.price,
  description: `${def.amount} Booster Packs (${def.amount * 3} Lehrerkarten).${SUPPORT_BONUS[def.amount] ? ` + ${SUPPORT_BONUS[def.amount]} GRATIS Support Booster!` : ''}`,
  color: def.color as any,
  badge: def.badge,
  isBooster: true,
  requireAuth: true,
  supportBonus: SUPPORT_BONUS[def.amount],
  featured: def.amount === 10
}))

const EXTERNAL_STORES: ShopItem[] = [
  {
    id: 'printify-popup-store',
    category: 'merch',
    name: 'Offizieller Merch-Store',
    description: 'Hoodies, Shirts & mehr über unseren Printify Pop-up Store.',
    price: 'Extern',
    priceNum: 0,
    amount: 1,
    limit: 999,
    color: 'indigo',
    badge: 'Printify',
    externalUrl: 'https://printify.com', // Platzhalter URL
    featured: true
  },
  {
    id: 'pretix-ticket-shop',
    category: 'tickets',
    name: 'Event-Tickets',
    description: 'Sichere dir deine Eintrittskarten für Abiball & Events via pretix.eu.',
    price: 'Tickets',
    priceNum: 0,
    amount: 1,
    limit: 999,
    color: 'emerald',
    badge: 'pretix.eu',
    externalUrl: 'https://pretix.eu', // Platzhalter URL
    featured: true
  }
]

function ShopContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [dbItems, setDbItems] = useState<ShopItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'shop_items'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDbItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItem)))
      setItemsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const allItems = useMemo(() => {
    // Merge built-in boosters, external stores, and database items
    const merged = [...BUILTIN_BOOSTERS, ...EXTERNAL_STORES]
    dbItems.forEach(dbItem => {
      const idx = merged.findIndex(m => m.id === dbItem.id)
      if (idx > -1) merged[idx] = dbItem
      else merged.push(dbItem)
    })
    return merged
  }, [dbItems])
  
  const availableCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      if (cat.id === 'all') return true
      const itemsInCat = allItems.filter(item => item.category === cat.id as any)
      const accessibleItems = user ? itemsInCat : itemsInCat.filter(i => !i.requireAuth)
      return accessibleItems.length > 0
    })
  }, [user, allItems])

  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all')

  useEffect(() => {
    if (activeCategory !== 'all' && !availableCategories.find(c => c.id === activeCategory)) {
      setActiveCategory('all')
    }
  }, [availableCategories, activeCategory])

  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({})
  const [successItem, setSuccessItem] = useState<{name: string, amount: number} | null>(null)
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null)
  const [courses, setCourses] = useState<string[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [selectedDonationCourse, setSelectedDonationCourse] = useState('')
  const [donorDisplayName, setDonorDisplayName] = useState('')

  const isDonationItem = (item: ShopItem | null) => !!item && item.id.startsWith('soli-donation')

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        const rawCourses = settingsSnap.exists() ? settingsSnap.data()?.courses : []
        const parsedCourses = Array.isArray(rawCourses)
          ? rawCourses.filter((course): course is string => typeof course === 'string' && course.trim().length > 0)
          : []
        setCourses(parsedCourses)
      } catch (error) {
        console.error('Error loading courses for donations:', error)
        setCourses([])
      } finally {
        setLoadingCourses(false)
      }
    }

    loadCourses()
  }, [])

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Zahlung erfolgreich! Deine Artikel werden in Kürze freigeschaltet.')
      setSuccessItem({ name: 'Deine Bestellung', amount: 0 }) 
    }
    if (searchParams.get('canceled') === 'true') {
      toast.error('Zahlung abgebrochen.')
    }
  }, [searchParams])

  const filteredItems = useMemo(() => {
    let items = [...allItems]
    
    if (!user) {
      items.sort((a, b) => {
        const order = { 'merch': 0, 'tickets': 1, 'extras': 2, 'sammelkarten': 3, 'notenpunkte': 4 }
        return (order[a.category] || 99) - (order[b.category] || 99)
      })
    }

    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory)
    }
    
    return items
  }, [activeCategory, user, allItems])

  const featuredItems = useMemo(() => {
    return allItems.filter(item => item.featured)
  }, [allItems])

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const shopStats = (profile?.shop_stats?.month === currentMonthStr && profile?.shop_stats) ? profile.shop_stats.counts : {}

  const handleStripeCheckout = async (item: ShopItem, selectedCourse?: string, donorName?: string) => {
    if (item.requireAuth && !user) {
      toast.error('Anmeldung erforderlich', {
        description: 'Um Booster-Packs zu sammeln, musst du angemeldet sein.'
      })
      return
    }

    if (item.variants && !selectedVariant[item.id]) {
      toast.error('Bitte wähle eine Variante (z.B. Größe) aus.')
      return
    }

    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank')
      return
    }

    if (item.isPlaceholder) {
      toast.info('Dieser Artikel ist aktuell noch in Vorbereitung.')
      return
    }

    setIsPurchasing(item.id)
    
    try {
      const functions = getFunctions(undefined, 'europe-west3')
      const createSession = httpsCallable<{ itemId: string, selectedCourse?: string, donorName?: string, variant?: string }, { url: string }>(functions, 'createStripeCheckoutSession')
      
      const result = await createSession({ 
        itemId: item.id, 
        selectedCourse, 
        donorName,
        variant: selectedVariant[item.id]
      })
      
      if (result.data.url) {
        window.location.href = result.data.url
      } else {
        throw new Error('Keine Checkout-URL erhalten.')
      }
    } catch (err: any) {
      console.error('Stripe-Error:', err)
      toast.error(err.message || 'Bezahlvorgang konnte nicht gestartet werden.')
      setIsPurchasing(null)
    }
  }

  if (authLoading || itemsLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-16 w-3/4 mx-auto rounded-2xl" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[450px] w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      <main className="container mx-auto max-w-6xl px-4 py-12 sm:py-20 space-y-16">
        {/* Minimalist Hero Section */}
        <section className="space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">
              ABI<span className="text-primary">SHOP</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-base sm:text-lg font-medium">              Offizielle Kollektion & Events der Stufe ABI 2027. <br />
              <span className="text-foreground font-bold italic">90% Gewinnanteil fließen direkt in eure Abikasse.</span>
            </p>
          </div>
        </section>

        {/* Categories (Clean Tabs) */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 border-b border-border pb-4">
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-1 py-2 text-xs font-black uppercase tracking-widest transition-all relative",
                activeCategory === cat.id 
                  ? "text-primary after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Shop Grid (Minimalist Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const currentPurchases = shopStats[item.id] || 0
              const isLimitReached = !item.isPlaceholder && currentPurchases >= item.limit
              const fullPrice = item.amount * BASE_PACK_PRICE
              const savings = fullPrice - (item.priceNum || 0)
              const hasDiscount = item.isBooster && savings > 0.001

              return (
                <motion.div
                  layout
                  id={`item-${item.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className={cn(
                    "group flex flex-col space-y-4",
                    isLimitReached && "opacity-60 grayscale-[0.5]"
                  )}
                >
                  {/* Image/Visual Area */}
                  <div className="relative aspect-[4/5] rounded-2xl bg-muted/30 border border-border overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/5">
                    {item.badge && !isLimitReached && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-tighter text-[9px]">
                          {item.badge}
                        </Badge>
                      </div>
                    )}

                    <div className="transform group-hover:scale-105 transition-transform duration-500">
                       {item.isBooster ? (
                         <BoosterPackVisual
                           amount={item.amount}
                           color={item.color as any}
                           mode="experimental"
                           layoutStyle="fan"
                           fanCardCount={item.fanCardCount}
                           density={item.amount >= 50 ? 'dense' : 'normal'}
                         />
                       ) : item.category === 'merch' ? (
                          <div className="relative">
                            <ShoppingBag className={cn("w-28 h-28 opacity-20", `text-${item.color}-500`)} />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <Package className="w-12 h-12 text-foreground" />
                            </div>
                          </div>
                       ) : item.category === 'tickets' ? (
                          <div className="relative flex flex-col items-center">
                            <Ticket className="w-32 h-32 text-primary opacity-20 rotate-12" />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-black tracking-widest uppercase rotate-[-10deg] shadow-2xl">
                                  TICKET
                               </div>
                            </div>
                          </div>
                       ) : (
                         <Heart className="w-20 h-20 text-primary fill-current opacity-20" />
                       )}
                    </div>

                    {/* Quick Info Overlay */}
                    {!isLimitReached && item.variants && !item.externalUrl && (
                       <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                         <div className="bg-background/80 backdrop-blur-md p-2 rounded-xl border border-border flex justify-center gap-1">
                            {item.variants.map(v => (
                              <button
                                key={v}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVariant(prev => ({ ...prev, [item.id]: v }));
                                }}
                                className={cn(
                                  "w-8 h-8 rounded-md text-[10px] font-bold transition-colors",
                                  selectedVariant[item.id] === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                )}
                              >
                                {v}
                              </button>
                            ))}
                         </div>
                       </div>
                    )}
                  </div>

                  {/* Info Area */}
                  <div className="space-y-1 px-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-black tracking-tight leading-tight">{item.name}</h3>
                      <span className="text-lg font-black shrink-0">{item.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-1">{item.description}</p>
                    
                    {item.variants && !item.externalUrl && (
                       <div className="pt-1">
                         <p className="text-[9px] font-black uppercase text-primary tracking-widest">
                           {selectedVariant[item.id] ? `Größe: ${selectedVariant[item.id]}` : "Größe wählen (Hover)"}
                         </p>
                       </div>
                    )}
                    
                    {item.eventDetails && (
                      <div className="flex gap-3 pt-1">
                        <span className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {item.eventDetails.date}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {item.eventDetails.location}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant={isLimitReached ? "secondary" : "default"}
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs"
                    disabled={isPurchasing !== null || isLimitReached}
                    onClick={() => {
                      if (item.requireAuth && !user) {
                        toast.error('Anmeldung erforderlich')
                        return
                      }
                      if (!item.externalUrl && item.variants && !selectedVariant[item.id]) {
                        toast.error('Bitte Größe wählen')
                        return
                      }
                      if (!item.externalUrl && isDonationItem(item)) {
                        setConfirmItem(item)
                        return
                      }
                      handleStripeCheckout(item)
                    }}
                  >
                    {isPurchasing === item.id ? "..." : isLimitReached ? "Ausverkauft" : item.externalUrl ? "Zum Shop" : "In den Warenkorb"}
                  </Button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-2xl font-black tracking-tight">Aktuell keine Artikel</h3>
            <p className="text-muted-foreground">In dieser Kategorie sind zurzeit keine Artikel verfügbar.</p>
            <Button variant="link" onClick={() => setActiveCategory('all')} className="mt-4 font-bold uppercase tracking-widest text-xs">Zurück zu allen Artikeln</Button>
          </div>
        )}

        {/* Legal Stuff Footer */}
        <section className="pt-12 border-t border-border space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-muted-foreground leading-relaxed font-medium">
             <div className="space-y-3 p-6 bg-card border border-border rounded-2xl">
                <h5 className="font-black text-foreground uppercase tracking-[0.15em] flex items-center gap-2 text-[10px]">
                   <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                   Sicher Bezahlen
                </h5>
                <p>
                  Deine Zahlung wird sicher über Stripe verarbeitet. Wir speichern keine Kreditkartendaten auf unseren Servern.
                </p>
             </div>
             <div className="space-y-3 p-6 bg-card border border-border rounded-2xl">
                <h5 className="font-black text-foreground uppercase tracking-[0.15em] flex items-center gap-2 text-[10px]">
                   <TrendingUp className="w-3.5 h-3.5 text-info" />
                   Transparenz
                </h5>
                <p>
                  Alle Einnahmen werden transparent in der Finanzübersicht der App erfasst (ausgenommen persönliche Daten).
                </p>
             </div>
             <div className="space-y-3 p-6 bg-card border border-border rounded-2xl border-primary/20 bg-primary/5">
                <h5 className="font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2 text-[10px]">
                   <Trophy className="w-3.5 h-3.5" />
                   Euer Abiball
                </h5>
                <p className="text-foreground/80">
                  <span className="font-black text-foreground text-sm block mb-1 text-primary">90% Gewinnanteil</span>
                  Jeder Kauf unterstützt direkt eure Stufenkasse mit 90% des Gewinns. Die restlichen 10% decken Serverkosten und App-Entwicklung.
                </p>
             </div>
             <div className="space-y-3 p-6 bg-card border border-border rounded-2xl">
                <h5 className="font-black text-foreground uppercase tracking-[0.15em] flex items-center gap-2 text-[10px]">
                   <Coffee className="w-3.5 h-3.5 text-amber-600" />
                   Entwickler Support
                </h5>
                <p>
                  Willst du den Entwickler direkt unterstützen? Dann kannst du mir gerne einen Kaffee ausgeben.
                </p>
                <a 
                  href="https://buymeacoffee.com/maxilo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-600 font-bold hover:underline underline-offset-4 mt-1"
                >
                  Kaffee ausgeben
                  <ChevronLeft className="w-3 h-3 rotate-180" />
                </a>
             </div>
           </div>
           
           <div className="flex flex-wrap justify-center gap-8 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> SSL Verschlüsselt</span>
              <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Digitale Zustellung</span>
              <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> PCI-DSS Konform</span>
           </div>
        </section>
      </main>

      {/* Purchase Confirmation Modal */}
      <AnimatePresence>
        {confirmItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-xl p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-5 sm:space-y-8 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Bestellung bestätigen</h3>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Sicherer Checkout</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setConfirmItem(null)} className="rounded-full">
                  <ChevronLeft className="w-5 h-5 rotate-90" />
                </Button>
              </div>

              <div className="p-4 sm:p-6 bg-muted/30 rounded-2xl sm:rounded-3xl border border-border/50 space-y-4 shadow-inner relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Artikel</span>
                  <span className="font-black text-lg">{confirmItem.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Kategorie</span>
                  <span className="font-bold">{CATEGORIES.find(c => c.id === confirmItem.category)?.name}</span>
                </div>
                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="text-lg font-black tracking-tight">Gesamtpreis</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">{confirmItem.price}</span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {isDonationItem(confirmItem) && (
                  <div className="space-y-2 p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <label htmlFor="donation-course" className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
                      Kurs für Ranking (optional)
                    </label>
                    <select
                      id="donation-course"
                      className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                      value={selectedDonationCourse}
                      onChange={(e) => setSelectedDonationCourse(e.target.value)}
                      disabled={loadingCourses || isPurchasing !== null}
                    >
                      <option value="">Kein Kurs zuordnen</option>
                      {courses.map((course) => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                    <label htmlFor="donation-name" className="text-xs font-black text-muted-foreground uppercase tracking-wider block pt-2">
                      Dein Name (optional)
                    </label>
                    <input
                      id="donation-name"
                      type="text"
                      maxLength={80}
                      placeholder="z.B. Max Mustermann"
                      className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                      value={donorDisplayName}
                      onChange={(e) => setDonorDisplayName(e.target.value)}
                      disabled={isPurchasing !== null}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Wenn du einen Kurs auswählst, wird die Spende dem Kurs im Leaderboard zugeordnet.
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl text-muted-foreground text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-primary" />
                  <span>
                    Mit dem Klick auf &quot;Zur Kasse&quot; wirst du zu Stripe weitergeleitet.
                    <span className="text-foreground block mt-1">
                      WICHTIG: Du stimmst der sofortigen Ausführung des Vertrages zu und verlierst dein Widerrufsrecht für diese digitalen Inhalte.
                    </span>
                  </span>
                </div>

                <Button
                  className="w-full h-14 sm:h-16 rounded-2xl font-black text-lg sm:text-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-3"
                  onClick={() => {
                    handleStripeCheckout(
                      confirmItem,
                      isDonationItem(confirmItem) && selectedDonationCourse ? selectedDonationCourse : undefined,
                      isDonationItem(confirmItem) && donorDisplayName.trim() ? donorDisplayName.trim() : undefined
                    )
                    setConfirmItem(null)
                    setSelectedDonationCourse('')
                    setDonorDisplayName('')
                  }}
                  disabled={isPurchasing !== null || (isDonationItem(confirmItem) && loadingCourses)}
                >
                  <CreditCard className="w-6 h-6" />
                  {confirmItem.isPlaceholder ? 'Aktuell nicht verfügbar' : 'Zur Kasse'}
                </Button>
                <Button variant="ghost" className="w-full font-bold text-muted-foreground hover:text-foreground" onClick={() => {
                  setConfirmItem(null)
                  setSelectedDonationCourse('')
                  setDonorDisplayName('')
                }}>
                  Abbrechen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {successItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="bg-card border border-border p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center space-y-8 max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-success/5 to-transparent pointer-events-none" />
              
              <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center text-success relative">
                <CheckCircle2 className="w-12 h-12" />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-success/30 rounded-full"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-tighter">Zahlung bestätigt!</h3>
                <p className="text-muted-foreground font-bold">
                  Deine Bestellung wurde erfolgreich verarbeitet.
                </p>
              </div>

              <Button onClick={() => setSuccessItem(null)} className="w-full h-14 rounded-2xl font-black text-lg bg-primary text-primary-foreground shadow-lg">
                Weiter einkaufen
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GlobalShopPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-16 w-3/4 mx-auto rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[450px] w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}
