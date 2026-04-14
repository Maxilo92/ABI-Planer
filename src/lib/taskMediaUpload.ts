'use client'

import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export const TASK_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const TASK_PROOF_MAX_BYTES = 30 * 1024 * 1024 // 30MB for videos
const IMAGE_MAX_DIMENSION = 1920
const IMAGE_DEFAULT_QUALITY = 0.82

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/-+/g, '-')
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
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

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
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

  let quality = IMAGE_DEFAULT_QUALITY
  let outputBlob = await canvasToBlob(canvas, quality)

  while (outputBlob.size > TASK_IMAGE_MAX_BYTES && quality > 0.4) {
    quality -= 0.1
    outputBlob = await canvasToBlob(canvas, quality)
  }

  const fileBase = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'image'
  return new File([outputBlob], `${fileBase}.webp`, { type: 'image/webp' })
}

export async function uploadTaskImage(taskId: string, file: File): Promise<{ url: string; path: string }> {
  const compressed = await compressImage(file)
  const safeName = sanitizeFileName(compressed.name)
  const filePath = `task-images/${taskId}/${Date.now()}-${safeName}`
  const storageRef = ref(storage, filePath)

  const snapshot = await uploadBytes(storageRef, compressed, {
    contentType: compressed.type,
  })

  const url = await getDownloadURL(snapshot.ref)
  return { url, path: snapshot.ref.fullPath }
}

export async function uploadTaskProof(taskId: string, userId: string, file: File): Promise<{ url: string; path: string; type: 'image' | 'video' }> {
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')

  if (!isImage && !isVideo) {
    throw new Error('Nur Bilder oder Videos sind als Beweis erlaubt.')
  }

  let finalFile = file
  if (isImage) {
    finalFile = await compressImage(file)
  } else if (file.size > TASK_PROOF_MAX_BYTES) {
    throw new Error('Video ist zu groß. Maximal erlaubt: 30 MB.')
  }

  const safeName = sanitizeFileName(finalFile.name)
  const filePath = `task-proofs/${taskId}/${userId}-${Date.now()}-${safeName}`
  const storageRef = ref(storage, filePath)

  const snapshot = await uploadBytes(storageRef, finalFile, {
    contentType: finalFile.type,
  })

  const url = await getDownloadURL(snapshot.ref)
  return { 
    url, 
    path: snapshot.ref.fullPath, 
    type: isImage ? 'image' : 'video' 
  }
}

export async function deleteTaskFile(path: string) {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}
