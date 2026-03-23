'use client'

import { useState, useRef } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'
import { FeedbackType, type NewsImage } from '@/types/database'
import { NewsImageCropper } from './NewsImageCropper'
import { prepareNewsImage, uploadNewsImage, validateNewsImageFile } from '@/lib/newsImageUpload'

// Extracted form component to isolate state-driven re-renders from the Dialog component
function FeedbackForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<FeedbackType>('feature')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const uploadedImage = useRef<NewsImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setUploadError(null)
      await validateNewsImageFile(file)
      const preparedFile = await prepareNewsImage(file)
      setImageFile(preparedFile)
      setIsCropping(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setUploadError(errorMessage)
      toast.error(`Bild-Fehler: ${errorMessage}`)
    }
  }

  const handleCropConfirm = (croppedFile: File) => {
    setIsCropping(false)
    setImageFile(croppedFile)
    const previewUrl = URL.createObjectURL(croppedFile)
    setImagePreview(previewUrl)

    // Start upload in background
    if (!user) return
    setIsUploading(true)
    uploadNewsImage(user.uid, croppedFile)
      .then(result => {
        uploadedImage.current = { url: result.url, path: result.path }
        toast.success('Bild-Upload erfolgreich!')
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
        setUploadError(errorMessage)
        toast.error(`Upload-Fehler: ${errorMessage}`)
        handleRemoveImage()
      })
      .finally(() => {
        setIsUploading(false)
      })
  }

  const handleCropCancel = () => {
    setIsCropping(false)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    uploadedImage.current = null
    setIsUploading(false)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Du musst angemeldet sein, um Feedback zu geben.')
      return
    }

    if (isUploading) {
      toast.info('Bitte warte, bis der Bild-Upload abgeschlossen ist.')
      return
    }

    setLoading(true)
    try {
      const feedbackData: { [key: string]: any } = {
        title,
        description,
        type,
        status: 'new',
        created_at: new Date().toISOString(),
        created_by: user.uid,
        created_by_name: profile?.full_name || user.displayName || 'Unbekannt',
        is_anonymous: isAnonymous,
        is_private: isPrivate,
        image: uploadedImage.current || null,
      }
      
      const docRef = await addDoc(collection(db, 'feedback'), feedbackData)

      await logAction('FEEDBACK_SUBMIT', user.uid, profile?.full_name, {
        id: docRef.id,
        title,
        type,
        is_anonymous: isAnonymous,
        is_private: isPrivate,
        has_image: !!uploadedImage.current,
      })

      toast.success('Danke für dein Feedback!')
      onSuccess()
    } catch (error) {
      console.error('Error adding feedback:', error)
      toast.error('Fehler beim Senden des Feedbacks.')
    } finally {
      setLoading(false)
    }
  }

  if (isCropping && imageFile) {
    return (
      <NewsImageCropper
        file={imageFile}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Art des Feedbacks</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={type === 'bug' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 px-2"
              onClick={() => setType('bug')}
            >
              <Bug className="h-3.5 w-3.5" /> Bug
            </Button>
            <Button
              type="button"
              variant={type === 'feature' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 px-2"
              onClick={() => setType('feature')}
            >
              <Lightbulb className="h-3.5 w-3.5" /> Idee
            </Button>
            <Button
              type="button"
              variant={type === 'other' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 px-2"
              onClick={() => setType('other')}
            >
              <HelpCircle className="h-3.5 w-3.5" /> Sonstiges
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fb-title">Titel</Label>
          <Input 
            id="fb-title" 
            placeholder="z.B. Bug beim Leaderboard" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fb-desc">Beschreibung</Label>
          <Textarea 
            id="fb-desc" 
            placeholder="Beschreibe dein Anliegen so genau wie möglich..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            className="[field-sizing:fixed]" // Explicitly disable auto-sizing if it's causing lag
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fb-image">Anhang (optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Feedback Vorschau" className="w-full rounded-md border" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                  <p className="text-sm text-white">Upload läuft...</p>
                </div>
              )}
            </div>
          ) : (
            <Input
              id="fb-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="cursor-pointer"
            />
          )}
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="fb-anonymous" 
              checked={isAnonymous} 
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="fb-anonymous"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
              id="fb-private" 
              checked={isPrivate} 
              onCheckedChange={(checked) => setIsPrivate(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="fb-private"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Privat senden
              </label>
              <p className="text-xs text-muted-foreground">
                Nur für Admins sichtbar.
              </p>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading || isUploading} className="w-full">
          {loading ? 'Wird gesendet...' : (isUploading ? 'Bild lädt hoch...' : 'Absenden')}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AddFeedbackDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquarePlus className="h-4 w-4" /> Feedback / Feature-Wunsch
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Feedback & Wünsche</DialogTitle>
          <DialogDescription>
            Hast du einen Fehler gefunden oder eine Idee für eine neue Funktion?
          </DialogDescription>
        </DialogHeader>
        {open && <FeedbackForm key={Date.now()} onSuccess={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}
