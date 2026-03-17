'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
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
import { Plus, Trash2 } from 'lucide-react'

export function AddPollDialog() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = createClient()
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

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // 1. Create Poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert([{ question, created_by: user.id }])
        .select()
        .single()

      if (!pollError && poll) {
        // 2. Create Options
        const pollOptions = options
          .filter(opt => opt.trim() !== '')
          .map(opt => ({
            poll_id: poll.id,
            option_text: opt
          }))

        const { error: optError } = await supabase
          .from('poll_options')
          .insert(pollOptions)

        if (!optError) {
          setQuestion('')
          setOptions(['', ''])
          setOpen(false)
          router.refresh()
        }
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
