'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDoc } from 'firebase/firestore'
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
import { Plus, Trash2, Users, Shield } from 'lucide-react'
import { logAction } from '@/lib/logging'
import { UserRole } from '@/types/database'

const AVAILABLE_ROLES: { label: string; value: UserRole }[] = [
  { label: 'Alle verifizierten Nutzer', value: 'viewer' },
  { label: 'Planer / Orga-Team', value: 'planner' },
  { label: 'Admins (alle)', value: 'admin' },
  { label: 'Haupt-Admins', value: 'admin_main' },
  { label: 'Co-Admins', value: 'admin_co' },
]

export function AddPollDialog() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [allowVoteChange, setAllowVoteChange] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [multipleChoice, setMultipleChoice] = useState(false)
  const [allowCustomOptions, setAllowCustomOptions] = useState(false)
  const [customMaxLength, setCustomMaxLength] = useState(50)
  const [maxProposals, setMaxProposals] = useState(1)
  const [maxVotes, setMaxVotes] = useState(2)
  const [targetGroups, setTargetGroups] = useState<string[]>([])
  const [targetRoles, setTargetRoles] = useState<UserRole[]>([])
  const [availableGroups, setAvailableGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchGroups = async () => {
      const settingsRef = doc(db, 'settings', 'config')
      const settingsSnap = await getDoc(settingsRef)
      if (settingsSnap.exists()) {
        const groups = settingsSnap.data().planning_groups || []
        setAvailableGroups(
          groups
            .map((group: { name?: string }) => group.name)
            .filter((name: string | undefined): name is string => typeof name === 'string' && name.trim().length > 0)
        )
      }
    }

    if (open) {
      fetchGroups()
    }
  }, [open])

  const handleAddOption = () => setOptions([...options, ''])
  const handleRemoveOption = (index: number) => {
    if (options.length > 0) {
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

  const toggleGroup = (groupName: string) => {
    setTargetGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName) 
        : [...prev, groupName]
    )
  }

  const toggleRole = (role: UserRole) => {
    setTargetRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user) {
      try {
        const validOptions = options.filter((opt) => opt.trim() !== '')
        
        if (!allowCustomOptions && validOptions.length < 2) {
          throw new Error('Bitte mindestens zwei Antwortmöglichkeiten angeben.')
        }

        if (!isPublic && targetGroups.length === 0 && targetRoles.length === 0) {
          throw new Error('Bitte wähle mindestens eine Zielgruppe oder Rolle aus, wenn die Umfrage nicht öffentlich ist.')
        }

        let customPlaceholder = null
        if (allowCustomOptions) {
          try {
            const token = await user.getIdToken()
            const response = await fetch('/api/polls/generate-placeholder', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ question })
            })
            if (response.ok) {
              const data = await response.json()
              customPlaceholder = data.placeholder
            }
          } catch (error) {
            console.error('Error generating custom placeholder:', error)
          }
        }
        
        const pollRef = await addDoc(collection(db, 'polls'), {
          question,
          created_by: user.uid,
          created_at: serverTimestamp(),
          is_active: true,
          allow_vote_change: allowVoteChange,
          is_public: isPublic,
          multiple_choice: multipleChoice,
          allow_custom_options: allowCustomOptions,
          custom_options_max_length: allowCustomOptions ? customMaxLength : null,
          max_custom_proposals: allowCustomOptions ? maxProposals : null,
          max_votes: multipleChoice ? maxVotes : 1,
          target_groups: isPublic ? [] : targetGroups,
          target_roles: isPublic ? [] : targetRoles,
          custom_placeholder: customPlaceholder
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

        await logAction('POLL_CREATED', user.uid, profile?.full_name, {
          poll_id: pollRef.id,
          question,
          options_count: validOptions.length,
          allow_vote_change: allowVoteChange,
          is_public: isPublic,
          multiple_choice: multipleChoice,
          allow_custom_options: allowCustomOptions,
          custom_options_max_length: allowCustomOptions ? customMaxLength : null,
          max_custom_proposals: allowCustomOptions ? maxProposals : null,
          max_votes: multipleChoice ? maxVotes : 1,
          target_groups: isPublic ? [] : targetGroups,
          target_roles: isPublic ? [] : targetRoles
        })

        setQuestion('')
        setOptions(['', ''])
        setAllowVoteChange(true)
        setIsPublic(true)
        setMultipleChoice(false)
        setAllowCustomOptions(false)
        setCustomMaxLength(50)
        setMaxProposals(1)
        setMaxVotes(2)
        setTargetGroups([])
        setTargetRoles([])
        setOpen(false)
        router.refresh()
      } catch (error: any) {
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Umfrage</DialogTitle>
          <DialogDescription>
            Stelle eine Frage an den Jahrgang oder eine spezifische Gruppe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
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
                  />
                  {options.length > 0 && (
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
                className="w-full mt-2 font-bold uppercase text-[10px] tracking-widest"
                onClick={handleAddOption}
              >
                <Plus className="h-3 w-3 mr-2" /> Option hinzufügen
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4" /> Sichtbarkeit & Zielgruppe
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all ${
                    isPublic ? 'border-primary bg-primary/5' : 'border-border bg-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isPublic ? 'border-primary' : 'border-muted-foreground'}`}>
                      {isPublic && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    Öffentlich (Alle Nutzer)
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-6">
                    Jeder verifizierte Nutzer kann diese Umfrage sehen und abstimmen.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all ${
                    !isPublic ? 'border-primary bg-primary/5' : 'border-border bg-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${!isPublic ? 'border-primary' : 'border-muted-foreground'}`}>
                      {!isPublic && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    Eingeschränkt (Zielgruppen)
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-6">
                    Nur ausgewählte Rollen oder Planungsgruppen können teilnehmen.
                  </p>
                </button>
              </div>

              {!isPublic && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30 animate-in zoom-in-95 duration-200">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                      <Shield className="h-3 w-3" /> Erlaubte Rollen
                    </Label>
                    <div className="grid grid-cols-1 gap-2 pl-1">
                      {AVAILABLE_ROLES.map((role) => (
                        <div key={role.value} className="flex items-center gap-3">
                          <Checkbox 
                            id={`role-${role.value}`}
                            checked={targetRoles.includes(role.value)}
                            onCheckedChange={() => toggleRole(role.value)}
                          />
                          <Label htmlFor={`role-${role.value}`} className="text-xs cursor-pointer font-medium">
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {availableGroups.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                        <Users className="h-3 w-3" /> Planungsgruppen
                      </Label>
                      <div className="grid grid-cols-2 gap-2 pl-1 max-h-[120px] overflow-y-auto pr-1">
                        {availableGroups.map((group) => (
                          <div key={group} className="flex items-center gap-3">
                            <Checkbox 
                              id={`group-${group}`}
                              checked={targetGroups.includes(group)}
                              onCheckedChange={() => toggleGroup(group)}
                            />
                            <Label htmlFor={`group-${group}`} className="text-[11px] cursor-pointer truncate" title={group}>
                              {group}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[9px] text-muted-foreground italic pt-2">
                    Hinweis: Administratoren und Planer sehen Umfragen zur Verwaltung immer.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4" /> Abstimmungs-Modus & Regeln
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Rule: Change Mind */}
                <div className="flex items-start gap-3 rounded-md border p-3 bg-muted/10">
                  <Checkbox
                    id="allow-vote-change"
                    checked={allowVoteChange}
                    onCheckedChange={(checked) => setAllowVoteChange(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="allow-vote-change" className="cursor-pointer text-sm font-bold">
                      Meinung ändern erlauben
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Nutzer können ihre Stimme nachträglich zurückziehen oder ändern.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode: Multiple Choice */}
                  <div className={`flex flex-col gap-3 p-3 rounded-lg border-2 transition-all ${multipleChoice ? 'border-primary bg-primary/5' : 'border-border bg-transparent'}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="multiple-choice"
                        checked={multipleChoice}
                        onCheckedChange={(checked) => setMultipleChoice(checked === true)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="multiple-choice" className="cursor-pointer font-bold text-sm">
                          Mehrfachauswahl
                        </Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Nutzer können für mehr als eine Option stimmen.
                        </p>
                      </div>
                    </div>
                    {multipleChoice && (
                      <div className="space-y-2 pt-2 border-t border-primary/20 animate-in slide-in-from-top-1 duration-200">
                        <Label htmlFor="max-votes" className="text-[9px] font-black uppercase text-primary tracking-widest">
                          Max. Stimmen
                        </Label>
                        <Input
                          id="max-votes"
                          type="number"
                          min={2}
                          max={options.length || 10}
                          value={maxVotes}
                          onChange={(e) => setMaxVotes(parseInt(e.target.value) || 2)}
                          className="h-8 w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Mode: Custom Options (Vorschläge) */}
                  <div className={`flex flex-col gap-3 p-3 rounded-lg border-2 transition-all ${allowCustomOptions ? 'border-primary bg-primary/5' : 'border-border bg-transparent'}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="allow-custom-options"
                        checked={allowCustomOptions}
                        onCheckedChange={(checked) => setAllowCustomOptions(checked === true)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="allow-custom-options" className="cursor-pointer font-bold text-sm">
                          Vorschlags-Modus
                        </Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Nutzer können Vorschläge einreichen (nur für Planer sichtbar).
                        </p>
                      </div>
                    </div>
                    {allowCustomOptions && (
                      <div className="space-y-3 pt-2 border-t border-primary/20 animate-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-primary tracking-widest">Länge</Label>
                            <Input
                              type="number"
                              min={5}
                              value={customMaxLength}
                              onChange={(e) => setCustomMaxLength(parseInt(e.target.value) || 50)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-primary tracking-widest">Anzahl</Label>
                            <Input
                              type="number"
                              min={1}
                              value={maxProposals}
                              onChange={(e) => setMaxProposals(parseInt(e.target.value) || 1)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

