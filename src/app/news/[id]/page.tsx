'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { NewsEntry } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, ArrowLeft, Eye, Calendar, User } from 'lucide-react'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { EditNewsDialog } from '@/components/modals/EditNewsDialog'

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useAuth()
  const [news, setNews] = useState<NewsEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const docRef = doc(db, 'news', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setNews({ id: docSnap.id, ...docSnap.data() } as NewsEntry)
          
          // Increment view count (simple implementation)
          await updateDoc(docRef, {
            view_count: increment(1)
          })
        }
      } catch (err) {
        console.error('Error fetching news detail:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [id])

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
        <Button render={<Link href="/news" />} variant="link" className="mt-4">
          Zurück zur Übersicht
        </Button>
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_co' || profile?.role === 'admin_main') && profile?.is_approved

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button render={<Link href="/news" />} variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground">
        <><ArrowLeft className="h-4 w-4" /> Zurück</>
      </Button>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {news.title}
            </CardTitle>
            {isPlanner && (
              <div className="shrink-0">
                <EditNewsDialog news={news} />
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {news.created_at ? format(toDate(news.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}
            </div>
            {news.author_name && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {news.author_name}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {news.view_count || 0} Aufrufe
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-0 pt-6 border-t">
          <div className="whitespace-pre-wrap text-lg text-foreground/90 leading-relaxed">
            {news.content}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
