'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Zap } from 'lucide-react';
import { CardData, CardStyle } from '@/types/cards';
import { RaritySymbol } from './RaritySymbol';
import { CardEffectOverlay } from './CardEffectOverlay';
import { cn } from '@/lib/utils';

interface TeacherCardProps {
  data: CardData;
  className?: string;
  styleVariant?: CardStyle;
  isFlippedExternally?: boolean;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ 
  data, 
  className, 
  styleVariant = 'soft-glass',
  isFlippedExternally 
}) => {
  const [isFlippedInternally, setIsFlippedInternally] = useState(false);
  const isFlipped = isFlippedExternally !== undefined ? isFlippedExternally : isFlippedInternally;

  const isBlckShiny = data.variant === 'blckshiny';
  const isGlass = data.variant.startsWith('glass-') || data.variant === 'shiny-v2';

  const getStyleClasses = () => {
    switch (styleVariant) {
      case 'modern-flat':
        return {
          card: cn(
            "transition-all",
            !isGlass && !isBlckShiny && "border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] border-[3px]",
            isBlckShiny && "shadow-[0_0_20px_rgba(255,255,255,0.15)] border-white/20 border-[3px]",
            isGlass && "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-white/90"
          ),
          icon: cn(
            "bg-white border-[3px] border-black p-3.5 rounded-2xl -rotate-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
            isBlckShiny && "bg-neutral-800 border-white/20 shadow-none",
            isGlass && "bg-white/40 border-white/30 backdrop-blur-md shadow-none"
          ),
          header: (isBlckShiny || isGlass) ? "text-white" : "text-black",
          text: cn(
            "font-sans uppercase font-black tracking-tighter text-4xl leading-[0.85]",
            (isBlckShiny || isGlass) ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-black"
          ),
          border: "", // already handled in card
          bgOverlay: isBlckShiny ? "bg-neutral-950" : (isGlass ? "bg-transparent" : "bg-white/5"),
          numberTag: cn(
            "px-2 py-0.5 text-[9px] font-black rounded-xs transform rotate-1",
            (isBlckShiny || isGlass) ? "bg-white text-black" : "bg-black text-white"
          ),
          numberPos: "bottom-7 left-7",
        };
      
      default:
        return {
          card: "border-white/40 shadow-2xl backdrop-blur-xl border-8",
          icon: "bg-white/30 p-5 rounded-full",
          header: "text-white",
          text: "text-white font-sans font-black",
          border: "border-8",
          bgOverlay: "bg-white/10",
          numberTag: "bg-white/20 text-white px-2 py-0.5 text-[8px] font-black rounded-full",
          numberPos: "top-7 right-7",
        };
    }
  };

  const styleClasses = getStyleClasses();

  return (
    <div 
      className={cn("relative w-64 aspect-[2.5/3.5] cursor-pointer perspective-1000", className)}
      onClick={() => setIsFlippedInternally(!isFlippedInternally)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative will-change-transform"
      >
        {/* FRONT SIDE */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-[2.5rem] p-7 flex flex-col items-center overflow-hidden transition-all duration-300",
            styleClasses.card,
            styleClasses.border
          )}
          style={{ 
            backgroundColor: isBlckShiny ? '#0a0a0a' : (isGlass ? `${data.color}99` : data.color) 
          }}
        >
          <CardEffectOverlay variant={data.variant} tintColor={data.color} />

          <div className={cn("absolute inset-0 pointer-events-none", styleClasses.bgOverlay)} />
          
          <div className={cn("relative z-30 mb-4", styleClasses.icon)}>
            <GraduationCap size={44} className={styleClasses.header} />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center relative z-30 w-full px-2">
            <h2 className={cn("drop-shadow-sm", styleClasses.text)}>
              {data.name}
            </h2>
          </div>

          <div className={cn("absolute z-30", styleClasses.numberPos)}>
            <div className={styleClasses.numberTag}>
              {data.cardNumber}
            </div>
          </div>

          <div className="absolute bottom-7 right-7 z-30">
            <RaritySymbol 
              rarity={data.rarity} 
              variant={data.variant}
              size={36} 
              color={isBlckShiny ? 'white' : (styleVariant === 'modern-flat' ? 'black' : 'white')} 
            />
          </div>
        </div>

        {/* BACK SIDE */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-[2.5rem] p-8 flex flex-col items-center justify-center overflow-hidden rotate-y-180",
            isGlass ? styleClasses.card : "border-8 border-white/20 bg-neutral-950"
          )}
          style={isGlass ? { backgroundColor: `${data.color}99` } : undefined}
        >
          {isGlass && <CardEffectOverlay variant={data.variant} tintColor={data.color} />}
          
          <div className="relative z-10 flex flex-col items-center">
            <Zap size={56} className="text-white mb-4" />
            <div className="text-white font-black tracking-[0.3em] text-sm uppercase opacity-80">
               ABI Planer
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
