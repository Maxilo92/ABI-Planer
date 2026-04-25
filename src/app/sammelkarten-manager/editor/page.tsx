'use client';

import React, { useRef, useState } from 'react';
import { doc, deleteDoc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useManager } from '@/components/sammelkarten/SammelkartenManagerContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Save, RotateCw, Upload, Loader2, CheckCircle2, Settings2 } from 'lucide-react';
import { PrintableTeacherCard } from '../../../../CardMockUp/PrintableTeacherCard';
import { cn } from '@/lib/utils';

// @ts-ignore
import DefaultTeacherImage from '../../../../CardMockUp/teacher_pictures/business-man-illustration-ai-generative-png.webp';

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'mythic', label: 'Mythic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'iconic', label: 'Iconic' },
];

const compressImageIterative = async (base64Str: string, targetSizeChars = 600000): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!base64Str.startsWith('data:image')) { resolve(base64Str); return; }
    const img = new Image();
    img.src = base64Str;
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let currentQuality = 0.8;
      let currentWidth = Math.min(img.width, 1000);
      let currentHeight = (img.height * currentWidth) / img.width;
      let result = base64Str;
      let iterations = 0;
      while (result.length > targetSizeChars && iterations < 5) {
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        ctx?.clearRect(0, 0, currentWidth, currentHeight);
        ctx?.drawImage(img, 0, 0, currentWidth, currentHeight);
        result = canvas.toDataURL('image/webp', currentQuality);
        currentQuality -= 0.15;
        currentWidth *= 0.8;
        currentHeight *= 0.8;
        iterations++;
      }
      resolve(result);
    };
    img.onerror = reject;
  });
};

export default function EditorPage() {
  const { user } = useAuth();
  const { formData, setFormData, activeDraftId, setActiveDraftId, saving, setSaving, nextAvailableNumber } = useManager();
  const [optimizationStatus, setOptimizationStatus] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-set card number for new cards if not editing
  React.useEffect(() => {
    if (!activeDraftId && formData.cardNumber !== nextAvailableNumber) {
      setFormData((prev: any) => ({ ...prev, cardNumber: nextAvailableNumber }));
    }
  }, [nextAvailableNumber, activeDraftId, setFormData]);

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNumericField = (field: 'imageScale' | 'imageX' | 'imageY' | 'imageRotate', value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    if (field === 'imageScale') {
      updateField(field, Math.min(3, Math.max(0.1, parsed)));
      return;
    }

    if (field === 'imageRotate') {
      updateField(field, Math.min(180, Math.max(-180, parsed)));
      return;
    }

    updateField(field, Math.min(200, Math.max(-200, parsed)));
  };

  const handleSaveEditor = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      let currentImageUrl = formData.imageUrl;
      if (currentImageUrl.length > 700000) {
        setOptimizationStatus("Kompression...");
        currentImageUrl = await compressImageIterative(currentImageUrl);
      }
      const subjectsArray = formData.subjects ? (typeof formData.subjects === 'string' ? formData.subjects.split(',').map((s: string) => s.trim()).filter(Boolean) : formData.subjects) : [];
      const payload = {
        data: {
          id: `db-custom-${Date.now()}`,
          cardNumber: String(formData.cardNumber || '001'),
          name: `${formData.title} ${formData.lastName}`.trim(),
          rarity: String(formData.rarity),
          variant: 'normal',
          imageUrl: currentImageUrl,
          color: '#000',
        },
        details: {
          title: String(formData.title),
          firstName: String(formData.firstName),
          lastName: String(formData.lastName),
          subjects: subjectsArray,
          quote: String(formData.quote),
          stats: {
            punctuality: String(formData.punctuality),
            difficulty: Number(formData.difficulty),
            funFact: String(formData.funFact || ''),
            unpopularSubject: String(formData.unpopularSubject || ''),
            leisure: String(formData.leisure || '')
          }
        },
        imageSettings: { 
          scale: Number(formData.imageScale), 
          x: Number(formData.imageX), 
          y: Number(formData.imageY),
          rotate: Number(formData.imageRotate || 0)
        },
        created_by: user.uid,
        created_at: serverTimestamp()
      };
      await addDoc(collection(db, 'custom_card_designs'), payload);
      if (activeDraftId) {
        await deleteDoc(doc(db, 'teacher_card_drafts', activeDraftId));
        setActiveDraftId(null);
      }
      
      // Reset form (cardNumber will be handled by useEffect)
      setFormData({ 
        ...formData, 
        firstName: '',
        lastName: '',
        subjects: '',
        quote: '',
        imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) { console.error(err); alert('Error saving.'); } 
    finally { setSaving(false); setOptimizationStatus(null); }
  };

  return (
    <div className="flex flex-col gap-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
      <div className="w-full space-y-12 bg-white p-6 lg:p-10 rounded-xl border border-neutral-200 shadow-sm">
          <section className="space-y-6">
             <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-800 flex items-center gap-2">Stammdaten</h3>
                {activeDraftId && <Badge className="bg-emerald-500 text-white border-none text-[8px] uppercase font-black px-2 py-0.5 rounded-sm">Sync Active</Badge>}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest">Titel</Label>
                  <Select value={formData.title || 'Herr'} onValueChange={(v) => updateField('title', v as string)}>
                    <SelectTrigger className="h-11 border-neutral-200 bg-neutral-50/50 rounded-md text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {['Herr', 'Frau', 'Dr.', 'Prof.'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest">Vorname</Label>
                  <input type="text" value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="w-full h-11 px-4 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm font-medium focus:bg-white focus:ring-2 focus:ring-neutral-100 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest">Nachname</Label>
                  <input type="text" value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="w-full h-11 px-4 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm font-black uppercase focus:bg-white focus:ring-2 focus:ring-neutral-100 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest text-center">Index # (Auto)</Label>
                  <div className="w-full h-11 px-4 bg-neutral-900 flex items-center justify-center text-white rounded-md text-sm font-mono font-black shadow-lg border-2 border-neutral-800">
                    {formData.cardNumber}
                  </div>
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest">Fächer (Komma-separiert)</Label>
                <input type="text" value={formData.subjects} onChange={(e) => updateField('subjects', e.target.value)} className="w-full h-11 px-4 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm font-medium focus:bg-white focus:ring-2 focus:ring-neutral-100 outline-none transition-all" placeholder="z.B. Mathematik, Physik" />
             </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-800 border-b border-neutral-100 pb-3 flex items-center gap-2">Bild & Asset</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result;
                          if (typeof result === 'string') { updateField('imageUrl', result); updateField('imageScale', 1); updateField('imageX', 0); updateField('imageY', 0); }
                        };
                        reader.readAsDataURL(file);
                      }
                   }} />
                   <Button variant="outline" className="h-12 rounded-lg gap-3 border-neutral-200 font-black uppercase tracking-[0.15em] text-[10px] bg-white hover:bg-neutral-50 shadow-sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 text-blue-500" /> New Asset</Button>
                   <Button variant="ghost" className="h-8 text-[9px] uppercase font-bold text-neutral-400 hover:text-neutral-600" onClick={() => updateField('imageUrl', typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src)}>Reset to Default</Button>
                </div>
                <div className="p-6 border border-neutral-100 rounded-xl bg-neutral-50/30 shadow-inner flex flex-col justify-center">
                   <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center leading-relaxed">Verwende die Slider unter der Vorschau für das Fine-Tuning.</p>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-800 border-b border-neutral-100 pb-3 flex items-center gap-2">Eigenschaften & Stats</h3>
             <div className="space-y-2">
                <Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest ml-1">Seltenheit (Standard)</Label>
                <Select value={formData.rarity || 'common'} onValueChange={(v) => updateField('rarity', v as string)}><SelectTrigger className="h-11 border-neutral-200 bg-neutral-50/50 rounded-md font-black text-xs uppercase tracking-widest"><SelectValue /></SelectTrigger><SelectContent className="rounded-md">{RARITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs uppercase font-black tracking-widest">{o.label}</SelectItem>)}</SelectContent></Select>
             </div>
             <div className="space-y-2"><Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest ml-1">Lehrer-Zitat</Label><textarea value={formData.quote} onChange={(e) => updateField('quote', e.target.value)} className="w-full min-h-[100px] p-4 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm italic font-medium focus:bg-white focus:ring-2 focus:ring-neutral-100 outline-none transition-all resize-none" placeholder="Was dieser Lehrer oft sagt..." /></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-2">
                <div className="space-y-2"><Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest ml-1">Pünktlichkeit</Label><input type="text" value={formData.punctuality} onChange={(e) => updateField('punctuality', e.target.value)} className="w-full h-11 px-4 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm font-medium focus:bg-white focus:ring-2 focus:ring-neutral-100 outline-none transition-all" /></div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><Label className="text-[10px] uppercase text-neutral-400 font-black tracking-widest ml-1">Schwierigkeit</Label><span className="text-[11px] font-mono font-black bg-neutral-900 text-white px-2 py-1 rounded-sm shadow-md">{formData.difficulty}/10</span></div>
                  <Slider value={[formData.difficulty]} onValueChange={([v]) => updateField('difficulty', v)} max={10} step={1} className="py-2" />
                </div>
             </div>
          </section>
      </div>

      <div className="w-full flex flex-col items-center gap-8">
        <div className="w-full bg-neutral-100/50 p-6 lg:p-10 border border-neutral-200 rounded-xl shadow-inner flex flex-col items-center">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-8 text-center border-b border-neutral-200 pb-3 w-full max-w-md">Vorschau</h3>
          <div className="flex justify-center mb-10 w-full">
            <div className="relative group">
              <div className="scale-[1.0] origin-top drop-shadow-2xl transition-transform duration-700">
                <PrintableTeacherCard 
                  data={{ id: 'preview', cardNumber: formData.cardNumber, name: `${formData.title} ${formData.lastName}`, rarity: formData.rarity, variant: 'normal', imageUrl: formData.imageUrl, color: '#000' }} 
                  details={{ title: formData.title, firstName: formData.firstName, lastName: formData.lastName, subjects: typeof formData.subjects === 'string' ? formData.subjects.split(',').map((s: string) => s.trim()) : formData.subjects, quote: formData.quote, stats: { punctuality: formData.punctuality, difficulty: formData.difficulty, funFact: formData.funFact, unpopularSubject: formData.unpopularSubject, leisure: formData.leisure } }} 
                  imageSettings={{ scale: formData.imageScale, x: formData.imageX, y: formData.imageY, rotate: formData.imageRotate }} 
                  isFlipped={isFlipped} 
                />
              </div>
              <Button variant="secondary" size="icon" className="absolute -right-12 top-0 rounded-full h-12 w-12 shadow-xl border-4 border-white bg-white hover:bg-neutral-50 active:scale-95 transition-all" onClick={() => setIsFlipped(!isFlipped)}><RotateCw className={cn("w-5 h-5 text-neutral-600 transition-transform duration-500", isFlipped && "rotate-180")} /></Button>
            </div>
          </div>

          <div className="w-full max-w-md bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-6 mb-10">
            <div className="flex items-center justify-between border-b border-neutral-50 pb-2 mb-2">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-800 flex items-center gap-2"><Settings2 className="w-3.5 h-3.5 text-blue-500" /> Fine-Tuning</h4>
               <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Real-Time</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2"><Label className="text-[9px] uppercase font-black text-neutral-500 tracking-widest">Zoom</Label><div className="flex items-center gap-2"><Input type="number" step="0.01" min={0.1} max={3} value={Number(formData.imageScale ?? 1).toFixed(2)} onChange={(e) => handleNumericField('imageScale', e.target.value)} className="h-7 w-20 text-[10px] font-mono" /><span className="text-[10px] font-mono font-bold text-neutral-400">x</span></div></div>
                <Slider value={[formData.imageScale]} onValueChange={([v]) => updateField('imageScale', v)} min={0.1} max={3.0} step={0.01} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-2"><Label className="text-[9px] uppercase font-black text-neutral-500 tracking-widest">X-Pos</Label><div className="flex items-center gap-2"><Input type="number" step="1" min={-200} max={200} value={String(formData.imageX ?? 0)} onChange={(e) => handleNumericField('imageX', e.target.value)} className="h-7 w-20 text-[10px] font-mono" /><span className="text-[10px] font-mono font-bold text-neutral-400">px</span></div></div>
                  <Slider value={[formData.imageX]} onValueChange={([v]) => updateField('imageX', v)} min={-200} max={200} step={1} />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-2"><Label className="text-[9px] uppercase font-black text-neutral-500 tracking-widest">Y-Pos</Label><div className="flex items-center gap-2"><Input type="number" step="1" min={-200} max={200} value={String(formData.imageY ?? 0)} onChange={(e) => handleNumericField('imageY', e.target.value)} className="h-7 w-20 text-[10px] font-mono" /><span className="text-[10px] font-mono font-bold text-neutral-400">px</span></div></div>
                  <Slider value={[formData.imageY]} onValueChange={([v]) => updateField('imageY', v)} min={-200} max={200} step={1} />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center gap-2"><Label className="text-[9px] uppercase font-black text-neutral-500 tracking-widest">Rotation</Label><div className="flex items-center gap-2"><Input type="number" step="1" min={-180} max={180} value={String(formData.imageRotate ?? 0)} onChange={(e) => handleNumericField('imageRotate', e.target.value)} className="h-7 w-20 text-[10px] font-mono" /><span className="text-[10px] font-mono font-bold text-neutral-400">°</span></div></div>
                <Slider value={[formData.imageRotate]} onValueChange={([v]) => updateField('imageRotate', v)} min={-180} max={180} step={1} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 relative w-full max-w-md">
            {showSuccess && <div className="absolute -top-12 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2 duration-300"><div className="bg-neutral-900 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl border border-white/10"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Success</div></div>}
            <Button onClick={handleSaveEditor} disabled={saving} className="w-full h-16 rounded-xl uppercase font-black tracking-[0.3em] text-[11px] bg-neutral-900 hover:bg-black text-white shadow-xl transition-all">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="w-5 h-5 mr-3" />} 
              {optimizationStatus || 'Approve to Pool'}
            </Button>
            <Button onClick={() => {
              setFormData({ ...formData, firstName: '', lastName: '', subjects: '', quote: '', imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src });
              setActiveDraftId(null);
            }} variant="outline" className="w-full h-12 rounded-xl uppercase font-black tracking-widest text-[10px] border-2 border-neutral-200 bg-white hover:bg-red-50 hover:text-red-600 transition-all">Abbrechen / Reset</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
