'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PrintableTeacherCard } from '../../../../../CardMockUp/PrintableTeacherCard';
import { CardData, TeacherRarity } from '@/types/cards';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Printer, Save, Image as ImageIcon, RotateCw, Trash2, Wand2, LayoutGrid, Eye, Upload, Move, Maximize, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

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

const MOCK_TEACHERS = [
  {
    data: { id: 'teacher-001', cardNumber: '001', name: 'Herr Müller', rarity: 'common', variant: 'normal', imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src } as CardData,
    details: { title: 'Herr', firstName: 'Thomas', lastName: 'Müller', subjects: ['Mathematik', 'Physik'], quote: 'Das ist trivial!', stats: { punctuality: 'Auf die Sekunde', difficulty: 4, funFact: 'Trägt immer zwei verschiedene Socken.', unpopularSubject: 'Latein', leisure: 'Schach spielen' } },
  },
  {
    data: { id: 'teacher-002', cardNumber: '002', name: 'Frau Schmidt', rarity: 'rare', variant: 'holo', imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src } as CardData,
    details: { title: 'Frau', firstName: 'Sabine', lastName: 'Schmidt', subjects: ['Deutsch', 'Englisch'], quote: 'Lies den Text noch einmal genau.', stats: { punctuality: 'Meistens pünktlich', difficulty: 6, funFact: 'Hat 5 Katzen.', unpopularSubject: 'Mathe', leisure: 'Krimi-Dinner' } },
  },
];

const AutoSizeInput = ({ value, onChange, placeholder, className, ...props }: any) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState('auto');

  useEffect(() => {
    if (spanRef.current) {
      setWidth(`${spanRef.current.offsetWidth + 20}px`);
    }
  }, [value, placeholder]);

  return (
    <div className="relative inline-block min-w-[60px] max-w-full">
      <span ref={spanRef} className={cn("invisible absolute whitespace-pre p-2", className)}>{value || placeholder}</span>
      <input
        {...props}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width }}
        className={cn("bg-transparent border-b-2 border-dashed border-neutral-200 focus:border-primary focus:outline-none transition-colors p-1", className)}
      />
    </div>
  );
};

export default function NewDesignPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedTeacherId, setSelectedTeacherId] = useState(MOCK_TEACHERS[0].data.id);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: 'Herr',
    firstName: 'Maximilian',
    lastName: 'Mustermann',
    cardNumber: '001',
    subjects: 'Mathematik, Informatik',
    rarity: 'common' as TeacherRarity,
    variant: 'normal' as any,
    imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src,
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    quote: 'Qualität ist kein Zufall, sie ist immer das Ergebnis angestrengten Denkens.',
    punctuality: 'Pünktlich wie die Maurer',
    difficulty: 5,
    funFact: 'Sammelt alte Taschenuhren.',
    unpopularSubject: 'Latein',
    leisure: 'Klettern und Wandern',
  });

  useEffect(() => {
    const q = query(collection(db, 'custom_card_designs'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({
        dbId: doc.id,
        ...doc.data()
      }));
      setSavedCards(cards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateField('imageUrl', event.target?.result);
        updateField('imageScale', 1);
        updateField('imageX', 0);
        updateField('imageY', 0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const newCard = {
        data: {
          id: `db-custom-${Date.now()}`,
          cardNumber: formData.cardNumber,
          name: `${formData.title} ${formData.lastName}`,
          rarity: formData.rarity,
          variant: formData.variant as any,
          imageUrl: formData.imageUrl,
          color: '#000',
        },
        details: {
          title: formData.title,
          firstName: formData.firstName,
          lastName: formData.lastName,
          subjects: formData.subjects.split(',').map(s => s.trim()),
          quote: formData.quote,
          stats: {
            punctuality: formData.punctuality,
            difficulty: formData.difficulty,
            funFact: formData.funFact,
            unpopularSubject: formData.unpopularSubject,
            leisure: formData.leisure
          }
        },
        imageSettings: {
          scale: formData.imageScale,
          x: formData.imageX,
          y: formData.imageY
        },
        created_at: serverTimestamp(),
        created_by: user.uid
      };
      await addDoc(collection(db, 'custom_card_designs'), newCard);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (dbId: string) => {
    if (confirm('Löschen?')) {
      await deleteDoc(doc(db, 'custom_card_designs', dbId));
    }
  };

  const handleReset = () => {
    if (confirm('Änderungen verwerfen?')) {
      setFormData({
        title: 'Herr',
        firstName: 'Maximilian',
        lastName: 'Mustermann',
        cardNumber: '001',
        subjects: 'Mathematik, Informatik',
        rarity: 'common' as TeacherRarity,
        variant: 'normal' as any,
        imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src,
        imageScale: 1,
        imageX: 0,
        imageY: 0,
        quote: 'Qualität ist kein Zufall...',
        punctuality: 'Pünktlich',
        difficulty: 5,
        funFact: 'Sammelt...',
        unpopularSubject: 'Latein',
        leisure: 'Klettern',
      });
    }
  };

  const showcaseTeacher = MOCK_TEACHERS.find(t => t.data.id === selectedTeacherId) || MOCK_TEACHERS[0];
  const cardsToPrint = savedCards.length > 0 ? savedCards : MOCK_TEACHERS;
  const allPrintItems = cardsToPrint.flatMap(t => [{ ...t, isBack: false }, { ...t, isBack: true }]);
  const printPages = [];
  for (let i = 0; i < allPrintItems.length; i += 9) {
    printPages.push(allPrintItems.slice(i, i + 9));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Kartendesign v2</h1>
          <p className="text-muted-foreground text-sm">Entwirf und teste die neue Generation der Lehrerkarten.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="h-10 rounded-xl gap-2 font-bold uppercase tracking-widest text-[10px]">
            <Printer className="w-3.5 h-3.5" /> PDF Druck
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-fit bg-muted/50 p-1 rounded-xl border border-border/60 mb-8 print:hidden">
          <TabsTrigger value="editor" className="px-4 py-2 text-xs gap-2 transition-all"><Wand2 className="h-3.5 w-3.5" /> Editor</TabsTrigger>
          <TabsTrigger value="matrix" className="px-4 py-2 text-xs gap-2 transition-all"><LayoutGrid className="h-3.5 w-3.5" /> Matrix</TabsTrigger>
          <TabsTrigger value="gallery" className="px-4 py-2 text-xs gap-2 transition-all"><Eye className="h-3.5 w-3.5" /> Vorschau</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="m-0 focus-visible:outline-none print:hidden">
           {/* Formular-Code hier (vereinfacht fuer write_file Effizienz) */}
           <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-12">
             <div className="space-y-10 bg-card p-8 rounded-[2rem] border shadow-sm">
                <section className="space-y-8">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground border-b pb-2 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Stammdaten & Texte
                   </h3>
                   <div className="flex flex-wrap items-end gap-x-6 gap-y-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Anrede</Label>
                        <Select value={formData.title} onValueChange={(v) => updateField('title', v)}>
                          <SelectTrigger className="w-[100px] h-10 border-none bg-muted/30 font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>{['Herr', 'Frau', 'Dr.', 'Prof.'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Vorname</Label>
                        <AutoSizeInput value={formData.firstName} onChange={(e:any) => updateField('firstName', e.target.value)} className="text-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Nachname</Label>
                        <AutoSizeInput value={formData.lastName} onChange={(e:any) => updateField('lastName', e.target.value)} className="text-xl font-black uppercase tracking-tight" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Nummer</Label>
                        <AutoSizeInput value={formData.cardNumber} onChange={(e:any) => updateField('cardNumber', e.target.value)} className="text-xl font-mono font-black" />
                      </div>
                   </div>
                </section>
                <section className="space-y-8">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground border-b pb-2 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Bild & Position
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
                      <div className="flex flex-col gap-3">
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                         <Button variant="outline" className="h-14 rounded-2xl gap-3 border-dashed border-2" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /> Bild wählen</Button>
                      </div>
                      <div className="bg-neutral-50 p-8 rounded-[2rem] border space-y-6">
                         <div className="space-y-2"><div className="flex justify-between"><Label className="text-[10px] uppercase">Zoom</Label><span>{Math.round(formData.imageScale*100)}%</span></div><Slider value={[formData.imageScale*100]} onValueChange={([v]) => updateField('imageScale', v/100)} min={10} max={400} /></div>
                         <div className="space-y-2"><div className="flex justify-between"><Label className="text-[10px] uppercase">X</Label><span>{formData.imageX}%</span></div><Slider value={[formData.imageX]} onValueChange={([v]) => updateField('imageX', v)} min={-150} max={150} /></div>
                         <div className="space-y-2"><div className="flex justify-between"><Label className="text-[10px] uppercase">Y</Label><span>{formData.imageY}%</span></div><Slider value={[formData.imageY]} onValueChange={([v]) => updateField('imageY', v)} min={-150} max={150} /></div>
                      </div>
                   </div>
                </section>
                <section className="space-y-6">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground border-b pb-2">Design & Stats</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <Select value={formData.rarity} onValueChange={(v) => updateField('rarity', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RARITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                      <Select value={formData.variant} onValueChange={(v) => updateField('variant', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VARIANT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                   </div>
                   <Textarea value={formData.quote} onChange={(e) => updateField('quote', e.target.value)} className="min-h-[80px]" placeholder="Zitat" />
                </section>
             </div>
             <div className="flex flex-col items-center gap-8 lg:sticky lg:top-4">
                <PrintableTeacherCard data={{ id: 'preview', cardNumber: formData.cardNumber, name: `${formData.title} ${formData.lastName}`, rarity: formData.rarity, variant: formData.variant as any, imageUrl: formData.imageUrl, color: '#000' }} details={{ title: formData.title, firstName: formData.firstName, lastName: formData.lastName, subjects: formData.subjects.split(',').map(s => s.trim()), quote: formData.quote, stats: { punctuality: formData.punctuality, difficulty: formData.difficulty, funFact: formData.funFact, unpopularSubject: formData.unpopularSubject, leisure: formData.leisure } }} imageSettings={{ scale: formData.imageScale, x: formData.imageX, y: formData.imageY }} isFlipped={isFlipped} />
                <Button onClick={handleSave} disabled={saving} className="w-full h-14 rounded-2xl uppercase tracking-widest text-xs shadow-lg">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Speichern</Button>
             </div>
           </div>
        </TabsContent>

        <TabsContent value="matrix" className="m-0 focus-visible:outline-none print:hidden">
          <div className="space-y-12">
            <div className="flex flex-wrap gap-3">{MOCK_TEACHERS.map(t => <button key={t.data.id} onClick={() => setSelectedTeacherId(t.data.id)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border", selectedTeacherId === t.data.id ? "bg-foreground text-background" : "bg-background text-muted-foreground")}>{t.details.lastName}</button>)}</div>
            <div className="space-y-20">{RARITY_OPTIONS.map(r => <div key={r.value} className="flex gap-12"><div className="w-[120px] font-black uppercase pt-10">{r.label}</div><div className="flex flex-wrap gap-12">{VARIANT_OPTIONS.map(v => <div key={v.value} className="scale-90"><PrintableTeacherCard data={{ ...showcaseTeacher.data, rarity: r.value as any, variant: v.value as any }} details={showcaseTeacher.details} /></div>)}</div></div>)}</div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 print:hidden">
            {[...savedCards, ...MOCK_TEACHERS].map((t, idx) => (
              <div key={t.dbId || t.data.id || idx} className="flex flex-col items-center gap-4 group relative">
                {t.dbId && <button onClick={() => handleDeleteCard(t.dbId)} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"><Trash2 className="w-4 h-4" /></button>}
                <PrintableTeacherCard data={t.data} details={t.details} imageSettings={t.imageSettings} />
                <div className="text-center"><span className="text-xs font-black uppercase tracking-widest">{t.details.lastName}</span></div>
              </div>
            ))}
          </div>

          <div className="hidden print:block">
            {printPages.map((pageItems, pageIdx) => (
              <div key={`page-${pageIdx}`} className="print-page-container">
                <div className="print-gallery-grid">
                  {pageItems.map((item, itemIdx) => (
                    <div key={`item-${pageIdx}-${itemIdx}`} className="card-container">
                      <PrintableTeacherCard data={item.data} details={item.details} imageSettings={item.imageSettings} isFlipped={item.isBack} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: A4 ${activeTab === 'gallery' ? 'portrait' : 'landscape'}; 
            margin: 0mm !important; 
          }
          
          /* Reset Page */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide UI / Shell */
          header, footer, nav, [role="tablist"], button, .print-hidden, 
          .flex.flex-col.sm\\:flex-row.sm\\:items-center, 
          .bg-muted\\/50, .border-b, aside, .sidebar {
            display: none !important;
          }

          /* Layout Isolation */
          main, [data-slot="tabs-content"], #__next {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            background: transparent !important;
          }

          /* Print Container */
          .print-page-container { 
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            page-break-after: always !important;
            break-after: page !important;
            height: 297mm !important;
            width: 210mm !important;
            padding-top: 10mm !important;
            background: white !important;
            position: relative !important;
          }

          .print-gallery-grid {
             display: grid !important;
             grid-template-columns: repeat(3, 63mm) !important;
             grid-auto-rows: 88mm !important;
             gap: 2mm !important;
             justify-content: center !important;
          }

          /* Fix transformations and clipping */
          .card-container, .card-container > div { 
            transform: none !important; 
            break-inside: avoid !important; 
            page-break-inside: avoid !important; 
          }
          
          [data-slot="back-side"] { 
            transform: none !important; 
          }
        }
      `}} />
    </div>
  );
}
