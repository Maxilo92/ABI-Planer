'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { AddNewsDialog } from '@/components/modals/AddNewsDialog'
import { EditNewsDialog } from '@/components/modals/EditNewsDialog'
import { NewsEntry } from '@/types/database'
import { CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, Trash2, ArrowRight, Eye, User as UserIcon } from 'lucide-react'
import { toDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { deleteNewsImageByPath } from '@/lib/newsImageUpload'
import { logAction } from '@/lib/logging'
import ReactMarkdown from 'react-markdown'
import { ShareResourceButton } from '@/components/ui/share-resource-button'

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

  useEffect(() => {
    if (!authLoading && profile) {
      const updateLastVisited = async () => {
        try {
          const now = new Date()
          const lastVisitedStr = profile.last_visited?.news
          const lastVisited = lastVisitedStr ? new Date(lastVisitedStr) : new Date(0)
          
          if (!lastVisitedStr || (now.getTime() - lastVisited.getTime() > 60 * 60 * 1000)) {
            const userRef = doc(db, 'profiles', profile.id)
            await updateDoc(userRef, {
              [`last_visited.news`]: now.toISOString()
            })
          }
        } catch (error) {
          console.error('Error updating last_visited for news:', error)
        }
      }
      updateLastVisited()
    }
  }, [profile, authLoading])

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

      if (profile?.id) {
        await logAction('NEWS_DELETED', profile.id, profile.full_name, {
          news_id: id,
          title: selectedNews?.title,
          had_image: !!selectedNews?.image_url,
        })
      }

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

      <div className="grid grid-cols-1 gap-5">
        {news.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground italic bg-secondary/20 rounded-xl border-2 border-dashed">
            Noch keine Neuigkeiten vorhanden.
          </p>
        ) : (
          news.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl bg-card/65 p-4 md:p-5 ${item.image_url ? 'md:grid md:grid-cols-[280px_1fr] md:gap-6 md:items-start' : ''}`}
            >
                {item.image_url && (
                  <Link href={`/news/${item.id}`} className="block mb-4 md:mb-0">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                      <img
                        src={item.image_url}
                        alt={`Titelbild zu ${item.title}`}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    </div>
                  </Link>
                )}

                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link href={`/news/${item.id}`} className="flex-1 hover:text-primary transition-colors min-w-[220px]">
                      <CardTitle className="text-2xl font-black leading-tight tracking-tight">{item.title}</CardTitle>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <ShareResourceButton
                        resourcePath={`/news/${item.id}`}
                        title={item.title}
                        text="Schau dir diese News im ABI Planer an."
                      />
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

                  <div className="mb-3 mt-3 flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide text-muted-foreground/90">
                    <span>{item.created_at ? format(toDate(item.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}</span>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <UserIcon className="h-3.5 w-3.5" /> {item.author_name || 'Unbekannt'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <Eye className="h-3.5 w-3.5" /> {item.view_count || 0}
                    </span>
                  </div>

                  <div className="text-foreground/80 leading-relaxed line-clamp-4 text-sm md:text-base">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button render={<Link href={`/news/${item.id}`} />} variant="link" size="sm" className="gap-1 p-0 h-auto text-primary">
                      <>Weiterlesen <ArrowRight className="h-4 w-4" /></>
                    </Button>
                  </div>
                </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
