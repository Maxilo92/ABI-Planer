'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, arrayUnion, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { NewsEntry, Comment } from '@/types/database'
import { CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2, ArrowLeft, Eye, Calendar, User as UserIcon, MessageSquare, Send, Plus, Smile, Sparkles } from 'lucide-react'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { EditNewsDialog } from '@/components/modals/EditNewsDialog'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ShareResourceButton } from '@/components/ui/share-resource-button'
import { motion, AnimatePresence } from 'framer-motion'
import { getDashboardRedirectUrl } from '@/lib/dashboard-url'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile, loading: authLoading } = useAuth()
  const { maintenance } = useSystemMessage()
  const [news, setNews] = useState<NewsEntry | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [rootMode, setRootMode] = useState<'unknown' | 'landing' | 'dashboard'>('unknown')
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = window.location.hostname
    const isDashboardHost = host.startsWith('dashboard.') || 
                            host.startsWith('app.') || 
                            host.includes('.dashboard.') ||
                            host.startsWith('support.') ||
                            host.includes('.support.')
    setRootMode(isDashboardHost ? 'dashboard' : 'landing')
  }, [])

  const isMaintenanceActive = maintenance?.active || (maintenance?.start && new Date(maintenance.start) <= new Date())

  useEffect(() => {
    if (authLoading) return

    const docRef = doc(db, 'news', id)
    
    // Subscribe to news document
    const unsubscribeNews = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as NewsEntry
        setNews(data)
        
        // View count logic
        if (user && profile?.is_approved) {
          const viewedBy = data.viewed_by || []
          if (!viewedBy.includes(user.uid)) {
            updateDoc(docRef, {
              view_count: increment(1),
              viewed_by: arrayUnion(user.uid)
            }).catch(err => {
              console.error('Error updating view count:', err)
            })
          }
        }
      } else {
        setNews(null)
      }
      setLoading(false)
    }, (error) => {
      console.error('NewsDetailPage: Error listening to news article:', error)
      setLoading(false)
    })

    // Subscribe to comments sub-collection - only for authenticated users
    let unsubscribeComments = () => {}
    if (user && profile) {
      const commentsQuery = query(
        collection(db, 'news', id, 'comments'),
        orderBy('created_at', 'desc')
      )
      unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[]
        setComments(commentsData)
      }, (error) => {
        console.error('NewsDetailPage: Error listening to comments:', error)
      })
    }

    return () => {
      unsubscribeNews()
      unsubscribeComments()
    }
  }, [id, user, profile, authLoading])

  const handleReaction = async (emoji: string) => {
    if (!user || !news) {
      toast.error('Anmeldung erforderlich', {
        description: 'Um auf News zu reagieren, musst du angemeldet sein.'
      })
      return
    }

    if (!profile?.is_approved) {
      toast.error('Dein Account muss erst freigeschaltet werden.')
      return
    }

    try {
      const reactions = news.reactions || {}
      const userReactionsForEmoji = reactions[emoji] || []
      const hasReacted = userReactionsForEmoji.includes(user.uid)
      
      const newReactions = { ...reactions }
      
      if (hasReacted) {
        // Remove reaction
        newReactions[emoji] = userReactionsForEmoji.filter(uid => uid !== user.uid)
        // Cleanup empty emoji lists
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji]
        }
      } else {
        // Add reaction
        newReactions[emoji] = [...userReactionsForEmoji, user.uid]
      }

      await updateDoc(doc(db, 'news', id), {
        reactions: newReactions
      })

      if (!hasReacted) {
        logAction('NEWS_REACTION', user.uid, profile?.full_name, { id, emoji })
      }
      
      setShowEmojiPicker(false)
    } catch (err) {
      console.error('Error adding reaction:', err)
      toast.error('Fehler beim Reagieren.')
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !commentText.trim() || submittingComment) return

    if (!profile.is_approved) {
      toast.error('Dein Account muss erst freigeschaltet werden.')
      return
    }

    setSubmittingComment(true)
    try {
      await addDoc(collection(db, 'news', id, 'comments'), {
        content: commentText.trim(),
        created_at: serverTimestamp(),
        created_by: user.uid,
        author_name: profile.full_name || 'Anonymer Nutzer'
      })
      
      // Update comment count on main document
      await updateDoc(doc(db, 'news', id), {
        comment_count: increment(1)
      })
      
      logAction('NEWS_COMMENT', user.uid, profile.full_name, { id, content: commentText.trim() })
      
      setCommentText('')
      toast.success('Kommentar hinzugefügt.')
    } catch (err) {
      console.error('Error submitting comment:', err)
      toast.error('Fehler beim Senden des Kommentars.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSummarize = async () => {
    if (!news || summarizing) return

    if (!user || !profile?.is_approved) {
      toast.error('Anmeldung erforderlich', {
        description: 'Du brauchst einen angemeldeten und freigeschalteten Account.'
      })
      return
    }

    if (!news.content?.trim()) {
      toast.error('Keine Inhalte zum Zusammenfassen gefunden.')
      return
    }

    setSummarizing(true)
    setSummaryError(null)

    try {
      const idToken = await user.getIdToken()
      const response = await fetch('/api/news/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: news.title,
          content: news.content,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'Zusammenfassung konnte nicht erstellt werden.'
        const details = typeof payload?.details === 'string' ? payload.details : null
        
        const error = new Error(message)
        if (details) (error as any).details = details
        throw error
      }

      const nextSummary = typeof payload?.summary === 'string' ? payload.summary.trim() : ''
      if (!nextSummary) {
        throw new Error('Leere Antwort von der KI erhalten.')
      }

      setSummary(nextSummary)
      toast.success('Zusammenfassung erstellt')
    } catch (error: any) {
      const message = error?.message || 'Zusammenfassung konnte nicht erstellt werden.'
      const description = error?.details || undefined
      
      setSummary(null)
      setSummaryError(message)
      toast.error('Fehler bei der Zusammenfassung', {
        description: description || message,
      })
    } finally {
      setSummarizing(false)
    }
  }

  if (rootMode === 'unknown' || loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-10">
        <Skeleton className="h-10 w-32 rounded-md" />
        <article className="space-y-10">
          <Skeleton className="aspect-[21/9] w-full rounded-[2.5rem]" />
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 rounded-full" />
              <Skeleton className="h-16 w-3/4" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </article>
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

  const reactions = news.reactions || {}
  // Daumen hoch/runter sind immer da, andere Emojis kommen dynamisch dazu
  const defaultEmojis = ['', '']
  const otherActiveEmojis = Object.keys(reactions)
    .filter(key => Array.isArray(reactions[key]) && !defaultEmojis.includes(key))
    .sort((a, b) => (reactions[b]?.length || 0) - (reactions[a]?.length || 0))
  
  const activeEmojis = [...defaultEmojis, ...otherActiveEmojis]
  const canSummarize = !!user && !!profile?.is_approved
  
  const quickEmojis = ['', '️', '', '', '', '', '', '', '', '', '', '', '', '', '', '']

  if (rootMode === 'landing') {
    return (
      <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20">
        <main className="relative z-10 pt-28 pb-16 px-4 sm:px-6 md:pt-32 md:pb-20">
          <div className="max-w-4xl mx-auto space-y-10">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-1 sm:-ml-2 text-muted-foreground hover:text-foreground transition-colors group"
              asChild
            >
              <Link href="/news">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Zur Übersicht
              </Link>
            </Button>

            <article className="space-y-7 md:space-y-10">
              {news.image_url && (
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-muted shadow-2xl">
                  <img
                    src={news.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              )}

              <div className="space-y-5 md:space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">
                    <span className="bg-primary/10 px-3 py-1 rounded-full">{news.created_at ? format(toDate(news.created_at), 'dd. MMMM yyyy', { locale: de }) : 'Neu'}</span>
                    {news.is_ai_generated && <span className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-600 flex items-center gap-1"><Sparkles className="h-3 w-3" /> KI-unterstützt</span>}
                    <span className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" /> {news.author_name || 'System'}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-[1.1] break-words">{news.title}</h1>
                </div>

                <div className="flex items-center flex-wrap gap-3 sm:gap-6 pt-4 border-t border-border/50">
                   <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold">
                      <Eye className="h-4 w-4 text-primary/60" />
                      {news.view_count || 0} Aufrufe
                   </div>
                   {news.is_ai_generated && (
                     <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-600">
                       <Sparkles className="h-3 w-3" /> KI-unterstützt
                     </div>
                   )}
                   <ShareResourceButton
                      resourcePath={`/news/${news.id}`}
                      title={news.title}
                      text="Schau dir diese News im ABI Planer an."
                    />
                </div>

                <div className="h-px bg-border/50" />

                <div className="prose dark:prose-invert max-w-none prose-base sm:prose-lg prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-foreground/80">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {news.content}
                  </ReactMarkdown>
                </div>
              </div>
            </article>

            {/* Reactions & Comments logic omitted or integrated if desired, 
                but for a "clean" landing detail we might just show the content 
                and lead to dashboard for interaction.
                Let's keep the dashboard logic below but wrap it in a cleaner container.
            */}
            
            <div className="pt-8 md:pt-10 border-t border-border/50 space-y-8 md:space-y-12">
              <div className="bg-card/30 border border-border/50 rounded-[2rem] p-5 sm:p-8 md:p-12 text-center space-y-5 md:space-y-6">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Möchtest du mitreden?</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Um Kommentare zu schreiben oder auf Beiträge zu reagieren, melde dich bitte in deinem Dashboard-Konto an.
                  </p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 sm:gap-4">
                    <Button onClick={() => {
                      window.location.href = getDashboardRedirectUrl(window.location)
                  }} className="rounded-xl font-bold px-6 sm:px-8 w-full sm:w-auto">
                       Zum Dashboard
                    </Button>
                  <Button variant="outline" asChild className="rounded-xl font-bold px-6 sm:px-8 w-full sm:w-auto">
                       <Link href="/register">Konto erstellen</Link>
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-0 py-4 md:py-8 space-y-6">
...
      <div className="px-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          render={
            <Link href={isMaintenanceActive ? "/maintenance" : "/news"}>
              <ArrowLeft className="h-4 w-4" /> {isMaintenanceActive ? "Zurück zur Wartung" : "Zurück"}
            </Link>
          }
        />
      </div>

      <article className="space-y-6">
        {news.image_url && (
          <div className="relative h-56 md:h-72 lg:h-80 w-full overflow-hidden rounded-2xl bg-muted">
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
        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start md:gap-4">
            <CardTitle className="w-full text-3xl md:text-5xl font-black tracking-tight leading-[1.12] text-foreground break-words">
              {news.title}
            </CardTitle>
            <div className="mt-1 flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:gap-1 md:flex-nowrap md:justify-end">
              {canSummarize && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1 sm:flex-none"
                  onClick={handleSummarize}
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Zusammenfassen
                </Button>
              )}
              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <ShareResourceButton
                  resourcePath={`/news/${news.id}`}
                  title={news.title}
                  text="Schau dir diese News im ABI Planer an."
                />
                {isPlanner && <EditNewsDialog news={news} />}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-2.5 gap-x-4 sm:gap-x-6 text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
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

            {news.is_ai_generated && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-2.5 sm:px-3 py-1 rounded-full text-amber-600 text-[11px] sm:text-xs font-black">
                <Sparkles className="h-3.5 w-3.5" />
                KI-unterstützt
              </div>
            )}
          </div>
          <div className="h-px bg-border/50" />
          
          <AnimatePresence mode="wait">
            {(summary || summaryError) && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(4px)' }}
                transition={{ 
                  type: 'spring',
                  damping: 15,
                  stiffness: 100,
                  mass: 0.8,
                  opacity: { duration: 0.4 }
                }}
                className="overflow-hidden mb-8"
              >
                <div className={`rounded-2xl border-2 p-5 md:p-6 shadow-xl shadow-primary/5 ${summary ? 'bg-primary/5 border-primary/20' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary/60">KI-Zusammenfassung</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Llama 3.1 8B Instant</p>
                    </div>
                  </div>
                  {summary ? (
                    <motion.div 
                      className="text-base md:text-lg leading-relaxed text-foreground/90 font-medium italic flex flex-wrap gap-x-[0.35em] gap-y-1"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.05,
                            delayChildren: 0.2
                          }
                        }
                      }}
                    >
                      {summary.split(' ').map((word, i) => (
                        <motion.span
                          key={i}
                          variants={{
                            hidden: { opacity: 0, y: 5, filter: 'blur(2px)' },
                            visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                          }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        >
                          {word}
                        </motion.span>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="text-sm md:text-base leading-relaxed text-red-700">{summaryError}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ReactMarkdown
            className="text-[0.98rem] sm:text-base md:text-xl text-foreground/90 leading-relaxed max-w-none prose dark:prose-invert"
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
              li: ({ children, ...props }) => {
                const isTask = (props as any).checked !== undefined;
                return (
                  <li className={isTask ? 'list-none flex items-start gap-2 -ml-6' : 'pl-1'}>
                    {children}
                  </li>
                );
              },
              h1: ({ children }) => <h1 className="text-3xl font-black mb-4 mt-8">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 mt-6">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-bold mb-2 mt-4">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-8 border-border/50" />,
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-6 rounded-lg border">
                  <table className="w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
              th: ({ children }) => <th className="p-3 text-left font-bold border-b">{children}</th>,
              td: ({ children }) => <td className="p-3 border-b border-muted/30">{children}</td>,
              code: ({ className, children }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return isInline ? (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary-foreground/90">{children}</code>
                ) : (
                  <pre className="bg-zinc-950 p-4 rounded-xl overflow-x-auto my-6 border border-white/5">
                    <code className={`${className} text-sm font-mono text-zinc-100`}>{children}</code>
                  </pre>
                );
              },
              input: ({ checked }) => (
                <input 
                  type="checkbox" 
                  checked={checked} 
                  readOnly 
                  className="h-4 w-4 mt-1 rounded border-primary text-primary focus:ring-primary"
                />
              ),
              del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
            }}
          >
            {news.content}
          </ReactMarkdown>

          {/* Reactions Section */}
          <div className="pt-6 md:pt-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {activeEmojis.map((emoji) => {
                const uids = reactions[emoji] || []
                const count = uids.length
                const isActive = user && uids.includes(user.uid)
                
                return (
                  <Button
                    key={emoji}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={`gap-2 rounded-full h-9 px-3 transition-all hover:scale-105 ${isActive ? 'bg-primary text-primary-foreground shadow-sm border-primary' : 'hover:bg-muted border-muted-foreground/20'}`}
                    onClick={() => handleReaction(emoji)}
                    disabled={!user || !profile?.is_approved}
                  >
                    <span className="text-lg">{emoji}</span>
                    {count > 0 && <span className="font-bold tabular-nums">{count}</span>}
                  </Button>
                )
              })}

              {user && profile?.is_approved && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 w-9 p-0 hover:bg-muted border-dashed border-primary/40 text-primary transition-all hover:rotate-90"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Emoji hinzufügen"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>

                  <AnimatePresence>
                    {showEmojiPicker && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40 bg-transparent"
                          onClick={() => setShowEmojiPicker(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full left-0 mb-3 z-50 p-3 bg-card border shadow-xl rounded-2xl w-64 md:w-72"
                        >
                          <div className="text-[10px] font-bold uppercase text-muted-foreground mb-3 px-1 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Smile className="h-3 w-3" /> Emojis</span>
                            <span className="text-[8px] opacity-60">Wählen oder tippen</span>
                          </div>
                          
                          {/* Native Input Field für schnelles Tippen/Native Picker */}
                          <div className="mb-3 px-1">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Emoji tippen..."
                              className="w-full h-9 bg-muted/50 border border-muted-foreground/20 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                              onChange={(e) => {
                                const val = e.target.value.trim()
                                if (val) {
                                  // Nimm das letzte Zeichen (das gerade eingefügte Emoji)
                                  const char = Array.from(val).pop()
                                  if (char) handleReaction(char)
                                  e.target.value = ''
                                }
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto pr-1">
                            {quickEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="h-9 w-9 flex items-center justify-center text-xl hover:bg-primary/10 rounded-lg transition-colors"
                                onClick={() => handleReaction(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          
                          <div className="mt-3 pt-2 border-t border-muted text-[9px] text-muted-foreground italic px-1 flex justify-between">
                            <span>Win+. / Cmd+Ctrl+Space</span>
                            <span className="opacity-60">Abitur </span>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            {!user && (
              <p className="text-[10px] text-muted-foreground font-medium italic">
                Anmelden zum Reagieren
              </p>
            )}
          </div>
        </div>
      </article>

      <div className="h-px bg-border/50 my-8" />

      {/* Comments Section */}
      <section className="space-y-6 md:space-y-8 pb-12">
        <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Kommentare
        </h3>

        {user ? (
          profile?.is_approved ? (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                placeholder="Schreibe einen Kommentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px] resize-none focus-visible:ring-primary"
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!commentText.trim() || submittingComment}
                  className="gap-2"
                >
                  {submittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Kommentieren
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-muted p-6 rounded-xl text-center">
              <p className="text-muted-foreground">Dein Account muss erst freigeschaltet werden, um kommentieren zu können.</p>
            </div>
          )
        ) : (
          <div className="bg-muted p-6 rounded-xl text-center">
            <p className="text-muted-foreground mb-4">Du musst angemeldet sein, um zu kommentieren.</p>
            <Button variant="outline" render={<Link href="/login">Jetzt anmelden</Link>} />
          </div>
        )}

        <div className="space-y-6">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 sm:gap-4 group">
                <div className="mt-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {comment.author_name?.charAt(0) || '?'}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-sm">{comment.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {comment.created_at ? format(toDate(comment.created_at), 'dd.MM.yyyy HH:mm', { locale: de }) : 'Gerade eben'}
                      </span>
                    </div>
                  </div>
                  <div className="text-foreground/90 text-sm md:text-base whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground italic">
              Noch keine Kommentare. Sei der Erste!
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
