'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, functions } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, serverTimestamp, deleteDoc, increment, arrayUnion, collection, query, where, limit, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileVideo,
  ImageIcon,
  Trophy,
  Trash2,
  Swords,
  Gift,
  Eye,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { Task } from '@/types/database'
import Image from 'next/image'
import { toast } from 'sonner'
import { uploadTaskProof, deleteTaskFile } from '@/lib/taskMediaUpload'
import { getTaskStatusMeta } from '@/modules/shared/status'
import { getDeterministicSeed } from '@/lib/utils'
import { logAction } from '@/lib/logging'

import { DopamineBurst } from '@/components/ui/DopamineBurst'
import { ImageCarousel } from '@/components/aufgaben/ImageCarousel'
import { MarketplaceCard } from '@/components/aufgaben/MarketplaceCard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TaskDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  
  const [task, setTask] = useState<Task | null>(null)
  const [categoryName, setCategoryName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [proofText, setProofText] = useState('')
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [showSubmitBurst, setShowSubmitBurst] = useState(false)
  const [showCompleteBurst, setShowCompleteBurst] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [recommendations, setRecommendations] = useState<Task[]>([])
  const [recsLoading, setRecsLoading] = useState(true)

  useEffect(() => {
    if (!id || authLoading || !profile) return

    const taskRef = doc(db, 'tasks', id as string)
    
    // View Counter Logic
    const markAsViewed = async () => {
      try {
        const viewedBy = (task as any)?.viewed_by || []
        if (!viewedBy.includes(profile.id)) {
          await updateDoc(taskRef, {
            view_count: increment(1),
            viewed_by: arrayUnion(profile.id)
          })
        }
      } catch (e) {
        console.error('Error marking as viewed:', e)
      }
    }

    const unsubscribe = onSnapshot(taskRef, (taskDoc) => {
      if (taskDoc.exists()) {
        const taskData = { id: taskDoc.id, ...taskDoc.data() } as Task
        setTask(taskData)

        // Mark as viewed once we have the data
        if (profile?.id && (!taskData.viewed_by || !taskData.viewed_by.includes(profile.id))) {
          markAsViewed()
        }

        // Fetch Category Name
        if (taskData.category_id) {
          onSnapshot(doc(db, 'settings', 'config'), (settingsDoc) => {
            if (settingsDoc.exists()) {
              const cats = (settingsDoc.data() as any).task_categories || []
              const cat = cats.find((c: any) => c.id === taskData.category_id)
              if (cat) setCategoryName(cat.name)
            }
          })
        }
      } else {
        // Only redirect if not already deleting
        if (!deleting) {
          toast.error('Aufgabe nicht gefunden.')
          router.push('/aufgaben')
        }
      }
      setLoading(false)
    }, (error) => {
      console.error('Error listening to task:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [id, router, deleting, profile?.id, authLoading])

  // Fetch recommendations
  useEffect(() => {
    if (!id) return
    
    const fetchRecs = async () => {
      try {
        const q = query(
          collection(db, 'tasks'),
          where('status', '==', 'open'),
          limit(6)
        )
        const snap = await getDocs(q)
        const otherTasks = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Task))
          .filter(t => t.id !== id)
          .slice(0, 4)
        setRecommendations(otherTasks)
      } catch (e) {
        console.error('Error fetching recs:', e)
      } finally {
        setRecsLoading(false)
      }
    }

    fetchRecs()
  }, [id])

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 aspect-video rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!task) return null

  const seed = task.placeholder_seed ?? getDeterministicSeed(task.id)
  const placeholderImage = `https://loremflickr.com/1200/800/city,abstract,modern?lock=${seed % 1000}`

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co') && profile?.is_approved
  const isAssignee = task.assignee_id === profile?.id
  const canClaim = task.status === 'open' && profile?.is_approved
  const canSubmit = (task.status === 'claimed' || task.status === 'rejected') && isAssignee

  const handleClaim = async () => {
    if (!profile) return
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'claimed',
        assignee_id: profile.id,
        assignee_name: profile.full_name || profile.email,
        claimed_at: serverTimestamp(),
      })
      setShowClaimDialog(false)
      toast.success('Aufgabe angenommen! Viel Erfolg.')
    } catch (error) {
      console.error('Error claiming task:', error)
      toast.error('Fehler beim Annehmen der Aufgabe.')
    }
  }

  const handleClaimReward = async () => {
    if (!task || claiming) return
    setClaiming(true)
    try {
      const claimTaskReward = httpsCallable(functions, 'claimTaskReward')
      await claimTaskReward({ taskId: task.id })
      
      if (profile) {
        await logAction('TASK_REWARD_CLAIMED', profile.id, profile.full_name, {
          task_id: task.id,
          task_title: task.title,
          reward_boosters: task.reward_boosters,
          ticket_reduction: task.ticket_reduction || 0,
        })
      }
      
      setShowCompleteBurst(true)
      toast.success('Belohnung erhalten! Deine Booster wurden gutgeschrieben.')
    } catch (error) {
      console.error('Error claiming reward:', error)
      toast.error('Fehler beim Abholen der Belohnung.')
    } finally {
      setClaiming(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !isPlanner) return
    
    if (!window.confirm('Möchtest du diese Aufgabe wirklich unwiderruflich löschen?')) {
      return
    }

    setDeleting(true)
    try {
      // Delete proof media if exists
      if (task.proof_storage_path) {
        try {
          await deleteTaskFile(task.proof_storage_path)
        } catch (e) {
          console.error('Error deleting proof file:', e)
        }
      }

      // Delete the task document
      await deleteDoc(doc(db, 'tasks', task.id))
      toast.success('Aufgabe wurde gelöscht.')
      router.push('/aufgaben')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Fehler beim Löschen der Aufgabe.')
      setDeleting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmitProof = async () => {
    if (!selectedFile || !profile) return

    setUploading(true)
    try {
      const uploadResult = await uploadTaskProof(task.id, profile.id, selectedFile)
      
      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'in_review',
        proof_media_url: uploadResult.url,
        proof_media_type: uploadResult.type,
        proof_storage_path: uploadResult.path,
        proof_text: proofText.trim() || null,
        submitted_at: serverTimestamp(),
      })
      
      setSelectedFile(null)
      setProofText('')
      setShowSubmitBurst(true)
      toast.success('Beweis eingereicht! Ein Admin wird ihn prüfen.')
    } catch (error) {
      console.error('Error submitting proof:', error)
      const message = error instanceof Error ? error.message : 'Fehler beim Hochladen.'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    const meta = getTaskStatusMeta(status)
    return <Badge variant={meta.variant} className={meta.className}>{meta.label}</Badge>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/aufgaben">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Inseriert am {new Date(typeof task.created_at === 'object' && 'seconds' in task.created_at ? task.created_at.seconds * 1000 : task.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-full">
                <Eye className="h-4 w-4" />
                <span>{task.view_count || 0} Aufrufe</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content (Images & Description) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Carousel */}
            {task.task_image_urls && task.task_image_urls.length > 0 ? (
              <ImageCarousel images={task.task_image_urls} title={task.title} />
            ) : (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted border border-border shadow-sm group">
                <Image 
                  src={placeholderImage} 
                  alt={task.title} 
                  fill
                  className="object-cover brightness-[0.9] contrast-[1.05] transition-all duration-1000" 
                  priority
                  sizes="(max-width: 1200px) 100vw, 800px"
                />
                {/* Permanent "No Photo" hint icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/20 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
                  <ImageIcon className="h-12 w-12 opacity-50" />
                </div>
                {/* Watermark Overlay for placeholders - shown on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-[1px] pointer-events-none">
                  <div className="border-2 border-white/40 px-4 py-2 rotate-[-8deg] bg-black/20">
                    <span className="text-white text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap shadow-sm">
                      Beispielbild
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description Section */}
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-bold">Beschreibung</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {task.description}
                </p>
              </CardContent>
            </Card>

            {/* Rejection / Status Messages */}
            {task.status === 'rejected' && isAssignee && (
              <Card className="border-destructive/50 bg-destructive/5 overflow-hidden">
                <div className="bg-destructive/10 px-6 py-3 flex items-center gap-2 text-destructive font-bold">
                  <AlertCircle className="h-5 w-5" />
                  Ablehnungsgrund
                </div>
                <CardContent className="p-6">
                  <p className="font-medium">{task.rejected_reason}</p>
                  <p className="text-sm text-muted-foreground mt-4 italic">
                    Bitte korrigiere deine Einreichung und lade den neuen Beweis hoch.
                  </p>
                </CardContent>
              </Card>
            )}

            {canSubmit && (
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Upload className="h-5 w-5 text-primary" />
                    Beweis einreichen
                  </CardTitle>
                  <CardDescription>
                    Beschreibe deine Erledigung und lade ein Pflicht-Foto/Video hoch.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-4 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="proof-text" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      Beschreibung (optional)
                    </Label>
                    <Textarea 
                      id="proof-text"
                      placeholder="Beschreibe hier kurz, was du gemacht hast..."
                      className="min-h-[120px] resize-none rounded-xl border-2 focus-visible:ring-primary/20 bg-background/50"
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      Foto oder Video (Pflicht)
                    </span>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-xl p-8 bg-background/50 hover:bg-background/80 transition-colors">
                      {selectedFile ? (
                        <div className="flex flex-col items-center text-center">
                          {selectedFile.type.startsWith('image/') ? (
                            <div className="relative h-40 w-40 rounded-lg overflow-hidden mb-4 border shadow-sm bg-muted">
                              <Image 
                                src={URL.createObjectURL(selectedFile)} 
                                alt="Preview" 
                                fill 
                                className="object-contain" 
                                sizes="160px"
                              />
                            </div>
                          ) : (
                            <div className="h-40 w-40 flex items-center justify-center rounded-lg bg-muted mb-4 border shadow-sm">
                              <FileVideo className="h-16 w-16 text-primary" />
                            </div>
                          )}
                          <p className="font-bold truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <Button variant="ghost" size="sm" className="mt-4 text-destructive h-8 font-medium" onClick={() => setSelectedFile(null)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Datei entfernen
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer group flex flex-col items-center">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                          <span className="mt-4 font-bold">Datei hochladen</span>
                          <span className="text-xs text-muted-foreground mt-1">Klicke hier oder ziehe eine Datei hierher</span>
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 relative">
                  <div className="absolute inset-0 pointer-events-none z-50">
                    <DopamineBurst 
                      trigger={showSubmitBurst} 
                      onComplete={() => setShowSubmitBurst(false)} 
                      particleCount={40}
                    />
                  </div>
                  <Button 
                    className="w-full h-12 text-lg font-bold shadow-md shadow-primary/20 rounded-xl" 
                    disabled={!selectedFile || uploading}
                    onClick={handleSubmitProof}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Jetzt einreichen
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {task.status === 'in_review' && isAssignee && (
              <Card className="bg-yellow-500/10 border-yellow-500/20 p-6 md:p-8">
                <CardContent className="p-0 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold">In Prüfung</h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Wir prüfen deinen Beweis. Deine Belohnung wird automatisch gutgeschrieben, sobald alles okay ist!
                  </p>
                </CardContent>
              </Card>
            )}

            {task.status === 'completed' && (
              <Card className="bg-primary/5 border-primary/10 p-6 md:p-10 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none z-50">
                  <DopamineBurst 
                    trigger={showCompleteBurst} 
                    onComplete={() => setShowCompleteBurst(false)} 
                    particleCount={100}
                  />
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy className="h-24 w-24 rotate-12" />
                </div>
                <CardContent className="p-0 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-primary">
                      {task.reward_claimed ? 'Erfolgreich abgeschlossen!' : 'Aufgabe abgeschlossen!'}
                    </h3>
                    <p className="text-muted-foreground">
                      {task.reward_claimed 
                        ? (isAssignee ? 'Gute Arbeit! Du hast deinen Teil für das Abi beigetragen.' : 'Diese Aufgabe wurde bereits von jemandem erledigt.')
                        : (isAssignee ? 'Dein Beweis wurde akzeptiert! Hol dir jetzt deine Belohnung ab.' : 'Diese Aufgabe wurde bereits von jemandem erledigt.')
                      }
                    </p>
                  </div>

                  {!task.reward_claimed && isAssignee ? (
                    <Button 
                      size="lg" 
                      className="gap-2 h-14 px-8 text-xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 animate-bounce"
                      onClick={handleClaimReward}
                      disabled={claiming}
                    >
                      {claiming ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <Gift className="h-6 w-6" />
                          Belohnung abholen
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-primary font-bold text-xl bg-background px-6 py-3 rounded-xl border shadow-sm">
                      <span>+{task.reward_boosters} Booster erhalten</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (Info & Actions) */}
          <div className="space-y-6">
            <Card className="shadow-md border-primary/10 overflow-hidden bg-card py-0 gap-0">
              <CardHeader className="px-5 pt-5 pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Belohnung</span>
                  <div className="text-primary font-black text-2xl">
                    {task.reward_boosters} Booster
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pt-0 pb-5 flex flex-col gap-4">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center py-2 border-b border-muted/30">
                    <span className="text-muted-foreground font-medium text-xs">Status</span>
                    {getStatusBadge(task.status)}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted/30">
                    <span className="text-muted-foreground font-medium text-xs">Schwierigkeit</span>
                    <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0 border-none">Lvl {task.complexity}</Badge>
                  </div>
                  {task.ticket_reduction !== undefined && (
                    <div className="flex justify-between items-center py-2 border-b border-muted/30">
                      <span className="text-muted-foreground font-medium text-xs">Ticket-Abzug</span>
                      <Badge variant="outline" className="font-bold text-[10px] px-2 py-0 border-success text-success bg-success/5">-{task.ticket_reduction} €</Badge>
                    </div>
                  )}
                  {task.assignee_id && (
                    <div className="flex justify-between items-center py-2 border-b border-muted/30">
                      <span className="text-muted-foreground font-medium text-xs">Bearbeiter</span>
                      <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                        <User className="h-3.5 w-3.5" />
                        <span>{task.assignee_name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {canClaim ? (
                  <Button 
                    className="w-full h-12 text-lg font-black shadow-md shadow-primary/5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95" 
                    onClick={() => setShowClaimDialog(true)}
                  >
                    Aufgabe annehmen
                  </Button>
                ) : task.status === 'open' && !profile && (
                  <div className="bg-muted px-4 py-3 rounded-xl text-center text-xs font-medium text-muted-foreground">
                    Anmeldung erforderlich
                  </div>
                )}

                {isPlanner && (
                  <div className="pt-2 border-t border-dashed -mt-1">
                    <Button 
                      variant="ghost" 
                      className="w-full h-8 gap-2 text-destructive/50 hover:text-destructive hover:bg-destructive/5 text-[10px] font-bold uppercase tracking-wider" 
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Aufgabe löschen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="px-5 py-5 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <p className="font-bold mb-1 uppercase tracking-widest text-[10px]">Hinweis</p>
                  Du hast nach der Annahme 7 Tage Zeit, die Aufgabe zu erledigen und einen Beweis hochzuladen. Danach wird sie wieder für alle freigegeben.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Recommended Tasks Section */}
      <section className="pt-12 border-t space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Das könnte dich auch interessieren
            </h2>
            <p className="text-muted-foreground text-sm font-medium">Entdecke weitere spannende Aufgaben im Marktplatz.</p>
          </div>
          <Link href="/aufgaben">
            <Button variant="outline" className="rounded-xl font-bold">Alle ansehen</Button>
          </Link>
        </div>

        {recsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {recommendations.map(r => (
              <MarketplaceCard 
                key={r.id}
                task={r}
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/30 rounded-2xl border-2 border-dashed">
            <p className="text-muted-foreground text-sm font-medium">Momentan keine weiteren Aufgaben verfügbar.</p>
          </div>
        )}
      </section>

      {/* Confirmation Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="sm:max-w-md border-primary/10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/10" />
          <DialogHeader className="pt-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Swords className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-black text-center">Bist du der Aufgabe würdig?</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Diese Aufgabe erfordert vollen Einsatz. Kannst du sie <span className="text-foreground font-bold italic">wirklich</span> machen und bis zum Ende durchziehen?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-sm text-center italic text-muted-foreground my-2">
            "Nur wer die Ausdauer besitzt, wird die Belohnung von {task.reward_boosters} Booster{task.reward_boosters !== 1 ? 'n' : ''} erhalten."
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={() => setShowClaimDialog(false)}
            >
              Noch nicht bereit
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl font-black text-lg bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
              onClick={handleClaim}
            >
              Ja, ich mache es!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

