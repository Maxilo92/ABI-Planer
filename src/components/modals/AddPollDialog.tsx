'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'
import { logAction } from '@/lib/logging'

export function AddPollDialog() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [allowVoteChange, setAllowVoteChange] = useState(true)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleAddOption = () => setOptions([...options, ''])
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options]
      newOptions.splice(index, 1)
      setOptions(newOptions)
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user) {
      try {
        const validOptions = options.filter((opt) => opt.trim() !== '')
        if (validOptions.length < 2) {
          throw new Error('Bitte mindestens zwei Antwortmöglichkeiten angeben.')
        }
        
        const pollRef = await addDoc(collection(db, 'polls'), {
          question,
          created_by: user.uid,
          created_at: serverTimestamp(),
          is_active: true,
          allow_vote_change: allowVoteChange
        })

        const batch = writeBatch(db)
        validOptions.forEach((option) => {
          const optionRef = doc(collection(db, 'polls', pollRef.id, 'options'))
          batch.set(optionRef, {
            poll_id: pollRef.id,
            option_text: option.trim()
          })
        })
        await batch.commit()

        await logAction('POLL_CREATED', user.uid, null, {
          poll_id: pollRef.id,
          question,
          options_count: validOptions.length,
          allow_vote_change: allowVoteChange,
        })

        setQuestion('')
        setOptions(['', ''])
        setAllowVoteChange(true)
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Error creating poll:', error)
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Umfrage erstellen
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neue Umfrage</DialogTitle>
          <DialogDescription>
            Stelle eine Frage an den Jahrgang.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">Frage</Label>
              <Input 
                id="question" 
                placeholder="z.B. Welches Motto?" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-3">
              <Label>Antwortmöglichkeiten</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    placeholder={`Option ${index + 1}`} 
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required 
                  />
                  {options.length > 2 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={handleAddOption}
              >
                Option hinzufügen
              </Button>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id="allow-vote-change"
                checked={allowVoteChange}
                onCheckedChange={(checked) => setAllowVoteChange(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="allow-vote-change" className="cursor-pointer">
                  Meinung nach Wahl ändern erlauben
                </Label>
                <p className="text-xs text-muted-foreground">
                  Standard: Aktiv. Wenn deaktiviert, ist die erste Stimme final.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Erstellen...' : 'Umfrage veröffentlichen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
