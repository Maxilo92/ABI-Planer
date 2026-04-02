'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, limit } from 'firebase/firestore'
import { NewsEntry, Settings } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, Construction, MessageSquare, ArrowLeft, LogIn } from 'lucide-react'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Logo from '@/components/Logo'
import { useAuth } from '@/context/AuthContext'

export default function MaintenancePage() {
  const { profile } = useAuth()
  const [maintenance, setMaintenance] = useState<Settings['maintenance'] | null>(null)
  const [news, setNews] = useState<NewsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const isAdmin = ['admin_main', 'admin', 'admin_co'].includes(profile?.role || '')

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const unsubMaintenance = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setMaintenance(snap.data().maintenance)
      }
      setLoading(false)
    })

    const qNews = query(collection(db, 'news'), orderBy('created_at', 'desc'), limit(3))
    const unsubNews = onSnapshot(qNews, (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsEntry)))
      setNewsLoading(false)
    })

    return () => {
      unsubMaintenance()
      unsubNews()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Lade Systemstatus...</p>
      </div>
    )
  }

  const isMaintenanceActive = maintenance?.active || (maintenance?.start && new Date(maintenance.start) <= now)
  const estimatedEnd = maintenance?.end ? new Date(maintenance.end) : null
  const hasEnded = estimatedEnd && estimatedEnd <= now

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="max-w-3xl w-full space-y-12">
        {/* Header/Logo */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Logo width={180} height={60} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-black uppercase tracking-widest mt-4">
            <Construction className="h-3.5 w-3.5" />
            Wartungspause
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-2">
            Wir sind gleich wieder da.
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            {maintenance?.message || 'Wir führen gerade wichtige Wartungsarbeiten durch, um den ABI Planer noch besser zu machen. Bitte hab ein wenig Geduld.'}
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-2 border-primary/10 shadow-xl overflow-hidden bg-muted/5">
          <CardHeader className="bg-muted/30 border-b py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              Systemstatus
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            {estimatedEnd && !hasEnded ? (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Geschätzte verbleibende Zeit</p>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-primary">
                  {formatDistanceToNow(estimatedEnd, { locale: de, addSuffix: false })}
                </div>
                <p className="text-[10px] text-muted-foreground opacity-60">
                  Voraussichtliches Ende: {format(estimatedEnd, 'HH:mm', { locale: de })} Uhr
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Status</p>
                <div className="text-2xl font-black text-amber-600">
                  Arbeiten werden abgeschlossen...
                </div>
                <p className="text-xs text-muted-foreground">Wir sind in wenigen Augenblicken wieder für dich da.</p>
              </div>
            )}

            {!isMaintenanceActive && (
              <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-sm font-medium text-emerald-600 mb-4">Wartung wurde beendet!</p>
                <Link href="/">
                  <Button className="gap-2 shadow-lg shadow-primary/20">
                    <ArrowLeft className="h-4 w-4" /> Zurück zum ABI Planer
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* News Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Letzte News</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {newsLoading ? (
              [1, 2].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/30" />)
            ) : news.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground italic">Keine News vorhanden.</p>
            ) : (
              news.map(item => (
                <Link key={item.id} href={`/news/${item.id}`} className="block group">
                  <Card className="bg-card/50 hover:bg-card transition-colors">
                    <CardContent className="p-5 flex gap-4">
                      {item.image_url && (
                        <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden shrink-0 border">
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                            {format(toDate(item.created_at), 'dd.MM.')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.content.replace(/[#*`_~\[\]()]/g, '')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Admin Footer */}
        <div className="flex justify-center pt-8 opacity-40 hover:opacity-100 transition-opacity">
          {isAdmin ? (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-widest gap-2">
                <ArrowLeft className="h-3 w-3" /> Admin Bereich
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-widest gap-2">
                <LogIn className="h-3 w-3" /> Admin Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
