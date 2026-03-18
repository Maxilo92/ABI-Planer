'use client'

import { deleteObject, getDownloadURL, getStorage, ref, type FirebaseStorage, uploadBytes } from 'firebase/storage'
import { app, storage } from '@/lib/firebase'

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

function normalizeBucketName(bucket?: string): string | null {
  if (!bucket) return null
  return bucket.replace(/^gs:\/\//, '').trim() || null
}

function getStorageFallbacks(): FirebaseStorage[] {
  if (!app) return []

  const configuredBucket = normalizeBucketName(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return []

  const candidates = new Set<string>()
  if (configuredBucket?.endsWith('.appspot.com')) {
    candidates.add(`${projectId}.firebasestorage.app`)
  }
  if (configuredBucket?.endsWith('.firebasestorage.app')) {
    candidates.add(`${projectId}.appspot.com`)
  }
  if (!configuredBucket) {
    candidates.add(`${projectId}.firebasestorage.app`)
    candidates.add(`${projectId}.appspot.com`)
  }

  return Array.from(candidates)
    .filter((candidate) => candidate !== configuredBucket)
    .map((candidate) => getStorage(app!, `gs://${candidate}`))
}

async function uploadNewsImageToStorage(
  targetStorage: FirebaseStorage,
  userId: string,
  file: File,
): Promise<{ url: string; path: string; size: number; mimeType: string }> {
  const safeName = sanitizeFileName(file.name)
  const filePath = `news-images/${userId}/${Date.now()}-${safeName}`
  const storageRef = ref(targetStorage, filePath)

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

async function optimizeCanvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  let quality = NEWS_IMAGE_DEFAULT_QUALITY
  let outputBlob = await canvasToBlob(canvas, quality)

  while (outputBlob.size > NEWS_IMAGE_MAX_BYTES && quality > 0.45) {
    quality -= 0.08
    outputBlob = await canvasToBlob(canvas, quality)
  }

  if (outputBlob.size > NEWS_IMAGE_MAX_BYTES) {
    throw new Error('Bild konnte nicht ausreichend komprimiert werden. Bitte kleineres Bild wählen.')
  }

  return outputBlob
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

  const outputBlob = await optimizeCanvasToWebp(canvas)

  const fileBase = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'news-image'
  return new File([outputBlob], `${fileBase}.webp`, { type: 'image/webp' })
}

export async function cropNewsImage(file: File, cropArea: NewsCropArea): Promise<File> {
  const bitmap = await createImageBitmap(file)

  const cropWidth = Math.max(1, Math.round(cropArea.width))
  const cropHeight = Math.max(1, Math.round(cropArea.height))
  const scale = Math.min(1, NEWS_IMAGE_MAX_DIMENSION / Math.max(cropWidth, cropHeight))

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(cropWidth * scale))
  canvas.height = Math.max(1, Math.round(cropHeight * scale))

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Bildverarbeitung nicht verfügbar.')
  }

  ctx.drawImage(
    bitmap,
    Math.max(0, Math.round(cropArea.x)),
    Math.max(0, Math.round(cropArea.y)),
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  bitmap.close()

  const blob = await optimizeCanvasToWebp(canvas)
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
  try {
    return await uploadNewsImageToStorage(storage, userId, file)
  } catch (primaryError) {
    const fallbacks = getStorageFallbacks()
    for (const fallbackStorage of fallbacks) {
      try {
        return await uploadNewsImageToStorage(fallbackStorage, userId, file)
      } catch {
        // Try the next fallback bucket.
      }
    }
    throw primaryError
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
