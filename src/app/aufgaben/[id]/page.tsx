'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
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
  Download,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { Task } from '@/types/database'
import Image from 'next/image'
import { toast } from 'sonner'
import { uploadTaskProof } from '@/lib/taskMediaUpload'

export default function TaskDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!id) return

    const unsubscribe = onSnapshot(doc(db, 'tasks', id as string), (doc) => {
      if (doc.exists()) {
        setTask({ id: doc.id, ...doc.data() } as Task)
      } else {
        toast.error('Aufgabe nicht gefunden.')
        router.push('/aufgaben')
      }
      setLoading(false)
    }, (error) => {
      console.error('Error listening to task:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [id, router])

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!task) return null

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
    switch (status) {
      case 'open': return <Badge variant="secondary">Offen</Badge>
      case 'claimed': return <Badge className="bg-blue-500">Angenommen</Badge>
      case 'in_review': return <Badge className="bg-yellow-500">In Prüfung</Badge>
      case 'rejected': return <Badge variant="destructive">Nachbesserung nötig</Badge>
      case 'completed': return <Badge className="bg-green-500">Abgeschlossen</Badge>
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/aufgaben">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight line-clamp-1">{task.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle>Beschreibung</CardTitle>
                <div className="flex items-center gap-2 pt-1">
                  {getStatusBadge(task.status)}
                  <Badge variant="outline">Lvl {task.complexity}</Badge>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-primary font-bold text-xl">
                  <Zap className="h-5 w-5 fill-primary" />
                  <span>{task.reward_boosters}</span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Booster Belohnung</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {task.description}
              </p>

              {task.task_image_urls && task.task_image_urls.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Erklärbilder
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {task.task_image_urls.map((url, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted group">
                        <Image src={url} alt={`Task image ${i+1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Button variant="secondary" size="sm" className="h-8 gap-1">
                            <Download className="h-3 w-3" /> Vollbild
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {task.status === 'rejected' && isAssignee && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Ablehnungsgrund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{task.rejected_reason}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Bitte korrigiere deine Einreichung und lade den neuen Beweis hoch. Du hast insgesamt 7 Tage Zeit, bevor die Aufgabe wieder auf dem Marktplatz landet.
                </p>
              </CardContent>
            </Card>
          )}

          {canSubmit && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Beweis einreichen</CardTitle>
                <CardDescription>
                  Lade ein Foto oder ein kurzes Video (max. 30MB) hoch, das beweist, dass du die Aufgabe erledigt hast.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 bg-background">
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center">
                      {selectedFile.type.startsWith('image/') ? (
                        <div className="relative h-40 w-40 rounded-lg overflow-hidden mb-4 border shadow-sm">
                          <Image src={URL.createObjectURL(selectedFile)} alt="Preview" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-40 w-40 flex items-center justify-center rounded-lg bg-muted mb-4 border shadow-sm">
                          <FileVideo className="h-16 w-16 text-primary" />
                        </div>
                      )}
                      <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <Button variant="ghost" size="sm" className="mt-4 text-destructive h-8" onClick={() => setSelectedFile(null)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Entfernen
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer group flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <span className="mt-4 font-medium">Datei auswählen</span>
                      <span className="text-xs text-muted-foreground mt-1">Foto oder kurzes Video</span>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                  disabled={!selectedFile || uploading}
                  onClick={handleSubmitProof}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Beweis jetzt einreichen
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {task.status === 'in_review' && isAssignee && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-yellow-500 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold">In Prüfung</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Dein Beweis wurde eingereicht. Ein Admin wird ihn bald prüfen. Du erhältst deine Belohnung, sobald die Aufgabe freigegeben wurde!
                </p>
              </CardContent>
            </Card>
          )}

          {task.status === 'completed' && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-bold">Aufgabe erledigt!</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Diese Aufgabe wurde erfolgreich abgeschlossen. {isAssignee ? 'Du hast deine Belohnung erhalten.' : ''}
                </p>
                <div className="mt-6 flex items-center gap-2 text-primary font-bold bg-background px-4 py-2 rounded-full border">
                  <Zap className="h-5 w-5 fill-primary" />
                  <span>+{task.reward_boosters} Booster erhalten</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(task.status)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Erstellt am</span>
                <span className="font-medium">
                  {new Date(typeof task.created_at === 'object' && 'seconds' in task.created_at ? task.created_at.seconds * 1000 : task.created_at).toLocaleDateString()}
                </span>
              </div>
              {task.assignee_id && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Bearbeiter</span>
                  <div className="flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" />
                    <span className="font-bold">{task.assignee_name}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              {canClaim && (
                <Button className="w-full font-bold h-11" onClick={handleClaim}>
                  Aufgabe annehmen
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
