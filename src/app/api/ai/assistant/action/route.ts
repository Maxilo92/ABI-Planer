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
