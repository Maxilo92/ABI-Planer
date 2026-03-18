'use client'

import { useState } from 'react'
import { toDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { Trash2, Bug, Lightbulb, HelpCircle, ChevronsRight, CheckCircle, XCircle } from 'lucide-react'

type FeedbackStatus = 'new' | 'in_progress' | 'implemented' | 'rejected'

type Feedback = {
  id: string
  title: string
  description: string
  type: 'bug' | 'feature' | 'other'
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

  const getIcon = (type: string) => {
    if (type === 'bug') return <Bug className="h-4 w-4 text-red-500" />
    if (type === 'feature') return <Lightbulb className="h-4 w-4 text-yellow-500" />
    return <HelpCircle className="h-4 w-4 text-gray-500" />
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'new': return <Badge variant="secondary">Neu</Badge>
      case 'in_progress': return <Badge variant="default" className="bg-blue-500">In Arbeit</Badge>
      case 'implemented': return <Badge variant="default" className="bg-green-600">Umgesetzt</Badge>
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

  return (
    <div className="space-y-4">
      {feedbackItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Kein Feedback vorhanden.</p>
      ) : (
        feedbackItems.map((item) => (
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
