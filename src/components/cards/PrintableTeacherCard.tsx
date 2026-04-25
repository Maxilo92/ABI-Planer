'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  BarChart3, 
  Lightbulb, 
  BookX, 
  Palmtree,
  Circle,
  Triangle,
  Square,
  Octagon,
  Star,
  Gem
} from 'lucide-react';
import { CardData } from '@/types/cards';
import { cn } from '@/lib/utils';
// Asset paths from public directory
const SchoolLogo = '/images/cards/hgr-logo.png';
const HoloBackground = '/images/cards/background-holographic.jpg';
const IconicHoloBackground = '/images/cards/iconic-holo.jpg';
const GoldFoil = '/images/cards/goldfolie.jpg';

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
    rotate?: number;
  };
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#cbd5e1',    // slate-300 (much lighter for better contrast)
  rare: '#059669',      // emerald-600
  epic: '#7c3aed',      // violet-600
  mythic: '#dc2626',    // red-600
  legendary: '#fbbf24', // amber-400 (more golden than amber-600)
  iconic: '#1e293b',    // slate-800 (lighter than 950 to avoid being 'too dark')
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

const darkenColor = (hex: string, amount: number) => {
  const normalized = (hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex;

  const toChannel = (start: number) => parseInt(normalized.slice(start, start + 2), 16);
  const darken = (value: number) => Math.max(0, Math.min(255, Math.floor(value * (1 - amount))));

  const r = darken(toChannel(0)).toString(16).padStart(2, '0');
  const g = darken(toChannel(2)).toString(16).padStart(2, '0');
  const b = darken(toChannel(4)).toString(16).padStart(2, '0');
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
  const isIconic = rarity === 'iconic';
  const isLegendary = rarity === 'legendary';
  
  const rarityColor = RARITY_COLORS[rarity] || '#cbd5e1';
  const colorLighter = lightenColor(rarityColor, 0.4);
  const colorDarker = darkenColor(rarityColor, 0.3);

  // Special Gold accents for 'selten' variant
  const goldColor = '#fbbf24'; // Amber 400
  const goldDarker = '#b45309'; // Amber 700

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
                  src={isLegendary ? GoldFoil : (isIconic ? IconicHoloBackground : HoloBackground)} 
                  className="w-full h-full object-cover opacity-100"
                  alt="Holo Effect"
                />
                {!isIconic && !isLegendary && (
                  <>
                    <div 
                      className="absolute inset-0 opacity-50 mix-blend-color" 
                      style={{ backgroundColor: rarityColor }}
                    />
                    <div 
                      className="absolute inset-0 opacity-30 mix-blend-overlay" 
                      style={{ backgroundColor: rarityColor }}
                    />
                  </>
                )}
                {/* Special Overlay for Legendary Holo Foil to make it pop */}
                {isLegendary && (
                  <>
                    <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-amber-500/5 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(0,0,0,0.2)_100%)] mix-blend-multiply" />
                  </>
                )}
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
              </div>
            ) : isSeltenVariant ? (

              /* Premium Sunburst Effect with Multi-layered Gradients and Gold Accents */
              <div 
                className="absolute inset-0 opacity-100" 
                style={{ 
                  backgroundColor: isLegendary ? goldColor : rarityColor,
                  backgroundImage: `
                    repeating-conic-gradient(
                      from 0deg at 50% 50%,
                      ${isLegendary ? goldDarker : colorDarker} 0deg 10deg,
                      ${isLegendary ? goldColor : rarityColor} 10deg 20deg
                    )`
                }}
              >
                {/* Golden Shine Overlay for 'selten' variant */}
                <div 
                  className="absolute inset-0 mix-blend-overlay opacity-50"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${goldColor} 0%, transparent 70%)`
                  }}
                />
                {/* Secondary Sunburst Layer for more detail */}
                <div 
                  className="absolute inset-0 opacity-30" 
                  style={{ 
                    backgroundImage: `
                      repeating-conic-gradient(
                        from 5deg at 50% 50%,
                        transparent 0deg 20deg,
                        rgba(255,255,255,0.2) 20deg 25deg,
                        transparent 25deg 40deg
                      )`
                  }}
                />
                {/* Radial Glow and Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.6)_0%,transparent_70%)] mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(0,0,0,0.4)_100%)] mix-blend-multiply" />
                {/* Subtle Hexagon Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" 
                     style={{ 
                       backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h2v7.5L28 15v15l-12.98 7.5V45h-2v-7.5L0 30V15zm14 7.5L25 16.15v12.7L14 35.15l-11-6.3V16.15L14 22.5z'/%3E%3C/svg%3E")` 
                     }} 
                />
              </div>
            ) : isIconic ? (
              /* Special Iconic Background: Black & Gold Premium */
              <div 
                className="absolute inset-0" 
                style={{ 
                  backgroundColor: '#0f172a',
                  backgroundImage: `
                    radial-gradient(at 50% 0%, #1e293b 0%, transparent 70%),
                    radial-gradient(at 0% 100%, #1e293b 0%, transparent 50%),
                    radial-gradient(at 100% 100%, #020617 0%, transparent 50%)
                  `
                }}
              >
                {/* Golden Radial Aura */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.15)_0%,transparent_80%)] mix-blend-screen" />
                {/* Golden Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" 
                     style={{ 
                       backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23fbbf24' fill-opacity='1' d='M0 0h20v20H0V0zm10 17.32L18.66 12.32 10 7.32 1.34 12.32 10 17.32zM20 20h20v20H20V20zm10 17.32L38.66 32.32 30 27.32 21.34 32.32 30 17.32z'/%3E%3C/svg%3E")` 
                     }} 
                />
                {/* Inner Golden Shine Border */}
                <div className="absolute inset-[1mm] border border-amber-500/20 rounded-[0.5mm] pointer-events-none" />
                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.6)_100%)] mix-blend-multiply" />
              </div>
            ) : (
              /* Premium Standard Background with Mesh-like Gradient and Texture */
              <div 
                className="absolute inset-0" 
                style={{ 
                  backgroundColor: rarityColor,
                  backgroundImage: `
                    radial-gradient(at 0% 0%, ${colorLighter} 0px, transparent 50%),
                    radial-gradient(at 100% 0%, ${rarityColor} 0px, transparent 50%),
                    radial-gradient(at 100% 100%, ${colorDarker} 0px, transparent 50%),
                    radial-gradient(at 0% 100%, ${rarityColor} 0px, transparent 50%),
                    linear-gradient(135deg, ${rarityColor} 0%, ${colorDarker} 100%)
                  `
                }}
              >
                {/* Subtle Diagonal Lines Pattern */}
                <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay" 
                     style={{ 
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)` 
                     }} 
                />
                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(0,0,0,0.3)_100%)] mix-blend-multiply" />
                {/* Top Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
              </div>
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
                  transform: `scale(${imageSettings?.scale || 1}) translate(${imageSettings?.x || 0}%, ${imageSettings?.y || 0}%) rotate(${imageSettings?.rotate || 0}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          )}

          {/* Large Outline Number - Symmetrical Corner Position */}
          <div className="absolute top-2 right-2 flex items-start justify-end pointer-events-none z-20">
            <span 
              className="text-[32px] font-black text-transparent rotate-90 opacity-60 select-none translate-y-[10%] [print-color-adjust:exact] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
              style={{ 
                WebkitTextStroke: '1px white',
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
            <h2 className="text-[18px] font-black text-white leading-[1.1] tracking-tighter uppercase drop-shadow-md mt-1 text-left">
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
              {[...Array(isHoloVariant ? 3 : (isSeltenVariant ? 2 : 1))].map((_, i) => {
                const iconProps = { 
                  className: "w-2.5 h-2.5 fill-neutral-800 text-neutral-800",
                  strokeWidth: 2.5
                };
                
                switch(rarity) {
                  case 'common': return <Circle key={i} {...iconProps} />;
                  case 'rare': return <Triangle key={i} {...iconProps} />;
                  case 'epic': return <Square key={i} {...iconProps} />;
                  case 'mythic': return <Octagon key={i} {...iconProps} />;
                  case 'legendary': return <Star key={i} {...iconProps} />;
                  case 'iconic': return <Gem key={i} {...iconProps} />;
                  default: return <Circle key={i} {...iconProps} />;
                }
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
