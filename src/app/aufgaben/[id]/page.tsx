'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Zap, 
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
  ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { Task } from '@/types/database'
import Image from 'next/image'
import { toast } from 'sonner'
import { uploadTaskProof, deleteTaskFile } from '@/lib/taskMediaUpload'
import { getTaskStatusMeta } from '@/modules/shared/status'

import { ImageCarousel } from '@/components/aufgaben/ImageCarousel'

export default function TaskDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!id) return

    const unsubscribe = onSnapshot(doc(db, 'tasks', id as string), (doc) => {
      if (doc.exists()) {
        setTask({ id: doc.id, ...doc.data() } as Task)
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
  }, [id, router, deleting])

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
      toast.success('Aufgabe angenommen! Viel Erfolg.')
    } catch (error) {
      console.error('Error claiming task:', error)
      toast.error('Fehler beim Annehmen der Aufgabe.')
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
      const { url, path, type } = await uploadTaskProof(task.id, profile.id, selectedFile)
      
      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'in_review',
        proof_media_url: url,
        proof_media_type: type,
        proof_storage_path: path,
        submitted_at: serverTimestamp(),
      })
      
      setSelectedFile(null)
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/aufgaben">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{task.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Inseriert am {new Date(typeof task.created_at === 'object' && 'seconds' in task.created_at ? task.created_at.seconds * 1000 : task.created_at).toLocaleDateString()}</span>
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
            <div className="aspect-video w-full rounded-xl bg-muted flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed">
              <ImageIcon className="h-16 w-16 mb-2" />
              <span className="font-medium uppercase tracking-wider">Keine Bilder vorhanden</span>
            </div>
          )}

          {/* Description Section */}
          <Card className="border-none shadow-none bg-transparent px-0">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Beschreibung</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-lg">
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
                <p className="font-medium text-lg">{task.rejected_reason}</p>
                <p className="text-sm text-muted-foreground mt-4 italic">
                  Bitte korrigiere deine Einreichung und lade den neuen Beweis hoch.
                </p>
              </CardContent>
            </Card>
          )}

          {canSubmit && (
            <Card className="border-primary/20 bg-primary/5 shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-6 w-6 text-primary" />
                  Beweis einreichen
                </CardTitle>
                <CardDescription className="text-base">
                  Lade ein Foto oder ein kurzes Video (max. 30MB) hoch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl p-10 bg-background/50 hover:bg-background/80 transition-colors">
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center">
                      {selectedFile.type.startsWith('image/') ? (
                        <div className="relative h-48 w-48 rounded-xl overflow-hidden mb-4 border shadow-md">
                          <Image src={URL.createObjectURL(selectedFile)} alt="Preview" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-48 w-48 flex items-center justify-center rounded-xl bg-muted mb-4 border shadow-md">
                          <FileVideo className="h-20 w-20 text-primary" />
                        </div>
                      )}
                      <p className="font-bold text-lg truncate max-w-[250px]">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <Button variant="ghost" size="sm" className="mt-4 text-destructive h-9 font-medium" onClick={() => setSelectedFile(null)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Datei entfernen
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer group flex flex-col items-center">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-10 w-10 text-primary" />
                      </div>
                      <span className="mt-6 font-bold text-xl">Datei hochladen</span>
                      <span className="text-sm text-muted-foreground mt-2">Klicke hier oder ziehe eine Datei hierher</span>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button 
                  className="w-full h-14 text-xl font-black shadow-xl shadow-primary/30 rounded-xl" 
                  disabled={!selectedFile || uploading}
                  onClick={handleSubmitProof}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Wird verarbeitet...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      Jetzt einreichen
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {task.status === 'in_review' && isAssignee && (
            <Card className="bg-yellow-500/10 border-yellow-500/20 py-8">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-black">In Prüfung</h3>
                <p className="text-muted-foreground max-w-sm text-lg">
                  Wir prüfen deinen Beweis. Deine Belohnung wird automatisch gutgeschrieben, sobald alles okay ist!
                </p>
              </CardContent>
            </Card>
          )}

          {task.status === 'completed' && (
            <Card className="bg-green-500/10 border-green-500/20 py-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="h-32 w-32 rotate-12" />
              </div>
              <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-green-700">Erfolgreich abgeschlossen!</h3>
                  <p className="text-muted-foreground text-lg">
                    {isAssignee ? 'Gute Arbeit! Du hast deinen Teil für das Abi beigetragen.' : 'Diese Aufgabe wurde bereits von jemandem erledigt.'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-primary font-black text-2xl bg-background px-8 py-4 rounded-2xl border shadow-sm">
                  <Zap className="h-8 w-8 fill-primary" />
                  <span>+{task.reward_boosters} Booster erhalten</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (Info & Actions) */}
        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Belohnung</span>
                <div className="flex items-center gap-1.5 text-primary font-black text-2xl">
                  <Zap className="h-6 w-6 fill-primary" />
                  <span>{task.reward_boosters}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground font-medium">Status</span>
                  {getStatusBadge(task.status)}
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground font-medium">Schwierigkeit</span>
                  <Badge variant="outline" className="font-bold">Lvl {task.complexity}</Badge>
                </div>
                {task.assignee_id && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground font-medium">Bearbeiter</span>
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <User className="h-4 w-4" />
                      <span>{task.assignee_name}</span>
                    </div>
                  </div>
                )}
              </div>

              {canClaim ? (
                <Button 
                  className="w-full h-14 text-xl font-black shadow-lg shadow-primary/20 rounded-xl" 
                  onClick={handleClaim}
                >
                  Aufgabe annehmen
                </Button>
              ) : task.status === 'open' && !profile && (
                <div className="bg-muted p-4 rounded-xl text-center text-sm font-medium text-muted-foreground">
                  Anmeldung erforderlich zum Annehmen
                </div>
              )}

              {isPlanner && (
                <div className="pt-2 border-t border-dashed">
                  <Button 
                    variant="ghost" 
                    className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5" 
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Aufgabe löschen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-none shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-bold mb-1 uppercase tracking-wider">Hinweis</p>
                Du hast nach der Annahme 7 Tage Zeit, die Aufgabe zu erledigen und einen Beweis hochzuladen. Danach wird sie wieder für alle freigegeben.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

