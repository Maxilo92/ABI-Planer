'use client'

import { useEffect, useState } from 'react'
import { db, functions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  X, 
  Download, 
  Clock, 
  User, 
  FileVideo, 
  ImageIcon,
  Loader2,
  ShieldCheck,
  AlertCircle
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
import { logAction } from '@/lib/logging'
import { motion, AnimatePresence } from 'framer-motion'

export function TaskValidationTab() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingTask, setReviewingTask] = useState<Task | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
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
  }, [])

  const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
    const task = tasks.find(t => t.id === taskId) || reviewingTask
    if (!task) return

    setActionLoading(true)
    try {
      const adminReviewTask = httpsCallable(functions, 'adminReviewTask')
      await adminReviewTask({ 
        taskId, 
        action, 
        rejectedReason: action === 'reject' ? rejectReason : undefined 
      })
      
      if (profile) {
        await logAction(
          action === 'approve' ? 'TASK_APPROVED' : 'TASK_REJECTED',
          profile.id,
          profile.full_name,
          {
            task_id: taskId,
            task_title: task.title,
            target_user_id: task.assignee_id,
            target_user_name: task.assignee_name,
            reason: action === 'reject' ? rejectReason : null
          }
        )
      }

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand" />
          Offene Prüfungen
          <Badge variant="secondary" className="rounded-full bg-brand/10 text-brand border-none font-black ml-2">
            {tasks.length}
          </Badge>
        </h2>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20">
          <div className="bg-card p-5 rounded-full mb-4 shadow-sm">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-black text-foreground">Alles erledigt!</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-1 text-xs">
            Momentan gibt es keine eingereichten Aufgaben, die geprüft werden müssen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="flex flex-col h-full overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all rounded-2xl">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-black leading-tight">{task.title}</CardTitle>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{task.assignee_name}</span>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-none text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                        In Prüfung
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 space-y-4">
                    <div className="bg-muted/50 rounded-xl p-3 text-xs italic text-muted-foreground leading-relaxed border border-border/30">
                      "{task.description.slice(0, 120)}{task.description.length > 120 ? '...' : ''}"
                    </div>
                    
                    {task.proof_text && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Beweis-Text</span>
                        <div className="bg-brand/5 border border-brand/10 rounded-xl p-3 text-xs whitespace-pre-wrap font-medium">
                          {task.proof_text}
                        </div>
                      </div>
                    )}

                    {task.proof_media_url && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                          <span>Dateianhang</span>
                          <span className="flex items-center gap-1">
                            {task.proof_media_type === 'video' ? <FileVideo className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                            {task.proof_media_type === 'video' ? 'Video' : 'Bild'}
                          </span>
                        </div>
                        
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 group">
                          {task.proof_media_type === 'video' ? (
                            <video 
                              src={task.proof_media_url || undefined} 
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <Image 
                              src={task.proof_media_url || ''} 
                              alt="Beweis" 
                              fill 
                              className="object-cover" 
                            />
                          )}
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={task.proof_media_url || ''} 
                              download 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-md">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 rounded-xl font-bold h-9 text-xs"
                      onClick={() => {
                        setReviewingTask(task)
                        setRejectReason('')
                      }}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" /> Ablehnen
                    </Button>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-bold h-9 text-xs shadow-lg shadow-green-600/20"
                      onClick={() => handleAction(task.id, 'approve')}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" /> Freigeben
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!reviewingTask} onOpenChange={(open) => !open && setReviewingTask(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Aufgabe ablehnen</DialogTitle>
            <DialogDescription className="text-xs">
              Gib einen Grund an, warum der Beweis nicht ausreicht. Der Nutzer hat dann Zeit zur Nachbesserung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-[10px] font-black uppercase tracking-widest ml-1">Begründung</Label>
              <Textarea 
                id="reason" 
                placeholder="z.B. Das Foto ist zu unscharf, man erkennt nichts." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-2xl bg-muted/50 border-none focus-visible:ring-brand/20 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setReviewingTask(null)}>Abbrechen</Button>
            <Button 
              variant="destructive" 
              className="rounded-xl font-bold bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
              disabled={!rejectReason.trim() || actionLoading}
              onClick={() => reviewingTask && handleAction(reviewingTask.id, 'reject')}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Jetzt ablehnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
