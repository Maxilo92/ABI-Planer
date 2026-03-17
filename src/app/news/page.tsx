'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { AddNewsDialog } from '@/components/modals/AddNewsDialog'
import { NewsEntry } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'

export default function NewsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [news, setNews] = useState<NewsEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsEntry)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin') && profile?.is_approved

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuigkeiten</h1>
          <p className="text-muted-foreground">Aktuelle Updates zur Planung.</p>
        </div>
        {isPlanner && <AddNewsDialog />}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {news.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground italic bg-secondary/20 rounded-xl border-2 border-dashed">
            Noch keine Neuigkeiten vorhanden.
          </p>
        ) : (
          news.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="bg-secondary/20">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-background rounded-md border">
                    {item.created_at ? format(new Date(item.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {item.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
