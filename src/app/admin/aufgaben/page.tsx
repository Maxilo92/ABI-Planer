'use client'

import { useEffect, useState } from 'react'
import { db, functions, storage } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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
  ShieldCheck,
  Plus,
  Trash2,
  Tags,
  ImagePlus
} from 'lucide-react'
import { Task, Settings, TaskCategory } from '@/types/database'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { compressImage } from '@/lib/taskMediaUpload'
import { CATEGORY_ICONS, CategoryIconName, getCategoryIcon } from '@/lib/category-icons'
import { logAction } from '@/lib/logging'

export default function AdminTasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewingTask, setReviewingTask] = useState<Task | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Category State
  const [newCatName, setNewCatName] = useState('')
  const [newCatImage, setNewCatImage] = useState<File | null>(null)
  const [selectedIcon, setSelectedIcon] = useState<CategoryIconName>('Tags')
  const [isAddingCat, setIsAddingCat] = useState(false)

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
    }, (error) => {
      console.error('Error listening to review tasks:', error)
    })

    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings({ id: 1, ...doc.data() } as Settings)
      }
      setLoading(false)
    }, (error) => {
      console.error('Error listening to settings:', error)
      setLoading(false)
    })

    return () => {
      unsubscribe()
      unsubscribeSettings()
    }
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

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    setIsAddingCat(true)
    try {
      let image_url = ''
      if (newCatImage) {
        const compressed = await compressImage(newCatImage)
        const storageRef = ref(storage, `task-categories/${Date.now()}-${newCatName.toLowerCase().replace(/\s+/g, '-')}`)
        const snapshot = await uploadBytes(storageRef, compressed)
        image_url = await getDownloadURL(snapshot.ref)
      }

      const newCategory: TaskCategory = {
        id: crypto.randomUUID(),
        name: newCatName.trim(),
        image_url,
        icon: selectedIcon,
        is_active: true
      }

      await updateDoc(doc(db, 'settings', 'config'), {
        task_categories: arrayUnion(newCategory)
      })

      setNewCatName('')
      setNewCatImage(null)
      setSelectedIcon('Tags')
      toast.success('Kategorie hinzugefügt!')
    } catch (e) {
      console.error('Error adding category:', e)
      toast.error('Fehler beim Hinzufügen der Kategorie')
    } finally {
      setIsAddingCat(false)
    }
  }

  const handleDeleteCategory = async (category: TaskCategory) => {
    if (!confirm(`Möchtest du die Kategorie "${category.name}" wirklich löschen?`)) return
    try {
      await updateDoc(doc(db, 'settings', 'config'), {
        task_categories: arrayRemove(category)
      })
      toast.success('Kategorie gelöscht.')
    } catch (e) {
      console.error('Error deleting category:', e)
      toast.error('Fehler beim Löschen der Kategorie')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aufgaben Management</h1>
          <p className="text-muted-foreground">Verwalte Aufgaben, Kategorien und Freigaben.</p>
        </div>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="w-fit bg-muted rounded-xl p-1 mb-6">
          <TabsTrigger value="review" className="rounded-lg px-6 font-bold gap-2">
            <ShieldCheck className="h-4 w-4" />
            Prüfung ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg px-6 font-bold gap-2">
            <Tags className="h-4 w-4" />
            Kategorien
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-0 focus-visible:outline-none">
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
              {tasks.map((task, index) => (
                <Card key={task.id} className="flex flex-col overflow-hidden border-border shadow-sm">
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
                        
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border group">
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
                              loading={index === 0 ? 'eager' : 'lazy'}
                              sizes="(max-width: 768px) 100vw, 50vw"
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
        </TabsContent>

        <TabsContent value="categories" className="mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-border">
              <CardHeader>
                <CardTitle>Neue Kategorie</CardTitle>
                <CardDescription>Erstelle eine neue Kategorie für den Marktplatz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="catName">Name</Label>
                  <Input 
                    id="catName" 
                    placeholder="z.B. Event Hilfe" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Icon wählen</Label>
                  <div className="grid grid-cols-5 gap-2 p-2 border rounded-xl bg-muted/30">
                    {(Object.keys(CATEGORY_ICONS) as CategoryIconName[]).map((iconName) => {
                      const IconComp = CATEGORY_ICONS[iconName]
                      return (
                        <button
                          key={iconName}
                          onClick={() => setSelectedIcon(iconName)}
                          className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                            selectedIcon === iconName 
                              ? 'bg-brand text-brand-foreground shadow-md scale-110' 
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                          title={iconName}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Optionales Hintergrundbild</Label>
                  <div className="flex items-center gap-4">
                    {newCatImage ? (
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden border">
                        <Image src={URL.createObjectURL(newCatImage)} alt="Preview" fill className="object-cover" />
                        <button 
                          onClick={() => setNewCatImage(null)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-16 w-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-bold mt-1">Upload</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => setNewCatImage(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Wähle ein passendes Bild, das die Kategorie im Marktplatz repräsentiert.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2 font-bold" 
                  disabled={!newCatName.trim() || isAddingCat}
                  onClick={handleAddCategory}
                >
                  {isAddingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Kategorie erstellen
                </Button>
              </CardFooter>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                Bestehende Kategorien 
                <Badge variant="secondary" className="rounded-full">{(settings?.task_categories || []).length}</Badge>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(settings?.task_categories || []).map((cat) => {
                  const IconComp = getCategoryIcon(cat.icon)
                  return (
                    <Card key={cat.id} className="flex items-center p-3 gap-3 border-border hover:border-border/80 transition-colors shadow-none">
                      <div className="h-12 w-12 rounded-lg bg-muted relative overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50">
                        {cat.image_url ? (
                          <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                        ) : (
                          <IconComp className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {!cat.image_url && <IconComp className="h-3 w-3 text-brand" />}
                          <p className="font-bold truncate">{cat.name}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
                          {cat.is_active ? 'Aktiv' : 'Inaktiv'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground/40 hover:text-destructive h-8 w-8"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  )
                })}
                
                {(settings?.task_categories || []).length === 0 && (
                  <div className="sm:col-span-2 py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground/40">
                    <p>Noch keine Kategorien erstellt.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
