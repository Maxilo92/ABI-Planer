'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, Image as ImageIcon, X, Loader2 } from 'lucide-react'

import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { NewsImageCropper } from '@/components/modals/NewsImageCropper'
import { uploadNewsImage, validateNewsImageFile } from '@/lib/newsImageUpload'
import { Badge } from '@/components/ui/badge'
import { toDate } from '@/lib/utils'
import { logAction } from '@/lib/logging'

type FeedbackType = 'bug' | 'feature' | 'other'
type FeedbackStatus = 'new' | 'in_progress' | 'implemented' | 'rejected'

interface Feedback {
  id: string
  title: string
  description: string
  type: FeedbackType
  status: FeedbackStatus
  created_at: string
  created_by: string
  created_by_name?: string
  image_url?: string
}

export default function FeedbackPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<FeedbackType>('feature')
  const [loading, setLoading] = useState(false)
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([])
  const [listLoading, setListLoading] = useState(true)

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const feedbackRef = collection(db, 'feedback')
    const q = query(feedbackRef, orderBy('created_at', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeedbackItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)))
      setListLoading(false)
    }, (error) => {
      console.error("Error fetching feedback: ", error)
      setListLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await validateNewsImageFile(file)
      setSelectedFile(file)
      setShowCropper(true)
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Auswählen des Bildes.')
      e.target.value = ''
    }
  }

  const handleCropConfirm = (file: File) => {
    setCroppedFile(file)
    setShowCropper(false)
    setSelectedFile(null)
  }

  const handleRemoveImage = () => {
    setCroppedFile(null)
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
      if (croppedFile) {
        setIsUploading(true)
        const uploadResult = await uploadNewsImage(user.uid, croppedFile)
        imageUrl = uploadResult.url
      }

      await addDoc(collection(db, 'feedback'), {
        title,
        description,
        type,
        status: 'new',
        created_at: new Date().toISOString(),
        created_by: user.uid,
        created_by_name: profile?.full_name || user.displayName || 'Unbekannt',
        image_url: imageUrl || null
      })

      await logAction('FEEDBACK_CREATED', user.uid, profile?.full_name, { 
        title,
        type,
        has_image: !!imageUrl
      })

      toast.success('Danke für dein Feedback!')
      setTitle('')
      setDescription('')
      setType('feature')
      setCroppedFile(null)
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
    return <div className="py-8 text-center text-muted-foreground">Lade Feedback-Seite...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <MessageSquarePlus className="h-7 w-7 text-primary" /> Feedback & Bugs
          </h1>
          <p className="text-muted-foreground mt-1">
            Hilf uns, den ABI Planer zu verbessern. Melde Fehler oder schlage neue Funktionen vor.
          </p>
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
                      src={URL.createObjectURL(croppedFile)}
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
                  </div>
                )}
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
        <h2 className="text-2xl font-bold tracking-tight">Aktuelle Meldungen</h2>
        {listLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : feedbackItems.length === 0 ? (
          <p className="text-muted-foreground italic">Noch keine öffentlichen Meldungen vorhanden.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {feedbackItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getIcon(item.type)}
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <CardDescription>
                    {item.created_by_name || 'Unbekannt'} • {toDate(item.created_at).toLocaleDateString('de-DE')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                  {item.image_url && (
                    <div className="mt-2">
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="rounded-md border max-h-64 object-contain bg-muted/20"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

