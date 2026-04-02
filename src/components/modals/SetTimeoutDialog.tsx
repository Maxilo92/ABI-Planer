'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Clock3 } from 'lucide-react'

interface SetTimeoutDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (hours: number, reason: string) => void
  userName: string
}

export function SetTimeoutDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  userName,
}: SetTimeoutDialogProps) {
  const [hours, setHours] = useState<number>(24)
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(hours, reason)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-destructive" />
            Nutzer sperren/warnen
          </DialogTitle>
          <DialogDescription>
            Lege eine Sperrdauer und einen Grund für <strong>{userName}</strong> fest.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="timeout-hours">Dauer in Stunden (0 für nur Warnung/Hinweis)</Label>
            <Input
              id="timeout-hours"
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 0)}
            />
            <p className="text-[10px] text-muted-foreground">
              0h = Nur ein Hinweis beim nächsten Login. 24h = 1 Tag Sperre. 168h = 1 Woche.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timeout-reason">Begründung (wird dem Nutzer angezeigt)</Label>
            <Textarea
              id="timeout-reason"
              placeholder="z.B. Unangemessenes Verhalten im Chat..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            Sperre setzen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
