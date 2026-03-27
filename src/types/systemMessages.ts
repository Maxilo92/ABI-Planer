export type SystemMessageType = 'toast' | 'banner' | 'modal';
export type SystemMessagePriority = 'critical' | 'high' | 'warning' | 'info';


export interface SystemMessageAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface SystemMessage {
  id: string;
  type: SystemMessageType;
  priority: SystemMessagePriority;
  title: string;
  content: string;
  actions?: SystemMessageAction[];
  duration?: number; // duration in ms, 0 for infinite (only for toasts)
  isDismissible?: boolean;
  onDismiss?: () => void;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO 8601 string
}
