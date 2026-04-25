'use client';

import React from 'react';
import { useManager } from '@/components/sammelkarten/SammelkartenManagerContext';
import { PrintableTeacherCard } from '../../../../CardMockUp/PrintableTeacherCard';

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

export default function MatrixPage() {
  const { approvedCards } = useManager();
  const showcaseTeacher = approvedCards.length > 0 ? approvedCards[0] : null;

  if (!showcaseTeacher) {
    return (
      <div className="p-20 border border-dashed rounded-md text-center bg-neutral-50 print:hidden">
        <p className="text-sm font-bold text-neutral-400 uppercase">Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-500 print:hidden">
      {RARITY_OPTIONS.map(r => (
        <div key={r.value} className="flex flex-col lg:flex-row gap-12 items-center lg:items-start border-b border-neutral-100 pb-12 last:border-0">
          <div className="w-[100px] font-black uppercase text-[10px] tracking-widest text-neutral-400 lg:mt-10">{r.label}</div>
          <div className="flex flex-wrap gap-8 justify-center lg:justify-start flex-1">
            {VARIANT_OPTIONS.map(v => (
              <div key={v.value} className="scale-75 xl:scale-90 origin-top flex flex-col items-center gap-4 hover:scale-95 transition-transform duration-300">
                <PrintableTeacherCard 
                  data={{ ...showcaseTeacher.data, rarity: r.value as any, variant: v.value as any }} 
                  details={showcaseTeacher.details} 
                  imageSettings={showcaseTeacher.imageSettings || {
                    scale: 1,
                    x: 0,
                    y: 0,
                    rotate: 0
                  }}
                />
                <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-tight">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
