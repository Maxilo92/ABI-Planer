'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore'
import { NewsEntry } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, ArrowLeft, Eye, Calendar, User as UserIcon } from 'lucide-react'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { EditNewsDialog } from '@/components/modals/EditNewsDialog'

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile } = useAuth()
  const [news, setNews] = useState<NewsEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      if (!user) return
      
      try {
        const docRef = doc(db, 'news', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as NewsEntry
          setNews(data)
          
          // One view per user logic
          const viewedBy = data.viewed_by || []
          if (!viewedBy.includes(user.uid)) {
            await updateDoc(docRef, {
              view_count: increment(1),
              viewed_by: arrayUnion(user.uid)
            })
          }
        }
      } catch (err) {
        console.error('Error fetching news detail:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [id, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!news) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">News-Beitrag nicht gefunden.</h2>
        <Button
          variant="link"
          className="mt-4"
          render={<Link href="/news">Zurück zur Übersicht</Link>}
        />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_co' || profile?.role === 'admin_main' || profile?.role === 'admin') && profile?.is_approved

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 space-y-6">
      <div className="px-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          render={
            <Link href="/news">
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Link>
          }
        />
      </div>

      <Card className="border shadow-sm overflow-hidden">
        {news.image_url && (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={news.image_url}
              alt={`Titelbild zu ${news.title}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
              <span className="inline-flex rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                News
              </span>
            </div>
          </div>
        )}
        <CardHeader className="space-y-6 p-6 md:p-10 pb-4 md:pb-6">
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-3xl md:text-5xl font-black tracking-tight leading-[1.15] text-foreground">
              {news.title}
            </CardTitle>
            {isPlanner && (
              <div className="shrink-0 mt-1">
                <EditNewsDialog news={news} />
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm md:text-base text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/70" />
              {news.created_at ? format(toDate(news.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}
            </div>
            
            <Link 
              href={`/profil/${news.created_by}`}
              className="flex items-center gap-2 hover:text-primary transition-colors group"
            >
              <UserIcon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
              <span className="underline decoration-primary/30 underline-offset-4 decoration-2 group-hover:decoration-primary transition-all">
                {news.author_name || 'Unbekannt'}
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary/70" />
              {news.view_count || 0} {news.view_count === 1 ? 'Aufruf' : 'Aufrufe'}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 md:p-10 pt-6 md:pt-8 border-t bg-muted/5">
          <div className="whitespace-pre-wrap text-base md:text-xl text-foreground/90 leading-relaxed max-w-none first-letter:text-4xl first-letter:font-black first-letter:mr-1 first-letter:float-left first-letter:leading-none">
            {news.content.trim()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
