'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound } from 'lucide-react'

interface ResetPasswordDialogProps {
  userId: string
  userName: string
}

export function ResetPasswordDialog({ userId, userName }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: password })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Passwort erfolgreich geändert.' })
        setPassword('')
        setTimeout(() => setOpen(false), 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Fehler beim Zurücksetzen.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Netzwerkfehler.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
            <KeyRound className="mr-2 h-4 w-4" /> Passwort ändern
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort zurücksetzen</DialogTitle>
          <DialogDescription>
            Neues Passwort für <strong>{userName}</strong> festlegen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {message && (
              <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-destructive/15 text-destructive'}`}>
                {message.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input 
                id="newPassword" 
                type="password"
                placeholder="Mind. 6 Zeichen" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Passwort setzen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
