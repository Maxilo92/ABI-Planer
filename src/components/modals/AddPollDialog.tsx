'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
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

export function AddPollDialog() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()
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
        const validOptions = options.filter(opt => opt.trim() !== '')
        
        await addDoc(collection(db, 'polls'), {
          question,
          options: validOptions,
          is_anonymous: isAnonymous,
          created_by: user.uid,
          created_by_name: profile?.full_name || user.displayName || 'Unbekannt',
          created_at: serverTimestamp(),
          is_active: true
        })

        setQuestion('')
        setOptions(['', ''])
        setIsAnonymous(false)
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

            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox 
                id="anonymous" 
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="anonymous" className="text-sm font-medium">Anonyme Abstimmung</Label>
                <p className="text-[10px] text-muted-foreground">Admins sehen wer abgestimmt hat, aber nicht was.</p>
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
