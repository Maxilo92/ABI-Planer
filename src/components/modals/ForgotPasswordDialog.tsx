'use client'

import { useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const auth = getFirebaseAuth()

interface ForgotPasswordDialogProps {
  initialEmail?: string
}

export function ForgotPasswordDialog({ initialEmail = '' }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Passwort-Reset nur für @hgr-web.lernsax.de Adressen möglich.')
      }

      await sendPasswordResetEmail(auth, normalizedEmail)
      toast.success('Reset-E-Mail gesendet!', {
        description: 'Bitte überprüfe deinen Posteingang (und den Spam-Ordner).',
      })
      setOpen(false)
    } catch (err: any) {
      console.error('Error sending reset email:', err)
      toast.error('Fehler beim Senden', {
        description: err.message || 'Bitte versuche es später erneut.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button 
            type="button"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Passwort vergessen?
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passwort vergessen?</DialogTitle>
          <DialogDescription>
            Gib deine Lernsax-E-Mail-Adresse ein. Wir senden dir einen Link, um dein Passwort zurückzusetzen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-Mail Adresse</Label>
            <Input 
              id="reset-email" 
              type="email" 
              placeholder="vorname.nachname@hgr-web.lernsax.de" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/70 border-border h-12 text-base focus:bg-background transition-all"
              required 
            />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8 font-bold">
              {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
