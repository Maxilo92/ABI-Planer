'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { generateSeededPixelAvatar, PIXEL_AVATAR_GALLERY, AVATAR_PALETTE } from '@/lib/avatar'
import { AnimatedNftAvatar } from '@/components/ui/animated-nft-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Sparkles,
  Check,
  Lock,
  Coins,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Star,
  Wand2,
  Image as ImageIcon,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// ----- Shop catalogue -----
type AvatarShopItem = {
  seed: string
  label: string
  description: string
  price: number      // in NP; 0 = free
  category: 'free' | 'premium' | 'exclusive'
  palette?: string[] // accent colors for card glow
}

const SHOP_ITEMS: AvatarShopItem[] = [
  // Free starters
  { seed: 'aurora-grid',    label: 'Aurora Grid',    description: 'Klares, kontrastreiches Muster',         price: 0,   category: 'free',      palette: ['#FF595E','#1982C4'] },
  { seed: 'sunset-loop',    label: 'Sunset Loop',    description: 'Warme Farben mit ruhigem Verlauf',       price: 0,   category: 'free',      palette: ['#FFCA3A','#F4A261'] },
  { seed: 'glacier-drift',  label: 'Glacier Drift',  description: 'Kühle Töne mit technischer Anmutung',   price: 0,   category: 'free',      palette: ['#1982C4','#2A9D8F'] },
  // Premium (NP)
  { seed: 'pixel-forest',   label: 'Pixel Forest',   description: 'Grüne, organische Symmetrie',            price: 50,  category: 'premium',   palette: ['#8AC926','#2A9D8F'] },
  { seed: 'neon-dawn',      label: 'Neon Dawn',      description: 'Leuchtende Farben mit starkem Kontrast', price: 75,  category: 'premium',   palette: ['#FF595E','#6A4C93'] },
  { seed: 'ember-core',     label: 'Ember Core',     description: 'Dunkler Kern mit Feuerakzenten',         price: 75,  category: 'premium',   palette: ['#E76F51','#E07A5F'] },
  { seed: 'cobalt-storm',   label: 'Cobalt Storm',   description: 'Tiefes Blau mit elektrischen Akzenten',  price: 100, category: 'premium',   palette: ['#3D405B','#1982C4'] },
  { seed: 'sakura-bloom',   label: 'Sakura Bloom',   description: 'Zarte Rosatöne und Pastellharmnie',      price: 100, category: 'premium',   palette: ['#F2CC8F','#E07A5F'] },
  { seed: 'void-matrix',    label: 'Void Matrix',    description: 'Mono­chromes Dunkel für Minimalisten',   price: 120, category: 'premium',   palette: ['#2B2D42','#3D405B'] },
  // Exclusive
  { seed: 'gold-legend',    label: 'Gold Legend',    description: 'Legendäres Gold-Prestige-Design',        price: 250, category: 'exclusive', palette: ['#FFCA3A','#F2CC8F'] },
  { seed: 'prisma-elite',   label: 'Prisma Elite',   description: 'Alle 16 Farben in perfekter Balance',    price: 300, category: 'exclusive', palette: AVATAR_PALETTE.slice(0, 4) },
  { seed: 'obsidian-crown', label: 'Obsidian Crown', description: 'Das dunkelste Prestige-Avatar',          price: 400, category: 'exclusive', palette: ['#2B2D42','#6A4C93'] },
]

const CATEGORY_LABELS: Record<AvatarShopItem['category'], string> = {
  free:      'Kostenlos',
  premium:   'Premium',
  exclusive: 'Exklusiv',
}

const CATEGORY_COLORS: Record<AvatarShopItem['category'], string> = {
  free:      'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  premium:   'bg-primary/10 text-primary border-primary/20',
  exclusive: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
}

// ---- Confirm Dialog ----
function PurchaseConfirmDialog({
  item,
  npBalance,
  onConfirm,
  onCancel,
  loading,
}: {
  item: AvatarShopItem
  npBalance: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const canAfford = npBalance >= item.price
  const avatarUrl = useMemo(() => generateSeededPixelAvatar(item.seed), [item.seed])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col items-center text-center gap-4 relative z-10">
          <AnimatedNftAvatar url={avatarUrl} size={128} className="w-24 h-24 shadow-xl" />
          <div>
            <h3 className="text-xl font-black tracking-tight">{item.label}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-black text-lg">{item.price} NP</span>
          </div>
          {!canAfford && (
            <p className="text-sm text-destructive font-bold">
              Nicht genug NP (du hast {npBalance} NP)
            </p>
          )}
        </div>

        <div className="flex gap-3 relative z-10">
          <Button variant="outline" className="flex-1 font-bold" onClick={onCancel} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            className="flex-1 font-black gap-2"
            onClick={onConfirm}
            disabled={!canAfford || loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Kaufen
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---- Avatar Card ----
function AvatarCard({
  item,
  isOwned,
  isEquipped,
  npBalance,
  onSelect,
  onEquip,
}: {
  item: AvatarShopItem
  isOwned: boolean
  isEquipped: boolean
  npBalance: number
  onSelect: (item: AvatarShopItem) => void
  onEquip: (item: AvatarShopItem) => void
}) {
  const avatarUrl = useMemo(() => generateSeededPixelAvatar(item.seed), [item.seed])
  const canAfford = npBalance >= item.price
  const isFree = item.price === 0
  const glowColor = item.palette?.[0] ?? '#7DD200'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-card transition-all duration-300 overflow-hidden',
        isEquipped
          ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/40'
          : 'border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
        !isOwned && !canAfford && 'opacity-60'
      )}
    >
      {/* Glow overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top, ${glowColor}18 0%, transparent 70%)` }}
      />

      {/* Category badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className={cn('text-[9px] font-black uppercase tracking-wider border', CATEGORY_COLORS[item.category])}>
          {item.price === 0 ? (
            <><Check className="w-2.5 h-2.5 mr-1" />Gratis</>
          ) : (
            <>{item.category === 'exclusive' ? <Star className="w-2.5 h-2.5 mr-1 fill-current" /> : null}{CATEGORY_LABELS[item.category]}</>
          )}
        </Badge>
      </div>

      {/* Equipped badge */}
      {isEquipped && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider gap-1">
            <Check className="w-2.5 h-2.5" /> Aktiv
          </Badge>
        </div>
      )}

      {/* Avatar preview */}
      <div className="relative flex items-center justify-center py-8 px-4">
        <div className={cn(
          'transition-transform duration-500 group-hover:scale-110',
          isEquipped && 'scale-105'
        )}>
          <AnimatedNftAvatar
            url={avatarUrl}
            size={128}
            className={cn(
              'w-20 h-20 shadow-xl',
              isEquipped && 'ring-4 ring-primary/60 ring-offset-2 ring-offset-card'
            )}
          />
        </div>
        {!isOwned && !isFree && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
            {canAfford
              ? <ShoppingBag className="w-8 h-8 text-primary" />
              : <Lock className="w-8 h-8 text-muted-foreground" />
            }
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-black tracking-tight text-sm leading-tight">{item.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          {isFree ? (
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Kostenlos</span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-black">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              {item.price} NP
            </span>
          )}
        </div>

        {/* Action button */}
        {isEquipped ? (
          <Button size="sm" variant="secondary" className="w-full h-9 text-xs font-black uppercase tracking-widest" disabled>
            <Check className="w-3.5 h-3.5 mr-1.5" /> Ausgerüstet
          </Button>
        ) : isOwned || isFree ? (
          <Button
            size="sm"
            className="w-full h-9 text-xs font-black uppercase tracking-widest gap-1.5"
            onClick={() => onEquip(item)}
          >
            <Wand2 className="w-3.5 h-3.5" /> Ausrüsten
          </Button>
        ) : (
          <Button
            size="sm"
            variant={canAfford ? 'default' : 'secondary'}
            className="w-full h-9 text-xs font-black uppercase tracking-widest gap-1.5"
            onClick={() => onSelect(item)}
            disabled={!canAfford}
          >
            {canAfford ? (
              <><ShoppingBag className="w-3.5 h-3.5" /> Kaufen</>
            ) : (
              <><Lock className="w-3.5 h-3.5" /> Zu wenig NP</>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// ---- Main Page ----
export default function AvatarShopPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<'all' | AvatarShopItem['category']>('all')
  const [confirmItem, setConfirmItem] = useState<AvatarShopItem | null>(null)
  const [purchasing, setPurchasing] = useState(false)

  const npBalance = profile?.currencies?.notepunkte ?? 0
  // Owned seeds: free seeds are always "owned"; purchased stored in cosmetics.purchased_avatar_seeds
  const purchasedSeeds: string[] = (profile?.cosmetics as any)?.purchased_avatar_seeds ?? []
  const equippedSeed: string | null = profile?.cosmetics?.pixel_avatar_seed ?? null
  const ownedSeeds = useMemo(() => {
    const free = SHOP_ITEMS.filter(i => i.price === 0).map(i => i.seed)
    return [...new Set([...free, ...purchasedSeeds])]
  }, [purchasedSeeds])

  const filtered = useMemo(() =>
    activeCategory === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.category === activeCategory),
    [activeCategory]
  )

  const handleEquip = useCallback(async (item: AvatarShopItem) => {
    if (!user) return
    try {
      const avatarUrl = generateSeededPixelAvatar(item.seed)
      await updateDoc(doc(db, 'profiles', user.uid), {
        'cosmetics.pixel_avatar_seed': item.seed,
        'cosmetics.pixel_avatar_mode': 'purchased',
        photo_url: avatarUrl,
      })
      toast.success(`${item.label} ausgerüstet!`, { description: 'Dein Profilbild wurde aktualisiert.' })
    } catch {
      toast.error('Fehler beim Ausrüsten.')
    }
  }, [user])

  const handlePurchase = useCallback(async () => {
    if (!confirmItem || !user || !profile) return
    setPurchasing(true)
    try {
      const newNp = npBalance - confirmItem.price
      const newPurchased = [...purchasedSeeds, confirmItem.seed]
      const avatarUrl = generateSeededPixelAvatar(confirmItem.seed)
      await updateDoc(doc(db, 'profiles', user.uid), {
        'currencies.notepunkte': newNp,
        'cosmetics.purchased_avatar_seeds': newPurchased,
        'cosmetics.pixel_avatar_seed': confirmItem.seed,
        'cosmetics.pixel_avatar_mode': 'purchased',
        photo_url: avatarUrl,
      })
      toast.success(`${confirmItem.label} gekauft & ausgerüstet!`, {
        description: `${confirmItem.price} NP wurden abgezogen.`
      })
      setConfirmItem(null)
    } catch {
      toast.error('Kauf fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setPurchasing(false)
    }
  }, [confirmItem, user, profile, npBalance, purchasedSeeds])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/login?reason=unauthorized')
    return null
  }

  const currentAvatarUrl = equippedSeed ? generateSeededPixelAvatar(equippedSeed) : profile.photo_url

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" className="w-fit gap-2 font-bold text-muted-foreground" render={<Link href="/profil" />}>
          <ArrowLeft className="w-4 h-4" /> Zurück zum Profil
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-5 h-5 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Profil</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Avatar<span className="text-primary">Shop</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Kaufe einzigartige Pixel-Avatare mit Notenpunkten
          </p>
        </div>

        {/* NP balance + current avatar */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm">
          {currentAvatarUrl?.startsWith('data:image/svg+xml;base64,') && (
            <AnimatedNftAvatar url={currentAvatarUrl} size={64} className="w-12 h-12 shrink-0" />
          )}
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Notenpunkte</p>
            <div className="flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-black">{npBalance}</span>
              <span className="text-xs font-bold text-muted-foreground">NP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'free', 'premium', 'exclusive'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all',
              activeCategory === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            )}
          >
            {cat === 'all' ? 'Alle' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map(item => (
            <AvatarCard
              key={item.seed}
              item={item}
              isOwned={ownedSeeds.includes(item.seed)}
              isEquipped={equippedSeed === item.seed}
              npBalance={npBalance}
              onSelect={setConfirmItem}
              onEquip={handleEquip}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Info footer */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 text-xs text-muted-foreground space-y-1.5">
        <p className="font-black text-foreground text-sm flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500" /> Wie bekomme ich Notenpunkte?
        </p>
        <p>Notenpunkte (NP) erhältst du durch das Abschließen von Aufgaben, Abstimmungen und Events.</p>
        <p>Gekaufte Avatare bleiben dauerhaft in deiner Sammlung – auch wenn du ein anderes Design ausrüstest.</p>
      </div>

      {/* Purchase confirm dialog */}
      <AnimatePresence>
        {confirmItem && (
          <PurchaseConfirmDialog
            item={confirmItem}
            npBalance={npBalance}
            onConfirm={handlePurchase}
            onCancel={() => setConfirmItem(null)}
            loading={purchasing}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
