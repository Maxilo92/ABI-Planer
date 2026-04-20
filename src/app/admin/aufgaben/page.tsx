'use client'

import { useEffect, useState } from 'react'
import { db, functions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { 
  Check, 
  X, 
  Download, 
  ExternalLink, 
  Clock, 
  User, 
  FileVideo, 
  ImageIcon,
  Loader2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react'
import { Task } from '@/types/database'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function AdminTasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingTask, setReviewingTask] = useState<Task | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (authLoading) return
    
    const isAdmin = profile?.role && ['admin', 'admin_main', 'admin_co'].includes(profile.role)
    if (!isAdmin) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'tasks'), 
      where('status', '==', 'in_review'),
      orderBy('submitted_at', 'asc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)))
      setLoading(false)
    }, (error) => {
      console.error('Error listening to review tasks:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [authLoading, profile])

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const isAdmin = profile?.role && ['admin', 'admin_main', 'admin_co'].includes(profile.role)

  if (!isAdmin) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Admin Bereich" 
          description="Nur Admins können eingereichte Aufgaben prüfen."
          icon={<ShieldCheck className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
    setActionLoading(true)
    try {
      const adminReviewTask = httpsCallable(functions, 'adminReviewTask')
      await adminReviewTask({ 
        taskId, 
        action, 
        rejectedReason: action === 'reject' ? rejectReason : undefined 
      })
      
      toast.success(action === 'approve' ? 'Aufgabe genehmigt!' : 'Aufgabe abgelehnt.')
      setReviewingTask(null)
      setRejectReason('')
    } catch (error) {
      console.error(`Error ${action}ing task:`, error)
      toast.error('Fehler beim Ausführen der Aktion.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aufgaben Prüfung</h1>
        <p className="text-muted-foreground">Prüfe eingereichte Beweise und gib Belohnungen frei.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/30">
          <Check className="h-12 w-12 text-green-500/30 mb-4" />
          <h3 className="text-xl font-medium">Alles erledigt!</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            Aktuell gibt es keine Aufgaben, die auf eine Prüfung warten.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map(task => (
            <Card key={task.id} className="flex flex-col">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{task.assignee_name}</span>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500 whitespace-nowrap">In Prüfung</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm italic">
                  "{task.description.slice(0, 150)}{task.description.length > 150 ? '...' : ''}"
                </div>
                
                {task.proof_text && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Text-Beweis</span>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm whitespace-pre-wrap">
                      {task.proof_text}
                    </div>
                  </div>
                )}

                {task.proof_media_url && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Beweismaterial</span>
                      <span className="flex items-center gap-1">
                        {task.proof_media_type === 'video' ? <FileVideo className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        {task.proof_media_type === 'video' ? 'Video' : 'Bild'}
                      </span>
                    </div>
                    
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border group">
                      {task.proof_media_type === 'video' ? (
                        <video 
                          src={task.proof_media_url || undefined} 
                          className="w-full h-full object-contain"
                          controls
                        />
                      ) : (
                        <Image 
                          src={task.proof_media_url || ''} 
                          alt="Beweis" 
                          fill 
                          className="object-contain" 
                        />
                      )}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={task.proof_media_url || ''} 
                          download 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-none">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setReviewingTask(task)
                    setRejectReason('')
                  }}
                >
                  <X className="h-4 w-4 mr-2" /> Ablehnen
                </Button>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleAction(task.id, 'approve')}
                >
                  <Check className="h-4 w-4 mr-2" /> Freigeben
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!reviewingTask} onOpenChange={(open) => !open && setReviewingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe ablehnen</DialogTitle>
            <DialogDescription>
              Gib einen Grund an, warum der Beweis nicht ausreicht. Der Nutzer hat dann 7 Tage Zeit zur Nachbesserung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Begründung</Label>
              <Textarea 
                id="reason" 
                placeholder="z.B. Das Foto ist zu unscharf, man erkennt nichts." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewingTask(null)}>Abbrechen</Button>
            <Button 
              variant="destructive" 
              disabled={!rejectReason.trim() || actionLoading}
              onClick={() => reviewingTask && handleAction(reviewingTask.id, 'reject')}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Jetzt ablehnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
