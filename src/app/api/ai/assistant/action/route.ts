import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin-server'
import {
  AssistantActionProposal,
  getAssistantActionLabel,
  getAssistantActionSummary,
  sanitizeAssistantAction,
} from '@/lib/assistant-actions'

export const runtime = 'nodejs'

type AuthResult =
  | { ok: true; uid: string; profile: Record<string, unknown> }
  | { ok: false; status: number; error: string; details?: string }

function isPlannerRole(role: unknown) {
  return ['planner', 'admin', 'admin_main', 'admin_co'].includes(String(role || 'viewer'))
}

async function verifyApprovedUser(authHeader: string | null): Promise<AuthResult> {
  const isBypass = process.env.MAESTRO_DEV_BYPASS === 'true'

  if (isBypass) {
    return {
      ok: true,
      uid: 'dev-user',
      profile: {
        is_approved: true,
        role: 'admin',
        full_name: 'Dev User',
      },
    }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing bearer token' }
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    return { ok: false, status: 401, error: 'Missing bearer token' }
  }

  try {
    const auth = adminAuth()
    const db = adminDb()
    const decoded = await auth.verifyIdToken(idToken)
    const profileSnap = await db.collection('profiles').doc(decoded.uid).get()

    if (!profileSnap.exists) {
      return { ok: false, status: 404, error: 'Profile not found' }
    }

    const profile = (profileSnap.data() || {}) as Record<string, unknown>
    if (!profile.is_approved) {
      return { ok: false, status: 403, error: 'Profile not approved' }
    }

    return { ok: true, uid: decoded.uid, profile }
  } catch (error: unknown) {
    return { ok: false, status: 401, error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

function sanitizeDetails(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeDetails(entry))
  }

  if (!value || typeof value !== 'object') {
    return value === undefined ? null : value
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, entry]) => {
    if (entry !== undefined) {
      acc[key] = sanitizeDetails(entry)
    }
    return acc
  }, {})
}

async function logAssistantAction(uid: string, userName: string | null, action: string, details: Record<string, unknown>) {
  const db = adminDb()
  await db.collection('logs').add({
    action,
    user_id: uid,
    user_name: userName,
    details: sanitizeDetails(details),
    timestamp: FieldValue.serverTimestamp(),
  })
}

async function resolveUniqueProfileByName(fullName: string) {
  const db = adminDb()
  const snapshot = await db.collection('profiles').where('full_name', '==', fullName).get()
  if (snapshot.size !== 1) {
    return null
  }

  const doc = snapshot.docs[0]
  const data = doc.data() as Record<string, unknown>
  return {
    id: doc.id,
    fullName: typeof data.full_name === 'string' ? data.full_name : fullName,
  }
}

async function resolveParentTodoId(action: AssistantActionProposal) {
  if (action.parentId) {
    return action.parentId
  }

  if (!action.parentTitle) {
    return null
  }

  const db = adminDb()
  const snapshot = await db.collection('todos').where('title', '==', action.parentTitle).get()
  if (snapshot.size !== 1) {
    return null
  }

  return snapshot.docs[0].id
}

export async function POST(request: NextRequest) {
  const authResult = await verifyApprovedUser(request.headers.get('authorization'))

  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error, details: authResult.details }, { status: authResult.status })
  }

  const body = await request.json().catch(() => null)
  const action = sanitizeAssistantAction(body?.action)

  if (!action) {
    return NextResponse.json({ ok: false, error: 'action payload is required' }, { status: 400 })
  }

  const canPersist = isPlannerRole(authResult.profile.role)
  const userName = typeof authResult.profile.full_name === 'string' ? authResult.profile.full_name : null

  if (!canPersist) {
    return NextResponse.json({
      ok: true,
      saved: false,
      draft: true,
      action,
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: 'Nur Planner/Admin können Assistenten-Aktionen direkt speichern. Der Entwurf bleibt im Chat.',
    })
  }

  const db = adminDb()

  if (action.type === 'create_event') {
    const startDate = action.start_date ? new Date(action.start_date) : null
    const endDate = action.end_date ? new Date(action.end_date) : null

    if (!startDate || Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ ok: false, error: 'start_date is required for events' }, { status: 400 })
    }

    const effectiveEndDate = endDate && !Number.isNaN(endDate.getTime()) ? endDate : startDate
    const mentionedUserIds: string[] = []

    for (const userNameCandidate of action.mentioned_user_names || []) {
      const resolved = await resolveUniqueProfileByName(userNameCandidate)
      if (resolved) {
        mentionedUserIds.push(resolved.id)
      }
    }

    const normalizedMentionedUserIds = Array.from(new Set(mentionedUserIds))
    const normalizedMentionedGroups = Array.from(new Set(action.mentioned_groups || []))
    const normalizedMentionedRoles = Array.from(new Set(action.mentioned_roles || []))
    const assignedGroup = action.assigned_to_group || null

    const eventData = {
      title: action.title.trim(),
      description: action.description || '',
      location: action.location || '',
      start_date: startDate.toISOString(),
      end_date: effectiveEndDate.toISOString(),
      created_at: new Date().toISOString(),
      created_by: userName || 'Unbekannt',
      created_by_name: userName || 'Unbekannt',
      assigned_to_group: assignedGroup,
      mentioned_user_ids: normalizedMentionedUserIds,
      mentioned_roles: normalizedMentionedRoles,
      mentioned_groups: Array.from(new Set([...normalizedMentionedGroups, ...(assignedGroup ? [assignedGroup] : [])])),
    }

    const docRef = await db.collection('events').add(eventData)

    await logAssistantAction(authResult.uid, userName, 'EVENT_CREATED', {
      source: 'ai_assistant',
      event_id: docRef.id,
      title: action.title.trim(),
      location: action.location || '',
      start_date: startDate.toISOString(),
      end_date: effectiveEndDate.toISOString(),
      assigned_to_group: assignedGroup,
      mentions_users_count: normalizedMentionedUserIds.length,
      mentions_roles_count: normalizedMentionedRoles.length,
      mentions_groups_count: normalizedMentionedGroups.length,
    })

    return NextResponse.json({
      ok: true,
      saved: true,
      type: 'event',
      id: docRef.id,
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: 'Termin wurde erstellt.',
    })
  }

  if (action.type === 'create_poll') {
    const pollData = {
      question: action.title.trim(),
      is_active: true,
      allow_vote_change: true,
      multiple_choice: false,
      max_votes: 1,
      target_groups: action.assigned_to_group ? [action.assigned_to_group] : [],
      created_at: new Date().toISOString(),
      created_by: userName || 'Unbekannt',
      created_by_name: userName || 'Unbekannt',
      deadline_date: action.deadline_date || null,
    }

    const docRef = await db.collection('polls').add(pollData)
    
    if (action.poll_options && action.poll_options.length > 0) {
      const optionsCollection = db.collection('polls').doc(docRef.id).collection('options')
      for (const optionText of action.poll_options) {
        await optionsCollection.add({
          poll_id: docRef.id,
          option_text: optionText,
          created_by: userName || 'Unbekannt',
          is_custom: false
        })
      }
    }

    await logAssistantAction(authResult.uid, userName, 'POLL_CREATED', {
      source: 'ai_assistant',
      poll_id: docRef.id,
      question: action.title.trim(),
      target_groups: pollData.target_groups,
      options_count: action.poll_options?.length || 0
    })

    return NextResponse.json({
      ok: true,
      saved: true,
      type: 'poll',
      id: docRef.id,
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: 'Abstimmung wurde erstellt.',
    })
  }

  if (action.type === 'create_news') {
    const newsData = {
      title: action.title.trim(),
      content: action.description || '',
      created_at: new Date().toISOString(),
      created_by: userName || 'Unbekannt',
      author_name: userName || 'Unbekannt',
      target_group: action.assigned_to_group || null,
      is_ai_generated: true
    }

    const docRef = await db.collection('news').add(newsData)

    await logAssistantAction(authResult.uid, userName, 'NEWS_CREATED', {
      source: 'ai_assistant',
      news_id: docRef.id,
      title: action.title.trim()
    })

    return NextResponse.json({
      ok: true,
      saved: true,
      type: 'news',
      id: docRef.id,
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: 'News-Eintrag wurde erstellt.',
    })
  }

  if (action.type === 'add_finance_transaction') {
    const amountVal = action.amount ? Math.abs(action.amount) : 0
    const finalAmount = action.transaction_type === 'expense' ? -amountVal : amountVal

    const financeData = {
      amount: finalAmount,
      description: action.title.trim(),
      entry_date: new Date().toISOString(),
      created_by: userName || 'Unbekannt',
      category: action.category || null,
      responsible_class: action.assigned_to_class || null
    }

    const docRef = await db.collection('finances').add(financeData)

    await logAssistantAction(authResult.uid, userName, 'FINANCE_TRANSACTION_CREATED', {
      source: 'ai_assistant',
      finance_id: docRef.id,
      amount: finalAmount,
      description: action.title.trim()
    })

    return NextResponse.json({
      ok: true,
      saved: true,
      type: 'finance',
      id: docRef.id,
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: 'Finanz-Eintrag wurde erstellt.',
    })
  }

  if (action.type === 'edit_finance_transaction') {
    if (!action.transaction_id) {
      return NextResponse.json({ ok: false, error: 'transaction_id is required for editing' }, { status: 400 })
    }

    const docRef = db.collection('finances').doc(action.transaction_id)
    const snap = await docRef.get()

    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'Transaction not found' }, { status: 404 })
    }

    const currentData = snap.data() || {}
    const updates: Record<string, any> = {}

    if (action.amount !== null && action.amount !== undefined) {
      const amountVal = Math.abs(action.amount)
      const type = action.transaction_type || (Number(currentData.amount) < 0 ? 'expense' : 'income')
      updates.amount = type === 'expense' ? -amountVal : amountVal
    } else if (action.transaction_type) {
      const amountVal = Math.abs(Number(currentData.amount) || 0)
      updates.amount = action.transaction_type === 'expense' ? -amountVal : amountVal
    }

    if (action.title) updates.description = action.title.trim()
    if (action.category !== undefined) updates.category = action.category
    if (action.assigned_to_class !== undefined) updates.responsible_class = action.assigned_to_class

    updates.updated_at = new Date().toISOString()
    updates.updated_by = userName || 'Unbekannt'

    await docRef.update(updates)

    await logAssistantAction(authResult.uid, userName, 'FINANCE_TRANSACTION_EDITED', {
      source: 'ai_assistant',
      finance_id: action.transaction_id,
      updates
    })

    return NextResponse.json({
      ok: true,
      saved: true,
      type: 'finance_edit',
      id: action.transaction_id,
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: 'Finanz-Eintrag wurde aktualisiert.',
    })
  }

  if (action.type === 'send_group_message') {
    const isHub = !action.group_name || action.group_name.toLowerCase() === 'hub'
    const msgData = {
      content: action.description || '',
      created_by: authResult.uid,
      author_name: userName || 'ABI Bot',
      group_name: isHub ? 'hub' : action.group_name,
      type: isHub ? 'hub' : 'internal',
      created_at: new Date().toISOString(),
      is_ai_generated: true
    }

    const docRef = await db.collection('group_messages').add(msgData)

    await logAssistantAction(authResult.uid, userName, 'GROUP_MESSAGE_SENT_BY_BOT', {
      source: 'ai_assistant',
      group_name: msgData.group_name,
      message_id: docRef.id
    })

    return NextResponse.json({
      ok: true,
      saved: true,
      type: 'group_message',
      id: docRef.id,
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: `Nachricht an ${isHub ? 'den Hub' : action.group_name} wurde gesendet.`,
    })
  }

  if (action.type === 'create_group') {
    const settingsRef = db.collection('settings').doc('config')
    const settingsDoc = await settingsRef.get()
    const currentGroups = settingsDoc.exists ? (settingsDoc.data()?.planning_groups || []) : []

    const newGroup = {
      name: action.group_name || action.title,
      leader_name: action.leader_name || userName || null,
      created_at: new Date().toISOString()
    }

    await settingsRef.update({
      planning_groups: FieldValue.arrayUnion(newGroup)
    })

    await logAssistantAction(authResult.uid, userName, 'PLANNING_GROUP_CREATED', {
      source: 'ai_assistant',
      group_name: newGroup.name
    })

    return NextResponse.json({
      ok: true,
      saved: true,
      type: 'group',
      actionLabel: getAssistantActionLabel(action),
      summary: getAssistantActionSummary(action),
      message: `Planungsgruppe "${newGroup.name}" wurde angelegt.`,
    })
  }

  const parentId = await resolveParentTodoId(action)
  if (action.type === 'create_subtodo' && !parentId) {
    return NextResponse.json({
      ok: false,
      error: 'parentId oder parentTitle muss für Unteraufgaben eindeutig auflösbar sein',
      details: 'Der Assistent braucht eine eindeutige Eltern-Aufgabe, bevor eine Unteraufgabe gespeichert werden kann.',
    }, { status: 400 })
  }

  const assignedUser = action.assigned_to_user_name ? await resolveUniqueProfileByName(action.assigned_to_user_name) : null
  const todoData = {
    title: action.title.trim(),
    description: action.description || null,
    parentId: parentId || null,
    created_by: userName || 'Unbekannt',
    created_by_name: userName || 'Unbekannt',
    status: 'open',
    created_at: new Date().toISOString(),
    assigned_to_user: assignedUser?.id || null,
    assigned_to_user_name: assignedUser?.fullName || action.assigned_to_user_name || null,
    assigned_to_class: action.assigned_to_class || null,
    assigned_to_group: action.assigned_to_group || null,
    deadline_date: action.deadline_date || null,
  }

  const docRef = await db.collection('todos').add(todoData)

  await logAssistantAction(authResult.uid, userName, parentId ? 'SUBTODO_CREATED' : 'TODO_CREATED', {
    source: 'ai_assistant',
    todo_id: docRef.id,
    title: action.title.trim(),
    parentId: parentId || null,
    assigned_to_user: todoData.assigned_to_user,
    assigned_to_user_name: todoData.assigned_to_user_name,
    assigned_to_class: todoData.assigned_to_class,
    assigned_to_group: todoData.assigned_to_group,
    deadline_date: todoData.deadline_date,
  })

  return NextResponse.json({
    ok: true,
    saved: true,
    type: parentId ? 'subtodo' : 'todo',
    id: docRef.id,
    actionLabel: getAssistantActionLabel(action),
    summary: getAssistantActionSummary(action),
    message: parentId ? 'Unteraufgabe wurde erstellt.' : 'Aufgabe wurde erstellt.',
  })
}
