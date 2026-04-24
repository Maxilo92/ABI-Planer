'use client';

import React, { useState } from 'react';
import { PrintableTeacherCard } from '../../../../../CardMockUp/PrintableTeacherCard';
import { CardData, TeacherRarity } from '@/types/cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Printer, Save, Image as ImageIcon, RotateCw, Trash2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate';
import { Skeleton } from '@/components/ui/skeleton';
// @ts-ignore
import DefaultTeacherImage from '../../../../../CardMockUp/teacher_pictures/business-man-illustration-ai-generative-png.webp';

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'mythic', label: 'Mythic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'iconic', label: 'Iconic' },
];

const VARIANT_OPTIONS = [
  { value: 'normal', label: 'Standard' },
  { value: 'selten', label: 'Selten (Sunburst)' },
  { value: 'holo', label: 'Holo (Irisierend)' },
];

export default function CardEditorPage() {
  const { profile, loading: authLoading } = useAuth();
  
  // State für die Kartendaten
  const [formData, setFormData] = useState({
    title: 'Herr',
    firstName: 'Maximilian',
    lastName: 'Mustermann',
    cardNumber: '001',
    subjects: 'Mathematik, Informatik',
    rarity: 'common' as TeacherRarity,
    variant: 'normal' as 'normal' | 'selten' | 'holo',
    imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src,
    quote: 'Qualität ist kein Zufall, sie ist immer das Ergebnis angestrengten Denkens.',
    punctuality: 'Pünktlich wie die Maurer',
    difficulty: 5,
    funFact: 'Sammelt alte Taschenuhren.',
    unpopularSubject: 'Latein',
    leisure: 'Klettern und Wandern',
  });

  const [isFlipped, setIsFlipped] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Access Control: Nur Admins und Planer
  const isAuthorized = profile && ['admin', 'admin_main', 'admin_co', 'planner'].includes(profile.role);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 flex flex-col gap-12">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-[600px] rounded-3xl" />
          <Skeleton className="h-[600px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <ProtectedSystemGate 
            title="Editor gesperrt"
            description="Der Karten-Editor ist aktuell nur für Administratoren und Planer zugänglich."
          />
        </div>
      </div>
    );
  }

  // Daten für die Komponente aufbereiten
  const cardData: CardData = {
    id: 'custom-card',
    cardNumber: formData.cardNumber,
    name: `${formData.title} ${formData.lastName}`,
    rarity: formData.rarity,
    variant: formData.variant as any,
    imageUrl: formData.imageUrl,
    color: '#000000', // Wird intern von der Komponente über die Rarity gemappt
  };

  const cardDetails = {
    title: formData.title,
    firstName: formData.firstName,
    lastName: formData.lastName,
    subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s !== ''),
    quote: formData.quote,
    stats: {
      punctuality: formData.punctuality,
      difficulty: formData.difficulty,
      funFact: formData.funFact,
      unpopularSubject: formData.unpopularSubject,
      leisure: formData.leisure,
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 lg:p-12">
      <header className="max-w-[1400px] mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-primary text-white rounded-md text-[10px] font-black uppercase tracking-widest">
              Beta
            </span>
            <h1 className="text-4xl font-black text-neutral-900 tracking-tighter uppercase leading-none">
              Karten-Editor
            </h1>
          </div>
          <p className="text-neutral-400 font-medium uppercase tracking-widest text-[10px]">
            Erstelle und personalisiere deine eigenen Lehrer-Karten
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            onClick={handlePrint}
            className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 flex-1 md:flex-none h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Drucken
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-12 items-start">
        
        {/* LINKS: Formular */}
        <div className="space-y-8 print:hidden bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <section className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400 border-b pb-2">Basis-Informationen</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Anrede</Label>
                <Select value={formData.title} onValueChange={(v) => updateField('title', v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Anrede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Herr">Herr</SelectItem>
                    <SelectItem value="Frau">Frau</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Prof.">Prof.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Vorname (Rückseite)</Label>
                <Input 
                  value={formData.firstName} 
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="col-span-1 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Nachname</Label>
                <Input 
                  value={formData.lastName} 
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Nummer</Label>
                <Input 
                  value={formData.cardNumber} 
                  onChange={(e) => updateField('cardNumber', e.target.value)}
                  placeholder="001"
                  className="h-11 rounded-xl text-center font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-neutral-500">Fächer (getrennt durch Komma)</Label>
              <Input 
                value={formData.subjects} 
                onChange={(e) => updateField('subjects', e.target.value)}
                placeholder="Mathe, Physik, Sport"
                className="h-11 rounded-xl"
              />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400 border-b pb-2">Design & Seltenheit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Seltenheit (Farbe)</Label>
                <Select value={formData.rarity} onValueChange={(v) => updateField('rarity', v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RARITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Design-Variante</Label>
                <Select value={formData.variant} onValueChange={(v) => updateField('variant', v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-neutral-500 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> Bild-URL (Transparente PNG empfohlen)
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.imageUrl} 
                  onChange={(e) => updateField('imageUrl', e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="https://..."
                />
                <Button 
                  variant="outline" 
                  className="h-11 px-4 rounded-xl"
                  onClick={() => updateField('imageUrl', typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400 border-b pb-2">Stats & Zitat</h3>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-neutral-500">Zitat des Lehrers</Label>
              <Textarea 
                value={formData.quote} 
                onChange={(e) => updateField('quote', e.target.value)}
                className="min-h-[80px] rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Pünktlichkeit</Label>
                <Input 
                  value={formData.punctuality} 
                  onChange={(e) => updateField('punctuality', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Schwierigkeit</Label>
                  <span className="text-xs font-black">{formData.difficulty} / 10</span>
                </div>
                <Slider 
                  value={[formData.difficulty]} 
                  onValueChange={([v]) => updateField('difficulty', v)} 
                  max={10} 
                  step={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Fun Fact</Label>
                <Input value={formData.funFact} onChange={(e) => updateField('funFact', e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Unbeliebtestes Fach</Label>
                <Input value={formData.unpopularSubject} onChange={(e) => updateField('unpopularSubject', e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-500">Freizeit</Label>
                <Input value={formData.leisure} onChange={(e) => updateField('leisure', e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
          </section>
        </div>

        {/* RECHTS: Live Vorschau */}
        <div className="lg:sticky lg:top-8 flex flex-col items-center gap-8">
          <div className="text-center print:hidden">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 mb-6">Live Vorschau</h3>
            <div className="relative group">
              <PrintableTeacherCard 
                data={cardData} 
                details={cardDetails} 
                isFlipped={isFlipped}
              />
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute -right-12 top-1/2 -translate-y-1/2 rounded-full shadow-xl h-10 w-10"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <RotateCw className={cn("w-5 h-5 transition-transform duration-500", isFlipped && "rotate-180")} />
              </Button>
            </div>
            <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-neutral-300">
              Klicke auf die Karte oder den Button zum Umdrehen
            </p>
          </div>

          {/* Nur für den Druck sichtbare flache Ansicht */}
          <div className="hidden print:flex flex-row gap-8 justify-center w-full">
            <PrintableTeacherCard data={cardData} details={cardDetails} isFlipped={false} />
            <PrintableTeacherCard data={cardData} details={cardDetails} isFlipped={true} />
          </div>

          <div className="w-full flex flex-col gap-3 print:hidden">
            <Button variant="outline" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs gap-2 border-dashed border-2 hover:bg-neutral-100 transition-all">
              <Save className="w-4 h-4" /> Entwurf speichern
            </Button>
            <Button variant="ghost" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs gap-2 text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Zurücksetzen
            </Button>
          </div>
        </div>

      </main>

      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-neutral-200 text-center text-neutral-300 text-[10px] font-bold uppercase tracking-[0.4em] print:hidden">
        ABI Planer TCG • Advanced Card Editor • v1.34.14
      </footer>
    </div>
  );
}
