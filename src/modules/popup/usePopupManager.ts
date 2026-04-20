'use client'

import { ReactNode, useCallback } from 'react'
import { useSystemMessage } from '@/context/SystemMessageContext'
import type { SystemMessageAction, SystemMessagePriority, SystemMessageType } from '@/types/systemMessages'

type NotifyOptions = {
  type?: SystemMessageType
  priority?: SystemMessagePriority
  title: string
  content: string | ReactNode
  duration?: number
  isDismissible?: boolean
  actions?: SystemMessageAction[]
}

type AlertOptions = {
  title: string
  content: string | ReactNode
  priority?: SystemMessagePriority
  acknowledgeLabel?: string
  acknowledgeVariant?: SystemMessageAction['variant']
  isDismissible?: boolean
}

type ConfirmOptions = {
  title: string
  content: string | ReactNode
  priority?: SystemMessagePriority
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: SystemMessageAction['variant']
  isDismissible?: boolean
}

type PromptOptions = {
  title: string
  content: string | ReactNode
  priority?: SystemMessagePriority
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: SystemMessageAction['variant']
  isDismissible?: boolean
  inputLabel?: string
  placeholder?: string
  defaultValue?: string
  requiredValue?: string
  validationMessage?: string
  inputType?: 'text' | 'password'
}

type DrawerOptions = {
  title: string
  content: ReactNode
  priority?: SystemMessagePriority
  isDismissible?: boolean
  actions?: SystemMessageAction[]
  onDismiss?: () => void
  id?: string
}

export function usePopupManager() {
  const { pushMessage, dismissMessage } = useSystemMessage()

  const notify = useCallback((options: NotifyOptions) => {
    return pushMessage({
      type: options.type ?? 'toast',
      priority: options.priority ?? 'info',
      title: options.title,
      content: options.content,
      duration: options.duration,
      isDismissible: options.isDismissible,
      actions: options.actions,
    })
  }, [pushMessage])

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      let settled = false
      const settle = () => {
        if (settled) return
        settled = true
        resolve()
      }

      pushMessage({
        type: 'modal',
        priority: options.priority ?? 'info',
        title: options.title,
        content: options.content,
        isDismissible: options.isDismissible ?? true,
        actions: [
          {
            label: options.acknowledgeLabel ?? 'OK',
            variant: options.acknowledgeVariant ?? 'default',
            onClick: settle,
          },
        ],
        onDismiss: settle,
      })
    })
  }, [pushMessage])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      let settled = false
      const settle = (value: boolean) => {
        if (settled) return
        settled = true
        resolve(value)
      }

      const priority = options.priority ?? 'warning'
      const destructiveByDefault = priority === 'critical' || priority === 'high'

      pushMessage({
        type: 'modal',
        priority,
        title: options.title,
        content: options.content,
        isDismissible: options.isDismissible ?? true,
        actions: [
          {
            label: options.cancelLabel ?? 'Abbrechen',
            variant: 'outline',
            onClick: () => settle(false),
          },
          {
            label: options.confirmLabel ?? 'Bestätigen',
            variant: options.confirmVariant ?? (destructiveByDefault ? 'destructive' : 'default'),
            onClick: () => settle(true),
          },
        ],
        onDismiss: () => settle(false),
      })
    })
  }, [pushMessage])

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      let settled = false
      const settle = (value: string | null) => {
        if (settled) return
        settled = true
        resolve(value)
      }

      const priority = options.priority ?? 'warning'
      const destructiveByDefault = priority === 'critical' || priority === 'high'

      pushMessage({
        type: 'modal',
        priority,
        title: options.title,
        content: options.content,
        isDismissible: options.isDismissible ?? true,
        prompt: {
          label: options.inputLabel,
          placeholder: options.placeholder,
          defaultValue: options.defaultValue,
          inputType: options.inputType ?? 'text',
          requiredValue: options.requiredValue,
          validationMessage: options.validationMessage,
        },
        actions: [
          {
            label: options.cancelLabel ?? 'Abbrechen',
            variant: 'outline',
            onClick: () => settle(null),
          },
          {
            label: options.confirmLabel ?? 'Bestätigen',
            variant: options.confirmVariant ?? (destructiveByDefault ? 'destructive' : 'default'),
            requiresPromptMatch: true,
            onClick: (context) => settle(context?.promptValue ?? ''),
          },
        ],
        onDismiss: () => settle(null),
      })
    })
  }, [pushMessage])

  const drawer = useCallback((options: DrawerOptions) => {
    return pushMessage({
      id: options.id,
      type: 'drawer',
      priority: options.priority ?? 'info',
      title: options.title,
      content: options.content,
      isDismissible: options.isDismissible ?? true,
      actions: options.actions,
      onDismiss: options.onDismiss,
    })
  }, [pushMessage])

  return {
    notify,
    alert,
    confirm,
    prompt,
    drawer,
    dismiss: dismissMessage,
  }
}
