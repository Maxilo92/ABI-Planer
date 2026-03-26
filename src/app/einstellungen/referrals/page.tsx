'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Copy, 
  Check, 
  Gift, 
  Info, 
  ChevronLeft, 
  Trophy, 
  Calendar,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Referral } from '@/types/referrals'

export default function ReferralsPage() {
  const { user, profile, loading } = useAuth()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [fetchingReferrals, setFetchingReferrals] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return

    const fetchReferrals = async () => {
      try {
        setFetchingReferrals(true)
        const referralsRef = collection(db, 'referrals')
        const q = query(
          referralsRef, 
          where('referrerId', '==', user.uid),
          orderBy('timestamp', 'desc')
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => doc.data() as Referral)
        setReferrals(data)
      } catch (error) {
        console.error('Error fetching referrals:', error)
      } finally {
        setFetchingReferrals(false)
      }
    }

    fetchReferrals()
  }, [user])

  const referralLink = useMemo(() => {
    const code = profile?.referral_code || user?.uid?.slice(0, 8)
    if (!code) return ''
    return `abi-planer-27.de/r/${code}`
  }, [profile?.referral_code, user?.uid])

  const copyToClipboard = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setIsCopied(true)
      toast.success('Link kopiert!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      toast.error('Kopieren fehlgeschlagen.')
    }
  }

  const monthlyStats = useMemo(() => {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    // Sum boostersAwarded for all referrals this month
    const monthlyReferrals = referrals.filter(r => 
      r.timestamp >= firstDayOfMonth
    )
    
    const boostersThisMonth = monthlyReferrals.reduce((sum, r) => sum + (r.boostersAwarded || 0), 0)
    
    return {
      boosters: boostersThisMonth,
      limit: 30,
      progress: Math.min((boostersThisMonth / 30) * 100, 100)
    }
  }, [referrals])

  const nextRewardStats = useMemo(() => {
    // Scaling reward: 2 + totalPastReferrals, capped at 10
    // Only count 'standard' type referrals for the scaling reward base
    const standardReferralsCount = referrals.filter(r => r.type === 'standard').length
    const nextAmount = Math.min(2 + standardReferralsCount, 10)
    
    return {
      total: standardReferralsCount,
      nextAmount
    }
  }, [referrals])

  if (loading || (fetchingReferrals && !referrals.length)) {
    return <div className="py-8 text-center text-muted-foreground">Lade Einladungs-Dashboard...</div>
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          render={
            <Link href="/einstellungen">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
        />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Freunde einladen</h1>
          <p className="text-muted-foreground mt-1">Sammle Bonus-Booster für dich und deine Freunde.</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" /> Dein Einladungs-Link
          </CardTitle>
          <CardDescription>
            Teile diesen Link mit deinen Mitschülern. Je mehr Freunde du einlädst, desto mehr Booster erhältst du!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 px-3 py-2 bg-background border rounded-md font-mono text-sm flex items-center overflow-x-auto whitespace-nowrap">
              {referralLink}
            </div>
            <Button onClick={copyToClipboard} className="gap-2 shrink-0">
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isCopied ? 'Kopiert' : 'Link kopieren'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            Deine Freunde müssen den Link bei der Registrierung nutzen (oder den Code manuell eingeben).
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-500" /> Monatlicher Fortschritt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{monthlyStats.boosters} von {monthlyStats.limit}</span>
              <span className="text-sm text-muted-foreground">Booster diesen Monat</span>
            </div>
            <Progress value={monthlyStats.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Du kannst jeden Monat bis zu 30 Bonus-Booster durch Einladungen verdienen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-orange-500" /> Belohnungs-Stufe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Dein nächster Freund bringt dir</span>
              <span className="text-3xl font-bold">{nextRewardStats.nextAmount} Booster</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Je mehr Freunde du einlädst, desto höher wird deine Belohnung (bis zu 10 Booster).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> Deine geworbenen Freunde
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground border border-dashed rounded-lg">
              Du hast noch keine Freunde geworben. Teile deinen Link!
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {referral.type === 'milestone' ? 'Meilenstein-Bonus' : 'Erfolgreich geworben'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.timestamp).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    referral.type === 'milestone' 
                      ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400' 
                      : 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400'
                  }`}>
                    {referral.type === 'milestone' ? <Trophy className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
                    +{referral.boostersAwarded || 0} Booster
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
