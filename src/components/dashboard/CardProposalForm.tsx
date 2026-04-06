'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { LootTeacher, TeacherAttack, CardProposal } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Send, Sparkles, Heart, Swords, Gift, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CardProposalForm() {
  const { user, profile } = useAuth()
  const [teachers, setTeachers] = useState<LootTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [hp, setHp] = useState<number>(60)
  const [description, setDescription] = useState<string>('')
  const [attacks, setAttacks] = useState<TeacherAttack[]>([
    { name: '', damage: 10, description: '' }
  ])

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'sammelkarten'))
        if (settingsDoc.exists()) {
          const lootTeachers = (settingsDoc.data()?.loot_teachers || []) as LootTeacher[]
          setTeachers(lootTeachers.sort((a, b) => a.name.localeCompare(b.name)))
        }
      } catch (error) {
        console.error('Error fetching teachers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  const addAttack = () => {
    if (attacks.length < 2) {
      setAttacks([...attacks, { name: '', damage: 10, description: '' }])
    }
  }

  const removeAttack = (index: number) => {
    setAttacks(attacks.filter((_, i) => i !== index))
  }

  const updateAttack = (index: number, field: keyof TeacherAttack, value: any) => {
    const newAttacks = [...attacks]
    newAttacks[index] = { ...newAttacks[index], [field]: value }
    setAttacks(newAttacks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    if (!selectedTeacherId) {
      toast.error('Bitte wähle einen Lehrer aus.')
      return
    }

    setSubmitting(true)
    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId)

    try {
      const proposalData: Omit<CardProposal, 'id'> = {
        teacher_id: selectedTeacherId,
        teacher_name: selectedTeacher?.name || 'Unbekannt',
        hp: Number(hp),
        description,
        attacks: attacks.filter(a => a.name.trim() !== ''),
        created_at: new Date().toISOString(),
        created_by: user.uid,
        created_by_name: profile.full_name || 'Anonymer Nutzer',
        status: 'pending'
      }

      await addDoc(collection(db, 'card_proposals'), proposalData)
      setSubmitted(true)
      toast.success('Dein Vorschlag wurde eingereicht! Vielen Dank.')
    } catch (error) {
      console.error('Error submitting proposal:', error)
      toast.error('Fehler beim Einreichen des Vorschlags.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tighter">Vorschlag eingereicht!</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Vielen Dank für deine Kreativität! Der Admin wird sich deinen Vorschlag ansehen. 
              Wenn deine Idee (oder Teile davon) übernommen wird, erhältst du <strong>2 Booster-Packs</strong> als Belohnung!
            </p>
          </div>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Weiteren Vorschlag einreichen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 shadow-xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Ideen-Labor</span>
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-tighter">Eigene Karte gestalten</CardTitle>
        <CardDescription>
          Hast du eine coole Idee für die Stats oder Angriffe eines Lehrers? 
          Teile sie mit uns! Bei Erfolg winken Belohnungen.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-8">
          {/* Section 1: Teacher Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black">1</div>
              <Label className="text-sm font-black uppercase tracking-widest">Lehrer auswählen</Label>
            </div>
            <select 
              value={selectedTeacherId} 
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="flex h-12 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold"
            >
              <option value="" disabled>Wähle einen Lehrer...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section 2: Basic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black">2</div>
                <Label className="text-sm font-black uppercase tracking-widest">Lebenspunkte (HP)</Label>
              </div>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500 opacity-50" />
                <Input 
                  type="number" 
                  value={hp} 
                  onChange={(e) => setHp(Number(e.target.value))}
                  className="pl-10 h-12 border-2 focus:ring-primary font-bold text-lg"
                  min={10}
                  max={300}
                  step={10}
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic px-1">Tipp: Meistens zwischen 40 und 180 HP.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black">3</div>
                <Label className="text-sm font-black uppercase tracking-widest">Flavor Text (Beschreibung)</Label>
              </div>
              <Textarea 
                placeholder="Ein lustiger Spruch oder eine typische Eigenschaft..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] border-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Section 3: Attacks */}
          <div className="space-y-6 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black">4</div>
                <Label className="text-sm font-black uppercase tracking-widest">Angriffe (1-2)</Label>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addAttack}
                disabled={attacks.length >= 2}
                className="h-8 text-[10px] font-black uppercase tracking-tighter"
              >
                <Plus className="h-3 w-3 mr-1" /> Angriff hinzufügen
              </Button>
            </div>

            <div className="space-y-4">
              {attacks.map((attack, index) => (
                <div key={index} className="p-4 rounded-xl border-2 border-muted bg-muted/20 relative group/attack animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-50">Name des Angriffs</Label>
                      <Input 
                        placeholder="z.B. Kreide-Wurf" 
                        value={attack.name}
                        onChange={(e) => updateAttack(index, 'name', e.target.value)}
                        className="bg-background border-border/50 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-50">Schaden</Label>
                      <div className="relative">
                        <Swords className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 opacity-50" />
                        <Input 
                          type="number" 
                          value={attack.damage}
                          onChange={(e) => updateAttack(index, 'damage', Number(e.target.value))}
                          className="pl-9 bg-background border-border/50 font-bold"
                          step={5}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-50">Effekt-Beschreibung (Optional)</Label>
                      <Input 
                        placeholder="z.B. Der Gegner ist für 1 Runde verwirrt..." 
                        value={attack.description}
                        onChange={(e) => updateAttack(index, 'description', e.target.value)}
                        className="bg-background border-border/50 text-xs"
                      />
                    </div>
                  </div>
                  
                  {attacks.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeAttack(index)}
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground shadow-sm opacity-0 group-hover/attack:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 bg-primary/5 border-t border-primary/10 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Gift className="h-4 w-4 text-amber-500 animate-bounce" />
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-tight">
              Belohnung: 2 Booster-Packs bei Übernahme
            </span>
          </div>
          <Button 
            type="submit" 
            disabled={submitting} 
            className="w-full sm:w-auto sm:ml-auto h-12 px-8 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Idee Einreichen
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
