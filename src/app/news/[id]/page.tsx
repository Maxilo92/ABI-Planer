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
import { Loader2, ArrowLeft, Eye, Calendar, User as UserIcon, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { EditNewsDialog } from '@/components/modals/EditNewsDialog'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import ReactMarkdown from 'react-markdown'
import { ShareResourceButton } from '@/components/ui/share-resource-button'

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile, loading: authLoading } = useAuth()
  const [news, setNews] = useState<NewsEntry | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

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
        console.error('Error listening to comments:', error)
      })
    }

    return () => {
      unsubscribeNews()
      unsubscribeComments()
    }
  }, [id, user, profile, authLoading])

  const handleVote = async (type: 'up' | 'down') => {
    if (!user || !news) {
      toast.error('Anmeldung erforderlich', {
        description: 'Um News zu bewerten, musst du angemeldet sein.'
      })
      return
    }

    if (!profile?.is_approved) {
      toast.error('Dein Account muss erst freigeschaltet werden.')
      return
    }

    try {
      const currentVote = news.ratings?.[user.uid]
      const newRatings = { ...(news.ratings || {}) }

      if (currentVote === type) {
        delete newRatings[user.uid]
      } else {
        newRatings[user.uid] = type
      }

      await updateDoc(doc(db, 'news', id), {
        ratings: newRatings
      })

      if (currentVote !== type) {
        logAction('NEWS_RATE', user.uid, profile?.full_name, { id, type })
      }
    } catch (err) {
      console.error('Error voting:', err)
      toast.error('Fehler beim Abstimmen.')
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

  const upVotes = Object.values(news.ratings || {}).filter(v => v === 'up').length
  const downVotes = Object.values(news.ratings || {}).filter(v => v === 'down').length
  const userVote = user ? news.ratings?.[user.uid] : null

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 space-y-6">
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
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-3xl md:text-5xl font-black tracking-tight leading-[1.12] text-foreground">
              {news.title}
            </CardTitle>
            <div className="shrink-0 mt-1 flex items-center gap-1">
              <ShareResourceButton
                resourcePath={`/news/${news.id}`}
                title={news.title}
                text="Schau dir diese News im ABI Planer an."
              />
              {isPlanner && <EditNewsDialog news={news} />}
            </div>
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
          <div className="h-px bg-border/50" />
          <ReactMarkdown
            className="text-base md:text-xl text-foreground/90 leading-relaxed max-w-none prose dark:prose-invert"
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="pl-1">{children}</li>,
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
            }}
          >
            {news.content}
          </ReactMarkdown>

          {/* Ratings Section */}
          <div className="pt-8 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                variant={userVote === 'up' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 rounded-full"
                onClick={() => handleVote('up')}
                disabled={!user || !profile?.is_approved}
              >
                <ThumbsUp className={`h-4 w-4 ${userVote === 'up' ? 'fill-current' : ''}`} />
                <span>{upVotes}</span>
              </Button>
              <Button
                variant={userVote === 'down' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 rounded-full"
                onClick={() => handleVote('down')}
                disabled={!user || !profile?.is_approved}
              >
                <ThumbsDown className={`h-4 w-4 ${userVote === 'down' ? 'fill-current' : ''}`} />
                <span>{downVotes}</span>
              </Button>
            </div>
            {!user && (
              <p className="text-[10px] text-muted-foreground font-medium italic">
                Anmelden zum Abstimmen
              </p>
            )}
            <div className="h-4 w-px bg-border/50" />
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MessageSquare className="h-4 w-4" />
              <span>{user ? comments.length : '??'} {comments.length === 1 ? 'Kommentar' : 'Kommentare'}</span>
            </div>
          </div>
        </div>
      </article>

      <div className="h-px bg-border/50 my-8" />

      {/* Comments Section */}
      <section className="space-y-8 pb-12">
        <h3 className="text-2xl font-bold flex items-center gap-2">
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
              <div key={comment.id} className="flex gap-4 group">
                <div className="mt-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {comment.author_name?.charAt(0) || '?'}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
