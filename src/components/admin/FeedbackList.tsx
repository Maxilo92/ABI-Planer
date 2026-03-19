'use client'

import { useMemo, useState } from 'react'
import { toDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { Trash2, Bug, Lightbulb, HelpCircle, ChevronsRight, CheckCircle, XCircle, Download } from 'lucide-react'

type FeedbackStatus = 'new' | 'in_progress' | 'implemented' | 'rejected'
type FeedbackType = 'bug' | 'feature' | 'other'
type SortField = 'created_at' | 'title' | 'status' | 'type'

type Feedback = {
  id: string
  title: string
  description: string
  type: FeedbackType
  status: FeedbackStatus
  created_at: string
  created_by: string
  created_by_name?: string
}

interface FeedbackListProps {
  feedbackItems: Feedback[]
}

export function FeedbackList({ feedbackItems }: FeedbackListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const getIcon = (type: string) => {
    if (type === 'bug') return <Bug className="h-4 w-4 text-destructive" />
    if (type === 'feature') return <Lightbulb className="h-4 w-4 text-info" />
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
    try {
      const docRef = doc(db, 'feedback', id)
      await updateDoc(docRef, { status: newStatus })
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
    try {
      const docRef = doc(db, 'feedback', id)
      await deleteDoc(docRef)
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
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        (item.created_by_name ?? '').toLowerCase().includes(normalizedQuery)

      return matchesStatus && matchesType && matchesQuery
    })

    return [...filtered].sort((a, b) => {
      let result = 0

      if (sortField === 'created_at') {
        result = toDate(a.created_at).getTime() - toDate(b.created_at).getTime()
      } else if (sortField === 'title') {
        result = a.title.localeCompare(b.title, 'de')
      } else if (sortField === 'status') {
        result = a.status.localeCompare(b.status, 'de')
      } else {
        result = a.type.localeCompare(b.type, 'de')
      }

      return sortDirection === 'asc' ? result : -result
    })
  }, [feedbackItems, searchQuery, statusFilter, typeFilter, sortField, sortDirection])

  const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`

  const handleExportCsv = () => {
    if (visibleFeedback.length === 0) {
      toast.error('Keine Einträge zum Exportieren vorhanden.')
      return
    }

    const header = ['id', 'titel', 'beschreibung', 'typ', 'status', 'erstellt_am', 'erstellt_von']
    const rows = visibleFeedback.map((item) => [
      item.id,
      item.title,
      item.description,
      item.type,
      item.status,
      toDate(item.created_at).toISOString(),
      item.created_by_name || item.created_by || 'Unbekannt',
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              placeholder="Suche in Titel, Beschreibung, Name"
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
              <option value="other">Sonstiges</option>
            </select>

            <Button variant="outline" onClick={handleExportCsv} className="justify-center">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={sortField}
              onChange={(event) => setSortField(event.target.value as SortField)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
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
          <Card key={item.id} className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getIcon(item.type)}
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
                {getStatusBadge(item.status)}
              </div>
              <CardDescription className="pt-1">
                Eingereicht von {item.created_by_name || 'Unbekannt'} am {toDate(item.created_at).toLocaleString('de-DE')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{item.description}</p>
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
