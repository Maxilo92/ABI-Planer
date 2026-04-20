import { ReactNode } from 'react';

export type SystemMessageType = 'toast' | 'banner' | 'modal' | 'drawer';
export type SystemMessagePriority = 'critical' | 'high' | 'warning' | 'info';

export interface SystemMessageActionContext {
  promptValue?: string;
}

export interface SystemMessagePrompt {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'password';
  requiredValue?: string;
  validationMessage?: string;
}

export interface SystemMessageAction {
  label: string;
  onClick?: (context?: SystemMessageActionContext) => void | Promise<void>;
  href?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  closeOnClick?: boolean;
  requiresPromptMatch?: boolean;
  disabled?: boolean;
}

export interface SystemMessage {
  id: string;
  type: SystemMessageType;
  priority: SystemMessagePriority;
  title: string;
  content: string | ReactNode;
  actions?: SystemMessageAction[];
  duration?: number; // duration in ms, 0 for infinite (only for toasts)
  isDismissible?: boolean;
  onDismiss?: () => void;
  metadata?: Record<string, unknown>;
  prompt?: SystemMessagePrompt;
  createdAt: string; // ISO 8601 string
}
