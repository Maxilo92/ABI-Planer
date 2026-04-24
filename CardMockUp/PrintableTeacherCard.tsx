'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  BarChart3, 
  Lightbulb, 
  BookX, 
  Palmtree,
  Star
} from 'lucide-react';
import { CardData } from '@/types/cards';
import { cn } from '@/lib/utils';
// @ts-ignore
import SchoolLogo from './school_logo/logo-beispiel.svg';
// @ts-ignore
import HoloBackground from './Background-Holographic.jpg';

interface PrintableTeacherCardProps {
  data: CardData;
  details: {
    title: string;
    firstName: string;
    lastName: string;
    subjects: string[];
    quote: string;
    stats: {
      punctuality: string;
      difficulty: number; // 1-10
      funFact: string;
      unpopularSubject: string;
      leisure: string;
    };
  };
  imageSettings?: {
    scale: number;
    x: number;
    y: number;
  };
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',    // slate-400
  rare: '#10b981',      // emerald-500
  epic: '#a855f7',      // purple-500
  mythic: '#ef4444',    // red-500
  legendary: '#f59e0b', // amber-500
  iconic: '#1f2937',    // dark gray
};

const lightenColor = (hex: string, amount: number) => {
  const normalized = (hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex;

  const toChannel = (start: number) => parseInt(normalized.slice(start, start + 2), 16);
  const brighten = (value: number) => Math.max(0, Math.min(255, Math.floor(value + (255 - value) * amount)));

  const r = brighten(toChannel(0)).toString(16).padStart(2, '0');
  const g = brighten(toChannel(2)).toString(16).padStart(2, '0');
  const b = brighten(toChannel(4)).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

export const PrintableTeacherCard: React.FC<PrintableTeacherCardProps> = ({
  data,
  details,
  imageSettings,
  isFlipped: isFlippedExternal,
  onFlip,
  className
}) => {
  const [isFlippedInternal, setIsFlippedInternal] = useState(false);
  
  const isFlipped = isFlippedExternal !== undefined ? isFlippedExternal : isFlippedInternal;
  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    } else {
      setIsFlippedInternal(!isFlippedInternal);
    }
  };

  const rarity = data.rarity || 'common';
  const variant = data.variant || 'normal';
  const isHoloVariant = variant === 'holo' || variant === 'black_shiny_holo';
  const isSeltenVariant = variant === 'selten';
  
  const rarityColor = RARITY_COLORS[rarity] || '#94a3b8';
  const tone2 = lightenColor(rarityColor, 0.3);

  // Helper for safe image source
  const getImgSrc = (src: any) => {
    if (!src) return '';
    return typeof src === 'string' ? src : src.src;
  };

  return (
    <div 
      className={cn(
        "relative w-[63mm] h-[88mm] perspective-1000 cursor-pointer group select-none print:shadow-none print:cursor-default print:border-none",
        className
      )}
      onClick={handleFlip}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-shadow duration-500 group-hover:shadow-2xl rounded-[1mm] print:!transform-none print:[transform-style:flat]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* FRONT SIDE */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-[1mm] overflow-hidden flex flex-col bg-white border-[2.5mm] border-black/5 print:border-black/10 print:[backface-visibility:visible] [print-color-adjust:exact]",
            isFlipped && "print:hidden"
          )}
          style={{ transform: 'translateZ(1px)' }}
        >
          {/* BACKGROUND LAYER */}
          <div className="absolute inset-0">
            {isHoloVariant ? (
              /* Holo Background Image with Rarity Color Overlay */
              <div className="absolute inset-0">
                <img 
                  src={getImgSrc(HoloBackground)} 
                  className="w-full h-full object-cover opacity-100"
                  alt="Holo Effect"
                />
                <div 
                  className="absolute inset-0 opacity-40 mix-blend-color" 
                  style={{ backgroundColor: rarityColor }}
                />
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
              </div>
            ) : isSeltenVariant ? (
              /* Sunburst Effect with Rarity Colors */
              <div 
                className="absolute inset-0 opacity-100" 
                style={{ 
                  backgroundColor: rarityColor,
                  backgroundImage: `
                    repeating-conic-gradient(
                      from 0deg at 50% 50%,
                      ${rarityColor} 0deg 15deg,
                      ${tone2} 15deg 30deg
                    )`
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent)] mix-blend-overlay" />
              </div>
            ) : (
              /* Standard 3-Tone Vertical Gradient */
              <div 
                className="absolute inset-0" 
                style={{ 
                  backgroundImage: `linear-gradient(to right, ${rarityColor} 0%, ${rarityColor} 20%, ${tone2} 35%, ${tone2} 65%, ${rarityColor} 80%, ${rarityColor} 100%)` 
                }}
              />
            )}
          </div>

          {/* Main Image */}
          {data.imageUrl && (
            <div className="absolute inset-0 overflow-hidden">
              <img 
                src={data.imageUrl} 
                alt={data.name} 
                className="w-full h-full object-cover [print-color-adjust:exact]"
                style={{
                  transform: `scale(${imageSettings?.scale || 1}) translate(${imageSettings?.x || 0}%, ${imageSettings?.y || 0}%)`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          )}

          {/* Large Outline Number - Symmetrical Corner Position */}
          <div className="absolute top-1 right-1 flex items-start justify-end pointer-events-none z-20">
            <span 
              className="text-[52px] font-black text-transparent rotate-90 opacity-70 select-none translate-x-[16%] translate-y-[10%] [print-color-adjust:exact] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
              style={{ 
                WebkitTextStroke: '1.5px white',
                fontFamily: 'sans-serif'
              }}
            >
              {data.cardNumber}
            </span>
          </div>

          {/* Text Block */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-0 max-w-[60%] text-left">
            <p className="text-[7.5px] font-bold text-white tracking-widest opacity-70 uppercase leading-none">
              {details.subjects.join('/')}
            </p>
            <h2 className="text-[18px] font-black text-white leading-[0.95] tracking-tighter uppercase drop-shadow-md mt-1 text-left">
              {details.title}<br />
              {details.lastName}
            </h2>
            
            {/* Variant Label (Holo/Selten) - Based on variant prop */}
            {(isHoloVariant || isSeltenVariant) && (
              <p className="text-[9px] font-black text-white mt-1.5 uppercase tracking-tighter drop-shadow-sm opacity-80">
                {isHoloVariant ? 'Holo' : 'Selten'}
              </p>
            )}
          </div>

          {/* Quote Box */}
          <div className="mt-auto mb-3.5 mx-4 relative z-10">
            <div className="absolute inset-0 bg-black/25 backdrop-blur-md rounded-lg border border-white/10 shadow-xl print:bg-black/40 print:backdrop-blur-none" />
            <div className="relative p-3 min-h-[50px] flex items-center justify-center">
              <p className="text-white text-[10px] font-semibold leading-tight text-center drop-shadow-sm px-1 italic">
                {details.quote}
              </p>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-[1mm] overflow-hidden bg-white border border-neutral-200 flex flex-col p-4 print:[backface-visibility:visible] [print-color-adjust:exact]",
            !isFlipped && "print:hidden"
          )}
          style={{ 
            transform: 'rotateY(180deg) translateZ(1px)',
            // Fix mirroring on print: override transform if in print mode (handled via CSS class in page)
          }}
          data-slot="back-side"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                {details.firstName}
              </h3>
              <h2 className="text-lg font-black text-neutral-900 leading-tight uppercase">
                {details.lastName}
              </h2>
            </div>
            <img 
              src={getImgSrc(SchoolLogo)} 
              alt="School Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>

          {/* Stats List */}
          <div className="flex-1 space-y-3 overflow-hidden">
            {/* Pünktlichkeit */}
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">Pünktlichkeit</p>
                <p className="text-xs font-semibold text-neutral-800">{details.stats.punctuality}</p>
              </div>
            </div>

            {/* Schwierigkeit */}
            <div className="flex items-start gap-2">
              <BarChart3 className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div className="w-full">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-1">Schwierigkeit der Arbeiten</p>
                <p className="text-base font-black text-neutral-800 tracking-tighter">
                  {details.stats.difficulty} <span className="text-neutral-300 font-bold ml-1">/ 10</span>
                </p>
              </div>
            </div>

            {/* Fun Fact */}
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">Fun Fact</p>
                <p className="text-[11px] font-medium text-neutral-700 leading-snug">{details.stats.funFact}</p>
              </div>
            </div>

            {/* Unbeliebtestes Fach */}
            <div className="flex items-start gap-2">
              <BookX className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">Unbeliebtestes Fach</p>
                <p className="text-xs font-semibold text-neutral-800">{details.stats.unpopularSubject}</p>
              </div>
            </div>

            {/* Freizeit */}
            <div className="flex items-start gap-2">
              <Palmtree className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">Freizeit</p>
                <p className="text-xs font-semibold text-neutral-800">{details.stats.leisure}</p>
              </div>
            </div>
          </div>

          {/* Footer / Branding */}
          <div className="mt-auto pt-2 border-t border-neutral-100 flex justify-between items-center">
            <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-[0.2em]">ABI Planer TCG</span>
            <div className="flex gap-1">
              {[...Array(rarity === 'legendary' || rarity === 'iconic' ? 3 : (rarity === 'rare' || rarity === 'epic' ? 2 : 1))].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-neutral-800 text-neutral-800" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
