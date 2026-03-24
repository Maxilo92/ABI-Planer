'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
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
import { Plus, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { getNewsUploadErrorMessage, uploadNewsImage, validateNewsImageFile } from '@/lib/newsImageUpload'
import { NewsImageCropper } from '@/components/modals/NewsImageCropper'
import { logAction } from '@/lib/logging'

export function AddNewsDialog() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSmallUpdate, setIsSmallUpdate] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()

  const resetForm = () => {
    setTitle('')
    setContent('')
    setIsSmallUpdate(false)
    setImageFile(null)
    setPendingCropFile(null)
    setImageInputKey((prev) => prev + 1)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setPendingCropFile(null)
      setImageInputKey((prev) => prev + 1)
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
      setImagePreviewUrl(null)
      return
    }

    try {
      await validateNewsImageFile(file)
      setImageFile(null)
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
      setImagePreviewUrl(null)
      setPendingCropFile(file)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bild konnte nicht verwendet werden.'
      toast.error(message)
      event.target.value = ''
      setImageFile(null)
      setPendingCropFile(null)
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
      setImagePreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (user) {
      try {
        let imagePayload: {
          image_url?: string
          image_path?: string
          image_size_bytes?: number
          image_mime_type?: string
        } = {}

        if (imageFile) {
          const uploadedImage = await uploadNewsImage(user.uid, imageFile)
          imagePayload = {
            image_url: uploadedImage.url,
            image_path: uploadedImage.path,
            image_size_bytes: uploadedImage.size,
            image_mime_type: uploadedImage.mimeType,
          }
        }

        await addDoc(collection(db, 'news'), {
          title: trimmedTitle,
          content: trimmedContent,
          is_small_update: isSmallUpdate,
          created_by: user.uid,
          author_name: profile?.full_name || user.displayName || 'Unbekannt',
          view_count: 0,
          created_at: serverTimestamp(),
          ...imagePayload,
        })

        await logAction('NEWS_CREATED', user.uid, profile?.full_name, {
          title: trimmedTitle,
          has_image: !!imagePayload.image_url,
        })

        resetForm()
        setOpen(false)
        toast.success('News-Beitrag veröffentlicht.')
      } catch (error) {
        console.error('Error adding news:', error)
        toast.error(getNewsUploadErrorMessage(error))
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> News erstellen
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neues Update verfassen</DialogTitle>
          <DialogDescription>
            Informiere den Jahrgang über Neuigkeiten.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
              <Checkbox 
                id="isSmallUpdate" 
                checked={isSmallUpdate}
                onCheckedChange={(checked) => setIsSmallUpdate(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="isSmallUpdate"
                  className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Kleines Update (Quick-News)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Keine eigene Detailseite, voller Text wird in der Liste angezeigt.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Überschrift</Label>
              <Input 
                id="title" 
                placeholder="z.B. Location gefunden!" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Inhalt</Label>
              <Textarea 
                id="content" 
                placeholder="Beschreibe kurz was es Neues gibt..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                required 
              />
              <p className="text-xs text-muted-foreground">Markdown wird unterstützt, z.B. <strong>fett</strong> mit `**Text**` oder Listen mit `- Punkt`.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Titelbild (optional)</Label>
              <Input key={imageInputKey} id="image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
              <label
                htmlFor="image"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10"
              >
                <ImagePlus className="h-4 w-4 text-primary" /> Bild auswählen und zuschneiden
              </label>
              <p className="text-xs text-muted-foreground">Maximal 5 MB. Nach Auswahl legst du den Bildausschnitt selbst fest.</p>
              {pendingCropFile && (
                <NewsImageCropper
                  file={pendingCropFile}
                  onCancel={() => {
                    setPendingCropFile(null)
                    setImageInputKey((prev) => prev + 1)
                  }}
                  onConfirm={(croppedFile) => {
                    if (imagePreviewUrl) {
                      URL.revokeObjectURL(imagePreviewUrl)
                    }
                    setPendingCropFile(null)
                    setImageFile(croppedFile)
                    setImagePreviewUrl(URL.createObjectURL(croppedFile))
                  }}
                />
              )}
              {imagePreviewUrl && (
                <div className="aspect-video rounded-lg border overflow-hidden bg-muted/20">
                  <img src={imagePreviewUrl} alt="Vorschau Titelbild" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !!pendingCropFile}>
              {loading ? 'Veröffentliche...' : 'Veröffentlichen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
