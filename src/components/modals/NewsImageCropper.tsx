'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { cropNewsImage, type NewsCropArea } from '@/lib/newsImageUpload'

interface NewsImageCropperProps {
  file: File
  onCancel: () => void
  onConfirm: (croppedFile: File) => void
  aspect?: number
  title?: string
}

export function NewsImageCropper({ file, onCancel, onConfirm, aspect = 16 / 9, title = 'Bild zuschneiden (16:9)' }: NewsImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropping, setCropping] = useState(false)
  const [cropAreaPixels, setCropAreaPixels] = useState<NewsCropArea | null>(null)
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsValue: Area) => {
    setCropAreaPixels({
      x: croppedAreaPixelsValue.x,
      y: croppedAreaPixelsValue.y,
      width: croppedAreaPixelsValue.width,
      height: croppedAreaPixelsValue.height,
    })
  }, [])

  const handleConfirm = async () => {
    if (!cropAreaPixels || cropping) return

    setCropping(true)
    try {
      const croppedFile = await cropNewsImage(file, cropAreaPixels)
      onConfirm(croppedFile)
    } finally {
      setCropping(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="relative h-56 w-full overflow-hidden rounded-md bg-black/80">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="news-crop-zoom" className="text-xs text-muted-foreground">Zoom</label>
        <input
          id="news-crop-zoom"
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={cropping}>
          Abbrechen
        </Button>
        <Button type="button" size="sm" onClick={handleConfirm} disabled={!cropAreaPixels || cropping}>
          {cropping ? 'Zuschneiden...' : 'Ausschnitt übernehmen'}
        </Button>
      </div>
    </div>
  )
}
