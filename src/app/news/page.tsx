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
import { Loader2, Trash2, ArrowRight } from 'lucide-react'
import { toDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

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
      await deleteDoc(doc(db, 'news', id))
      toast.success('Beitrag erfolgreich gelöscht.')
    } catch (err) {
      console.error('Error deleting news:', err)
      toast.error('Fehler beim Löschen des Beitrags.')
    }
  }

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
              <CardHeader className="bg-secondary/20 py-4 px-6">
                <div className="flex justify-between items-start gap-4">
                  <Link href={`/news/${item.id}`} className="flex-1 hover:text-primary transition-colors">
                    <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-background rounded-md border">
                      {item.created_at ? format(toDate(item.created_at), 'dd.MM.yy', { locale: de }) : 'Neu'}
                    </span>
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
              <CardContent className="pt-6 pb-4">
                <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed line-clamp-2 text-sm">
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
