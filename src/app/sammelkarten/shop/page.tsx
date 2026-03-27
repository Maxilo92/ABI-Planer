'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
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
  AlertCircle,
  Clock,
  Heart
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { BoosterPackVisual } from '@/components/cards/BoosterPackVisual'

const SHOP_ITEMS = [
  {
    id: 'single-booster',
    name: 'Starter Pack',
    amount: 1,
    limit: 10,
    price: '0,99 €',
    description: '1 Booster Pack (3 Lehrerkarten).',
    color: 'blue' as const,
  },
  {
    id: 'five-boosters',
    name: 'Booster Bundle',
    amount: 5,
    limit: 5,
    price: '3,99 €',
    description: '5 Booster Packs (15 Lehrerkarten).',
    color: 'purple' as const,
    badge: 'Beliebt'
  },
  {
    id: 'twelve-boosters',
    name: 'Elite Box',
    amount: 12,
    limit: 2,
    price: '8,99 €',
    description: '12 Booster Packs (36 Lehrerkarten).',
    color: 'amber' as const,
    badge: 'Bester Wert'
  }
]

export default function SammelkartenShopPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const { purchaseBoosters, getRemainingBoosters } = useUserTeachers()
  
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [successItem, setSuccessItem] = useState<{name: string, amount: number} | null>(null)
  const [demoItem, setDemoItem] = useState<typeof SHOP_ITEMS[0] | null>(null)

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const shopStats = (profile?.shop_stats?.month === currentMonthStr && profile?.shop_stats) ? profile.shop_stats.counts : {}

  const handlePurchase = async (item: typeof SHOP_ITEMS[0]) => {
    setIsPurchasing(item.id)
    
    // API Delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      await purchaseBoosters(item.amount, item.id)
      setSuccessItem({ name: item.name, amount: item.amount })
      toast.success(`${item.name} erfolgreich erworben!`)
      setTimeout(() => setSuccessItem(null), 4000)
    } catch (err: any) {
      console.error('Kauf-Fehler:', err)
      toast.error(err.message || 'Kauf fehlgeschlagen. Bitte versuche es später erneut.')
    } finally {
      setIsPurchasing(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
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
             <h1 className="font-bold tracking-tight text-sm sm:text-base">Booster Shop</h1>
             <Badge variant="secondary" className="text-[10px] py-0 px-2 flex items-center gap-1 border border-border shadow-sm">
                <Zap className="w-2.5 h-2.5 fill-current text-primary" />
                <span>{getRemainingBoosters()} Packs verfügbar</span>
             </Badge>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            <Heart className="w-3 h-3 fill-current" />
            90% für eure Abikasse
          </div>
          <h2 className="text-4xl font-black tracking-tighter sm:text-6xl">Erweitere deine Sammlung</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg font-medium">
            Sichere dir zusätzliche Booster-Pakete und entdecke seltene Lehrerkarten. 
            <span className="text-foreground block mt-1">90% aller Einnahmen fließen direkt in eure Abikasse!</span>
          </p>
        </section>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SHOP_ITEMS.map((item) => {
            const currentPurchases = shopStats[item.id] || 0
            const isLimitReached = currentPurchases >= item.limit

            return (
              <motion.div
                key={item.id}
                whileHover={!isLimitReached ? { y: -8 } : {}}
                className={`relative flex flex-col p-1 rounded-[2.5rem] transition-all duration-500 bg-card border border-border overflow-hidden shadow-2xl ${
                  item.badge && !isLimitReached ? 'ring-2 ring-primary/20 ring-offset-4 ring-offset-background' : ''
                } ${isLimitReached ? 'opacity-75 grayscale-[0.5]' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />

                {(item.badge || isLimitReached) && (
                  <div className="absolute top-6 right-6 z-20">
                    <Badge className={`${isLimitReached ? 'bg-destructive' : 'bg-primary'} text-primary-foreground px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg border-none`}>
                      {isLimitReached ? 'Limit erreicht' : item.badge}
                    </Badge>
                  </div>
                )}

                <div className="relative p-8 flex-1 flex flex-col space-y-8">
                  <div className="py-4">
                     <BoosterPackVisual amount={item.amount} color={item.color} />
                  </div>

                  <div className="space-y-3 text-center">
                    <h3 className="text-3xl font-black tracking-tight">{item.name}</h3>
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{item.description}</p>
                      <div className="h-1 w-12 bg-primary/20 rounded-full mt-2" />
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-3xl p-4 flex flex-col items-center justify-center space-y-1 border border-border/50 shadow-inner">
                    <div className="flex items-center gap-2">
                       <Clock className="w-3 h-3 text-muted-foreground" />
                       <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">
                         Verfügbar: {item.limit - currentPurchases} / {item.limit}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <Button
                    className={`w-full font-black h-16 rounded-2xl text-xl shadow-xl transition-all duration-300 ${
                      isLimitReached ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                    disabled={isPurchasing !== null || isLimitReached}
                    onClick={() => setDemoItem(item)}
                  >
                    {isPurchasing === item.id ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        Verarbeite...
                      </div>
                    ) : isLimitReached ? (
                      'Limit erreicht'
                    ) : (
                      <div className="flex items-center justify-center">
                        {item.price}
                      </div>
                    )}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Legal Stuff Footer */}
        <section className="pt-12 border-t border-border space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-muted-foreground leading-relaxed font-medium">
             <div className="space-y-3 p-6 bg-card border border-border rounded-2xl">
                <h5 className="font-black text-foreground uppercase tracking-[0.15em] flex items-center gap-2 text-[10px]">
                   <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                   Fair-Play Garantie
                </h5>
                <p>
                  Monatliche Limits helfen dabei, das Spielgleichgewicht zu wahren. Wir möchten sicherstellen, dass der Sammelspaß 
                  für alle Schüler im Vordergrund steht.
                </p>
             </div>
             <div className="space-y-3 p-6 bg-card border border-border rounded-2xl">
                <h5 className="font-black text-foreground uppercase tracking-[0.15em] flex items-center gap-2 text-[10px]">
                   <TrendingUp className="w-3.5 h-3.5 text-info" />
                   Transparenz
                </h5>
                <p>
                  Alle Booster enthalten zufällige Inhalte nach mathematisch festgelegten Quoten. 
                  Details findest du auf unserer <Link href="/sammelkarten/info" className="text-info font-bold underline underline-offset-4 hover:text-info/80">Info-Seite</Link>.
                </p>
             </div>
             <div className="space-y-3 p-6 bg-card border border-border rounded-2xl border-primary/20 bg-primary/5">
                <h5 className="font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2 text-[10px]">
                   <Trophy className="w-3.5 h-3.5" />
                   Euer Abiball
                </h5>
                <p className="text-foreground/80">
                  <span className="font-black text-foreground text-sm block mb-1 text-primary">90% Spendequote</span>
                  Jeder Kauf unterstützt direkt eure Stufenkasse (90%). Die restlichen 10% decken Serverkosten und die App-Entwicklung.
                </p>
             </div>
           </div>
           
           <div className="flex flex-wrap justify-center gap-8 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> SSL Verschlüsselt</span>
              <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Digitale Zustellung</span>
              <span className="flex items-center gap-2"><Star className="w-4 h-4" /> Support 24/7</span>
           </div>
        </section>
      </main>

      {/* Demo Purchase Modal */}
      <AnimatePresence>
        {demoItem && (
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
                  <h3 className="text-3xl font-black tracking-tight">Kauf bestätigen</h3>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Demo Transaktion</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDemoItem(null)} className="rounded-full">
                  <ChevronLeft className="w-5 h-5 rotate-90" />
                </Button>
              </div>

              <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 space-y-4 shadow-inner relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Artikel</span>
                  <span className="font-black text-lg">{demoItem.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Inhalt</span>
                  <span className="font-black">{demoItem.amount} Booster Packs</span>
                </div>
                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="text-lg font-black tracking-tight">Gesamtpreis</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">{demoItem.price}</span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Dies ist eine Simulation. Es werden keine echten Zahlungsdaten erhoben oder Kosten verursacht.</span>
                </div>
                
                <Button 
                  className="w-full h-16 rounded-2xl font-black text-xl shadow-lg hover:shadow-primary/20 transition-all"
                  onClick={() => {
                    handlePurchase(demoItem);
                    setDemoItem(null);
                  }}
                >
                  Kaufen
                </Button>
                <Button variant="ghost" className="w-full font-bold text-muted-foreground hover:text-foreground" onClick={() => setDemoItem(null)}>
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
                <h3 className="text-3xl font-black tracking-tighter">Vielen Dank!</h3>
                <p className="text-muted-foreground font-bold">
                  Du hast <span className="text-foreground font-black">{successItem.amount} Booster Packs</span> erhalten.
                </p>
              </div>

              <Button onClick={() => setSuccessItem(null)} className="w-full h-14 rounded-2xl font-black text-lg bg-primary text-primary-foreground shadow-lg">
                Weiter sammeln
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
