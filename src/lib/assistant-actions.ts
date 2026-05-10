export type AssistantActionType = 'create_todo' | 'create_event' | 'create_subtodo'

export type AssistantActionMode = 'none' | 'draft_only' | 'confirmable'

export interface AssistantActionProposal {
  type: AssistantActionType
  title: string
  description?: string | null
  assigned_to_user_name?: string | null
  assigned_to_class?: string | null
  assigned_to_group?: string | null
  deadline_date?: string | null
  parentId?: string | null
  parentTitle?: string | null
  start_date?: string | null
  end_date?: string | null
  location?: string | null
  mentioned_user_names?: string[]
  mentioned_roles?: string[]
  mentioned_groups?: string[]
}

export interface AssistantResponsePayload {
  answer: string
  action: AssistantActionProposal | null
  actionMode: AssistantActionMode
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    )
  )
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  } catch {
    return value
  }
}

function extractAnswerFromJsonLikeContent(content: string): string | null {
  const answerMatch = content.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (!answerMatch?.[1]) return null

  const decoded = decodeJsonString(answerMatch[1])
  const normalized = normalizeString(decoded)
  return normalized
}

function extractAnswerFromPlainTextContent(content: string): string | null {
  const answerMatch = content.match(/(?:^|\n)\s*answer\s*:\s*(.+?)\s*$/im)
  if (!answerMatch?.[1]) return null

  return normalizeString(answerMatch[1])
}

export function sanitizeAssistantAction(value: unknown): AssistantActionProposal | null {
  if (!value || typeof value !== 'object') return null

  const action = value as Record<string, unknown>
  const type = action.type
  if (type !== 'create_todo' && type !== 'create_event' && type !== 'create_subtodo') {
    return null
  }

  const title = normalizeString(action.title)
  if (!title) return null

  const sanitized: AssistantActionProposal = {
    type,
    title,
    description: normalizeString(action.description),
    assigned_to_user_name: normalizeString(action.assigned_to_user_name),
    assigned_to_class: normalizeString(action.assigned_to_class),
    assigned_to_group: normalizeString(action.assigned_to_group),
    deadline_date: normalizeString(action.deadline_date),
    parentId: normalizeString(action.parentId),
    parentTitle: normalizeString(action.parentTitle),
    start_date: normalizeString(action.start_date),
    end_date: normalizeString(action.end_date),
    location: normalizeString(action.location),
    mentioned_user_names: normalizeStringArray(action.mentioned_user_names),
    mentioned_roles: normalizeStringArray(action.mentioned_roles),
    mentioned_groups: normalizeStringArray(action.mentioned_groups),
  }

  return sanitized
}

export function parseAssistantResponseContent(content: string): AssistantResponsePayload | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fencedMatch?.[1]?.trim() || trimmed

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>
    const answer = normalizeString(parsed.answer) || trimmed
    const action = sanitizeAssistantAction(parsed.action)
    const actionMode = parsed.actionMode === 'draft_only' || parsed.actionMode === 'confirmable'
      ? parsed.actionMode
      : action
        ? 'confirmable'
        : 'none'

    return { answer, action, actionMode }
  } catch {
    const extractedAnswer = extractAnswerFromJsonLikeContent(candidate) || extractAnswerFromJsonLikeContent(trimmed)
      || extractAnswerFromPlainTextContent(candidate)
      || extractAnswerFromPlainTextContent(trimmed)

    if (!extractedAnswer) return null

    return {
      answer: extractedAnswer,
      action: null,
      actionMode: 'none',
    }
  }
}

export function getAssistantActionLabel(action: AssistantActionProposal): string {
  switch (action.type) {
    case 'create_event':
      return 'Termin'
    case 'create_subtodo':
      return 'Unteraufgabe'
    default:
      return 'Aufgabe'
  }
}

export function getAssistantActionSummary(action: AssistantActionProposal): string[] {
  const summary: string[] = [action.title]

  if (action.type !== 'create_event') {
    if (action.assigned_to_group) summary.push(`Gruppe: ${action.assigned_to_group}`)
    if (action.assigned_to_class) summary.push(`Kurs: ${action.assigned_to_class}`)
    if (action.assigned_to_user_name) summary.push(`Person: ${action.assigned_to_user_name}`)
    if (action.deadline_date) summary.push(`Deadline: ${action.deadline_date}`)
    if (action.parentTitle) summary.push(`Übergeordnet: ${action.parentTitle}`)
    if (action.parentId) summary.push(`Parent-ID: ${action.parentId}`)
  } else {
    if (action.start_date) summary.push(`Start: ${action.start_date}`)
    if (action.end_date) summary.push(`Ende: ${action.end_date}`)
    if (action.location) summary.push(`Ort: ${action.location}`)
    if (action.assigned_to_group) summary.push(`Gruppe: ${action.assigned_to_group}`)
  }

  return summary
}
