'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUserTeachers } from '@/hooks/useUserTeachers'
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
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { BoosterPackVisual } from '@/components/cards/BoosterPackVisual'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { cn } from '@/lib/utils'

// Shop Item definition
interface ShopItem {
  id: string
  category: 'sammelkarten' | 'extras' | 'merch'
  name: string
  description: string
  price: string
  priceNum: number
  amount: number
  limit: number
  color: 'blue' | 'purple' | 'amber' | 'emerald' | 'slate' | 'rose'
  badge?: string
  isBooster?: boolean
  isPlaceholder?: boolean
  requireAuth?: boolean
}

const CATEGORIES = [
  { id: 'all', name: 'Alle Artikel', icon: LayoutGrid },
  { id: 'sammelkarten', name: 'Sammelkarten', icon: Sparkles },
  { id: 'merch', name: 'Stufen-Merch', icon: ShoppingBag },
  { id: 'extras', name: 'Sonstiges', icon: Tags },
]

const ALL_ITEMS: ShopItem[] = [
  {
    id: 'single-booster',
    category: 'sammelkarten',
    name: 'Starter Pack',
    amount: 1,
    limit: 10,
    price: '0,99 €',
    priceNum: 0.99,
    description: '1 Booster Pack (3 Lehrerkarten).',
    color: 'blue',
    isBooster: true,
    requireAuth: true
  },
  {
    id: 'five-boosters',
    category: 'sammelkarten',
    name: 'Booster Bundle',
    amount: 5,
    limit: 5,
    price: '3,99 €',
    priceNum: 3.99,
    description: '5 Booster Packs (15 Lehrerkarten).',
    color: 'purple',
    badge: 'Beliebt',
    isBooster: true,
    requireAuth: true
  },
  {
    id: 'twelve-boosters',
    category: 'sammelkarten',
    name: 'Elite Box',
    amount: 12,
    limit: 2,
    price: '8,99 €',
    priceNum: 8.99,
    description: '12 Booster Packs (36 Lehrerkarten).',
    color: 'amber',
    badge: 'Bester Wert',
    isBooster: true,
    requireAuth: true
  },
  {
    id: 'soli-donation-small',
    category: 'extras',
    name: 'Kleiner Soli-Beitrag',
    amount: 1,
    limit: 100,
    price: '2,50 €',
    priceNum: 2.50,
    description: 'Unterstütze deine Stufe direkt mit einem kleinen Beitrag.',
    color: 'emerald',
    isPlaceholder: true,
    requireAuth: false
  },
  {
    id: 'soli-donation-large',
    category: 'extras',
    name: 'Großer Soli-Beitrag',
    amount: 1,
    limit: 100,
    price: '10,00 €',
    priceNum: 10.00,
    description: 'Maximale Unterstützung für eure Abikasse.',
    color: 'rose',
    isPlaceholder: true,
    badge: 'Ehren-Aktion',
    requireAuth: false
  }
]

function ShopContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const { getRemainingBoosters } = useUserTeachers()
  
  const availableCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      if (cat.id === 'all') return true
      const itemsInCat = ALL_ITEMS.filter(item => item.category === cat.id as any)
      const accessibleItems = user ? itemsInCat : itemsInCat.filter(i => !i.requireAuth)
      return accessibleItems.length > 0
    })
  }, [user])

  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all')

  // Effect to handle category hiding if user logs out or requested cat is invalid for guest
  useEffect(() => {
    if (activeCategory !== 'all' && !availableCategories.find(c => c.id === activeCategory)) {
      setActiveCategory('all')
    }
  }, [availableCategories, activeCategory])
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [successItem, setSuccessItem] = useState<{name: string, amount: number} | null>(null)
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null)

  // Handle successful purchase return from Stripe
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
    let items = ALL_ITEMS
    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory)
    }
    // Filter out items that require login if user is not authenticated
    if (!user) {
      items = items.filter(item => !item.requireAuth)
    }
    return items
  }, [activeCategory, user])

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const shopStats = (profile?.shop_stats?.month === currentMonthStr && profile?.shop_stats) ? profile.shop_stats.counts : {}

  const handleStripeCheckout = async (item: ShopItem) => {
    if (item.requireAuth && !user) {
      toast.error('Anmeldung erforderlich', {
        description: 'Um Booster-Packs zu sammeln, musst du angemeldet sein.'
      })
      return
    }

    if (item.isPlaceholder) {
      toast.info('Dieser Artikel ist aktuell noch in Vorbereitung.')
      return
    }

    setIsPurchasing(item.id)
    
    try {
      const functions = getFunctions(undefined, 'europe-west3')
      const createSession = httpsCallable<{ itemId: string }, { url: string }>(functions, 'createStripeCheckoutSession')
      
      const result = await createSession({ itemId: item.id })
      
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </Button>
          <div className="flex flex-col items-center">
             <h1 className="font-bold tracking-tight text-sm sm:text-base">Globaler Shop</h1>
             <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">ABI Planer 2027</p>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            <Heart className="w-3 h-3 fill-current" />
            Einnahmen für eure Abikasse
          </div>
          <h2 className="text-4xl font-black tracking-tighter sm:text-6xl italic">Alles für die Stufe</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg font-medium">
            Entdecke Booster-Packs, exklusiven Merch und mehr. 
            <span className="text-foreground block mt-1">90% aller Einnahmen fließen direkt in eure Abikasse!</span>
          </p>
        </section>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border-2",
                activeCategory === cat.id 
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:border-border"
              )}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const currentPurchases = shopStats[item.id] || 0
              const isLimitReached = !item.isPlaceholder && currentPurchases >= item.limit

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.id}
                  className={cn(
                    "relative flex flex-col p-1 rounded-[2.5rem] transition-all duration-500 bg-card border border-border overflow-hidden shadow-2xl",
                    item.badge && !isLimitReached && "ring-2 ring-primary/20 ring-offset-4 ring-offset-background",
                    isLimitReached && "opacity-75 grayscale-[0.5]"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />

                  {item.amount > 1 && !isLimitReached && item.isBooster && (
                    <div className="absolute top-6 left-6 z-20">
                      <Badge className="bg-success text-success-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg border-none">
                        -{Math.round((1 - item.priceNum! / (item.amount * 0.99)) * 100)}% Rabatt
                      </Badge>
                    </div>
                  )}

                  {(item.badge || isLimitReached) && (
                    <div className="absolute top-6 right-6 z-20">
                      <Badge className={cn(
                        "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg border-none",
                        isLimitReached ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                      )}>
                        {isLimitReached ? 'Limit erreicht' : item.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="relative px-8 pb-8 pt-16 flex-1 flex flex-col space-y-8">
                    <div className="py-4 min-h-[180px] flex items-center justify-center">
                       {item.isBooster ? (
                         <BoosterPackVisual amount={item.amount} color={item.color as any} />
                       ) : (
                         <div className={cn(
                           "w-32 h-32 rounded-3xl flex items-center justify-center border-4 rotate-3 shadow-2xl relative",
                           item.color === 'emerald' ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-rose-500/20 border-rose-500 text-rose-500"
                         )}>
                            <div className="absolute inset-0 bg-white/10 rounded-[inherit] blur-xl opacity-0 hover:opacity-100 transition-opacity" />
                            {item.category === 'merch' ? <ShoppingBag className="w-16 h-16" /> : <Heart className="w-16 h-16 fill-current" />}
                         </div>
                       )}
                    </div>

                    <div className="space-y-3 text-center">
                      <h3 className="text-3xl font-black tracking-tight">{item.name}</h3>
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{item.description}</p>
                        {item.amount > 1 && item.isBooster && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 fill-current" />
                            Spare {(item.amount * 0.99 - item.priceNum!).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                          </div>
                        )}
                        <div className={cn("h-1 w-12 rounded-full mt-2", `bg-${item.color}-500/20`)} />
                      </div>
                    </div>

                    {!item.isPlaceholder && (
                      <div className="bg-muted/30 rounded-3xl p-4 flex flex-col items-center justify-center space-y-1 border border-border/50 shadow-inner mt-auto">
                        <div className="flex items-center gap-2">
                           <Clock className="w-3 h-3 text-muted-foreground" />
                           <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">
                             Verfügbar: {item.limit - currentPurchases} / {item.limit}
                           </span>
                        </div>
                      </div>
                    )}
                    
                    {item.isPlaceholder && (
                      <div className="bg-muted/30 rounded-3xl p-4 flex flex-col items-center justify-center space-y-1 border border-border/50 shadow-inner mt-auto">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">Coming Soon</span>
                      </div>
                    )}
                  </div>

                  <div className="p-8 pt-0">
                    <Button
                      className={cn(
                        "w-full font-black h-20 rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden text-xl",
                        isLimitReached ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      disabled={isPurchasing !== null || isLimitReached}
                      onClick={() => {
                        if (item.requireAuth && !user) {
                          toast.error('Anmeldung erforderlich', {
                            description: 'Booster-Packs können nur mit einem registrierten Lernsax-Konto gesammelt werden.'
                          })
                          return
                        }
                        setConfirmItem(item)
                      }}
                    >
                      {isPurchasing === item.id ? (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                          Verarbeite...
                        </div>
                      ) : isLimitReached ? (
                        <span>Limit erreicht</span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center gap-4">
                            {item.amount > 1 && item.isBooster && (
                              <span className="text-sm line-through opacity-40 decoration-1 font-medium">
                                {(item.amount * 0.99).toLocaleString('de-DE', { minimumFractionDigits: 2 })}€
                              </span>
                            )}
                            <span className="text-2xl tracking-tighter">{item.price}</span>
                          </div>
                          {item.requireAuth && !user && (
                            <span className="text-[9px] uppercase tracking-widest opacity-60 mt-1 flex items-center gap-1 font-bold">
                              <Lock className="w-2.5 h-2.5" /> Login erforderlich
                            </span>
                          )}
                        </div>
                      )}
                    </Button>
                  </div>
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
                  <span className="font-black text-foreground text-sm block mb-1 text-primary">90% Spendequote</span>
                  Jeder Kauf unterstützt direkt eure Stufenkasse (90%). Die restlichen 10% decken Serverkosten und App-Entwicklung.
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
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black tracking-tight">Bestellung bestätigen</h3>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Sicherer Checkout</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setConfirmItem(null)} className="rounded-full">
                  <ChevronLeft className="w-5 h-5 rotate-90" />
                </Button>
              </div>

              <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 space-y-4 shadow-inner relative z-10">
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
                  className="w-full h-16 rounded-2xl font-black text-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-3"
                  onClick={() => {
                    handleStripeCheckout(confirmItem);
                    setConfirmItem(null);
                  }}
                  disabled={isPurchasing !== null}
                >
                  <CreditCard className="w-6 h-6" />
                  {confirmItem.isPlaceholder ? 'Aktuell nicht verfügbar' : 'Zur Kasse'}
                </Button>
                <Button variant="ghost" className="w-full font-bold text-muted-foreground hover:text-foreground" onClick={() => setConfirmItem(null)}>
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
    <Suspense fallback={<div className="container mx-auto py-20 text-center"><Zap className="h-8 w-8 animate-pulse mx-auto text-primary" /></div>}>
      <ShopContent />
    </Suspense>
  )
}
