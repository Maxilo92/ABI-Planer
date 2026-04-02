'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SystemMessage, SystemMessageAction, SystemMessagePriority } from '@/types/systemMessages'
import Link from 'next/link'

interface ModalMessageProps {
  message: SystemMessage
  onClose: (id: string) => void
}

export function ModalMessage({ message, onClose }: ModalMessageProps) {
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if it's dismissible
    if (!open && message.isDismissible !== false) {
      onClose(message.id)
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={message.isDismissible !== false}>
        <DialogHeader>
          <DialogTitle className={message.priority === 'critical' ? 'text-destructive' : ''}>
            {message.title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-[15px] sm:text-base leading-relaxed text-muted-foreground/90">
            {message.content}
          </DialogDescription>
        </DialogHeader>

        {message.actions && message.actions.length > 0 && (
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            {message.actions.map((action, idx) => (
              <ActionComponent 
                key={idx} 
                action={action} 
                priority={message.priority} 
                onClose={() => onClose(message.id)} 
              />
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ActionComponent({ 
  action, 
  priority, 
  onClose 
}: { 
  action: SystemMessageAction; 
  priority: SystemMessagePriority;
  onClose: () => void;
}) {
  const defaultVariant = priority === 'critical' ? 'destructive' : 'outline'
  const variant = action.variant || defaultVariant
  
  const handleClick = () => {
    if (action.onClick) {
      action.onClick()
    }
    onClose()
  }

  if (action.href) {
    return (
      <Button 
        variant={variant} 
        className="w-full sm:w-auto"
        render={<Link href={action.href} onClick={onClose} />}
      >
        {action.label}
      </Button>
    )
  }

  return (
    <Button 
      variant={variant} 
      className="w-full sm:w-auto"
      onClick={handleClick}
    >
      {action.label}
    </Button>
  )
}
