'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
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
import { Label } from '@/components/ui/label'
import { KeyRound } from 'lucide-react'

interface ResetPasswordDialogProps {
  userEmail: string
  userName: string
}

export function ResetPasswordDialog({ userEmail, userName }: ResetPasswordDialogProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await sendPasswordResetEmail(auth, userEmail)
      setMessage({ type: 'success', text: 'E-Mail zum Zurücksetzen des Passworts wurde gesendet.' })
      setTimeout(() => setOpen(false), 3000)
    } catch (err: any) {
      console.error('Error sending reset email:', err)
      setMessage({ type: 'error', text: 'Fehler beim Senden der E-Mail: ' + (err.message || 'Unbekannter Fehler') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
            <KeyRound className="mr-2 h-4 w-4" /> Passwort zurücksetzen
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort zurücksetzen</DialogTitle>
          <DialogDescription>
            Es wird eine E-Mail an <strong>{userName}</strong> ({userEmail}) gesendet, um das Passwort zurückzusetzen.
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
              <Label>E-Mail Adresse</Label>
              <div className="text-sm font-medium">{userEmail}</div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Senden...' : 'Reset-E-Mail senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
