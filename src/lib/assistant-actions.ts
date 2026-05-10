export type AssistantActionType =
  | 'create_todo'
  | 'create_event'
  | 'create_subtodo'
  | 'create_poll'
  | 'create_news'
  | 'add_finance_transaction'
  | 'edit_finance_transaction'
  | 'send_group_message'
  | 'create_group'

export type AssistantActionMode = 'none' | 'draft_only' | 'confirmable'

export type BotQuestionType = 'multiple_choice' | 'text_input'

export interface BotQuestion {
  type: BotQuestionType
  prompt: string
  options?: string[]        // for multiple_choice
  placeholder?: string      // for text_input
  key?: string              // optional identifier so the bot can reference the answer
}

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
  poll_options?: string[]
  amount?: number | null
  transaction_type?: 'income' | 'expense' | null
  category?: string | null
  group_name?: string | null
  leader_name?: string | null
  transaction_id?: string | null
}

export interface AssistantResponsePayload {
  answer: string
  action: AssistantActionProposal | null
  actionMode: AssistantActionMode
  question: BotQuestion | null
  thought?: string | null
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
  const type = action.type as AssistantActionType
  
  const validTypes: AssistantActionType[] = [
    'create_todo', 'create_event', 'create_subtodo', 'create_poll', 
    'create_news', 'add_finance_transaction', 'edit_finance_transaction', 'send_group_message', 'create_group'
  ]

  if (!validTypes.includes(type)) {
    return null
  }

  const title = normalizeString(action.title) || 'Unbenannte Aktion'

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
    poll_options: normalizeStringArray(action.poll_options),
    amount: typeof action.amount === 'number' ? action.amount : null,
    transaction_type: action.transaction_type === 'income' || action.transaction_type === 'expense' ? action.transaction_type : null,
    category: normalizeString(action.category),
    group_name: normalizeString(action.group_name),
    leader_name: normalizeString(action.leader_name),
    transaction_id: normalizeString(action.transaction_id),
  }

  return sanitized
}

export function sanitizeBotQuestion(value: unknown): BotQuestion | null {
  if (!value || typeof value !== 'object') return null

  const q = value as Record<string, unknown>
  const type = q.type
  if (type !== 'multiple_choice' && type !== 'text_input') return null

  const prompt = normalizeString(q.prompt)
  if (!prompt) return null

  const result: BotQuestion = { type, prompt }

  if (type === 'multiple_choice') {
    const opts = normalizeStringArray(q.options)
    if (opts.length < 2) return null // need at least 2 options
    result.options = opts.slice(0, 6) // cap at 6 options
  }

  if (type === 'text_input') {
    result.placeholder = normalizeString(q.placeholder) || undefined
  }

  result.key = normalizeString(q.key) || undefined
  return result
}

export function parseAssistantResponseContent(content: string): AssistantResponsePayload | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  // 1. Try to find a JSON code block first
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  let candidate = fencedMatch?.[1]?.trim() || trimmed

  // 2. If parsing fails, try to find the first '{' and last '}' to extract a potential JSON object
  const firstBrace = candidate.indexOf('{')
  const lastBrace = candidate.lastIndexOf('}')
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const potentialJson = candidate.slice(firstBrace, lastBrace + 1)
    try {
      const parsed = JSON.parse(potentialJson) as Record<string, unknown>
      const answer = normalizeString(parsed.answer) || trimmed
      const thought = normalizeString(parsed.thought)
      const action = sanitizeAssistantAction(parsed.action)
      const question = sanitizeBotQuestion(parsed.question)
      const actionMode = parsed.actionMode === 'draft_only' || parsed.actionMode === 'confirmable'
        ? parsed.actionMode
        : action
          ? 'confirmable'
          : 'none'

      return { answer, thought, action, actionMode, question }
    } catch (e) {
      // Fall through to regex extraction if JSON is still broken
    }
  }

  // 3. Fallback: Try regex-based extraction for "answer" if JSON parsing completely fails
  const extractedAnswer = extractAnswerFromJsonLikeContent(candidate) || extractAnswerFromJsonLikeContent(trimmed)
    || extractAnswerFromPlainTextContent(candidate)
    || extractAnswerFromPlainTextContent(trimmed)

  if (!extractedAnswer) return null

  return {
    answer: extractedAnswer,
    thought: null,
    action: null,
    actionMode: 'none',
    question: null,
  }
}

export function getAssistantActionLabel(action: AssistantActionProposal): string {
  switch (action.type) {
    case 'create_todo':
      return 'Aufgabe'
    case 'create_subtodo':
      return 'Unteraufgabe'
    case 'create_event':
      return 'Termin'
    case 'create_poll':
      return 'Abstimmung'
    case 'create_news':
      return 'News-Eintrag'
    case 'add_finance_transaction':
      return 'Finanz-Transaktion'
    case 'edit_finance_transaction':
      return 'Finanz-Transaktion bearbeiten'
    case 'send_group_message':
      return 'Gruppen-Nachricht'
    case 'create_group':
      return 'Planungsgruppe'
    default:
      return 'Aktion'
  }
}

export function getAssistantActionSummary(action: AssistantActionProposal): string[] {
  const summary: string[] = []

  switch (action.type) {
    case 'create_todo':
    case 'create_subtodo':
      summary.push(`Titel: ${action.title}`)
      if (action.assigned_to_user_name) summary.push(`Zuweisung: ${action.assigned_to_user_name}`)
      if (action.deadline_date) summary.push(`Deadline: ${action.deadline_date}`)
      break
    case 'create_event':
      summary.push(`Titel: ${action.title}`)
      if (action.start_date) summary.push(`Datum: ${action.start_date}`)
      if (action.location) summary.push(`Ort: ${action.location}`)
      break
    case 'create_poll':
      summary.push(`Frage: ${action.title}`)
      if (action.poll_options && action.poll_options.length > 0) {
        summary.push(`Optionen: ${action.poll_options.join(', ')}`)
      }
      break
    case 'create_news':
      summary.push(`Titel: ${action.title}`)
      if (action.description) summary.push(`Inhalt: ${action.description.substring(0, 50)}...`)
      break
    case 'add_finance_transaction':
    case 'edit_finance_transaction':
      const prefix = action.transaction_type === 'expense' ? '-' : '+'
      if (action.amount !== null && action.amount !== undefined) {
        summary.push(`Betrag: ${prefix}${action.amount}€`)
      }
      if (action.title) summary.push(`Zweck: ${action.title}`)
      if (action.category) summary.push(`Kategorie: ${action.category}`)
      if (action.type === 'edit_finance_transaction' && action.transaction_id) {
        summary.push(`ID: ${action.transaction_id}`)
      }
      break
    case 'send_group_message':
      summary.push(`Gruppe: ${action.group_name || 'Hub'}`)
      if (action.description) summary.push(`Inhalt: ${action.description.substring(0, 50)}...`)
      break
    case 'create_group':
      summary.push(`Name: ${action.group_name || action.title}`)
      if (action.leader_name) summary.push(`Leitung: ${action.leader_name}`)
      break
    default:
      summary.push(action.title)
  }

  return summary
}
