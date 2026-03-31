'use client'

import { useState, useEffect, useMemo } from 'react'
import { LootTeacher, TeacherRarity } from '@/types/database'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { TeacherSpecCard } from '@/components/cards/TeacherSpecCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardData } from '@/types/cards'

const RARITY_COLORS: Record<TeacherRarity, string> = {
  common: '#94a3b8',    // slate-400
  rare: '#10b981',      // emerald-500
  epic: '#a855f7',      // purple-500
  mythic: '#ef4444',    // red-500
  legendary: '#f59e0b', // amber-500
  iconic: '#000000',    // black
}

interface TeacherEditDialogProps {
  isOpen: boolean;
  teacher: LootTeacher | null;
  onSave: (updatedTeacher: LootTeacher) => void;
  onClose: () => void;
}

export function TeacherEditDialog({ isOpen, teacher, onSave, onClose }: TeacherEditDialogProps) {
  const [localTeacher, setLocalTeacher] = useState<LootTeacher | null>(null)
  const [previewTab, setPreviewTab] = useState<'art' | 'spec'>('art')

  useEffect(() => {
    if (teacher) {
      setLocalTeacher({ ...teacher })
    } else {
      setLocalTeacher(null)
    }
  }, [teacher, isOpen])

  const cardData = useMemo((): CardData => ({
    id: localTeacher?.id || 'preview',
    cardNumber: '???',
    name: localTeacher?.name || 'Vorschau',
    rarity: localTeacher?.rarity || 'common',
    variant: 'normal',
    color: RARITY_COLORS[localTeacher?.rarity || 'common'],
    description: localTeacher?.description,
    hp: localTeacher?.hp,
    attacks: localTeacher?.attacks
  }), [localTeacher])

  const handleUpdate = () => {
    if (!localTeacher) return
    
    // Clean up empty attacks
    const cleanedAttacks = (localTeacher.attacks || []).filter(a => a.name && a.name.trim() !== '');
    const teacherToSave = { 
      ...localTeacher, 
      attacks: cleanedAttacks.length > 0 ? cleanedAttacks : undefined,
      description: localTeacher.description?.trim() || undefined
    };

    onSave(teacherToSave)
  }

  if (!localTeacher && isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lehrer bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere Details, Seltenheit und Kampfwerte des Lehrers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Form Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-teacher-name">Name</Label>
                <Input
                  id="edit-teacher-name"
                  value={localTeacher?.name || ''}
                  onChange={(e) => setLocalTeacher(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-teacher-hp">HP</Label>
                <Input
                  id="edit-teacher-hp"
                  type="number"
                  placeholder="100"
                  value={localTeacher?.hp ?? ''}
                  onChange={(e) => setLocalTeacher(prev => prev ? { ...prev, hp: e.target.value === '' ? undefined : parseInt(e.target.value) } : null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-teacher-rarity">Seltenheit</Label>
              <select
                id="edit-teacher-rarity"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={localTeacher?.rarity || 'common'}
                onChange={(e) => setLocalTeacher(prev => prev ? { ...prev, rarity: e.target.value as TeacherRarity } : null)}
              >
                <option value="common">Gewöhnlich</option>
                <option value="rare">Selten</option>
                <option value="epic">Episch</option>
                <option value="mythic">Mythisch</option>
                <option value="legendary">Legendär</option>
                <option value="iconic">Ikonisch</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-teacher-desc">Beschreibung (Satz)</Label>
              <Textarea
                id="edit-teacher-desc"
                placeholder="Ein kleiner Satz über den Lehrer..."
                value={localTeacher?.description || ''}
                onChange={(e) => setLocalTeacher(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Angriffe (Max. 3)</Label>
              {[0, 1, 2].map(idx => (
                <div key={idx} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Angriff {idx + 1}</Label>
                    {(localTeacher?.attacks?.[idx]?.name) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 text-destructive"
                        onClick={() => {
                          const newAttacks = [...(localTeacher?.attacks || [])];
                          newAttacks.splice(idx, 1);
                          setLocalTeacher(prev => prev ? { ...prev, attacks: newAttacks } : null);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Input 
                      placeholder="Name" 
                      className="col-span-3 h-8 text-xs"
                      value={localTeacher?.attacks?.[idx]?.name || ''}
                      onChange={(e) => {
                        const newAttacks = [...(localTeacher?.attacks || [])];
                        if (!newAttacks[idx]) newAttacks[idx] = { name: '' };
                        newAttacks[idx].name = e.target.value;
                        setLocalTeacher(prev => prev ? { ...prev, attacks: newAttacks } : null);
                      }}
                    />
                    <Input 
                      placeholder="DMG" 
                      type="number"
                      className="h-8 text-xs"
                      value={localTeacher?.attacks?.[idx]?.damage ?? ''}
                      onChange={(e) => {
                        const newAttacks = [...(localTeacher?.attacks || [])];
                        if (!newAttacks[idx]) newAttacks[idx] = { name: '' };
                        newAttacks[idx].damage = e.target.value === '' ? undefined : parseInt(e.target.value);
                        setLocalTeacher(prev => prev ? { ...prev, attacks: newAttacks } : null);
                      }}
                    />
                  </div>
                  <Input 
                    placeholder="Beschreibung (optional)" 
                    className="h-8 text-[10px]"
                    value={localTeacher?.attacks?.[idx]?.description || ''}
                    onChange={(e) => {
                      const newAttacks = [...(localTeacher?.attacks || [])];
                      if (!newAttacks[idx]) newAttacks[idx] = { name: '' };
                      newAttacks[idx].description = e.target.value;
                      setLocalTeacher(prev => prev ? { ...prev, attacks: newAttacks } : null);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview Column */}
          <div className="flex flex-col items-center justify-start space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground self-start">Live-Vorschau</Label>
            
            <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'art' | 'spec')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="art">Design</TabsTrigger>
                <TabsTrigger value="spec">Werte</TabsTrigger>
              </TabsList>
              
              <div className="flex justify-center items-center bg-muted/20 rounded-xl p-8 min-h-[400px]">
                <TabsContent value="art" className="mt-0 outline-none">
                  <div className="w-[280px]">
                    <TeacherCard data={cardData} interactive={false} isFlippedExternally={true} />
                  </div>
                </TabsContent>
                <TabsContent value="spec" className="mt-0 outline-none">
                  <div className="w-[280px]">
                    <TeacherSpecCard data={cardData} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <p className="text-[10px] text-muted-foreground text-center px-4 italic">
              Dies ist eine Vorschau in der Standard-Variante (&quot;Normal&quot;). In-Game können Lehrer auch als Holo, Shiny oder Black-Shiny erscheinen.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleUpdate}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
