'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { SystemMessage, SystemMessageAction } from '@/types/systemMessages'

interface ModalMessageProps {
  message: SystemMessage
  onClose: () => void
}

export function ModalMessage({ message, onClose }: ModalMessageProps) {
  const [pendingActionIndex, setPendingActionIndex] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [promptValue, setPromptValue] = useState(message.prompt?.defaultValue ?? '')

  useEffect(() => {
    setPendingActionIndex(null)
    setActionError(null)
    setPromptValue(message.prompt?.defaultValue ?? '')
  }, [message.id, message.prompt?.defaultValue])

  const promptMismatch = useMemo(() => {
    const requiredValue = message.prompt?.requiredValue
    if (!requiredValue) return false
    return promptValue !== requiredValue
  }, [message.prompt?.requiredValue, promptValue])

  const promptValidationMessage =
    message.prompt?.validationMessage ??
    'Bitte gib den geforderten Bestätigungstext exakt ein.'

  const handleOpenChange = (open: boolean) => {
    if (pendingActionIndex !== null) return

    // Only allow closing if it's dismissible
    if (!open && message.isDismissible !== false) {
      onClose()
    }
  }

  const runAction = async (action: SystemMessageAction, index: number) => {
    if (pendingActionIndex !== null || action.disabled) return

    if (action.requiresPromptMatch && promptMismatch) {
      setActionError(promptValidationMessage)
      return
    }

    setActionError(null)

    if (action.href) {
      if (action.closeOnClick !== false) {
        onClose()
      }
      window.location.href = action.href
      return
    }

    setPendingActionIndex(index)
    try {
      await action.onClick?.({ promptValue })
      if (action.closeOnClick !== false) {
        onClose()
      }
    } catch (error) {
      console.error('Modal action failed:', error)
      setActionError(error instanceof Error ? error.message : 'Aktion konnte nicht ausgeführt werden.')
    } finally {
      setPendingActionIndex(null)
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={message.isDismissible !== false}>
        <DialogHeader>
          <DialogTitle className={message.priority === 'critical' ? 'text-destructive' : ''}>
            {message.title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-[15px] sm:text-base leading-relaxed text-muted-foreground/90 whitespace-pre-line">
            {message.content}
          </DialogDescription>
        </DialogHeader>

        {message.prompt && (
          <div className="space-y-2">
            {message.prompt.label && (
              <Label htmlFor={`system-message-prompt-${message.id}`}>{message.prompt.label}</Label>
            )}
            <Input
              id={`system-message-prompt-${message.id}`}
              value={promptValue}
              onChange={(event) => {
                setPromptValue(event.target.value)
                if (actionError) setActionError(null)
              }}
              placeholder={message.prompt.placeholder}
              type={message.prompt.inputType ?? 'text'}
              autoComplete="off"
              disabled={pendingActionIndex !== null}
            />
            {message.prompt.requiredValue && (
              <p className="text-xs text-muted-foreground">
                Erforderliche Eingabe: <span className="font-mono">{message.prompt.requiredValue}</span>
              </p>
            )}
          </div>
        )}

        {message.actions && message.actions.length > 0 && (
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            {message.actions.map((action, idx) => {
              const defaultVariant = message.priority === 'critical' ? 'destructive' : 'outline'
              const variant = action.variant || defaultVariant
              const isPending = pendingActionIndex === idx
              const hasPendingAction = pendingActionIndex !== null
              const promptInvalid = action.requiresPromptMatch && promptMismatch

              return (
                <Button
                  key={`${message.id}-action-${idx}`}
                  variant={variant}
                  className="w-full sm:w-auto"
                  onClick={() => void runAction(action, idx)}
                  disabled={action.disabled || hasPendingAction || promptInvalid}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {action.label}
                </Button>
              )
            })}
          </DialogFooter>
        )}

        {actionError && (
          <p className="text-sm text-destructive font-medium">{actionError}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
