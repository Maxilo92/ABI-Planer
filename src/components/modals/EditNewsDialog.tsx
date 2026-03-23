'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
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
import { Pencil, ImagePlus } from 'lucide-react'
import { NewsEntry } from '@/types/database'
import { toast } from 'sonner'
import { deleteNewsImageByPath, getNewsUploadErrorMessage, uploadNewsImage, validateNewsImageFile } from '@/lib/newsImageUpload'
import { useAuth } from '@/context/AuthContext'
import { NewsImageCropper } from '@/components/modals/NewsImageCropper'
import { logAction } from '@/lib/logging'

interface EditNewsDialogProps {
  news: NewsEntry
}

export function EditNewsDialog({ news }: EditNewsDialogProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState(news.title)
  const [content, setContent] = useState(news.content)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(news.image_url || null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(news.title)
    setContent(news.content)
    setImageFile(null)
    setPendingCropFile(null)
    setImageInputKey((prev) => prev + 1)
    setImagePreviewUrl(news.image_url || null)
    setRemoveCurrentImage(false)
  }, [open, news])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreviewUrl(removeCurrentImage ? null : (news.image_url || null))
      return
    }

    try {
      await validateNewsImageFile(file)
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
      setImageFile(null)
      setRemoveCurrentImage(false)
      setImagePreviewUrl(news.image_url || null)
      setPendingCropFile(file)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bild konnte nicht verwendet werden.'
      toast.error(message)
      event.target.value = ''
      setImageFile(null)
      setPendingCropFile(null)
      setImagePreviewUrl(removeCurrentImage ? null : (news.image_url || null))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    try {
      const docRef = doc(db, 'news', news.id)
      const updates: Record<string, unknown> = {
        title: trimmedTitle,
        content: trimmedContent,
        updated_at: new Date().toISOString(),
      }

      if (removeCurrentImage && news.image_path) {
        await deleteNewsImageByPath(news.image_path)
        updates.image_url = null
        updates.image_path = null
        updates.image_size_bytes = null
        updates.image_mime_type = null
      }

      if (imageFile && user) {
        const uploadedImage = await uploadNewsImage(user.uid, imageFile)

        if (news.image_path) {
          await deleteNewsImageByPath(news.image_path)
        }

        updates.image_url = uploadedImage.url
        updates.image_path = uploadedImage.path
        updates.image_size_bytes = uploadedImage.size
        updates.image_mime_type = uploadedImage.mimeType
      }

      await updateDoc(docRef, updates)

      if (user) {
        await logAction('NEWS_EDITED', user.uid, null, {
          news_id: news.id,
          title: trimmedTitle,
          removed_image: removeCurrentImage,
          replaced_image: !!imageFile,
        })
      }

      toast.success('News-Beitrag aktualisiert.')
      setOpen(false)
    } catch (error) {
      console.error('Error updating news:', error)
      toast.error(getNewsUploadErrorMessage(error))
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>News-Beitrag bearbeiten</DialogTitle>
          <DialogDescription>
            Passe die Überschrift oder den Inhalt an.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Überschrift</Label>
              <Input 
                id="edit-title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Inhalt</Label>
              <Textarea 
                id="edit-content" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                required 
              />
              <p className="text-xs text-muted-foreground">Markdown wird unterstützt, z.B. `**fett**`, `_kursiv_` oder `- Listenpunkte`.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Titelbild</Label>
              <Input key={imageInputKey} id="edit-image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
              <label
                htmlFor="edit-image"
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
                    if (imagePreviewUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(imagePreviewUrl)
                    }
                    setPendingCropFile(null)
                    setRemoveCurrentImage(false)
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
              {(news.image_url || imagePreviewUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRemoveCurrentImage(true)
                    setImageFile(null)
                    setImagePreviewUrl(null)
                  }}
                >
                  Bild entfernen
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !!pendingCropFile}>
              {loading ? 'Speichern...' : 'Aktualisieren'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
