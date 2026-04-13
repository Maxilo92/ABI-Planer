'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, query, orderBy, onSnapshot, where, or, doc, updateDoc } from 'firebase/firestore'
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, Image as ImageIcon, X, Loader2 } from 'lucide-react'

import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { NewsImageCropper } from '@/components/modals/NewsImageCropper'
import { uploadNewsImage, validateNewsImageFile } from '@/lib/newsImageUpload'
import { Badge } from '@/components/ui/badge'
import { toDate, cn } from '@/lib/utils'
import { logAction } from '@/lib/logging'
import { Feedback, FeedbackType, FeedbackStatus } from '@/types/database'

type FeedbackImageCropMode = 'landscape' | 'portrait'

export default function FeedbackPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<FeedbackType>('feature')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([])
  const [listLoading, setListLoading] = useState(true)

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState<FeedbackImageCropMode>('landscape')
  const [isUploading, setIsUploading] = useState(false)
  const [preparedImageUpload, setPreparedImageUpload] = useState<{ url: string } | null>(null)
  const [isPreparingImageUpload, setIsPreparingImageUpload] = useState(false)

  const canViewAllFeedback = profile?.role && ['admin', 'admin_main', 'admin_co', 'planner'].includes(profile.role)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading || !user) return

    const feedbackRef = collection(db, 'feedback')
    const q = canViewAllFeedback 
      ? query(feedbackRef, orderBy('created_at', 'desc'))
      : query(
          feedbackRef, 
          or(
            where('is_private', '==', false),
            where('created_by', '==', user.uid)
          ),
          orderBy('created_at', 'desc')
        )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeedbackItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)))
      setListLoading(false)
    }, (error) => {
      console.error("Error fetching feedback: ", error)
      setListLoading(false)
    })

    return () => unsubscribe()
  }, [canViewAllFeedback, authLoading, user])

  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl)
      }
    }
  }, [croppedPreviewUrl])

  useEffect(() => {
    let isActive = true

    const uploadInBackground = async () => {
      if (!user || !croppedFile) {
        setPreparedImageUpload(null)
        setIsPreparingImageUpload(false)
        return
      }

      setIsPreparingImageUpload(true)
      try {
        const uploadResult = await uploadNewsImage(user.uid, croppedFile)
        if (!isActive) return
        setPreparedImageUpload({ url: uploadResult.url })
      } catch (error) {
        if (!isActive) return
        console.error('Error uploading feedback image in background:', error)
        setPreparedImageUpload(null)
      } finally {
        if (isActive) {
          setIsPreparingImageUpload(false)
        }
      }
    }

    uploadInBackground()

    return () => {
      isActive = false
    }
  }, [croppedFile, user])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await validateNewsImageFile(file)
      setPreparedImageUpload(null)
      setSelectedFile(file)
      setShowCropper(true)
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Auswählen des Bildes.')
      e.target.value = ''
    }
  }

  const handleCropConfirm = (file: File) => {
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl)
    }
    setCroppedFile(file)
    setCroppedPreviewUrl(URL.createObjectURL(file))
    setShowCropper(false)
    setSelectedFile(null)
  }

  const handleRemoveImage = () => {
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl)
    }
    setCroppedFile(null)
    setCroppedPreviewUrl(null)
    setPreparedImageUpload(null)
    setIsPreparingImageUpload(false)
    setSelectedFile(null)
    setShowCropper(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Du musst angemeldet sein, um Feedback zu geben.')
      return
    }

    setLoading(true)
    try {
      let imageUrl = ''
      if (croppedFile && preparedImageUpload?.url) {
        imageUrl = preparedImageUpload.url
      } else if (croppedFile) {
        setIsUploading(true)
        const uploadResult = await uploadNewsImage(user.uid, croppedFile)
        imageUrl = uploadResult.url
      }

      const docRef = await addDoc(collection(db, 'feedback'), {
        title,
        description,
        type,
        status: 'new' as FeedbackStatus,
        created_at: new Date().toISOString(),
        created_by: user.uid,
        created_by_name: profile?.full_name || user.displayName || 'Unbekannt',
        image_url: imageUrl || null,
        is_anonymous: isAnonymous,
        is_private: isPrivate
      })

      // Background analysis with Groq
      try {
        const analysisResponse = await fetch('/api/feedback/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        })
        const analysis = await analysisResponse.json()
        if (analysis.ok) {
          await updateDoc(doc(db, 'feedback', docRef.id), {
            category: analysis.category,
            importance: analysis.importance
          })
        }
      } catch (analysisError) {
        console.error('Error analyzing feedback:', analysisError)
      }

      await logAction('FEEDBACK_CREATED', user.uid, profile?.full_name, { 
        title,
        type,
        has_image: !!imageUrl,
        is_anonymous: isAnonymous,
        is_private: isPrivate
      })

      toast.success('Danke für dein Feedback!')
      setTitle('')
      setDescription('')
      setType('feature')
      setIsAnonymous(false)
      setIsPrivate(false)
      handleRemoveImage()
    } catch (error) {
      console.error('Error adding feedback:', error)
      toast.error('Fehler beim Senden des Feedbacks.')
    } finally {
      setLoading(false)
      setIsUploading(false)
    }
  }

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

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 px-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Card className="rounded-2xl">
          <CardHeader className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
            <Skeleton className="h-12 w-48 rounded-md" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const sortedItems = [...feedbackItems].sort((a, b) => {
    const statusOrder: Record<FeedbackStatus, number> = {
      'new': 0,
      'in_progress': 0,
      'implemented': 1,
      'rejected': 1
    }

    const orderA = statusOrder[a.status] ?? 2
    const orderB = statusOrder[b.status] ?? 2

    if (orderA !== orderB) {
      return orderA - orderB
    }

    // Secondary sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Robust filtering for display
  const filteredItems = sortedItems.filter(item => {
    // Admins/Planners see everything that is fetched, but we badge it clearly.
    if (canViewAllFeedback) return true
    
    // Normal users see:
    // 1. Their own feedback
    // 2. Public feedback (is_private explicitly false OR missing)
    if (item.created_by === user?.uid) return true
    
    const isPrivate = item.is_private === true // Treats undefined/null as false
    return !isPrivate
  })

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <MessageSquarePlus className="h-7 w-7 text-primary" /> Feedback & Bugs
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Neues Feedback senden</CardTitle>
            <CardDescription>
              Je genauer deine Beschreibung, desto schneller können wir es umsetzen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Art des Feedbacks</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={type === 'bug' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setType('bug')}
                  >
                    <Bug className="h-4 w-4" /> Bug
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'feature' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setType('feature')}
                  >
                    <Lightbulb className="h-4 w-4" /> Idee
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'other' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setType('other')}
                  >
                    <HelpCircle className="h-4 w-4" /> Sonstiges
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-title">Titel</Label>
                <Input
                  id="feedback-title"
                  placeholder="z.B. Kalender zeigt falsche Reihenfolge"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-description">Beschreibung</Label>
                <Textarea
                  id="feedback-description"
                  placeholder="Was passiert? Wie kann man es reproduzieren? Was wäre das gewünschte Verhalten?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Bild (optional, z.B. Screenshot vom Fehler)</Label>
                {!croppedFile && !showCropper && (
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    <Button
                      type="button"
                      variant={cropMode === 'landscape' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCropMode('landscape')}
                    >
                      Querformat (16:9)
                    </Button>
                    <Button
                      type="button"
                      variant={cropMode === 'portrait' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCropMode('portrait')}
                    >
                      Hochkant (3:4)
                    </Button>
                  </div>
                )}
                {!croppedFile && !showCropper && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('feedback-image')?.click()}
                      className="gap-2"
                    >
                      <ImageIcon className="h-4 w-4" /> Bild auswählen
                    </Button>
                    <input
                      id="feedback-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                )}

                {showCropper && selectedFile && (
                  <NewsImageCropper
                    file={selectedFile}
                    aspect={cropMode === 'portrait' ? 3 / 4 : 16 / 9}
                    title={cropMode === 'portrait' ? 'Bild zuschneiden (3:4 Hochkant)' : 'Bild zuschneiden (16:9 Querformat)'}
                    onCancel={() => {
                      setShowCropper(false)
                      setSelectedFile(null)
                    }}
                    onConfirm={handleCropConfirm}
                  />
                )}

                {croppedFile && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={croppedPreviewUrl || ''}
                      alt="Vorschau"
                      className="h-32 w-auto rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {(isPreparingImageUpload || preparedImageUpload) && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {isPreparingImageUpload ? 'Bild wird im Hintergrund hochgeladen...' : 'Bild ist bereits hochgeladen und bereit zum Senden.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="anonymous" 
                    checked={isAnonymous} 
                    onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="anonymous"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Anonym posten
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Dein Name wird nicht öffentlich angezeigt.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="private" 
                    checked={isPrivate} 
                    onCheckedChange={(checked) => setIsPrivate(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="private"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Privat senden
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Nur für Planer/Admins sichtbar.
                    </p>                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading || isUploading} className="w-full sm:w-auto">
                {loading || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? 'Bild wird hochgeladen...' : 'Wird gesendet...'}
                  </>
                ) : 'Feedback absenden'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight px-1">Aktuelle Meldungen</h2>
        {listLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-1/2 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-muted-foreground italic">Noch keine öffentlichen Meldungen vorhanden.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => {
              const isItemPrivate = item.is_private === true
              const isItemAnonymous = item.is_anonymous === true
              const isOwnItem = item.created_by === user?.uid

              return (
                <Card key={item.id} className={cn(
                  "overflow-hidden transition-all",
                  isItemPrivate && "border-l-4 border-l-warning"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getIcon(item.type)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {canViewAllFeedback && item.category && (
                          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px]">
                            {item.category}
                          </Badge>
                        )}
                        {canViewAllFeedback && item.importance && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]",
                              item.importance >= 8 ? "border-destructive/40 bg-destructive/10 text-destructive" :
                              item.importance >= 5 ? "border-amber-500/40 bg-amber-500/10 text-amber-600" :
                              "border-success/40 bg-success/10 text-success"
                            )}
                          >
                            Prio {item.importance}
                          </Badge>
                        )}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        {(isItemAnonymous && !canViewAllFeedback) ? 'Anonym' : (item.created_by_name || 'Unbekannt')}
                      </span>
                      <span>•</span>
                      <span>{toDate(item.created_at).toLocaleDateString('de-DE')}</span>
                      
                      {isItemAnonymous && canViewAllFeedback && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">Anonym</Badge>
                      )}
                      {isItemPrivate && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-warning/50 text-warning bg-warning/5">
                          {canViewAllFeedback ? 'Privat' : 'Nur für dich sichtbar'}
                        </Badge>
                      )}
                      {isOwnItem && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary/50 text-primary bg-primary/5">Eigenes</Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                    {(item.image_url || (item as any).image?.url) && (
                      <div className="mt-2">
                        <img 
                          src={item.image_url || (item as any).image?.url} 
                          alt={item.title} 
                          className="rounded-md border max-h-64 object-contain bg-muted/20"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

