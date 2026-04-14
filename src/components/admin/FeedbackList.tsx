'use client'

import { useMemo, useState } from 'react'
import { toDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { Trash2, Bug, Lightbulb, HelpCircle, ChevronsRight, CheckCircle, XCircle, Download, Sparkles, TrendingUp, ShieldAlert, UserCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logging'
import { Feedback, FeedbackType, FeedbackStatus } from '@/types/database'
import { cn } from '@/lib/utils'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import { useEffect } from 'react'

type SortField = 'created_at' | 'title' | 'status' | 'type' | 'importance'

interface FeedbackListProps {
  feedbackItems: Feedback[]
}

export function FeedbackList({ feedbackItems }: FeedbackListProps) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')
  const [sortField, setSortField] = useState<SortField>('importance')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)

  // Sync background analysis progress from Firestore
  useEffect(() => {
    const taskRef = doc(db, 'admin_tasks', 'feedback_bulk_analyze')
    const unsubscribe = onSnapshot(taskRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data.status === 'running') {
          setIsBulkAnalyzing(true)
          const progress = data.total > 0 ? Math.round((data.processed / data.total) * 100) : 0
          setBulkProgress(progress)
        } else if (data.status === 'completed' || data.status === 'failed') {
          // Keep active state for a short moment after completion
          if (data.status === 'completed' && isBulkAnalyzing) {
            setBulkProgress(100)
            setTimeout(() => {
              setIsBulkAnalyzing(false)
              setBulkProgress(0)
            }, 3000)
          } else {
            setIsBulkAnalyzing(false)
            setBulkProgress(0)
          }
        }
      }
    })

    return () => unsubscribe()
  }, [isBulkAnalyzing])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    feedbackItems.forEach(item => {
      if (item.category) cats.add(item.category)
    })
    return Array.from(cats).sort()
  }, [feedbackItems])

  const handleBulkAnalyze = async () => {
    const itemsToAnalyze = feedbackItems.filter(item => !item.importance || !item.category)
    
    if (itemsToAnalyze.length === 0) {
      if (!window.confirm('Alle Einträge haben bereits KI-Daten. Möchtest du trotzdem eine Neuanalyse für ALLE Einträge erzwingen?')) {
        return
      }
      itemsToAnalyze.push(...feedbackItems)
    }

    if (!window.confirm(`${itemsToAnalyze.length} Einträge werden jetzt im Hintergrund analysiert. Du kannst die App frei weiter nutzen. Fortfahren?`)) {
      return
    }

    setIsBulkAnalyzing(true)
    setBulkProgress(0)
    
    try {
      const functions = getFunctions(undefined, 'europe-west3')
      const bulkAnalyze = httpsCallable(functions, 'bulkAnalyzeFeedback')
      
      const itemIds = itemsToAnalyze.map(item => item.id)
      const result = await bulkAnalyze({ itemIds }) as { data: { ok: boolean, taskId: string } }

      if (result.data.ok) {
        toast.success('Hintergrund-Analyse gestartet.')
        if (user) {
          await logAction('FEEDBACK_BULK_ANALYZE', user.uid, profile?.full_name, {
            count: itemIds.length,
            mode: 'background'
          })
        }
      } else {
        toast.error('Fehler beim Starten der Hintergrund-Analyse.')
        setIsBulkAnalyzing(false)
      }
    } catch (err) {
      console.error('Error triggering bulk analysis:', err)
      toast.error('Ein Fehler ist aufgetreten.')
      setIsBulkAnalyzing(false)
    }
  }

  const getIcon = (type: string) => {
    if (type === 'bug') return <Bug className="h-4 w-4 text-destructive" />
    if (type === 'feature') return <Lightbulb className="h-4 w-4 text-info" />
    if (type === 'complaint') return <ShieldAlert className="h-4 w-4 text-destructive" />
    return <HelpCircle className="h-4 w-4 text-muted-foreground" />
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'new': return <Badge variant="secondary">Neu</Badge>
      case 'in_progress': return <Badge variant="outline" className="border-info/40 bg-info/10 text-info">In Arbeit</Badge>
      case 'implemented': return <Badge variant="outline" className="border-success/40 bg-success/10 text-success">Umgesetzt</Badge>
      case 'rejected': return <Badge variant="destructive">Abgelehnt</Badge>
      default: return <Badge variant="outline">Unbekannt</Badge>
    }
  }

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    setLoading(id)
    const target = feedbackItems.find((entry) => entry.id === id)

    try {
      const docRef = doc(db, 'feedback', id)
      await updateDoc(docRef, { status: newStatus })

      if (user) {
        await logAction('FEEDBACK_UPDATED', user.uid, profile?.full_name, {
          feedback_id: id,
          title: target?.title,
          status: newStatus,
        })
      }

      toast.success('Status aktualisiert.')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Fehler beim Ändern des Status.')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Dieses Feedback wirklich löschen?')) return
    setLoading(id)
    const target = feedbackItems.find((entry) => entry.id === id)

    try {
      const docRef = doc(db, 'feedback', id)
      await deleteDoc(docRef)

      if (user) {
        await logAction('FEEDBACK_DELETED', user.uid, profile?.full_name, {
          feedback_id: id,
          title: target?.title,
          type: target?.type,
        })
      }

      toast.success('Feedback gelöscht.')
    } catch (error) {
      console.error('Error deleting feedback:', error)
      toast.error('Fehler beim Löschen.')
    } finally {
      setLoading(null)
    }
  }

  const visibleFeedback = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filtered = feedbackItems.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        (item.created_by_name ?? '').toLowerCase().includes(normalizedQuery) ||
        (item.category ?? '').toLowerCase().includes(normalizedQuery)

      return matchesStatus && matchesType && matchesCategory && matchesQuery
    })

    return [...filtered].sort((a, b) => {
      let result = 0

      if (sortField === 'created_at') {
        result = toDate(a.created_at).getTime() - toDate(b.created_at).getTime()
      } else if (sortField === 'title') {
        result = a.title.localeCompare(b.title, 'de')
      } else if (sortField === 'status') {
        result = a.status.localeCompare(b.status, 'de')
      } else if (sortField === 'importance') {
        result = (a.importance || 0) - (b.importance || 0)
        // Secondary sort by date if importance is equal
        if (result === 0) {
          result = toDate(a.created_at).getTime() - toDate(b.created_at).getTime()
        }
      } else {
        result = a.type.localeCompare(b.type, 'de')
      }

      return sortDirection === 'asc' ? result : -result
    })
  }, [feedbackItems, searchQuery, statusFilter, typeFilter, categoryFilter, sortField, sortDirection])

  const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`

  const handleExportCsv = () => {
    if (visibleFeedback.length === 0) {
      toast.error('Keine Einträge zum Exportieren vorhanden.')
      return
    }

    const header = ['id', 'titel', 'beschreibung', 'typ', 'status', 'kategorie', 'prio', 'erstellt_am', 'erstellt_von', 'anonym', 'privat']
    const rows = visibleFeedback.map((item) => [
      item.id,
      item.title,
      item.description,
      item.type,
      item.status,
      item.category || '',
      item.importance || '',
      toDate(item.created_at).toISOString(),
      item.created_by_name || item.created_by || 'Unbekannt',
      item.is_anonymous ? 'Ja' : 'Nein',
      item.is_private ? 'Ja' : 'Nein',
    ])

    const csv = [header, ...rows].map((row) => row.map((value) => csvEscape(String(value))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date().toISOString().slice(0, 10)

    link.href = url
    link.setAttribute('download', `feedback-export-${now}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Feedback erfolgreich exportiert.')
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sortieren, filtern und exportieren</CardTitle>
          <CardDescription>Die Export-Datei enthält genau die aktuell sichtbaren Einträge.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <Input
              placeholder="Suche in Titel, Beschreibung, Name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="lg:col-span-2"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | FeedbackStatus)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Alle Stati</option>
              <option value="new">Neu</option>
              <option value="in_progress">In Arbeit</option>
              <option value="implemented">Umgesetzt</option>
              <option value="rejected">Abgelehnt</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | FeedbackType)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Alle Typen</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="complaint">Beschwerde</option>
              <option value="other">Sonstiges</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Alle Kategorien</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <Button 
              variant="outline" 
              onClick={handleExportCsv} 
              className="justify-center"
              disabled={isBulkAnalyzing}
            >
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>

            <Button
              variant="default"
              className={cn(
                "justify-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 overflow-hidden relative",
                isBulkAnalyzing && "opacity-90 cursor-wait"
              )}
              onClick={handleBulkAnalyze}
              disabled={isBulkAnalyzing}
            >
              {/* Progress Fill */}
              {isBulkAnalyzing && (
                <div 
                  className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-300 ease-out z-0"
                  style={{ width: `${bulkProgress}%` }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center">
                {isBulkAnalyzing ? (
                  <>Analysiere... {bulkProgress}%</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> KI Analyse
                  </>
                )}
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={sortField}
              onChange={(event) => setSortField(event.target.value as SortField)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="importance">Sortieren nach Prio (KI)</option>
              <option value="created_at">Sortieren nach Datum</option>
              <option value="title">Sortieren nach Titel</option>
              <option value="status">Sortieren nach Status</option>
              <option value="type">Sortieren nach Typ</option>
            </select>

            <select
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="desc">Absteigend</option>
              <option value="asc">Aufsteigend</option>
            </select>

            <div className="h-9 px-3 rounded-md border border-input bg-muted/30 text-sm flex items-center">
              {visibleFeedback.length} von {feedbackItems.length} Einträgen sichtbar
            </div>
          </div>
        </CardContent>
      </Card>

      {feedbackItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Kein Feedback vorhanden.</p>
      ) : (
        visibleFeedback.map((item) => (
          <Card key={item.id} className="shadow-sm border-l-4 overflow-hidden" style={{ borderLeftColor: item.importance ? (item.importance >= 8 ? '#ef4444' : item.importance >= 5 ? '#f59e0b' : '#22c55e') : 'transparent' }}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    {getIcon(item.type)}
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {item.is_teacher_request && (
                      <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] py-0 h-5 flex items-center gap-1">
                        <UserCheck className="h-2.5 w-2.5" /> Lehrer-Anfrage
                      </Badge>
                    )}
                    {item.teacher_card_name && (
                      <Badge variant="outline" className="border-muted-foreground/30 bg-muted/5 text-muted-foreground text-[10px] py-0 h-5 flex items-center gap-1">
                        Karte: {item.teacher_card_name}
                      </Badge>
                    )}
                    {item.category && (
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px] py-0 h-5 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> {item.category}
                      </Badge>
                    )}
                    {item.importance && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] py-0 h-5 flex items-center gap-1",
                          item.importance >= 8 ? "border-destructive/40 bg-destructive/10 text-destructive" :
                          item.importance >= 5 ? "border-amber-500/40 bg-amber-500/10 text-amber-600" :
                          "border-success/40 bg-success/10 text-success"
                        )}
                      >
                        <TrendingUp className="h-2.5 w-2.5" /> Prio {item.importance}
                      </Badge>
                    )}
                    {item.ai_reasoning && (
                      <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                        &quot;{item.ai_reasoning}&quot;
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.is_private && <Badge variant="outline" className="border-warning/50 text-warning bg-warning/5">Privat</Badge>}
                  {item.is_anonymous && <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Anonym</Badge>}
                  {getStatusBadge(item.status)}
                </div>
              </div>
              <CardDescription className="pt-1">
                Eingereicht von {item.created_by_name || 'Unbekannt'} am {toDate(item.created_at).toLocaleString('de-DE')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm whitespace-pre-wrap">{item.description}</p>
                {(item.image_url || (item as any).image?.url) && (
                  <div className="mt-2">
                    <a href={item.image_url || (item as any).image?.url} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <img 
                        src={item.image_url || (item as any).image?.url} 
                        alt={item.title} 
                        className="rounded-md border max-h-48 object-contain bg-muted/20 hover:opacity-90 transition-opacity"
                      />
                    </a>
                    <p className="text-[10px] text-muted-foreground mt-1">Klicken zum Vergrößern</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" size="xs" 
                    onClick={() => handleStatusChange(item.id, 'in_progress')}
                    disabled={loading === item.id || item.status === 'in_progress'}
                  >
                    <ChevronsRight className="h-3 w-3 mr-1" /> In Arbeit
                  </Button>
                  <Button 
                    variant="outline" size="xs" 
                    onClick={() => handleStatusChange(item.id, 'implemented')}
                    disabled={loading === item.id || item.status === 'implemented'}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Umgesetzt
                  </Button>
                  <Button 
                    variant="outline" size="xs" 
                    onClick={() => handleStatusChange(item.id, 'rejected')}
                    disabled={loading === item.id || item.status === 'rejected'}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Ablehnen
                  </Button>
                </div>
                <Button 
                  variant="ghost" size="icon" 
                  className="text-muted-foreground hover:text-destructive h-7 w-7"
                  onClick={() => handleDelete(item.id)}
                  disabled={loading === item.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
