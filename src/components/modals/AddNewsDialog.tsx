'use client'

import { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, ImagePlus, Eye, PenLine, HelpCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getNewsUploadErrorMessage, uploadNewsImage, validateNewsImageFile } from '@/lib/newsImageUpload'
import { NewsImageCropper } from '@/components/modals/NewsImageCropper'
import { logAction } from '@/lib/logging'
import { NewsMarkdownPreview } from '@/components/news/NewsMarkdownPreview'
import { MarkdownGuide } from '@/components/news/MarkdownGuide'

interface AddNewsDialogProps {
  initialTitle?: string
  initialContent?: string
  initialIsAiGenerated?: boolean
  forceOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddNewsDialog({ 
  initialTitle = '', 
  initialContent = '', 
  initialIsAiGenerated = false,
  forceOpen,
  onOpenChange 
}: AddNewsDialogProps = {}) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isSmallUpdate, setIsSmallUpdate] = useState(false)
  const [isAiGenerated, setIsAiGenerated] = useState(initialIsAiGenerated)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = forceOpen !== undefined ? forceOpen : internalOpen
  const { user, profile } = useAuth()

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle)
    if (initialContent) setContent(initialContent)
    if (initialIsAiGenerated !== undefined) setIsAiGenerated(initialIsAiGenerated)
  }, [initialTitle, initialContent, initialIsAiGenerated])

  const resetForm = () => {
    setTitle(initialTitle)
    setContent(initialContent)
    setIsSmallUpdate(false)
    setIsAiGenerated(initialIsAiGenerated)
    setImageFile(null)
    setPendingCropFile(null)
    setImageInputKey((prev) => prev + 1)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (isImagePickerOpen || !!pendingCropFile)) {
      return
    }

    if (onOpenChange) {
      onOpenChange(nextOpen)
    } else {
      setInternalOpen(nextOpen)
    }

    if (!nextOpen) {
      resetForm()
    }
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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsImagePickerOpen(false)
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
          is_ai_generated: isAiGenerated,
          created_by: user.uid,
          author_name: profile?.full_name || user.displayName || 'Unbekannt',
          view_count: 0,
          created_at: serverTimestamp(),
          ...imagePayload,
        })

        await logAction('NEWS_CREATED', user.uid, profile?.full_name, {
          title: trimmedTitle,
          has_image: !!imagePayload.image_url,
          is_ai_generated: isAiGenerated,
        })

        resetForm()
        handleOpenChange(false)
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
      <DialogContent className="w-[95vw] sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl sm:rounded-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="p-4 sm:p-6 pb-2">
            <DialogTitle className="text-xl sm:text-2xl">Neues Update verfassen</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Informiere den Jahrgang über Neuigkeiten.
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
                    id="isSmallUpdate" 
                    checked={isSmallUpdate}
                    onCheckedChange={(checked) => setIsSmallUpdate(!!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="isSmallUpdate"
                      className="text-xs sm:text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Kleines Update (Quick-News)
                    </Label>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                      Keine eigene Detailseite, voller Text wird in der Liste angezeigt.
                    </p>
                  </div>
                </div>

                {isAiGenerated && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium">
                      Dieser Beitrag wurde KI-unterstützt erstellt und wird entsprechend markiert.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Überschrift</Label>
                  <Input 
                    id="title" 
                    placeholder="z.B. Location gefunden!" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={140}
                    required 
                    className="text-sm sm:text-base font-semibold h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Inhalt (Markdown)</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Beschreibe kurz was es Neues gibt..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    required 
                    className="resize-none font-mono text-xs sm:text-sm leading-relaxed"
                  />
                </div>
                <div className="space-y-2 pb-2">
                  <Label htmlFor="image" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Titelbild (optional)</Label>
                  <Input
                    key={imageInputKey}
                    id="image"
                    type="file"
                    accept="image/*"
                    onClick={handleImageInputClick}
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="image"
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
                    <div className="aspect-video rounded-lg border overflow-hidden bg-muted/20 relative group">
                      <img src={imagePreviewUrl} alt="Vorschau Titelbild" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Label htmlFor="image" className="cursor-pointer text-white text-[10px] sm:text-xs font-bold">Bild ändern</Label>
                      </div>
                    </div>
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
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading} className="text-xs sm:text-sm px-3 sm:px-4">
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !!pendingCropFile} className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm px-3 sm:px-4">
              {loading ? 'Sende...' : 'Veröffentlichen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
