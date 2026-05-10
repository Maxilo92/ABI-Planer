import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin-server'
import { generatePixelAvatar } from '@/lib/avatar'

export async function POST(req: Request) {
  try {
    const db = adminDb()
    const profilesRef = db.collection('profiles')
    const snapshot = await profilesRef.get()
    
    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No profiles found.', count: 0 })
    }
    
    let updatedCount = 0
    const batchSize = 100
    let batch = db.batch()
    let operationCount = 0

    for (const doc of snapshot.docs) {
      const avatarDataUrl = generatePixelAvatar()
      batch.update(doc.ref, { photo_url: avatarDataUrl })
      operationCount++
      updatedCount++

      if (operationCount >= batchSize) {
        await batch.commit()
        batch = db.batch()
        operationCount = 0
      }
    }

    if (operationCount > 0) {
      await batch.commit()
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Migration complete. Updated ${updatedCount} profiles with new pixel matrix avatars.`,
      count: updatedCount
    })
  } catch (error: any) {
    console.error('Avatar migration error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
