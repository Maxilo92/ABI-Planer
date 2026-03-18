'use client'

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export const NEWS_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const NEWS_IMAGE_MAX_DIMENSION = 1920
const NEWS_IMAGE_DEFAULT_QUALITY = 0.82

export interface NewsCropArea {
  x: number
  y: number
  width: number
  height: number
}

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/-+/g, '-')
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(objectUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Bild konnte nicht gelesen werden.'))
    }

    img.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Bild konnte nicht verarbeitet werden.'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

export async function prepareNewsImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Nur Bilddateien sind erlaubt.')
  }

  if (file.size > NEWS_IMAGE_MAX_BYTES) {
    throw new Error('Bild ist zu groß. Maximal erlaubt: 5 MB.')
  }

  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, NEWS_IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Bildverarbeitung nicht verfügbar.')
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  let quality = NEWS_IMAGE_DEFAULT_QUALITY
  let outputBlob = await canvasToBlob(canvas, quality)

  while (outputBlob.size > NEWS_IMAGE_MAX_BYTES && quality > 0.45) {
    quality -= 0.08
    outputBlob = await canvasToBlob(canvas, quality)
  }

  if (outputBlob.size > NEWS_IMAGE_MAX_BYTES) {
    throw new Error('Bild konnte nicht ausreichend komprimiert werden. Bitte kleineres Bild wählen.')
  }

  const fileBase = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'news-image'
  return new File([outputBlob], `${fileBase}.webp`, { type: 'image/webp' })
}

export async function cropNewsImage(file: File, cropArea: NewsCropArea): Promise<File> {
  const bitmap = await createImageBitmap(file)

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(cropArea.width))
  canvas.height = Math.max(1, Math.round(cropArea.height))

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Bildverarbeitung nicht verfügbar.')
  }

  ctx.drawImage(
    bitmap,
    Math.max(0, Math.round(cropArea.x)),
    Math.max(0, Math.round(cropArea.y)),
    Math.max(1, Math.round(cropArea.width)),
    Math.max(1, Math.round(cropArea.height)),
    0,
    0,
    canvas.width,
    canvas.height,
  )

  bitmap.close()

  const blob = await canvasToBlob(canvas, 0.92)
  const fileBase = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'news-image'
  return new File([blob], `${fileBase}-crop.webp`, { type: 'image/webp' })
}

export async function validateNewsImageFile(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Nur Bilddateien sind erlaubt.')
  }

  if (file.size > NEWS_IMAGE_MAX_BYTES) {
    throw new Error('Bild ist zu groß. Maximal erlaubt: 5 MB.')
  }

  const { width, height } = await readImageDimensions(file)
  if (width < 320 || height < 240) {
    throw new Error('Bild ist zu klein. Mindestgröße: 320x240 Pixel.')
  }
}

export async function uploadNewsImage(userId: string, file: File): Promise<{ url: string; path: string; size: number; mimeType: string }> {
  const safeName = sanitizeFileName(file.name)
  const filePath = `news-images/${userId}/${Date.now()}-${safeName}`
  const storageRef = ref(storage, filePath)

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=31536000,immutable',
  })

  const url = await getDownloadURL(snapshot.ref)

  return {
    url,
    path: snapshot.ref.fullPath,
    size: file.size,
    mimeType: file.type,
  }
}

export async function deleteNewsImageByPath(imagePath?: string | null): Promise<void> {
  if (!imagePath) return
  try {
    await deleteObject(ref(storage, imagePath))
  } catch {
    // Intentionally ignore failures for already removed files.
  }
}
