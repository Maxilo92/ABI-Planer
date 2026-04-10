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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil, ImagePlus, Eye, PenLine, HelpCircle } from 'lucide-react'
import { NewsEntry } from '@/types/database'
import { toast } from 'sonner'
import { deleteNewsImageByPath, getNewsUploadErrorMessage, uploadNewsImage, validateNewsImageFile } from '@/lib/newsImageUpload'
import { useAuth } from '@/context/AuthContext'
import { NewsImageCropper } from '@/components/modals/NewsImageCropper'
import { logAction } from '@/lib/logging'
import { NewsMarkdownPreview } from '@/components/news/NewsMarkdownPreview'
import { MarkdownGuide } from '@/components/news/MarkdownGuide'

interface EditNewsDialogProps {
  news: NewsEntry
}

export function EditNewsDialog({ news }: EditNewsDialogProps) {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState(news.title)
  const [content, setContent] = useState(news.content)
  const [isSmallUpdate, setIsSmallUpdate] = useState(news.is_small_update || false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(news.image_url || null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (isImagePickerOpen || !!pendingCropFile)) {
      return
    }

    setOpen(nextOpen)
  }

  const handleImageInputClick = () => {
    setIsImagePickerOpen(true)

    // File pickers can close without firing onChange (e.g. cancel).
    // Reset the guard once browser focus returns.
    window.addEventListener(
      'focus',
      () => {
        setIsImagePickerOpen(false)
      },
      { once: true },
    )
  }

  useEffect(() => {
    if (open) {
      setTitle(news.title)
      setContent(news.content)
      setIsSmallUpdate(news.is_small_update || false)
      setImageFile(null)
      setPendingCropFile(null)
      setImageInputKey((prev) => prev + 1)
      setImagePreviewUrl(news.image_url || null)
      setRemoveCurrentImage(false)
    }
  }, [open, news.id])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsImagePickerOpen(false)
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
        is_small_update: isSmallUpdate,
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
        await logAction('NEWS_EDITED', user.uid, profile?.full_name, {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="w-[95vw] sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl sm:rounded-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="p-4 sm:p-6 pb-2">
            <DialogTitle className="text-xl sm:text-2xl">News-Beitrag bearbeiten</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Passe die Überschrift oder den Inhalt an.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 sm:px-6 border-b">
              <TabsList className="w-fit h-9 bg-muted/50 p-1 mb-2">
                <TabsTrigger value="edit" className="gap-2 text-[11px] sm:text-xs py-1 sm:py-1.5 px-3">
                  <PenLine className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2 text-[11px] sm:text-xs py-1 sm:py-1.5 px-3">
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Vorschau
                </TabsTrigger>
                <TabsTrigger value="help" className="gap-2 text-[11px] sm:text-xs py-1 sm:py-1.5 px-3">
                  <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Hilfe
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-muted-foreground/20">
              <TabsContent value="edit" className="mt-0 space-y-4 outline-none">
                <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <Checkbox 
                    id="edit-isSmallUpdate" 
                    checked={isSmallUpdate}
                    onCheckedChange={(checked) => setIsSmallUpdate(!!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="edit-isSmallUpdate"
                      className="text-xs sm:text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Kleines Update (Quick-News)
                    </Label>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                      Keine eigene Detailseite, voller Text wird in der Liste angezeigt.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Überschrift</Label>
                  <Input 
                    id="edit-title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={140}
                    required 
                    className="text-sm sm:text-base font-semibold h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-content" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Inhalt (Markdown)</Label>
                  <Textarea 
                    id="edit-content" 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    required 
                    className="resize-none font-mono text-xs sm:text-sm leading-relaxed"
                  />
                </div>
                <div className="space-y-2 pb-2">
                  <Label htmlFor="edit-image" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Titelbild</Label>
                  <Input
                    key={imageInputKey}
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onClick={handleImageInputClick}
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="edit-image"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-[11px] sm:text-sm font-medium text-foreground transition-colors hover:bg-primary/10"
                  >
                    <ImagePlus className="h-4 w-4 text-primary" /> Bild auswählen und zuschneiden
                  </label>
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
                    <div className="aspect-video rounded-lg border overflow-hidden bg-muted/20 relative group">
                      <img src={imagePreviewUrl} alt="Vorschau Titelbild" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Label htmlFor="edit-image" className="cursor-pointer text-white text-[10px] sm:text-xs font-bold">Bild ändern</Label>
                      </div>
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
                      className="w-full text-xs sm:text-sm"
                    >
                      Bild entfernen
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-0 outline-none pb-4">
                <NewsMarkdownPreview 
                  content={content} 
                  title={title} 
                  imageUrl={imagePreviewUrl || undefined} 
                />
              </TabsContent>

              <TabsContent value="help" className="mt-0 outline-none pb-4">
                <MarkdownGuide />
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="p-4 sm:p-6 pt-2 border-t bg-muted/20 flex flex-row justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-xs sm:text-sm px-3 sm:px-4">
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !!pendingCropFile} className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm px-3 sm:px-4">
              {loading ? 'Sende...' : 'Aktualisieren'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
