'use client';

import React, { useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useManager } from '@/components/sammelkarten/SammelkartenManagerContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Wand2, Grid as GridIcon, Table as TableIcon, Loader2, Printer } from 'lucide-react';
import { PrintableTeacherCard } from '../../../../CardMockUp/PrintableTeacherCard';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'mythic', label: 'Mythic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'iconic', label: 'Iconic' },
];

export default function PoolPage() {
  const router = useRouter();
  const { approvedCards, loading, setFormData, setActiveDraftId, setSinglePrintCardId } = useManager();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateApproved = async (id: string, field: string, value: any) => {
    setUpdatingId(id);
    try { await updateDoc(doc(db, 'custom_card_designs', id), { [`data.${field}`]: value }); } 
    catch (err) { console.error(err); } 
    finally { setUpdatingId(null); }
  };

  const handleDeleteCard = async (dbId: string) => {
    if (confirm('Löschen?')) await deleteDoc(doc(db, 'custom_card_designs', dbId));
  };

  const loadToEditor = (card: any) => {
    setFormData({
      ...card.details,
      title: card.details?.title || 'Herr',
      rarity: card.data?.rarity || 'common',
      cardNumber: card.data?.cardNumber || '001',
      imageUrl: card.data?.imageUrl || '',
      imageScale: card.imageSettings?.scale || 1,
      imageX: card.imageSettings?.x || 0,
      imageY: card.imageSettings?.y || 0,
      imageRotate: card.imageSettings?.rotate || 0
    });
    setActiveDraftId(card.dbId);
    router.push('/sammelkarten-manager/editor');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-neutral-300" /></div>;

  // Print Logic for PDF
  const allPrintItems = approvedCards.flatMap(t => [{ ...t, isBack: false }, { ...t, isBack: true }]);
  const printPages = [];
  for (let i = 0; i < allPrintItems.length; i += 9) {
    printPages.push(allPrintItems.slice(i, i + 9));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
         <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800">Gezielte Auswahl & Verwaltung</h3>
         <div className="flex bg-neutral-100 p-1 rounded-md border border-neutral-200">
            <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400 hover:text-neutral-600")}><GridIcon className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('table')} className={cn("p-1.5 rounded transition-all", viewMode === 'table' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400 hover:text-neutral-600")}><TableIcon className="w-4 h-4" /></button>
         </div>
      </div>

      {viewMode === 'table' ? (
        <Card className="rounded-md border border-neutral-200 overflow-hidden bg-white print:hidden">
           <Table>
             <TableHeader className="bg-neutral-50">
               <TableRow>
                 <TableHead className="px-4 h-10 text-[9px] font-black uppercase">Nachname</TableHead>
                 <TableHead className="px-4 h-10 text-[9px] font-black uppercase">Vorname</TableHead>
                 <TableHead className="h-10 text-[9px] font-black uppercase">Rarity Class</TableHead>
                 <TableHead className="px-4 h-10 text-right text-[9px] font-black uppercase">Aktion</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {approvedCards.map((card) => (
                 <TableRow key={card.dbId} className="hover:bg-neutral-50/50">
                   <TableCell className="px-4 py-2 font-bold text-xs uppercase">{card.details?.lastName || (card.data?.name ? card.data.name.split(' ').pop() : '???')}</TableCell>
                   <TableCell className="px-4 py-2 text-xs uppercase text-neutral-500">{card.details?.firstName || (card.data?.name ? card.data.name.split(' ').slice(0, -1).join(' ') : '')}</TableCell>
                   <TableCell>
                     <select value={card.data.rarity} onChange={(e) => handleUpdateApproved(card.dbId, 'rarity', e.target.value)} className="bg-transparent border-none font-bold uppercase text-[9px] focus:ring-0 cursor-pointer outline-none">
                       {RARITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                     </select>
                   </TableCell>
                   <TableCell className="px-4 text-right">
                      <div className="flex justify-end gap-1">
                         <Button variant="ghost" onClick={() => setSinglePrintCardId(card.dbId)} className="h-7 w-7 text-neutral-300 hover:text-primary"><Printer className="w-3.5 h-3.5" /></Button>
                         <Button variant="ghost" onClick={() => loadToEditor(card)} className="h-7 w-7 text-neutral-300 hover:text-blue-500"><Wand2 className="w-3.5 h-3.5" /></Button>
                         <Button variant="ghost" onClick={() => handleDeleteCard(card.dbId)} className="h-7 w-7 text-neutral-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-24 gap-x-16 justify-items-center print:hidden">
          {approvedCards.map((t_card, idx) => (
            <div key={t_card.dbId || idx} className="flex flex-col items-center gap-6 group relative hover:z-50">
              <div className="absolute -top-3 -right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-30">
                 <button onClick={() => setSinglePrintCardId(t_card.dbId)} className="w-8 h-8 bg-white text-neutral-800 rounded-full flex items-center justify-center shadow-xl border-2 border-white hover:scale-110 hover:bg-neutral-50"><Printer className="w-4 h-4" /></button>
                 <button onClick={() => loadToEditor(t_card)} className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white hover:scale-110 hover:bg-blue-600"><Wand2 className="w-4 h-4" /></button>
                 <button onClick={() => handleDeleteCard(t_card.dbId)} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white hover:scale-110 hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[2mm] overflow-hidden"><PrintableTeacherCard data={t_card.data} details={t_card.details} imageSettings={t_card.imageSettings} /></div>
              <div className="text-center space-y-1"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-neutral-800">{t_card.details.lastName}</p><p className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">{t_card.data.rarity}</p></div>
            </div>
          ))}
        </div>
      )}
      
      {/* Hidden Print Area */}
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
    </div>
  );
}
