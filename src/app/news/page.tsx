'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { Loader2, Trash2, ArrowRight, Eye, User as UserIcon, Smile, MessageSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toDate } from '@/lib/utils'
import { useSystemMessage } from '@/context/SystemMessageContext'
import Link from 'next/link'
import { deleteNewsImageByPath } from '@/lib/newsImageUpload'
import { logAction } from '@/lib/logging'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ShareResourceButton } from '@/components/ui/share-resource-button'

import { LandingHeader } from '@/components/layout/LandingHeader'
import { Footer as DashboardFooter } from '@/components/layout/Footer'

export default function NewsPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const { pushMessage } = useSystemMessage()
  const [news, setNews] = useState<NewsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [rootMode, setRootMode] = useState<'unknown' | 'landing' | 'dashboard'>('unknown')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = window.location.hostname
    const isDashboardHost = host.startsWith('dashboard.') || host.startsWith('app.') || host === 'localhost' || host === '127.0.0.1'
    setRootMode(isDashboardHost ? 'dashboard' : 'landing')
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsEntry)))
      setLoading(false)
    }, (error) => {
      console.error('NewsPage: Error listening to news:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Activity Tracking: News-Besuch festhalten (für Admin-Statistiken)
  useEffect(() => {
    if (rootMode === 'dashboard' && !authLoading && profile?.id) {
      const updateLastVisited = async () => {
        try {
          const now = new Date()
          const lastVisitedStr = profile.last_visited?.news
          const lastVisited = lastVisitedStr ? new Date(lastVisitedStr) : new Date(0)

          // Nur alle 5 Minuten aktualisieren, um Schreibzugriffe zu sparen
          if (!lastVisitedStr || (now.getTime() - lastVisited.getTime() > 5 * 60 * 1000)) {
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
  }, [profile?.id, profile?.last_visited?.news, authLoading, rootMode])

  const isPlanner = (
    profile?.role === 'planner' ||
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'
  ) && profile?.is_approved

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du diesen Beitrag wirklich löschen?')) return
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

      pushMessage({
        type: 'toast',
        priority: 'info',
        title: 'Erfolg',
        content: 'Beitrag erfolgreich gelöscht.'
      })
    } catch (err) {
      console.error('Error deleting news:', err)
      pushMessage({
        type: 'toast',
        priority: 'critical',
        title: 'Fehler',
        content: 'Fehler beim Löschen des Beitrags.'
      })
    }
  }

  if (loading || rootMode === 'unknown') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (rootMode === 'landing') {
    return (
      <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20">
        <LandingHeader isAuthenticated={!!user} />
        
        <main className="relative z-10 pt-32 pb-20 px-6">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Neuigkeiten</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Bleibe auf dem Laufenden über alles, was in eurem Jahrgang passiert.
              </p>
            </div>

            <div className="grid gap-8">
              {news.length === 0 ? (
                <div className="p-20 text-center border-2 border-dashed border-border rounded-3xl">
                  <p className="text-muted-foreground italic text-lg">Aktuell sind keine News veröffentlicht.</p>
                </div>
              ) : (
                news.map((item) => {
                  const isCompactEntry = item.is_small_update || !item.image_url

                  return (
                    <article key={item.id} className="group grid md:grid-cols-[1.2fr_1.8fr] gap-8 items-start bg-card/30 border border-border/50 rounded-[2rem] p-6 md:p-8 hover:bg-card/50 transition-all hover:shadow-2xl hover:shadow-primary/5">
                      <div className={isCompactEntry ? 'space-y-4 md:col-span-2' : 'space-y-6'}>
                        {!isCompactEntry && item.image_url && (
                          <Link href={`/news/${item.id}`} className="block overflow-hidden rounded-2xl aspect-[16/10] bg-muted shadow-lg">
                            <img 
                              src={item.image_url} 
                              alt="" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </Link>
                        )}

                        <div className={isCompactEntry ? 'space-y-4 rounded-2xl border border-border/40 bg-background/60 p-5 md:p-6' : 'space-y-6'}>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary">
                            <span className="bg-primary/10 px-3 py-1 rounded-full">{item.created_at ? format(toDate(item.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}</span>
                            {isCompactEntry && <span className="bg-muted px-3 py-1 rounded-full text-muted-foreground">Kurzupdate</span>}
                            <span className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" /> {item.author_name || 'System'}</span>
                          </div>

                          <div className="space-y-3">
                            <Link href={`/news/${item.id}`} className="block group-hover:text-primary transition-colors">
                              <h2 className={isCompactEntry ? 'text-xl md:text-2xl font-black leading-tight tracking-tight' : 'text-2xl md:text-3xl font-black leading-tight tracking-tight'}>{item.title}</h2>
                            </Link>
                            <div className={isCompactEntry ? 'text-muted-foreground leading-relaxed line-clamp-2 text-sm md:text-[0.95rem]' : 'text-muted-foreground leading-relaxed line-clamp-3'}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {item.content}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span className="flex items-center gap-1 text-[11px] font-bold"><Eye className="h-3.5 w-3.5" /> {item.view_count || 0}</span>
                              {item.comment_count !== undefined && item.comment_count > 0 && (
                                <span className="flex items-center gap-1 text-[11px] font-bold"><MessageSquare className="h-3.5 w-3.5" /> {item.comment_count}</span>
                              )}
                            </div>
                            <Button render={<Link href={`/news/${item.id}`} />} variant="ghost" className="font-black uppercase tracking-widest text-[10px] gap-2 rounded-xl group/btn">
                              Weiterlesen
                              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        </main>

        <DashboardFooter />
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-muted/40 to-background p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-primary/5 blur-xl" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuigkeiten</h1>
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
          news.map((item) => {
            const isCompactEntry = item.is_small_update || !item.image_url

            if (isCompactEntry) {
              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-card/55 p-4 md:p-5 border border-border/40 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link href={`/news/${item.id}`} className="flex-1 hover:text-primary transition-colors min-w-[220px]">
                      <CardTitle className="text-xl md:text-[1.35rem] font-black leading-tight tracking-tight">{item.title}</CardTitle>
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

                  <div className="mb-3 mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground/90">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{item.created_at ? format(toDate(item.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}</span>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <UserIcon className="h-3.5 w-3.5" /> {item.author_name || 'Unbekannt'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <Eye className="h-3.5 w-3.5" /> {item.view_count || 0}
                    </span>
                    {item.comment_count !== undefined && item.comment_count > 0 && (
                      <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                        <MessageSquare className="h-3.5 w-3.5" /> {item.comment_count}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">Kurzupdate</span>
                  </div>

                  <div className="text-foreground/80 leading-relaxed text-sm md:text-[0.95rem] line-clamp-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                        li: ({ children, ...props }) => {
                          const isTask = (props as any).checked !== undefined;
                          return (
                            <li className={isTask ? 'list-none flex items-start gap-2' : ''}>
                              {children}
                            </li>
                          );
                        },
                        input: ({ checked }) => (
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            readOnly 
                            className="h-3.5 w-3.5 mt-1 rounded border-primary text-primary focus:ring-primary"
                          />
                        ),
                        del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  </div>

                  <div className="flex justify-end mt-3">
                    <Button render={<Link href={`/news/${item.id}`} />} variant="link" size="sm" className="gap-1 p-0 h-auto text-primary">
                      <>Weiterlesen <ArrowRight className="h-4 w-4" /></>
                    </Button>
                  </div>
                </article>
              )
            }

            return (
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
                    {item.reactions && Object.keys(item.reactions).length > 0 && (
                      <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                        <Smile className="h-3.5 w-3.5" /> {Object.values(item.reactions).reduce((sum, uids) => sum + (uids?.length || 0), 0)}
                      </span>
                    )}
                    {item.comment_count !== undefined && item.comment_count > 0 && (
                      <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                        <MessageSquare className="h-3.5 w-3.5" /> {item.comment_count}
                      </span>
                    )}
                  </div>

                  <div className={`text-foreground/80 leading-relaxed text-sm md:text-base ${!item.is_small_update ? 'line-clamp-4' : ''}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                        li: ({ children, ...props }) => {
                          const isTask = (props as any).checked !== undefined;
                          return (
                            <li className={isTask ? 'list-none flex items-start gap-2' : ''}>
                              {children}
                            </li>
                          );
                        },
                        input: ({ checked }) => (
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            readOnly 
                            className="h-3.5 w-3.5 mt-1 rounded border-primary text-primary focus:ring-primary"
                          />
                        ),
                        del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  </div>

                  {!item.is_small_update && (
                    <div className="flex justify-end mt-4">
                      <Button render={<Link href={`/news/${item.id}`} />} variant="link" size="sm" className="gap-1 p-0 h-auto text-primary">
                        <>Weiterlesen <ArrowRight className="h-4 w-4" /></>
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
