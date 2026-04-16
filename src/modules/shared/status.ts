import { FeedbackStatus, TodoStatus } from '@/types/database'
import type { Task } from '@/types/database'
import type { TradeStatus } from '@/types/trades'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

type TodoStatusTone = 'open' | 'in_progress' | 'done'

type TodoStatusMeta = {
  label: string
  tone: TodoStatusTone
}

type FeedbackStatusMeta = {
  label: string
  variant: BadgeVariant
  className?: string
}

type TaskStatusMeta = {
  label: string
  variant: BadgeVariant
  className?: string
}

type TradeStatusMeta = {
  label: string
  variant: BadgeVariant
  className?: string
}

const TODO_STATUS_META: Record<TodoStatus, TodoStatusMeta> = {
  open: {
    label: 'Offen',
    tone: 'open',
  },
  in_progress: {
    label: 'In Arbeit',
    tone: 'in_progress',
  },
  done: {
    label: 'Erledigt',
    tone: 'done',
  },
}

const FEEDBACK_STATUS_META: Record<FeedbackStatus, FeedbackStatusMeta> = {
  new: {
    label: 'Neu',
    variant: 'secondary',
  },
  in_progress: {
    label: 'In Arbeit',
    variant: 'outline',
    className: 'border-info/40 bg-info/10 text-info',
  },
  implemented: {
    label: 'Umgesetzt',
    variant: 'outline',
    className: 'border-success/40 bg-success/10 text-success',
  },
  rejected: {
    label: 'Abgelehnt',
    variant: 'destructive',
  },
}

const TASK_STATUS_META: Record<Task['status'], TaskStatusMeta> = {
  open: {
    label: 'Offen',
    variant: 'secondary',
  },
  claimed: {
    label: 'Angenommen',
    variant: 'secondary',
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  in_review: {
    label: 'In Prüfung',
    variant: 'secondary',
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  rejected: {
    label: 'Nachbesserung nötig',
    variant: 'destructive',
  },
  completed: {
    label: 'Abgeschlossen',
    variant: 'secondary',
    className: 'bg-green-500 hover:bg-green-600 text-white',
  },
}

const TRADE_STATUS_META: Record<TradeStatus, TradeStatusMeta> = {
  pending: {
    label: 'Offen',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  countered: {
    label: 'Gegenangebot',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  accepted: {
    label: 'Angenommen',
    variant: 'secondary',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  completed: {
    label: 'Abgeschlossen',
    variant: 'secondary',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  declined: {
    label: 'Abgelehnt',
    variant: 'secondary',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  cancelled: {
    label: 'Abgebrochen',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  expired: {
    label: 'Abgelaufen',
    variant: 'secondary',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
}

export function getTodoStatusMeta(status: TodoStatus | string): TodoStatusMeta {
  if (status in TODO_STATUS_META) {
    return TODO_STATUS_META[status as TodoStatus]
  }
  return TODO_STATUS_META.open
}

export function getTodoStatusLabel(status: TodoStatus | string): string {
  return getTodoStatusMeta(status).label
}

export function getTodoStatusTone(status: TodoStatus | string): TodoStatusTone {
  return getTodoStatusMeta(status).tone
}

export function getFeedbackStatusMeta(status: FeedbackStatus | string): FeedbackStatusMeta {
  if (status in FEEDBACK_STATUS_META) {
    return FEEDBACK_STATUS_META[status as FeedbackStatus]
  }
  return {
    label: 'Unbekannt',
    variant: 'outline',
  }
}

export function getTaskStatusMeta(
  status: Task['status'] | string,
  labelOverrides?: Partial<Record<Task['status'], string>>,
): TaskStatusMeta {
  if (status in TASK_STATUS_META) {
    const base = TASK_STATUS_META[status as Task['status']]
    const override = labelOverrides?.[status as Task['status']]
    return {
      ...base,
      label: override ?? base.label,
    }
  }

  return {
    label: 'Unbekannt',
    variant: 'outline',
  }
}

export function getTradeStatusMeta(status: TradeStatus | string): TradeStatusMeta {
  if (status in TRADE_STATUS_META) {
    return TRADE_STATUS_META[status as TradeStatus]
  }

  return {
    label: status,
    variant: 'outline',
  }
}
