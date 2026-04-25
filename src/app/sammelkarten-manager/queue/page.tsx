'use client';

import React from 'react';
import { doc, deleteDoc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useManager } from '@/components/sammelkarten/SammelkartenManagerContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Wand2, FileText, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getMainBaseUrl } from '@/lib/dashboard-url';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QueuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { drafts, setFormData, setActiveDraftId, nextAvailableNumber } = useManager();

  const handleApproveFromQueue = async (draft: any) => {
    try {
      const subjectsArray = typeof draft.subjects === 'string' ? draft.subjects.split(',').map((s: string) => s.trim()).filter(Boolean) : draft.subjects;
      const payload = {
        data: { 
          id: `db-approved-${Date.now()}`, 
          cardNumber: nextAvailableNumber, 
          name: `${draft.title} ${draft.lastName}`.trim(), 
          rarity: 'common', 
          variant: 'normal', 
          imageUrl: draft.imageUrl, 
          color: '#000' 
        },
        details: { 
          title: draft.title, 
          firstName: draft.firstName, 
          lastName: draft.lastName, 
          subjects: subjectsArray, 
          quote: draft.quote, 
          stats: { 
            punctuality: draft.punctuality, 
            difficulty: draft.difficulty, 
            funFact: draft.funFact || '', 
            unpopularSubject: draft.unpopularSubject || '', 
            leisure: draft.leisure || '' 
          } 
        },
        imageSettings: { scale: 1, x: 0, y: 0, rotate: 0 },
        created_by: user?.uid,
        created_at: serverTimestamp(),
        source: 'registration'
      };
      await addDoc(collection(db, 'custom_card_designs'), payload);
      await deleteDoc(doc(db, 'teacher_card_drafts', draft.dbId));
    } catch (err) { console.error(err); alert('Failed'); }
  };

  const loadDraftToEditor = (draft: any) => {
    setActiveDraftId(draft.dbId);
    setFormData({
      title: draft.title || 'Herr',
      firstName: draft.firstName || '',
      lastName: draft.lastName || '',
      rarity: draft.rarity || 'common',
      cardNumber: nextAvailableNumber,
      subjects: draft.subjects || '',
      quote: draft.quote || '',
      punctuality: draft.punctuality || '',
      difficulty: draft.difficulty || 5,
      funFact: draft.funFact || '',
      unpopularSubject: draft.unpopularSubject || '',
      leisure: draft.leisure || '',
      imageUrl: draft.imageUrl,
      imageScale: 1,
      imageX: 0,
      imageY: 0,
      imageRotate: 0
    });
    router.push('/sammelkarten-manager/editor');
  };

  const handleDownloadDraftImage = async (draft: any) => {
    try {
      const imageUrl = draft.imageUrl;
      if (!imageUrl) {
        alert('Für diesen Entwurf ist kein Bild vorhanden.');
        return;
      }

      const safeLastName = String(draft.lastName || 'lehrer').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const safeFirstName = String(draft.firstName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileStem = safeFirstName ? `${safeLastName}-${safeFirstName}` : safeLastName;

      if (imageUrl.startsWith('data:image/')) {
        const extMatch = imageUrl.match(/^data:image\/([a-zA-Z0-9+]+);/);
        const extension = extMatch?.[1]?.replace('+xml', '') || 'png';
        const anchor = document.createElement('a');
        anchor.href = imageUrl;
        anchor.download = `${fileStem}.${extension}`;
        anchor.click();
        return;
      }

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Image fetch failed');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const extension = blob.type.split('/')[1] || 'png';
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `${fileStem}.${extension}`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      alert('Bild konnte nicht heruntergeladen werden.');
    }
  };

  const registrationUrl = typeof window !== 'undefined' ? `${getMainBaseUrl()}/lehrer-anmeldung` : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
      <div className="space-y-4">
        {drafts.length === 0 ? (
          <div className="p-20 border border-dashed rounded-md text-center bg-neutral-50">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Keine offenen Einsendungen</p>
          </div>
        ) : drafts.map((draft) => (
          <Card key={draft.dbId} className="border border-neutral-200 shadow-sm rounded-md overflow-hidden bg-white">
            <div className="flex flex-col md:flex-row gap-6 p-4">
              <div className="w-32 aspect-[3/4] rounded-md overflow-hidden border bg-neutral-100 shrink-0">
                <img src={draft.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">{draft.title} {draft.lastName}</h3>
                    <p className="text-[10px] text-neutral-500 font-medium">{draft.firstName} • {draft.subjects}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => loadDraftToEditor(draft)} className="h-7 w-7 text-neutral-300 hover:text-blue-500"><Wand2 className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteDoc(doc(db, 'teacher_card_drafts', draft.dbId))} className="h-7 w-7 text-neutral-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded text-[11px] italic text-neutral-600">"{draft.quote}"</div>
                <div className="flex gap-2">
                   <Button onClick={() => handleApproveFromQueue(draft)} variant="outline" className="flex-1 h-9 rounded-sm uppercase font-black tracking-widest text-[9px] gap-2 border-neutral-200 hover:bg-neutral-50 transition-all">Direct Approve</Button>
                   <Button onClick={() => loadDraftToEditor(draft)} className="flex-1 h-9 rounded-sm uppercase font-black tracking-widest text-[9px] gap-2 bg-neutral-900 text-white">Open in Designer</Button>
                   <Button onClick={() => handleDownloadDraftImage(draft)} variant="outline" className="h-9 rounded-sm uppercase font-black tracking-widest text-[9px] gap-2 border-neutral-200 hover:bg-neutral-50 transition-all">
                     <Download className="w-3.5 h-3.5" /> Bild
                   </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="space-y-6">
        <Card className="rounded-md border border-neutral-200 bg-neutral-900 text-white p-6 text-center shadow-lg overflow-hidden relative group">
           {/* Background Accent */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
           
           <h3 className="text-[9px] font-black uppercase tracking-widest mb-4 relative z-10">Registration QR</h3>
           
           <div className="bg-white p-3 rounded-xl flex items-center justify-center mx-auto w-[174px] h-[174px] mb-4 relative z-10 shadow-2xl">
             <QRCodeSVG value={registrationUrl} size={150} level="H" />
           </div>
           
           <div className="space-y-3 relative z-10">
             <div>
               <p className="text-[8px] font-mono text-neutral-500 break-all mb-1">{registrationUrl}</p>
               <p className="text-[10px] text-neutral-300 font-medium leading-tight italic">
                 Schüler können hier Lehrerdaten & Bilder einsenden.
               </p>
             </div>
             
             <div className="pt-2 flex flex-col gap-2">
               <Link href="/sammelkarten-manager/print-form" className="w-full">
                 <Button variant="outline" className="w-full h-9 rounded-sm uppercase font-black tracking-widest text-[9px] gap-2 border-white/20 bg-white/5 text-white hover:bg-white/20 hover:text-white transition-all">
                    <FileText className="w-3.5 h-3.5" /> Analoges Formular (Papier)
                 </Button>
               </Link>
               
               <Button 
                 onClick={() => {
                   if (navigator.share) {
                     navigator.share({
                       title: 'ABI Planer Lehrer Anmeldung',
                       url: registrationUrl
                     });
                   } else {
                     navigator.clipboard.writeText(registrationUrl);
                     alert('Link kopiert!');
                   }
                 }} 
                 variant="ghost" 
                 className="w-full h-8 rounded-sm uppercase font-black tracking-widest text-[8px] gap-2 text-neutral-400 hover:text-white"
               >
                 Link teilen / kopieren
               </Button>
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
