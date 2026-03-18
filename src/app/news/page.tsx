'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { AddNewsDialog } from '@/components/modals/AddNewsDialog'
import { EditNewsDialog } from '@/components/modals/EditNewsDialog'
import { NewsEntry } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, Trash2, ArrowRight, Eye, User as UserIcon } from 'lucide-react'
import { toDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { deleteNewsImageByPath } from '@/lib/newsImageUpload'

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

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin_co' || profile?.role === 'admin_main' || profile?.role === 'admin') && profile?.is_approved

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du diesen News-Beitrag wirklich löschen?')) return

    try {
      const selectedNews = news.find((item) => item.id === id)
      if (selectedNews?.image_path) {
        await deleteNewsImageByPath(selectedNews.image_path)
      }
      await deleteDoc(doc(db, 'news', id))
      toast.success('Beitrag erfolgreich gelöscht.')
    } catch (err) {
      console.error('Error deleting news:', err)
      toast.error('Fehler beim Löschen des Beitrags.')
    }
  }

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-muted/40 to-background p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-primary/5 blur-xl" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuigkeiten</h1>
          <p className="text-muted-foreground mt-1">Aktuelle Updates zur Planung, Entscheidungen und wichtigen Terminen.</p>
        </div>
        <div className="mt-4">
          {isPlanner && <AddNewsDialog />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {news.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground italic bg-secondary/20 rounded-xl border-2 border-dashed">
            Noch keine Neuigkeiten vorhanden.
          </p>
        ) : (
          news.map((item) => (
            <Card key={item.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
              {item.image_url && (
                <Link href={`/news/${item.id}`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={`Titelbild zu ${item.title}`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                  </div>
                </Link>
              )}
              <CardHeader className="py-4 px-5 md:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/news/${item.id}`} className="flex-1 hover:text-primary transition-colors min-w-[220px]">
                    <CardTitle className="text-xl font-bold leading-tight">{item.title}</CardTitle>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {isPlanner && (
                      <div className="flex items-center gap-1">
                        <EditNewsDialog news={item} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-5 px-5 md:px-6">
                <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{item.created_at ? format(toDate(item.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" /> {item.author_name || 'Unbekannt'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> {item.view_count || 0}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed line-clamp-3 text-sm md:text-base">
                  {item.content}
                </div>
                <div className="flex justify-end mt-4">
                  <Button render={<Link href={`/news/${item.id}`} />} variant="link" size="sm" className="gap-1 p-0 h-auto text-primary">
                    <>Weiterlesen <ArrowRight className="h-4 w-4" /></>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
