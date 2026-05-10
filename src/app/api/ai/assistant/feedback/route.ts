import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin-server'
import { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

async function verifyUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  try {
    const idToken = authHeader.slice(7).trim()
    const decoded = await adminAuth().verifyIdToken(idToken)
    return decoded.uid
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  const uid = await verifyUser(request.headers.get('authorization'))
  if (!uid) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { messageId, sessionId, feedback, content, prompt, model } = body || {}

  if (!messageId || !feedback) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const db = adminDb()
    
    // 1. Save to a dedicated feedback collection for analysis
    await db.collection('ai_assistant_feedback').add({
      user_id: uid,
      session_id: sessionId || null,
      message_id: messageId,
      feedback,
      content: content || null, // The bot's answer
      prompt: prompt || null,   // The user's question
      model: model || null,
      created_at: Timestamp.now(),
    })

    // 2. Log as a system action
    const actionType = feedback === 'positive' ? 'ABI_BOT_FEEDBACK_POSITIVE' : 'ABI_BOT_FEEDBACK_NEGATIVE'
    
    await db.collection('logs').add({
      action: actionType,
      user_id: uid,
      details: {
        message_id: messageId,
        session_id: sessionId,
        model,
      },
      timestamp: Timestamp.now(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to save AI feedback:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
