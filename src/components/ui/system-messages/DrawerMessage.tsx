'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { SystemMessage, SystemMessageAction } from '@/types/systemMessages'

interface DrawerMessageProps {
  message: SystemMessage
  onClose: () => void
}

export function DrawerMessage({ message, onClose }: DrawerMessageProps) {
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
      console.error('Drawer action failed:', error)
      setActionError(error instanceof Error ? error.message : 'Aktion konnte nicht ausgeführt werden.')
    } finally {
      setPendingActionIndex(null)
    }
  }

  return (
    <Sheet open={true} onOpenChange={handleOpenChange}>
      <SheetContent showCloseButton={message.isDismissible !== false} className="sm:max-w-2xl w-full p-0 flex flex-col gap-0 border-none sm:border-l sm:border-border">
        {(message.title || (typeof message.content === 'string')) && (
          <SheetHeader className="p-6 border-b bg-background sticky top-0 z-10">
            {message.title && (
              <SheetTitle className={cn(
                "text-xl font-bold",
                message.priority === 'critical' ? 'text-destructive' : ''
              )}>
                {message.title}
              </SheetTitle>
            )}
            {typeof message.content === 'string' && (
              <SheetDescription className="pt-2 text-[15px] sm:text-base leading-relaxed text-muted-foreground/90 whitespace-pre-line">
                {message.content}
              </SheetDescription>
            )}
          </SheetHeader>
        )}

        <div className="flex-1 overflow-y-auto">
          {typeof message.content !== 'string' && message.content}
          
          <div className={cn("px-6", typeof message.content === 'string' ? "py-6" : "pb-6")}>
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
          </div>
        </div>

        {message.actions && message.actions.length > 0 && (
          <SheetFooter className="p-6 border-t bg-muted/30 flex flex-col sm:flex-row gap-2">
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
          </SheetFooter>
        )}

        {actionError && (
          <p className="text-sm text-destructive font-medium px-6 pb-6">{actionError}</p>
        )}
      </SheetContent>
    </Sheet>
  )
}
