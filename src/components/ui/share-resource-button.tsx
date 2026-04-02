'use client'

import { useMemo } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ShareResourceButtonProps {
  resourcePath: string
  title?: string
  text?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
}

function toAbsoluteUrl(resourcePath: string) {
  if (typeof window === 'undefined') return resourcePath
  return resourcePath.startsWith('http')
    ? resourcePath
    : new URL(resourcePath, window.location.origin).toString()
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function ShareResourceButton({
  resourcePath,
  title,
  text,
  className,
  variant = 'ghost',
  size = 'icon-sm',
}: ShareResourceButtonProps) {
  const shareUrl = useMemo(() => toAbsoluteUrl(resourcePath), [resourcePath])

  const handleShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        })
        toast.success('Link erfolgreich geteilt.')
        return
      }

      await copyTextToClipboard(shareUrl)
      toast.success('Link in die Zwischenablage kopiert.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      console.error('Error sharing resource:', error)
      toast.error('Link konnte nicht geteilt werden.')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleShare}
      title="Teilen"
      aria-label="Link teilen"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  )
}