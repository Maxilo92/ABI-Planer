"use client"
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft,
  Zap,
  CheckCircle2,
  Trophy,
  Gift,
  Calendar,
  Sparkles,
  AlertCircle,
  X,
  ArrowRight,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function AboPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isPurchasing, setIsPurchasing] = useState(false)

  // Feature is currently disabled
  const isFeatureEnabled = false;

  if (!isFeatureEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-8">
        <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center rotate-3 border-2 border-dashed border-border">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter italic">Premium Abo pausiert</h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Das Premium Abo ist aktuell nicht verfügbar. Wir optimieren das System und die Boni für euch. 
            NP-Guthaben bleiben weiterhin gültig (sobald das System wieder aktiv ist).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline" className="h-14 px-8 rounded-2xl font-black text-lg">
            <Link href="/">Dashboard</Link>
          </Button>
          <Button asChild className="h-14 px-8 rounded-2xl font-black text-lg">
            <Link href="/shop">Zum Shop</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleSubscriptionCheckout = async () => {
    if (!user) {
      toast.error('Anmeldung erforderlich', {
        description: 'Du musst angemeldet sein um ein Abo abzuschließen.'
      })
      return
    }

    setIsPurchasing(true)
    try {
      const functions = getFunctions(undefined, 'europe-west3')
      const createSession = httpsCallable<{ itemId: string }, { url: string }>(functions, 'createStripeCheckoutSession')
      
      const result = await createSession({ itemId: 'subscription-monthly' })
      
      if (result.data.url) {
        window.location.href = result.data.url
      } else {
        throw new Error('Keine Checkout-URL erhalten.')
      }
    } catch (err: any) {
      console.error('Stripe-Error:', err)
      toast.error(err.message || 'Bezahlvorgang konnte nicht gestartet werden.')
      setIsPurchasing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
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
          <h1 className="font-bold tracking-tight">Premium Abo</h1>
          <div className="w-20" />
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">
            <Trophy className="w-3 h-3 fill-current" />
            Exklusive Features
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter italic">Premium Abo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-base sm:text-lg">
            Schalte Premium-Inhalte frei und erhalte monatliche Boni.
          </p>
        </section>

        {/* Main Offer Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-8 sm:p-12"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">€4,99</h3>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">pro Monat • monatlich kündbar</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-border/50">
                {[
                  { icon: Trophy, text: 'Premium Battle Pass – 50 exklusive Tiers' },
                  { icon: Zap, text: '500 NP monatlich zum Ausgeben' },
                  { icon: Gift, text: 'Exklusive Cosmetics & Early Access' },
                  { icon: Calendar, text: 'Automatische Verlängerung • Jederzeit kündbar' },
                  { icon: CheckCircle2, text: 'Werbefreies Erlebnis' }
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <feature.icon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5 fill-current" />
                    <span className="font-bold text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-auto flex-shrink-0">
              <div className="relative w-48 h-64 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-40 h-52 rounded-3xl flex flex-col items-center justify-center border-4 border-purple-500 shadow-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <Trophy className="w-16 h-16 text-purple-500 mb-2" />
                  <div className="text-center">
                    <p className="font-black text-sm">PREMIUM</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Pass</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!user && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-20">
              <div className="text-center space-y-3">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-bold text-sm">Anmelden erforderlich</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="px-8 h-16 text-lg font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all"
            onClick={handleSubscriptionCheckout}
            disabled={isPurchasing || !user}
          >
            {isPurchasing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                Wird verarbeitet...
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Jetzt abonnieren
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-8 h-16 text-lg font-black rounded-2xl"
            onClick={() => router.push('/shop')}
          >
            Zum Shop
          </Button>
        </div>

        {/* Comparison Table */}
        <section className="space-y-6 pt-12 border-t border-border">
          <h3 className="text-2xl font-black tracking-tight">Was bekommst du?</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-black text-xs uppercase tracking-widest text-muted-foreground">Feature</th>
                  <th className="text-center py-3 px-4 font-black text-xs uppercase tracking-widest">Kostenlos</th>
                  <th className="text-center py-3 px-4 font-black text-xs uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 rounded-lg">Premium</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {[
                  { feature: 'Battle Pass Tiers', free: '25 (Free)', premium: '50 (Free + Premium)' },
                  { feature: 'NP monatlich', free: '0', premium: '500' },
                  { feature: 'Premium Cosmetics', free: 'Nein', premium: 'Ja' },
                  { feature: 'Early Access', free: 'Nein', premium: 'Ja' },
                  { feature: 'Werbefreies Erlebnis', free: 'Nein', premium: 'Ja' },
                  { feature: 'Kündbar jederzeit', free: '—', premium: 'Ja' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-xs uppercase tracking-widest">{row.feature}</td>
                    <td className="text-center py-3 px-4 text-muted-foreground font-semibold">{row.free}</td>
                    <td className="text-center py-3 px-4 bg-purple-500/5 rounded-lg">
                      <CheckCircle2 className={row.premium === 'Ja' ? 'w-5 h-5 mx-auto text-success' : 'w-5 h-5 mx-auto text-muted-foreground'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6 pt-12 border-t border-border">
          <h3 className="text-2xl font-black tracking-tight">Häufige Fragen</h3>
          
          <div className="space-y-4">
            {[
              {
                q: 'Kann ich jederzeit kündigen?',
                a: 'Ja, du kannst dein Abo jederzeit in den Einstellungen kündigen. Keine versteckten Bedingungen.'
              },
              {
                q: 'Was passiert nach dem Kündigen?',
                a: 'Du verlierst Zugang zum Premium Battle Pass, bekommst aber weiterhin den kostenlosen Pass. NP werden nicht gelöscht.'
              },
              {
                q: 'Gibt es eine Testphase?',
                a: 'Nein, aber du kannst jederzeit kündigen. Du zahlst nur für die Tage, die du nutzt.'
              },
              {
                q: 'Wie werden die 500 NP beansprucht?',
                a: 'Die 500 NP werden automatisch zu deinem Account hinzugefügt, wenn dein Abo erneuert wird.'
              },
              {
                q: 'Kann ich mehrere Abos haben?',
                a: 'Nein, du kannst nur ein aktives Premium Abo haben. Ein neues Abo verlängert die aktuelle Dauer.'
              },
              {
                q: 'Ist meine Zahlung sicher?',
                a: 'Ja, wir verwenden Stripe für sichere Zahlungsabwicklung. Wir speichern keine Kreditkartendaten.'
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 sm:p-6 rounded-2xl border border-border/50 bg-card hover:border-border transition-colors space-y-2"
              >
                <h4 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {faq.q}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="text-center py-12 border-t border-border space-y-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Bereit für Premium?</h3>
            <p className="text-muted-foreground">Upgrafe deinen Account jetzt und genieße alle Vorteile!</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="px-8 h-14 text-base font-black rounded-2xl shadow-xl"
              onClick={handleSubscriptionCheckout}
              disabled={isPurchasing || !user}
            >
              {isPurchasing ? 'Wird verarbeitet...' : 'Jetzt abonnieren'}
            </Button>
            <Link href="/shop">
              <Button variant="outline" size="lg" className="px-8 h-14 text-base font-black rounded-2xl w-full">
                Weiter shoppen
              </Button>
            </Link>
          </div>

          {!user && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-amber-700">
                <Link href="/login" className="underline hover:no-underline">
                  Melden dich an
                </Link>
                , um das Premium Abo abzuschließen.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
