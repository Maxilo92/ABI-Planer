'use client'

import { useState, useEffect } from 'react'
import { FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface MediaAttachmentProps {
  file?: File | null
  url?: string | null
  type?: 'image' | 'doc' | null
  onRemove?: () => void
  isUploading?: boolean
  className?: string
}

export function MediaAttachment({ 
  file, 
  url, 
  type, 
  onRemove, 
  isUploading,
  className 
}: MediaAttachmentProps) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreview(null)
    }
  }, [file])

  const displayUrl = url || preview
  const displayType = type || (file?.type.startsWith('image/') ? 'image' : 'doc')

  if (!displayUrl && !file) return null

  return (
    <div className={cn("relative group max-w-sm", className)}>
      <div className={cn(
        "relative overflow-hidden transition-all",
        displayType === 'image'
          ? "aspect-video rounded-2xl bg-transparent"
          : "rounded-xl border bg-muted/50 p-3 flex items-center gap-3"
      )}>
        {isUploading && (
          <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {displayType === 'image' ? (
          displayUrl ? (
            <Image 
              src={displayUrl} 
              alt="Attachment" 
              width={1280}
              height={720}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, 384px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )
        ) : (
          <>
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">
                {file?.name || (url ? url.split('/').pop()?.split('?')[0] : 'Dokument')}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF/DOC'}
              </p>
            </div>
          </>
        )}

        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Overlay to open in new tab if it's a saved URL */}
      {url && !onRemove && (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 cursor-pointer"
          title="In neuem Tab öffnen"
        />
      )}
    </div>
  )
}
